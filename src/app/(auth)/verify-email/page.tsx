'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { FaSpinner, FaArrowLeft, FaEnvelope, FaCheck } from 'react-icons/fa';
import { useAuth } from '@/contexts/AuthContext';
import { API_ENDPOINTS, getApiHeaders } from '@/config/api';

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();

  const email = searchParams.get('email') || '';
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await fetch(API_ENDPOINTS.VERIFY_CODE, {
        method: 'POST',
        headers: getApiHeaders(),
        body: JSON.stringify({ email, code })
      });
      const data = await response.json();

      if (data.status === 'success') {
        setSuccess('Email verified successfully! Redirecting...');
        if (data.user) {
          await login(data.user);
        }
        setTimeout(() => router.push('/'), 1500);
      } else {
        setError(data.message || 'Verification failed');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError('');
    setSuccess('');
    setResending(true);

    try {
      const response = await fetch('/api/auth/resend-code', {
        method: 'POST',
        headers: getApiHeaders(),
        body: JSON.stringify({ email })
      });
      const data = await response.json();

      if (data.status === 'success') {
        setSuccess('Verification code resent! Check your email.');
      } else {
        setError(data.message || 'Failed to resend code');
      }
    } catch (err) {
      setError('Failed to resend code. Please try again.');
    } finally {
      setResending(false);
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
        onClick={() => router.push('/signup')}
        className="absolute top-6 left-6 z-20 flex items-center space-x-2 text-gray-400 hover:text-white transition-colors group"
      >
        <FaArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        <span className="text-sm font-medium">Back to Signup</span>
      </button>

      <div className="relative z-10 bg-[#111] p-8 md:p-10 rounded-[2.5rem] border border-white/10 max-w-md w-full mx-4 shadow-2xl">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <FaEnvelope className="text-2xl text-blue-400" />
          </div>
          <h2 className="text-3xl font-normal text-white mb-3 tracking-tight">Verify Your Email</h2>
          <p className="text-gray-400 text-sm font-light">
            We&apos;ve sent a verification code to<br />
            <span className="text-white font-medium">{email}</span>
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl mb-6 text-sm text-center">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-xl mb-6 text-sm text-center flex items-center justify-center space-x-2">
            <FaCheck />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleVerify} className="space-y-5">
          <div>
            <label className="block text-gray-400 text-xs font-medium mb-2 uppercase tracking-wider">Verification Code</label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full px-4 py-4 bg-[#0A0A0A] text-white rounded-xl border border-white/10 focus:border-white/30 focus:ring-0 focus:outline-none transition-colors text-center text-2xl tracking-widest"
              placeholder="000000"
              maxLength={6}
              required
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading || code.length < 6}
              className="w-full bg-white text-black hover:bg-gray-200 disabled:bg-gray-200 disabled:cursor-not-allowed font-bold py-4 px-6 rounded-full transition-all"
            >
              {loading ? (
                <>
                  <FaSpinner className="animate-spin mr-2 inline" />
                  Verifying...
                </>
              ) : (
                'Verify Email'
              )}
            </button>
          </div>
        </form>

        <div className="mt-8 text-center">
          <p className="text-gray-500 text-sm font-light mb-4">
            Didn&apos;t receive the code?
          </p>
          <button
            onClick={handleResend}
            disabled={resending}
            className="text-white font-medium hover:underline transition-colors disabled:opacity-50"
          >
            {resending ? 'Sending...' : 'Resend Code'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-black">
        <FaSpinner className="animate-spin text-4xl text-gray-500" />
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
