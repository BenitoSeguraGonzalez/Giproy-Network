from __future__ import annotations

from datetime import datetime
from collections import defaultdict, deque
from pathlib import Path
import webbrowser

from PySide6.QtCore import QTimer, Qt
from PySide6.QtGui import QCloseEvent, QTextCursor, QPixmap, QIcon
from PySide6.QtWidgets import (
    QCheckBox,
    QComboBox,
    QDoubleSpinBox,
    QGridLayout,
    QGroupBox,
    QHBoxLayout,
    QLineEdit,
    QLabel,
    QMainWindow,
    QMessageBox,
    QPlainTextEdit,
    QPushButton,
    QScrollArea,
    QSizePolicy,
    QSpinBox,
    QTableWidget,
    QTableWidgetItem,
    QTabWidget,
    QVBoxLayout,
    QWidget,
)

from ..config import LauncherConfig
from ..ops import (
    CommandResult,
    AlertEvent,
    append_alert_events,
    append_metrics_snapshot,
    api_health_checks,
    clear_runtime_logs,
    delete_services,
    clear_monitor_history,
    elevate_self,
    export_diagnostics_zip,
    export_executive_report,
    export_alerts_json,
    export_metrics_csv,
    get_process_metrics,
    get_log_health,
    get_runtime_status,
    get_local_ai_diagnostics,
    get_system_metrics,
    install_project_bridge,
    is_admin,
    load_recent_alerts,
    load_launcher_settings,
    parse_auth_activity,
    percentile,
    run_platform_checks,
    run_platform_checks,
    uninstall_project_bridge,
    reinstall_services,
    restart_services,
    save_launcher_settings,
    start_services,
    stop_services,
)


class MainWindow(QMainWindow):
    def __init__(self, cfg: LauncherConfig) -> None:
        super().__init__()
        self.cfg = cfg
        self.settings = load_launcher_settings(cfg)
        self.setWindowTitle("GiProy Control Center (Windows)")
        self.resize(1280, 800)

        self._log_offsets: dict[Path, int] = {
            self.cfg.backend_log: 0,
            self.cfg.frontend_log: 0,
            self.cfg.system_log: 0,
        }

        self.admin_label = QLabel()
        self.backend_service_label = QLabel("-")
        self.frontend_service_label = QLabel("-")
        self.backend_port_label = QLabel("-")
        self.frontend_port_label = QLabel("-")
        self.cpu_label = QLabel("-")
        self.memory_label = QLabel("-")
        self.disk_label = QLabel("-")
        self.net_label = QLabel("-")
        self.clients_count_label = QLabel("-")
        self.clients_view = QPlainTextEdit()
        self.clients_view.setReadOnly(True)
        self.clients_view.setMaximumHeight(120)
        self.auth_activity_label = QLabel("-")
        self.auth_ips_label = QLabel("-")
        self.alerts_label = QLabel("-")
        self.alert_history_table = QTableWidget(0, 4)
        self.alert_history_table.setHorizontalHeaderLabels(["Fecha", "Nivel", "Origen", "Mensaje"])
        self.alert_history_table.horizontalHeader().setStretchLastSection(True)
        self.alert_history_table.verticalHeader().setVisible(False)
        self.alert_history_table.setEditTriggers(QTableWidget.NoEditTriggers)
        self.alert_history_table.setSelectionBehavior(QTableWidget.SelectRows)
        self.alert_history_table.setMinimumHeight(170)
        self._last_alert_fingerprint: str = ""
        self._alerts_cache: list[AlertEvent] = []
        self._health_outcomes: deque[bool] = deque(maxlen=240)
        self.kpi_api_availability_label = QLabel("-")
        self.kpi_api_checks_label = QLabel("-")
        self.kpi_openapi_label = QLabel("-")
        self.kpi_top_endpoint_label = QLabel("-")
        self.kpi_cpu_trend_label = QLabel("-")
        self.kpi_mem_trend_label = QLabel("-")
        self.kpi_p95_trend_label = QLabel("-")
        self.quick_backend_label = QLabel("-")
        self.quick_frontend_label = QLabel("-")
        self.quick_api_label = QLabel("-")
        self.quick_alerts_label = QLabel("-")
        self.quick_endpoint_label = QLabel("-")
        self._runtime_backend_state = "UNKNOWN"
        self._runtime_frontend_state = "UNKNOWN"
        self._api_availability = 0.0
        self._active_alerts_count = 0
        self._top_endpoint_summary = "Sin incidencias"

        self.backend_log_view = QPlainTextEdit()
        self.backend_log_view.setReadOnly(True)
        self.frontend_log_view = QPlainTextEdit()
        self.frontend_log_view.setReadOnly(True)
        self.system_log_view = QPlainTextEdit()
        self.system_log_view.setReadOnly(True)

        self.backend_proc_label = QLabel("-")
        self.frontend_proc_label = QLabel("-")
        self.backend_log_health_label = QLabel("-")
        self.frontend_log_health_label = QLabel("-")
        self.latency_summary_label = QLabel("-")

        self.health_labels: dict[str, QLabel] = {}
        for key in ("openapi", "auth/login", "auth/me", "empresas", "paises", "proyectos"):
            self.health_labels[key] = QLabel("-")

        self.check_node = QLabel("-")
        self.check_npm = QLabel("-")
        self.check_db = QLabel("-")
        self.check_ia = QLabel("-")
        self.check_ia_engine = QLabel("-")
        self.check_ia_runtime = QLabel("-")
        self.check_ia_gpu = QLabel("-")
        self.check_ia_efficiency = QLabel("-")
        self.check_backend = QLabel("-")
        self._latency_history: dict[str, deque[float]] = defaultdict(lambda: deque(maxlen=60))
        self._endpoint_fail_4xx: dict[str, int] = defaultdict(int)
        self._endpoint_fail_5xx: dict[str, int] = defaultdict(int)
        self._endpoint_last_error: dict[str, str] = defaultdict(str)
        self._endpoint_success_history: dict[str, deque[int]] = defaultdict(lambda: deque(maxlen=120))
        self._cpu_history: deque[float] = deque(maxlen=120)
        self._mem_history: deque[float] = deque(maxlen=120)
        self._p95_history: deque[float] = deque(maxlen=120)

        self.noc_mode_checkbox = QCheckBox("Modo NOC (solo lectura)")
        self.endpoint_table = QTableWidget(0, 8)
        self.endpoint_table.setHorizontalHeaderLabels(
            ["Endpoint", "Estado", "Últ. lat(ms)", "p50", "p95", "SLA %", "4xx", "5xx"]
        )
        self.endpoint_table.horizontalHeader().setStretchLastSection(True)
        self.endpoint_table.verticalHeader().setVisible(False)
        self.endpoint_table.setEditTriggers(QTableWidget.NoEditTriggers)
        self.endpoint_table.setSelectionBehavior(QTableWidget.SelectRows)
        self.endpoint_table.setMinimumHeight(210)
        self.last_error_label = QLabel("-")

        self.status_interval_spin = QSpinBox()
        self.status_interval_spin.setRange(1000, 60000)
        self.status_interval_spin.setSingleStep(500)
        self.status_interval_spin.setValue(self.settings.status_refresh_ms)
        self.health_interval_spin = QSpinBox()
        self.health_interval_spin.setRange(2000, 120000)
        self.health_interval_spin.setSingleStep(1000)
        self.health_interval_spin.setValue(self.settings.health_refresh_ms)
        self.log_interval_spin = QSpinBox()
        self.log_interval_spin.setRange(500, 10000)
        self.log_interval_spin.setSingleStep(500)
        self.log_interval_spin.setValue(self.settings.log_refresh_ms)

        self.cpu_warn_spin = QDoubleSpinBox()
        self.cpu_warn_spin.setRange(10, 100)
        self.cpu_warn_spin.setDecimals(1)
        self.cpu_warn_spin.setValue(self.settings.cpu_warn_percent)
        self.memory_warn_spin = QDoubleSpinBox()
        self.memory_warn_spin.setRange(10, 100)
        self.memory_warn_spin.setDecimals(1)
        self.memory_warn_spin.setValue(self.settings.memory_warn_percent)
        self.disk_warn_spin = QDoubleSpinBox()
        self.disk_warn_spin.setRange(10, 100)
        self.disk_warn_spin.setDecimals(1)
        self.disk_warn_spin.setValue(self.settings.disk_warn_percent)
        self.latency_warn_spin = QDoubleSpinBox()
        self.latency_warn_spin.setRange(50, 10000)
        self.latency_warn_spin.setDecimals(0)
        self.latency_warn_spin.setValue(self.settings.latency_p95_warn_ms)
        self.endpoint_sla_warn_spin = QDoubleSpinBox()
        self.endpoint_sla_warn_spin.setRange(50, 100)
        self.endpoint_sla_warn_spin.setDecimals(1)
        self.endpoint_sla_warn_spin.setValue(self.settings.endpoint_sla_warn_percent)
        self.endpoint_p95_warn_spin = QDoubleSpinBox()
        self.endpoint_p95_warn_spin.setRange(50, 10000)
        self.endpoint_p95_warn_spin.setDecimals(0)
        self.endpoint_p95_warn_spin.setValue(self.settings.endpoint_p95_warn_ms)

        self.alert_severity_filter = QComboBox()
        self.alert_severity_filter.addItems(["TODOS", "CRIT", "WARN", "INFO"])
        self.alert_text_filter = QLineEdit()
        self.alert_text_filter.setPlaceholderText("Buscar en mensaje/origen...")

        self._build_ui()
        self._refresh_status()
        self._tail_logs_once()

        self.status_timer = QTimer(self)
        self.status_timer.setInterval(self.settings.status_refresh_ms)
        self.status_timer.timeout.connect(self._refresh_status)
        self.status_timer.start()

        self.health_timer = QTimer(self)
        self.health_timer.setInterval(self.settings.health_refresh_ms)
        self.health_timer.timeout.connect(self._refresh_health)
        self.health_timer.start()

        self.log_timer = QTimer(self)
        self.log_timer.setInterval(self.settings.log_refresh_ms)
        self.log_timer.timeout.connect(self._tail_logs_once)
        self.log_timer.start()

        self._refresh_health()
        self._load_alerts_history()

    def _build_ui(self) -> None:
        root = QWidget()
        self.setCentralWidget(root)

        main = QVBoxLayout(root)
        main.setContentsMargins(18, 18, 18, 18)
        main.setSpacing(12)

        header = QHBoxLayout()
        
        # Cargar y escalar Logotipo de GiProy
        logo_path = str(self.cfg.project_root / "assets" / "LogoSoft.png")
        self.setWindowIcon(QIcon(logo_path))
        
        logo_label = QLabel()
        pixmap = QPixmap(logo_path)
        if not pixmap.isNull():
            logo_label.setPixmap(pixmap.scaled(200, 80, Qt.KeepAspectRatio, Qt.SmoothTransformation))
        else:
            logo_label.setText("GiProy Control Center")
            logo_label.setStyleSheet("font-size: 18pt; font-weight: 700; color: #FFB347;")

        subtitle = QLabel("Operación de Backend, Frontend, Servicios y Logs Cntralizados")
        subtitle.setStyleSheet("color: #475569; font-weight: 600; margin-left: 5px;")

        hbox_title = QVBoxLayout()
        hbox_title.addWidget(logo_label)
        hbox_title.addWidget(subtitle)
        header.addLayout(hbox_title)
        header.addStretch(1)
        self.noc_mode_checkbox.stateChanged.connect(self._toggle_noc_mode)
        header.addWidget(self.noc_mode_checkbox)
        header.addWidget(QLabel("Modo admin:"))
        header.addWidget(self.admin_label)
        main.addLayout(header)

        content_tabs = QTabWidget()
        main.addWidget(content_tabs, 1)

        dashboard_tab = QWidget()
        dashboard_layout = QHBoxLayout(dashboard_tab)
        dashboard_layout.setContentsMargins(8, 8, 8, 8)
        dashboard_layout.setSpacing(10)
        dash_left = QVBoxLayout()
        dash_left.setSpacing(10)
        dash_right = QVBoxLayout()
        dash_right.setSpacing(10)
        dashboard_layout.addLayout(dash_left, 3)
        dashboard_layout.addLayout(dash_right, 4)

        operations_tab = QWidget()
        operations_layout = QVBoxLayout(operations_tab)
        operations_layout.setContentsMargins(8, 8, 8, 8)
        operations_layout.setSpacing(10)

        health_alerts_tab = QWidget()
        health_alerts_layout = QVBoxLayout(health_alerts_tab)
        health_alerts_layout.setContentsMargins(8, 8, 8, 8)
        health_alerts_layout.setSpacing(10)

        logs_tab = QWidget()
        logs_layout = QVBoxLayout(logs_tab)
        logs_layout.setContentsMargins(8, 8, 8, 8)
        logs_layout.setSpacing(10)

        quick_box = QGroupBox("Resumen ejecutivo")
        quick_grid = QGridLayout(quick_box)
        quick_grid.addWidget(QLabel("Backend"), 0, 0)
        quick_grid.addWidget(self.quick_backend_label, 0, 1)
        quick_grid.addWidget(QLabel("Frontend"), 0, 2)
        quick_grid.addWidget(self.quick_frontend_label, 0, 3)
        quick_grid.addWidget(QLabel("Disponibilidad API"), 1, 0)
        quick_grid.addWidget(self.quick_api_label, 1, 1)
        quick_grid.addWidget(QLabel("Alertas activas"), 1, 2)
        quick_grid.addWidget(self.quick_alerts_label, 1, 3)
        quick_grid.addWidget(QLabel("Endpoint critico"), 2, 0)
        quick_grid.addWidget(self.quick_endpoint_label, 2, 1, 1, 3)
        dash_left.addWidget(quick_box)

        status_box = QGroupBox("Estado del sistema")
        grid = QGridLayout(status_box)
        grid.addWidget(QLabel("Servicio backend"), 0, 0)
        grid.addWidget(self.backend_service_label, 0, 1)
        grid.addWidget(QLabel("Servicio frontend"), 1, 0)
        grid.addWidget(self.frontend_service_label, 1, 1)
        grid.addWidget(QLabel(f"Puerto backend ({self.cfg.backend_port})"), 0, 2)
        grid.addWidget(self.backend_port_label, 0, 3)
        frontend_ports_label = "/".join(str(port) for port in self.cfg.frontend_ports)
        grid.addWidget(QLabel(f"Puertos frontend ({frontend_ports_label})"), 1, 2)
        grid.addWidget(self.frontend_port_label, 1, 3)
        dash_left.addWidget(status_box)

        kpi_box = QGroupBox("KPI operativos")
        kpi_grid = QGridLayout(kpi_box)
        kpi_grid.addWidget(QLabel("Disponibilidad API (ventana)"), 0, 0)
        kpi_grid.addWidget(self.kpi_api_availability_label, 0, 1)
        kpi_grid.addWidget(QLabel("Checks API (ventana)"), 0, 2)
        kpi_grid.addWidget(self.kpi_api_checks_label, 0, 3)
        kpi_grid.addWidget(QLabel("OpenAPI ultimo estado"), 1, 0)
        kpi_grid.addWidget(self.kpi_openapi_label, 1, 1)
        kpi_grid.addWidget(QLabel("Endpoint mas inestable"), 1, 2)
        kpi_grid.addWidget(self.kpi_top_endpoint_label, 1, 3)
        kpi_grid.addWidget(QLabel("Tendencia CPU"), 2, 0)
        kpi_grid.addWidget(self.kpi_cpu_trend_label, 2, 1)
        kpi_grid.addWidget(QLabel("Tendencia RAM"), 2, 2)
        kpi_grid.addWidget(self.kpi_mem_trend_label, 2, 3)
        kpi_grid.addWidget(QLabel("Tendencia p95 API"), 3, 0)
        kpi_grid.addWidget(self.kpi_p95_trend_label, 3, 1, 1, 3)
        dash_left.addWidget(kpi_box)

        monitor_box = QGroupBox("Monitoreo en tiempo real")
        monitor_grid = QGridLayout(monitor_box)
        monitor_grid.addWidget(QLabel("CPU"), 0, 0)
        monitor_grid.addWidget(self.cpu_label, 0, 1)
        monitor_grid.addWidget(QLabel("RAM"), 0, 2)
        monitor_grid.addWidget(self.memory_label, 0, 3)
        monitor_grid.addWidget(QLabel("Disco"), 1, 0)
        monitor_grid.addWidget(self.disk_label, 1, 1)
        monitor_grid.addWidget(QLabel("Red (TX/RX)"), 1, 2)
        monitor_grid.addWidget(self.net_label, 1, 3)
        monitor_grid.addWidget(QLabel("Conexiones backend"), 2, 0)
        monitor_grid.addWidget(self.clients_count_label, 2, 1, 1, 3)
        monitor_grid.addWidget(self.clients_view, 3, 0, 1, 4)
        monitor_grid.addWidget(QLabel("Actividad auth (reciente)"), 4, 0)
        monitor_grid.addWidget(self.auth_activity_label, 4, 1, 1, 3)
        monitor_grid.addWidget(QLabel("IPs auth recientes"), 5, 0)
        monitor_grid.addWidget(self.auth_ips_label, 5, 1, 1, 3)
        monitor_grid.addWidget(QLabel("Alertas operativas"), 6, 0)
        monitor_grid.addWidget(self.alerts_label, 6, 1, 1, 3)
        self.clients_view.setMaximumHeight(96)
        dash_right.addWidget(monitor_box)

        proc_box = QGroupBox("Procesos (backend/frontend)")
        proc_grid = QGridLayout(proc_box)
        proc_grid.addWidget(QLabel("Backend"), 0, 0)
        proc_grid.addWidget(self.backend_proc_label, 0, 1)
        proc_grid.addWidget(QLabel("Frontend"), 1, 0)
        proc_grid.addWidget(self.frontend_proc_label, 1, 1)
        proc_grid.addWidget(QLabel("Log backend (ult. 800 lineas)"), 2, 0)
        proc_grid.addWidget(self.backend_log_health_label, 2, 1)
        proc_grid.addWidget(QLabel("Log frontend (ult. 800 lineas)"), 3, 0)
        proc_grid.addWidget(self.frontend_log_health_label, 3, 1)
        operations_layout.addWidget(proc_box)

        health_box = QGroupBox("Salud API")
        health_grid = QGridLayout(health_box)
        row = 0
        for name, label in self.health_labels.items():
            health_grid.addWidget(QLabel(name), row, 0)
            health_grid.addWidget(label, row, 1)
            row += 1
        health_grid.addWidget(QLabel("Latencia agregada"), row, 0)
        health_grid.addWidget(self.latency_summary_label, row, 1)
        health_grid.addWidget(QLabel("Último error API"), row + 1, 0)
        health_grid.addWidget(self.last_error_label, row + 1, 1)
        health_grid.addWidget(self.endpoint_table, row + 2, 0, 1, 2)
        health_alerts_layout.addWidget(health_box)

        checks_box = QGroupBox("Checks de plataforma")
        checks_grid = QGridLayout(checks_box)
        checks_grid.addWidget(QLabel("Node"), 0, 0)
        checks_grid.addWidget(self.check_node, 0, 1)
        checks_grid.addWidget(QLabel("NPM"), 0, 2)
        checks_grid.addWidget(self.check_npm, 0, 3)
        checks_grid.addWidget(QLabel("Backend OpenAPI"), 1, 0)
        checks_grid.addWidget(self.check_backend, 1, 1)
        checks_grid.addWidget(QLabel("MySQL / PostgreSQL"), 1, 2)
        checks_grid.addWidget(self.check_db, 1, 3)

        btn_checks = QPushButton("Ejecutar checks")
        btn_checks.clicked.connect(self._run_platform_checks)
        checks_grid.addWidget(btn_checks, 2, 3)

        btn_diag = QPushButton("Exportar diagnostico ZIP")
        btn_diag.clicked.connect(self._export_diagnostics)
        checks_grid.addWidget(btn_diag, 3, 3)
        btn_exec_report = QPushButton("Exportar reporte ejecutivo")
        btn_exec_report.clicked.connect(self._export_executive_report)
        checks_grid.addWidget(btn_exec_report, 3, 2)
        self.btn_exec_report = btn_exec_report
        operations_layout.addWidget(checks_box)

        tune_box = QGroupBox("Configuracion de monitoreo")
        tune_grid = QGridLayout(tune_box)
        tune_grid.addWidget(QLabel("Refresco estado (ms)"), 0, 0)
        tune_grid.addWidget(self.status_interval_spin, 0, 1)
        tune_grid.addWidget(QLabel("Refresco health API (ms)"), 0, 2)
        tune_grid.addWidget(self.health_interval_spin, 0, 3)
        tune_grid.addWidget(QLabel("Refresco logs (ms)"), 1, 0)
        tune_grid.addWidget(self.log_interval_spin, 1, 1)
        tune_grid.addWidget(QLabel("Umbral CPU %"), 1, 2)
        tune_grid.addWidget(self.cpu_warn_spin, 1, 3)
        tune_grid.addWidget(QLabel("Umbral RAM %"), 2, 0)
        tune_grid.addWidget(self.memory_warn_spin, 2, 1)
        tune_grid.addWidget(QLabel("Umbral disco %"), 2, 2)
        tune_grid.addWidget(self.disk_warn_spin, 2, 3)
        tune_grid.addWidget(QLabel("Umbral p95 API (ms)"), 3, 0)
        tune_grid.addWidget(self.latency_warn_spin, 3, 1)
        tune_grid.addWidget(QLabel("Umbral SLA endpoint (%)"), 4, 0)
        tune_grid.addWidget(self.endpoint_sla_warn_spin, 4, 1)
        tune_grid.addWidget(QLabel("Umbral p95 endpoint (ms)"), 4, 2)
        tune_grid.addWidget(self.endpoint_p95_warn_spin, 4, 3)
        btn_apply_tune = QPushButton("Guardar y aplicar")
        btn_apply_tune.clicked.connect(self._apply_monitor_settings)
        tune_grid.addWidget(btn_apply_tune, 3, 3)
        btn_export_metrics = QPushButton("Exportar metricas CSV")
        btn_export_metrics.clicked.connect(self._export_metrics_csv)
        tune_grid.addWidget(btn_export_metrics, 5, 3)
        self.btn_export_metrics = btn_export_metrics
        self.btn_apply_tune = btn_apply_tune
        operations_layout.addWidget(tune_box)

        alerts_box = QGroupBox("Historial de alertas")
        alerts_grid = QGridLayout(alerts_box)
        alerts_grid.addWidget(QLabel("Severidad"), 0, 0)
        alerts_grid.addWidget(self.alert_severity_filter, 0, 1)
        alerts_grid.addWidget(QLabel("Filtro texto"), 0, 2)
        alerts_grid.addWidget(self.alert_text_filter, 0, 3)
        self.alert_severity_filter.currentTextChanged.connect(lambda _: self._apply_alert_filters())
        self.alert_text_filter.textChanged.connect(lambda _: self._apply_alert_filters())
        alerts_grid.addWidget(self.alert_history_table, 1, 0, 1, 4)
        btn_reload_alerts = QPushButton("Recargar alertas")
        btn_reload_alerts.clicked.connect(self._load_alerts_history)
        alerts_grid.addWidget(btn_reload_alerts, 2, 2)
        self.btn_reload_alerts = btn_reload_alerts
        btn_export_alerts = QPushButton("Exportar alertas JSON")
        btn_export_alerts.clicked.connect(self._export_alerts_json)
        alerts_grid.addWidget(btn_export_alerts, 2, 3)
        self.btn_export_alerts = btn_export_alerts
        btn_clear_history = QPushButton("Limpiar historial monitor")
        btn_clear_history.setObjectName("danger")
        btn_clear_history.clicked.connect(self._clear_monitor_history)
        alerts_grid.addWidget(btn_clear_history, 2, 1)
        self.btn_clear_history = btn_clear_history
        health_alerts_layout.addWidget(alerts_box)

        actions = QGroupBox("Acciones")
        actions_layout = QHBoxLayout(actions)

        btn_start = QPushButton("Iniciar servicios")
        btn_start.clicked.connect(lambda: self._run_service_action("start"))
        actions_layout.addWidget(btn_start)
        self.btn_start = btn_start

        btn_stop = QPushButton("Parar servicios")
        btn_stop.clicked.connect(lambda: self._run_service_action("stop"))
        actions_layout.addWidget(btn_stop)
        self.btn_stop = btn_stop

        btn_restart = QPushButton("Reiniciar")
        btn_restart.clicked.connect(lambda: self._run_service_action("restart"))
        actions_layout.addWidget(btn_restart)
        self.btn_restart = btn_restart

        btn_delete = QPushButton("Borrar servicios")
        btn_delete.setObjectName("danger")
        btn_delete.clicked.connect(lambda: self._run_service_action("delete"))
        actions_layout.addWidget(btn_delete)
        self.btn_delete = btn_delete

        btn_reinstall = QPushButton("Reinstalar servicios")
        btn_reinstall.setObjectName("danger")
        btn_reinstall.clicked.connect(lambda: self._run_service_action("reinstall"))
        actions_layout.addWidget(btn_reinstall)
        self.btn_reinstall = btn_reinstall

        btn_install_bridge = QPushButton("Instalar Project Bridge")
        btn_install_bridge.clicked.connect(lambda: self._run_service_action("install_bridge"))
        actions_layout.addWidget(btn_install_bridge)
        self.btn_install_bridge = btn_install_bridge

        btn_uninstall_bridge = QPushButton("Quitar Project Bridge")
        btn_uninstall_bridge.setObjectName("danger")
        btn_uninstall_bridge.clicked.connect(lambda: self._run_service_action("uninstall_bridge"))
        actions_layout.addWidget(btn_uninstall_bridge)
        self.btn_uninstall_bridge = btn_uninstall_bridge

        btn_refresh = QPushButton("Actualizar estado")
        btn_refresh.clicked.connect(self._refresh_status)
        actions_layout.addWidget(btn_refresh)
        self.btn_refresh = btn_refresh

        btn_open_front = QPushButton("Abrir Frontend")
        btn_open_front.clicked.connect(self._open_frontend_in_browser)
        actions_layout.addWidget(btn_open_front)
        self.btn_open_front = btn_open_front

        actions_layout.addStretch(1)
        dash_left.addWidget(actions)

        log_tabs = QTabWidget()
        log_tabs.addTab(self._wrap_log(self.backend_log_view), "Log Backend")
        log_tabs.addTab(self._wrap_log(self.frontend_log_view), "Log Frontend")
        log_tabs.addTab(self._wrap_log(self.system_log_view), "Log Sistema")
        log_tabs.setSizePolicy(QSizePolicy.Expanding, QSizePolicy.Expanding)
        log_actions = QHBoxLayout()
        btn_clear_logs = QPushButton("Limpiar logs")
        btn_clear_logs.setObjectName("danger")
        btn_clear_logs.clicked.connect(self._clear_logs_files)
        log_actions.addWidget(btn_clear_logs)
        log_actions.addStretch(1)
        logs_layout.addLayout(log_actions)
        self.btn_clear_logs = btn_clear_logs
        logs_layout.addWidget(log_tabs, 1)

        dash_left.addStretch(1)
        dash_right.addStretch(1)
        operations_layout.addStretch(1)
        health_alerts_layout.addStretch(1)

        content_tabs.addTab(self._as_scroll_tab(dashboard_tab), "Dashboard")
        content_tabs.addTab(self._as_scroll_tab(operations_tab), "Operacion")
        content_tabs.addTab(self._as_scroll_tab(health_alerts_tab), "Salud y Alertas")
        content_tabs.addTab(self._as_scroll_tab(logs_tab), "Logs")
        content_tabs.setCurrentIndex(0)

    @staticmethod
    def _wrap_log(view: QPlainTextEdit) -> QWidget:
        box = QWidget()
        l = QVBoxLayout(box)
        l.setContentsMargins(0, 0, 0, 0)
        view.setSizePolicy(QSizePolicy.Expanding, QSizePolicy.Expanding)
        l.addWidget(view, 1)
        return box

    @staticmethod
    def _as_scroll_tab(widget: QWidget) -> QWidget:
        area = QScrollArea()
        area.setWidgetResizable(True)
        area.setFrameShape(QScrollArea.NoFrame)
        area.setWidget(widget)
        return area

    def _run_service_action(self, action: str) -> None:
        action_to_args = {
            "start": ["--elevated-action", "start_services"],
            "stop": ["--elevated-action", "stop_services"],
            "restart": ["--elevated-action", "restart_services"],
            "delete": ["--elevated-action", "delete_services"],
            "reinstall": ["--elevated-action", "reinstall_services"],
            "install_bridge": ["--elevated-action", "install_project_bridge"],
            "uninstall_bridge": ["--elevated-action", "uninstall_project_bridge"],
        }
        if not is_admin():
            should = QMessageBox.question(
                self,
                "Permisos requeridos",
                "Esta accion requiere administrador.\nDeseas relanzar la app con elevacion UAC?",
                QMessageBox.Yes | QMessageBox.No,
            )
            if should == QMessageBox.Yes:
                ok = elevate_self(action_to_args[action])
                if ok:
                    self._append_system_log(f"[uac] accion elevada enviada: {action}")
                    self._schedule_status_refresh(tries=8, interval_ms=1500)
                else:
                    QMessageBox.critical(self, "Error", "No se pudo solicitar elevacion UAC.")
            return

        if action == "start":
            result = start_services(self.cfg)
        elif action == "stop":
            result = stop_services(self.cfg)
        elif action == "restart":
            result = restart_services(self.cfg)
        elif action == "delete":
            result = delete_services(self.cfg)
        elif action == "install_bridge":
            result = install_project_bridge(self.cfg)
        elif action == "uninstall_bridge":
            result = uninstall_project_bridge(self.cfg)
        else:
            result = reinstall_services(self.cfg)

        self._handle_result(result, action)
        self._refresh_status()

    def _schedule_status_refresh(self, tries: int = 6, interval_ms: int = 1200) -> None:
        if tries <= 0:
            return
        self._refresh_status()
        QTimer.singleShot(interval_ms, lambda: self._schedule_status_refresh(tries - 1, interval_ms))

    def _handle_result(self, result: CommandResult, action: str) -> None:
        self._append_system_log(f"[{action}] code={result.code}")
        if result.out:
            self._append_system_log(result.out)
        if result.err:
            self._append_system_log(result.err)

        if result.ok:
            pass
        else:
            QMessageBox.warning(
                self,
                "Operacion con error",
                f"Accion '{action}' finalizo con error (code {result.code}).\nRevisa el log de sistema.",
            )

    def _open_frontend_in_browser(self) -> None:
        status = get_runtime_status(self.cfg)
        port = self.cfg.frontend_ports[0]
        if status.frontend_port_pids:
            port = sorted(status.frontend_port_pids.keys())[0]
        url = f"http://127.0.0.1:{port}"
        webbrowser.open(url, new=2)
        self._append_system_log(f"[frontend] navegador abierto en {url}")

    def _refresh_status(self) -> None:
        s = get_runtime_status(self.cfg)
        self._runtime_backend_state = s.backend_service
        self._runtime_frontend_state = s.frontend_service

        self._set_state_label(self.admin_label, "SI" if is_admin() else "NO", is_admin())
        self._set_state_label(self.backend_service_label, s.backend_service, s.backend_service == "RUNNING")
        self._set_state_label(self.frontend_service_label, s.frontend_service, s.frontend_service == "RUNNING")

        if s.backend_port_pid:
            self._set_state_label(self.backend_port_label, f"ACTIVO (PID {s.backend_port_pid})", True)
        else:
            self._set_state_label(self.backend_port_label, "NO ACTIVO", False)

        if s.frontend_port_pids:
            text = " | ".join([f"{p} (PID {pid})" for p, pid in s.frontend_port_pids.items()])
            self._set_state_label(self.frontend_port_label, text, True)
        else:
            self._set_state_label(self.frontend_port_label, "NO ACTIVO", False)

        m = get_system_metrics(self.cfg)
        self._cpu_history.append(m.cpu_percent)
        self._mem_history.append(m.memory_percent)
        self._set_state_label(self.cpu_label, f"{m.cpu_percent:.1f}%", m.cpu_percent < self.settings.cpu_warn_percent)
        self._set_state_label(
            self.memory_label,
            f"{m.memory_percent:.1f}%",
            m.memory_percent < self.settings.memory_warn_percent,
        )
        self._set_state_label(self.disk_label, f"{m.disk_percent:.1f}%", m.disk_percent < self.settings.disk_warn_percent)
        self._set_state_label(
            self.net_label,
            f"TX {m.net_sent_mb:.1f} MB | RX {m.net_recv_mb:.1f} MB",
            True,
        )

        clients = m.backend_connected_clients
        self._set_state_label(self.clients_count_label, f"{len(clients)} conexion(es) activas", True)
        if clients:
            self.clients_view.setPlainText("\n".join(clients))
        else:
            self.clients_view.setPlainText("Sin conexiones activas al backend en este momento.")

        bp = get_process_metrics(s.backend_port_pid)
        if bp:
            self._set_state_label(
                self.backend_proc_label,
                f"PID {bp.pid} | CPU {bp.cpu_percent:.1f}% | RAM {bp.rss_mb:.1f} MB | Hilos {bp.threads} | Uptime {self._fmt_secs(bp.uptime_seconds)}",
                True,
            )
        else:
            self._set_state_label(self.backend_proc_label, "No activo", False)

        front_pid = next(iter(s.frontend_port_pids.values()), None)
        fp = get_process_metrics(front_pid)
        if fp:
            self._set_state_label(
                self.frontend_proc_label,
                f"PID {fp.pid} | CPU {fp.cpu_percent:.1f}% | RAM {fp.rss_mb:.1f} MB | Hilos {fp.threads} | Uptime {self._fmt_secs(fp.uptime_seconds)}",
                True,
            )
        else:
            self._set_state_label(self.frontend_proc_label, "No activo", False)

        b_log = get_log_health(self.cfg.backend_log)
        f_log = get_log_health(self.cfg.frontend_log)
        self._set_state_label(
            self.backend_log_health_label,
            f"ERROR={b_log.errors} WARN={b_log.warnings} ({b_log.total_lines} lineas)",
            b_log.errors == 0,
        )
        self._set_state_label(
            self.frontend_log_health_label,
            f"ERROR={f_log.errors} WARN={f_log.warnings} ({f_log.total_lines} lineas)",
            f_log.errors == 0,
        )

        auth = parse_auth_activity(self.cfg.backend_log)
        self._set_state_label(
            self.auth_activity_label,
            f"login OK={auth.login_ok} | login FAIL={auth.login_fail}",
            auth.login_fail == 0,
        )
        auth_events_text = "Sin actividad auth reciente"
        if auth.recent_events:
            chunks: list[str] = []
            for ev in auth.recent_events[-5:]:
                ts = (ev.get("ts") or "").strip()
                ip = (ev.get("ip") or "").strip()
                status = (ev.get("status") or "").strip()
                prefix = f"{ts} | " if ts else ""
                chunks.append(f"{prefix}{ip} ({status})")
            auth_events_text = " ; ".join(chunks)
        self._set_state_label(
            self.auth_ips_label,
            auth_events_text,
            True,
        )

        alerts: list[AlertEvent] = []
        now_ts = datetime.now().isoformat(timespec="seconds")
        if m.cpu_percent >= self.settings.cpu_warn_percent:
            sev = "CRIT" if m.cpu_percent >= min(100.0, self.settings.cpu_warn_percent + 8.0) else "WARN"
            alerts.append(AlertEvent(ts=now_ts, severity=sev, source="system", message=f"CPU alta ({m.cpu_percent:.1f}%)"))
        if m.memory_percent >= self.settings.memory_warn_percent:
            sev = "CRIT" if m.memory_percent >= min(100.0, self.settings.memory_warn_percent + 5.0) else "WARN"
            alerts.append(AlertEvent(ts=now_ts, severity=sev, source="system", message=f"RAM alta ({m.memory_percent:.1f}%)"))
        if m.disk_percent >= self.settings.disk_warn_percent:
            sev = "CRIT" if m.disk_percent >= min(100.0, self.settings.disk_warn_percent + 5.0) else "WARN"
            alerts.append(AlertEvent(ts=now_ts, severity=sev, source="system", message=f"Disco alto ({m.disk_percent:.1f}%)"))
        if b_log.errors > 0:
            alerts.append(AlertEvent(ts=now_ts, severity="WARN", source="backend-log", message=f"Errores backend={b_log.errors}"))
        if f_log.errors > 0:
            alerts.append(AlertEvent(ts=now_ts, severity="WARN", source="frontend-log", message=f"Errores frontend={f_log.errors}"))
        if auth.login_fail > 0:
            alerts.append(AlertEvent(ts=now_ts, severity="WARN", source="auth", message=f"Intentos login fallidos={auth.login_fail}"))
        for name in self.health_labels.keys():
            lat_hist = list(self._latency_history.get(name, []))
            success_hist = list(self._endpoint_success_history.get(name, []))
            if success_hist:
                sla = (sum(success_hist) / len(success_hist) * 100.0)
                if sla < self.settings.endpoint_sla_warn_percent:
                    alerts.append(
                        AlertEvent(
                            ts=now_ts,
                            severity="WARN",
                            source=f"endpoint:{name}",
                            message=f"SLA bajo {sla:.1f}% (<{self.settings.endpoint_sla_warn_percent:.1f}%)",
                        )
                    )
            if lat_hist:
                p95_ep = percentile(lat_hist, 0.95)
                if p95_ep > self.settings.endpoint_p95_warn_ms:
                    alerts.append(
                        AlertEvent(
                            ts=now_ts,
                            severity="WARN",
                            source=f"endpoint:{name}",
                            message=f"p95 alto {p95_ep:.0f}ms (>{self.settings.endpoint_p95_warn_ms:.0f}ms)",
                        )
                    )

        alert_messages = [f"[{a.severity}] {a.message}" for a in alerts]
        self._set_state_label(self.alerts_label, " | ".join(alert_messages) if alert_messages else "Sin alertas", len(alerts) == 0)
        self._active_alerts_count = len(alerts)
        self._record_alerts_if_changed(alerts)

        append_metrics_snapshot(
            self.cfg,
            {
                "ts": now_ts,
                "cpu_percent": round(m.cpu_percent, 2),
                "memory_percent": round(m.memory_percent, 2),
                "disk_percent": round(m.disk_percent, 2),
                "net_tx_mb": round(m.net_sent_mb, 2),
                "net_rx_mb": round(m.net_recv_mb, 2),
                "backend_clients": len(clients),
            },
        )

        self._set_state_label(
            self.kpi_cpu_trend_label,
            self._ascii_trend(self._cpu_history, suffix="%"),
            m.cpu_percent < self.settings.cpu_warn_percent,
        )
        self._set_state_label(
            self.kpi_mem_trend_label,
            self._ascii_trend(self._mem_history, suffix="%"),
            m.memory_percent < self.settings.memory_warn_percent,
        )
        self._refresh_executive_summary()

    def _refresh_health(self) -> None:
        checks = api_health_checks(self.cfg)
        if checks:
            overall_ok = all(c.ok for c in checks)
            self._health_outcomes.append(overall_ok)
        by_name = {c.name: c for c in checks}
        last_error_text = ""
        for name, label in self.health_labels.items():
            item = by_name.get(name)
            if not item:
                self._set_state_label(label, "Sin datos", False)
                continue
            if item.ok:
                self._endpoint_success_history[name].append(1)
                if item.latency_ms is not None:
                    self._latency_history[name].append(item.latency_ms)
                self._set_state_label(label, f"OK ({item.status_code}) {item.latency_ms:.0f} ms", True)
            else:
                self._endpoint_success_history[name].append(0)
                detail = item.detail or f"status={item.status_code}"
                self._set_state_label(label, f"FAIL {detail}", False)
                last_error_text = f"{name}: {detail}"
                if item.status_code:
                    if 400 <= item.status_code < 500:
                        self._endpoint_fail_4xx[name] += 1
                    if 500 <= item.status_code < 600:
                        self._endpoint_fail_5xx[name] += 1
                self._endpoint_last_error[name] = detail

        self._render_endpoint_table(checks)
        self._set_state_label(self.last_error_label, last_error_text or "Sin errores recientes", last_error_text == "")

        merged = [v for arr in self._latency_history.values() for v in arr]
        if merged:
            p50 = percentile(merged, 0.50)
            p95 = percentile(merged, 0.95)
            self._p95_history.append(p95)
            self._set_state_label(
                self.latency_summary_label,
                f"p50={p50:.0f} ms | p95={p95:.0f} ms",
                p95 < self.settings.latency_p95_warn_ms,
            )
            self._set_state_label(
                self.kpi_p95_trend_label,
                self._ascii_trend(self._p95_history, suffix="ms"),
                p95 < self.settings.latency_p95_warn_ms,
            )
        else:
            self._set_state_label(self.latency_summary_label, "Sin muestras", False)
            self._set_state_label(self.kpi_p95_trend_label, "Sin muestras", False)

        if self._health_outcomes:
            ok_count = sum(1 for x in self._health_outcomes if x)
            total = len(self._health_outcomes)
            availability = (ok_count / total) * 100.0
            self._api_availability = availability
            self._set_state_label(
                self.kpi_api_availability_label,
                f"{availability:.1f}%",
                availability >= 99.0,
            )
            self._set_state_label(self.kpi_api_checks_label, f"{total}", total >= 1)
        else:
            self._set_state_label(self.kpi_api_availability_label, "Sin datos", False)
            self._set_state_label(self.kpi_api_checks_label, "0", False)

        openapi = by_name.get("openapi")
        if openapi:
            if openapi.ok:
                self._set_state_label(
                    self.kpi_openapi_label,
                    f"OK ({openapi.status_code}) {openapi.latency_ms:.0f} ms",
                    True,
                )
            else:
                self._set_state_label(
                    self.kpi_openapi_label,
                    f"FAIL ({openapi.status_code})",
                    False,
                )
        else:
            self._set_state_label(self.kpi_openapi_label, "Sin datos", False)

        top_name = "-"
        top_score = -1
        top_sla = 100.0
        top_p95 = 0.0
        for name in self.health_labels.keys():
            score = (self._endpoint_fail_5xx.get(name, 0) * 2) + self._endpoint_fail_4xx.get(name, 0)
            lat_hist = list(self._latency_history.get(name, []))
            success_hist = list(self._endpoint_success_history.get(name, []))
            sla = (sum(success_hist) / len(success_hist) * 100.0) if success_hist else 100.0
            p95_ep = percentile(lat_hist, 0.95) if lat_hist else 0.0
            if sla < self.settings.endpoint_sla_warn_percent:
                score += 2
            if p95_ep > self.settings.endpoint_p95_warn_ms:
                score += 2
            if score > top_score:
                top_name = name
                top_score = score
                top_sla = sla
                top_p95 = p95_ep
        if top_score > 0:
            is_ok = top_sla >= self.settings.endpoint_sla_warn_percent and top_p95 <= self.settings.endpoint_p95_warn_ms
            self._top_endpoint_summary = f"{top_name} (score={top_score}, SLA={top_sla:.1f}%, p95={top_p95:.0f}ms)"
            self._set_state_label(
                self.kpi_top_endpoint_label,
                self._top_endpoint_summary,
                is_ok,
            )
        else:
            self._top_endpoint_summary = "Sin incidencias"
            self._set_state_label(self.kpi_top_endpoint_label, "Sin incidencias", True)
        self._refresh_executive_summary()

    def _render_endpoint_table(self, checks: list) -> None:
        ordered = sorted(
            checks,
            key=lambda c: (
                self._endpoint_fail_5xx.get(c.name, 0),
                self._endpoint_fail_4xx.get(c.name, 0),
                0 if c.ok else 1,
            ),
            reverse=True,
        )
        self.endpoint_table.setRowCount(len(ordered))
        for idx, item in enumerate(ordered):
            lat_hist = list(self._latency_history.get(item.name, []))
            success_hist = list(self._endpoint_success_history.get(item.name, []))
            p50 = percentile(lat_hist, 0.50) if lat_hist else 0.0
            p95 = percentile(lat_hist, 0.95) if lat_hist else 0.0
            sla = (sum(success_hist) / len(success_hist) * 100.0) if success_hist else 0.0
            status_text = "OK" if item.ok else "FAIL"
            if success_hist and sla < self.settings.endpoint_sla_warn_percent:
                status_text = "WARN/SLA"
            if lat_hist and p95 > self.settings.endpoint_p95_warn_ms:
                status_text = "WARN/p95"
            lat_text = f"{item.latency_ms:.0f}" if item.latency_ms is not None else "-"
            row_vals = [
                item.name,
                status_text,
                lat_text,
                f"{p50:.0f}" if lat_hist else "-",
                f"{p95:.0f}" if lat_hist else "-",
                f"{sla:.1f}" if success_hist else "-",
                str(self._endpoint_fail_4xx.get(item.name, 0)),
                str(self._endpoint_fail_5xx.get(item.name, 0)),
            ]
            for col, val in enumerate(row_vals):
                self.endpoint_table.setItem(idx, col, QTableWidgetItem(val))

    def _run_platform_checks(self) -> None:
        res = run_platform_checks(self.cfg)
        self._set_state_label(self.check_node, "OK" if res.node_ok else "FAIL", res.node_ok)
        self._set_state_label(self.check_npm, "OK" if res.npm_ok else "FAIL", res.npm_ok)
        self._set_state_label(self.check_backend, "OK" if res.backend_ok else "FAIL", res.backend_ok)
        self._set_state_label(self.check_db, "OK" if res.db_ok else "FAIL", res.db_ok)
        self._set_state_label(self.check_ia, "OK" if res.ia_ok else "FAIL", res.ia_ok)
        diag = get_local_ai_diagnostics(self.cfg)
        self._set_state_label(self.check_ia_engine, diag.active_engine, diag.active_engine != "desconocido")
        self._set_state_label(
            self.check_ia_runtime,
            f"modo={diag.runtime_mode} | efectivo={diag.runtime_effective}",
            diag.runtime_effective != "desconocido",
        )
        gpu_text = diag.gpu_name
        if diag.gpu_utilization_percent is not None:
            gpu_text += f" | uso={diag.gpu_utilization_percent:.0f}%"
        if diag.gpu_memory_used_mb is not None and diag.gpu_memory_total_mb is not None:
            gpu_text += f" | VRAM {diag.gpu_memory_used_mb:.0f}/{diag.gpu_memory_total_mb:.0f} MB"
        self._set_state_label(self.check_ia_gpu, gpu_text, diag.gpu_name != "No detectada")
        eff_ok = diag.efficiency in {"MAXIMA", "NO_APLICA", "MEDIA"}
        self._set_state_label(
            self.check_ia_efficiency,
            f"{diag.efficiency} | {diag.detail}",
            eff_ok,
        )

    def _export_diagnostics(self) -> None:
        try:
            zip_path = export_diagnostics_zip(self.cfg)
            self._append_system_log(f"[diagnostics] exportado: {zip_path}")
        except Exception as exc:
            QMessageBox.warning(self, "Error", f"No se pudo exportar diagnostico:\n{exc}")
            self._append_system_log(f"[diagnostics] error: {exc}")

    def _export_executive_report(self) -> None:
        try:
            json_path, html_path = export_executive_report(self.cfg)
            self._append_system_log(f"[report] executive json={json_path}")
            self._append_system_log(f"[report] executive html={html_path}")
        except Exception as exc:
            QMessageBox.warning(self, "Error", f"No se pudo exportar reporte ejecutivo:\n{exc}")
            self._append_system_log(f"[report] error: {exc}")

    def _apply_monitor_settings(self) -> None:
        self.settings.status_refresh_ms = int(self.status_interval_spin.value())
        self.settings.health_refresh_ms = int(self.health_interval_spin.value())
        self.settings.log_refresh_ms = int(self.log_interval_spin.value())
        self.settings.cpu_warn_percent = float(self.cpu_warn_spin.value())
        self.settings.memory_warn_percent = float(self.memory_warn_spin.value())
        self.settings.disk_warn_percent = float(self.disk_warn_spin.value())
        self.settings.latency_p95_warn_ms = float(self.latency_warn_spin.value())
        self.settings.endpoint_sla_warn_percent = float(self.endpoint_sla_warn_spin.value())
        self.settings.endpoint_p95_warn_ms = float(self.endpoint_p95_warn_spin.value())

        self.status_timer.setInterval(self.settings.status_refresh_ms)
        self.health_timer.setInterval(self.settings.health_refresh_ms)
        self.log_timer.setInterval(self.settings.log_refresh_ms)

        save_launcher_settings(self.cfg, self.settings)
        self._append_system_log("[settings] ajustes de monitoreo aplicados")
        self._refresh_status()
        self._refresh_health()

    def _record_alerts_if_changed(self, alerts: list[AlertEvent]) -> None:
        if not alerts:
            return
        fingerprint = "|".join([f"{a.severity}:{a.source}:{a.message}" for a in alerts])
        if fingerprint == self._last_alert_fingerprint:
            return
        self._last_alert_fingerprint = fingerprint
        append_alert_events(self.cfg, alerts)
        self._load_alerts_history()

    def _load_alerts_history(self) -> None:
        self._alerts_cache = list(reversed(load_recent_alerts(self.cfg, limit=300)))
        self._apply_alert_filters()

    def _apply_alert_filters(self) -> None:
        sev = self.alert_severity_filter.currentText().strip().upper()
        txt = self.alert_text_filter.text().strip().lower()

        filtered: list[AlertEvent] = []
        for row in self._alerts_cache:
            if sev != "TODOS" and row.severity.upper() != sev:
                continue
            blob = f"{row.source} {row.message}".lower()
            if txt and txt not in blob:
                continue
            filtered.append(row)

        self.alert_history_table.setRowCount(len(filtered))
        for i, row in enumerate(filtered):
            self.alert_history_table.setItem(i, 0, QTableWidgetItem(row.ts))
            self.alert_history_table.setItem(i, 1, QTableWidgetItem(row.severity))
            self.alert_history_table.setItem(i, 2, QTableWidgetItem(row.source))
            self.alert_history_table.setItem(i, 3, QTableWidgetItem(row.message))

    def _export_metrics_csv(self) -> None:
        try:
            path = export_metrics_csv(self.cfg)
            self._append_system_log(f"[metrics] csv exportado: {path}")
        except Exception as exc:
            QMessageBox.warning(self, "Error", f"No se pudo exportar CSV:\n{exc}")
            self._append_system_log(f"[metrics] error export csv: {exc}")

    def _export_alerts_json(self) -> None:
        try:
            path = export_alerts_json(self.cfg, limit=1000)
            self._append_system_log(f"[alerts] json exportado: {path}")
        except Exception as exc:
            QMessageBox.warning(self, "Error", f"No se pudo exportar JSON de alertas:\n{exc}")
            self._append_system_log(f"[alerts] error export json: {exc}")

    def _clear_monitor_history(self) -> None:
        should = QMessageBox.question(
            self,
            "Confirmar limpieza",
            "Se eliminaran snapshots y alertas historicas del monitor.\nDeseas continuar?",
            QMessageBox.Yes | QMessageBox.No,
        )
        if should != QMessageBox.Yes:
            return
        try:
            clear_monitor_history(self.cfg)
            self._alerts_cache = []
            self.alert_history_table.setRowCount(0)
            self._health_outcomes.clear()
            self._last_alert_fingerprint = ""
            self._append_system_log("[monitor] historial limpiado")
            self._refresh_health()
        except Exception as exc:
            QMessageBox.warning(self, "Error", f"No se pudo limpiar historial:\n{exc}")
            self._append_system_log(f"[monitor] error limpiar historial: {exc}")

    def _clear_logs_files(self) -> None:
        should = QMessageBox.question(
            self,
            "Confirmar limpieza",
            "Se vaciaran los logs de backend/frontend/sistema.\nDeseas continuar?",
            QMessageBox.Yes | QMessageBox.No,
        )
        if should != QMessageBox.Yes:
            return
        try:
            clear_runtime_logs(self.cfg)
            self.backend_log_view.clear()
            self.frontend_log_view.clear()
            self.system_log_view.clear()
            self._log_offsets = {
                self.cfg.backend_log: 0,
                self.cfg.frontend_log: 0,
                self.cfg.system_log: 0,
            }
            self._append_system_log("[logs] archivos limpiados")
        except Exception as exc:
            QMessageBox.warning(self, "Error", f"No se pudieron limpiar logs:\n{exc}")
            self._append_system_log(f"[logs] error limpiar logs: {exc}")

    def _toggle_noc_mode(self) -> None:
        noc = self.noc_mode_checkbox.isChecked()
        self.btn_start.setEnabled(not noc)
        self.btn_stop.setEnabled(not noc)
        self.btn_delete.setEnabled(not noc)
        self.btn_reinstall.setEnabled(not noc)
        self.btn_refresh.setEnabled(not noc)
        self.btn_open_front.setEnabled(True)
        self.btn_apply_tune.setEnabled(not noc)
        self.btn_export_metrics.setEnabled(not noc)
        self.btn_export_alerts.setEnabled(not noc)
        self.btn_clear_history.setEnabled(not noc)
        self.btn_clear_logs.setEnabled(not noc)
        self.btn_exec_report.setEnabled(not noc)
        self.btn_reload_alerts.setEnabled(True)

    def _tail_logs_once(self) -> None:
        self._append_new_file_content(self.cfg.backend_log, self.backend_log_view)
        self._append_new_file_content(self.cfg.frontend_log, self.frontend_log_view)
        self._append_new_file_content(self.cfg.system_log, self.system_log_view)

    def _append_new_file_content(self, path: Path, view: QPlainTextEdit) -> None:
        if not path.exists():
            return

        size = path.stat().st_size
        offset = self._log_offsets.get(path, 0)
        if size < offset:
            offset = 0

        if size == offset:
            return

        with path.open("r", encoding="utf-8", errors="replace") as f:
            f.seek(offset)
            data = f.read()
            self._log_offsets[path] = f.tell()

        if data:
            view.moveCursor(QTextCursor.End)
            view.insertPlainText(data)
            view.moveCursor(QTextCursor.End)

    def _append_system_log(self, text: str) -> None:
        self.cfg.log_dir.mkdir(parents=True, exist_ok=True)
        stamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        with self.cfg.system_log.open("a", encoding="utf-8", errors="replace") as f:
            for line in text.splitlines() or [text]:
                f.write(f"[{stamp}] {line}\n")

    def _refresh_executive_summary(self) -> None:
        back_ok = self._runtime_backend_state == "RUNNING"
        front_ok = self._runtime_frontend_state == "RUNNING"
        self._set_state_label(self.quick_backend_label, self._runtime_backend_state, back_ok)
        self._set_state_label(self.quick_frontend_label, self._runtime_frontend_state, front_ok)
        self._set_state_level(
            self.quick_api_label,
            f"{self._api_availability:.1f}%",
            "ok" if self._api_availability >= 99.0 else ("warn" if self._api_availability >= 95.0 else "bad"),
        )
        self._set_state_level(
            self.quick_alerts_label,
            str(self._active_alerts_count),
            "ok" if self._active_alerts_count == 0 else ("warn" if self._active_alerts_count < 4 else "bad"),
        )
        endpoint_ok = "sin incidencias" in self._top_endpoint_summary.lower()
        self._set_state_label(self.quick_endpoint_label, self._top_endpoint_summary, endpoint_ok)

    @staticmethod
    def _fmt_secs(seconds: float) -> str:
        s = int(seconds)
        h = s // 3600
        m = (s % 3600) // 60
        sec = s % 60
        return f"{h:02d}:{m:02d}:{sec:02d}"

    @staticmethod
    def _ascii_trend(values: deque[float], suffix: str = "") -> str:
        if not values:
            return "Sin datos"
        arr = list(values)[-20:]
        mn = min(arr)
        mx = max(arr)
        if mx - mn < 1e-6:
            bars = "-" * len(arr)
            return f"{bars} ({arr[-1]:.1f}{suffix})"
        palette = "._-:=+*#%@"
        chunks: list[str] = []
        for v in arr:
            idx = int((v - mn) / (mx - mn) * (len(palette) - 1))
            chunks.append(palette[idx])
        return f"{''.join(chunks)} ({arr[-1]:.1f}{suffix})"

    @staticmethod
    def _set_state_label(label: QLabel, text: str, is_ok: bool) -> None:
        label.setText(text)
        label.setObjectName("ok" if is_ok else "bad")
        label.style().unpolish(label)
        label.style().polish(label)

    @staticmethod
    def _set_state_level(label: QLabel, text: str, level: str) -> None:
        label.setText(text)
        name = level if level in {"ok", "warn", "bad"} else "bad"
        label.setObjectName(name)
        label.style().unpolish(label)
        label.style().polish(label)

    def closeEvent(self, event: QCloseEvent) -> None:
        should_close = QMessageBox.question(
            self,
            "Confirmar cierre",
            "¿Seguro que deseas cerrar GiProy Control Center?",
            QMessageBox.Yes | QMessageBox.No,
            QMessageBox.No,
        )
        if should_close != QMessageBox.Yes:
            event.ignore()
            return
        event.accept()
