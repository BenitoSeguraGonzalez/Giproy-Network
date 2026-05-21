import React from 'react';
import { createRoot } from 'react-dom/client';
import FormulaPolinomicaTab from './components/projects/FormulaPolinomicaTab.jsx';
import { AuthContext } from './context/AuthContext.jsx';
import './index.css';

createRoot(document.getElementById('root')).render(
  <AuthContext.Provider value={{ user: { role: 'usuario' } }}>
    <div style={{ height: '100vh', padding: '16px', boxSizing: 'border-box' }}>
      <FormulaPolinomicaTab projectId={7} activeRevision={{ revision: undefined }} />
    </div>
  </AuthContext.Provider>,
);
