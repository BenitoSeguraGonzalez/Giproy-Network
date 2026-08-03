import React from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import Community from './pages/Community.jsx';
import Marketplace from './pages/Marketplace.jsx';
import { AuthContext } from './context/AuthContext.jsx';
import './index.css';

const company = { id: 77, nombre: 'Constructora QA', alias: 'QA' };
const user = {
  id: 1,
  rol: 'administrador',
  empresa_id: 77,
  empresa: company,
  marketplace_permissions: ['marketplace.buy', 'seller.publish'],
};
const page = new URLSearchParams(window.location.search).get('page');

createRoot(document.getElementById('root')).render(
  <MemoryRouter>
    <AuthContext.Provider value={{ user, selectedEmpresa: company, licenseInfo: {} }}>
      <div data-adaptive-ui-enabled="true" style={{ height: '100dvh' }}>
        {page === 'community' ? <Community /> : <Marketplace />}
      </div>
    </AuthContext.Provider>
  </MemoryRouter>,
);
