import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Loader2, Lightbulb } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { queryData } from '../lib/api';
import { getSampleRows } from '../lib/fileUtils';
import ChartDisplay from './ChartDisplay';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  chart_data?: any;
  created_at: string;
}

interface ChatInterfaceProps {
  file: {
    id: string;
    file_name: string;
    column_names: string[];
    summary: string | null;
  };
  fileData: any;
  suggestedQuestions: string[];
}

export default function ChatInterface({ file, fileData, suggestedQuestions }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadOrCreateConversation();
  }, [file.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadOrCreateConversation = async () => {
    const { data: existingConv } = await supabase
      .from('conversations')
      .select('*')
      .eq('file_id', file.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingConv) {
      setConversationId(existingConv.id);
      loadMessages(existingConv.id);
    } else {
      const { data: newConv } = await supabase
        .from('conversations')
        .insert({
          user_id: (await supabase.auth.getUser()).data.user!.id,
          file_id: file.id,
          title: `Chat about ${file.file_name}`,
        })
        .select()
        .single();

      if (newConv) {
        setConversationId(newConv.id);
      }
    }
  };

  const loadMessages = async (convId: string) => {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', convId)
      .order('created_at', { ascending: true });

    if (data) {
      setMessages(data);
    }
  };

  const handleSendMessage = async (messageText?: string) => {
    const question = messageText || input;
    if (!question.trim() || !conversationId || loading) return;

    setInput('');
    setLoading(true);

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: question,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);

    await supabase.from('messages').insert({
      conversation_id: conversationId,
      role: 'user',
      content: question,
    });

    try {
      const sampleData = getSampleRows(fileData?.rows || [], 20);
      const response = await queryData(
        question,
        file.column_names,
        sampleData,
        file.summary || ''
      );

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: response.answer,
        chart_data: response.chartData,
        created_at: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      await supabase.from('messages').insert({
        conversation_id: conversationId,
        role: 'assistant',
        content: response.answer,
        chart_data: response.chartData,
      });
    } catch (error: any) {
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `Sorry, I encountered an error: ${error.message}`,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="flex-1 overflow-auto p-6 space-y-4">
        {messages.length === 0 && suggestedQuestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Lightbulb className="w-4 h-4" />
              <span className="font-medium">Suggested questions:</span>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {suggestedQuestions.map((question, index) => (
                <motion.button
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.01 }}
                  onClick={() => handleSendMessage(question)}
                  className="text-left p-4 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors"
                >
                  <p className="text-sm text-gray-700">{question}</p>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        <AnimatePresence>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-3xl rounded-lg px-4 py-3 ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                {message.chart_data && (
                  <div className="mt-4">
                    <ChartDisplay chartData={message.chart_data} />
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start"
          >
            <div className="bg-gray-100 rounded-lg px-4 py-3">
              <Loader2 className="w-5 h-5 animate-spin text-gray-600" />
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-gray-200 p-4">
        <div className="flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask a question about your data..."
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={loading}
          />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleSendMessage()}
            disabled={loading || !input.trim()}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            Send
          </motion.button>
        </div>
      </div>
    </div>
  );
}
