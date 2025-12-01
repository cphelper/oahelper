import React, { useState, useRef } from 'react';
import { FaUpload, FaImage, FaTimes, FaSpinner, FaCheck, FaCode, FaClock, FaUsers, FaExclamationTriangle, FaCloudUploadAlt } from 'react-icons/fa';
import { API_ENDPOINTS, getApiHeaders } from '../config/api';

const UserUploadQuestion = ({ isOpen, onClose }) => {
  const [images, setImages] = useState([]);
  const [previewImages, setPreviewImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);
  const [userEmail, setUserEmail] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [additionalInfo, setAdditionalInfo] = useState('');
  const fileInputRef = useRef();

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setImages([...images, ...files]);
    
    // Create preview URLs
    const previews = files.map(file => URL.createObjectURL(file));
    setPreviewImages([...previewImages, ...previews]);
  };

  const removeImage = (indexToRemove) => {
    setImages(images.filter((_, index) => index !== indexToRemove));
    setPreviewImages(previewImages.filter((_, index) => index !== indexToRemove));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (images.length === 0) {
      setError('Please upload at least one image');
      return;
    }
    
    if (!userEmail.trim()) {
      setError('Email is required to send you the solution');
      return;
    }

    setError(null);
    setUploading(true);
    setUploadProgress(0);
    
    try {
      const formData = new FormData();
      formData.append('user_email', userEmail);
      formData.append('company_name', companyName || 'User Submitted');
      formData.append('additional_info', additionalInfo);
      formData.append('user_submission', 'true'); // Flag to distinguish from admin uploads
      
      images.forEach((image) => {
        formData.append('images[]', image);
      });
      
      const xhr = new XMLHttpRequest();
      
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(progress);
        }
      });
      
      xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
          if (xhr.status === 200) {
            try {
              const response = JSON.parse(xhr.responseText);
              if (response.status === 'success') {
                setSubmitted(true);
              } else {
                setError(response.message || 'Failed to submit question');
              }
            } catch (err) {
              setError('Invalid response from server');
            }
          } else {
            setError(`Server error: ${xhr.status}`);
          }
          setUploading(false);
        }
      };
      
      xhr.open('POST', API_ENDPOINTS.USER_UPLOAD_QUESTION, true);
      xhr.setRequestHeader('X-API-Key', getApiHeaders()['X-API-Key']);
      xhr.send(formData);
      
    } catch (err) {
      setUploading(false);
      setError('An error occurred during upload');
    }
  };

  const resetForm = () => {
    setImages([]);
    setPreviewImages([]);
    setUserEmail('');
    setCompanyName('');
    setAdditionalInfo('');
    setSubmitted(false);
    setError(null);
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 animate-fade-in p-4">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" onClick={handleClose}></div>
      
      <div className="relative bg-[#0a0a0a] border border-white/10 rounded-[2.5rem] shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto animate-bounce-in custom-scrollbar">
        {/* Decorative background elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -z-10 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl -z-10 pointer-events-none"></div>
        
        <button
          onClick={handleClose}
          className="absolute top-6 right-6 p-2 bg-white/5 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors z-20"
        >
          <FaTimes size={20} />
        </button>

        <div className="p-8 md:p-10">
          {submitted ? (
            // Success State
            <div className="text-center py-10">
              <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-500/20">
                <FaCheck className="text-4xl text-emerald-400" />
              </div>
              <h3 className="text-3xl font-bold text-white mb-4">Submitted Successfully!</h3>
              <p className="text-gray-400 mb-8 max-w-md mx-auto leading-relaxed">
                Our team will solve your question and send the solution to <span className="text-white font-medium">{userEmail}</span> shortly.
              </p>
              
              <div className="bg-[#111] rounded-3xl p-6 border border-white/5 max-w-md mx-auto mb-8">
                <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/5">
                   <div className="flex items-center space-x-3">
                      <div className="p-2 bg-blue-500/10 rounded-full">
                        <FaClock className="text-blue-400" />
                      </div>
                      <span className="text-sm text-gray-300">Estimated Time</span>
                   </div>
                   <span className="text-white font-mono font-bold">30-60 Mins</span>
                </div>
                <div className="flex items-center justify-between">
                   <div className="flex items-center space-x-3">
                      <div className="p-2 bg-purple-500/10 rounded-full">
                        <FaUsers className="text-purple-400" />
                      </div>
                      <span className="text-sm text-gray-300">Status</span>
                   </div>
                   <span className="text-emerald-400 font-bold text-sm bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">In Queue</span>
                </div>
              </div>

              <button
                onClick={handleClose}
                className="px-8 py-4 bg-white text-black rounded-full font-bold hover:bg-gray-200 transition-all duration-300 shadow-lg shadow-white/5"
              >
                Close & Continue
              </button>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-white mb-2">Get Question Solved</h2>
                <p className="text-gray-400 font-light">Upload your OA question and get a verified solution.</p>
              </div>

              {/* Info Banner */}
              <div className="bg-[#111] border border-white/10 rounded-3xl p-6 mb-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-transparent rounded-bl-full"></div>
                <div className="flex gap-4 relative z-10">
                   <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex-shrink-0 flex items-center justify-center border border-blue-500/20">
                      <FaUsers className="text-blue-400 text-xl" />
                   </div>
                   <div>
                      <h3 className="text-white font-semibold mb-1">Expert Solvers</h3>
                      <p className="text-gray-400 text-sm leading-relaxed">
                        Our competitive programming team will provide a clean, optimized solution with comments within an hour.
                      </p>
                   </div>
                </div>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-2xl mb-6 flex items-center gap-3">
                  <FaExclamationTriangle />
                  <p className="text-sm">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Email Input */}
                    <div className="space-y-2">
                      <label className="text-gray-400 text-xs font-bold uppercase tracking-wider ml-1">
                        Email Address <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        value={userEmail}
                        onChange={(e) => setUserEmail(e.target.value)}
                        className="w-full bg-[#111] border border-white/10 text-white rounded-2xl px-5 py-4 focus:outline-none focus:border-white/30 focus:ring-1 focus:ring-white/30 transition-all placeholder-gray-600"
                        placeholder="name@example.com"
                        required
                      />
                    </div>

                    {/* Company Name */}
                    <div className="space-y-2">
                      <label className="text-gray-400 text-xs font-bold uppercase tracking-wider ml-1">
                        Company / Platform
                      </label>
                      <input
                        type="text"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        className="w-full bg-[#111] border border-white/10 text-white rounded-2xl px-5 py-4 focus:outline-none focus:border-white/30 focus:ring-1 focus:ring-white/30 transition-all placeholder-gray-600"
                        placeholder="e.g. Amazon, HackerRank"
                      />
                    </div>
                </div>

                {/* Additional Info */}
                <div className="space-y-2">
                  <label className="text-gray-400 text-xs font-bold uppercase tracking-wider ml-1">
                    Additional Context
                  </label>
                  <textarea
                    value={additionalInfo}
                    onChange={(e) => setAdditionalInfo(e.target.value)}
                    className="w-full bg-[#111] border border-white/10 text-white rounded-2xl px-5 py-4 focus:outline-none focus:border-white/30 focus:ring-1 focus:ring-white/30 transition-all placeholder-gray-600 min-h-[100px] resize-none"
                    placeholder="Any specific language requirements or constraints..."
                  />
                </div>

                {/* File Upload */}
                <div className="space-y-2">
                  <label className="text-gray-400 text-xs font-bold uppercase tracking-wider ml-1">
                    Screenshots <span className="text-red-500">*</span>
                  </label>
                  
                  <div 
                    className="relative group border-2 border-dashed border-white/10 hover:border-white/30 rounded-3xl p-8 text-center cursor-pointer transition-all bg-[#111] hover:bg-white/5"
                    onClick={() => fileInputRef.current.click()}
                  >
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleFileChange}
                      className="hidden"
                      ref={fileInputRef}
                    />
                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                        <FaCloudUploadAlt className="text-3xl text-gray-400 group-hover:text-white transition-colors" />
                    </div>
                    <p className="text-white font-medium mb-1">Click to upload or drag and drop</p>
                    <p className="text-gray-500 text-sm">Supports multiple images (PNG, JPG)</p>
                  </div>
                  
                  {/* Previews */}
                  {previewImages.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-4">
                      {previewImages.map((preview, index) => (
                        <div key={index} className="relative group rounded-2xl overflow-hidden border border-white/10 aspect-video">
                          <img 
                            src={preview} 
                            alt={`Preview ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    removeImage(index);
                                }}
                                className="p-2 bg-red-500/80 hover:bg-red-500 rounded-full text-white transition-colors"
                              >
                                <FaTimes size={14} />
                              </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                {/* Progress Bar */}
                {uploading && (
                  <div className="bg-[#111] border border-white/10 rounded-2xl p-4">
                    <div className="flex items-center justify-between mb-2 text-sm">
                      <span className="text-blue-400 flex items-center gap-2">
                        <FaSpinner className="animate-spin" /> Uploading...
                      </span>
                      <span className="text-white font-mono">{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-white/5 rounded-full h-1.5">
                      <div 
                        className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                  </div>
                )}
                
                {/* Actions */}
                <div className="flex gap-4 pt-2">
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={uploading}
                    className="flex-1 py-4 bg-transparent border border-white/10 hover:bg-white/5 text-white rounded-full font-bold transition-all disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={uploading || !userEmail.trim() || images.length === 0}
                    className="flex-[2] py-4 bg-white text-black rounded-full font-bold hover:bg-gray-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-white/5"
                  >
                    {uploading ? 'Processing...' : 'Submit Question'}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: rgba(255, 255, 255, 0.1);
          border-radius: 20px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: rgba(255, 255, 255, 0.2);
        }
      `}</style>
    </div>
  );
};

export default UserUploadQuestion;
