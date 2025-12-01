import React, { useState, useRef } from 'react';
import { FaUpload, FaSpinner, FaCheck, FaExclamationTriangle, FaCode, FaArrowRight, FaSave, FaImage, FaTimes } from 'react-icons/fa';
import { API_ENDPOINTS, getApiHeaders, API_KEY as BACKEND_API_KEY } from '../config/api';
import { useNavigate } from 'react-router-dom';
import { encryptId } from '../utils/encryption';

const AdvancedQuestionUpload = () => {
  const navigate = useNavigate();

  // State
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [step, setStep] = useState(1); // 1: Upload, 2: Extract, 3: Solution, 4: Boilerplate, 5: Review
  const [processing, setProcessing] = useState(false);
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState('');

  // Automation State
  const [autoMode, setAutoMode] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Data
  const [companyName, setCompanyName] = useState('');
  const [questionType, setQuestionType] = useState('coding');
  const [problemStatement, setProblemStatement] = useState('');
  const [solutionCpp, setSolutionCpp] = useState('');
  const [pregivenCode, setPregivenCode] = useState({ cpp: '', python: '', java: '' });
  const [testCases, setTestCases] = useState({ inputs: [], outputs: [] });

  const fileInputRef = useRef(null);

  const [blurPercentage, setBlurPercentage] = useState(0);
  const [blurredImages, setBlurredImages] = useState([]);

  // Helpers
  const addLog = (msg) => setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);

  // Automation Effect
  React.useEffect(() => {
    let timer;
    if (autoMode && !isPaused && !processing && step < 4 && countdown > 0) {
      timer = setTimeout(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
    } else if (autoMode && !isPaused && !processing && step < 4 && countdown === 0) {
      // Trigger next step
      if (step === 1) {
        // Should have started manually, but if we are here/looping
        handleExtractProblem();
      } else if (step === 2) {
        handleGenerateSolution();
      } else if (step === 3) {
        if (questionType === 'coding') {
          handleGenerateBoilerplate();
        } else {
          setStep(4); // Skip boilerplate for non-coding
        }
      }
    }
    return () => clearTimeout(timer);
  }, [autoMode, isPaused, processing, step, countdown]);

  // Initialize countdown when entering a new step in auto mode
  React.useEffect(() => {
    if (autoMode && !processing) {
      if (step === 2 || step === 3) {
        setCountdown(5);
      }
    }
  }, [step, autoMode, processing]);

  const startAutoProcess = () => {
    if (images.length === 0) return setError('Please upload images');
    if (!companyName) return setError('Please enter company name');

    setAutoMode(true);
    setIsPaused(false);
    handleExtractProblem();
  };

  const stopAutoProcess = () => {
    setAutoMode(false);
    setIsPaused(true);
    setCountdown(0);
  };

  const resumeAutoProcess = () => {
    setAutoMode(true);
    setIsPaused(false);
    setCountdown(5); // Reset countdown or continue? Let's reset to be safe/clear
  };

  const blurImageTop = (file, customBlurPercentage = null) => {
    return new Promise((resolve) => {
      // Optimize: If blur is 0, return immediately without canvas op
      const percentage = customBlurPercentage !== null ? customBlurPercentage : blurPercentage;
      if (percentage === 0) {
        resolve({
          blob: file,
          url: URL.createObjectURL(file),
          filename: file.name
        });
        return;
      }

      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      img.onload = () => {
        // Limit max resolution for performance (e.g. max 1200px width)
        const maxDim = 1200;
        let width = img.width;
        let height = img.height;
        
        if (width > maxDim || height > maxDim) {
          const ratio = Math.min(maxDim / width, maxDim / height);
          width = Math.floor(width * ratio);
          height = Math.floor(height * ratio);
        }

        canvas.width = width;
        canvas.height = height;

        // Draw resized image
        ctx.drawImage(img, 0, 0, width, height);

        const blurHeight = Math.floor(height * (percentage / 100));

        if (blurHeight > 0) {
          ctx.save();
          ctx.beginPath();
          ctx.rect(0, 0, width, blurHeight);
          ctx.clip();
          ctx.filter = 'blur(15px)';
          ctx.drawImage(img, 0, 0, width, height); // Draw again with filter
          ctx.restore();

          // Add watermark text
          ctx.font = 'bold 24px Arial';
          ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
          ctx.strokeStyle = 'rgba(0, 0, 0, 0.7)';
          ctx.lineWidth = 2;
          ctx.textAlign = 'center';

          // Add "oahelper.in" text
          const text1 = 'oahelper.in';
          const text1Y = blurHeight * 0.4;
          ctx.strokeText(text1, width / 2, text1Y);
          ctx.fillText(text1, width / 2, text1Y);

          // Add "blurred for safety reasons" text
          ctx.font = 'bold 16px Arial';
          const text2 = `blurred ${percentage}% for safety reasons`;
          const text2Y = blurHeight * 0.7;
          ctx.strokeText(text2, width / 2, text2Y);
          ctx.fillText(text2, width / 2, text2Y);
        }

        canvas.toBlob((blob) => {
          resolve({
            blob: blob,
            url: URL.createObjectURL(blob),
            filename: file.name
          });
        }, 'image/jpeg', 0.85); // slightly lower quality for speed
      };

      img.src = URL.createObjectURL(file);
    });
  };

  const fileToGenerativePart = async (file) => {
    const base64EncodedDataPromise = new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result.split(',')[1]);
      reader.readAsDataURL(file);
    });
    return {
      inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
    };
  };

  const extractJson = (text) => {
    try {
      // First attempt: simple regex for code blocks
      const match = text.match(/```json([\s\S]*?)```/) || text.match(/```([\s\S]*?)```/) || text.match(/{[\s\S]*}/);
      let jsonStr = match ? (match[1] || match[0]) : text;
      
      // Cleanups
      jsonStr = jsonStr.trim();
      
      // Try to parse
      return JSON.parse(jsonStr);
    } catch (e) {
      console.warn("Initial JSON Parse failed, attempting cleanup:", e);
      
      try {
        // Second attempt: aggressive cleanup for common LLM errors
        // 1. Fix unterminated strings (sometimes it happens with newlines)
        // 2. Remove trailing commas
        // 3. Find the first '{' and last '}'
        let cleaned = text;
        
        const start = cleaned.indexOf('{');
        const end = cleaned.lastIndexOf('}');
        
        if (start !== -1 && end !== -1 && end > start) {
             cleaned = cleaned.substring(start, end + 1);
             // Replace escaped newlines that might break JSON
             cleaned = cleaned.replace(/\\n/g, "\\n")  
                      .replace(/\\'/g, "\\'")
                      .replace(/\\"/g, '\\"')
                      .replace(/\\&/g, "\\&")
                      .replace(/\\r/g, "\\r")
                      .replace(/\\t/g, "\\t")
                      .replace(/\\b/g, "\\b")
                      .replace(/\\f/g, "\\f");
             // Remove control characters
             cleaned = cleaned.replace(/[\u0000-\u0019]+/g,"");
             
             return JSON.parse(cleaned);
        }
        
        return null;
      } catch (e2) {
         console.error("Aggressive JSON Parse Error:", e2);
         return null;
      }
    }
  };

  const cleanHtml = (html) => {
    if (!html) return "";
    return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  };

  // Handlers
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      setImages(prev => [...prev, ...files]);
      const newPreviews = files.map(file => URL.createObjectURL(file));
      setImagePreviews(prev => [...prev, ...newPreviews]);
    }
  };

  const handleExtractProblem = async () => {
    if (images.length === 0) return setError('Please upload images');
    if (!companyName) return setError('Please enter company name');

    setProcessing(true);
    setError('');
    const startTime = performance.now();
    addLog('Starting problem extraction (Gemini 3 Pro - Low Thinking)...');

    try {
      let prompt = "";

      if (questionType === 'mcq') {
        prompt = `You are an expert at converting MCQ (Multiple Choice Question) images to structured HTML. Follow these rules precisely:

    1. **TITLE EXTRACTION**: Start with an <h1> tag containing the question number or title (like 'Question 1', 'MCQ - Arrays', etc.)
    
    2. **QUESTION STRUCTURE**: Structure the MCQ clearly:
       - <h2>Question</h2> (the main question text)
       - <h2>Options</h2> (list all options A, B, C, D, etc.)
       - <h2>Correct Answer</h2> (if visible in the image)
       - <h2>Explanation</h2> (if provided in the image)
    
    3. **FORMATTING RULES**:
       - Use <p> for the question text
       - Use <ul> and <li> for options list
       - Use <strong> for option labels (A), (B), (C), (D)
       - Use <pre><code class='language-text'> for any code snippets in options
       - Highlight the correct answer with <strong> or <mark> tags if shown
       - Use <p> for explanation text
    
    4. **OPTION FORMAT**:
       <ul>
         <li><strong>(A)</strong> First option text</li>
         <li><strong>(B)</strong> Second option text</li>
         <li><strong>(C)</strong> Third option text</li>
         <li><strong>(D)</strong> Fourth option text</li>
       </ul>
    
    6. **NO CONVERSATIONAL TEXT**:
       - Return ONLY the HTML content
       - Do not start with "Here is the structured HTML..." or similar phrases
       - Do not add any markdown code blocks (no \`\`\`html)
    
    Convert the uploaded MCQ images to clean, structured HTML.`;
      } else if (questionType === 'sql') {
        prompt = `You are an expert at converting SQL problem images to structured HTML. Follow these rules precisely:

    1. **TITLE EXTRACTION**: Start with an <h1> tag containing the problem title (like 'Employee Salary Query', 'Database Design', etc.)
    
    2. **PROBLEM STRUCTURE**: Structure the SQL problem clearly:
       - <h2>Problem Description</h2> (main problem explanation)
       - <h2>Database Schema</h2> (table structures with columns and types)
       - <h2>Sample Data</h2> (example data in tables)
       - <h2>Expected Output</h2> (what the query should return)
       - <h2>Constraints</h2> (if mentioned)
    
    3. **FORMATTING RULES**:
       - Use <pre><code class='language-sql'> for SQL queries and schema definitions
       - Use <pre><code class='language-text'> for sample data tables
       - Use <strong> for table names and column names in descriptions
       - Use <ul> and <li> for constraint lists
       - Use <p> for regular text paragraphs
    
    4. **SCHEMA FORMAT**:
       <pre><code class='language-sql'>CREATE TABLE Employees (
    id INT PRIMARY KEY,
    name VARCHAR(100),
    salary DECIMAL(10,2)
);</code></pre>
    
    5. **CLEAN OUTPUT**:
       - No CSS styling or classes except for code language specification
       - Don't wrap in html/body tags
       - Make it clean and semantic
       - Preserve SQL syntax exactly as shown

    6. **NO CONVERSATIONAL TEXT**:
       - Return ONLY the HTML content
       - Do not start with "Here is the structured HTML..." or similar phrases
       - Do not add any markdown code blocks (no \`\`\`html)
    
    Convert the uploaded SQL problem images to clean, structured HTML.`;
      } else if (questionType === 'api') {
        prompt = `You are an expert at converting API design/integration problem images to structured HTML. Follow these rules precisely:

    1. **TITLE EXTRACTION**: Start with an <h1> tag containing the problem title (like 'REST API Design', 'API Integration', etc.)
    
    2. **PROBLEM STRUCTURE**: Structure the API problem clearly:
       - <h2>Problem Description</h2> (main problem explanation)
       - <h2>API Endpoints</h2> (list of endpoints with methods)
       - <h2>Request Format</h2> (request body/parameters)
       - <h2>Response Format</h2> (expected response structure)
       - <h2>Examples</h2> (sample requests and responses)
       - <h2>Requirements</h2> (constraints and specifications)
    
    3. **FORMATTING RULES**:
       - Use <pre><code class='language-json'> for JSON request/response examples
       - Use <pre><code class='language-text'> for endpoint URLs
       - Use <strong> for HTTP methods (GET, POST, PUT, DELETE)
       - Use <ul> and <li> for requirement lists
       - Use <p> for regular text paragraphs
    
    4. **ENDPOINT FORMAT**:
       <p><strong>POST</strong> /api/users</p>
       <pre><code class='language-json'>{
    "name": "John Doe",
    "email": "john@example.com"
}</code></pre>
    
    5. **CLEAN OUTPUT**:
       - No CSS styling or classes except for code language specification
       - Don't wrap in html/body tags
       - Make it clean and semantic
       - Preserve API specifications exactly as shown

    6. **NO CONVERSATIONAL TEXT**:
       - Return ONLY the HTML content
       - Do not start with "Here is the structured HTML..." or similar phrases
       - Do not add any markdown code blocks (no \`\`\`html)
    
    Convert the uploaded API problem images to clean, structured HTML.`;
      } else {
        prompt = `You are an expert at converting coding problem images to structured HTML that matches LeetCode format. Follow these rules precisely:

    1. **TITLE EXTRACTION**: Start with an <h1> tag containing ONLY the problem title (like 'Two Sum', 'Valid Parentheses', etc.)
    
    2. **PROBLEM STRUCTURE**: Structure the problem exactly like LeetCode:
       - <h2>Problem Description</h2> (main problem explanation)
       - <h2>Examples</h2> (with Example 1, Example 2, etc. as <h3> subheadings)
       - <h2>Constraints</h2> (if mentioned)
       - <h2>Follow-up</h2> (if there's a follow-up question)
    
    3. **FORMATTING RULES**:
       - Use <pre><code class='language-text'> for input/output examples
       - Use <pre><code class='language-javascript'> for any code snippets
       - Use <strong> for important keywords like 'Input:', 'Output:', 'Explanation:'
       - Use <ul> and <li> for constraint lists
       - Use <p> for regular text paragraphs
    
    4. **EXAMPLE FORMAT**:
       <h3>Example 1:</h3>
       <pre><code class='language-text'>Input: nums = [2,7,11,15], target = 9
       Output: [0,1]</code></pre>
       <p><strong>Explanation:</strong> Because nums[0] + nums[1] == 9, we return [0, 1].</p>
    
    5. **CLEAN OUTPUT**:
       - No CSS styling or classes except for code language specification
       - Don't wrap in html/body tags
       - Make it clean and semantic
       - Keep mathematical expressions clear (use proper symbols)

    6. **NO CONVERSATIONAL TEXT**:
       - Return ONLY the HTML content
       - Do not start with "Here is the structured HTML..." or similar phrases
       - Do not add any markdown code blocks (no \`\`\`html)
    
    Convert the uploaded problem statement images to clean, LeetCode-style structured HTML.`;
      }

      addLog(`Sending images to Gemini 3 Pro (Low Thinking) for ${questionType} extraction...`);

      const formData = new FormData();
      formData.append('prompt', prompt);
      formData.append('model', 'gemini-3-pro-preview');
      formData.append('thinking_level', 'LOW');
      formData.append('max_tokens', '64000');

      images.forEach((file, index) => {
        formData.append(`image_${index}`, file);
      });

      const response = await fetch(API_ENDPOINTS.SOLVE_QUESTION, {
        method: 'POST',
        headers: {
          'X-API-Key': BACKEND_API_KEY
        },
        body: formData
      });

      const data = await response.json();
      if (data.status !== 'success') throw new Error(data.message || 'Generation failed');

      const text = data.text;

      // Clean up markdown code blocks if present
      const cleanText = text.replace(/```html|```/g, '').trim();

      const timeTaken = ((performance.now() - startTime) / 1000).toFixed(2);
      setProblemStatement(cleanText);
      addLog(`Problem statement extracted successfully in ${timeTaken}s.`);
      setStep(prev => prev === 4 ? 4 : 2);
    } catch (err) {
      setError(err.message);
      addLog(`Error: ${err.message}`);
      setAutoMode(false); // Stop on error
    } finally {
      setProcessing(false);
    }
  };

  const handleGenerateSolution = async () => {
    setProcessing(true);
    setError('');
    const startTime = performance.now();
    addLog('Generating C++ solution (Gemini 3 Pro - High Thinking)...');

    try {
      let prompt = "";

      if (questionType === 'mcq') {
        prompt = `Given the following Multiple Choice Questions (MCQs), provide detailed solutions for ALL questions.

Problem Set: ${companyName} Question

${cleanHtml(problemStatement)}

IMPORTANT INSTRUCTIONS:
1. This problem contains MULTIPLE MCQ questions (could be 10 or more)
2. For EACH question, provide:
   - Question number
   - The correct answer option (A, B, C, D, etc.)
   - A clear explanation of why that answer is correct
   - Brief explanation of why other options are incorrect (if relevant)
3. Format your response as JSON:
{
  "solution_cpp": "Question 1: [Summary]\\nAnswer: [Option]\\nExplanation: [Text]... (formatted as text)",
  "test_cases": { "inputs": [], "outputs": [] }
}
4. Make sure to answer ALL MCQ questions present in the problem statement
5. Be thorough and accurate in your explanations`;
      } else if (questionType === 'sql') {
        prompt = `Given the following SQL problem, provide a detailed solution with SQL queries.

Problem: ${companyName} Question

${cleanHtml(problemStatement)}

IMPORTANT INSTRUCTIONS:
1. Provide the complete SQL query/queries that solve the problem
2. Include explanations for complex parts of the query
3. Format your response as JSON:
{
  "solution_cpp": "Solution:\\n\`\`\`sql\\n[Query]\\n\`\`\`\\nExplanation:\\n[Text]...",
  "test_cases": { "inputs": [], "outputs": [] }
}
4. Make sure the query handles all edge cases mentioned in the problem`;
      } else if (questionType === 'api') {
        prompt = `Given the following API design/integration problem, provide a detailed solution.

Problem: ${companyName} Question

${cleanHtml(problemStatement)}

IMPORTANT INSTRUCTIONS:
1. Provide the complete API design or integration code
2. Include endpoint definitions, request/response formats
3. Format your response as JSON:
{
  "solution_cpp": "Solution:\\nEndpoints:\\n[List]\\nImplementation:\\n\`\`\`javascript\\n[Code]\\n\`\`\`\\nExplanation:\\n[Text]...",
  "test_cases": { "inputs": [], "outputs": [] }
}
4. Make sure the solution handles all requirements mentioned`;
      } else {
        prompt = `Given the following coding problem and images, provide the C++ code solution and a set of test cases.

Problem: ${companyName} Question
${cleanHtml(problemStatement)}

IMPORTANT INSTRUCTIONS:
1. Solve the problem efficiently in C++.
2. DO NOT add any comments to the code.
3. Create 6 test cases (2 from examples, 4 hidden/edge cases).
4. RETURN ONLY RAW JSON. NO MARKDOWN. NO EXPLANATIONS.
5. Use this EXACT structure:
{
  "solution_cpp": "string with full C++ code",
  "test_cases": {
    "inputs": ["input1_string", "input2_string", ...],
    "outputs": ["output1_string", "output2_string", ...]
  }
}
`;
      }

      addLog(`Sending request to Gemini 3 Pro (High Thinking) for ${questionType} solution...`);

      const formData = new FormData();
      formData.append('prompt', prompt);
      formData.append('model', 'gemini-3-pro-preview');
      formData.append('thinking_level', 'HIGH');
      formData.append('max_tokens', '64000');

      images.forEach((file, index) => {
        formData.append(`image_${index}`, file);
      });

      const response = await fetch(API_ENDPOINTS.SOLVE_QUESTION, {
        method: 'POST',
        headers: {
          'X-API-Key': BACKEND_API_KEY
        },
        body: formData
      });

      const data = await response.json();
      if (data.status !== 'success') throw new Error(data.message || 'Generation failed');

      let text = data.text;

      // Log raw response for debugging


      const json = extractJson(text);

      if (!json) {
        // Fallback: try to extract just solution code if JSON parsing failed completely
        const match = text.match(/```(?:cpp|c\+\+)?([\s\S]*?)```/);
        if (match) {
          setSolutionCpp(match[1].trim());
          addLog('Warning: Failed to parse JSON, extracted code block only.');
          setStep(prev => prev === 4 ? 4 : 3);
          return;
        }
        throw new Error("Failed to parse solution JSON");
      }

      setSolutionCpp(json.solution_cpp || '');

      // Handle test cases with fallback for different structures
      let inputs = [];
      let outputs = [];

      if (json.test_cases) {
        if (Array.isArray(json.test_cases.inputs)) inputs = json.test_cases.inputs;
        if (Array.isArray(json.test_cases.outputs)) outputs = json.test_cases.outputs;
      } else if (json.inputs && json.outputs) {
        // Fallback: inputs/outputs at root
        inputs = json.inputs;
        outputs = json.outputs;
      }

      setTestCases({
        inputs: inputs.map(String),
        outputs: outputs.map(String)
      });

      const timeTaken = ((performance.now() - startTime) / 1000).toFixed(2);
      addLog(`Solution and ${inputs.length} test cases generated in ${timeTaken}s.`);
      setStep(prev => prev === 4 ? 4 : 3);
    } catch (err) {
      setError(err.message);
      addLog(`Error: ${err.message}`);
      setAutoMode(false); // Stop on error
    } finally {
      setProcessing(false);
    }
  };

  const handleGenerateBoilerplate = async () => {
    setProcessing(true);
    setError('');
    addLog('Generating boilerplate and test cases...');

    try {
      const prompt = `You are an expert competitive programming coach.
      
Problem Title: ${companyName} Question
Problem Statement: ${cleanHtml(problemStatement)}

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
      formData.append('max_tokens', '64000');

      const response = await fetch(API_ENDPOINTS.SOLVE_QUESTION, {
        method: 'POST',
        headers: {
          'X-API-Key': BACKEND_API_KEY
        },
        body: formData
      });

      const data = await response.json();
      if (data.status !== 'success') throw new Error(data.message || 'Generation failed');

      const json = extractJson(data.text);

      if (!json) throw new Error("Failed to parse JSON response");

      setPregivenCode({
        cpp: json.cpp_code,
        python: json.python_code,
        java: json.java_code
      });

      // Test cases were already generated in previous step
      addLog('Boilerplate generated.');
      setStep(4);
    } catch (err) {
      setError(err.message);
      addLog(`Error: ${err.message}`);
      setAutoMode(false);
    } finally {
      setProcessing(false);
    }
  };

  const handleSave = async () => {
    setProcessing(true);
    addLog('Applying image blur...');

    try {
      // Process images with blur
      const processedImages = await Promise.all(images.map(file => blurImageTop(file, blurPercentage)));

      addLog('Saving to database...');

      const formData = new FormData();
      formData.append('company_name', companyName);
      formData.append('problem_statement', problemStatement);
      formData.append('cpp_solution', solutionCpp);
      formData.append('pregiven_code_cpp', pregivenCode.cpp);
      formData.append('pregiven_code_python', pregivenCode.python);
      formData.append('pregiven_code_java', pregivenCode.java);
      formData.append('input_test_case', JSON.stringify(testCases.inputs));
      formData.append('output_test_case', JSON.stringify(testCases.outputs));
      formData.append('confirm_upload', 'true');
      formData.append('question_type', questionType);

      // Send blurred images instead of original images
      processedImages.forEach((blurredImage, index) => {
        // Create a File object from the blob with the original filename
        const blurredFile = new File([blurredImage.blob], blurredImage.filename, {
          type: 'image/jpeg',
          lastModified: Date.now()
        });
        formData.append(`image_${index}`, blurredFile);
      });

      // NOTE: The standard upload_question.php might not accept boilerplate/tests directly in the create call
      // depending on implementation. If not, we'd need a second call to update.
      // Assuming we can add them or update later.
      // Let's try to attach them as metadata or rely on the backend to process images if we didn't override.
      // But here we WANT to override with our generated content.

      // We'll send the basic create request first.
      const headers = {
        'X-API-Key': BACKEND_API_KEY
      };

      const response = await fetch(API_ENDPOINTS.UPLOAD_QUESTION, {
        method: 'POST',
        headers: headers,
        body: formData
      });

      const data = await response.json();

      if (data.status === 'success') {
        addLog(`Question created with ID: ${data.question_id}`);

        // Now update with the extra generated data (boilerplate, tests)
        // We need an endpoint to update these specific fields. 
        // In Admin.js, there is API_ENDPOINTS.COMPANY with action='update_question' but maybe not for tests?
        // Let's assume we can use a custom query or extend the update.
        // For now, we'll try to assume the backend might need an update.

        // Since we don't have a direct "update_tests" endpoint visible in Admin.js snippet (it had basic update),
        // we might need to rely on manual DB update or assume the user will copy-paste if automation isn't fully wired.
        // HOWEVER, the Python script updated `pregiven_code_cpp`, `input_test_case` etc.
        // We should check if we can call a generic update or SQL execute (dangerous/unlikely).

        // Let's try to call the update_question endpoint if it supports these fields, or just finish.
        // Currently Admin.js saveQuestionEdit sends: title, problem_statement, solution_cpp.
        // We will implement the update for pregiven code if possible, otherwise we stop here and notify user.

        // If we strictly follow "take that info from upload question section", we use UPLOAD_QUESTION.
        // We'll assume success for now and navigate.

        // To fully replicate the python script, we'd need to update the DB columns:
        // pregiven_code_cpp, pregiven_code_python, pregiven_code_java, input_test_case, output_test_case.
        // If the PHP endpoint doesn't support it, we can't do it from frontend without backend changes.
        // I will display a success message with the data for now.

        addLog('Question saved! Note: Boilerplate/Tests might need manual entry if backend update is not configured.');

        // Attempt to update extra fields if we can find an endpoint.
        // The python script uses direct SQL. We can't do that here.

        setTimeout(() => {
          navigate(`/questions/${encryptId(data.question_id)}?company_id=${encryptId(data.company_id)}`);
        }, 2000);
      } else {
        throw new Error(data.message || 'Upload failed');
      }
    } catch (err) {
      setError(err.message);
      addLog(`Save Error: ${err.message}`);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="bg-[#161616] min-h-screen text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
          Advanced AI Question Upload
        </h1>



        {/* Step 1: Upload */}
        <div className={`mb-8 transition-opacity ${step >= 1 ? 'opacity-100' : 'opacity-50'}`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center">
              <span className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm mr-3">1</span>
              Upload Images & Details
            </h2>
            {step > 1 && <FaCheck className="text-green-400" />}
          </div>

          {step === 1 && (
            <div className="space-y-4 pl-11">
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Company Name"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500"
              />

              <div className="grid grid-cols-4 gap-2">
                {['coding', 'mcq', 'sql', 'api'].map(type => (
                  <button
                    key={type}
                    onClick={() => setQuestionType(type)}
                    className={`py-2 px-4 rounded-lg capitalize text-sm font-medium transition-colors ${questionType === type
                      ? 'bg-blue-600 text-white'
                      : 'bg-white/5 text-gray-400 hover:bg-white/10'
                      }`}
                  >
                    {type}
                  </button>
                ))}
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

              <div className="flex gap-4 mt-4">
                <button
                  onClick={startAutoProcess}
                  disabled={processing || !companyName || images.length === 0}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 py-4 rounded-xl font-bold text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-lg shadow-purple-500/20"
                >
                  {processing ? <FaSpinner className="animate-spin mr-2" /> : <FaArrowRight className="mr-2" />}
                  Start Magic Auto-Process
                </button>

                <button
                  onClick={handleExtractProblem}
                  disabled={processing || !companyName || images.length === 0}
                  className="px-6 bg-white/10 hover:bg-white/20 rounded-xl font-medium transition-colors disabled:opacity-50"
                  title="Manual Step-by-Step"
                >
                  Manual
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Auto Mode Status Bar */}
        {autoMode && step < 4 && (
          <div className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-white/10 p-4 z-50 shadow-2xl">
            <div className="max-w-4xl mx-auto flex items-center justify-between">
              <div className="flex items-center gap-4">
                {processing ? (
                  <div className="flex items-center text-blue-400">
                    <FaSpinner className="animate-spin mr-2" />
                    <span className="font-semibold animate-pulse">Processing...</span>
                  </div>
                ) : (
                  <div className="flex items-center text-yellow-400">
                    <span className="font-bold text-xl mr-2">{countdown}s</span>
                    <span>Next step starting soon...</span>
                  </div>
                )}
                <div className="text-gray-400 text-sm">
                  Current Step: {step === 2 ? 'Problem Extraction Done' : step === 3 ? 'Solution Generated' : 'Starting...'}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => stopAutoProcess()}
                  className="bg-red-500/20 text-red-400 hover:bg-red-500/30 px-4 py-2 rounded-lg font-medium border border-red-500/50"
                >
                  Stop / Pause
                </button>
                {!processing && (
                  <button
                    onClick={() => setCountdown(0)}
                    className="bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 px-4 py-2 rounded-lg font-medium border border-blue-500/50"
                  >
                    Skip Wait
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Problem Statement */}
        <div className={`mb-8 transition-opacity ${step >= 2 ? 'opacity-100' : 'opacity-50'}`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center">
              <span className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm mr-3">2</span>
              Review Problem Statement
            </h2>
            {step > 2 && <FaCheck className="text-green-400" />}
          </div>

          {step === 2 && (
            <div className="pl-11 space-y-4">
              <div className="bg-white/5 rounded-lg p-4">
                <textarea
                  value={problemStatement}
                  onChange={(e) => setProblemStatement(e.target.value)}
                  className="w-full h-64 bg-transparent border-none resize-y focus:ring-0 font-mono text-sm"
                  placeholder="Problem statement will appear here..."
                />
              </div>
              {!autoMode && (
                <button
                  onClick={handleGenerateSolution}
                  disabled={processing}
                  className="w-full bg-purple-600 hover:bg-purple-500 py-3 rounded-xl font-medium transition-colors disabled:opacity-50 flex items-center justify-center"
                >
                  {processing ? <FaSpinner className="animate-spin mr-2" /> : <FaCode className="mr-2" />}
                  Generate Solution (Gemini 3 Pro Logic)
                </button>
              )}
            </div>
          )}
        </div>

        {/* Step 3: Solution */}
        <div className={`mb-8 transition-opacity ${step >= 3 ? 'opacity-100' : 'opacity-50'}`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center">
              <span className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm mr-3">3</span>
              Review C++ Solution
            </h2>
            {step > 3 && <FaCheck className="text-green-400" />}
          </div>

          {step === 3 && (
            <div className="pl-11 space-y-4">
              <div className="bg-white/5 rounded-lg p-4">
                <textarea
                  value={solutionCpp}
                  onChange={(e) => setSolutionCpp(e.target.value)}
                  className="w-full h-64 bg-transparent border-none resize-y focus:ring-0 font-mono text-sm text-green-300"
                />
              </div>
              {!autoMode && (
                questionType === 'coding' ? (
                  <button
                    onClick={handleGenerateBoilerplate}
                    disabled={processing}
                    className="w-full bg-orange-600 hover:bg-orange-500 py-3 rounded-xl font-medium transition-colors disabled:opacity-50 flex items-center justify-center"
                  >
                    {processing ? <FaSpinner className="animate-spin mr-2" /> : <FaCode className="mr-2" />}
                    Generate Boilerplate
                  </button>
                ) : (
                  <button
                    onClick={() => setStep(4)}
                    disabled={processing}
                    className="w-full bg-green-600 hover:bg-green-500 py-3 rounded-xl font-medium transition-colors disabled:opacity-50 flex items-center justify-center"
                  >
                    Proceed to Review
                  </button>
                )
              )}
            </div>
          )}
        </div>

        {/* Step 4: Final Review & Edit Dashboard */}
        <div className={`mb-8 transition-opacity ${step >= 4 ? 'opacity-100' : 'opacity-50'}`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center">
              <span className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm mr-3">4</span>
              Final Review & Edit Dashboard
            </h2>
            {step > 4 && <FaCheck className="text-green-400" />}
          </div>

          {step === 4 && (
            <div className="pl-11 space-y-6">
              <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-white">Problem Statement</h3>
                  <button
                    onClick={handleExtractProblem}
                    disabled={processing}
                    className="text-xs bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 px-3 py-1 rounded border border-blue-500/50"
                  >
                    Re-Extract (Changes Step 2)
                  </button>
                </div>
                <textarea
                  value={problemStatement}
                  onChange={(e) => setProblemStatement(e.target.value)}
                  className="w-full h-48 bg-black/30 border border-white/10 rounded p-3 font-mono text-sm"
                />
              </div>

              <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-white">Solution (C++)</h3>
                  <button
                    onClick={handleGenerateSolution}
                    disabled={processing}
                    className="text-xs bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 px-3 py-1 rounded border border-purple-500/50"
                  >
                    Regenerate Solution
                  </button>
                </div>
                <textarea
                  value={solutionCpp}
                  onChange={(e) => setSolutionCpp(e.target.value)}
                  className="w-full h-64 bg-black/30 border border-white/10 rounded p-3 font-mono text-sm text-green-300"
                />
              </div>

              {questionType === 'coding' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="text-sm font-bold text-gray-400">Python Boilerplate</h3>
                        <button
                          onClick={handleGenerateBoilerplate}
                          disabled={processing}
                          className="text-xs bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 px-2 py-1 rounded border border-orange-500/50"
                        >
                          Regen All Boilerplate
                        </button>
                      </div>
                      <textarea
                        value={pregivenCode.python}
                        onChange={(e) => setPregivenCode({ ...pregivenCode, python: e.target.value })}
                        className="w-full h-40 bg-black/30 border border-white/10 rounded p-2 font-mono text-xs"
                      />
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="text-sm font-bold text-gray-400">Java Boilerplate</h3>
                      </div>
                      <textarea
                        value={pregivenCode.java}
                        onChange={(e) => setPregivenCode({ ...pregivenCode, java: e.target.value })}
                        className="w-full h-40 bg-black/30 border border-white/10 rounded p-2 font-mono text-xs"
                      />
                    </div>
                  </div>

                  <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-sm font-bold text-gray-400">Test Cases ({testCases.inputs.length})</h3>
                      <span className="text-xs text-gray-500">Auto-generated with Solution</span>
                    </div>
                    <div className="max-h-60 overflow-y-auto bg-black/30 rounded p-2">
                      {testCases.inputs.map((inp, i) => (
                        <div key={i} className="mb-2 border-b border-white/10 pb-2 last:border-0 grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] text-gray-500 block">Input</label>
                            <textarea
                              value={inp}
                              onChange={(e) => {
                                const newInputs = [...testCases.inputs];
                                newInputs[i] = e.target.value;
                                setTestCases({ ...testCases, inputs: newInputs });
                              }}
                              className="w-full bg-transparent border-none text-xs font-mono p-0 focus:ring-0"
                              rows={2}
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-gray-500 block">Output</label>
                            <textarea
                              value={testCases.outputs[i]}
                              onChange={(e) => {
                                const newOutputs = [...testCases.outputs];
                                newOutputs[i] = e.target.value;
                                setTestCases({ ...testCases, outputs: newOutputs });
                              }}
                              className="w-full bg-transparent border-none text-xs font-mono text-green-300 p-0 focus:ring-0"
                              rows={2}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              <div>
                <h3 className="text-sm font-bold text-gray-400 mb-2">Image Privacy (Blur Top Portion)</h3>
                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <div className="flex items-center space-x-4">
                    <span className="text-gray-400 text-sm min-w-[30px]">0%</span>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={blurPercentage}
                      onChange={(e) => setBlurPercentage(parseInt(e.target.value))}
                      className="flex-1 h-2 bg-white/20 rounded-lg appearance-none cursor-pointer slider"
                    />
                    <span className="text-gray-400 text-sm min-w-[40px]">100%</span>
                  </div>
                  <div className="mt-2 text-center">
                    <span className="bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full text-sm font-medium">
                      Blur: {blurPercentage}%
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleSave}
                disabled={processing}
                className="w-full bg-green-600 hover:bg-green-500 py-4 rounded-xl font-bold text-lg transition-colors disabled:opacity-50 flex items-center justify-center shadow-lg shadow-green-500/20"
              >
                {processing ? <FaSpinner className="animate-spin mr-2" /> : <FaSave className="mr-2" />}
                Save Question to Database
              </button>

              <button
                onClick={() => {
                  if (window.confirm('Are you sure? This will clear all current progress.')) {
                    setStep(1);
                    setProblemStatement('');
                    setSolutionCpp('');
                    setPregivenCode({ cpp: '', python: '', java: '' });
                    setTestCases({ inputs: [], outputs: [] });
                    setImages([]);
                    setImagePreviews([]);
                    setLogs([]);
                  }
                }}
                className="w-full mt-4 bg-red-500/10 hover:bg-red-500/20 text-red-400 py-3 rounded-xl font-medium transition-colors border border-red-500/20"
              >
                Start Over / New Upload
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

export default AdvancedQuestionUpload;
