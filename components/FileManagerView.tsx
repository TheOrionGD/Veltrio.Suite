import React, { useState, useRef } from 'react';
import { FileItem, AppPage } from '../types';

interface FileManagerViewProps {
  onAskAssistant: (prompt: string) => void;
  setInputText: (text: string) => void;
  setCurrentPage: (page: AppPage) => void;
}

const FileManagerView: React.FC<FileManagerViewProps> = ({
  onAskAssistant,
  setInputText,
  setCurrentPage,
}) => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getUserId = (): string => {
    try {
      const storedUser = localStorage.getItem('veltrioUser');
      const user = storedUser ? JSON.parse(storedUser) : null;
      return user?.id || '';
    } catch {
      return '';
    }
  };

  const fetchFiles = React.useCallback(async () => {
    const uid = getUserId();
    if (!uid) return;
    try {
      const res = await fetch(`/api/files?userId=${uid}`);
      if (res.ok) {
        const data = await res.json();
        setFiles(data);
      }
    } catch (err) {
      console.error('Failed to load files from database:', err);
    }
  }, []);

  React.useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = e.target.files;
    if (!uploadedFiles || uploadedFiles.length === 0) return;

    const file = uploadedFiles[0];
    const reader = new FileReader();

    reader.onload = async (event) => {
      const text = event.target?.result as string;
      const uid = getUserId();
      if (!uid) return;

      try {
        const res = await fetch('/api/files', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: uid,
            name: file.name,
            size: file.size,
            type: file.type,
            content: text || 'Empty file content.',
            status: 'idle',
          }),
        });

        if (res.ok) {
          fetchFiles();
        }
      } catch (err) {
        console.error('Failed to upload file to database:', err);
      }
    };

    reader.readAsText(file);
  };

  const handleTranslateFile = async (id: string) => {
    const uid = getUserId();
    if (!uid) return;

    // 1. Mark as translating locally & DB
    setFiles((prev) =>
      prev.map((f) => (f.id === id ? { ...f, status: 'translating' } : f))
    );
    try {
      await fetch(`/api/files?userId=${uid}&id=${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'translating' }),
      });

      const fileToTranslate = files.find((f) => f.id === id);
      const content = fileToTranslate?.content || '';

      // 2. Simulate background API run
      setTimeout(async () => {
        try {
          const res = await fetch(`/api/files?userId=${uid}&id=${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              status: 'completed',
              translatedContent: `[Jelly Bean AI Translation] ${content}`,
            }),
          });
          if (res.ok) {
            fetchFiles();
            setSelectedFile((prev) =>
              prev?.id === id
                ? {
                    ...prev,
                    status: 'completed',
                    translatedContent: `[Jelly Bean AI Translation] ${content}`,
                  }
                : prev
            );
          }
        } catch (e) {
          console.error(e);
        }
      }, 1500);
    } catch (err) {
      console.error('Failed to translate file:', err);
    }
  };

  const handleDeleteFile = async (id: string) => {
    const uid = getUserId();
    if (!uid) return;
    try {
      const res = await fetch(`/api/files?userId=${uid}&id=${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        fetchFiles();
        if (selectedFile?.id === id) setSelectedFile(null);
      }
    } catch (err) {
      console.error('Failed to delete file:', err);
    }
  };

  const handleSendToWorkspace = (content: string) => {
    setInputText(content);
    setCurrentPage('translator');
  };

  return (
    <div className="w-full max-w-5xl px-4 py-8 space-y-8 animate-fade-in">
      <div className="border-b border-zinc-200/50 dark:border-white/5 pb-4">
        <h1 className="text-2xl font-black uppercase tracking-wider text-[#234556] dark:text-[#effbfc]">
          File Manager
        </h1>
        <p className="text-xs text-zinc-500 dark:text-[#b4e4ed]">
          Upload documents for side-by-side translator alignment and batch run jobs
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left columns: Upload zone and list */}
        <div className="lg:col-span-2 space-y-6">
          {/* Upload Dropzone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-zinc-350 dark:border-white/10 hover:border-[#44b3cc]/60 bg-zinc-800/[0.02] dark:bg-white/[0.02] hover:bg-[#44b3cc]/5 transition-all p-8 rounded-2xl text-center cursor-pointer space-y-3 hover-scale"
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden"
              accept=".txt,.csv"
            />
            <div className="text-3xl">🗂️</div>
            <div>
              <p className="text-xs font-bold text-[#234556] dark:text-white">Click or drag text file to upload</p>
              <p className="text-[10px] text-zinc-500 mt-1">Supports UTF-8 encoded text files (.txt, .csv) up to 2MB</p>
            </div>
          </div>

          {/* Uploaded files list */}
          <div className="glass-panel p-6 space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-widest text-[#234556] dark:text-[#effbfc] border-b border-zinc-200/50 dark:border-white/5 pb-2">
              Workspace Files list
            </h2>

            {files.length === 0 ? (
              <p className="text-xs text-zinc-500 italic">No uploaded documents in list.</p>
            ) : (
              <div className="divide-y divide-zinc-250/35 dark:divide-white/5">
                {files.map((file) => (
                  <div
                    key={file.id}
                    className={`py-3.5 flex items-center justify-between gap-4 cursor-pointer hover:bg-zinc-800/5 dark:hover:bg-white/[0.02] px-2 rounded-xl transition-all ${
                      selectedFile?.id === file.id ? 'bg-[#44b3cc]/10 dark:bg-white/5' : ''
                    }`}
                    onClick={() => setSelectedFile(file)}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-lg shrink-0">📄</span>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-[#234556] dark:text-white truncate">{file.name}</p>
                        <p className="text-[10px] text-zinc-400 font-mono mt-0.5">
                          {Math.round(file.size / 1024)} KB · {new Date(file.uploadedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {file.status === 'idle' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTranslateFile(file.id);
                          }}
                          className="px-2.5 py-1 bg-zinc-800/10 dark:bg-white/10 hover:bg-[#44b3cc] hover:text-white rounded-lg text-[9px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-300 transition-all cursor-pointer"
                        >
                          Translate
                        </button>
                      )}

                      {file.status === 'translating' && (
                        <span className="text-[9px] font-bold uppercase tracking-wider text-amber-500 animate-pulse">
                          Translating...
                        </span>
                      )}

                      {file.status === 'completed' && (
                        <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-bold text-emerald-500 uppercase">
                          Ready
                        </span>
                      )}

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteFile(file.id);
                        }}
                        className="p-1.5 text-zinc-400 hover:text-red-500 transition-colors cursor-pointer"
                        title="Delete file"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right column: Selected file details & actions drawer */}
        <div className="space-y-6">
          <div className="glass-panel p-6 space-y-6">
            <h2 className="text-xs font-bold uppercase tracking-widest text-[#234556] dark:text-[#effbfc] border-b border-zinc-200/50 dark:border-white/5 pb-2">
              File Preview Drawer
            </h2>

            {selectedFile ? (
              <div className="space-y-4">
                <div className="space-y-1">
                  <div className="text-[9px] uppercase tracking-wider font-bold text-zinc-400">File Name</div>
                  <div className="text-xs font-bold text-[#234556] dark:text-white truncate">{selectedFile.name}</div>
                </div>

                <div className="space-y-1">
                  <div className="text-[9px] uppercase tracking-wider font-bold text-zinc-400">Raw content</div>
                  <div className="p-3 bg-zinc-800/5 dark:bg-black/20 border border-zinc-200/40 dark:border-white/5 rounded-xl text-[11px] font-sans text-zinc-700 dark:text-zinc-300 max-h-[140px] overflow-y-auto leading-relaxed">
                    {selectedFile.content}
                  </div>
                </div>

                {selectedFile.translatedContent && (
                  <div className="space-y-1">
                    <div className="text-[9px] uppercase tracking-wider font-bold text-[#44b3cc]">Translated Content</div>
                    <div className="p-3 bg-[#44b3cc]/5 dark:bg-white/[0.02] border border-[#44b3cc]/20 rounded-xl text-[11px] font-sans text-zinc-700 dark:text-zinc-200 max-h-[140px] overflow-y-auto leading-relaxed">
                      {selectedFile.translatedContent}
                    </div>
                  </div>
                )}

                <div className="flex flex-col gap-2 pt-3 border-t border-zinc-200/40 dark:border-white/5">
                  <button
                    onClick={() => handleSendToWorkspace(selectedFile.content)}
                    className="w-full text-center py-2 bg-[#44b3cc] hover:bg-[#2896b2] text-white rounded-xl text-xs font-bold transition-all hover-scale cursor-pointer"
                  >
                    Open in Written Link
                  </button>

                  <button
                    onClick={() => onAskAssistant(`Summarize or proofread this uploaded file:\n\n${selectedFile.content}`)}
                    className="w-full text-center py-2 bg-zinc-800/5 dark:bg-white/5 hover:bg-zinc-800/10 dark:hover:bg-white/10 text-xs font-bold text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-white/10 rounded-xl transition-colors cursor-pointer"
                  >
                    Copilot File Summary
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-xs text-zinc-500 italic text-center py-8">
                Select an uploaded file from the list to preview details & run actions.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FileManagerView;
