'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FaCrown, FaCheck, FaArrowLeft, FaSpinner } from 'react-icons/fa';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useAuth } from '@/contexts/AuthContext';
import { usePremium } from '@/contexts/PremiumContext';

interface Plan {
  id: string;
  name: string;
  price: number;
  duration: string;
  features: string[];
  popular?: boolean;
}

const plans: Plan[] = [
  {
    id: 'weekly',
    name: 'Weekly',
    price: 49,
    duration: '7 days',
    features: [
      'Access to all questions',
      'Detailed solutions',
      'Company insights',
      'Priority support'
    ]
  },
  {
    id: 'monthly',
    name: 'Monthly',
    price: 149,
    duration: '30 days',
    features: [
      'Access to all questions',
      'Detailed solutions',
      'Company insights',
      'Priority support',
      'Request new companies',
      'Early access to new features'
    ],
    popular: true
  },
  {
    id: 'quarterly',
    name: 'Quarterly',
    price: 349,
    duration: '90 days',
    features: [
      'Access to all questions',
      'Detailed solutions',
      'Company insights',
      'Priority support',
      'Request new companies',
      'Early access to new features',
      'Exclusive Discord access'
    ]
  }
];

export default function PremiumPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const { is_premium } = usePremium();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSelectPlan = (planId: string) => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }
    setSelectedPlan(planId);
  };

  const handlePurchase = async () => {
    if (!selectedPlan || !isAuthenticated()) return;
    
    setLoading(true);
    // Redirect to payment page with selected plan
    router.push(`/payment?plan=${selectedPlan}`);
  };

  if (is_premium) {
    return (
      <div className="min-h-screen bg-black text-white">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-20 text-center">
          <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <FaCrown className="text-4xl text-green-400" />
          </div>
          <h1 className="text-4xl font-bold mb-4">You&apos;re Already Premium!</h1>
          <p className="text-gray-400 text-lg mb-8">
            You have full access to all premium features. Enjoy!
          </p>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-8 py-3 bg-white text-black rounded-full font-bold hover:bg-gray-200"
          >
            Go to Dashboard
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="flex items-center space-x-2 text-gray-400 hover:text-white mb-8 transition-colors"
        >
          <FaArrowLeft />
          <span>Back</span>
        </button>

        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center space-x-2 px-4 py-2 bg-yellow-500/10 border border-yellow-500/20 rounded-full mb-6">
            <FaCrown className="text-yellow-400" />
            <span className="text-yellow-300 text-sm font-medium">Premium Plans</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Unlock Your Full Potential
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Get unlimited access to all questions, detailed solutions, and exclusive features
          </p>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {plans.map((plan) => (
            <div
              key={plan.id}
              onClick={() => handleSelectPlan(plan.id)}
              className={`relative bg-[#111] border rounded-2xl p-8 cursor-pointer transition-all ${
                selectedPlan === plan.id
                  ? 'border-yellow-500 ring-2 ring-yellow-500/20'
                  : plan.popular
                  ? 'border-yellow-500/30'
                  : 'border-white/10 hover:border-white/20'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="px-4 py-1 bg-yellow-500 text-black text-xs font-bold rounded-full">
                    MOST POPULAR
                  </span>
                </div>
              )}

              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
                <div className="flex items-baseline justify-center">
                  <span className="text-4xl font-bold text-white">₹{plan.price}</span>
                  <span className="text-gray-400 ml-2">/ {plan.duration}</span>
                </div>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-center space-x-3 text-gray-300">
                    <FaCheck className="text-green-400 text-sm flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                className={`w-full py-3 rounded-full font-bold transition-all ${
                  selectedPlan === plan.id
                    ? 'bg-yellow-500 text-black'
                    : 'bg-white/5 text-white border border-white/10 hover:bg-white/10'
                }`}
              >
                {selectedPlan === plan.id ? 'Selected' : 'Select Plan'}
              </button>
            </div>
          ))}
        </div>

        {/* Purchase Button */}
        {selectedPlan && (
          <div className="text-center">
            <button
              onClick={handlePurchase}
              disabled={loading}
              className="px-12 py-4 bg-yellow-500 text-black rounded-full font-bold text-lg hover:bg-yellow-400 transition-colors disabled:opacity-50"
            >
              {loading ? (
                <>
                  <FaSpinner className="animate-spin mr-2 inline" />
                  Processing...
                </>
              ) : (
                `Continue with ${plans.find(p => p.id === selectedPlan)?.name} Plan`
              )}
            </button>
          </div>
        )}

        {/* Trust Badges */}
        <div className="mt-16 text-center">
          <p className="text-gray-500 text-sm mb-4">Trusted by thousands of students</p>
          <div className="flex items-center justify-center space-x-8 text-gray-400">
            <div className="text-center">
              <p className="text-2xl font-bold text-white">10,000+</p>
              <p className="text-xs">Active Users</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-white">500+</p>
              <p className="text-xs">Companies</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-white">2,000+</p>
              <p className="text-xs">Questions</p>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
