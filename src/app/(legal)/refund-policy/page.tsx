'use client';

import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function RefundPolicyPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-bold text-white mb-8">Refund Policy</h1>
        
        <div className="prose prose-invert max-w-none">
          <p className="text-gray-400 mb-6">Last updated: January 2025</p>
          
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">1. Refund Eligibility</h2>
            <p className="text-gray-300 mb-4">
              We want you to be satisfied with your purchase. Refunds may be requested under the following conditions:
            </p>
            <ul className="list-disc list-inside text-gray-300 space-y-2">
              <li>Request made within 24 hours of purchase</li>
              <li>No significant usage of premium features</li>
              <li>Technical issues preventing access to the service</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">2. Non-Refundable Cases</h2>
            <p className="text-gray-300 mb-4">Refunds will not be provided in the following cases:</p>
            <ul className="list-disc list-inside text-gray-300 space-y-2">
              <li>Request made after 24 hours of purchase</li>
              <li>Significant usage of premium features has occurred</li>
              <li>Violation of our Terms of Service</li>
              <li>Change of mind after accessing premium content</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">3. How to Request a Refund</h2>
            <p className="text-gray-300 mb-4">To request a refund:</p>
            <ol className="list-decimal list-inside text-gray-300 space-y-2">
              <li>Email us at support@oahelper.in with your registered email</li>
              <li>Include your transaction ID and reason for refund</li>
              <li>We will review your request within 2-3 business days</li>
            </ol>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">4. Refund Processing</h2>
            <p className="text-gray-300">
              Approved refunds will be processed within 5-7 business days. The refund will be 
              credited to the original payment method used for the purchase.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">5. Contact Us</h2>
            <p className="text-gray-300">
              For any questions about our refund policy, please contact us at{' '}
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
