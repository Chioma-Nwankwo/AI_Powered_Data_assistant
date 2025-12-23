import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { action, data } = await req.json();
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');

    if (!openaiApiKey) {
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
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

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openaiApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              { role: 'system', content: 'You are a data analysis expert. Provide clear, concise insights about datasets.' },
              { role: 'user', content: prompt }
            ],
            temperature: 0.7,
            max_tokens: 500,
          }),
        });

        const result = await response.json();
        
        if (!response.ok) {
          throw new Error(result.error?.message || 'OpenAI API error');
        }

        return new Response(
          JSON.stringify({ 
            summary: result.choices[0].message.content 
          }),
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

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openaiApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              { role: 'system', content: 'You are a data analyst. Generate relevant questions about datasets. Return only valid JSON arrays.' },
              { role: 'user', content: prompt }
            ],
            temperature: 0.8,
            max_tokens: 300,
          }),
        });

        const result = await response.json();
        
        if (!response.ok) {
          throw new Error(result.error?.message || 'OpenAI API error');
        }

        let questions;
        try {
          questions = JSON.parse(result.choices[0].message.content);
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
        const { question, columns, sampleData, fullDataSummary } = data;
        
        const prompt = `Answer this question about the dataset: "${question}"

Dataset Context:
${fullDataSummary}

Available Columns: ${columns.join(', ')}
Sample Data:
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

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openaiApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              { 
                role: 'system', 
                content: 'You are a data analyst. Answer questions about datasets clearly and suggest visualizations when appropriate. Always return valid JSON.' 
              },
              { role: 'user', content: prompt }
            ],
            temperature: 0.7,
            max_tokens: 800,
          }),
        });

        const result = await response.json();
        
        if (!response.ok) {
          throw new Error(result.error?.message || 'OpenAI API error');
        }

        let parsedResponse;
        try {
          parsedResponse = JSON.parse(result.choices[0].message.content);
        } catch {
          parsedResponse = {
            answer: result.choices[0].message.content,
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