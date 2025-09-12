import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import "@fontsource-variable/inter"; // Inter var (wght axis)
import './index.css';

// Entry point for the application. It mounts the App component into the
// #root element defined in index.html. We use React.StrictMode to catch
// potential issues during development.
ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);