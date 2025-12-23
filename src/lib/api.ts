import { supabase } from './supabase';

const EDGE_FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-data-assistant`;

export async function callAIFunction(action: string, data: any) {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(EDGE_FUNCTION_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ action, data }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to call AI function');
  }

  return response.json();
}

export async function analyzeDataFile(columns: string[], sampleRows: any[], rowCount: number) {
  return callAIFunction('analyze-data', { columns, sampleRows, rowCount });
}

export async function generateSuggestedQuestions(columns: string[], summary: string) {
  return callAIFunction('generate-questions', { columns, summary });
}

export async function queryData(
  question: string,
  columns: string[],
  sampleData: any[],
  fullDataSummary: string
) {
  return callAIFunction('query-data', {
    question,
    columns,
    sampleData,
    fullDataSummary,
  });
}
