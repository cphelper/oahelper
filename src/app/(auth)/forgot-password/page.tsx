'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FaSpinner, FaArrowLeft, FaEnvelope, FaCheck } from 'react-icons/fa';
import { API_ENDPOINTS, getApiHeaders } from '@/config/api';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: getApiHeaders(),
        body: JSON.stringify({ email })
      });
      const data = await response.json();

      if (data.status === 'success') {
        setSuccess('Password reset link sent! Check your email.');
        setSent(true);
      } else {
        setError(data.message || 'Failed to send reset link');
      }
    } catch (err) {
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
        onClick={() => router.push('/login')}
        className="absolute top-6 left-6 z-20 flex items-center space-x-2 text-gray-400 hover:text-white transition-colors group"
      >
        <FaArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        <span className="text-sm font-medium">Back to Login</span>
      </button>

      <div className="relative z-10 bg-[#111] p-8 md:p-10 rounded-[2.5rem] border border-white/10 max-w-md w-full mx-4 shadow-2xl">
        {sent ? (
          <div className="text-center">
            <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaCheck className="text-2xl text-green-400" />
            </div>
            <h2 className="text-3xl font-normal text-white mb-3 tracking-tight">Check Your Email</h2>
            <p className="text-gray-400 text-sm font-light mb-8">
              We&apos;ve sent a password reset link to<br />
              <span className="text-white font-medium">{email}</span>
            </p>
            <Link
              href="/login"
              className="inline-block px-8 py-3 bg-white text-black rounded-full font-bold hover:bg-gray-200 transition-colors"
            >
              Back to Login
            </Link>
          </div>
        ) : (
          <>
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaEnvelope className="text-2xl text-blue-400" />
              </div>
              <h2 className="text-3xl font-normal text-white mb-3 tracking-tight">Forgot Password?</h2>
              <p className="text-gray-400 text-sm font-light">
                Enter your email and we&apos;ll send you a reset link
              </p>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl mb-6 text-sm text-center">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-gray-400 text-xs font-medium mb-2 uppercase tracking-wider">Email Address</label>
                <div className="relative">
                  <FaEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-4 bg-[#0A0A0A] text-white rounded-xl border border-white/10 focus:border-white/30 focus:ring-0 focus:outline-none transition-colors"
                    placeholder="your@gmail.com"
                    required
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-white text-black hover:bg-gray-200 disabled:bg-gray-200 disabled:cursor-not-allowed font-bold py-4 px-6 rounded-full transition-all"
                >
                  {loading ? (
                    <>
                      <FaSpinner className="animate-spin mr-2 inline" />
                      Sending...
                    </>
                  ) : (
                    'Send Reset Link'
                  )}
                </button>
              </div>
            </form>

            <p className="text-center text-gray-500 text-sm mt-8 font-light">
              Remember your password?{' '}
              <Link href="/login" className="text-white font-medium hover:underline">
                Login here
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
