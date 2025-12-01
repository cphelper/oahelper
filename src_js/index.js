import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

// Global error handler to suppress ResizeObserver loop errors
const suppressResizeObserverErrors = () => {
  const resizeObserverErrDiv = document.getElementById('webpack-dev-server-client-overlay-div');
  const resizeObserverErr = document.getElementById('webpack-dev-server-client-overlay');
  if (resizeObserverErr) {
    resizeObserverErr.setAttribute('style', 'display: none');
  }
  if (resizeObserverErrDiv) {
    resizeObserverErrDiv.setAttribute('style', 'display: none');
  }
};

// Suppress ResizeObserver errors in development
window.addEventListener('error', (e) => {
  if (e.message && e.message.includes('ResizeObserver loop')) {
    e.stopImmediatePropagation();
    suppressResizeObserverErrors();
  }
});

// Also handle unhandled promise rejections
window.addEventListener('unhandledrejection', (e) => {
  if (e.reason && e.reason.toString().includes('ResizeObserver loop')) {
    e.preventDefault();
    suppressResizeObserverErrors();
  }
});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
