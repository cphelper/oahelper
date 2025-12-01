'use client';

import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-bold text-white mb-8">Terms of Service</h1>
        
        <div className="prose prose-invert max-w-none">
          <p className="text-gray-400 mb-6">Last updated: January 2025</p>
          
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">1. Acceptance of Terms</h2>
            <p className="text-gray-300">
              By accessing and using OAHelper, you accept and agree to be bound by the terms and 
              provisions of this agreement. If you do not agree to these terms, please do not use our service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">2. Use of Service</h2>
            <p className="text-gray-300 mb-4">You agree to use OAHelper only for lawful purposes and in accordance with these Terms. You agree not to:</p>
            <ul className="list-disc list-inside text-gray-300 space-y-2">
              <li>Use the service in any way that violates any applicable law or regulation</li>
              <li>Share your account credentials with others</li>
              <li>Attempt to gain unauthorized access to any part of the service</li>
              <li>Redistribute or resell any content from the platform</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">3. User Accounts</h2>
            <p className="text-gray-300">
              You are responsible for maintaining the confidentiality of your account and password. 
              You agree to accept responsibility for all activities that occur under your account.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">4. Intellectual Property</h2>
            <p className="text-gray-300">
              The content on OAHelper, including text, graphics, logos, and software, is the property 
              of OAHelper or its content suppliers and is protected by intellectual property laws.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">5. Disclaimer</h2>
            <p className="text-gray-300">
              OAHelper is an independent educational platform. We do not guarantee that using our 
              service will result in any specific outcome. The questions and solutions provided are 
              for educational purposes only.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">6. Contact</h2>
            <p className="text-gray-300">
              For any questions regarding these Terms, please contact us at{' '}
              <a href="mailto:support@oahelper.in" className="text-blue-400 hover:underline">
                support@oahelper.in
              </a>
            </p>
          </section>
        </div>
      </div>

      <Footer />
    </div>
  );
}
