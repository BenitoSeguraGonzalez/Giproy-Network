import React, { useState, useMemo } from 'react';
import { ChevronRight, ChevronDown, Layers, Briefcase, Search, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { includesNormalized } from '../../utils/normalizeSearch';
import ClearSearchField from './ClearSearchField';

const EDTTreeSelector = ({ nodes, selectedId, onSelect, assignedStats = {} }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedNodes, setExpandedNodes] = useState(new Set(['root']));

    // Construir estructura jerárquica
    const treeData = useMemo(() => {
        const buildTree = (parentId = null) => {
            return nodes
                .filter(n => n.parent_id === parentId)
                .map(n => ({
                    ...n,
                    children: buildTree(n.id)
                }));
        };
        return buildTree(null);
    }, [nodes]);

    const toggleExpand = (id) => {
        const next = new Set(expandedNodes);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setExpandedNodes(next);
    };

    const renderNode = (node, depth = 0) => {
        const isExpanded = expandedNodes.has(node.id);
        const isSelected = selectedId === node.id;
        const hasChildren = node.children && node.children.length > 0;
        const assignedCount = assignedStats[node.id] || 0;

        // Filtrado básico por búsqueda
        if (searchTerm && !includesNormalized(node.nombre, searchTerm) && !includesNormalized(node.codigo, searchTerm)) {
            // Si tiene hijos que coinciden, mostrarlo igual (recursivo)
            const childrenMatch = node.children.some(child => 
                includesNormalized(child.nombre, searchTerm) || 
                includesNormalized(child.codigo, searchTerm)
            );
            if (!childrenMatch) return null;
        }

        return (
            <div key={node.id} className="select-none">
                <div 
                    onClick={() => onSelect(node)}
                    className={`flex items-center gap-2 p-2 px-3 rounded-xl cursor-pointer transition-all ${
                        isSelected 
                        ? 'bg-[#1A1A1A] text-white shadow-md' 
                        : 'hover:bg-zinc-100 text-zinc-600'
                    }`}
                    style={{ marginLeft: `${depth * 1.5}rem` }}
                >
                    <div 
                        onClick={(e) => {
                            if (hasChildren) {
                                e.stopPropagation();
                                toggleExpand(node.id);
                            }
                        }}
                        className={`p-1 rounded-lg transition-colors ${hasChildren ? 'hover:bg-zinc-200/50' : 'opacity-0'}`}
                    >
                        {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                    </div>
                    
                    <div className={`p-1.5 rounded-lg ${isSelected ? 'bg-zinc-800' : 'bg-zinc-100'}`}>
                        <Layers className="w-3.5 h-3.5" />
                    </div>

                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <span className={`text-[9px] font-black uppercase tracking-widest ${isSelected ? 'text-zinc-400' : 'text-zinc-400'}`}>
                                {node.codigo}
                            </span>
                            {assignedCount > 0 && (
                                <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-orange-100 text-[#F39200] border border-orange-200">
                                    <Users className="w-2.5 h-2.5" />
                                    <span className="text-[8px] font-black">{assignedCount}</span>
                                </div>
                            )}
                        </div>
                        <p className="text-xs font-bold truncate uppercase">{node.nombre}</p>
                    </div>
                </div>

                <AnimatePresence>
                    {isExpanded && hasChildren && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                        >
                            <div className="py-1">
                                {node.children.map(child => renderNode(child, depth + 1))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        );
    };

    return (
        <div className="flex flex-col h-full gap-4">
            <ClearSearchField
                value={searchTerm}
                onValueChange={setSearchTerm}
                placeholder="Filtrar estructura EDT..."
                inputClassName="w-full pl-10 pr-10 h-11 bg-zinc-50 border border-zinc-200 rounded-2xl text-xs font-bold uppercase tracking-widest focus:outline-none focus:border-[#F39200] transition-all"
            />

            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-1">
                {/* Opción de Todo el Proyecto (Root) */}
                <div 
                    onClick={() => onSelect(null)}
                    className={`flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-all ${
                        selectedId === null 
                        ? 'bg-[#1A1A1A] text-white shadow-lg' 
                        : 'hover:bg-zinc-100 text-zinc-600'
                    }`}
                >
                    <div className={`p-2 rounded-xl ${selectedId === null ? 'bg-zinc-800 text-[#F39200]' : 'bg-zinc-900 text-white'}`}>
                        <Briefcase className="w-4 h-4" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Configuración Global</p>
                        <h4 className="text-sm font-black uppercase tracking-tight">Todo el Proyecto</h4>
                    </div>
                </div>

                <div className="h-px bg-zinc-100 my-4" />

                {treeData.map(node => renderNode(node))}
            </div>
        </div>
    );
};

export default EDTTreeSelector;
