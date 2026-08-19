import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { deleteAccount } from '../lib/api';
import { Database, FileText, LogOut, Plus, Trash2, Loader2 } from 'lucide-react';

interface SidebarProps {
  files: Array<{
    id: string;
    file_name: string;
    row_count: number;
  }>;
  selectedFile: any;
  onSelectFile: (file: any) => void;
  onDeleteFile: (id: string) => void;
}

export default function Sidebar({ files, selectedFile, onSelectFile }: SidebarProps) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [deleting, setDeleting] = useState(false);

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      'Delete your account permanently? This removes your profile, uploaded files, and all conversations. This cannot be undone.'
    );
    if (!confirmed) return;

    setDeleting(true);
    try {
      await deleteAccount();
      await signOut();
      navigate('/');
    } catch (error: any) {
      alert(error.message || 'Failed to delete account');
      setDeleting(false);
    }
  };

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-blue-600 p-2 rounded-lg">
            <Database className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {user?.email}
            </p>
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onSelectFile(null)}
          className="w-full flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Upload
        </motion.button>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Your Files ({files.length})
        </h3>

        <div className="space-y-2">
          {files.map((file) => (
            <motion.button
              key={file.id}
              whileHover={{ scale: 1.02 }}
              onClick={() => onSelectFile(file)}
              className={`w-full text-left p-3 rounded-lg transition-colors ${
                selectedFile?.id === file.id
                  ? 'bg-blue-50 border border-blue-200'
                  : 'hover:bg-gray-50 border border-transparent'
              }`}
            >
              <div className="flex items-start gap-3">
                <FileText className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
                  selectedFile?.id === file.id ? 'text-blue-600' : 'text-gray-400'
                }`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {file.file_name}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {file.row_count.toLocaleString()} rows
                  </p>
                </div>
              </div>
            </motion.button>
          ))}
        </div>

        {files.length === 0 && (
          <p className="text-sm text-gray-500 text-center py-8">
            No files uploaded yet
          </p>
        )}
      </div>

      <div className="p-4 border-t border-gray-200 space-y-1">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={signOut}
          className="w-full flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleDeleteAccount}
          disabled={deleting}
          className="w-full flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
          {deleting ? 'Deleting...' : 'Delete Account'}
        </motion.button>
      </div>
    </div>
  );
}
