import React, { useState, useRef, useEffect } from 'react';
import { FaArrowLeft, FaRupeeSign, FaQrcode, FaUpload, FaCheck, FaSpinner, FaImage, FaTimes, FaClock, FaRocket, FaCoins, FaShieldAlt, FaExclamationTriangle, FaChevronUp, FaChevronDown, FaHeadset } from 'react-icons/fa';
import Navbar from './Navbar';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { API_ENDPOINTS, getApiHeaders } from '../config/api';

function PaymentPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, isAuthenticated, refreshUser } = useAuth();
    
    // State initialization
    const [selectedPlan, setSelectedPlan] = useState(location.state?.selectedPlan || 99);
    const [paymentMethod, setPaymentMethod] = useState(location.state?.paymentMethod || 'rupee');
    const [paymentDetails, setPaymentDetails] = useState('');
    const [paymentImage, setPaymentImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState('');
    const [timeRemaining, setTimeRemaining] = useState(null);
    const [activationTime, setActivationTime] = useState(null);
    const [showOACoinsConfirmModal, setShowOACoinsConfirmModal] = useState(false);
    
    const fileInputRef = useRef();
    const timerIntervalRef = useRef(null);
    const paymentSectionRef = useRef(null);

    // QR Code options
    const qrCodes = [
        { id: 1, name: 'QR Code 1', image: 'image/payment1.png', provider: 'OkBizAxis' },
        { id: 2, name: 'QR Code 2', image: 'image/payment2.png', provider: 'OkBizAxis' }
    ];
    const [selectedQrIndex, setSelectedQrIndex] = useState(0);
    const [showQrOptions, setShowQrOptions] = useState(false);

    // Plan details configuration
    const plans = {
        99: { name: 'Basic', solutions: 5, duration: '30 days' },
        199: { name: 'Pro', solutions: 15, duration: '30 days' },
        299: { name: 'Unlimited', solutions: '∞', duration: '45 days' },
        999: { name: 'Yearly', solutions: '∞', duration: '365 days', savings: 'Save 72%!' }
    };

    // Function to clear all cache except Supabase auth session
    const clearCacheExceptAuth = async () => {
        // Only preserve Supabase auth session key
        const supabaseAuthKey = 'sb-spjkugnxvomrsaapfbgx-auth-token';
        const supabaseAuthValue = localStorage.getItem(supabaseAuthKey);
        
        // Clear ALL localStorage
        localStorage.clear();
        
        // Restore only Supabase auth
        if (supabaseAuthValue) {
            localStorage.setItem(supabaseAuthKey, supabaseAuthValue);
        }
        
        // Clear ALL sessionStorage
        sessionStorage.clear();
        
        // Clear browser cache if available
        if ('caches' in window) {
            try {
                const names = await caches.keys();
                await Promise.all(names.map(name => caches.delete(name)));
            } catch (e) {
                console.log('Cache clear error:', e);
            }
        }
        
        // Refresh user data to get updated premium status
        if (refreshUser) {
            try {
                await refreshUser();
            } catch (e) {
                console.log('User refresh error:', e);
            }
        }
    };

    // Effects (Timer, Scroll, Auth Check) - Keeping logic identical
    useEffect(() => {
        if (!user?.id) return;
        const storedActivationData = localStorage.getItem('premiumActivationTime');
        if (storedActivationData) {
            try {
                const activationData = JSON.parse(storedActivationData);
                if (activationData.userId === user.id) {
                    const activationTimestamp = activationData.timestamp;
                    const now = Date.now();
                    const timeLeft = Math.max(0, activationTimestamp - now);

                    if (timeLeft > 0) {
                        setActivationTime(activationTimestamp);
                        setTimeRemaining(Math.ceil(timeLeft / 1000));
                        setSubmitted(true);
                    } else {
                        localStorage.removeItem('premiumActivationTime');
                        // Clear all cache except auth data before redirect
                        clearCacheExceptAuth().then(() => {
                            window.location.href = '/';
                        });
                    }
                } else {
                    localStorage.removeItem('premiumActivationTime');
                }
            } catch (error) {
                localStorage.removeItem('premiumActivationTime');
            }
        }
    }, [user]);

    useEffect(() => {
        if (timeRemaining !== null && timeRemaining > 0) {
            timerIntervalRef.current = setInterval(() => {
                setTimeRemaining(prev => {
                    if (prev <= 1) {
                        clearInterval(timerIntervalRef.current);
                        localStorage.removeItem('premiumActivationTime');
                        // Clear all cache except auth data before redirect to home
                        clearCacheExceptAuth().then(() => {
                            window.location.href = '/';
                        });
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);

            return () => {
                if (timerIntervalRef.current) {
                    clearInterval(timerIntervalRef.current);
                }
            };
        }
    }, [timeRemaining]);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    useEffect(() => {
        if (paymentSectionRef.current) {
            setTimeout(() => {
                paymentSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 500);
        }
    }, []);

    // Handlers
    const handleOACoinsPayment = async () => {
        setIsSubmitting(true);
        setError('');
        setShowOACoinsConfirmModal(false);

        try {
            const response = await fetch(API_ENDPOINTS.OACOINS_PAYMENT, {
                method: 'POST',
                headers: getApiHeaders(),
                body: JSON.stringify({
                    user_id: user.id,
                    amount: selectedPlan,
                    plan_type: plans[selectedPlan].name.toLowerCase()
                })
            });

            const data = await response.json();

            if (data.status === 'success') {
                await refreshUser();
                setSubmitted(true);
                setTimeRemaining(0); 
                setTimeout(() => navigate('/dashboard'), 3000);
            } else {
                setError(data.message || 'Failed to process OACoins payment');
                if (data.data?.shortage) {
                    setError(`Insufficient OACoins. You need ${data.data.shortage} more coins. Current balance: ${data.data.current_balance} coins.`);
                }
            }
        } catch (err) {
            setError('An error occurred while processing OACoins payment');
            console.error('OACoins payment error:', err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                setError('Image size should be less than 5MB');
                return;
            }
            setPaymentImage(file);
            const reader = new FileReader();
            reader.onload = (e) => setImagePreview(e.target.result);
            reader.readAsDataURL(file);
            setError('');
        }
    };

    const removeImage = () => {
        setPaymentImage(null);
        setImagePreview(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!paymentImage) {
            setError('Please upload payment screenshot');
            return;
        }

        setIsSubmitting(true);
        setError('');

        // Helper function to retry failed requests
        const fetchWithRetry = async (url, options, maxRetries = 3) => {
            for (let attempt = 1; attempt <= maxRetries; attempt++) {
                try {
                    const response = await fetch(url, options);
                    const data = await response.json();
                    if (data.status === 'success') {
                        return { success: true, data };
                    }
                    // If it's the last attempt, return the error
                    if (attempt === maxRetries) {
                        return { success: false, data };
                    }
                    // Wait before retrying (exponential backoff)
                    await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
                } catch (err) {
                    if (attempt === maxRetries) {
                        return { success: false, error: err };
                    }
                    await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
                }
            }
            return { success: false };
        };

        try {
            // Upload image with retry
            const formData = new FormData();
            formData.append('payment_screenshot', paymentImage);
            formData.append('user_id', user.id);
            formData.append('user_email', user.email);
            formData.append('user_name', user.name);
            formData.append('amount', selectedPlan.toString());
            formData.append('payment_method', 'upi');
            formData.append('payment_details', paymentDetails);

            const uploadResult = await fetchWithRetry(
                `${API_ENDPOINTS.BASE_URL}/upload_payment_image.php`,
                {
                    method: 'POST',
                    headers: { 'X-API-Key': getApiHeaders()['X-API-Key'] },
                    body: formData
                }
            );

            if (uploadResult.success && uploadResult.data?.data) {
                const { image_url, filename } = uploadResult.data.data;
                const screenshotPath = filename ? `payment_images/${filename}` : (image_url ? (image_url.includes('/public/') ? image_url.split('/public/')[1] : image_url) : '');

                const paymentData = {
                    user_id: user.id,
                    user_email: user.email,
                    user_name: user.name,
                    amount: selectedPlan,
                    plan_type: plans[selectedPlan].name.toLowerCase(),
                    payment_method: 'upi',
                    payment_details: paymentDetails,
                    payment_screenshot: screenshotPath,
                    auto_approve: true
                };

                // Submit payment with retry
                const paymentResult = await fetchWithRetry(
                    `${API_ENDPOINTS.PREMIUM}?action=submit_payment`,
                    {
                        method: 'POST',
                        headers: getApiHeaders(),
                        body: JSON.stringify(paymentData)
                    }
                );

                if (paymentResult.success) {
                    const activationTimestamp = Date.now() + (2 * 60 * 1000);
                    const activationData = { timestamp: activationTimestamp, userId: user.id, userEmail: user.email };
                    localStorage.setItem('premiumActivationTime', JSON.stringify(activationData));
                    setActivationTime(activationTimestamp);
                    setTimeRemaining(2 * 60);
                    setSubmitted(true);
                } else {
                    setError(paymentResult.data?.message || 'Failed to submit payment request');
                }
            } else {
                setError(uploadResult.data?.message || 'Failed to upload payment image');
            }
        } catch (err) {
            setError('An error occurred while submitting payment request');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isAuthenticated()) {
        return (
            <div className="min-h-screen bg-[#050505] text-white relative overflow-hidden font-sans">
                <Navbar />
                <div className="relative z-10 flex items-center justify-center min-h-screen px-4">
                    <div className="bg-[#111] border border-white/10 rounded-[2rem] p-8 sm:p-12 max-w-md w-full text-center shadow-2xl">
                        <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                            <FaShieldAlt className="text-3xl text-gray-400" />
                        </div>
                        <h1 className="text-3xl font-medium mb-4">Login Required</h1>
                        <p className="text-gray-400 mb-8">Please login first to purchase a premium plan.</p>
                        <button
                            onClick={() => navigate('/login', { state: { from: '/payment', selectedPlan, paymentMethod } })}
                            className="w-full bg-white text-black font-medium py-4 rounded-full hover:bg-gray-200 transition-all mb-4"
                        >
                            Login to Continue
                        </button>
                        <button onClick={() => navigate('/signup')} className="text-sm text-gray-400 hover:text-white">
                            Create an account
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (submitted) {
        const progress = timeRemaining !== null ? ((120 - timeRemaining) / 120) * 100 : 100;
        const isOACoinsPayment = timeRemaining === 0;

        return (
            <div className="min-h-screen bg-[#050505] text-white relative overflow-hidden font-sans">
                <Navbar />
                <div className="relative z-10 flex items-center justify-center min-h-screen px-4 py-20">
                    <div className="bg-[#111] border border-white/10 rounded-[2rem] p-8 sm:p-12 max-w-lg w-full text-center shadow-2xl">
                        <div className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-8">
                            {isOACoinsPayment ? <FaCheck className="text-4xl text-green-400" /> : <FaClock className="text-4xl text-green-400" />}
                        </div>

                        <h1 className="text-3xl font-medium mb-4">
                            {isOACoinsPayment ? 'Premium Activated' : 'Payment Verified'}
                        </h1>
                        <p className="text-gray-400 mb-8">
                            {isOACoinsPayment ? 'Your subscription is now active.' : 'Your payment has been verified. Activation in progress...'}
                        </p>

                        {!isOACoinsPayment && (
                            <div className="mb-8">
                                <div className="text-6xl font-light font-mono mb-4">{timeRemaining !== null ? formatTime(timeRemaining) : '00:00'}</div>
                                <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                                    <div className="h-full bg-green-500 transition-all duration-1000" style={{ width: `${progress}%` }} />
                                    </div>
                                </div>
                        )}

                            <button
                                onClick={() => navigate('/dashboard')}
                            className="w-full bg-white text-black font-medium py-4 rounded-full hover:bg-gray-200 transition-all"
                            >
                                Go to Dashboard
                            </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#050505] text-white relative overflow-hidden font-sans selection:bg-white/20">
            <Navbar />

            {/* Background Gradients */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-blue-600/5 rounded-full blur-[120px]" />
            </div>

            <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
                {/* Back Button */}
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center text-gray-400 hover:text-white transition-colors mb-8 group"
                >
                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-white/10 mr-3">
                        <FaArrowLeft className="text-sm" />
                    </div>
                    <span className="font-medium">Back</span>
                </button>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    
                    {/* Left Column: Payment Details */}
                    <div className="lg:col-span-7 space-y-8">
                        <div>
                            <h1 className="text-4xl font-semibold mb-2">Complete Payment</h1>
                            <p className="text-gray-400 text-lg">Secure checkout for {plans[selectedPlan]?.name} Plan</p>
                        </div>

                    {/* Payment Method Toggle */}
                        <div className="bg-[#111] border border-white/10 rounded-3xl p-2 inline-flex">
                            <button
                                onClick={() => setPaymentMethod('rupee')}
                                className={`px-8 py-3 rounded-2xl font-medium transition-all duration-300 flex items-center space-x-2 ${
                                    paymentMethod === 'rupee' ? 'bg-white text-black shadow-lg' : 'text-gray-400 hover:text-white'
                                }`}
                            >
                                <FaRupeeSign /> <span>Rupee</span>
                            </button>
                            <button
                                onClick={() => setPaymentMethod('oacoins')}
                                className={`px-8 py-3 rounded-2xl font-medium transition-all duration-300 flex items-center space-x-2 ${
                                    paymentMethod === 'oacoins' ? 'bg-amber-400 text-black shadow-lg' : 'text-gray-400 hover:text-white'
                                }`}
                            >
                                <FaCoins /> <span>OACoins</span>
                            </button>
                    </div>

                        {/* Payment Content */}
                        {paymentMethod === 'rupee' ? (
                            <div className="space-y-8">
                                {/* QR Code Card */}
                                <div className="bg-[#111] border border-white/10 rounded-[2rem] p-8">
                                    <div className="flex items-center justify-between mb-6">
                                        <h3 className="text-xl font-medium">Scan to Pay</h3>
                                        <button 
                                            onClick={() => setShowQrOptions(!showQrOptions)}
                                            className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1"
                                        >
                                            Change QR {showQrOptions ? <FaChevronUp size={10} /> : <FaChevronDown size={10} />}
                                        </button>
                </div>

                                    {showQrOptions && (
                                        <div className="grid grid-cols-2 gap-4 mb-6 animate-in fade-in slide-in-from-top-2">
                                            {qrCodes.map((qr, index) => (
                                                <button
                                                    key={qr.id}
                                                    onClick={() => { setSelectedQrIndex(index); setShowQrOptions(false); }}
                                                    className={`p-4 rounded-xl border text-left transition-all ${
                                                        selectedQrIndex === index 
                                                        ? 'bg-blue-500/10 border-blue-500/50 ring-1 ring-blue-500/50' 
                                                        : 'bg-white/5 border-white/10 hover:bg-white/10'
                                                    }`}
                                                >
                                                    <div className="font-medium text-sm mb-1">{qr.name}</div>
                                                    <div className="text-xs text-gray-400">{qr.provider}</div>
                                                </button>
                                            ))}
                                                </div>
                                    )}

                                    <div className="flex flex-col md:flex-row gap-8 items-center">
                                        <div className="bg-white p-4 rounded-2xl shadow-xl max-w-[240px] w-full aspect-square flex items-center justify-center relative group">
                                            <img 
                                                src={`${process.env.PUBLIC_URL}/${qrCodes[selectedQrIndex].image}`}
                                                alt="Payment QR" 
                                                className="w-full h-full object-contain"
                                                onError={(e) => e.target.style.display = 'none'} 
                                            />
                                            <div className="absolute inset-0 flex items-center justify-center bg-black/5 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity rounded-xl">
                                                <p className="text-black font-medium">₹{selectedPlan}</p>
                            </div>
                        </div>

                                        <div className="flex-1 space-y-4 text-sm text-gray-400">
                                            <div className="flex items-center gap-3">
                                                <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs text-white font-bold">1</div>
                                                <p>Scan with any UPI app</p>
                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs text-white font-bold">2</div>
                                                <p>Pay exactly <span className="text-white font-medium">₹{selectedPlan}</span></p>
                                                </div>
                                            <div className="flex items-center gap-3">
                                                <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs text-white font-bold">3</div>
                                                <p>Upload screenshot below</p>
                                        </div>
                                    </div>
                                    </div>
                                </div>

                                {/* Upload Form */}
                                <div className="bg-[#111] border border-white/10 rounded-[2rem] p-8">
                                    <h3 className="text-xl font-medium mb-6">Upload Proof</h3>

                                    {/* Instructions & Help */}
                                    <div className="bg-blue-900/10 border border-blue-500/20 rounded-2xl p-6 mb-8">
                                        <h4 className="text-white font-medium mb-2 flex items-center gap-2">
                                            <FaHeadset className="text-blue-400" /> Need Help?
                                        </h4>
                                        <p className="text-sm text-gray-300 mb-4">
                                            For payment issues, contact us on WhatsApp: <span className="text-white font-mono bg-white/10 px-2 py-0.5 rounded">9274985691</span>
                                        </p>
                                        
                                        <div className="space-y-2">
                                            <p className="text-xs font-medium text-blue-300 uppercase tracking-wider">Troubleshooting:</p>
                                            <ul className="text-xs text-gray-400 space-y-1 list-disc list-inside">
                                                <li>If QR doesn't scan, use "Change QR" to try another code</li>
                                                <li>Ensure you pay exactly <span className="text-white">₹{selectedPlan}</span></li>
                                                <li>Screenshot must clearly show the Amount and Transaction ID</li>
                                            </ul>
                            </div>
                        </div>

                                    <form onSubmit={handleSubmit} className="space-y-6">
                                        <div className="space-y-2">
                                            {!imagePreview ? (
                                                <div 
                                                    onClick={() => fileInputRef.current.click()}
                                                    className="border border-dashed border-white/20 rounded-2xl p-10 text-center hover:bg-white/5 hover:border-white/40 transition-all cursor-pointer group"
                                                >
                                                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" ref={fileInputRef} />
                                                    <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                                                        <FaUpload className="text-gray-400 group-hover:text-white" />
                            </div>
                                                    <p className="text-white font-medium mb-1">Click to upload screenshot</p>
                                                    <p className="text-gray-500 text-sm">Supports JPG, PNG (Max 5MB)</p>
                                                </div>
                                            ) : (
                                                <div className="relative rounded-2xl overflow-hidden border border-white/10 group">
                                                    <img src={imagePreview} alt="Preview" className="w-full h-64 object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                                                    <button 
                                                        type="button" 
                                                        onClick={removeImage}
                                                        className="absolute top-4 right-4 bg-black/50 hover:bg-black/80 text-white p-2 rounded-full backdrop-blur-md transition-all"
                                                    >
                                                        <FaTimes />
                                                    </button>
                            </div>
                                            )}
                </div>

                                        <div className="space-y-2">
                                            <input
                                                type="text"
                                                value={paymentDetails}
                                                onChange={(e) => setPaymentDetails(e.target.value)}
                                                placeholder="Additional details (Transaction ID, etc.) - Optional"
                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-white/30 transition-colors"
                                            />
                            </div>

                            {error && (
                                            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-start gap-3">
                                                <FaExclamationTriangle className="mt-0.5 flex-shrink-0" />
                                                <p>{error}</p>
                                </div>
                            )}

                                        {/* Fake Payment Warning */}
                                        <div className="p-4 bg-red-900/10 border border-red-500/20 rounded-xl">
                                            <p className="text-red-400 text-sm font-medium text-center">
                                                ⚠️ Warning: Fake payment screenshots will result in immediate account suspension and permanent ban.
                                    </p>
                                </div>

                            <button
                                            type="submit"
                                            disabled={isSubmitting || !paymentImage}
                                            className="w-full bg-white text-black font-medium py-4 rounded-full hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                                        >
                                            {isSubmitting ? <FaSpinner className="animate-spin" /> : 'Verify & Activate'}
                            </button>
                                    </form>
                            </div>
                        </div>
                        ) : (
                            <div className="bg-[#111] border border-white/10 rounded-[2rem] p-8 sm:p-12 text-center">
                                <div className="w-20 h-20 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <FaCoins className="text-4xl text-amber-400" />
                    </div>
                                <h3 className="text-2xl font-medium mb-2">Pay with OACoins</h3>
                                <p className="text-gray-400 mb-8">Instant activation using your coin balance.</p>
                                
                                <div className="bg-white/5 rounded-2xl p-6 mb-8 max-w-sm mx-auto">
                                    <div className="flex justify-between mb-2 text-sm">
                                        <span className="text-gray-400">Balance</span>
                                        <span className="text-white">{user?.oacoins || 0}</span>
                                </div>
                                    <div className="flex justify-between mb-4 text-sm">
                                        <span className="text-gray-400">Cost</span>
                                        <span className="text-amber-400">-{selectedPlan}</span>
                            </div>
                                    <div className="border-t border-white/10 pt-4 flex justify-between font-medium">
                                        <span className="text-white">Remaining</span>
                                        <span className={(user?.oacoins || 0) - selectedPlan >= 0 ? 'text-green-400' : 'text-red-400'}>
                                            {(user?.oacoins || 0) - selectedPlan}
                                        </span>
                                        </div>
                                    </div>

                                {(user?.oacoins || 0) < selectedPlan ? (
                                    <div className="text-red-400 bg-red-500/10 border border-red-500/20 p-4 rounded-xl mb-6 text-sm">
                                        Insufficient balance. Please earn more coins or pay with Rupee.
                                    </div>
                                ) : (
                                                <button
                                        onClick={() => setShowOACoinsConfirmModal(true)}
                                        className="w-full max-w-sm bg-amber-400 text-black font-medium py-4 rounded-full hover:bg-amber-300 transition-all"
                                    >
                                        Pay {selectedPlan} Coins
                                                </button>
                                )}
                                        </div>
                                    )}
                                </div>

                    {/* Right Column: Order Summary */}
                    <div className="lg:col-span-5 space-y-6">
                        <div className="sticky top-24">
                            <div className="bg-[#111] border border-white/10 rounded-[2rem] p-8">
                                <h3 className="text-xl font-medium mb-6">Order Summary</h3>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center pb-4 border-b border-white/10">
                                        <div>
                                            <div className="font-medium text-white">{plans[selectedPlan]?.name} Plan</div>
                                            <div className="text-sm text-gray-400">{plans[selectedPlan]?.duration} validity</div>
                                            </div>
                                        <div className="text-xl font-semibold">
                                            {paymentMethod === 'rupee' ? '₹' : <FaCoins className="inline text-amber-400 text-sm mr-1" />}
                                            {selectedPlan}
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex items-center text-sm text-gray-300">
                                            <FaCheck className="text-green-400 mr-3 flex-shrink-0" />
                                            <span>{plans[selectedPlan]?.solutions} Daily Solutions</span>
                                        </div>
                                        <div className="flex items-center text-sm text-gray-300">
                                            <FaCheck className="text-green-400 mr-3 flex-shrink-0" />
                                            <span>Unlimited Access</span>
                                    </div>
                                        <div className="flex items-center text-sm text-gray-300">
                                            <FaCheck className="text-green-400 mr-3 flex-shrink-0" />
                                            <span>Priority Support</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 bg-blue-900/10 border border-blue-500/20 rounded-3xl p-6">
                                <div className="flex items-start gap-4">
                                    <FaRocket className="text-blue-400 text-xl mt-1" />
                            <div>
                                        <h4 className="text-white font-medium mb-1">Instant Activation</h4>
                                        <p className="text-sm text-blue-200/70">
                                            Premium features are activated automatically once payment is verified.
                                    </p>
                                </div>
                                    </div>
                                    </div>
                            </div>
                                </div>
                            </div>

                {/* OACoins Confirmation Modal */}
                {showOACoinsConfirmModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                        <div className="bg-[#111] border border-white/10 rounded-[2rem] p-8 max-w-sm w-full text-center animate-in zoom-in-95 duration-200">
                            <h3 className="text-xl font-medium mb-4">Confirm Purchase</h3>
                            <p className="text-gray-400 mb-8">Use {selectedPlan} coins to buy {plans[selectedPlan]?.name} plan?</p>
                            <div className="space-y-3">
                                <button
                                    onClick={handleOACoinsPayment}
                                    disabled={isSubmitting}
                                    className="w-full bg-amber-400 text-black font-medium py-3 rounded-full hover:bg-amber-300 transition-all"
                                >
                                    {isSubmitting ? <FaSpinner className="animate-spin mx-auto" /> : 'Confirm'}
                                </button>
                                <button
                                    onClick={() => setShowOACoinsConfirmModal(false)}
                                    disabled={isSubmitting}
                                    className="w-full bg-white/5 text-white font-medium py-3 rounded-full hover:bg-white/10 transition-all"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default PaymentPage;
