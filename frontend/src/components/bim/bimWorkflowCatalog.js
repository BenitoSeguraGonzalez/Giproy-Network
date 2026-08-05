const ENTRY = (group, purpose, reference, surface = 'context') => ({ group, purpose, reference, surface });

export const BIM_WORKFLOW_CATALOG = {
    'planning-costs': {
        schedule: ENTRY('Vincular 4D/5D', 'Relacionar la selección del modelo con una actividad planificada.', 'Navisworks TimeLiner'),
        links: ENTRY('Vincular 4D/5D', 'Revisar las relaciones entre modelo, planificación y presupuesto.', 'SYNCHRO'),
        quantities: ENTRY('Vincular 4D/5D', 'Preparar cantidades del modelo para revisión presupuestaria.', 'SYNCHRO'),
        estimate: ENTRY('Vincular 4D/5D', 'Valorar cantidades BIM sin alterar el presupuesto oficial.', 'SYNCHRO', 'workbench'),
        'plan-actual': ENTRY('Revisar ejecución', 'Comparar lo previsto con el avance registrado.', 'SYNCHRO Perform', 'workbench'),
        productivity: ENTRY('Revisar ejecución', 'Contrastar producción observada y rendimiento previsto.', 'SYNCHRO Perform', 'workbench'),
        events: ENTRY('Revisar ejecución', 'Evaluar impactos no planificados sobre plazo y coste.', 'SYNCHRO Perform'),
        workfronts: ENTRY('Preparar producción', 'Organizar el modelo por frentes constructivos ejecutables.', 'SYNCHRO', 'workbench'),
        resources: ENTRY('Preparar producción', 'Comprobar capacidad y sobreasignaciones antes de ejecutar.', 'SYNCHRO'),
        partitions: ENTRY('Preparar producción', 'Dividir componentes de diseño en unidades construibles.', 'SYNCHRO'),
        equipment: ENTRY('Preparar producción', 'Coordinar equipos y geometría temporal de obra.', 'SYNCHRO'),
        'cost-control': ENTRY('Controlar costes', 'Gestionar compromisos, certificaciones, cambios, coste real y previsión en un único flujo.', 'Autodesk Cost Management', 'workbench'),
        interchange: ENTRY('Intercambiar', 'Importar o exportar planificación con control de procedencia.', 'Navisworks TimeLiner', 'workbench'),
        'erp-exchange': ENTRY('Intercambiar', 'Intercambiar datos gobernados con el ERP.', 'Trimble Connect'),
        integrations: ENTRY('Intercambiar', 'Administrar conexiones externas del flujo coordinado.', 'Trimble Connect'),
        properties: ENTRY('Consultar selección', 'Leer propiedades del elemento activo.', 'Dalux'),
    },
    model: {
        properties: ENTRY('Consultar selección', 'Leer las propiedades IFC del elemento activo.', 'Dalux'),
        links: ENTRY('Consultar selección', 'Ver a qué entidades de GiProy está conectado el elemento.', 'Trimble Connect'),
        quantities: ENTRY('Consultar selección', 'Revisar cantidades derivadas de la selección.', 'SYNCHRO'),
        versions: ENTRY('Organizar modelo', 'Cambiar modelo o revisión manteniendo el contexto.', 'Autodesk Model Coordination'),
        views: ENTRY('Organizar modelo', 'Restaurar cámara, visibilidad y filtros guardados.', 'Trimble Connect'),
    },
    coordination: {
        'coordination-control': ENTRY('Referencia coordinada', 'Preparar y gobernar la referencia Presupuesto ↔ Gantt ↔ BIM.', 'SYNCHRO', 'workbench'),
        conflicts: ENTRY('Detectar y resolver', 'Revisar conflictos espaciales y temporales.', 'Autodesk Model Coordination'),
        issues: ENTRY('Detectar y resolver', 'Convertir una observación del modelo en trabajo asignable.', 'Autodesk Issues'),
        quality: ENTRY('Detectar y resolver', 'Comprobar calidad y completitud de la versión activa.', 'Autodesk Model Coordination'),
        ids: ENTRY('Detectar y resolver', 'Validar requisitos de información del modelo.', 'Autodesk Model Coordination'),
        compare: ENTRY('Revisar cambios', 'Comparar revisiones y reconciliar elementos.', 'Autodesk Model Coordination'),
        reviews: ENTRY('Revisar cambios', 'Revisar el modelo conservando viewpoint y evidencia.', 'Autodesk Issues'),
        'cde-dashboard': ENTRY('Colaborar', 'Priorizar pendientes de coordinación.', 'Revizto', 'workbench'),
        collaboration: ENTRY('Colaborar', 'Consultar la actividad del equipo en contexto.', 'Trimble Connect', 'workbench'),
        documents: ENTRY('Colaborar', 'Relacionar documentos con el contexto coordinado.', 'Trimble Connect', 'workbench'),
        rfis: ENTRY('Colaborar', 'Gestionar solicitudes de información vinculadas al modelo.', 'Autodesk Issues'),
        submittals: ENTRY('Colaborar', 'Gestionar entregables y su revisión.', 'Autodesk Construction Cloud', 'workbench'),
        federation: ENTRY('Preparar modelos', 'Federar disciplinas y revisar correspondencias.', 'Autodesk Model Coordination'),
        location: ENTRY('Preparar modelos', 'Validar posición, unidades y referencia espacial.', 'Dalux'),
    },
    tracking: {
        progress: ENTRY('Registrar obra', 'Registrar avance con contexto de modelo y planificación.', 'SYNCHRO Perform', 'workbench'),
        diary: ENTRY('Registrar obra', 'Documentar el parte diario de producción.', 'SYNCHRO Perform'),
        crews: ENTRY('Registrar obra', 'Registrar cuadrillas y tiempo de trabajo.', 'SYNCHRO Perform', 'workbench'),
        materials: ENTRY('Registrar obra', 'Registrar materiales usados o recibidos.', 'SYNCHRO Perform', 'workbench'),
        issues: ENTRY('Controlar obra', 'Gestionar incidencias desde su ubicación BIM.', 'Dalux', 'workbench'),
        safety: ENTRY('Controlar obra', 'Registrar inspecciones y riesgos situados.', 'Dalux'),
        documents: ENTRY('Evidencia', 'Consultar documentación de campo relacionada.', 'Dalux', 'workbench'),
        reports: ENTRY('Evidencia', 'Preparar informes desde la referencia coordinada.', 'SYNCHRO Perform', 'workbench'),
        properties: ENTRY('Consultar selección', 'Leer el elemento seleccionado en obra.', 'Dalux'),
    },
    handover: {
        'as-built': ENTRY('Preparar entrega', 'Aceptar la revisión as-built contra la referencia.', 'SYNCHRO', 'workbench'),
        commissioning: ENTRY('Preparar entrega', 'Registrar puesta en marcha por sistema o elemento.', 'Autodesk Construction Cloud', 'workbench'),
        'punch-closure': ENTRY('Cerrar pendientes', 'Cerrar observaciones pendientes antes de entregar.', 'Autodesk Issues', 'workbench'),
        'handover-dossier': ENTRY('Entregar información', 'Consolidar el dossier digital del activo.', 'Autodesk Construction Cloud', 'workbench'),
        'operations-transition': ENTRY('Entregar información', 'Transferir información validada a operación y mantenimiento.', 'SYNCHRO', 'workbench'),
    },
};

const FALLBACK = ENTRY('Otras tareas', 'Abrir esta herramienta en el contexto actual.', 'GiProy');

export const getBimToolMeta = (mode, toolId) => BIM_WORKFLOW_CATALOG[mode]?.[toolId] || FALLBACK;

export const groupBimTools = (mode, tools = []) => {
    const groups = new Map();
    tools.forEach((tool) => {
        const meta = getBimToolMeta(mode, tool.id);
        if (!groups.has(meta.group)) groups.set(meta.group, []);
        groups.get(meta.group).push({ ...tool, meta });
    });
    return Array.from(groups, ([label, items]) => ({ label, items }));
};
