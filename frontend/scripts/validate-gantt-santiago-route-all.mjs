import { spawnSync } from 'node:child_process';
import { buildDependencyRoute } from '../src/components/projects/cronogramasGanttDependencies.js';

const pythonCode = `
import json
import sys
from pathlib import Path
sys.path.insert(0, str(Path("backend").resolve()))
from app.core.database import SessionLocal
from app.models.cronograma_trabajo import CronogramaTrabajo
from app.models.empresa import Empresa
from app.models.presupuesto import Presupuesto
from app.services.cronograma_trabajo import cronograma_trabajo_service

db = SessionLocal()
try:
    empresa = db.query(Empresa).filter(Empresa.nombre == "Santiago Bermeo").first()
    presupuesto = db.query(Presupuesto).filter(Presupuesto.id == 13, Presupuesto.empresa_id == empresa.id).first()
    schedule = db.query(CronogramaTrabajo).filter(
        CronogramaTrabajo.empresa_id == empresa.id,
        CronogramaTrabajo.presupuesto_id == presupuesto.id,
    ).first()
    trabajo = cronograma_trabajo_service._build_response(db, schedule).model_dump(mode="json")
    print(json.dumps({"empresa": empresa.nombre, "presupuesto_id": presupuesto.id, "trabajo": trabajo}, ensure_ascii=False))
finally:
    db.close()
`;

const fixtureRun = spawnSync('python', ['-c', pythonCode], {
  cwd: '..',
  encoding: 'utf8',
  maxBuffer: 1024 * 1024 * 20,
});

if (fixtureRun.status !== 0) {
  throw new Error(`No se pudo obtener fixture real Santiago Bermeo: ${fixtureRun.error?.message || fixtureRun.stderr || fixtureRun.stdout}`);
}

const fixture = JSON.parse(fixtureRun.stdout);
const rows = fixture.trabajo?.rows || [];
const manualMilestones = fixture.trabajo?.config?.manual_milestones || [];
const parseDate = (value) => {
  const time = new Date(value || '').getTime();
  return Number.isFinite(time) ? time : null;
};
const datedValues = [];
for (const row of rows) {
  const start = parseDate(row.start_date);
  const end = parseDate(row.end_date);
  if (start !== null) datedValues.push(start);
  if (end !== null) datedValues.push(end);
}
for (const milestone of manualMilestones) {
  const start = parseDate(milestone.start_date);
  if (start !== null) datedValues.push(start);
}
const minTime = Math.min(...datedValues);
const dayMs = 24 * 60 * 60 * 1000;
const pxPerDay = 42;
const rowHeight = 74;
const barHeight = 24;
const minBarWidth = 8;
const xFor = (value) => ((parseDate(value) - minTime) / dayMs) * pxPerDay + 80;
const byId = new Map();

rows.forEach((row, index) => {
  const id = String(row.presupuesto_linea_id ?? row.linea_id ?? row.budget_line_id ?? '').trim();
  const y = 40 + (index * rowHeight);
  const left = xFor(row.start_date);
  const right = Math.max(left + minBarWidth, xFor(row.end_date));
  byId.set(id, {
    id,
    isMilestone: false,
    topPx: y,
    bottomPx: y + rowHeight,
    centerY: y + (rowHeight / 2),
    leftPx: left,
    rightPx: right,
  });
});

manualMilestones.forEach((milestone) => {
  const id = `manual-milestone:${String(milestone.id || '').trim()}`;
  const afterLine = String(milestone.after_line_id || milestone.display_after_line_id || '').trim();
  const anchor = byId.get(afterLine) || Array.from(byId.values())[0];
  const x = xFor(milestone.start_date);
  const y = (anchor?.topPx || 0) - rowHeight;
  byId.set(id, {
    id,
    isMilestone: true,
    topPx: y,
    bottomPx: y + rowHeight,
    centerY: y + (rowHeight / 2),
    leftPx: x,
    rightPx: x,
  });
});

const dependencies = [];
for (const row of rows) {
  const target = String(row.presupuesto_linea_id ?? row.linea_id ?? row.budget_line_id ?? '').trim();
  for (const dependency of row.dependencies || []) {
    dependencies.push({
      key: `${dependency.source_id}-${target}`,
      source: String(dependency.source_id),
      target,
      type: dependency.type || 'FS',
    });
  }
}
for (const milestone of manualMilestones) {
  const source = `manual-milestone:${String(milestone.id || '').trim()}`;
  for (const dependency of milestone.successor_dependencies || []) {
    const target = String(dependency.target_id ?? dependency.targetId ?? '').trim();
    dependencies.push({
      key: `${source}-${target}`,
      source,
      target,
      type: dependency.type || 'FS',
    });
  }
}

const parsePoints = (d) => Array.from(String(d || '').matchAll(/([ML])\s+(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)/g))
  .map((match) => ({ cmd: match[1], x: Number(match[2]), y: Number(match[3]) }));

const issues = [];
const routes = [];
for (const dependency of dependencies) {
  const source = byId.get(dependency.source);
  const target = byId.get(dependency.target);
  if (!source || !target) {
    issues.push({ ...dependency, issue: 'geometry_missing' });
    continue;
  }
  const route = buildDependencyRoute({
    sourceGeometry: source,
    targetGeometry: target,
    sourceY: source.centerY,
    targetY: target.centerY,
    dependencyType: dependency.type,
    sourceIsMilestone: source.isMilestone,
    targetIsMilestone: target.isMilestone,
    obstacleBand: {
      minLeft: Math.min(source.leftPx, target.leftPx),
      maxRight: Math.max(source.rightPx, target.rightPx),
    },
  });
  if (!route?.d) {
    issues.push({ ...dependency, issue: 'route_missing' });
    continue;
  }
  const points = parsePoints(route.d);
  const diagonalSegments = [];
  for (let index = 1; index < points.length; index += 1) {
    const previous = points[index - 1];
    const current = points[index];
    const dx = Math.abs(current.x - previous.x);
    const dy = Math.abs(current.y - previous.y);
    if (dx > 0.5 && dy > 0.5) diagonalSegments.push({ from: previous, to: current, dx, dy });
  }
  const isManual = dependency.source.startsWith('manual-milestone:') || dependency.target.startsWith('manual-milestone:');
  const firstPoint = points[0] || null;
  const lastPoint = points.at(-1) || null;
  const isVerticalDirectRoute = Boolean(
    firstPoint
    && lastPoint
    && points.length === 2
    && Math.abs(firstPoint.x - lastPoint.x) <= 0.5
    && Math.abs(firstPoint.y - lastPoint.y) > 0.5
  );
  if (diagonalSegments.length) {
    issues.push({ ...dependency, issue: 'diagonal_route', d: route.d, diagonalSegments });
  }
  if (isManual && points.length <= 2 && !isVerticalDirectRoute) {
    issues.push({ ...dependency, issue: 'direct_manual_route', d: route.d });
  }
  routes.push({ ...dependency, d: route.d, commandCount: points.length });
}

console.log(JSON.stringify({
  ok: issues.length === 0,
  empresa: fixture.empresa,
  presupuesto_id: fixture.presupuesto_id,
  dependency_count: dependencies.length,
  routed_count: routes.length,
  issue_count: issues.length,
  issues: issues.slice(0, 25),
}, null, 2));

if (issues.length) {
  process.exit(1);
}
