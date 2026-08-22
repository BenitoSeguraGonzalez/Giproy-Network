import { useCallback, useEffect, useRef, useState } from 'react';
import { Box, Boxes, Plus, Trash2, X } from 'lucide-react';
import * as THREE from 'three';

import { bimModelsApi } from '../../api/bimModels';

function geometryFromCsgMesh(mesh) {
    if (!mesh?.positions?.length || !mesh?.indices?.length) return null;
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(mesh.positions, 3));
    geometry.setIndex(mesh.indices);
    if (mesh.normals?.length === mesh.positions.length) geometry.setAttribute('normal', new THREE.Float32BufferAttribute(mesh.normals, 3));
    else geometry.computeVertexNormals();
    return geometry;
}

function PartitionPreview({ spec, artifact, csgArtifact }) {
    const hostRef = useRef(null);
    useEffect(() => {
        const host = hostRef.current;
        if (!host || !spec) return undefined;
        const scene = new THREE.Scene(); scene.background = new THREE.Color('#f8fafc');
        const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100); camera.position.set(7, 6, 8); camera.lookAt(0, 0, 0);
        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false }); renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2)); host.appendChild(renderer.domElement);
        const source = spec.preview_bounds; const dimensions = { x: source.width, y: source.height, z: source.depth };
        const maxDimension = Math.max(dimensions.x, dimensions.y, dimensions.z); const scale = 4 / maxDimension;
        const scaled = { x: dimensions.x * scale, y: dimensions.y * scale, z: dimensions.z * scale };
        const colors = ['#f39200', '#2563eb', '#16a34a', '#9333ea'];
        const group = new THREE.Group(); scene.add(group);
        if (csgArtifact?.segments?.length) {
            csgArtifact.segments.forEach((segment, index) => {
                const geometry = geometryFromCsgMesh(segment.mesh);
                if (!geometry) return;
                const material = new THREE.MeshStandardMaterial({ color: colors[index % colors.length], roughness: 0.66, side: THREE.DoubleSide });
                group.add(new THREE.Mesh(geometry, material));
            });
            const bounds = new THREE.Box3().setFromObject(group); const size = bounds.getSize(new THREE.Vector3()); const center = bounds.getCenter(new THREE.Vector3());
            const fitScale = 4 / Math.max(size.x, size.y, size.z, 0.0001); group.scale.setScalar(fitScale); group.position.copy(center).multiplyScalar(-fitScale);
        } else {
            const boxes = artifact?.segments?.map((segment) => ({
                size: { x: (segment.max.x - segment.min.x) * scale, y: (segment.max.y - segment.min.y) * scale, z: (segment.max.z - segment.min.z) * scale },
                position: { x: (segment.max.x + segment.min.x) * scale / 2, y: (segment.max.y + segment.min.y) * scale / 2, z: (segment.max.z + segment.min.z) * scale / 2 },
            })) || Array.from({ length: spec.segment_count }, (_, index) => {
                const axisLength = scaled[spec.axis]; const occupied = axisLength * (1 - spec.gap_ratio); const length = occupied / spec.segment_count; const gap = axisLength * spec.gap_ratio / (spec.segment_count - 1);
                return { size: { ...scaled, [spec.axis]: length }, position: { x: 0, y: 0, z: 0, [spec.axis]: -axisLength / 2 + length / 2 + index * (length + gap) } };
            });
            boxes.forEach(({ size, position }, index) => {
                const geometry = new THREE.BoxGeometry(size.x, size.y, size.z);
                const material = new THREE.MeshStandardMaterial({ color: colors[index % colors.length], transparent: true, opacity: 0.72, roughness: 0.7 });
                const mesh = new THREE.Mesh(geometry, material); mesh.position.set(position.x, position.y, position.z); group.add(mesh);
                const edges = new THREE.LineSegments(new THREE.EdgesGeometry(geometry), new THREE.LineBasicMaterial({ color: '#334155' })); edges.position.copy(mesh.position); group.add(edges);
            });
        }
        scene.add(new THREE.HemisphereLight('#ffffff', '#64748b', 2.2)); const light = new THREE.DirectionalLight('#ffffff', 2); light.position.set(5, 8, 6); scene.add(light);
        const render = () => { const width = host.clientWidth || 260; const height = 180; renderer.setSize(width, height, false); camera.aspect = width / height; camera.updateProjectionMatrix(); renderer.render(scene, camera); };
        render(); const observer = new ResizeObserver(render); observer.observe(host);
        return () => { observer.disconnect(); scene.traverse((node) => { node.geometry?.dispose?.(); if (Array.isArray(node.material)) node.material.forEach((item) => item.dispose()); else node.material?.dispose?.(); }); renderer.dispose(); renderer.domElement.remove(); };
    }, [artifact, csgArtifact, spec]);
    return <div className="h-[180px] w-full overflow-hidden rounded border border-slate-200" ref={hostRef} data-bim-partition-preview="webgl" data-bim-partition-artifact={csgArtifact ? 'csg-exact' : artifact ? 'rendered' : 'preview'} />;
}

export default function BimConstructiblePartitionPanel({ projectId, empresaId, element }) {
    const [specs, setSpecs] = useState([]); const [selectedId, setSelectedId] = useState('');
    const [draft, setDraft] = useState({ revision: 'P1', axis: 'x', segment_count: 2, gap_ratio: 0.04 });
    const [artifact, setArtifact] = useState(null); const [csgArtifact, setCsgArtifact] = useState(null); const [busy, setBusy] = useState(false); const [error, setError] = useState('');
    const [createOpen, setCreateOpen] = useState(false);
    const load = useCallback(async () => { if (!projectId || !element?.id) { setSpecs([]); return; } try { setError(''); const values = await bimModelsApi.list4dPartitionSpecs(projectId, element.id, empresaId); setSpecs(values); setSelectedId((current) => current && values.some((item) => String(item.id) === current) ? current : String(values[0]?.id || '')); } catch (requestError) { setError(requestError?.response?.data?.detail || 'No se pudieron cargar las particiones BIM.'); } }, [element?.id, empresaId, projectId]);
    useEffect(() => { load(); }, [load]);
    useEffect(() => { const onKey = (event) => event.key === 'Escape' && setCreateOpen(false); window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey); }, []);
    useEffect(() => { const selected = specs.find((item) => String(item.id) === selectedId); if (!selected?.materialized) { setArtifact(null); return; } bimModelsApi.get4dPartitionArtifact(projectId, selected.id, empresaId).then(setArtifact).catch(() => setArtifact(null)); }, [empresaId, projectId, selectedId, specs]);
    useEffect(() => {
        if (!projectId || !selectedId) { setCsgArtifact(null); return undefined; }
        let active = true;
        bimModelsApi.list4dPartitionCsgArtifacts(projectId, Number(selectedId), empresaId)
            .then((values) => { if (active) setCsgArtifact(values[0] || null); })
            .catch(() => { if (active) setCsgArtifact(null); });
        return () => { active = false; };
    }, [empresaId, projectId, selectedId]);
    const create = async (event) => { event.preventDefault(); try { setBusy(true); setError(''); const value = await bimModelsApi.create4dPartitionSpec(projectId, { ...draft, element_id: element.id, segment_count: Number(draft.segment_count), gap_ratio: Number(draft.gap_ratio) }, empresaId); await load(); setSelectedId(String(value.id)); } catch (requestError) { setError(requestError?.response?.data?.detail || 'No se pudo registrar el preview de partición.'); } finally { setBusy(false); } };
    const remove = async () => { if (!selectedId) return; try { setBusy(true); await bimModelsApi.delete4dPartitionSpec(projectId, Number(selectedId), empresaId); await load(); } catch (requestError) { setError(requestError?.response?.data?.detail || 'No se pudo eliminar la partición.'); } finally { setBusy(false); } };
    const materialize = async () => { if (!selectedId) return; try { setBusy(true); setError(''); const value = await bimModelsApi.materialize4dPartitionSpec(projectId, Number(selectedId), empresaId); setArtifact(value); await load(); } catch (requestError) { setError(requestError?.response?.data?.detail || 'No se pudo materializar la partición.'); } finally { setBusy(false); } };
    const selected = specs.find((item) => String(item.id) === selectedId);
    return <section className="rounded border border-slate-200 bg-white" data-bim-constructible-partitions>
        <header className="flex items-center gap-2 border-b border-slate-200 px-3 py-2"><Boxes size={16} className="text-orange-600" /><h3 className="text-sm font-semibold text-slate-800">Partición constructiva</h3>{element ? <button type="button" onClick={() => setCreateOpen(true)} className="ml-auto inline-flex h-7 items-center gap-1 bg-orange-600 px-2.5 text-[11px] font-semibold text-white"><Plus size={13}/>Nueva partición</button> : null}</header>
        <div className="space-y-2 p-3 text-xs">
            {!element ? <p className="text-slate-500">Selecciona un elemento BIM.</p> : <form className="hidden" onSubmit={create}>
                <input className="rounded border border-slate-300 px-2 py-1.5" aria-label="Revisión de partición" required value={draft.revision} onChange={(event) => setDraft({ ...draft, revision: event.target.value })} />
                <select className="rounded border border-slate-300 px-2 py-1.5" aria-label="Eje de partición" value={draft.axis} onChange={(event) => setDraft({ ...draft, axis: event.target.value })}><option value="x">Eje X</option><option value="y">Eje Y</option><option value="z">Eje Z</option></select>
                <input className="rounded border border-slate-300 px-2 py-1.5" aria-label="Número de segmentos" type="number" min="2" max="20" value={draft.segment_count} onChange={(event) => setDraft({ ...draft, segment_count: event.target.value })} />
                <button className="inline-flex items-center justify-center gap-1 rounded bg-orange-600 px-2 py-1.5 text-white disabled:opacity-50" disabled={busy} type="submit"><Plus size={14} />Crear preview</button>
            </form>}
            {specs.length ? <div className="flex gap-2"><select className="min-w-0 flex-1 rounded border border-slate-300 px-2 py-1.5" aria-label="Preview de partición" value={selectedId} onChange={(event) => setSelectedId(event.target.value)}>{specs.map((item) => <option key={item.id} value={item.id}>{item.revision} · {item.segment_count} segmentos/{item.axis}</option>)}</select><button className="rounded border border-slate-300 p-1.5 text-red-700" type="button" title="Eliminar preview" aria-label="Eliminar preview" disabled={busy} onClick={remove}><Trash2 size={14} /></button></div> : null}
            {selected ? <><PartitionPreview spec={selected} artifact={artifact} csgArtifact={csgArtifact} />{csgArtifact ? <div className="flex items-center justify-between gap-2 text-emerald-700" data-bim-partition-csg="exact"><span className="font-medium">CSG exacto · IFC intacto</span><span>{csgArtifact.partition_volume.toFixed(3)} m³</span></div> : artifact ? <div className="flex items-center justify-between gap-2 text-emerald-700" data-bim-partition-materialized="true"><span className="font-medium">Sólidos paramétricos · IFC intacto</span><span>{artifact.total_volume.toFixed(3)} m³</span></div> : <div className="flex items-center justify-between gap-2"><p className="font-medium text-amber-700" data-bim-partition-materialized="false">Preview no materializado · fuente IFC intacta</p><button className="inline-flex items-center gap-1 rounded border border-orange-300 px-2 py-1 text-orange-700 disabled:opacity-50" type="button" disabled={busy} onClick={materialize}><Box size={13} />Materializar</button></div>}{csgArtifact ? <p className="text-slate-500" data-bim-partition-geometry-method={csgArtifact.geometry_method}>{csgArtifact.artifact_revision} · {csgArtifact.geometry_method} · {csgArtifact.checksum_sha256.slice(0, 12)}</p> : artifact ? <p className="text-slate-500" data-bim-partition-geometry-method={artifact.geometry_method}>bounding_box_v1 · CSG IFC exacto: no · {artifact.checksum_sha256.slice(0, 12)}</p> : null}</> : null}
            {error ? <p className="text-red-700" role="alert">{error}</p> : null}
        </div>
        {createOpen ? <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/35 p-6"><form className="w-full max-w-md overflow-hidden rounded-xl bg-white shadow-2xl" onSubmit={(event) => { create(event); setCreateOpen(false); }} role="dialog" aria-modal="true" aria-labelledby="partition-create-title"><header className="flex min-h-12 items-center border-b border-slate-200 px-5"><div><h3 id="partition-create-title" className="text-sm font-semibold">Nueva partición constructiva</h3><p className="text-[11px] text-slate-500">Genera un preview paramétrico sin alterar el IFC.</p></div><button type="button" onClick={() => setCreateOpen(false)} aria-label="Cerrar nueva partición" className="ml-auto inline-flex size-8 items-center justify-center text-slate-500"><X size={16}/></button></header><div className="grid grid-cols-2 gap-3 p-5"><input autoFocus className="h-9 rounded border border-slate-300 px-3 text-xs" aria-label="Revisión de partición" required value={draft.revision} onChange={(event) => setDraft({ ...draft, revision: event.target.value })}/><select className="h-9 rounded border border-slate-300 px-2 text-xs" aria-label="Eje de partición" value={draft.axis} onChange={(event) => setDraft({ ...draft, axis: event.target.value })}><option value="x">Eje X</option><option value="y">Eje Y</option><option value="z">Eje Z</option></select><input className="col-span-2 h-9 rounded border border-slate-300 px-3 text-xs" aria-label="Número de segmentos" type="number" min="2" max="20" value={draft.segment_count} onChange={(event) => setDraft({ ...draft, segment_count: event.target.value })}/></div><footer className="flex min-h-12 items-center justify-end gap-2 border-t border-slate-200 px-5"><button type="button" onClick={() => setCreateOpen(false)} className="h-8 px-3 text-xs">Cancelar</button><button type="submit" disabled={busy} className="h-8 bg-orange-600 px-4 text-xs font-semibold text-white">Crear preview</button></footer></form></div> : null}
    </section>;
}
