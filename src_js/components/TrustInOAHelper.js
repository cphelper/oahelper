import React, { useState } from 'react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Shield, Check, Zap } from 'lucide-react';

const TrustInOAHelper = () => {
  const [helpfulCount, setHelpfulCount] = useState({});

  // Featured question data
  const featuredQuestion = {
    id: 'activation-1',
    question: 'Will my account get activated instantly after payment?',
    videoUrl: '/Payment.mp4',
    textAnswer: 'Yes! Your OAHelper Premium account is activated instantly after successful payment. You\'ll receive immediate access to all premium features including unlimited solution requests, video solutions, priority support, and premium question sets. No waiting period required!',
    category: 'Payment',
    icon: '⚡',
    featured: true
  };

  const handleHelpful = (id) => {
    setHelpfulCount(prev => ({
      ...prev,
      [id]: (prev[id] || 0) + 1
    }));
  };

  return (
    <div className="min-h-screen bg-black py-16 px-4 relative overflow-hidden">
      {/* Grid Background Pattern - More Visible */}
      <div
        className="absolute inset-0 pointer-events-none opacity-25"
        style={{
          backgroundImage: `
            linear-gradient(90deg, rgba(148,163,184,0.4) 1px, transparent 1px),
            linear-gradient(rgba(148,163,184,0.4) 1px, transparent 1px)
          `,
          backgroundSize: '45px 45px',
          backgroundPosition: '16px 14px, 0 14px',
          maskImage: 'linear-gradient(-20deg, transparent 50%, white)',
          WebkitMaskImage: 'linear-gradient(-20deg, transparent 50%, white)',
          zIndex: 1
        }}
      />

      {/* Animated gradient background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 2 }}>
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-600/20 rounded-full blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-600/20 rounded-full blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="max-w-5xl mx-auto relative z-10">
        {/* Hero Header */}
        <div className="text-center mb-16">
          <div className="mb-6 inline-block">
            <Badge className="px-4 py-2 bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-white border border-white/20 backdrop-blur-xl text-sm font-semibold shadow-xl">
              ✨ Have Doubts About Premium?
            </Badge>
          </div>
          <h1 className="text-5xl md:text-6xl font-black text-white mb-6 bg-gradient-to-r from-blue-300 via-purple-300 to-pink-300 bg-clip-text text-transparent">
            Trust in OAHelper Premium
          </h1>
          <p className="text-xl text-gray-300 mb-8 leading-relaxed max-w-2xl mx-auto">
            We believe in transparency. Watch video explanations and read comprehensive answers to all your concerns about our premium service.
          </p>
          <div className="flex justify-center gap-3 flex-wrap">
            <Badge className="px-4 py-2 bg-white/5 text-green-300 border border-green-500/30 backdrop-blur-xl flex items-center gap-2 shadow-lg">
              <Shield className="w-4 h-4" /> Bank-Level Security
            </Badge>
            <Badge className="px-4 py-2 bg-white/5 text-blue-300 border border-blue-500/30 backdrop-blur-xl flex items-center gap-2 shadow-lg">
              <Check className="w-4 h-4" /> 30-Day Guarantee
            </Badge>
            <Badge className="px-4 py-2 bg-white/5 text-purple-300 border border-purple-500/30 backdrop-blur-xl flex items-center gap-2 shadow-lg">
              <Zap className="w-4 h-4" /> Premium Features
            </Badge>
          </div>
        </div>

        {/* Featured Question - Account Activation */}
        <div className="mb-16">
          <div className="flex items-center gap-3 px-6 py-4 rounded-xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 backdrop-blur-xl shadow-xl mb-6">
            <div className="text-2xl">{featuredQuestion.icon}</div>
            <div>
              <h2 className="text-xl font-bold text-blue-300">Featured Question</h2>
              <p className="text-sm text-gray-400">Most asked question</p>
            </div>
          </div>

          <Card className="shadow-2xl bg-white/5 border border-white/10 backdrop-blur-xl overflow-hidden">
            <div className="p-6">
              <div className="space-y-6">
                {/* Featured Question */}
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-white mb-4">
                    {featuredQuestion.question}
                  </h3>
                </div>

                {/* Video Section - Always Visible */}
                <div className="relative group">
                  <div className="aspect-video bg-gradient-to-br from-black/40 to-black/20 rounded-xl overflow-hidden border border-white/10 backdrop-blur-xl shadow-xl">
                    <video
                      src={featuredQuestion.videoUrl}
                      title={`${featuredQuestion.question} - Payment Video`}
                      className="w-full h-full"
                      controls
                      autoPlay
                      muted
                      loop
                    />
                  </div>
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                </div>

                {/* Text Answer */}
                <div className="bg-gradient-to-br from-white/5 to-white/10 p-6 rounded-xl border border-white/10 backdrop-blur-xl shadow-lg">
                  <h4 className="font-bold text-white mb-3 flex items-center gap-2">
                    <span className="text-blue-300">→</span> Detailed Answer
                  </h4>
                  <p className="text-gray-300 leading-relaxed text-base">{featuredQuestion.textAnswer}</p>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-2 pt-2 justify-center">
                  <Button
                    variant="outline"
                    size="sm"
                    className={`border-white/20 text-gray-300 hover:bg-white/10 hover:text-white backdrop-blur-sm transition-all ${helpfulCount[featuredQuestion.id] ? 'bg-green-500/10 border-green-500/30 text-green-300' : ''}`}
                    onClick={() => handleHelpful(featuredQuestion.id)}
                  >
                    👍 Helpful {helpfulCount[featuredQuestion.id] ? `(${helpfulCount[featuredQuestion.id]})` : ''}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-white/20 text-gray-300 hover:bg-white/10 hover:text-white backdrop-blur-sm transition-all"
                  >
                    💬 Follow-up
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-white/20 text-gray-300 hover:bg-white/10 hover:text-white backdrop-blur-sm transition-all"
                  >
                    🔗 Share
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-white/20 text-gray-300 hover:bg-white/10 hover:text-white backdrop-blur-sm transition-all"
                  >
                    ⭐ Save
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TrustInOAHelper;
