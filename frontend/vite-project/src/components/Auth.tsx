import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { FileText, Loader2 } from 'lucide-react';
import { isAxiosError } from 'axios';
import { authService } from '../services/authService';

interface AuthProps {
  onAuthSuccess: (token: string, email: string) => void;
}

export const Auth: React.FC<AuthProps> = ({ onAuthSuccess }) => {
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authEmail, setAuthEmail] = useState<string>('');
  const [authPassword, setAuthPassword] = useState<string>('');

  const authMutation = useMutation({
    mutationFn: async () => {
      if (authMode === 'login') {
        return await authService.login(authEmail, authPassword);
      } else {
        return await authService.register(authEmail, authPassword);
      }
    },
    onSuccess: (data) => {
      setAuthEmail('');
      setAuthPassword('');
      authMutation.reset();
      onAuthSuccess(data.token, data.email);
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
            type="button"
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
};
