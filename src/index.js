import React from 'react';
import ReactDOM from 'react-dom/client';

// Bootstrap for backwards compatibility (to be phased out)
import 'bootstrap/dist/css/bootstrap.min.css';

// Enterprise Design System - Import order matters
import './styles/main.css';

// Legacy styles (will be replaced incrementally)
import './index.css';

import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);