import React from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import EnviosTransferencias from './pages/EnviosTransferencias.jsx';
import { AuthContext } from './context/AuthContext.jsx';
import './index.css';

const company = { id: 77, nombre: 'Constructora QA', alias: 'QA' };

createRoot(document.getElementById('root')).render(
  <MemoryRouter>
    <AuthContext.Provider value={{ user: { id: 1, role: 'administrador', empresa_id: 77 }, selectedEmpresa: company }}>
      <div data-adaptive-ui-enabled="true" style={{ height: '100dvh' }}>
        <EnviosTransferencias />
      </div>
    </AuthContext.Provider>
  </MemoryRouter>,
);
