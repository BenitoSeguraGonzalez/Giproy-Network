import { useCallback, useEffect, useRef, useState } from 'react';
import { Construction, Plus } from 'lucide-react';
import * as THREE from 'three';

import { bimModelsApi } from '../../api/bimModels';

function MotionCanvas({ plan, playback }) {
    const hostRef = useRef(null);
    useEffect(() => {
        const host = hostRef.current; if (!host || !plan || !playback) return undefined;
        const scene = new THREE.Scene(); scene.background = new THREE.Color('#f8fafc');
        const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 500); camera.position.set(14, 11, 16); camera.lookAt(0, 0, 0);
        const renderer = new THREE.WebGLRenderer({ antialias: true }); renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2)); host.appendChild(renderer.domElement);
        const points = plan.path.map((point) => new THREE.Vector3(point.x, point.y, point.z));
        scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), new THREE.LineBasicMaterial({ color: '#2563eb' })));
        const marker = new THREE.Mesh(playback.temporary_geometry === 'cylinder' ? new THREE.CylinderGeometry(playback.operation_radius, playback.operation_radius, 2, 24) : new THREE.BoxGeometry(2, 2, 2), new THREE.MeshStandardMaterial({ color: '#f39200', transparent: true, opacity: 0.78 }));
        marker.position.set(playback.position.x, playback.position.y, playback.position.z); scene.add(marker);
        const zone = new THREE.Mesh(new THREE.SphereGeometry(playback.operation_radius, 24, 16), new THREE.MeshBasicMaterial({ color: '#dc2626', wireframe: true, transparent: true, opacity: 0.45 })); zone.position.copy(marker.position); scene.add(zone);
        scene.add(new THREE.GridHelper(24, 24, '#94a3b8', '#e2e8f0')); scene.add(new THREE.HemisphereLight('#ffffff', '#64748b', 2));
        const render = () => { const width = host.clientWidth || 280; renderer.setSize(width, 190, false); camera.aspect = width / 190; camera.updateProjectionMatrix(); renderer.render(scene, camera); }; render();
        const observer = new ResizeObserver(render); observer.observe(host);
        return () => { observer.disconnect(); scene.traverse((node) => { node.geometry?.dispose?.(); node.material?.dispose?.(); }); renderer.dispose(); renderer.domElement.remove(); };
    }, [plan, playback]);
    return <div ref={hostRef} className="h-[190px] overflow-hidden rounded border border-slate-200" data-bim-equipment-motion-canvas="webgl" />;
}

export default function BimEquipmentMotionPanel({ projectId, empresaId }) {
    const [equipment, setEquipment] = useState([]); const [activities, setActivities] = useState([]); const [plans, setPlans] = useState([]);
    const [selectedId, setSelectedId] = useState(''); const [percent, setPercent] = useState(0); const [playback, setPlayback] = useState(null); const [conflicts, setConflicts] = useState([]); const [error, setError] = useState('');
    const [machine, setMachine] = useState({ code: 'EQ-01', name: 'Grúa', equipment_type: 'crane', dimensions: { x: 3, y: 8, z: 3 } });
    const load = useCallback(async () => { if (!projectId) return; try { const [machines, activityRows, motionRows] = await Promise.all([bimModelsApi.list4dEquipment(projectId, empresaId), bimModelsApi.list4dActivities(projectId, empresaId), bimModelsApi.list4dEquipmentMotion(projectId, empresaId)]); setEquipment(machines); setActivities(activityRows); setPlans(motionRows); setSelectedId((value) => value || String(motionRows[0]?.id || '')); } catch (requestError) { setError(requestError?.response?.data?.detail || 'No se pudo cargar la simulación de equipos.'); } }, [empresaId, projectId]);
    useEffect(() => { load(); }, [load]);
    const selected = plans.find((item) => String(item.id) === selectedId);
    useEffect(() => { if (!selected) { setPlayback(null); return; } Promise.all([bimModelsApi.get4dEquipmentPlayback(projectId, selected.id, percent, empresaId), bimModelsApi.get4dEquipmentConflicts(projectId, selected.id, empresaId)]).then(([frame, rows]) => { setPlayback(frame); setConflicts(rows); }).catch(() => setPlayback(null)); }, [empresaId, percent, projectId, selected]);
    const addEquipment = async () => { try { await bimModelsApi.create4dEquipment(projectId, machine, empresaId); await load(); } catch (requestError) { setError(requestError?.response?.data?.detail || 'No se pudo crear el equipo BIM.'); } };
    const addMotion = async () => { if (!equipment[0] || !activities[0]) return; try { const value = await bimModelsApi.create4dEquipmentMotion(projectId, { equipment_id: equipment[0].id, activity_snapshot_id: activities[0].id, revision: `R${plans.length + 1}`, path: [{ x: 0, y: 0, z: 0, offset_seconds: 0 }, { x: 10, y: 0, z: 0, offset_seconds: 100 }], operation_radius: 2, temporary_geometry: 'box' }, empresaId); await load(); setSelectedId(String(value.id)); } catch (requestError) { setError(requestError?.response?.data?.detail || 'No se pudo crear la trayectoria 4D.'); } };
    return <section className="rounded border border-slate-200 bg-white" data-bim-equipment-motion>
        <header className="flex items-center gap-2 border-b border-slate-200 px-3 py-2"><Construction size={16} className="text-orange-600" /><h3 className="text-sm font-semibold text-slate-800">Equipos y trayectorias 4D</h3></header>
        <div className="space-y-2 p-3 text-xs"><div className="grid grid-cols-[1fr_auto] gap-2"><input className="rounded border border-slate-300 px-2 py-1.5" value={machine.name} aria-label="Nombre de equipo BIM" onChange={(event) => setMachine({ ...machine, name: event.target.value })} /><button type="button" className="rounded border border-orange-300 p-1.5 text-orange-700" onClick={addEquipment} title="Crear equipo BIM"><Plus size={14} /></button></div>
        <button type="button" className="w-full rounded bg-orange-600 px-2 py-1.5 text-white disabled:opacity-50" disabled={!equipment.length || !activities.length} onClick={addMotion}>Crear trayectoria base</button>
        {plans.length ? <select className="w-full rounded border border-slate-300 px-2 py-1.5" value={selectedId} onChange={(event) => setSelectedId(event.target.value)}>{plans.map((item) => <option value={item.id} key={item.id}>{item.revision} · {item.duration_seconds}s</option>)}</select> : null}
        {selected && playback ? <><MotionCanvas plan={selected} playback={playback} /><input className="w-full accent-orange-600" type="range" min="0" max="100" value={percent} aria-label="Playback de trayectoria" onChange={(event) => setPercent(Number(event.target.value))} /><div className="flex justify-between text-slate-600" data-bim-equipment-playback={percent}><span>{percent}% · {playback.offset_seconds.toFixed(1)}s</span><span>{conflicts.length} conflictos</span></div></> : null}{error ? <p className="text-red-700">{error}</p> : null}</div>
    </section>;
}
