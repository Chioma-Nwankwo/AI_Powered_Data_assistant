import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const GEMINI_MODEL = "gemini-3.6-flash";

async function callGemini(
  apiKey: string,
  systemInstruction: string,
  prompt: string,
  jsonResponse: boolean
) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
    {
      method: "POST",
      headers: {
        "x-goog-api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemInstruction }] },
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 4096,
          ...(jsonResponse ? { responseMimeType: "application/json" } : {}),
        },
      }),
    }
  );

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error?.message || "Gemini API error");
  }

  const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error("Gemini returned no content");
  }

  return text;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { action, data } = await req.json();
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');

    if (!geminiApiKey) {
      return new Response(
        JSON.stringify({ error: 'Gemini API key not configured' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    switch (action) {
      case 'analyze-data': {
        const { columns, sampleRows, rowCount } = data;

        const prompt = `Analyze this dataset and provide:
1. A brief summary (2-3 sentences) of what this data contains
2. Key insights about the data structure
3. Any notable patterns or interesting findings

Dataset Info:
- Total Rows: ${rowCount}
- Columns: ${columns.join(', ')}
- Sample Data (first few rows):
${JSON.stringify(sampleRows, null, 2)}

Provide a concise, informative summary.`;

        const summary = await callGemini(
          geminiApiKey,
          'You are a data analysis expert. Provide clear, concise insights about datasets.',
          prompt,
          false
        );

        return new Response(
          JSON.stringify({ summary }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      case 'generate-questions': {
        const { columns, summary } = data;

        const prompt = `Based on this dataset, generate 5 insightful questions that a user might want to ask:

Dataset Summary: ${summary}
Available Columns: ${columns.join(', ')}

Generate questions that:
- Explore trends and patterns
- Compare different aspects of the data
- Seek specific insights
- Are answerable from the available columns

Return ONLY a JSON array of strings (the questions), nothing else.`;

        const text = await callGemini(
          geminiApiKey,
          'You are a data analyst. Generate relevant questions about datasets. Return only valid JSON arrays.',
          prompt,
          true
        );

        let questions;
        try {
          questions = JSON.parse(text);
        } catch {
          questions = [
            "What are the main trends in this data?",
            "What is the distribution of values?",
            "Are there any outliers or anomalies?",
            "What correlations exist between columns?",
            "What insights can we derive from this data?"
          ];
        }

        return new Response(
          JSON.stringify({ questions }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      case 'query-data': {
        const { question, columns, sampleData, fullDataSummary, columnStats, rowCount } = data;

        const prompt = `Answer this question about the dataset: "${question}"

Dataset Context:
${fullDataSummary}

Available Columns: ${columns.join(', ')}
Total Rows: ${rowCount}

Exact per-column statistics computed from the FULL dataset (not a sample) — use these numbers directly for any question about missing values, counts, uniques, min/max, or averages, rather than estimating from the sample below:
${JSON.stringify(columnStats, null, 2)}

Sample Data (first rows, for context on values/format only — not for counting):
${JSON.stringify(sampleData, null, 2)}

Provide:
1. A clear, direct answer to the question
2. If applicable, suggest a visualization type (bar, line, pie, scatter, area) and provide chart data in this exact format:
{
  "type": "bar",
  "data": [{"name": "Category1", "value": 100}, ...]
}

Return your response as JSON with this structure:
{
  "answer": "your detailed answer here",
  "chartData": {"type": "bar", "data": [...]} or null if no chart needed
}`;

        const text = await callGemini(
          geminiApiKey,
          'You are a data analyst. Answer questions about datasets clearly and suggest visualizations when appropriate. Always return valid JSON.',
          prompt,
          true
        );

        let parsedResponse;
        try {
          parsedResponse = JSON.parse(text);
        } catch {
          parsedResponse = {
            answer: text,
            chartData: null
          };
        }

        return new Response(
          JSON.stringify(parsedResponse),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
    }
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
