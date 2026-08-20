import React from "react";
import { createRoot } from "react-dom/client";
import "../../index.css";
import BimFlowWorkspace from "../../components/bim/BimFlowWorkspace";
import { AuthContext } from "../../context/AuthContext";

const ready = new URLSearchParams(window.location.search).has("ready");
const sampleElements = Array.from({ length: 13 }, (_, index) => ({
  id: index + 1,
  global_id: `BS-IFC4-${String(index + 1).padStart(3, "0")}`,
  ifc_class: ["IFCWALL", "IFCSLAB", "IFCROOF", "IFCBUILDINGELEMENTPROXY"][index % 4],
  nombre: `Building Architecture · elemento ${index + 1}`,
  properties_json: { source: "buildingSMART Sample-Test-Files", schema: "IFC4", reference_view: "V1.2" },
}));

createRoot(document.getElementById("root")).render(
  <AuthContext.Provider value={{ user: { id: 7, empresa_id: 11 }, selectedEmpresa: { id: 11 } }}>
    <div className="h-screen min-h-[1080px] bg-zinc-100 p-4">
      <BimFlowWorkspace project={{ id: 91, nombre: "BuildingSMART IFC4 · local" }} access={{ enabled: false, resolved_company_id: 11 }} workspaceOverride={ready ? { active_version_id: 1, active_version_label: "BS-IFC4-R01", models: [{ id: 1, nombre: "Building Architecture" }], versions: [{ id: 1, version_label: "BS-IFC4-R01" }], elements: sampleElements, recent_links: [] } : null} domainStateOverride={ready ? { budget: "ready", gantt: "ready" } : null} />
    </div>
  </AuthContext.Provider>,
);
