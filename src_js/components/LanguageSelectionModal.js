import React, { useState } from 'react';
import { FaTimes, FaCode, FaCheck } from 'react-icons/fa';

const LanguageSelectionModal = ({ isOpen, onClose, onConfirm, questionTitle }) => {
    const [selectedLanguage, setSelectedLanguage] = useState('');

    const languages = [
        { id: 'cpp', name: 'C++', icon: '🔷' },
        { id: 'python', name: 'Python', icon: '🐍' },
        { id: 'java', name: 'Java', icon: '☕' }
    ];

    if (!isOpen) return null;

    const handleConfirm = () => {
        if (!selectedLanguage) {
            alert('Please select a programming language');
            return;
        }
        onConfirm(selectedLanguage);
        setSelectedLanguage('');
    };

    const handleClose = () => {
        setSelectedLanguage('');
        onClose();
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center z-50">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose}></div>
            <div className="relative backdrop-blur-xl bg-white/10 p-6 rounded-2xl border border-white/20
                           shadow-2xl transform animate-fade-up text-center max-w-sm mx-4 w-full">

                {/* Header */}
                <div className="mb-6">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full
                                  flex items-center justify-center mx-auto mb-3 border border-blue-500/30">
                        <FaCode className="text-lg text-blue-300" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Select Programming Language</h3>
                    <p className="text-gray-300 text-sm">
                        Choose the language for your solution code
                    </p>
                </div>

                {/* Language Options */}
                <div className="space-y-3 mb-6">
                    {languages.map((language) => (
                        <div
                            key={language.id}
                            className={`flex items-center space-x-3 p-3 rounded-lg border-2 cursor-pointer transition-all duration-300 ${
                                selectedLanguage === language.id
                                    ? 'border-blue-500 bg-blue-500/20'
                                    : 'border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20'
                            }`}
                            onClick={() => setSelectedLanguage(language.id)}
                        >
                            <span className="text-2xl">{language.icon}</span>
                            <span className="text-white font-medium flex-1 text-left">{language.name}</span>
                            {selectedLanguage === language.id && (
                                <FaCheck className="text-blue-400" />
                            )}
                        </div>
                    ))}
                </div>

                {/* Action Buttons */}
                <div className="space-y-2.5">
                    <button
                        onClick={handleConfirm}
                        className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700
                                 text-white font-medium py-2.5 px-4 rounded-lg transition-all transform hover:scale-105 text-sm"
                    >
                        Request Solution
                    </button>
                    <button
                        onClick={handleClose}
                        className="w-full bg-gray-600/50 hover:bg-gray-600/70 text-gray-300 font-medium py-2.5 px-4 rounded-lg
                                 transition-all border border-gray-500/20 text-sm"
                    >
                        Cancel
                    </button>
                </div>

                {/* Close Button */}
                <button
                    onClick={handleClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
                >
                    <FaTimes />
                </button>
            </div>
        </div>
    );
};

export default LanguageSelectionModal;
