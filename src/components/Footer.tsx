'use client';

import React from 'react';
import Link from 'next/link';
import { FaHeart, FaCopyright } from 'react-icons/fa';

const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-black border-t border-white/10 z-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          {/* Brand Section */}
          <div className="space-y-6">
            <h3 className="text-white font-medium text-xl tracking-tight">OAHelper.in</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Most of the Questions And Solutions on OAHelper are exclusively available here - nowhere else!
            </p>
            <div className="flex items-center space-x-2 text-sm">
              <FaHeart className="text-gray-600" />
              <span className="text-gray-400">Trusted by Thousands Of Students</span>
            </div>
          </div>

          {/* Resources Section */}
          <div className="space-y-6">
            <h3 className="text-white font-medium text-sm uppercase tracking-wider">Resources</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/dsa-sheet" className="text-gray-400 hover:text-white transition-colors text-sm">
                  DSA Sheet
                </Link>
              </li>
              <li>
                <Link href="/placement-data" className="text-gray-400 hover:text-white transition-colors text-sm">
                  Placement Data
                </Link>
              </li>
              <li>
                <Link href="/interview-experiences" className="text-gray-400 hover:text-white transition-colors text-sm">
                  Interview Experiences
                </Link>
              </li>
              <li>
                <Link href="/premium" className="text-gray-400 hover:text-white transition-colors text-sm">
                  Premium Plans
                </Link>
              </li>
            </ul>
          </div>

          {/* Community Section */}
          <div className="space-y-6">
            <h3 className="text-white font-medium text-sm uppercase tracking-wider">Community</h3>
            <ul className="space-y-3">
              <li>
                <a 
                  href="https://wa.me/919274985691" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white transition-colors text-sm"
                >
                  WhatsApp Group
                </a>
              </li>
              <li>
                <Link href="/trust-oahelper" className="text-gray-400 hover:text-white transition-colors text-sm">
                  Trust & Safety
                </Link>
              </li>
              <li>
                <a 
                  href="mailto:support@oahelper.in" 
                  className="text-gray-400 hover:text-white transition-colors text-sm"
                >
                  Contact Us
                </a>
              </li>
            </ul>
          </div>

          {/* Legal Section */}
          <div className="space-y-6">
            <h3 className="text-white font-medium text-sm uppercase tracking-wider">Legal</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/privacy-policy" className="text-gray-400 hover:text-white transition-colors text-sm">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms-of-service" className="text-gray-400 hover:text-white transition-colors text-sm">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/refund-policy" className="text-gray-400 hover:text-white transition-colors text-sm">
                  Refund Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="border-t border-white/10 pt-8 mb-8">
          <p className="text-gray-500 text-xs leading-relaxed">
            <span className="text-gray-300 font-medium">Educational Disclaimer:</span> OAHelper is an independent educational platform. 
            We do not own any of these images or questions. All content is uploaded by users of our platform.
          </p>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/10 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex flex-col space-y-1">
              <div className="flex items-center space-x-2 text-gray-500 text-sm">
                <FaCopyright />
                <span>2025 OAHelper.in</span>
              </div>
              <div className="text-gray-600 text-xs">
                <span>A venture by CODEHELPER AI SOLUTIONS PRIVATE LIMITED</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-6">
              <a 
                href="https://wa.me/919274985691" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-500 hover:text-white transition-colors text-sm"
              >
                Chat with us
              </a>
              <span className="text-gray-600 text-sm">Made with ❤️ for Students</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
