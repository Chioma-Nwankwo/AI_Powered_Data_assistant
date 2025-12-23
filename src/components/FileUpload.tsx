import { useRef } from 'react';
import { motion } from 'framer-motion';
import { Upload, Loader2 } from 'lucide-react';

interface FileUploadProps {
  onUpload: (file: File) => void;
  uploading: boolean;
}

export default function FileUpload({ onUpload, uploading }: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUpload(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      onUpload(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <motion.div
      whileHover={{ scale: uploading ? 1 : 1.01 }}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center hover:border-blue-500 transition-colors cursor-pointer bg-white"
      onClick={() => !uploading && fileInputRef.current?.click()}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,.xlsx,.xls"
        onChange={handleFileSelect}
        className="hidden"
        disabled={uploading}
      />

      {uploading ? (
        <div className="flex flex-col items-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
          <p className="text-gray-700 font-medium">Processing your file...</p>
          <p className="text-sm text-gray-500 mt-2">
            Analyzing data and generating insights
          </p>
        </div>
      ) : (
        <div className="flex flex-col items-center">
          <div className="bg-blue-100 p-4 rounded-full mb-4">
            <Upload className="w-8 h-8 text-blue-600" />
          </div>
          <p className="text-gray-700 font-medium mb-2">
            Drop your file here or click to browse
          </p>
          <p className="text-sm text-gray-500">
            Supports CSV and Excel files (up to 50MB)
          </p>
        </div>
      )}
    </motion.div>
  );
}
