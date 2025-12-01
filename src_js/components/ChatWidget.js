import React, { useState, useRef, useEffect } from 'react';
import { FaComments, FaTimes, FaPaperPlane, FaRobot } from 'react-icons/fa';
import { API_ENDPOINTS, getApiHeaders } from '../config/api';
import { useAuth } from '../contexts/AuthContext';
import { usePremium } from '../contexts/PremiumContext';

// Enhanced markdown-like formatter for chat messages - Dark Theme
const formatMessage = (text) => {
  if (!text) return text;

  // Convert **text** to bold
  text = text.replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-white">$1</strong>');

  // Convert headings (### text) to styled headings
  text = text.replace(/^###\s+(.+)$/gm, '<div class="text-sm font-semibold text-white mt-2 mb-1">$1</div>');

  // Convert bullet points (• or -) to clean list items
  text = text.replace(/^[•\-]\s+(.+)$/gm, '<div class="flex items-start space-x-2 ml-1 my-1"><span class="text-gray-500 mt-0.5 text-xs">●</span><span class="flex-1 text-gray-300">$1</span></div>');

  // Convert numbered lists
  text = text.replace(/^(\d+)\.\s+(.+)$/gm, '<div class="flex items-start space-x-2 ml-1 my-1"><span class="text-gray-500 font-medium text-xs">$1.</span><span class="flex-1 text-gray-300">$2</span></div>');

  // Convert price mentions (₹XXX) to highlighted prices
  text = text.replace(/(₹\d+)/g, '<span class="font-semibold text-white">$1</span>');

  // Convert "OACoins" to styled version
  text = text.replace(/OACoins/g, '<span class="font-medium text-gray-200">OACoins</span>');

  // Convert section breaks (===) to visual dividers
  text = text.replace(/^===+$/gm, '<div class="my-2 border-t border-gray-800"></div>');

  // Convert line breaks to proper spacing
  text = text.replace(/\n\n/g, '<div class="h-2"></div>');
  text = text.replace(/\n/g, '<br/>');

  return text;
};

const ChatWidget = () => {
  const { user, isAuthenticated } = useAuth();
  const { is_premium: isPremium, subscription } = usePremium();

  // Generate a unique session ID for this chat session
  const [sessionId] = useState(() => `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);

  const [isOpen, setIsOpen] = useState(false);
  const [oacoins, setOacoins] = useState(0);
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hey there! 👋 I'm Krish, your OA Helper support assistant. I'm here to help you with anything - premium plans, OAcoins, features, or just general questions. What can I help you with today?",
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch OACoins balance when user is authenticated
  useEffect(() => {
    const fetchOAcoins = async () => {
      if (!isAuthenticated() || !user?.id) return;

      try {
        const response = await fetch(API_ENDPOINTS.OACOINS, {
          method: 'POST',
          headers: getApiHeaders(),
          body: JSON.stringify({
            action: 'get_balance',
            user_id: user.id
          })
        });

        const data = await response.json();
        if (data.status === 'success') {
          setOacoins(data.oacoins || 0);
        }
      } catch (error) {
        console.error('Error fetching OAcoins:', error);
      }
    };

    if (isOpen) {
      fetchOAcoins();
    }
  }, [isOpen, user, isAuthenticated]);

  const loadTawkWidget = () => {
    // Check if Tawk is already loaded
    if (window.Tawk_API) {
      // If already loaded, just maximize it
      if (window.Tawk_API.maximize) {
        window.Tawk_API.maximize();
      }
      return;
    }

    // Load Tawk.to script
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.async = true;
    script.src = 'https://embed.tawk.to/6881293bbca853191b4251e7/1j0s8i530';
    script.charset = 'UTF-8';
    script.setAttribute('crossorigin', '*');

    // Initialize Tawk_API
    window.Tawk_API = window.Tawk_API || {};
    window.Tawk_LoadStart = new Date();

    // Append script to document
    const firstScript = document.getElementsByTagName('script')[0];
    firstScript.parentNode.insertBefore(script, firstScript);

    // Wait for Tawk to load and then maximize
    script.onload = () => {
      const checkTawk = setInterval(() => {
        if (window.Tawk_API && window.Tawk_API.maximize) {
          window.Tawk_API.maximize();
          clearInterval(checkTawk);
        }
      }, 100);
    };
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      text: inputMessage,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    // Show typing indicator immediately
    setIsTyping(true);

    try {
      // Build conversation history (last 5 messages for context)
      const conversationHistory = messages
        .slice(-5)
        .filter(msg => msg.id !== 1) // Exclude welcome message
        .map(msg => ({
          role: msg.sender === 'user' ? 'user' : 'assistant',
          content: msg.text
        }));

      const response = await fetch(API_ENDPOINTS.CHAT, {
        method: 'POST',
        headers: getApiHeaders(),
        body: JSON.stringify({
          message: inputMessage,
          user_id: user?.id || null,
          is_logged_in: isAuthenticated(),
          is_premium: isPremium,
          user_email: user?.email || null,
          premium_plan: subscription?.plan_type || null,
          premium_amount: subscription?.amount || null,
          premium_expiry: subscription?.end_date || null,
          daily_limit: subscription?.daily_limit || null,
          session_id: sessionId,
          conversation_history: conversationHistory,
          oacoins_balance: oacoins
        })
      });


      const data = await response.json();


      const responseText = data.status === 'success' ? data.response : (data.message || 'Sorry, I encountered an error. Please try again or contact our support team.');

      // Calculate realistic typing delay based on response length
      const typingDelay = Math.min(Math.max(responseText.length * 20, 800), 2500);

      // Keep typing indicator for realistic duration
      await new Promise(resolve => setTimeout(resolve, typingDelay));

      setIsTyping(false);

      const botResponse = {
        id: Date.now() + 1,
        text: responseText,
        sender: 'bot',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botResponse]);

      // Check if user wants to connect with a human
      if (data.connect_to_human) {
        // Load and open Tawk.to widget
        setTimeout(() => {
          loadTawkWidget();
        }, 1000);
      }
    } catch (error) {
      console.error('Chat error:', error);
      setIsTyping(false);
      const errorResponse = {
        id: Date.now() + 1,
        text: 'Sorry, I am having trouble connecting right now. Please try again later or contact our support team. Error: ' + error.message,
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      {/* Chat Window - Clean Dark Theme */}
      {isOpen && (
        <div className="mb-4 w-80 sm:w-96 rounded-3xl shadow-2xl overflow-hidden bg-[#0F0F0F] border border-[#222] ring-1 ring-white/5" style={{ height: '600px', display: 'flex', flexDirection: 'column' }}>
          {/* Header */}
          <div className="bg-[#0F0F0F] border-b border-[#222] p-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-full overflow-hidden ring-1 ring-[#333] bg-[#1a1a1a]">
                  <img
                    src="https://api.dicebear.com/7.x/notionists/svg?seed=Krish&backgroundColor=1a1a1a"
                    alt="Krish"
                    className="w-full h-full object-cover"
                  />
                </div>
                {isTyping && (
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-[#0F0F0F] animate-pulse"></div>
                )}
              </div>
              <div>
                <h3 className="text-white font-medium text-sm">Krish</h3>
                <p className="text-gray-400 text-xs flex items-center">
                  {isTyping ? (
                    <>
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5 animate-pulse"></span>
                      typing...
                    </>
                  ) : (
                    <>
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5"></span>
                      Online
                    </>
                  )}
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-[#222] rounded-full"
            >
              <FaTimes className="text-lg" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-5 bg-[#0F0F0F]" style={{ scrollbarWidth: 'thin', scrollbarColor: '#333 #0F0F0F' }}>
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex items-end space-x-2 max-w-[85%] ${message.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                  {message.sender === 'bot' && (
                    <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 mb-1 ring-1 ring-[#333] bg-[#1a1a1a]">
                      <img
                        src="https://api.dicebear.com/7.x/notionists/svg?seed=Krish&backgroundColor=1a1a1a"
                        alt="Krish"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="flex flex-col">
                    <div
                      className={`rounded-2xl px-4 py-3 ${message.sender === 'user'
                          ? 'bg-[#262626] text-white rounded-br-sm border border-[#404040]'
                          : 'bg-[#1A1A1A] text-gray-200 rounded-bl-sm border border-[#2A2A2A]'
                        }`}
                    >
                      {message.sender === 'user' ? (
                        <p className="text-sm leading-relaxed">{message.text}</p>
                      ) : (
                        <div
                          className="text-sm leading-relaxed"
                          dangerouslySetInnerHTML={{ __html: formatMessage(message.text) }}
                        />
                      )}
                    </div>
                    <p className={`text-[10px] text-gray-500 mt-1 px-1 ${message.sender === 'user' ? 'text-right' : 'text-left'}`}>
                      {message.timestamp.toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start animate-fade-in">
                <div className="flex items-end space-x-2 max-w-[85%]">
                  <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 mb-1 ring-1 ring-[#333] bg-[#1a1a1a]">
                    <img
                      src="https://api.dicebear.com/7.x/notionists/svg?seed=Krish&backgroundColor=1a1a1a"
                      alt="Krish"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="bg-[#1A1A1A] rounded-2xl rounded-bl-sm px-5 py-4 border border-[#2A2A2A]">
                    <div className="flex space-x-1.5">
                      <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms', animationDuration: '1s' }}></div>
                      <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '200ms', animationDuration: '1s' }}></div>
                      <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '400ms', animationDuration: '1s' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Actions */}
          {messages.length === 1 && !isTyping && (
            <div className="px-4 pb-3 bg-[#0F0F0F] border-t border-[#222]">
              <p className="text-xs text-gray-500 mb-2 mt-2">Suggested questions:</p>
              <div className="flex flex-wrap gap-2">
                {[
                  "What is premium?",
                  "How do OAcoins work?",
                  "Payment methods?",
                  "Refund policy?"
                ].map((question, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setInputMessage(question);
                      setTimeout(() => {
                        const form = document.querySelector('form');
                        if (form) form.requestSubmit();
                      }, 100);
                    }}
                    className="text-xs bg-[#1A1A1A] hover:bg-[#222] text-gray-300 px-3 py-2 rounded-full border border-[#2A2A2A] transition-all hover:border-gray-600"
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <form onSubmit={handleSendMessage} className="p-4 bg-[#0F0F0F] border-t border-[#222]">
            <div className="flex items-end space-x-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Type a message..."
                disabled={isLoading}
                className="flex-1 bg-[#1A1A1A] border border-[#333] rounded-full px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500 disabled:opacity-50 disabled:cursor-not-allowed text-sm transition-all"
              />
              <button
                type="submit"
                disabled={isLoading || !inputMessage.trim()}
                className={`rounded-full p-3 transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0 ${inputMessage.trim()
                    ? 'bg-white text-black hover:bg-gray-200 shadow-lg'
                    : 'bg-[#1A1A1A] text-gray-600 border border-[#333]'
                  }`}
              >
                <FaPaperPlane className={`text-sm ${inputMessage.trim() ? '' : 'ml-0.5'}`} />
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Toggle Button - Clean Dark Theme */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative bg-[#7C3AED] hover:bg-[#6D28D9] text-white rounded-full shadow-2xl border border-[#333] transition-all duration-300 hover:scale-105 overflow-hidden"
        style={{ width: '64px', height: '64px' }}
      >
        {isTyping && !isOpen && (
          <div className="absolute top-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-[#0F0F0F] animate-pulse z-10 m-1"></div>
        )}
        {isOpen ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <FaTimes className="text-xl text-gray-300" />
          </div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <img
              src="https://api.dicebear.com/7.x/notionists/svg?seed=Krish&backgroundColor=1a1a1a"
              alt="Chat"
              className="w-full h-full object-cover opacity-90 hover:opacity-100 transition-opacity"
            />
          </div>
        )}
      </button>
    </div>
  );
};

export default ChatWidget;
