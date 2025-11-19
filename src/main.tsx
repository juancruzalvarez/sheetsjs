import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx'; // Assuming your main component is in App.tsx
import './index.css'; // Example CSS import

// Render the root component into the DOM element with id 'root'
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);