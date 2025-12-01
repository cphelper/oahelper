import React, { useState, useEffect, useRef } from 'react';
import { FaSpinner, FaCheck, FaExclamationTriangle, FaPlay, FaPause, FaStop, FaTimes } from 'react-icons/fa';
import { API_ENDPOINTS, getApiHeaders, API_KEY as BACKEND_API_KEY } from '../config/api';

const AdvancedQuestionProcessor = ({ selectedQuestions, onClose, onComplete }) => {
  // Processing State
  const [queue, setQueue] = useState(selectedQuestions || []);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [logs, setLogs] = useState([]);
  const [results, setResults] = useState({}); // { questionId: { status: 'success'|'error', message: '' } }
  const [currentOutput, setCurrentOutput] = useState(null); // { type: 'solution'|'boilerplate', content: string }

  // Current Task State
  const [currentStep, setCurrentStep] = useState(''); // 'solution', 'boilerplate', 'saving'
  const [retryCount, setRetryCount] = useState(0);

  const messagesEndRef = useRef(null);

  const addLog = (msg) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
    setTimeout(scrollToBottom, 100);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Helpers
  const extractJson = (text) => {
    try {
      const match = text.match(/```json([\s\S]*?)```/) || text.match(/```([\s\S]*?)```/) || text.match(/{[\s\S]*}/);
      let jsonStr = match ? (match[1] || match[0]) : text;
      jsonStr = jsonStr.trim();
      return JSON.parse(jsonStr);
    } catch (e) {
      try {
        // Aggressive cleanup
        let cleaned = text;
        const start = cleaned.indexOf('{');
        const end = cleaned.lastIndexOf('}');
        if (start !== -1 && end !== -1 && end > start) {
             cleaned = cleaned.substring(start, end + 1);
             cleaned = cleaned.replace(/\\n/g, "\\n")  
                      .replace(/\\'/g, "\\'")
                      .replace(/\\"/g, '\\"')
                      .replace(/\\&/g, "\\&")
                      .replace(/\\r/g, "\\r")
                      .replace(/\\t/g, "\\t")
                      .replace(/\\b/g, "\\b")
                      .replace(/\\f/g, "\\f");
             cleaned = cleaned.replace(/[\u0000-\u0019]+/g,"");
             return JSON.parse(cleaned);
        }
        return null;
      } catch (e2) {
         return null;
      }
    }
  };

  const cleanHtml = (html) => {
    if (!html) return "";
    return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  };

  // Main Processing Loop
  useEffect(() => {
    if (processing && !isPaused) {
      processQueue();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [processing, isPaused, currentIndex]);

  const processQueue = async () => {
    if (currentIndex >= queue.length) {
      setProcessing(false);
      addLog('All questions processed!');
      if (onComplete) onComplete(results);
      return;
    }

    const question = queue[currentIndex];
    // Check if already processed (in case of resume/retry logic, though here we just move index)
    if (results[question.id]) {
       setCurrentIndex(prev => prev + 1);
       return;
    }

    try {
      addLog(`Processing Question ${currentIndex + 1}/${queue.length}: ${question.title} (ID: ${question.id})`);
      
      // Step 1: Generate Solution
      setCurrentStep('solution');
      const solutionData = await generateSolution(question);
      
      // Step 2: Generate Boilerplate
      setCurrentStep('boilerplate');
      const boilerplateData = await generateBoilerplate(question, solutionData.solution_cpp);
      
      // Step 3: Save
      setCurrentStep('saving');
      await saveQuestion(question, solutionData, boilerplateData);
      
      setResults(prev => ({
        ...prev,
        [question.id]: { status: 'success', message: 'Processed successfully' }
      }));
      addLog(`Successfully updated Question ${question.id}`);
      
      // Move to next
      setCurrentIndex(prev => prev + 1);
      setRetryCount(0);

    } catch (err) {
      addLog(`Error processing Question ${question.id}: ${err.message}`);
      
      // Simple retry logic for network glitches
      if (retryCount < 2) {
        addLog(`Retrying... (${retryCount + 1}/2)`);
        setRetryCount(prev => prev + 1);
        // processQueue will be called again due to dependency on currentIndex? No, index didn't change.
        // We need to trigger re-run. Since we are in async function, we can just recurse or let effect handle it?
        // Better to just wait a bit and retry this function call?
        // But state update takes time.
        setTimeout(() => {
             // Force re-run by toggling paused momentarily or just calling processQueue again?
             // If we just return, the effect won't trigger unless dependencies change.
             // Let's just call processQueue recursively after delay.
             processQueue();
        }, 2000);
        return;
      }

      setResults(prev => ({
        ...prev,
        [question.id]: { status: 'error', message: err.message }
      }));
      
      // Move to next even on error
      setCurrentIndex(prev => prev + 1);
      setRetryCount(0);
    }
  };

  const generateSolution = async (question) => {
    addLog('Generating C++ solution and test cases...');
    
    const prompt = `Given the following coding problem, provide the C++ code solution and a set of test cases.

Problem: ${question.title}
${cleanHtml(question.problem_statement)}

IMPORTANT INSTRUCTIONS:
1. Solve the problem efficiently in C++.
2. DO NOT add any comments to the code.
3. Create 6 test cases (2 from examples if any, 4 hidden/edge cases).
4. RETURN ONLY RAW JSON. NO MARKDOWN. NO EXPLANATIONS.
5. Use this EXACT structure:
{
  "solution_cpp": "string with full C++ code",
  "test_cases": {
    "inputs": ["input1_string", "input2_string", ...],
    "outputs": ["output1_string", "output2_string", ...]
  }
}`;

    const formData = new FormData();
    formData.append('prompt', prompt);
    formData.append('model', 'gemini-3-pro-preview');
    formData.append('thinking_level', 'HIGH');
    
    // Note: We are NOT sending images here, just prompt.
    // solve_question.php handles prompt-only requests.

    const response = await fetch(API_ENDPOINTS.SOLVE_QUESTION, {
        method: 'POST',
        headers: { 'X-API-Key': BACKEND_API_KEY },
        body: formData
    });

    const data = await response.json();
    if (data.status !== 'success') throw new Error(data.message || 'Solution generation failed');
    
    const json = extractJson(data.text);
    if (!json) throw new Error("Failed to parse solution JSON");

    // Validate structure
    if (!json.solution_cpp) throw new Error("Missing solution_cpp in response");
    
    // Normalize test cases
    let inputs = [];
    let outputs = [];
    if (json.test_cases) {
        inputs = json.test_cases.inputs || [];
        outputs = json.test_cases.outputs || [];
    } else if (json.inputs && json.outputs) {
        inputs = json.inputs;
        outputs = json.outputs;
    }

    setCurrentOutput({ type: 'Solution C++', content: json.solution_cpp });

    return {
        solution_cpp: json.solution_cpp,
        test_cases: {
            inputs: inputs.map(String),
            outputs: outputs.map(String)
        }
    };
  };

  const generateBoilerplate = async (question, solutionCpp) => {
    addLog('Generating boilerplate code...');
    
    const prompt = `You are an expert competitive programming coach.
      
Problem Title: ${question.title}
Problem Statement: ${cleanHtml(question.problem_statement)}

Reference Solution (C++):
${solutionCpp}

Generate:
1. Boilerplate code for C++, Python, and Java.
   - C++: main function, Solution class, empty method.
   - Python: input reading, Solution class, empty method.
   - Java: Main class, Scanner, Solution class, empty method.
   - All boilerplates should handle input/output parsing and call the Solution method.

Return ONLY valid JSON:
{
  "cpp_code": "...",
  "python_code": "...",
  "java_code": "..."
}`;

    const formData = new FormData();
    formData.append('prompt', prompt);
    formData.append('model', 'gemini-3-pro-preview');
    formData.append('thinking_level', 'LOW');

    const response = await fetch(API_ENDPOINTS.SOLVE_QUESTION, {
        method: 'POST',
        headers: { 'X-API-Key': BACKEND_API_KEY },
        body: formData
    });

    const data = await response.json();
    if (data.status !== 'success') throw new Error(data.message || 'Boilerplate generation failed');
    
    const json = extractJson(data.text);
    if (!json) throw new Error("Failed to parse boilerplate JSON");
    
    setCurrentOutput({ 
        type: 'Boilerplate (Python)', 
        content: json.python_code || 'No Python code generated'
    });

    return {
        cpp: json.cpp_code || '',
        python: json.python_code || '',
        java: json.java_code || ''
    };
  };

  const saveQuestion = async (question, solutionData, boilerplateData) => {
    addLog('Saving updated question to database...');

    const payload = {
        action: 'update_question',
        question_id: question.id,
        title: question.title,
        problem_statement: question.problem_statement,
        solution_cpp: solutionData.solution_cpp,
        pregiven_code_cpp: boilerplateData.cpp,
        pregiven_code_python: boilerplateData.python,
        pregiven_code_java: boilerplateData.java,
        input_test_case: JSON.stringify(solutionData.test_cases.inputs),
        output_test_case: JSON.stringify(solutionData.test_cases.outputs)
    };

    const response = await fetch(API_ENDPOINTS.COMPANY, {
        method: 'POST',
        headers: getApiHeaders(),
        body: JSON.stringify(payload)
    });

    const data = await response.json();
    if (data.status !== 'success') throw new Error(data.message || 'Save failed');
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#161616] border border-white/20 rounded-2xl w-full max-w-4xl h-[80vh] flex flex-col shadow-2xl">
        
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center">
              <FaSpinner className={`mr-3 ${processing && !isPaused ? 'animate-spin text-blue-400' : 'text-gray-400'}`} />
              Advanced AI Processor
            </h2>
            <p className="text-gray-400 text-sm mt-1">
              Processing {queue.length} questions with Gemini 3 Pro
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white p-2">
            <FaTimes size={24} />
          </button>
        </div>

        {/* Progress */}
        <div className="px-6 py-4 bg-white/5 border-b border-white/10">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-white font-medium">Overall Progress</span>
            <span className="text-blue-400">{currentIndex}/{queue.length} Completed</span>
          </div>
          <div className="w-full bg-black rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${(currentIndex / queue.length) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col p-6 space-y-6">
          
          {/* Current Task Status */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            {currentIndex < queue.length ? (
              <>
                 <h3 className="text-lg font-bold text-white mb-2">
                   Current: {queue[currentIndex].title}
                 </h3>
                 <div className="flex items-center space-x-4 text-sm">
                   <div className={`flex items-center ${currentStep === 'solution' ? 'text-blue-400 font-bold' : 'text-gray-500'}`}>
                     1. Generate Solution
                   </div>
                   <div className="h-px w-8 bg-white/10"></div>
                   <div className={`flex items-center ${currentStep === 'boilerplate' ? 'text-blue-400 font-bold' : 'text-gray-500'}`}>
                     2. Generate Boilerplate
                   </div>
                   <div className="h-px w-8 bg-white/10"></div>
                   <div className={`flex items-center ${currentStep === 'saving' ? 'text-blue-400 font-bold' : 'text-gray-500'}`}>
                     3. Save & Update
                   </div>
                 </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-green-400 text-xl font-bold">
                <FaCheck className="mr-3" /> All tasks completed!
              </div>
            )}
          </div>

          {/* Split View: Logs and Output */}
          <div className="flex-1 flex space-x-4 overflow-hidden">
            {/* Logs Console */}
            <div className="flex-1 bg-black rounded-xl p-4 font-mono text-xs text-green-400 overflow-y-auto border border-white/10">
              <h4 className="text-gray-500 font-bold mb-2 sticky top-0 bg-black pb-2 border-b border-white/10">Process Logs</h4>
              {logs.map((log, i) => (
                <div key={i} className="mb-1 opacity-80 hover:opacity-100">{log}</div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Output Preview */}
            <div className="flex-1 bg-[#0a0a0a] rounded-xl p-4 border border-white/10 overflow-hidden flex flex-col">
                <h4 className="text-gray-500 font-bold mb-2 text-xs uppercase tracking-wider flex justify-between">
                    <span>Generated Output: {currentOutput ? currentOutput.type : 'Waiting...'}</span>
                </h4>
                <div className="flex-1 overflow-y-auto bg-white/5 rounded p-2">
                    {currentOutput ? (
                        <pre className="text-xs font-mono text-blue-300 whitespace-pre-wrap break-all">
                            {currentOutput.content}
                        </pre>
                    ) : (
                        <div className="flex items-center justify-center h-full text-gray-600 text-xs italic">
                            Output will appear here...
                        </div>
                    )}
                </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex justify-center space-x-4">
            {!processing && currentIndex === 0 ? (
              <button
                onClick={() => { setProcessing(true); setIsPaused(false); }}
                className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold flex items-center transition-all shadow-lg shadow-blue-500/20"
              >
                <FaPlay className="mr-2" /> Start Processing
              </button>
            ) : (
              <>
                 {processing && !isPaused && (
                   <button
                     onClick={() => setIsPaused(true)}
                     className="px-6 py-3 bg-yellow-500/20 text-yellow-400 border border-yellow-500/50 hover:bg-yellow-500/30 rounded-xl font-medium flex items-center"
                   >
                     <FaPause className="mr-2" /> Pause
                   </button>
                 )}
                 {processing && isPaused && (
                   <button
                     onClick={() => setIsPaused(false)}
                     className="px-6 py-3 bg-green-500/20 text-green-400 border border-green-500/50 hover:bg-green-500/30 rounded-xl font-medium flex items-center"
                   >
                     <FaPlay className="mr-2" /> Resume
                   </button>
                 )}
                 <button
                   onClick={onClose}
                   className="px-6 py-3 bg-red-500/20 text-red-400 border border-red-500/50 hover:bg-red-500/30 rounded-xl font-medium flex items-center"
                 >
                   <FaStop className="mr-2" /> Close / Stop
                 </button>
              </>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default AdvancedQuestionProcessor;
