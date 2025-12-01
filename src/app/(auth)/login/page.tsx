'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FaSpinner, FaArrowLeft, FaEnvelope, FaLock } from 'react-icons/fa';
import { useAuth } from '@/contexts/AuthContext';
import { API_ENDPOINTS, getApiHeaders } from '@/config/api';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await fetch(API_ENDPOINTS.LOGIN, {
        method: 'POST',
        headers: getApiHeaders(),
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (data.status === 'success') {
        const loginSuccess = await login(data.user);
        if (loginSuccess) {
          setSuccess('Login successful! Redirecting...');
          setTimeout(() => router.push('/'), 1500);
        } else {
          setError('This email address has been banned from the platform.');
        }
      } else {
        setError(data.message || 'Login failed');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white relative overflow-hidden">
      {/* Grid Background */}
      <div
        className="absolute inset-0 pointer-events-none opacity-25"
        style={{
          backgroundImage: `
            linear-gradient(90deg, rgba(148,163,184,0.4) 1px, transparent 1px),
            linear-gradient(rgba(148,163,184,0.4) 1px, transparent 1px)
          `,
          backgroundSize: '45px 45px',
          maskImage: 'linear-gradient(-20deg, transparent 50%, white)',
          WebkitMaskImage: 'linear-gradient(-20deg, transparent 50%, white)',
          zIndex: 1
        }}
      />

      {/* Back Button */}
      <button
        onClick={() => router.push('/')}
        className="absolute top-6 left-6 z-20 flex items-center space-x-2 text-gray-400 hover:text-white transition-colors group"
      >
        <FaArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        <span className="text-sm font-medium">Back to Home</span>
      </button>

      <div className="relative z-10 bg-[#111] p-8 md:p-10 rounded-[2.5rem] border border-white/10 max-w-md w-full mx-4 shadow-2xl">
        <div className="text-center mb-8">
          <h2 className="text-3xl md:text-4xl font-normal text-white mb-3 tracking-tight">Welcome Back</h2>
          <p className="text-gray-400 text-sm font-light">Sign in to your account</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl mb-6 text-sm text-center">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-xl mb-6 text-sm text-center">
            {success}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-gray-400 text-xs font-medium mb-2 uppercase tracking-wider">Email Address</label>
            <div className="relative">
              <FaEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="email"
                autoComplete="email"
                className="w-full pl-10 pr-4 py-4 bg-[#0A0A0A] text-white rounded-xl border border-white/10 focus:border-white/30 focus:ring-0 focus:outline-none transition-colors placeholder-gray-600"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@gmail.com"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-gray-400 text-xs font-medium mb-2 uppercase tracking-wider">Password</label>
            <div className="relative">
              <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="password"
                autoComplete="current-password"
                className="w-full pl-10 pr-4 py-4 bg-[#0A0A0A] text-white rounded-xl border border-white/10 focus:border-white/30 focus:ring-0 focus:outline-none transition-colors placeholder-gray-600"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                required
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-white text-black hover:bg-gray-200 disabled:bg-gray-200 disabled:cursor-not-allowed font-bold py-4 px-6 rounded-full transition-all transform hover:scale-[1.02]"
            >
              {loading ? (
                <>
                  <FaSpinner className="animate-spin mr-2 inline" />
                  Signing In...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </div>
        </form>

        <div className="mt-8 text-center space-y-4">
          <Link
            href="/forgot-password"
            className="block text-gray-400 hover:text-white transition-colors text-sm font-light"
          >
            Forgot your password?
          </Link>

          <p className="text-gray-500 text-sm font-light">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="text-white font-medium hover:underline transition-colors">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
