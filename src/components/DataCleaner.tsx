import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eraser, Download, Loader2, Sparkles, ChevronDown } from 'lucide-react';
import { planCleaning } from '../lib/api';
import { getColumnStats, applyCleaningOperations, rowsToCSV, CleaningOperation } from '../lib/fileUtils';

interface DataCleanerProps {
  fileName: string;
  columns: string[];
  rows: any[];
}

interface Plan {
  operations: CleaningOperation[];
  explanation: string;
}

export default function DataCleaner({ fileName, columns, rows }: DataCleanerProps) {
  const [open, setOpen] = useState(false);
  const [instruction, setInstruction] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [plan, setPlan] = useState<Plan | null>(null);
  const [result, setResult] = useState<{ rows: any[]; columns: string[]; log: string[] } | null>(null);

  const handleGenerate = async () => {
    if (!instruction.trim() || loading) return;
    setLoading(true);
    setError('');
    setPlan(null);
    setResult(null);

    try {
      const columnStats = getColumnStats(rows, columns);
      const generatedPlan: Plan = await planCleaning(instruction, columns, columnStats);

      if (!generatedPlan.operations || generatedPlan.operations.length === 0) {
        setError(generatedPlan.explanation || "Couldn't figure out a cleaning plan for that request. Try being more specific.");
        setLoading(false);
        return;
      }

      const applied = applyCleaningOperations(rows, columns, generatedPlan.operations);
      setPlan(generatedPlan);
      setResult(applied);
    } catch (err: any) {
      setError(err.message || 'Failed to generate a cleaning plan');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!result) return;
    const csv = rowsToCSV(result.rows, result.columns);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const cleanedName = fileName.replace(/\.[^.]+$/, '') + '_cleaned.csv';
    link.href = url;
    link.download = cleanedName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="border-t border-gray-100">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-6 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
      >
        <span className="flex items-center gap-2">
          <Eraser className="w-4 h-4 text-blue-600" />
          Clean &amp; Export Data
        </span>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="w-4 h-4 text-gray-400" />
        </motion.div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-6 space-y-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={instruction}
                  onChange={(e) => setInstruction(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                  placeholder='e.g. "drop the Monthly* columns" or "fill missing temps with the column average"'
                  disabled={loading}
                  className="flex-1 px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <motion.button
                  whileHover={{ scale: loading ? 1 : 1.03 }}
                  whileTap={{ scale: loading ? 1 : 0.97 }}
                  onClick={handleGenerate}
                  disabled={loading || !instruction.trim()}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  {loading ? 'Planning...' : 'Generate Plan'}
                </motion.button>
              </div>

              {error && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-sm text-red-600"
                >
                  {error}
                </motion.p>
              )}

              {plan && result && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3"
                >
                  <p className="text-sm text-gray-800">{plan.explanation}</p>

                  <ul className="text-xs text-gray-600 space-y-1">
                    {result.log.map((line, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-blue-500 mt-0.5">&bull;</span>
                        {line}
                      </li>
                    ))}
                  </ul>

                  <div className="flex items-center justify-between pt-2 border-t border-blue-100">
                    <span className="text-xs text-gray-500">
                      {result.rows.length.toLocaleString()} rows &middot; {result.columns.length} columns
                    </span>
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={handleDownload}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      Download Cleaned CSV
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
