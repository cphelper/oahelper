'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FaUserCircle, FaCheck, FaSpinner, FaCrown, FaCalendar, FaRupeeSign, FaExclamationCircle } from 'react-icons/fa';
import Navbar from '@/components/Navbar';
import ProfileAvatar from '@/components/ProfileAvatar';
import { useAuth } from '@/contexts/AuthContext';
import { usePremium } from '@/contexts/PremiumContext';
import { API_ENDPOINTS, getApiHeaders } from '@/config/api';

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const { is_premium, subscription, loading: premiumLoading } = usePremium();

  const [userProfile, setUserProfile] = useState({ name: '', email: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('profile');

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    if (user) {
      setUserProfile({ name: user.name || '', email: user.email || '' });
    }
  }, [user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await fetch(API_ENDPOINTS.UPDATE_PROFILE, {
        method: 'POST',
        headers: getApiHeaders(),
        body: JSON.stringify({
          action: 'update_profile',
          name: userProfile.name,
          user_id: user?.id,
        }),
      });

      const data = await response.json();

      if (data.status === 'success') {
        setSuccess('Profile updated successfully!');
      } else {
        setError(data.message || 'Failed to update profile.');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated()) {
    return null;
  }

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      <Navbar />

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <ProfileAvatar name={user?.name || ''} size="xl" className="shadow-2xl ring-1 ring-white/10" />
          </div>
          <h1 className="text-5xl font-medium tracking-tight text-white mb-3">{user?.name}</h1>
          <p className="text-zinc-400 text-xl font-light">{user?.email}</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-12">
          <div className="inline-flex p-1.5 bg-zinc-900/50 backdrop-blur-xl border border-white/5 rounded-full">
            {[
              { id: 'profile', label: 'Profile', icon: FaUserCircle },
              { id: 'subscription', label: 'Premium', icon: FaCrown },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-6 py-2.5 rounded-full transition-all text-sm font-medium ${
                  activeTab === tab.id
                    ? 'bg-white text-black shadow-lg'
                    : 'text-zinc-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <tab.icon className={activeTab === tab.id ? 'text-black' : ''} />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="max-w-3xl mx-auto">
          <div className="bg-[#0A0A0A] border border-white/10 rounded-[2.5rem] p-8 md:p-10 shadow-2xl">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-2xl mb-6 text-sm font-medium flex items-center">
                <FaExclamationCircle className="mr-2" /> {error}
              </div>
            )}

            {success && (
              <div className="bg-green-500/10 border border-green-500/20 text-green-400 px-4 py-3 rounded-2xl mb-6 text-sm font-medium flex items-center">
                <FaCheck className="mr-2" /> {success}
              </div>
            )}

            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <form onSubmit={handleUpdateProfile} className="space-y-8">
                <div className="flex items-center space-x-5 mb-8 border-b border-white/5 pb-8">
                  <ProfileAvatar name={userProfile.name || user?.name || ''} size="lg" />
                  <div>
                    <h2 className="text-2xl font-medium text-white tracking-tight">Update Profile</h2>
                    <p className="text-zinc-500 mt-1">Customize your account information</p>
                  </div>
                </div>

                <div>
                  <label className="block text-zinc-400 text-sm font-medium mb-3 ml-1">Display Name</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <FaUserCircle className="text-zinc-500 group-focus-within:text-white transition-colors" />
                    </div>
                    <input
                      type="text"
                      value={userProfile.name}
                      onChange={(e) => setUserProfile({ ...userProfile, name: e.target.value })}
                      className="bg-zinc-900/50 border border-white/10 text-white rounded-2xl pl-11 pr-4 py-4 w-full focus:outline-none focus:ring-2 focus:ring-white/20 transition-all"
                      placeholder="Your Name"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-white text-black hover:bg-zinc-200 disabled:bg-zinc-800 disabled:text-zinc-500 font-medium py-4 px-6 rounded-full transition-all flex items-center justify-center space-x-2"
                >
                  {loading ? (
                    <>
                      <FaSpinner className="animate-spin" />
                      <span>Updating...</span>
                    </>
                  ) : (
                    <span>Save Changes</span>
                  )}
                </button>
              </form>
            )}

            {/* Subscription Tab */}
            {activeTab === 'subscription' && (
              <div className="space-y-8">
                <div className="border-b border-white/5 pb-8">
                  <h2 className="text-2xl font-medium text-white tracking-tight">Subscription Status</h2>
                  <p className="text-zinc-500 mt-1">Manage your premium access</p>
                </div>

                {premiumLoading ? (
                  <div className="text-center py-12">
                    <FaSpinner className="animate-spin text-2xl mx-auto mb-4 text-zinc-500" />
                    <p className="text-zinc-500">Checking status...</p>
                  </div>
                ) : (
                  <div className={`p-8 rounded-[2rem] border transition-all ${
                    is_premium ? 'bg-zinc-900/30 border-green-500/20' : 'bg-zinc-900/30 border-white/10'
                  }`}>
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex items-center space-x-4">
                        <div className={`p-3 rounded-2xl ${is_premium ? 'bg-green-500/10' : 'bg-white/5'}`}>
                          <FaCrown className={`text-2xl ${is_premium ? 'text-green-400' : 'text-zinc-400'}`} />
                        </div>
                        <div>
                          <h3 className="text-xl font-medium text-white">
                            {is_premium ? 'Premium Plan' : 'Free Plan'}
                          </h3>
                          <p className="text-sm text-zinc-500 mt-1">
                            {is_premium ? 'Unlimited access active' : 'Basic access features'}
                          </p>
                        </div>
                      </div>
                      {is_premium && (
                        <span className="bg-green-500/10 text-green-400 px-3 py-1 rounded-full text-xs font-medium border border-green-500/20">
                          Active
                        </span>
                      )}
                    </div>

                    {is_premium && subscription && (
                      <div className="space-y-3 text-sm text-zinc-400 bg-black/20 p-4 rounded-2xl border border-white/5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <FaCalendar className="text-zinc-500" />
                            <span>Expires</span>
                          </div>
                          <span className="text-white">{new Date(subscription.end_date).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <FaRupeeSign className="text-zinc-500" />
                            <span>Amount Paid</span>
                          </div>
                          <span className="text-white">₹{subscription.amount}</span>
                        </div>
                      </div>
                    )}

                    {!is_premium && (
                      <div className="mt-6">
                        <div className="text-zinc-400 text-sm mb-6 space-y-2">
                          <p>• Unlimited access to all questions</p>
                          <p>• Priority support</p>
                          <p>• Verified answers</p>
                        </div>
                        <button
                          onClick={() => router.push('/premium')}
                          className="w-full bg-white text-black hover:bg-zinc-200 font-medium py-4 px-6 rounded-full transition-all"
                        >
                          View Premium Plans
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
