import React, { useState, useRef } from 'react';
import { FaUpload, FaSpinner, FaBuilding, FaCheck, FaTimes, FaRedo, FaSave, FaCode, FaQuestionCircle, FaImage } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import DotPattern from './DotPattern';
import { encryptId } from '../utils/encryption';
import { API_ENDPOINTS, getApiHeaders } from '../config/api';

function UploadQuestion() {
    const [companyName, setCompanyName] = useState('');
    const [images, setImages] = useState([]);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [processing, setProcessing] = useState(false);
    const [uploadComplete, setUploadComplete] = useState(false);
    const [error, setError] = useState(null);
    const [generatedProblem, setGeneratedProblem] = useState(null);
    const [previewImages, setPreviewImages] = useState([]);
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [confirmLoading, setConfirmLoading] = useState(false);
    const [questionType, setQuestionType] = useState('coding'); // 'coding' or 'mcq'
    const [uploadMode, setUploadMode] = useState('images'); // 'images' or 'pdf'
    const [pdfFile, setPdfFile] = useState(null);
    const [extractingPdf, setExtractingPdf] = useState(false);
    const fileInputRef = useRef();
    const pdfInputRef = useRef();
    const navigate = useNavigate();

    const handleCompanyChange = (e) => {
        setCompanyName(e.target.value);
    };

    const blurImageTop = (file) => {
        return new Promise((resolve) => {
            const img = new Image();
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            img.onload = () => {
                canvas.width = img.width;
                canvas.height = img.height;
                
                // Draw the original image
                ctx.drawImage(img, 0, 0);
                
                // Get the image data for the top 23%
                const blurHeight = Math.floor(img.height * 0.23);
                const imageData = ctx.getImageData(0, 0, img.width, blurHeight);
                
                // Apply blur effect using a simple box blur
                const blurRadius = 15;
                const pixels = imageData.data;
                const width = imageData.width;
                const height = imageData.height;
                
                // Create a copy for blur calculation
                const original = new Uint8ClampedArray(pixels);
                
                for (let y = 0; y < height; y++) {
                    for (let x = 0; x < width; x++) {
                        let r = 0, g = 0, b = 0, a = 0;
                        let count = 0;
                        
                        // Sample surrounding pixels
                        for (let dy = -blurRadius; dy <= blurRadius; dy++) {
                            for (let dx = -blurRadius; dx <= blurRadius; dx++) {
                                const ny = y + dy;
                                const nx = x + dx;
                                
                                if (ny >= 0 && ny < height && nx >= 0 && nx < width) {
                                    const idx = (ny * width + nx) * 4;
                                    r += original[idx];
                                    g += original[idx + 1];
                                    b += original[idx + 2];
                                    a += original[idx + 3];
                                    count++;
                                }
                            }
                        }
                        
                        const idx = (y * width + x) * 4;
                        pixels[idx] = r / count;
                        pixels[idx + 1] = g / count;
                        pixels[idx + 2] = b / count;
                        pixels[idx + 3] = a / count;
                    }
                }
                
                // Put the blurred data back
                ctx.putImageData(imageData, 0, 0);
                
                // Add watermark text
                ctx.font = 'bold 24px Arial';
                ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
                ctx.strokeStyle = 'rgba(0, 0, 0, 0.7)';
                ctx.lineWidth = 2;
                ctx.textAlign = 'center';
                
                // Add "oahelper.in" text
                const text1 = 'oahelper.in';
                const text1Y = blurHeight * 0.4;
                ctx.strokeText(text1, img.width / 2, text1Y);
                ctx.fillText(text1, img.width / 2, text1Y);
                
                // Add "blurred for safety reasons" text
                ctx.font = 'bold 16px Arial';
                const text2 = 'blurred for safety reasons';
                const text2Y = blurHeight * 0.7;
                ctx.strokeText(text2, img.width / 2, text2Y);
                ctx.fillText(text2, img.width / 2, text2Y);
                
                // Convert canvas to blob
                canvas.toBlob((blob) => {
                    resolve(URL.createObjectURL(blob));
                }, 'image/jpeg', 0.9);
            };
            
            img.src = URL.createObjectURL(file);
        });
    };

    const handleFileChange = async (e) => {
        const files = Array.from(e.target.files);
        setImages(files);
        
        // Create blurred preview URLs for the images
        const previews = await Promise.all(files.map(file => blurImageTop(file)));
        setPreviewImages(previews);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!companyName.trim()) {
            setError('Company name is required');
            return;
        }
        
        if (images.length === 0) {
            setError('Please upload at least one image');
            return;
        }
        
        setError(null);
        setProcessing(true);
        setUploadProgress(0);
        setShowConfirmation(false);
        
        try {
            const formData = new FormData();
            formData.append('company_name', companyName);
            formData.append('preview_only', 'true'); // Only process with LLM, don't save to DB yet
            formData.append('question_type', questionType);
            
            images.forEach((image, index) => {
                formData.append(`image_${index}`, image);
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
                                setGeneratedProblem(response.problem_statement);
                                setShowConfirmation(true);
                            } else {
                                setError(response.message || 'Failed to process images');
                            }
                        } catch (err) {
                            setError('Invalid response from server');
                        }
                    } else {
                        setError(`Server error: ${xhr.status}`);
                    }
                    setProcessing(false);
                }
            };
            
            xhr.open('POST', API_ENDPOINTS.UPLOAD_QUESTION, true);
            xhr.setRequestHeader('X-API-Key', getApiHeaders()['X-API-Key']);
            xhr.send(formData);
            
        } catch (err) {
            setProcessing(false);
            setError('An error occurred during upload');
        }
    };

    const confirmUpload = async () => {
        setConfirmLoading(true);
        setError(null);
        
        try {
            const formData = new FormData();
            formData.append('company_name', companyName);
            formData.append('problem_statement', generatedProblem);
            formData.append('confirm_upload', 'true');
            formData.append('question_type', questionType);
            
            images.forEach((image, index) => {
                formData.append(`image_${index}`, image);
            });
            
            const response = await fetch(API_ENDPOINTS.UPLOAD_QUESTION, {
                method: 'POST',
                headers: {
                    'X-API-Key': getApiHeaders()['X-API-Key']
                },
                body: formData
            });
            
            const data = await response.json();
            
            if (data.status === 'success') {
                setUploadComplete(true);
                setShowConfirmation(false);
                
                // Navigate to newly created question if ID is returned
                if (data.question_id && data.company_id) {
                    setTimeout(() => {
                        navigate(`/questions/${encryptId(data.question_id)}?company_id=${encryptId(data.company_id)}`);
                    }, 2000);
                }
            } else {
                setError(data.message || 'Failed to save question');
            }
        } catch (err) {
            setError('An error occurred while saving the question');
        } finally {
            setConfirmLoading(false);
        }
    };

    const requestNewGeneration = () => {
        setGeneratedProblem(null);
        setShowConfirmation(false);
        handleSubmit({ preventDefault: () => {} });
    };

    const removeImage = (indexToRemove) => {
        setImages(images.filter((_, index) => index !== indexToRemove));
        setPreviewImages(previewImages.filter((_, index) => index !== indexToRemove));
    };

    const resetForm = () => {
        setCompanyName('');
        setImages([]);
        setPreviewImages([]);
        setGeneratedProblem(null);
        setShowConfirmation(false);
        setUploadComplete(false);
        setError(null);
        setUploadProgress(0);
        setQuestionType('coding');
        setUploadMode('images');
        setPdfFile(null);
        setExtractingPdf(false);
    };

    const handlePdfUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.type !== 'application/pdf') {
            setError('Please upload a valid PDF file');
            return;
        }

        setPdfFile(file);
        setExtractingPdf(true);
        setError(null);

        try {
            const formData = new FormData();
            formData.append('pdf_file', file);
            formData.append('action', 'extract_pdf');

            const response = await fetch(API_ENDPOINTS.UPLOAD_QUESTION, {
                method: 'POST',
                headers: {
                    'X-API-Key': getApiHeaders()['X-API-Key']
                },
                body: formData
            });

            const data = await response.json();

            if (data.status === 'success' && data.images) {
                // Convert base64 images to File objects
                const imageFiles = await Promise.all(
                    data.images.map(async (base64Image, index) => {
                        const response = await fetch(base64Image);
                        const blob = await response.blob();
                        return new File([blob], `pdf_page_${index + 1}.jpg`, { type: 'image/jpeg' });
                    })
                );

                setImages(imageFiles);
                
                // Create blurred preview URLs
                const previews = await Promise.all(imageFiles.map(file => blurImageTop(file)));
                setPreviewImages(previews);

                alert(`Successfully extracted ${imageFiles.length} pages from PDF`);
            } else {
                setError(data.message || 'Failed to extract images from PDF');
            }
        } catch (error) {
            console.error('Error extracting PDF:', error);
            setError('Failed to process PDF file');
        } finally {
            setExtractingPdf(false);
        }
    };

    return (
        <div className="min-h-screen bg-black text-white relative overflow-hidden">
            <DotPattern 
                width={32} 
                height={32} 
                cx={16} 
                cy={16} 
                cr={1.5} 
                className="absolute inset-0 opacity-10 z-0" 
            />
            
            <Navbar />
            
            <div className="relative z-10 max-w-4xl mx-auto px-4 py-12">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent mb-4">
                        Upload Question
                    </h1>
                    <p className="text-gray-400 text-lg">
                        Upload question images and let AI generate the problem statement
                    </p>
                </div>

                <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-8 shadow-2xl">
                    {error && (
                        <div className="bg-red-500/20 border border-red-500/40 text-red-400 p-4 rounded-xl mb-6">
                            <p>{error}</p>
                        </div>
                    )}

                    {uploadComplete ? (
                        <div className="bg-green-500/20 border border-green-500/40 text-green-400 p-4 rounded-xl mb-6">
                            <div className="flex items-center">
                                <FaCheck className="mr-2" />
                                <p>Upload successful! Question processed and added to database.</p>
                            </div>
                        </div>
                    ) : (
                        <>
                            {!showConfirmation && (
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div>
                                        <label className="block text-gray-400 text-sm font-medium mb-2">
                                            Company Name
                                        </label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <FaBuilding className="text-gray-400" />
                                            </div>
                                            <input
                                                type="text"
                                                value={companyName}
                                                onChange={handleCompanyChange}
                                                className="bg-white/5 border border-white/10 text-white rounded-xl pl-10 pr-4 py-3 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                placeholder="Enter company name"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-gray-400 text-sm font-medium mb-2">
                                            Question Type
                                        </label>
                                        <div className="flex space-x-3">
                                            <button
                                                type="button"
                                                onClick={() => setQuestionType('coding')}
                                                className={`flex-1 px-4 py-3 rounded-xl border transition-all ${
                                                    questionType === 'coding'
                                                        ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                                                        : 'bg-white/5 text-gray-400 border-white/10 hover:border-white/20'
                                                }`}
                                            >
                                                <FaCode className="inline mr-2" />
                                                Coding Problem
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setQuestionType('mcq')}
                                                className={`flex-1 px-4 py-3 rounded-xl border transition-all ${
                                                    questionType === 'mcq'
                                                        ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                                                        : 'bg-white/5 text-gray-400 border-white/10 hover:border-white/20'
                                                }`}
                                            >
                                                <FaQuestionCircle className="inline mr-2" />
                                                MCQ Question
                                            </button>
                                        </div>
                                        <p className="text-gray-500 text-xs mt-2">
                                            {questionType === 'coding' 
                                                ? 'AI will extract coding problem with examples and constraints' 
                                                : 'AI will extract MCQ question with options and correct answer'}
                                        </p>
                                    </div>

                                    <div>
                                        <label className="block text-gray-400 text-sm font-medium mb-2">
                                            Upload Mode
                                        </label>
                                        <div className="flex space-x-3">
                                            <button
                                                type="button"
                                                onClick={() => setUploadMode('images')}
                                                className={`flex-1 px-4 py-3 rounded-xl border transition-all ${
                                                    uploadMode === 'images'
                                                        ? 'bg-green-500/20 text-green-300 border-green-500/40'
                                                        : 'bg-white/5 text-gray-400 border-white/10 hover:border-white/20'
                                                }`}
                                            >
                                                <FaImage className="inline mr-2" />
                                                Upload Images
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setUploadMode('pdf')}
                                                className={`flex-1 px-4 py-3 rounded-xl border transition-all ${
                                                    uploadMode === 'pdf'
                                                        ? 'bg-orange-500/20 text-orange-300 border-orange-500/40'
                                                        : 'bg-white/5 text-gray-400 border-white/10 hover:border-white/20'
                                                }`}
                                            >
                                                <FaUpload className="inline mr-2" />
                                                Upload PDF
                                            </button>
                                        </div>
                                        <p className="text-gray-500 text-xs mt-2">
                                            {uploadMode === 'images' 
                                                ? 'Upload individual image files' 
                                                : 'Upload a PDF file - each page will be extracted as an image'}
                                        </p>
                                    </div>
                                    
                                    <div>
                                        <label className="block text-gray-400 text-sm font-medium mb-2">
                                            {uploadMode === 'images' ? 'Upload Question Images' : 'Upload PDF File'}
                                        </label>
                                        
                                        {uploadMode === 'images' ? (
                                            <div 
                                                className="border-2 border-dashed border-white/20 rounded-xl p-8 text-center cursor-pointer hover:border-white/40 transition-all"
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
                                                <FaUpload className="mx-auto text-3xl text-gray-400 mb-4" />
                                                <p className="text-gray-400 mb-2">Click to upload or drag and drop</p>
                                                <p className="text-gray-500 text-sm">PNG, JPG, GIF up to 10MB</p>
                                            </div>
                                        ) : (
                                            <div>
                                                <div 
                                                    className="border-2 border-dashed border-orange-500/30 rounded-xl p-8 text-center cursor-pointer hover:border-orange-500/50 transition-all bg-orange-500/5"
                                                    onClick={() => pdfInputRef.current.click()}
                                                >
                                                    <input
                                                        type="file"
                                                        accept="application/pdf"
                                                        onChange={handlePdfUpload}
                                                        className="hidden"
                                                        ref={pdfInputRef}
                                                    />
                                                    <FaUpload className="mx-auto text-3xl text-orange-400 mb-4" />
                                                    <p className="text-orange-300 mb-2">Click to upload PDF file</p>
                                                    <p className="text-gray-500 text-sm">PDF files up to 50MB - Each page will be extracted as an image</p>
                                                    {pdfFile && (
                                                        <p className="text-green-400 text-sm mt-2">
                                                            <FaCheck className="inline mr-1" />
                                                            {pdfFile.name}
                                                        </p>
                                                    )}
                                                </div>
                                                
                                                {extractingPdf && (
                                                    <div className="mt-4 bg-orange-500/20 border border-orange-500/40 text-orange-400 p-4 rounded-xl">
                                                        <div className="flex items-center">
                                                            <FaSpinner className="animate-spin mr-2" />
                                                            <p>Extracting pages from PDF...</p>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                        
                                        {previewImages.length > 0 && (
                                            <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4">
                                                {previewImages.map((preview, index) => (
                                                    <div key={index} className="relative group">
                                                        <img 
                                                            src={preview} 
                                                            alt={`Preview ${index + 1}`}
                                                            className="w-full h-32 object-cover rounded-lg border border-white/10"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => removeImage(index)}
                                                            className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                                        >
                                                            <FaTimes className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    
                                    {processing && (
                                        <div className="bg-blue-500/20 border border-blue-500/40 text-blue-400 p-4 rounded-xl">
                                            <div className="flex items-center mb-2">
                                                <FaSpinner className="animate-spin mr-2" />
                                                <p>Processing images with AI...</p>
                                            </div>
                                            <div className="w-full bg-white/10 rounded-full h-2">
                                                <div 
                                                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                                                    style={{ width: `${uploadProgress}%` }}
                                                ></div>
                                            </div>
                                            <p className="text-sm mt-1">{uploadProgress}% uploaded</p>
                                        </div>
                                    )}
                                    
                                    <button
                                        type="submit"
                                        disabled={processing || !companyName.trim() || images.length === 0}
                                        className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-medium py-3 px-6 rounded-xl transition-all transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed"
                                    >
                                        {processing ? (
                                            <>
                                                <FaSpinner className="animate-spin mr-2 inline" />
                                                Processing...
                                            </>
                                        ) : (
                                            <>
                                                <FaUpload className="mr-2 inline" />
                                                Generate Problem Statement
                                            </>
                                        )}
                                    </button>
                                </form>
                            )}

                            {showConfirmation && generatedProblem && (
                                <div className="space-y-6">
                                    <div className="bg-green-500/20 border border-green-500/40 text-green-400 p-4 rounded-xl">
                                        <div className="flex items-center mb-2">
                                            <FaCheck className="mr-2" />
                                            <p className="font-medium">Problem Statement Generated!</p>
                                        </div>
                                        <p className="text-sm">Review the generated content below and confirm to save the question.</p>
                                    </div>

                                    <div>
                                        <h3 className="text-lg font-medium text-gray-300 mb-3">Generated Problem Statement:</h3>
                                        <div 
                                            className="bg-white/5 border border-white/10 rounded-xl p-4 max-h-96 overflow-y-auto"
                                            dangerouslySetInnerHTML={{ __html: generatedProblem }}
                                        />
                                    </div>

                                    <div className="flex gap-4">
                                        <button
                                            onClick={confirmUpload}
                                            disabled={confirmLoading}
                                            className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-medium py-3 px-6 rounded-xl transition-all transform hover:scale-105 disabled:scale-100"
                                        >
                                            {confirmLoading ? (
                                                <>
                                                    <FaSpinner className="animate-spin mr-2 inline" />
                                                    Saving...
                                                </>
                                            ) : (
                                                <>
                                                    <FaSave className="mr-2 inline" />
                                                    Confirm & Save Question
                                                </>
                                            )}
                                        </button>

                                        <button
                                            onClick={requestNewGeneration}
                                            disabled={confirmLoading || processing}
                                            className="bg-orange-500 hover:bg-orange-600 disabled:bg-gray-600 text-white font-medium py-3 px-6 rounded-xl transition-all"
                                        >
                                            <FaRedo className="mr-2 inline" />
                                            Regenerate
                                        </button>

                                        <button
                                            onClick={resetForm}
                                            disabled={confirmLoading || processing}
                                            className="bg-gray-600 hover:bg-gray-700 disabled:bg-gray-800 text-white font-medium py-3 px-6 rounded-xl transition-all"
                                        >
                                            <FaTimes className="mr-2 inline" />
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

export default UploadQuestion; 