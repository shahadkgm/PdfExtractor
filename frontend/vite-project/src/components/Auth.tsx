import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { FileText, Loader2, Eye, EyeOff, AlertCircle, CheckCircle2, Lock, Mail } from 'lucide-react';
import { isAxiosError } from 'axios';
import { authService } from '../services/authService';

interface AuthProps {
  onAuthSuccess: (token: string, email: string) => void;
}

interface ValidationErrors {
  email?: string;
  password?: string;
  confirmPassword?: string;
}

export const Auth: React.FC<AuthProps> = ({ onAuthSuccess }) => {
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authEmail, setAuthEmail] = useState<string>('');
  const [authPassword, setAuthPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');

  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);

  const [touched, setTouched] = useState<{ email?: boolean; password?: boolean; confirmPassword?: boolean }>({});
  const [fieldErrors, setFieldErrors] = useState<ValidationErrors>({});
  const [generalError, setGeneralError] = useState<string>('');

  const validateEmail = (email: string): string | undefined => {
    const trimmed = email.trim();
    if (!trimmed) {
      return 'Email address is required.';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      return 'Please enter a valid email address.';
    }
    if (trimmed.length > 254) {
      return 'Email address is too long.';
    }
    return undefined;
  };

  const validatePassword = (password: string, mode: 'login' | 'register'): string | undefined => {
    if (!password) {
      return 'Password is required.';
    }
    if (mode === 'register') {
      if (password.trim().length < 6) {
        return 'Password must be at least 6 characters long.';
      }
      if (password.length > 72) {
        return 'Password cannot exceed 72 characters.';
      }
    }
    return undefined;
  };

  const validateConfirmPassword = (confirmPass: string, pass: string, mode: 'login' | 'register'): string | undefined => {
    if (mode === 'register') {
      if (!confirmPass) {
        return 'Please confirm your password.';
      }
      if (confirmPass !== pass) {
        return 'Passwords do not match.';
      }
    }
    return undefined;
  };

  const calculatePasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: '', color: 'bg-gray-700' };
    let score = 0;
    if (pass.length >= 6) score += 1;
    if (pass.length >= 10) score += 1;
    if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass) || /[^A-Za-z0-9]/.test(pass)) score += 1;

    if (score <= 1) return { score: 1, label: 'Weak', color: 'bg-red-500' };
    if (score === 2) return { score: 2, label: 'Fair', color: 'bg-amber-500' };
    if (score === 3) return { score: 3, label: 'Good', color: 'bg-blue-400' };
    return { score: 4, label: 'Strong', color: 'bg-emerald-500' };
  };

  const passwordStrength = calculatePasswordStrength(authPassword);

  const validateAll = (): boolean => {
    const emailErr = validateEmail(authEmail);
    const passErr = validatePassword(authPassword, authMode);
    const confirmPassErr = validateConfirmPassword(confirmPassword, authPassword, authMode);

    const errors: ValidationErrors = {
      email: emailErr,
      password: passErr,
      confirmPassword: confirmPassErr,
    };

    setFieldErrors(errors);
    setTouched({ email: true, password: true, confirmPassword: true });

    return !emailErr && !passErr && !confirmPassErr;
  };

  const authMutation = useMutation({
    mutationFn: async () => {
      const cleanEmail = authEmail.trim();
      if (authMode === 'login') {
        return await authService.login(cleanEmail, authPassword);
      } else {
        return await authService.register(cleanEmail, authPassword);
      }
    },
    onSuccess: (data) => {
      setAuthEmail('');
      setAuthPassword('');
      setConfirmPassword('');
      setFieldErrors({});
      setTouched({});
      setGeneralError('');
      authMutation.reset();
      onAuthSuccess(data.token, data.email);
    },
  });

  const handleBlur = (field: 'email' | 'password' | 'confirmPassword') => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    if (field === 'email') {
      setFieldErrors((prev) => ({ ...prev, email: validateEmail(authEmail) }));
    } else if (field === 'password') {
      setFieldErrors((prev) => ({
        ...prev,
        password: validatePassword(authPassword, authMode),
        ...(authMode === 'register' && touched.confirmPassword
          ? { confirmPassword: validateConfirmPassword(confirmPassword, authPassword, authMode) }
          : {}),
      }));
    } else if (field === 'confirmPassword') {
      setFieldErrors((prev) => ({
        ...prev,
        confirmPassword: validateConfirmPassword(confirmPassword, authPassword, authMode),
      }));
    }
  };

  const handleAuthSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    setGeneralError('');

    const isValid = validateAll();
    if (!isValid) return;

    authMutation.mutate();
  };

  const handleModeSwitch = () => {
    setAuthMode(authMode === 'login' ? 'register' : 'login');
    authMutation.reset();
    setAuthEmail('');
    setAuthPassword('');
    setConfirmPassword('');
    setFieldErrors({});
    setTouched({});
    setGeneralError('');
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  const backendError = authMutation.error
    ? (isAxiosError(authMutation.error) ? authMutation.error.response?.data?.error : authMutation.error.message) ||
      authMutation.error.message
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
            {authMode === 'login' ? 'Login to your account' : 'Create a new account'}
          </p>
        </div>

        {generalError ? (
          <div className="p-3.5 bg-red-950/30 border border-red-900/50 rounded-xl text-red-400 text-xs font-semibold flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0" />
            <span>{generalError}</span>
          </div>
        ) : backendError ? (
          <div className="p-3.5 bg-red-950/30 border border-red-900/50 rounded-xl text-red-400 text-xs font-semibold flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0" />
            <span>{backendError}</span>
          </div>
        ) : null}

        <form onSubmit={handleAuthSubmit} noValidate className="space-y-4">
          {/* Email Field */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black tracking-widest text-gray-400 uppercase flex items-center gap-1.5">
              <Mail size={12} className="text-[#00b4d8]" />
              Email Address
            </label>
            <div className="relative">
              <input
                type="email"
                value={authEmail}
                onChange={(e) => {
                  setAuthEmail(e.target.value);
                  if (touched.email) {
                    setFieldErrors((prev) => ({ ...prev, email: validateEmail(e.target.value) }));
                  }
                }}
                onBlur={() => handleBlur('email')}
                placeholder="you@example.com"
                className={`w-full bg-[#070b0e] border rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none transition-colors ${
                  touched.email && fieldErrors.email
                    ? 'border-red-500/80 focus:border-red-500'
                    : 'border-[#17222b] focus:border-[#00b4d8]'
                }`}
              />
            </div>
            {touched.email && fieldErrors.email && (
              <p className="text-[11px] text-red-400 flex items-center gap-1 mt-1 pl-1">
                <AlertCircle size={12} className="shrink-0" />
                {fieldErrors.email}
              </p>
            )}
          </div>

          {/* Password Field */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black tracking-widest text-gray-400 uppercase flex items-center gap-1.5">
              <Lock size={12} className="text-[#00b4d8]" />
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={authPassword}
                onChange={(e) => {
                  setAuthPassword(e.target.value);
                  if (touched.password) {
                    setFieldErrors((prev) => ({
                      ...prev,
                      password: validatePassword(e.target.value, authMode),
                      ...(authMode === 'register' && touched.confirmPassword
                        ? { confirmPassword: validateConfirmPassword(confirmPassword, e.target.value, authMode) }
                        : {}),
                    }));
                  }
                }}
                onBlur={() => handleBlur('password')}
                placeholder="••••••••"
                className={`w-full bg-[#070b0e] border rounded-xl pl-4 pr-11 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none transition-colors ${
                  touched.password && fieldErrors.password
                    ? 'border-red-500/80 focus:border-red-500'
                    : 'border-[#17222b] focus:border-[#00b4d8]'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors cursor-pointer"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {touched.password && fieldErrors.password && (
              <p className="text-[11px] text-red-400 flex items-center gap-1 mt-1 pl-1">
                <AlertCircle size={12} className="shrink-0" />
                {fieldErrors.password}
              </p>
            )}

            {/* Password strength meter for registration mode */}
            {authMode === 'register' && authPassword.length > 0 && (
              <div className="pt-1.5 space-y-1">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-gray-500">Strength:</span>
                  <span
                    className={`font-semibold ${
                      passwordStrength.score === 1
                        ? 'text-red-400'
                        : passwordStrength.score === 2
                        ? 'text-amber-400'
                        : passwordStrength.score === 3
                        ? 'text-blue-400'
                        : 'text-emerald-400'
                    }`}
                  >
                    {passwordStrength.label}
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-1.5 h-1">
                  {[1, 2, 3, 4].map((step) => (
                    <div
                      key={step}
                      className={`h-full rounded-full transition-all duration-300 ${
                        step <= passwordStrength.score ? passwordStrength.color : 'bg-gray-800'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-[10px] text-gray-500 pt-0.5">
                  Must be at least 6 characters (mix letters and numbers for better security)
                </p>
              </div>
            )}
          </div>

          {/* Confirm Password Field (Register mode only) */}
          {authMode === 'register' && (
            <div className="space-y-1.5">
              <label className="text-[10px] font-black tracking-widest text-gray-400 uppercase flex items-center gap-1.5">
                <Lock size={12} className="text-[#00b4d8]" />
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (touched.confirmPassword) {
                      setFieldErrors((prev) => ({
                        ...prev,
                        confirmPassword: validateConfirmPassword(e.target.value, authPassword, authMode),
                      }));
                    }
                  }}
                  onBlur={() => handleBlur('confirmPassword')}
                  placeholder="••••••••"
                  className={`w-full bg-[#070b0e] border rounded-xl pl-4 pr-11 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none transition-colors ${
                    touched.confirmPassword && fieldErrors.confirmPassword
                      ? 'border-red-500/80 focus:border-red-500'
                      : touched.confirmPassword && confirmPassword && !fieldErrors.confirmPassword
                      ? 'border-emerald-500/60 focus:border-emerald-500'
                      : 'border-[#17222b] focus:border-[#00b4d8]'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  tabIndex={-1}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors cursor-pointer"
                  title={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {touched.confirmPassword && fieldErrors.confirmPassword ? (
                <p className="text-[11px] text-red-400 flex items-center gap-1 mt-1 pl-1">
                  <AlertCircle size={12} className="shrink-0" />
                  {fieldErrors.confirmPassword}
                </p>
              ) : touched.confirmPassword && confirmPassword && !fieldErrors.confirmPassword ? (
                <p className="text-[11px] text-emerald-400 flex items-center gap-1 mt-1 pl-1">
                  <CheckCircle2 size={12} className="shrink-0" />
                  Passwords match
                </p>
              ) : null}
            </div>
          )}

          <button
            type="submit"
            disabled={isAuthLoading}
            className="w-full mt-2 py-3 bg-[#00b4d8] hover:bg-[#0096b4] text-black font-bold rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-wait shadow-lg shadow-[#00b4d8]/10"
          >
            {isAuthLoading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : authMode === 'login' ? (
              'Login'
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        <div className="text-center pt-1">
          <button
            type="button"
            onClick={handleModeSwitch}
            className="text-xs text-[#00b4d8] hover:text-[#0096b4] font-semibold transition-colors cursor-pointer"
          >
            {authMode === 'login' ? "Don't have an account? Register" : 'Already have an account? Login'}
          </button>
        </div>
      </div>
    </div>
  );
};

