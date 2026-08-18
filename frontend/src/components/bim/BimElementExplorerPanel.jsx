import React, { useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, Search, SlidersHorizontal } from 'lucide-react';

const text = (value) => String(value || '').trim();

export default function BimElementExplorerPanel({ elements = [], onSelectElement, selectedElementId = null }) {
    const [query, setQuery] = useState('');
    const [discipline, setDiscipline] = useState('all');
    const [classification, setClassification] = useState('all');
    const disciplines = useMemo(() => [...new Set(elements.map((item) => text(item.discipline || item.disciplina) || 'Sin disciplina'))].sort(), [elements]);
    const classifications = useMemo(() => [...new Set(elements.map((item) => text(item.omniclass_code || item.classification_code || item.ifc_class) || 'Sin clasificación'))].sort(), [elements]);
    const filtered = useMemo(() => {
        const normalized = query.toLocaleLowerCase();
        return elements.filter((item) => {
            const itemDiscipline = text(item.discipline || item.disciplina) || 'Sin disciplina';
            const itemClassification = text(item.omniclass_code || item.classification_code || item.ifc_class) || 'Sin clasificación';
            if (discipline !== 'all' && itemDiscipline !== discipline) return false;
            if (classification !== 'all' && itemClassification !== classification) return false;
            if (!normalized) return true;
            return [item.global_id, item.guid, item.name, item.nombre, item.ifc_class, itemClassification].some((value) => text(value).toLocaleLowerCase().includes(normalized));
        });
    }, [classification, discipline, elements, query]);
    const tree = useMemo(() => {
        const storeys = new Map();
        filtered.forEach((item) => {
            const storeyName = text(item.storey_name) || 'Sin nivel';
            const ifcClass = text(item.ifc_class).toUpperCase() || 'Sin clase IFC';
            if (!storeys.has(storeyName)) storeys.set(storeyName, new Map());
            const classes = storeys.get(storeyName);
            if (!classes.has(ifcClass)) classes.set(ifcClass, []);
            classes.get(ifcClass).push(item);
        });
        return [...storeys.entries()].sort(([a], [b]) => a.localeCompare(b, 'es'));
    }, [filtered]);
    const [collapsed, setCollapsed] = useState(() => new Set());
    const toggle = (key) => setCollapsed((current) => {
        const next = new Set(current);
        if (next.has(key)) next.delete(key); else next.add(key);
        return next;
    });
    return <section className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-x-hidden overflow-y-hidden border border-zinc-300 bg-white" data-bim-element-explorer>
        <header className="shrink-0 border-b border-zinc-200 px-4 py-3"><div className="flex items-center gap-2"><SlidersHorizontal className="size-4 text-orange-600" aria-hidden="true" /><div><h2 className="text-sm font-semibold text-zinc-950">Explorador de elementos</h2><p className="text-[11px] text-zinc-600">Busca por GUID, propiedad, disciplina o clasificación antes de inspeccionar en 3D.</p></div></div>
            <div className="mt-3 grid min-w-0 gap-2"><label className="flex h-9 items-center gap-2 rounded-md border border-zinc-300 px-2.5"><Search className="size-3.5 text-zinc-400" aria-hidden="true" /><input aria-label="Buscar elemento BIM" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="GUID, nombre o clase" className="min-w-0 flex-1 text-xs outline-none" /></label><select aria-label="Filtrar disciplina" value={discipline} onChange={(event) => setDiscipline(event.target.value)} className="h-9 rounded-md border border-zinc-300 bg-white px-2 text-xs"><option value="all">Todas las disciplinas</option>{disciplines.map((value) => <option key={value} value={value}>{value}</option>)}</select><select aria-label="Filtrar clasificación" value={classification} onChange={(event) => setClassification(event.target.value)} className="h-9 rounded-md border border-zinc-300 bg-white px-2 text-xs"><option value="all">Todas las clasificaciones</option>{classifications.map((value) => <option key={value} value={value}>{value}</option>)}</select></div>
        </header>
        <div className="min-h-0 flex-1 overflow-auto" data-bim-element-tree>{filtered.length ? <div className="p-2">{tree.map(([storeyName, classes]) => { const storeyKey = `storey:${storeyName}`; const storeyCollapsed = collapsed.has(storeyKey); const total = [...classes.values()].reduce((sum, items) => sum + items.length, 0); return <div key={storeyKey} data-bim-tree-node="storey" className="mb-1 overflow-hidden rounded-md border border-zinc-200"><button type="button" onClick={() => toggle(storeyKey)} className="flex w-full items-center gap-1.5 bg-zinc-50 px-2 py-1.5 text-left text-[10px] font-semibold text-zinc-800 hover:bg-orange-50"><span aria-hidden="true">{storeyCollapsed ? <ChevronRight className="size-3.5" /> : <ChevronDown className="size-3.5" />}</span><span className="min-w-0 flex-1 truncate">{storeyName}</span><span className="text-[9px] font-medium text-zinc-500">{total}</span></button>{!storeyCollapsed && <div className="border-t border-zinc-200">{[...classes.entries()].sort(([a], [b]) => a.localeCompare(b, 'es')).map(([ifcClass, items]) => { const classKey = `${storeyKey}:${ifcClass}`; const classCollapsed = collapsed.has(classKey); return <div key={classKey} data-bim-tree-node="ifc-class"><button type="button" onClick={() => toggle(classKey)} className="flex w-full items-center gap-1.5 px-3 py-1.5 text-left text-[9px] font-semibold uppercase tracking-wide text-zinc-600 hover:bg-orange-50"><span aria-hidden="true">{classCollapsed ? <ChevronRight className="size-3" /> : <ChevronDown className="size-3" />}</span><span className="min-w-0 flex-1 truncate">{ifcClass}</span><span className="font-medium normal-case tracking-normal text-zinc-400">{items.length}</span></button>{!classCollapsed && <div className="divide-y divide-zinc-100 border-t border-zinc-100">{items.map((item) => { const id = item.id ?? item.global_id; const active = String(id) === String(selectedElementId); return <button key={id} type="button" data-bim-tree-element={id} onClick={() => onSelectElement?.(item)} className={`flex w-full min-w-0 items-center gap-2 px-3 py-2 text-left hover:bg-orange-50 ${active ? 'bg-orange-50 ring-1 ring-inset ring-orange-500' : ''}`}><span className="min-w-0 flex-1"><strong className="block truncate text-[10px] text-zinc-950">{item.name || item.nombre || item.ifc_class || 'Elemento BIM'}</strong><span className="block truncate font-mono text-[9px] text-zinc-500">{item.global_id || item.guid || 'GUID no disponible'}</span></span><span className="max-w-24 shrink-0 truncate text-right text-[9px] text-zinc-500">{item.system_name || item.classification || 'Sin sistema'}</span></button>; })}</div>}</div>; })}</div>}</div>; })}</div> : <div className="grid min-h-40 place-items-center p-6 text-center"><div><p className="text-xs font-semibold text-zinc-800">No hay elementos que coincidan</p><p className="mt-1 text-[11px] text-zinc-600">Ajusta la búsqueda o revisa la clasificación pendiente.</p></div></div>}</div>
        <footer className="shrink-0 border-t border-zinc-200 px-3 py-1.5 text-[9px] font-semibold text-zinc-500">{filtered.length} de {elements.length} elementos · árbol desplazable</footer>
    </section>;
}
