import React from 'react';
import ReactDOM from 'react-dom/client';
import TektonVisualizationApp from './TektonVisualizationApp';

// Initialize the React app
const container = document.getElementById('root');
if (container) {
    const root = ReactDOM.createRoot(container);
    root.render(<TektonVisualizationApp />);
} else {
    console.error('Root container not found');
} 