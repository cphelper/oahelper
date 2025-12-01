import React, { useState, useEffect } from 'react';
import { FaPlay, FaStop, FaTerminal, FaCheck, FaTimes, FaCog } from 'react-icons/fa';
import Navbar from './Navbar';
import DotPattern from './DotPattern';
import { API_ENDPOINTS, getApiHeaders } from '../config/api';

const GenerateAllCombined = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState([]);
  const [options, setOptions] = useState({
    batchSize: 1,
    workers: 1,
    maxRetries: 3,
    startId: '',
    runAll: false,
    includeExisting: false,
    dryRun: false
  });
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    // Check if user is admin
    const adminAuth = localStorage.getItem('adminAuth') === 'true';
    setIsAuthenticated(adminAuth);
  }, []);

  const handleAuth = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_ENDPOINTS.BASE_URL}/admin/auth.php`, {
        method: 'POST',
        headers: getApiHeaders(),
        body: JSON.stringify({ password })
      });

      const data = await response.json();
      if (data.success) {
        setIsAuthenticated(true);
        localStorage.setItem('adminAuth', 'true');
        setAuthError('');
      } else {
        setAuthError('Invalid password');
      }
    } catch (error) {
      setAuthError('Authentication failed');
    }
  };

  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, { message, type, timestamp }]);
  };

  const handleRun = async () => {
    if (isRunning) return;

    setIsRunning(true);
    setLogs([]);
    addLog('Starting generate_all_combined.js script...', 'info');

    try {
      // Build command arguments
      const args = [];
      if (options.batchSize !== 1) args.push('--batch-size', options.batchSize.toString());
      if (options.workers !== 1) args.push('--workers', options.workers.toString());
      if (options.maxRetries !== 3) args.push('--max-retries', options.maxRetries.toString());
      if (options.startId) args.push('--start-id', options.startId);
      if (options.runAll) args.push('--run-all');
      if (options.includeExisting) args.push('--include-existing');
      if (options.dryRun) args.push('--dry-run');

      const command = `node scripts/generate_all_combined.js ${args.join(' ')}`;

      addLog(`Executing: ${command}`, 'command');

      // Note: In a real implementation, this would call a backend endpoint
      // that can execute the Node.js script securely
      const response = await fetch(`${API_ENDPOINTS.BASE_URL}/admin/run-script.php`, {
        method: 'POST',
        headers: getApiHeaders(),
        body: JSON.stringify({
          script: 'generate_all_combined.js',
          args: args
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.success) {
        addLog('Script completed successfully!', 'success');
        if (result.output) {
          result.output.split('\n').forEach(line => {
            if (line.trim()) addLog(line, 'output');
          });
        }
      } else {
        addLog(`Script failed: ${result.error}`, 'error');
      }

    } catch (error) {
      addLog(`Error: ${error.message}`, 'error');
    } finally {
      setIsRunning(false);
    }
  };

  const handleStop = () => {
    // In a real implementation, this would send a signal to stop the running process
    setIsRunning(false);
    addLog('Script execution stopped by user', 'warning');
  };

  if (!isAuthenticated) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-black flex flex-col">
        <DotPattern width={32} height={32} cx={16} cy={16} cr={1.5} className="absolute inset-0 opacity-10" />
        <Navbar />

        <div className="flex-grow flex items-center justify-center px-4">
          <div className="w-full max-w-md">
            <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 border border-white/10">
              <div className="text-center mb-8">
                <FaTerminal className="text-4xl text-white mx-auto mb-4" />
                <h1 className="text-2xl font-bold text-white mb-2">Admin Authentication</h1>
                <p className="text-gray-400">Enter admin password to access the script runner</p>
              </div>

              <form onSubmit={handleAuth} className="space-y-6">
                <div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Admin Password"
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                {authError && (
                  <div className="text-red-400 text-sm text-center">{authError}</div>
                )}

                <button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
                >
                  Authenticate
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-black flex flex-col">
      <DotPattern width={32} height={32} cx={16} cy={16} cr={1.5} className="absolute inset-0 opacity-10" />
      <Navbar />

      <div className="flex-grow pt-24 pb-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
              <FaTerminal className="text-blue-400" />
              Generate All Combined
            </h1>
            <p className="text-gray-400">
              Generate solutions and pregiven code for coding questions using AI
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Configuration Panel */}
            <div className="lg:col-span-1">
              <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
                <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                  <FaCog className="text-blue-400" />
                  Configuration
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Batch Size
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={options.batchSize}
                      onChange={(e) => setOptions(prev => ({ ...prev, batchSize: parseInt(e.target.value) || 1 }))}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={isRunning}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Workers
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="5"
                      value={options.workers}
                      onChange={(e) => setOptions(prev => ({ ...prev, workers: parseInt(e.target.value) || 1 }))}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={isRunning}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Max Retries
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={options.maxRetries}
                      onChange={(e) => setOptions(prev => ({ ...prev, maxRetries: parseInt(e.target.value) || 3 }))}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={isRunning}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Start ID (optional)
                    </label>
                    <input
                      type="number"
                      value={options.startId}
                      onChange={(e) => setOptions(prev => ({ ...prev, startId: e.target.value }))}
                      placeholder="Leave empty to start from latest"
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={isRunning}
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={options.runAll}
                        onChange={(e) => setOptions(prev => ({ ...prev, runAll: e.target.checked }))}
                        className="mr-3 text-blue-600 focus:ring-blue-500"
                        disabled={isRunning}
                      />
                      <span className="text-sm text-gray-300">Run All Batches</span>
                    </label>

                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={options.includeExisting}
                        onChange={(e) => setOptions(prev => ({ ...prev, includeExisting: e.target.checked }))}
                        className="mr-3 text-blue-600 focus:ring-blue-500"
                        disabled={isRunning}
                      />
                      <span className="text-sm text-gray-300">Include Existing</span>
                    </label>

                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={options.dryRun}
                        onChange={(e) => setOptions(prev => ({ ...prev, dryRun: e.target.checked }))}
                        className="mr-3 text-blue-600 focus:ring-blue-500"
                        disabled={isRunning}
                      />
                      <span className="text-sm text-gray-300">Dry Run (No DB Writes)</span>
                    </label>
                  </div>

                  <div className="pt-4 space-y-3">
                    {!isRunning ? (
                      <button
                        onClick={handleRun}
                        className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                      >
                        <FaPlay />
                        Start Generation
                      </button>
                    ) : (
                      <button
                        onClick={handleStop}
                        className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                      >
                        <FaStop />
                        Stop Execution
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Logs Panel */}
            <div className="lg:col-span-2">
              <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
                <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                  <FaTerminal className="text-blue-400" />
                  Execution Logs
                </h2>

                <div className="bg-black/50 rounded-lg p-4 h-96 overflow-y-auto font-mono text-sm">
                  {logs.length === 0 ? (
                    <div className="text-gray-500 text-center py-8">
                      No logs yet. Click "Start Generation" to run the script.
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {logs.map((log, index) => (
                        <div
                          key={index}
                          className={`flex gap-3 ${
                            log.type === 'error' ? 'text-red-400' :
                            log.type === 'success' ? 'text-green-400' :
                            log.type === 'warning' ? 'text-yellow-400' :
                            log.type === 'command' ? 'text-blue-400' :
                            'text-gray-300'
                          }`}
                        >
                          <span className="text-gray-500 text-xs whitespace-nowrap">
                            {log.timestamp}
                          </span>
                          <span className="flex-1">{log.message}</span>
                          {log.type === 'success' && <FaCheck className="text-green-400 mt-0.5" />}
                          {log.type === 'error' && <FaTimes className="text-red-400 mt-0.5" />}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {logs.length > 0 && (
                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={() => setLogs([])}
                      className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded-lg transition-colors"
                    >
                      Clear Logs
                    </button>
                    <button
                      onClick={() => {
                        const logText = logs.map(log => `[${log.timestamp}] ${log.message}`).join('\n');
                        navigator.clipboard.writeText(logText);
                      }}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
                    >
                      Copy Logs
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GenerateAllCombined;







