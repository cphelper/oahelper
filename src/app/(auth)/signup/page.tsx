'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FaUser, FaEnvelope, FaLock, FaSpinner, FaEye, FaEyeSlash, FaArrowLeft, FaShieldAlt } from 'react-icons/fa';
import { useAuth } from '@/contexts/AuthContext';
import { API_ENDPOINTS, getApiHeaders } from '@/config/api';

export default function SignupPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [step, setStep] = useState(1);
  const [emailStatus, setEmailStatus] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    college: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleEmailCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/check-email', {
        method: 'POST',
        headers: getApiHeaders(),
        body: JSON.stringify({ email: formData.email })
      });
      const data = await response.json();

      if (data.status === 'available') {
        setStep(2);
        setEmailStatus(data);
      } else if (data.status === 'exists_verified') {
        setEmailStatus(data);
        setError(data.message);
      } else if (data.status === 'exists_unverified') {
        setEmailStatus(data);
        setError(data.message);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (!formData.college || formData.college.trim() === '') {
      setError('Please enter your college name');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(API_ENDPOINTS.SIGNUP, {
        method: 'POST',
        headers: getApiHeaders(),
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          college: formData.college,
        })
      });
      const data = await response.json();

      if (data.status === 'success') {
        setSuccess(data.message);

        if (data.requires_verification) {
          setTimeout(() => {
            router.push(`/verify-email?email=${encodeURIComponent(formData.email)}`);
          }, 1500);
        } else {
          const loginSuccess = await login(data.user);
          if (loginSuccess) {
            setTimeout(() => router.push('/'), 1500);
          } else {
            setError('This email address has been banned from the platform.');
          }
        }
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white relative overflow-hidden py-8">
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
        <h2 className="text-3xl md:text-4xl font-normal text-white text-center mb-6 tracking-tight">
          {step === 1 ? 'Join OAHelper' : 'Complete Registration'}
        </h2>

        {/* Privacy Notice */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-8">
          <div className="flex items-center justify-center space-x-2 text-gray-300">
            <FaShieldAlt className="w-4 h-4" />
            <span className="text-sm font-medium">Privacy Protected</span>
          </div>
          <p className="text-center text-gray-400 text-xs mt-2 font-light">
            We don&apos;t send promotional emails or share your information
          </p>
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

        {step === 1 ? (
          <form onSubmit={handleEmailCheck} className="space-y-5">
            <div>
              <label className="block text-gray-400 text-xs font-medium mb-2 uppercase tracking-wider">Email Address</label>
              <div className="relative">
                <FaEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-4 py-4 bg-[#0A0A0A] text-white rounded-xl border border-white/10 focus:border-white/30 focus:ring-0 focus:outline-none transition-colors"
                  placeholder="your@gmail.com"
                  required
                />
              </div>
              <p className="text-xs text-gray-600 mt-2 font-light">
                Only Gmail addresses (@gmail.com) are supported
              </p>
            </div>

            {emailStatus?.status === 'exists_verified' && (
              <div className="space-y-3 pt-2">
                <button
                  type="button"
                  onClick={() => router.push('/login')}
                  className="w-full bg-white text-black hover:bg-gray-200 font-bold py-4 px-6 rounded-full transition-all"
                >
                  Go to Login
                </button>
                <button
                  type="button"
                  onClick={() => { setEmailStatus(null); setError(''); setFormData({ ...formData, email: '' }); }}
                  className="w-full bg-transparent text-gray-400 border border-white/10 hover:text-white font-medium py-4 px-6 rounded-full transition-all"
                >
                  Try Different Email
                </button>
              </div>
            )}

            {!emailStatus && (
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-white text-black hover:bg-gray-200 disabled:bg-gray-200 disabled:cursor-not-allowed font-bold py-4 px-6 rounded-full transition-all"
                >
                  {loading ? <><FaSpinner className="animate-spin mr-2 inline" />Checking...</> : 'Continue'}
                </button>
              </div>
            )}
          </form>
        ) : (
          <form onSubmit={handleSignupSubmit} className="space-y-5">
            <div>
              <label className="block text-gray-400 text-xs font-medium mb-2 uppercase tracking-wider">Email</label>
              <div className="relative">
                <FaEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="email"
                  value={formData.email}
                  className="w-full pl-10 pr-16 py-4 bg-[#0A0A0A] text-gray-300 rounded-xl border border-white/10 cursor-not-allowed opacity-60"
                  disabled
                />
                <button
                  type="button"
                  onClick={() => { setStep(1); setEmailStatus(null); setError(''); }}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white text-xs font-medium border border-white/10 px-2 py-1 rounded"
                >
                  Change
                </button>
              </div>
            </div>

            <div>
              <label className="block text-gray-400 text-xs font-medium mb-2 uppercase tracking-wider">Name</label>
              <div className="relative">
                <FaUser className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-4 py-4 bg-[#0A0A0A] text-white rounded-xl border border-white/10 focus:border-white/30 focus:ring-0 focus:outline-none transition-colors"
                  placeholder="Your Name"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-400 text-xs font-medium mb-2 uppercase tracking-wider">College/University</label>
              <input
                type="text"
                name="college"
                value={formData.college}
                onChange={handleInputChange}
                className="w-full px-4 py-4 bg-[#0A0A0A] text-white rounded-xl border border-white/10 focus:border-white/30 focus:ring-0 focus:outline-none transition-colors"
                placeholder="Enter your college name"
                required
              />
            </div>

            <div>
              <label className="block text-gray-400 text-xs font-medium mb-2 uppercase tracking-wider">Password</label>
              <div className="relative">
                <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-10 py-4 bg-[#0A0A0A] text-white rounded-xl border border-white/10 focus:border-white/30 focus:ring-0 focus:outline-none transition-colors"
                  placeholder="********"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-white"
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-gray-400 text-xs font-medium mb-2 uppercase tracking-wider">Confirm Password</label>
              <div className="relative">
                <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type={showPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-10 py-4 bg-[#0A0A0A] text-white rounded-xl border border-white/10 focus:border-white/30 focus:ring-0 focus:outline-none transition-colors"
                  placeholder="********"
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
                {loading ? <><FaSpinner className="animate-spin mr-2 inline" />Creating Account...</> : 'Create Account'}
              </button>
            </div>
          </form>
        )}

        <p className="text-center text-gray-500 text-sm mt-8 font-light">
          Already have an account?{' '}
          <Link href="/login" className="text-white font-medium hover:underline">Login here</Link>
        </p>
      </div>
    </div>
  );
}
