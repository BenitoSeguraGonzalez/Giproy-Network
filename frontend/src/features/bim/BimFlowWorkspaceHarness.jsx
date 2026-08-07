import React from "react";
import { createRoot } from "react-dom/client";
import "../../index.css";
import BimFlowWorkspace from "../../components/bim/BimFlowWorkspace";
import { AuthContext } from "../../context/AuthContext";

const ready = new URLSearchParams(window.location.search).has("ready");

createRoot(document.getElementById("root")).render(
  <AuthContext.Provider value={{ user: { id: 7, empresa_id: 11 }, selectedEmpresa: { id: 11 } }}>
    <div className="h-screen min-h-[1080px] bg-zinc-100 p-4">
      <BimFlowWorkspace project={{ id: 91, nombre: "Proyecto BIM de prueba" }} access={{ enabled: false, resolved_company_id: 11 }} workspaceOverride={ready ? { models: [{ id: 1 }], versions: [{ id: 1 }], elements: [{ id: 1 }], recent_links: [{ id: 1 }] } : null} domainStateOverride={ready ? { budget: "ready", gantt: "ready" } : null} />
    </div>
  </AuthContext.Provider>,
);
