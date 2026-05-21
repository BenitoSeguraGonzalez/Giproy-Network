from __future__ import annotations

from dataclasses import dataclass, field
from math import isclose
from typing import Dict, List, Optional


TURN_FACTOR_MAP = {
    "diurno": 1.0,
    "vespertino": 0.92,
    "nocturno": 0.80,
    "doble": 1.76,
    "triple": 2.55,
}

RESTRICTIONS = {"SNET", "SNLT", "FNET", "FNLT", "MSO", "MFO"}
DEPENDENCY_TYPES = {"FS", "SS", "FF", "SF"}
FLOAT_TOLERANCE = 1e-6


@dataclass
class DependenciaCpm:
    predecesor_id: str
    tipo: str = "FS"
    lag: float = 0.0

    def __post_init__(self) -> None:
        self.predecesor_id = str(self.predecesor_id)
        self.tipo = str(self.tipo or "FS").upper()
        if self.tipo not in DEPENDENCY_TYPES:
            self.tipo = "FS"
        self.lag = float(self.lag or 0.0)


@dataclass
class ActividadCpm:
    id: str
    nombre: str
    duracion: float
    predecesores: List[DependenciaCpm] = field(default_factory=list)
    calendario_id: Optional[str] = None
    turno: str = "diurno"
    factor_eficiencia: float = 1.0
    restriccion_tipo: Optional[str] = None
    restriccion_valor: Optional[float] = None
    avance_real: float = 0.0
    es: float = 0.0
    ef: float = 0.0
    ls: float = 0.0
    lf: float = 0.0
    holgura_total: float = 0.0
    holgura_libre: float = 0.0
    es_critica: bool = False
    pv: float = 0.0
    ev: float = 0.0
    ac: float = 0.0
    duracion_efectiva: float = 0.0

    def __post_init__(self) -> None:
        self.id = str(self.id)
        self.nombre = str(self.nombre or self.id)
        self.duracion = max(float(self.duracion or 0.0), 0.0)
        self.turno = str(self.turno or "diurno").lower()
        self.factor_eficiencia = max(float(self.factor_eficiencia or 1.0), FLOAT_TOLERANCE)
        self.avance_real = min(max(float(self.avance_real or 0.0), 0.0), 1.0)
        restriction = str(self.restriccion_tipo or "").upper()
        self.restriccion_tipo = restriction if restriction in RESTRICTIONS else None
        if self.restriccion_valor is not None:
            self.restriccion_valor = float(self.restriccion_valor)
        self.predecesores = [item if isinstance(item, DependenciaCpm) else DependenciaCpm(**item) for item in self.predecesores]


@dataclass
class CPMResult:
    actividades: Dict[str, ActividadCpm]
    duracion_total: float
    rutas_criticas: List[List[str]]
    tiene_holgura_negativa: bool
    advertencias: List[str]
    pv_total: float = 0.0
    ev_total: float = 0.0
    ac_total: float = 0.0
    spi: float = 0.0
    cpi: float = 0.0
    eac: float = 0.0


class CriticalPathEngine:
    def calcular(self, actividades: Dict[str, ActividadCpm]) -> CPMResult:
        if not actividades:
            return CPMResult(
                actividades={},
                duracion_total=0.0,
                rutas_criticas=[],
                tiene_holgura_negativa=False,
                advertencias=[],
            )

        nodes = {str(key): self._clone_activity(value, str(key)) for key, value in actividades.items()}
        warnings: List[str] = []
        successors = {activity_id: [] for activity_id in nodes}
        indegree = {activity_id: 0 for activity_id in nodes}

        for activity_id, activity in nodes.items():
            for dependency in activity.predecesores:
                predecessor_id = dependency.predecesor_id
                if predecessor_id not in nodes:
                    warnings.append(
                        f"Actividad {activity_id} referencia predecesor inexistente {predecessor_id}; se ignora."
                    )
                    continue
                successors[predecessor_id].append((activity_id, dependency))
                indegree[activity_id] += 1

        topo_order = self._topological_sort(nodes, indegree)

        for activity_id in topo_order:
            activity = nodes[activity_id]
            duration = self._resolve_effective_duration(activity)
            activity.duracion_efectiva = duration
            es = 0.0
            ef = duration

            if activity.predecesores:
                candidate_starts: List[float] = []
                for dependency in activity.predecesores:
                    predecessor = nodes.get(dependency.predecesor_id)
                    if predecessor is None:
                        continue
                    candidate_start = self._resolve_forward_start(predecessor, dependency, duration)
                    candidate_starts.append(candidate_start)
                if candidate_starts:
                    es = max(candidate_starts)
                    ef = es + duration

            es = self._apply_forward_restrictions(activity, es, ef)[0]
            ef = es + duration
            if activity.restriccion_tipo == "FNET" and activity.restriccion_valor is not None:
                ef = max(ef, activity.restriccion_valor)
                es = ef - duration

            if es < 0:
                warnings.append(
                    f"Actividad {activity.id} produjo inicio temprano negativo por lead/restricción; se ajusta a 0."
                )
                es = 0.0
                ef = duration
                if activity.restriccion_tipo == "FNET" and activity.restriccion_valor is not None:
                    ef = max(ef, activity.restriccion_valor)
                    es = ef - duration
                    if es < 0:
                        es = 0.0
                        ef = duration

            activity.es = es
            activity.ef = ef

        terminal_ids = [activity_id for activity_id, links in successors.items() if not links]
        project_finish = max((nodes[activity_id].ef for activity_id in terminal_ids or topo_order), default=0.0)

        for activity_id in reversed(topo_order):
            activity = nodes[activity_id]
            duration = activity.duracion_efectiva
            outgoing = successors.get(activity_id, [])
            if outgoing:
                candidate_lfs: List[float] = []
                for successor_id, dependency in outgoing:
                    successor = nodes[successor_id]
                    candidate_lfs.append(self._resolve_backward_lf(activity, successor, dependency))
                lf = min(candidate_lfs)
            else:
                lf = project_finish

            ls = lf - duration
            lf, ls = self._apply_backward_restrictions(activity, lf, ls, duration)
            activity.lf = lf
            activity.ls = ls
            activity.holgura_total = ls - activity.es
            activity.es_critica = isclose(activity.holgura_total, 0.0, abs_tol=FLOAT_TOLERANCE)

        for activity_id in topo_order:
            activity = nodes[activity_id]
            outgoing = successors.get(activity_id, [])
            if not outgoing:
                activity.holgura_libre = 0.0
                continue
            candidate_values = [nodes[successor_id].es for successor_id, _dependency in outgoing]
            activity.holgura_libre = min(candidate_values) - activity.ef if candidate_values else 0.0

        has_negative_float = any(activity.holgura_total < -FLOAT_TOLERANCE for activity in nodes.values())
        if has_negative_float:
            warnings.append("Se detectó holgura negativa en una o más actividades.")

        critical_paths = self._resolve_critical_paths(nodes, successors)
        pv_total = sum(float(activity.pv or 0.0) for activity in nodes.values())
        ev_total = sum(float(activity.ev or 0.0) for activity in nodes.values())
        ac_total = sum(float(activity.ac or 0.0) for activity in nodes.values())
        spi = ev_total / pv_total if pv_total > FLOAT_TOLERANCE else 0.0
        cpi = ev_total / ac_total if ac_total > FLOAT_TOLERANCE else 0.0
        eac = pv_total / cpi if cpi > FLOAT_TOLERANCE else 0.0

        return CPMResult(
            actividades=nodes,
            duracion_total=project_finish,
            rutas_criticas=critical_paths,
            tiene_holgura_negativa=has_negative_float,
            advertencias=warnings,
            pv_total=pv_total,
            ev_total=ev_total,
            ac_total=ac_total,
            spi=spi,
            cpi=cpi,
            eac=eac,
        )

    def _clone_activity(self, activity: ActividadCpm, activity_id: str) -> ActividadCpm:
        if isinstance(activity, ActividadCpm):
            payload = activity.__dict__.copy()
            payload["predecesores"] = [DependenciaCpm(item.predecesor_id, item.tipo, item.lag) for item in activity.predecesores]
            payload["id"] = activity_id
            return ActividadCpm(**payload)
        payload = dict(activity)
        payload["id"] = activity_id
        return ActividadCpm(**payload)

    def _topological_sort(self, nodes: Dict[str, ActividadCpm], indegree: Dict[str, int]) -> List[str]:
        queue = [activity_id for activity_id, degree in indegree.items() if degree == 0]
        order: List[str] = []
        remaining = {key: int(value) for key, value in indegree.items()}

        while queue:
            current = queue.pop(0)
            order.append(current)
            for activity in nodes.values():
                for dependency in activity.predecesores:
                    if dependency.predecesor_id != current:
                        continue
                    remaining[activity.id] -= 1
                    if remaining[activity.id] == 0:
                        queue.append(activity.id)

        if len(order) != len(nodes):
            cyclic = sorted(set(nodes.keys()) - set(order))
            raise ValueError(f"Se detectó un ciclo en la red CPM/PDM: {' -> '.join(cyclic)}")
        return order

    def _resolve_effective_duration(self, activity: ActividadCpm) -> float:
        shift_factor = TURN_FACTOR_MAP.get(activity.turno, 1.0)
        effective_duration = activity.duracion / max(shift_factor * activity.factor_eficiencia, FLOAT_TOLERANCE)
        remaining_factor = max(0.0, 1.0 - activity.avance_real)
        return max(effective_duration * remaining_factor, 0.0)

    def _resolve_forward_start(self, predecessor: ActividadCpm, dependency: DependenciaCpm, successor_duration: float) -> float:
        if dependency.tipo == "SS":
            return predecessor.es + dependency.lag
        if dependency.tipo == "FF":
            return (predecessor.ef + dependency.lag) - successor_duration
        if dependency.tipo == "SF":
            return (predecessor.es + dependency.lag) - successor_duration
        return predecessor.ef + dependency.lag

    def _resolve_backward_lf(self, predecessor: ActividadCpm, successor: ActividadCpm, dependency: DependenciaCpm) -> float:
        if dependency.tipo == "SS":
            return (successor.ls - dependency.lag) + predecessor.duracion_efectiva
        if dependency.tipo == "FF":
            return successor.lf - dependency.lag
        if dependency.tipo == "SF":
            return (successor.lf - dependency.lag) + predecessor.duracion_efectiva
        return successor.ls - dependency.lag

    def _apply_forward_restrictions(self, activity: ActividadCpm, es: float, ef: float) -> tuple[float, float]:
        if activity.restriccion_tipo == "SNET" and activity.restriccion_valor is not None:
            es = max(es, activity.restriccion_valor)
        elif activity.restriccion_tipo == "MSO" and activity.restriccion_valor is not None:
            es = activity.restriccion_valor
        ef = es + activity.duracion_efectiva
        return es, ef

    def _apply_backward_restrictions(
        self,
        activity: ActividadCpm,
        lf: float,
        ls: float,
        duration: float,
    ) -> tuple[float, float]:
        if activity.restriccion_tipo == "SNLT" and activity.restriccion_valor is not None:
            ls = min(ls, activity.restriccion_valor)
            lf = ls + duration
        if activity.restriccion_tipo == "FNLT" and activity.restriccion_valor is not None:
            lf = min(lf, activity.restriccion_valor)
            ls = lf - duration
        if activity.restriccion_tipo == "MFO" and activity.restriccion_valor is not None:
            lf = activity.restriccion_valor
            ls = lf - duration
        if activity.restriccion_tipo == "MSO" and activity.restriccion_valor is not None:
            ls = min(ls, activity.restriccion_valor)
            lf = ls + duration
        return lf, ls

    def _resolve_critical_paths(
        self,
        nodes: Dict[str, ActividadCpm],
        successors: Dict[str, List[tuple[str, DependenciaCpm]]],
    ) -> List[List[str]]:
        critical_ids = {
            activity_id
            for activity_id, activity in nodes.items()
            if isclose(activity.holgura_total, 0.0, abs_tol=FLOAT_TOLERANCE)
        }
        if not critical_ids:
            return []

        critical_predecessors = {activity_id: set() for activity_id in critical_ids}
        critical_successors = {activity_id: [] for activity_id in critical_ids}

        for source_id, links in successors.items():
            if source_id not in critical_ids:
                continue
            source = nodes[source_id]
            for target_id, dependency in links:
                if target_id not in critical_ids:
                    continue
                target = nodes[target_id]
                expected_start = self._resolve_forward_start(source, dependency, target.duracion_efectiva)
                if isclose(target.es, expected_start, abs_tol=FLOAT_TOLERANCE):
                    critical_successors[source_id].append(target_id)
                    critical_predecessors[target_id].add(source_id)

        start_nodes = sorted(
            activity_id
            for activity_id in critical_ids
            if not critical_predecessors[activity_id]
        )
        if not start_nodes:
            start_nodes = sorted(critical_ids)

        paths: List[List[str]] = []

        def dfs(current_id: str, path: List[str]) -> None:
            next_ids = sorted(set(critical_successors.get(current_id, [])) - set(path))
            if not next_ids:
                paths.append(path.copy())
                return
            for next_id in next_ids:
                path.append(next_id)
                dfs(next_id, path)
                path.pop()

        for start_id in start_nodes:
            dfs(start_id, [start_id])

        unique_paths: List[List[str]] = []
        seen = set()
        for path in paths:
            marker = tuple(path)
            if marker in seen:
                continue
            seen.add(marker)
            unique_paths.append(path)
        return unique_paths
