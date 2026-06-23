import React, { useState, useRef, useEffect } from 'react';
import type { DragEvent } from 'react';
import { toast } from 'react-hot-toast';
import { 
  FileUp, 
  SlidersHorizontal, 
  LayoutGrid, 
  Download, 
  Check, 
  FileText,
  Loader2,
  Trash2,
  Eye,
  X
} from 'lucide-react';
import { isAxiosError } from 'axios';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authService } from '../services/authService';
import { pdfService } from '../services/pdfService';

// Define strict interfaces for our component state
interface PDFPage {
  id: number;
  label: string;
  type: 'placeholder';
}

interface ExtractionRecord {
  _id: string;
  originalFileName: string;
  extractedFileName: string;
  pages: number[];
  createdAt: string;
}

export default function PDFCraft() {
  const queryClient = useQueryClient();

  // Authentication States
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [userEmail, setUserEmail] = useState<string>(localStorage.getItem('email') || '');
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authEmail, setAuthEmail] = useState<string>('');
  const [authPassword, setAuthPassword] = useState<string>('');

  // PDF Workspace States
  const [selectedPages, setSelectedPages] = useState<number[]>(() => {
    try {
      const saved = localStorage.getItem('selectedPages');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [rangeInput, setRangeInput] = useState<string>('');
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [pdfPages, setPdfPages] = useState<PDFPage[]>(() => {
    try {
      const saved = localStorage.getItem('pdfPages');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [fileId, setFileId] = useState<string | null>(() => localStorage.getItem('fileId'));
  const [fileName, setFileName] = useState<string>(() => localStorage.getItem('fileName') || '');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState<string>('Document Preview');
  const [previewSubtitle, setPreviewSubtitle] = useState<string>('');

  // Drag & Drop Reordering States
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // Synchronize workspace to localStorage for browser reload & navigation state caching
  useEffect(() => {
    if (fileId) {
      localStorage.setItem('fileId', fileId);
    } else {
      localStorage.removeItem('fileId');
    }
  }, [fileId]);

  useEffect(() => {
    if (fileName) {
      localStorage.setItem('fileName', fileName);
    } else {
      localStorage.removeItem('fileName');
    }
  }, [fileName]);

  useEffect(() => {
    if (pdfPages && pdfPages.length > 0) {
      localStorage.setItem('pdfPages', JSON.stringify(pdfPages));
    } else {
      localStorage.removeItem('pdfPages');
    }
  }, [pdfPages]);

  useEffect(() => {
    if (selectedPages && selectedPages.length > 0) {
      localStorage.setItem('selectedPages', JSON.stringify(selectedPages));
    } else {
      localStorage.removeItem('selectedPages');
    }
  }, [selectedPages]);

  // React Query - Extraction History Query
  const { data: historyData, isLoading: isHistoryLoading } = useQuery<ExtractionRecord[]>({
    queryKey: ['pdfHistory', token],
    queryFn: async () => {
      return await pdfService.getHistory();
    },
    enabled: !!token,
  });

  const history = historyData || [];

  const fileInputRef = useRef<HTMLInputElement>(null);

  // React Query - Auth Submit Mutation
  const authMutation = useMutation({
    mutationFn: async () => {
      if (authMode === 'login') {
        return await authService.login(authEmail, authPassword);
      } else {
        return await authService.register(authEmail, authPassword);
      }
    },
    onSuccess: (data) => {
      localStorage.setItem('token', data.token);
      localStorage.setItem('email', data.email);
      setToken(data.token);
      setUserEmail(data.email);
      setAuthEmail('');
      setAuthPassword('');
      authMutation.reset();
    },
  });

  const handleAuthSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    authMutation.mutate();
  };

  const authError = authMutation.error 
    ? (isAxiosError(authMutation.error) ? authMutation.error.response?.data?.error : authMutation.error.message) || authMutation.error.message 
    : '';
  const isAuthLoading = authMutation.isPending;

  const handleLogout = (): void => {
    localStorage.removeItem('token');
    localStorage.removeItem('email');
    setToken(null);
    setUserEmail('');
    resetState();
  };

  const togglePage = (pageId: number): void => {
    setSelectedPages(prev => 
      prev.includes(pageId) ? prev.filter(id => id !== pageId) : [...prev, pageId]
    );
  };

  const handleSelectAll = (): void => {
    setSelectedPages(pdfPages.map(page => page.id));
  };

  const handleDeselectAll = (): void => {
    setSelectedPages([]);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (): void => {
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  // React Query - PDF Upload Mutation
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      return await pdfService.uploadPdf(file);
    },
    onSuccess: (data) => {
      setFileId(data.fileId);

      const pages: PDFPage[] = Array.from({ length: data.pageCount }, (_, i) => ({
        id: i + 1,
        label: `PAGE ${i + 1}`,
        type: 'placeholder'
      }));

      setPdfPages(pages);
      setSelectedPages([]);
      setRangeInput('');
      queryClient.invalidateQueries({ queryKey: ['pdfHistory', token] });
    },
    onError: (error) => {
      console.error('Error uploading file:', error);
      toast.error('Failed to upload and parse PDF file.');
    }
  });

  const handleFile = (file: File): void => {
    if (file.type !== 'application/pdf') {
      toast.error('Only PDF files are allowed!');
      return;
    }
    setFileName(file.name);
    uploadMutation.mutate(file);
  };

  const isUploading = uploadMutation.isPending;

  const applyRange = (): void => {
    if (!rangeInput.trim()) return;
    const pagesToSelect = new Set<number>();
    const parts = rangeInput.split(',');

    for (const part of parts) {
      const cleanPart = part.trim();
      if (cleanPart.includes('-')) {
        const [startStr, endStr] = cleanPart.split('-');
        const start = parseInt(startStr || '', 10);
        const end = parseInt(endStr || '', 10);
        if (!isNaN(start) && !isNaN(end)) {
          const from = Math.min(start, end);
          const to = Math.max(start, end);
          for (let i = from; i <= to; i++) {
            if (i > 0 && i <= pdfPages.length) {
              pagesToSelect.add(i);
            }
          }
        }
      } else {
        const val = parseInt(cleanPart, 10);
        if (!isNaN(val) && val > 0 && val <= pdfPages.length) {
          pagesToSelect.add(val);
        }
      }
    }

    setSelectedPages(Array.from(pagesToSelect).sort((a, b) => a - b));
  };

  const handleRangeKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter') {
      applyRange();
    }
  };

  // Reordering drag handlers
  const handleDragStartCard = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOverCard = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDropCard = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) return;

    const newPages = [...pdfPages];
    const [draggedItem] = newPages.splice(draggedIndex, 1);
    if (draggedItem) {
      newPages.splice(targetIndex, 0, draggedItem);
      setPdfPages(newPages);
    }
    setDraggedIndex(null);
  };

  // Helper to obtain selected pages in the order they are currently arranged
  const getOrderedSelectedPages = (): number[] => {
    return pdfPages
      .filter((p) => selectedPages.includes(p.id))
      .map((p) => p.id);
  };

  // React Query - Preview Mutation
  const previewMutation = useMutation({
    mutationFn: async (orderedPages: number[]) => {
      if (!fileId) throw new Error('No file selected');
      return await pdfService.extractPages(fileId, orderedPages, fileName);
    },
    onSuccess: (blob) => {
      if (previewUrl) {
        window.URL.revokeObjectURL(previewUrl);
      }
      const url = window.URL.createObjectURL(blob);
      setPreviewUrl(url);
      queryClient.invalidateQueries({ queryKey: ['pdfHistory', token] });
    },
    onError: (error) => {
      console.error('Error generating preview:', error);
      toast.error('Failed to generate preview.');
    }
  });

  const handlePreview = async (): Promise<void> => {
    const orderedPages = getOrderedSelectedPages();
    if (!fileId || orderedPages.length === 0) return;
    setPreviewTitle('Workspace Preview');
    setPreviewSubtitle(`Previewing ${orderedPages.length} selected pages`);
    previewMutation.mutate(orderedPages);
  };

  const isPreviewing = previewMutation.isPending;

  // React Query - Preview History Item Mutation
  const previewHistoryItemMutation = useMutation({
    mutationFn: async (record: ExtractionRecord) => {
      const blob = await pdfService.downloadHistoryItem(record._id);
      return { blob, record };
    },
    onSuccess: ({ blob, record }) => {
      if (previewUrl) {
        window.URL.revokeObjectURL(previewUrl);
      }
      const url = window.URL.createObjectURL(blob);
      setPreviewUrl(url);
      setPreviewTitle(record.originalFileName);
      setPreviewSubtitle(`Historical Copy • Pages: ${record.pages.join(', ')}`);
    },
    onError: (error) => {
      console.error('Failed to preview history item:', error);
      toast.error('Failed to preview historical copy.');
    }
  });

  const handlePreviewHistoryItem = (record: ExtractionRecord): void => {
    previewHistoryItemMutation.mutate(record);
  };

  const closePreview = (): void => {
    if (previewUrl) {
      window.URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    setPreviewTitle('Document Preview');
    setPreviewSubtitle('');
  };

  // React Query - Delete History Item Mutation
  const deleteHistoryItemMutation = useMutation({
    mutationFn: async (id: string) => {
      return await pdfService.deleteHistoryItem(id);
    },
    onSuccess: () => {
      toast.success('History item deleted.');
      queryClient.invalidateQueries({ queryKey: ['pdfHistory', token] });
    },
    onError: (error) => {
      console.error('Failed to delete history item:', error);
      toast.error('Failed to delete history item.');
    }
  });

  const handleDeleteHistoryItem = (id: string): void => {
    toast((t) => (
      <div className="flex flex-col gap-3">
        <span className="text-sm font-semibold text-white">Are you sure you want to delete this history item?</span>
        <div className="flex gap-2">
          <button
            onClick={() => {
              toast.dismiss(t.id);
              deleteHistoryItemMutation.mutate(id);
            }}
            className="px-3 py-1.5 bg-red-950/80 border border-red-900/50 hover:bg-red-900/80 text-red-400 text-xs font-bold rounded-lg transition-colors cursor-pointer"
          >
            Delete
          </button>
          <button
            onClick={() => toast.dismiss(t.id)}
            className="px-3 py-1.5 bg-[#17222b] hover:bg-[#1e2d3b] border border-[#1f374c] text-gray-300 text-xs font-bold rounded-lg transition-colors cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    ), {
      duration: Infinity,
      style: {
        background: '#0c141c',
        border: '1px solid #1f2e3d',
        padding: '16px',
      }
    });
  };

  // React Query - Download Mutation
  const downloadMutation = useMutation({
    mutationFn: async (orderedPages: number[]) => {
      if (!fileId) throw new Error('No file selected');
      return await pdfService.extractPages(fileId, orderedPages, fileName);
    },
    onSuccess: (blob) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const baseName = fileName.replace(/\.[^/.]+$/, "");
      a.download = `${baseName}_extracted.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      queryClient.invalidateQueries({ queryKey: ['pdfHistory', token] });
    },
    onError: (error) => {
      console.error('Error downloading PDF:', error);
      toast.error('Failed to extract and download pages.');
    }
  });

  const handleDownload = async (): Promise<void> => {
    const orderedPages = getOrderedSelectedPages();
    if (!fileId || orderedPages.length === 0) return;
    downloadMutation.mutate(orderedPages);
  };

  const isProcessing = downloadMutation.isPending;

  const resetState = (): void => {
    setPdfPages([]);
    setFileId(null);
    setFileName('');
    setSelectedPages([]);
    setRangeInput('');
    localStorage.removeItem('fileId');
    localStorage.removeItem('fileName');
    localStorage.removeItem('pdfPages');
    localStorage.removeItem('selectedPages');
    if (previewUrl) {
      window.URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Render Authentication View if not logged in
  if (!token) {
    return (
      <div className="min-h-screen bg-[#0d151a] text-[#e2e8f0] font-sans antialiased flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-[#0c141c] border border-[#1f2e3d] rounded-3xl p-8 shadow-2xl space-y-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#00b4d8] to-[#0077b6]"></div>
          
          <div className="flex flex-col items-center gap-3">
            <div className="p-3 bg-[#111e29] rounded-2xl text-[#00b4d8] shadow-inner">
              <FileText size={32} />
            </div>
            <span className="text-2xl font-black text-white tracking-tight">PDFCraft</span>
            <p className="text-xs text-gray-500 font-semibold tracking-wider uppercase">
              {authMode === 'login' ? 'Login to your account' : 'Create an account'}
            </p>
          </div>

          {authError && (
            <div className="p-3 bg-red-950/30 border border-red-900/50 rounded-xl text-red-400 text-xs font-semibold text-center">
              {authError}
            </div>
          )}

          <form onSubmit={handleAuthSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black tracking-widest text-gray-500 uppercase">
                Email Address
              </label>
              <input 
                type="email" 

                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-[#070b0e] border border-[#17222b] rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#00b4d8] transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black tracking-widest text-gray-500 uppercase">
                Password
              </label>
              <input 
                type="password" 
                
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#070b0e] border border-[#17222b] rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#00b4d8] transition-colors"
              />
            </div>

            <button 
              type="submit"
              disabled={isAuthLoading}
              className="w-full py-3 bg-[#00b4d8] hover:bg-[#0096b4] text-black font-bold rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-wait"
            >
              {isAuthLoading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : authMode === 'login' ? (
                'Login'
              ) : (
                'Register'
              )}
            </button>
          </form>

          <div className="text-center">
            <button 
              onClick={() => {
                setAuthMode(authMode === 'login' ? 'register' : 'login');
                authMutation.reset();
                setAuthEmail('');
                setAuthPassword('');
              }}
              className="text-xs text-[#00b4d8] hover:text-[#0096b4] font-semibold transition-colors cursor-pointer"
            >
              {authMode === 'login' ? "Don't have an account? Register" : 'Already have an account? Login'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Logged-in PDF editor view
  return (
    <div className="min-h-screen bg-[#0d151a] text-[#e2e8f0] font-sans antialiased flex flex-col relative pb-28">
      
      {/* Hidden file input */}
      <input 
        type="file" 
        ref={fileInputRef} 
        accept="application/pdf" 
        onChange={handleFileSelect} 
        className="hidden" 
      />

      {/* 1. Global Navigation Bar */}
      <header className="w-full max-w-7xl mx-auto flex justify-between items-center px-4 sm:px-8 py-5 border-b border-[#17222b]">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#17222b] rounded-xl text-[#00b4d8]">
            <FileText size={22} />
          </div>
          <span className="text-xl sm:text-2xl font-bold tracking-tight text-white font-extrabold">PDFCraft</span>
        </div>
        
        <div className="flex items-center gap-4">
          {fileId && (
            <button 
              onClick={resetState}
              className="flex items-center gap-2 px-3 py-1.5 bg-red-950/30 border border-red-900/50 hover:bg-red-900/40 text-red-400 hover:text-red-300 rounded-xl transition-all text-xs font-semibold cursor-pointer"
            >
              <Trash2 size={14} />
              <span>Clear File</span>
            </button>
          )}
          <div className="flex items-center gap-3 bg-[#0c141c] border border-[#17222b] rounded-xl px-4 py-1.5 shadow-sm">
            <span className="text-xs text-gray-400 font-semibold">{userEmail}</span>
            <span className="text-gray-700">|</span>
            <button 
              onClick={handleLogout}
              className="text-xs text-[#00b4d8] hover:text-[#0096b4] font-bold transition-colors cursor-pointer"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* 2. Main Responsive Canvas Layout Container */}
      <main className="w-full max-w-7xl mx-auto flex-1 px-4 sm:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Main workspace section (left column) */}
          <div className="lg:col-span-8 space-y-8">
            {/* Hero Title Section */}
            <div className="text-center sm:text-left space-y-3 py-4">
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
                Craft Your Perfect Document.
              </h1>
              <p className="text-sm text-gray-400 leading-relaxed max-w-xl">
                Professional precision for PDF manipulation. Drop, select, reorder, and refine.
              </p>
            </div>

            {/* Full Width Drop Zone Area */}
            <div 
              onClick={() => !isUploading && !isProcessing && !isPreviewing && fileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-2xl p-8 sm:p-12 flex flex-col items-center justify-center gap-4 transition-all duration-300 cursor-pointer group
                ${isDragging 
                  ? 'border-[#00b4d8] bg-[#00b4d8]/5' 
                  : 'border-[#1e2d3b] bg-[#0c141c] hover:border-[#00b4d8]/50 hover:bg-[#0e1720]'
                } ${isUploading ? 'opacity-80 cursor-wait' : ''}`}
            >
              <div className="p-4 bg-[#111e29] rounded-2xl text-[#00b4d8] group-hover:scale-110 transition-transform duration-300 shadow-inner">
                {isUploading ? (
                  <Loader2 size={36} className="animate-spin text-[#00b4d8]" />
                ) : (
                  <FileUp size={36} />
                )}
              </div>
              <div className="text-center space-y-1.5">
                <h3 className="text-base sm:text-lg font-bold text-white tracking-wide">
                  {isUploading ? 'Uploading & Processing PDF...' : fileName ? fileName : 'Import PDF'}
                </h3>
                <p className="text-xs text-gray-500 font-semibold tracking-wider uppercase">
                  {isUploading ? 'Please wait a moment' : 'Tap to browse or drag here'}
                </p>
              </div>
            </div>

            {/* Workspace Management Panel & Grid (only shown when a file is uploaded) */}
            {pdfPages.length > 0 && (
              <div className="space-y-8">
                {/* Workspace Management Panel */}
                <div className="space-y-4 pt-4">
                  <div className="flex justify-between items-end">
                    <div className="flex flex-col gap-1">
                      <span className="font-black tracking-widest text-[#00b4d8] uppercase text-xs sm:text-sm">
                        Active Workspace ({pdfPages.length} Pages)
                      </span>
                      <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider animate-pulse">
                        Tip: Drag & Drop page cards to reorder
                      </span>
                    </div>
                    <div className="flex gap-4 text-xs sm:text-sm font-bold text-gray-400 font-semibold">
                      <button onClick={handleSelectAll} className="hover:text-[#00b4d8] transition-colors cursor-pointer">Select All</button>
                      <span className="text-gray-700">|</span>
                      <button onClick={handleDeselectAll} className="hover:text-[#00b4d8] transition-colors cursor-pointer">Deselect All</button>
                    </div>
                  </div>

                  {/* Filtering Range Panel Block */}
                  <div className="bg-[#0c141c] border border-[#17222b] rounded-2xl p-4 sm:p-5 space-y-3 shadow-md max-w-xl">
                    <label className="block text-[11px] font-black tracking-widest text-gray-500 uppercase">
                      Page Range
                    </label>
                    <div className="flex gap-3">
                      <input 
                        type="text" 
                        value={rangeInput}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRangeInput(e.target.value)}
                        onKeyDown={handleRangeKeyDown}
                        placeholder="e.g. 1-3, 5"
                        className="flex-1 bg-[#070b0e] border border-[#17222b] rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#00b4d8] transition-colors"
                      />
                      <button 
                        onClick={applyRange}
                        className="bg-[#111e29] hover:bg-[#162736] border border-[#17222b] text-[#00b4d8] px-4 rounded-xl transition-all flex items-center justify-center cursor-pointer"
                      >
                        <SlidersHorizontal size={18} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* 3. Dynamic Responsive Grid Canvas with Drag-and-Drop Reordering */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-6 pt-2">
                  {pdfPages.map((page, index) => {
                    const isSelected = selectedPages.includes(page.id);
                    const isCurrentlyDragged = draggedIndex === index;
                    
                    return (
                      <div 
                        key={page.id}
                        draggable={true}
                        onDragStart={(e) => handleDragStartCard(e, index)}
                        onDragOver={handleDragOverCard}
                        onDragEnd={() => setDraggedIndex(null)}
                        onDrop={(e) => handleDropCard(e, index)}
                        onClick={() => togglePage(page.id)}
                        className={`aspect-[3/4] rounded-2xl relative overflow-hidden cursor-grab active:cursor-grabbing select-none border transition-all duration-300 group
                          ${isSelected 
                            ? 'border-[#00b4d8] shadow-lg shadow-[#00b4d8]/5 ring-1 ring-[#00b4d8]/40' 
                            : 'border-[#17222b] bg-[#111b24] hover:border-gray-700'
                          } ${isCurrentlyDragged ? 'opacity-30 scale-95 border-dashed border-[#00b4d8]' : ''}`}
                      >
                        <div className="absolute inset-0 flex items-center justify-center text-gray-700 group-hover:text-gray-500 transition-colors">
                          <div className="w-10 h-10 rounded-xl bg-[#0c141c] flex items-center justify-center border border-[#17222b]">
                            <FileText size={20} className={isSelected ? 'text-[#00b4d8]' : ''} />
                          </div>
                        </div>

                        {/* Selection Circle Overlay */}
                        <div className="absolute top-3.5 right-3.5">
                          <div className={`w-6 h-6 rounded-full border flex items-center justify-center transition-all duration-200
                            ${isSelected 
                              ? 'bg-[#00b4d8] border-[#00b4d8] text-black scale-105' 
                              : 'border-gray-600 bg-black/40 group-hover:border-gray-400'
                            }`}
                          >
                            {isSelected && <Check size={14} strokeWidth={3} />}
                          </div>
                        </div>

                        {/* Bottom Badge Tag */}
                        <div className="absolute bottom-3.5 left-3.5">
                          <span className="text-[10px] font-black tracking-widest bg-black/80 text-gray-300 px-2 py-1 rounded-md uppercase">
                            {page.label}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* History sidebar section (right column) */}
          <div className="lg:col-span-4 space-y-6 lg:pt-24">
            <div className="bg-[#0c141c] border border-[#1f2e3d] rounded-3xl p-6 shadow-2xl relative overflow-hidden space-y-6">
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#00b4d8] to-[#0077b6]"></div>
              
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-black tracking-widest text-white uppercase flex items-center gap-2">
                  <SlidersHorizontal size={16} className="text-[#00b4d8]" />
                  <span>Recent Extractions</span>
                </h3>
                <span className="text-[10px] bg-[#17222b] text-gray-400 px-2 py-0.5 rounded-full font-bold">
                  {history.length} / 4 Saved
                </span>
              </div>

              {isHistoryLoading ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3 text-gray-500">
                  <Loader2 className="animate-spin text-[#00b4d8]" size={24} />
                  <span className="text-xs font-semibold">Loading history...</span>
                </div>
              ) : history.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center gap-3 border border-dashed border-[#17222b] rounded-2xl bg-[#080d12]">
                  <FileText className="text-gray-600" size={32} />
                  <div className="space-y-1">
                    <p className="text-xs text-gray-400 font-bold">No history yet</p>
                    <p className="text-[10px] text-gray-500 max-w-[180px] mx-auto leading-relaxed">Extract pages from a PDF to save historical copies here.</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3.5">
                  {history.map((record) => (
                    <div 
                      key={record._id}
                      className="group p-4 bg-[#111e29]/50 hover:bg-[#162736]/70 border border-[#17222b] hover:border-[#1f374c] rounded-2xl flex items-center justify-between gap-4 transition-all duration-300 shadow-sm"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="p-2.5 bg-[#0c141c] text-[#00b4d8] rounded-xl border border-[#17222b] group-hover:scale-105 transition-transform duration-300">
                          <FileText size={18} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-white truncate max-w-[120px]" title={record.originalFileName}>
                            {record.originalFileName}
                          </p>
                          <p className="text-[10px] text-gray-400 font-medium truncate max-w-[120px]">
                            Pages: {record.pages.join(', ')}
                          </p>
                          <p className="text-[8px] text-gray-500 font-semibold mt-0.5 uppercase tracking-wide">
                            {new Date(record.createdAt).toLocaleDateString(undefined, { 
                              month: 'short', 
                              day: 'numeric', 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => handlePreviewHistoryItem(record)}
                          className="p-2 bg-[#111e29] hover:bg-[#162736] border border-[#17222b] text-[#00b4d8] rounded-xl hover:scale-105 transition-all shadow-md cursor-pointer flex items-center justify-center shrink-0"
                          title="Preview Extracted Copy"
                        >
                          <Eye size={14} strokeWidth={2.5} />
                        </button>
                        <button 
                          onClick={() => handleDeleteHistoryItem(record._id)}
                          className="p-2 bg-red-950/30 hover:bg-red-900/40 border border-red-900/50 text-red-400 rounded-xl hover:scale-105 transition-all shadow-md cursor-pointer flex items-center justify-center shrink-0"
                          title="Delete History Item"
                          disabled={deleteHistoryItemMutation.isPending}
                        >
                          {deleteHistoryItemMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} strokeWidth={2.5} />}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>
      </main>

      {/* 4. Center-Anchored Floating Navigation Bar */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[85%] max-w-sm bg-[#111a22]/90 backdrop-blur-md border border-[#1f2e3d] rounded-2xl p-2 flex justify-around items-center shadow-2xl z-50">
        <button 
          onClick={() => !isUploading && !isProcessing && !isPreviewing && fileInputRef.current?.click()}
          className="p-3 rounded-xl bg-[#17222b]/50 text-gray-400 hover:text-white hover:bg-[#17222b] transition-all cursor-pointer"
          title="Upload PDF"
          disabled={isUploading || isProcessing || isPreviewing}
        >
          {isUploading ? (
            <Loader2 size={20} className="animate-spin text-[#00b4d8]" />
          ) : (
            <FileUp size={20} />
          )}
        </button>
        <button 
          onClick={handleSelectAll}
          className="p-3 rounded-xl text-gray-400 hover:text-white hover:bg-[#17222b] transition-all cursor-pointer"
          title="Select All"
          disabled={pdfPages.length === 0}
        >
          <LayoutGrid size={20} />
        </button>
        
        {/* Preview Button */}
        <button 
          onClick={handlePreview}
          className={`p-3 rounded-xl transition-all cursor-pointer relative ${
            selectedPages.length > 0 && !isPreviewing && !isProcessing
              ? 'bg-[#17222b] text-[#00b4d8] border border-[#00b4d8]/40 hover:bg-[#1e2d3b] hover:text-[#00c5eb]' 
              : 'text-gray-600 bg-gray-900/20 cursor-not-allowed border border-transparent'
          }`}
          title="Preview Selected Pages"
          disabled={selectedPages.length === 0 || isPreviewing || isProcessing}
        >
          {isPreviewing ? (
            <Loader2 size={20} className="animate-spin" />
          ) : (
            <Eye size={20} />
          )}
        </button>

        <button 
          onClick={handleDownload}
          className={`p-3 rounded-xl transition-all cursor-pointer relative ${
            selectedPages.length > 0 && !isProcessing && !isPreviewing
              ? 'bg-[#00b4d8] text-black shadow-lg shadow-[#00b4d8]/20 hover:bg-[#0096b4]' 
              : 'text-gray-600 bg-gray-900/20 cursor-not-allowed'
          }`}
          title="Download Extracted PDF"
          disabled={selectedPages.length === 0 || isProcessing || isPreviewing}
        >
          {isProcessing ? (
            <Loader2 size={20} className="animate-spin" />
          ) : (
            <Download size={20} />
          )}
          {selectedPages.length > 0 && !isProcessing && (
            <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-black rounded-full ring-2 ring-[#00b4d8]" />
          )}
        </button>
      </div>

      {/* 5. PDF Preview Modal Overlay */}
      {previewUrl && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-6">
          <div className="bg-[#0c141c] border border-[#1f2e3d] w-full max-w-4xl h-[85vh] rounded-2xl overflow-hidden flex flex-col shadow-2xl">
            {/* Modal Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-[#17222b]">
              <div>
                <h3 className="text-lg font-bold text-white">{previewTitle}</h3>
                {previewSubtitle && <p className="text-xs text-gray-400">{previewSubtitle}</p>}
              </div>
              <button 
                onClick={closePreview}
                className="p-2 text-gray-400 hover:text-white hover:bg-[#17222b] rounded-xl transition-all cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>
            {/* Modal Body */}
            <div className="flex-1 bg-[#070b0e] relative">
              <iframe 
                src={`${previewUrl}#toolbar=0`} 
                className="w-full h-full border-0" 
                title="PDF Preview"
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}