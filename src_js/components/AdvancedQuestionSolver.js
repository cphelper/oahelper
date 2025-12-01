import React, { useState, useRef, useEffect } from 'react';
import { FaUpload, FaSpinner, FaCheck, FaExclamationTriangle, FaCode, FaArrowRight, FaTimes, FaCopy } from 'react-icons/fa';
import { API_ENDPOINTS, getApiHeaders, API_KEY as BACKEND_API_KEY } from '../config/api';

const AdvancedQuestionSolver = () => {
  
  // State
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [step, setStep] = useState(1); // 1: Upload & Process, 2: Final Code
  const [processing, setProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState(''); // 'extracting', 'solving'
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState('');
  
  // Data
  const [problemStatement, setProblemStatement] = useState('');
  const [solutionCode, setSolutionCode] = useState('');
  const [targetLanguage, setTargetLanguage] = useState('C++');
  const [tokenUsage, setTokenUsage] = useState(null);
  const [executionTime, setExecutionTime] = useState(0);
  
  const fileInputRef = useRef(null);
  
  // Helpers
  const addLog = (msg) => setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  
  // Handlers
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      setImages(prev => [...prev, ...files]);
      const newPreviews = files.map(file => URL.createObjectURL(file));
      setImagePreviews(prev => [...prev, ...newPreviews]);
    }
  };

  const processFullWorkflow = async () => {
    if (images.length === 0) return setError('Please upload images');

    setProcessing(true);
    setProcessingStatus('extracting');
    setError('');
    setExecutionTime(0);
    
    let currentProblemStatement = "";
    const startTime = performance.now();
    
    // Step 1: Extract Problem Statement
    try {
      addLog('Starting problem extraction via backend (Gemini 3 Pro - Low Thinking)...');
      const formData = new FormData();
      
      // Add images
      images.forEach((file, index) => {
        formData.append(`image_${index}`, file);
      });
      
      const prompt = `give complete problem statement from tha imaages so that i can pass that to better llm,also describe in the problem statement if there are any graphs or iamges in the problem statement and also add details  which will be required for the llm to code better from the problem statemenet and also add the pregiven code`;
      
      formData.append('prompt', prompt);
      formData.append('model', 'gemini-3-pro-preview');
      formData.append('thinking_level', 'LOW');
      // Use very high token limits if supported by backend
      formData.append('max_tokens', '64000'); 

      const headers = {
        'X-API-Key': BACKEND_API_KEY
      };

      const response = await fetch(API_ENDPOINTS.SOLVE_QUESTION, {
        method: 'POST',
        headers: headers,
        body: formData
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.status === 'error') {
        throw new Error(data.message || 'Unknown backend error');
      }

      currentProblemStatement = data.text.trim();
      setProblemStatement(currentProblemStatement);
      
      const extractTime = ((performance.now() - startTime) / 1000).toFixed(2);
      addLog(`Problem statement extracted successfully in ${extractTime}s.`);
      
      // Step 2: Generate Solution immediately
      const solutionStartTime = performance.now();
      setProcessingStatus('solving');
      addLog(`Generating ${targetLanguage} solution via backend (Gemini 3 Pro - High Thinking)...`);
      
      const formDataSolution = new FormData();
      
      // Add images again
      images.forEach((file, index) => {
        formDataSolution.append(`image_${index}`, file);
      });

      const solutionPrompt = `give me ${targetLanguage} code for this problem statemenet that passes all the test cases and hidden test cases as well 

Dont add comments to the code  , give code according to pregiven funciton
Problem Statement:
${currentProblemStatement}`;

      formDataSolution.append('prompt', solutionPrompt);
      formDataSolution.append('model', 'gemini-3-pro-preview');
      formDataSolution.append('thinking_level', 'HIGH');
      formDataSolution.append('max_tokens', '64000');

      const responseSolution = await fetch(API_ENDPOINTS.SOLVE_QUESTION, {
        method: 'POST',
        headers: headers,
        body: formDataSolution
      });

      if (!responseSolution.ok) {
        throw new Error(`HTTP error! status: ${responseSolution.status}`);
      }
      
      const dataSolution = await responseSolution.json();
      
      if (dataSolution.status === 'error') {
        throw new Error(dataSolution.message || 'Unknown backend error');
      }
      
      let text = dataSolution.text;
      
      if (dataSolution.usage) {
        setTokenUsage(dataSolution.usage);
      }

      const solutionTime = ((performance.now() - solutionStartTime) / 1000).toFixed(2);
      setExecutionTime(solutionTime);
      
      // Remove markdown code blocks if present for cleaner display
      const cleanCode = text.replace(/```(?:cpp|c\+\+|python|java|javascript|c|go|rust|swift|kotlin)?/g, '').replace(/```/g, '').trim();

      setSolutionCode(cleanCode);
      addLog(`Solution generated in ${solutionTime}s.`);
      setStep(2); // Move to final view
      
    } catch (err) {
      setError(err.message);
      addLog(`Error: ${err.message}`);
    } finally {
      setProcessing(false);
      setProcessingStatus('');
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    addLog('Copied to clipboard');
  };

  return (
    <div className="bg-[#161616] min-h-screen text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
          Advanced Question Solver
        </h1>
        
        {/* Step 1: Upload & Process */}
        <div className={`mb-8 transition-opacity ${step === 1 ? 'opacity-100' : 'opacity-50'}`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center">
              <span className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm mr-3">1</span>
              Upload & Solve
            </h2>
            {step > 1 && <FaCheck className="text-green-400" />}
          </div>
          
          {step === 1 && (
            <div className="space-y-4 pl-11">
              <div className="flex items-center space-x-4 mb-4">
                <label className="text-gray-400">Target Language:</label>
                <select 
                  value={targetLanguage}
                  onChange={(e) => setTargetLanguage(e.target.value)}
                  className="bg-black/50 border border-white/20 rounded px-3 py-2 text-white focus:outline-none"
                >
                  <option value="C++">C++</option>
                  <option value="Java">Java</option>
                  <option value="Python">Python</option>
                  <option value="JavaScript">JavaScript</option>
                  <option value="SQL">SQL</option>
                </select>
              </div>

              <div 
                onClick={() => fileInputRef.current.click()}
                className="border-2 border-dashed border-white/20 rounded-xl p-8 text-center cursor-pointer hover:border-blue-500/50 transition-colors"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <FaUpload className="mx-auto text-3xl text-gray-400 mb-3" />
                <p className="text-gray-400">Click to upload question images</p>
              </div>

              {imagePreviews.length > 0 && (
                <div className="grid grid-cols-4 gap-4 mt-4">
                  {imagePreviews.map((src, i) => (
                    <div key={i} className="relative aspect-square bg-black/50 rounded-lg overflow-hidden">
                      <img src={src} alt={`preview ${i}`} className="w-full h-full object-cover" />
                      <button 
                        onClick={() => {
                           setImages(imgs => imgs.filter((_, idx) => idx !== i));
                           setImagePreviews(prev => prev.filter((_, idx) => idx !== i));
                        }}
                        className="absolute top-1 right-1 bg-red-500 rounded-full p-1 text-xs"
                      >
                        <FaTimes />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={processFullWorkflow}
                disabled={processing || images.length === 0}
                className="w-full bg-blue-600 hover:bg-blue-500 py-3 rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center mt-4"
              >
                {processing ? <FaSpinner className="animate-spin mr-2" /> : <FaArrowRight className="mr-2" />}
                {processing ? (processingStatus === 'extracting' ? 'Extracting Problem...' : 'Solving Question...') : 'Solve Question'}
              </button>
            </div>
          )}
        </div>

        {/* Step 2: Final Code */}
        <div className={`mb-8 transition-opacity ${step >= 2 ? 'opacity-100' : 'opacity-50'}`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center">
              <span className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm mr-3">2</span>
              Generated Solution
            </h2>
            {step > 2 && <FaCheck className="text-green-400" />}
          </div>

          {step === 2 && (
            <div className="pl-11 space-y-4">
              {/* Token Usage Stats */}
              {tokenUsage && (
                <div className="grid grid-cols-3 gap-4 mb-4 text-xs font-mono">
                  <div className="bg-white/5 p-3 rounded border border-white/10">
                    <span className="text-gray-400 block">Input Tokens</span>
                    <span className="text-blue-400 text-lg">{tokenUsage.promptTokenCount}</span>
                  </div>
                  <div className="bg-white/5 p-3 rounded border border-white/10">
                    <span className="text-gray-400 block">Output Tokens</span>
                    <span className="text-green-400 text-lg">{tokenUsage.candidatesTokenCount}</span>
                  </div>
                  <div className="bg-white/5 p-3 rounded border border-white/10">
                    <span className="text-gray-400 block">Total Tokens</span>
                    <span className="text-purple-400 text-lg">{tokenUsage.totalTokenCount}</span>
                  </div>
                  <div className="bg-white/5 p-3 rounded border border-white/10">
                    <span className="text-gray-400 block">Thinking Time</span>
                    <span className="text-yellow-400 text-lg">{executionTime}s</span>
                  </div>
                </div>
              )}

              {/* Problem Statement Toggle/View */}
              <div className="bg-white/5 rounded-lg p-4 mb-4">
                 <h3 className="text-sm font-bold text-gray-400 mb-2">Problem Statement (Extracted)</h3>
                 <textarea
                  value={problemStatement}
                  readOnly
                  className="w-full h-32 bg-transparent border border-white/10 rounded p-2 text-xs font-mono text-gray-300"
                 />
              </div>

              <div className="bg-white/5 rounded-lg p-4 relative group">
                <button 
                  onClick={() => copyToClipboard(solutionCode)}
                  className="absolute top-2 right-2 bg-white/10 hover:bg-white/20 p-2 rounded text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Copy Code"
                >
                  <FaCopy />
                </button>
                <textarea
                  value={solutionCode}
                  onChange={(e) => setSolutionCode(e.target.value)}
                  className="w-full h-96 bg-transparent border-none resize-y focus:ring-0 font-mono text-sm text-green-300"
                />
              </div>
              <button
                onClick={() => { 
                  setStep(1); 
                  setImages([]); 
                  setImagePreviews([]); 
                  setProblemStatement(''); 
                  setSolutionCode(''); 
                  setTokenUsage(null);
                  setExecutionTime(0);
                }}
                className="w-full bg-gray-700 hover:bg-gray-600 py-3 rounded-xl font-medium transition-colors flex items-center justify-center"
              >
                Start New Question
              </button>
            </div>
          )}
        </div>

        {/* Logs Console */}
        <div className="bg-black rounded-xl p-4 font-mono text-xs text-green-400 h-40 overflow-y-auto border border-white/10">
          {logs.map((log, i) => (
            <div key={i}>{log}</div>
          ))}
          {logs.length === 0 && <span className="text-gray-600">Logs will appear here...</span>}
        </div>
        
        {error && (
          <div className="mt-4 bg-red-500/20 border border-red-500/40 text-red-400 p-4 rounded-xl flex items-center">
            <FaExclamationTriangle className="mr-2" />
            {error}
          </div>
        )}

      </div>
    </div>
  );
};

export default AdvancedQuestionSolver;
