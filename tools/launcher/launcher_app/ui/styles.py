APP_QSS = """
QMainWindow { background: #F8FAFC; }
QWidget { color: #0F172A; font-family: 'Segoe UI'; font-size: 10pt; }
QGroupBox {
  border: 1px solid #E2E8F0;
  border-radius: 10px;
  margin-top: 10px;
  padding: 12px;
  background: #FFFFFF;
}
QGroupBox::title { subcontrol-origin: margin; left: 10px; padding: 0 4px; color: #F39200; font-weight: bold; }
QPushButton {
  background: #F39200;
  color: white;
  border-radius: 8px;
  padding: 8px 12px;
  border: none;
  font-weight: 600;
}
QPushButton:hover { background: #FFB347; }
QPushButton:pressed { background: #D17D00; }
QPushButton#danger { background: #b91c1c; }
QPushButton#danger:hover { background: #dc2626; }
QLabel#ok { color: #16a34a; font-weight: 700; }
QLabel#warn { color: #eab308; font-weight: 700; }
QLabel#bad { color: #dc2626; font-weight: 700; }
QTabWidget::pane { border: 1px solid #E2E8F0; border-radius: 8px; background: #FFFFFF; }
QTabBar::tab { background: #F1F5F9; color: #475569; padding: 8px 14px; border-top-left-radius: 8px; border-top-right-radius: 8px; min-width: 110px; border: 1px solid #E2E8F0; border-bottom: none; margin-right: 2px;}
QTabBar::tab:selected { background: #FFFFFF; color: #0F172A; font-weight: bold; }
QScrollArea { background: transparent; border: none; }
QScrollArea > QWidget > QWidget { background: transparent; }
QPlainTextEdit {
  background: #FFFFFF;
  color: #334155;
  selection-background-color: #E2E8F0;
  selection-color: #0F172A;
  border: 1px solid #CBD5E1;
  border-radius: 8px;
  font-family: Consolas;
  font-size: 9pt;
}
QTableWidget {
  background: #FFFFFF;
  color: #334155;
  border: 1px solid #E2E8F0;
  border-radius: 8px;
  gridline-color: #E2E8F0;
}
QHeaderView::section {
  background: #F8FAFC;
  color: #475569;
  padding: 6px;
  border: 0;
  border-bottom: 2px solid #E2E8F0;
  font-weight: bold;
}
QSpinBox, QDoubleSpinBox, QCheckBox {
  background: #FFFFFF;
  border: 1px solid #CBD5E1;
  border-radius: 6px;
  padding: 4px 6px;
}

QDialog, QMessageBox {
  background: #FFFFFF;
}
QMessageBox QLabel {
  color: #0F172A;
}

QMenu {
  background-color: #FFFFFF;
  color: #0F172A;
  border: 1px solid #CBD5E1;
}
QMenu::item {
  padding: 4px 24px 4px 24px;
}
QMenu::item:selected {
  background-color: #F1F5F9;
  color: #F39200;
}
"""
