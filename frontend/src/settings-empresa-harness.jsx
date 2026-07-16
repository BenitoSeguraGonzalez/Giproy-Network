import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import Settings from './pages/Settings.jsx';
import { AuthContext } from './context/authContextInstance';
import { AppDialogProvider } from './components/ui/AppDialogProvider.jsx';
import './index.css';

const company = {
  id: 77,
  nombre: 'Constructora Certificacion',
  alias: 'Constructora QA',
  ruc: '1799999999001',
  codigo: 'CERT',
  direccion: 'Av. Republica y Naciones Unidas',
  localidad: 'Quito',
  canton: 'Quito',
  provincia: 'Pichincha',
  pais: 'Ecuador',
  telefono: '+593 222222222',
  email: 'empresa@giproy.test',
  contacto_nombre: 'Administracion QA',
  contacto_email: 'admin@giproy.test',
  contacto_telefono: '+593 999999999',
  logo_url: '',
  activa: true,
  limite_administradores: 3,
  limite_usuarios: 12,
  total_administradores: 2,
  total_usuarios: 5,
  decimales_moneda: 2,
  decimales_calculos: 4,
  use_omniclass: false,
  marketplace_can_sell: true,
  session_timeout_minutes: 30,
  proy_prefijo: 'CERT',
  proy_periodo: '2026',
  proy_secuencial: 24,
  proy_secuencial_size: 5,
  plantillas_config: {},
};

const licenseInfo = {
  licencia_actual: 'Professional',
  license_status: 'active',
  access_mode: 'full',
  limites: { usuarios: 12 },
  usados: { usuarios: 5 },
  commercial_capabilities: {
    license: { codigo: 'PROFESSIONAL' },
    capabilities: {
      apus: true,
      presupuestos: true,
      cronogramas: true,
      conecta: true,
      equipo: true,
      pdf_exports: true,
    },
    effective_right_codes: ['PROFESSIONAL', 'CONECTA'],
  },
  saas_products: [
    { code: 'CONECTA', name: 'Conecta Empresa' },
  ],
};

const Harness = () => {
  const [selectedEmpresa, setSelectedEmpresa] = useState(company);

  return (
    <AuthContext.Provider
      value={{
        user: {
          id: 1,
          email: 'superadmin@giproy.test',
          nombre_completo: 'Superadmin QA',
          rol: 'superadministrador',
          empresa_id: 77,
          empresa: company,
        },
        selectedEmpresa,
        setSelectedEmpresa,
        selectedBaseTrabajo: null,
        licenseInfo,
      }}
    >
      <BrowserRouter>
        <AppDialogProvider>
          <Settings />
        </AppDialogProvider>
      </BrowserRouter>
    </AuthContext.Provider>
  );
};

createRoot(document.getElementById('root')).render(<Harness />);
