import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { chromium } from "playwright";

const port = 4246;
const baseUrl = `http://127.0.0.1:${port}`;
const vite = spawn(process.platform === "win32" ? "cmd.exe" : "npm", process.platform === "win32" ? ["/c", "npm", "run", "dev", "--", "--host", "127.0.0.1", "--port", String(port)] : ["run", "dev", "--", "--host", "127.0.0.1", "--port", String(port)], { cwd: process.cwd(), stdio: "ignore", windowsHide: true });
const cleanup = () => { if (!vite.killed && process.platform === "win32" && vite.pid) spawnSync("taskkill", ["/pid", String(vite.pid), "/T", "/F"], { stdio: "ignore" }); };
process.on("exit", cleanup);
try {
  const deadline = Date.now() + 40000;
  while (Date.now() < deadline) { try { if ((await fetch(baseUrl)).ok) break; } catch {} await new Promise((resolve) => setTimeout(resolve, 250)); }
  const browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe" });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, screen: { width: 1920, height: 1080 } });
  const errors = []; page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(`${baseUrl}/bim-flow-workspace-harness.html`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector("body");
  await page.waitForTimeout(3000);
  if (!(await page.locator('[data-bim-flow-workspace]').count())) {
    throw new Error(`Nueva sección no montada. URL=${page.url()} body=${(await page.locator("body").innerText()).slice(0, 500)} errores=${errors.join(" | ")}`);
  }
  assert.equal(await page.getByRole("heading", { name: "¿Qué necesitas resolver en este proyecto?" }).count(), 1);
  assert.equal(await page.locator("canvas").count(), 0, "La portada nueva no puede montar el visor 3D");
  assert.equal(await page.locator('[data-bim-tri-sync-status]').count(), 1);
  const flowNav = page.getByRole("navigation", { name: "Flujo operativo BIM" });
  for (const label of ["Modelo", "Presupuesto 5D", "Planificación 4D", "Coordinación", "Seguimiento", "Entrega"]) assert.equal(await flowNav.getByRole("button", { name: label, exact: true }).count(), 1, `Etapa visible: ${label}`);
  await flowNav.getByRole("button", { name: "Modelo", exact: true }).click();
  assert.equal(await page.getByRole("heading", { name: "Preparar y validar el modelo" }).count(), 1);
  assert.equal(await page.locator('[data-bim-element-explorer]').count(), 1, "Modelo debe incluir exploración contextual de elementos");
  assert.equal(await page.locator('[data-bim-saved-views]').count(), 1, "Modelo debe permitir vistas guardadas y comparación");
  await flowNav.getByRole("button", { name: "Presupuesto 5D", exact: true }).click();
  assert.equal(await page.getByRole("heading", { name: "Construir el presupuesto 5D" }).count(), 1);
  await flowNav.getByRole("button", { name: "Planificación 4D", exact: true }).click();
  assert.equal(await page.getByRole("heading", { name: "Construir la planificación 4D" }).count(), 1);
  await flowNav.getByRole("button", { name: "Inicio", exact: true }).click();
  assert.match(await page.locator('[data-bim-coordination-gate]').innerText(), /Coordinación bloqueada/, "La coordinación debe bloquearse sin tri-sincronización completa");
  await flowNav.getByRole("button", { name: "Coordinación", exact: true }).click();
  assert.equal(await page.getByRole("heading", { name: "Resolver la coordinación" }).count(), 1);
  await flowNav.getByRole("button", { name: "Entrega", exact: true }).click();
  assert.equal(await page.getByRole("heading", { name: "Preparar la entrega" }).count(), 1);
  assert.equal(await page.locator('[data-bim-handover-dossier]').count(), 1, "Entrega debe mostrar su dossier, no el visor 3D");
  await flowNav.getByRole("button", { name: "Seguimiento", exact: true }).click();
  assert.equal(await page.getByRole("heading", { name: "Controlar avance y coste real" }).count(), 1);
  assert.equal(await page.locator('[data-bim-reports]').count(), 1, "Seguimiento debe mostrar reportes propios");
  assert.deepEqual(errors, [], `Errores de navegador: ${errors.join(" | ")}`);
  const widePage = await browser.newPage({ viewport: { width: 2560, height: 1440 }, screen: { width: 2560, height: 1440 } });
  await widePage.goto(`${baseUrl}/bim-flow-workspace-harness.html`, { waitUntil: "domcontentloaded" });
  await widePage.waitForSelector('[data-bim-flow-workspace]');
  assert.equal(await widePage.locator('[data-bim-flow-workspace]').count(), 1, "El flujo debe adaptarse a resoluciones mayores");
  assert.equal(await widePage.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), true, "No debe existir overflow horizontal a 2560px");
  await widePage.close();
  const readyPage = await browser.newPage({ viewport: { width: 1920, height: 1080 }, screen: { width: 1920, height: 1080 } });
  await readyPage.goto(`${baseUrl}/bim-flow-workspace-harness.html?ready=1`, { waitUntil: "domcontentloaded" });
  await readyPage.waitForSelector('[data-bim-tri-sync-status]');
  assert.match(await readyPage.locator('[data-bim-coordination-gate]').innerText(), /lista para revisión/, "El estado listo debe desbloquear coordinación");
  await readyPage.getByRole("navigation", { name: "Flujo operativo BIM" }).getByRole("button", { name: "Coordinación", exact: true }).click();
  await readyPage.waitForTimeout(1500);
  assert.equal(await readyPage.locator('[data-bim-coordination-control]').count(), 1, `La coordinación debe abrirse con tri-sincronización lista: ${(await readyPage.locator('body').innerText()).slice(0, 500)}`);
  await readyPage.close();
  await browser.close();
  console.log("validate-bim-flow-workspace-dom: ok");
} finally { cleanup(); }
