import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { parseFile, getSampleRows } from '../lib/fileUtils';
import { analyzeDataFile, generateSuggestedQuestions } from '../lib/api';
import FileUpload from '../components/FileUpload';
import FileList from '../components/FileList';
import ChatInterface from '../components/ChatInterface';
import Sidebar from '../components/Sidebar';
import { Upload, MessageSquare, Loader2 } from 'lucide-react';

interface UploadedFile {
  id: string;
  file_name: string;
  file_size: number;
  column_names: string[];
  row_count: number;
  summary: string | null;
  created_at: string;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<UploadedFile | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([]);
  const [fileData, setFileData] = useState<any>(null);

  useEffect(() => {
    loadFiles();
  }, []);

  const loadFiles = async () => {
    try {
      const { data, error } = await supabase
        .from('uploaded_files')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFiles(data || []);
    } catch (error) {
      console.error('Error loading files:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!user) return;

    setUploading(true);
    try {
      const parsedData = await parseFile(file);
      const sampleRows = getSampleRows(parsedData.rows, 10);

      const filePath = `${user.id}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('data-files')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: fileRecord, error: dbError } = await supabase
        .from('uploaded_files')
        .insert({
          user_id: user.id,
          file_name: file.name,
          file_path: filePath,
          file_size: file.size,
          file_type: file.type,
          column_names: parsedData.columns,
          row_count: parsedData.rowCount,
        })
        .select()
        .single();

      if (dbError) throw dbError;

      const aiAnalysis = await analyzeDataFile(
        parsedData.columns,
        sampleRows,
        parsedData.rowCount
      );

      const { error: updateError } = await supabase
        .from('uploaded_files')
        .update({ summary: aiAnalysis.summary })
        .eq('id', fileRecord.id);

      if (updateError) throw updateError;

      const updatedFile = { ...fileRecord, summary: aiAnalysis.summary };
      setFiles([updatedFile, ...files]);
      setSelectedFile(updatedFile);
      setFileData(parsedData);

      const questionsData = await generateSuggestedQuestions(
        parsedData.columns,
        aiAnalysis.summary
      );
      setSuggestedQuestions(questionsData.questions || []);
    } catch (error: any) {
      console.error('Error uploading file:', error);
      alert(error.message || 'Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const handleSelectFile = async (file: UploadedFile) => {
    setSelectedFile(file);

    try {
      const { data: storageData, error } = await supabase.storage
        .from('data-files')
        .download(file.file_path);

      if (error) throw error;

      const fileObject = new File([storageData], file.file_name);
      const parsedData = await parseFile(fileObject);
      setFileData(parsedData);

      if (file.summary) {
        const questionsData = await generateSuggestedQuestions(
          file.column_names,
          file.summary
        );
        setSuggestedQuestions(questionsData.questions || []);
      }
    } catch (error) {
      console.error('Error loading file data:', error);
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    try {
      const fileToDelete = files.find(f => f.id === fileId);
      if (!fileToDelete) return;

      await supabase.storage
        .from('data-files')
        .remove([fileToDelete.file_path]);

      const { error } = await supabase
        .from('uploaded_files')
        .delete()
        .eq('id', fileId);

      if (error) throw error;

      setFiles(files.filter(f => f.id !== fileId));
      if (selectedFile?.id === fileId) {
        setSelectedFile(null);
        setFileData(null);
        setSuggestedQuestions([]);
      }
    } catch (error) {
      console.error('Error deleting file:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar
        files={files}
        selectedFile={selectedFile}
        onSelectFile={handleSelectFile}
        onDeleteFile={handleDeleteFile}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">AI Data Assistant</h1>
              <p className="text-sm text-gray-600">
                Upload data and ask questions in natural language
              </p>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6">
          <AnimatePresence mode="wait">
            {!selectedFile ? (
              <motion.div
                key="upload"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="max-w-4xl mx-auto"
              >
                <div className="text-center mb-8">
                  <Upload className="w-16 h-16 mx-auto text-blue-600 mb-4" />
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">
                    Get Started
                  </h2>
                  <p className="text-gray-600">
                    Upload a CSV or Excel file to begin analyzing your data
                  </p>
                </div>

                <FileUpload onUpload={handleFileUpload} uploading={uploading} />

                {files.length > 0 && (
                  <div className="mt-12">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Recent Files
                    </h3>
                    <FileList
                      files={files}
                      onSelect={handleSelectFile}
                      onDelete={handleDeleteFile}
                    />
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="chat"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full flex flex-col"
              >
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                  <div className="flex items-start gap-4">
                    <div className="bg-blue-100 p-3 rounded-lg">
                      <MessageSquare className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {selectedFile.file_name}
                      </h3>
                      <p className="text-sm text-gray-600 mb-3">
                        {selectedFile.row_count.toLocaleString()} rows · {selectedFile.column_names.length} columns
                      </p>
                      {selectedFile.summary && (
                        <p className="text-sm text-gray-700 leading-relaxed">
                          {selectedFile.summary}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <ChatInterface
                  file={selectedFile}
                  fileData={fileData}
                  suggestedQuestions={suggestedQuestions}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
