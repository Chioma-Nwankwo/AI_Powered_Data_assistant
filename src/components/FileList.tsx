import { motion } from 'framer-motion';
import { FileText, Trash2 } from 'lucide-react';

interface FileListProps {
  files: Array<{
    id: string;
    file_name: string;
    file_size: number;
    row_count: number;
    created_at: string;
  }>;
  onSelect: (file: any) => void;
  onDelete: (id: string) => void;
}

export default function FileList({ files, onSelect, onDelete }: FileListProps) {
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {files.map((file, index) => (
        <motion.div
          key={file.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer group"
          onClick={() => onSelect(file)}
        >
          <div className="flex items-start justify-between mb-3">
            <div className="bg-blue-100 p-2 rounded">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(file.id);
              }}
              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-50 rounded"
            >
              <Trash2 className="w-4 h-4 text-red-600" />
            </button>
          </div>

          <h4 className="font-medium text-gray-900 mb-2 truncate">
            {file.file_name}
          </h4>

          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>{file.row_count.toLocaleString()} rows</span>
            <span>{formatFileSize(file.file_size)}</span>
          </div>

          <div className="mt-2 text-xs text-gray-400">
            {formatDate(file.created_at)}
          </div>
        </motion.div>
      ))}
    </div>
  );
}
