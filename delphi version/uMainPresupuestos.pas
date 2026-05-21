unit uMainPresupuestos;

interface

uses
  System.Classes,
  System.SysUtils,
  System.UITypes,
  FMX.Forms,
  uMain;

procedure moverOpcionesPresupuestos(AForm: TfrmMain; item: Integer);
procedure moverTabPresupuesto(AForm: TfrmMain; item: Integer);

procedure cbb_NdecimalesPresupuestosChange(AForm: TfrmMain; Sender: TObject);
procedure edt_NPresupuestoPrecioReferenciaChangeTracking(AForm: TfrmMain; Sender: TObject);
procedure edt_descripcionPresupuestoChange(AForm: TfrmMain; Sender: TObject);
procedure edt_PlazoEjecucionPresupuestoChangeTracking(AForm: TfrmMain; Sender: TObject);
procedure edt_porcentajeIVANuevoPresupuestoExit(AForm: TfrmMain; Sender: TObject);
procedure edt_PresupuestoSerie1ChangeTracking(AForm: TfrmMain; Sender: TObject);
procedure edt_PresupuestoSerie2Exit(AForm: TfrmMain; Sender: TObject);
procedure edt_PresupuestoSerie3Exit(AForm: TfrmMain; Sender: TObject);

procedure lyt_cronoPresupuestoResize(AForm: TfrmMain; Sender: TObject);
procedure lyt_PresupuestoAPUSResize(AForm: TfrmMain; Sender: TObject);
procedure lyt_PresupuestosOpciones1Resize(AForm: TfrmMain; Sender: TObject);
procedure dedt_PresentacionPresupuestoClosePicker(AForm: TfrmMain; Sender: TObject);

procedure rect_OPC2_CrearPresupuestoClick(AForm: TfrmMain; Sender: TObject);
procedure rect_OPC2_CrearPresupuestoMouseEnter(AForm: TfrmMain; Sender: TObject);
procedure rect_OPC2_CrearPresupuestoMouseLeave(AForm: TfrmMain; Sender: TObject);
procedure rect_OPC2_HistoricoPresupuestosMouseEnter(AForm: TfrmMain; Sender: TObject);
procedure rect_OPC2_HistoricoPresupuestosMouseLeave(AForm: TfrmMain; Sender: TObject);
procedure rect_NPresupuestoIMG1Click(AForm: TfrmMain; Sender: TObject);

procedure limpiaGlowOPCPresupuestos(AForm: TfrmMain);

procedure rct_1PresupuestoMouseEnter(AForm: TfrmMain; Sender: TObject);
procedure rct_1PresupuestoMouseLeave(AForm: TfrmMain; Sender: TObject);

procedure rct_2PresupuestoClick(AForm: TfrmMain; Sender: TObject);
procedure rct_2PresupuestoMouseEnter(AForm: TfrmMain; Sender: TObject);
procedure rct_2PresupuestoMouseLeave(AForm: TfrmMain; Sender: TObject);

procedure rct_3PresupuestoClick(AForm: TfrmMain; Sender: TObject);
procedure rct_3PresupuestoMouseEnter(AForm: TfrmMain; Sender: TObject);
procedure rct_3PresupuestoMouseLeave(AForm: TfrmMain; Sender: TObject);

procedure rct_4PresupuestoClick(AForm: TfrmMain; Sender: TObject);
procedure rct_4PresupuestoMouseEnter(AForm: TfrmMain; Sender: TObject);
procedure rct_4PresupuestoMouseLeave(AForm: TfrmMain; Sender: TObject);

procedure rct_5PresupuestoClick(AForm: TfrmMain; Sender: TObject);
procedure rct_5PresupuestoMouseEnter(AForm: TfrmMain; Sender: TObject);
procedure rct_5PresupuestoMouseLeave(AForm: TfrmMain; Sender: TObject);

procedure rct_6PresupuestoClick(AForm: TfrmMain; Sender: TObject);
procedure rct_6PresupuestoMouseEnter(AForm: TfrmMain; Sender: TObject);
procedure rct_6PresupuestoMouseLeave(AForm: TfrmMain; Sender: TObject);

procedure rct_7PresupuestoClick(AForm: TfrmMain; Sender: TObject);
procedure rct_7PresupuestoMouseEnter(AForm: TfrmMain; Sender: TObject);
procedure rct_7PresupuestoMouseLeave(AForm: TfrmMain; Sender: TObject);

procedure rct_8PresupuestoClick(AForm: TfrmMain; Sender: TObject);
procedure rct_8PresupuestoMouseEnter(AForm: TfrmMain; Sender: TObject);
procedure rct_8PresupuestoMouseLeave(AForm: TfrmMain; Sender: TObject);

procedure rect_Presupuestos_abrirBaseClick(AForm: TfrmMain; Sender: TObject);
procedure rect_Presupuestos_AbrirTanteoClick(AForm: TfrmMain; Sender: TObject);
procedure rect_Presupuestos_LimpiarTanteoClick(AForm: TfrmMain; Sender: TObject);
procedure rect_Presupuestos_VisorEDTClick(AForm: TfrmMain; Sender: TObject);

implementation

procedure moverOpcionesPresupuestos(AForm: TfrmMain; item: Integer);
begin
  // TODO: implementar lógica si es necesario
end;

procedure moverTabPresupuesto(AForm: TfrmMain; item: Integer);
begin
  // TODO: implementar lógica si es necesario
end;

procedure cbb_NdecimalesPresupuestosChange(AForm: TfrmMain; Sender: TObject);
begin
end;

procedure edt_NPresupuestoPrecioReferenciaChangeTracking(AForm: TfrmMain; Sender: TObject);
begin
end;

procedure edt_descripcionPresupuestoChange(AForm: TfrmMain; Sender: TObject);
begin
end;

procedure edt_PlazoEjecucionPresupuestoChangeTracking(AForm: TfrmMain; Sender: TObject);
begin
end;

procedure edt_porcentajeIVANuevoPresupuestoExit(AForm: TfrmMain; Sender: TObject);
begin
end;

procedure edt_PresupuestoSerie1ChangeTracking(AForm: TfrmMain; Sender: TObject);
begin
end;

procedure edt_PresupuestoSerie2Exit(AForm: TfrmMain; Sender: TObject);
begin
end;

procedure edt_PresupuestoSerie3Exit(AForm: TfrmMain; Sender: TObject);
begin
end;

procedure lyt_cronoPresupuestoResize(AForm: TfrmMain; Sender: TObject);
begin
end;

procedure lyt_PresupuestoAPUSResize(AForm: TfrmMain; Sender: TObject);
begin
end;

procedure lyt_PresupuestosOpciones1Resize(AForm: TfrmMain; Sender: TObject);
begin
end;

procedure dedt_PresentacionPresupuestoClosePicker(AForm: TfrmMain; Sender: TObject);
begin
end;

procedure rect_OPC2_CrearPresupuestoClick(AForm: TfrmMain; Sender: TObject);
begin
end;

procedure rect_OPC2_CrearPresupuestoMouseEnter(AForm: TfrmMain; Sender: TObject);
begin
end;

procedure rect_OPC2_CrearPresupuestoMouseLeave(AForm: TfrmMain; Sender: TObject);
begin
end;

procedure rect_OPC2_HistoricoPresupuestosMouseEnter(AForm: TfrmMain; Sender: TObject);
begin
end;

procedure rect_OPC2_HistoricoPresupuestosMouseLeave(AForm: TfrmMain; Sender: TObject);
begin
end;

procedure rect_NPresupuestoIMG1Click(AForm: TfrmMain; Sender: TObject);
begin
end;

procedure limpiaGlowOPCPresupuestos(AForm: TfrmMain);
begin
end;

procedure rct_1PresupuestoMouseEnter(AForm: TfrmMain; Sender: TObject);
begin
end;

procedure rct_1PresupuestoMouseLeave(AForm: TfrmMain; Sender: TObject);
begin
end;

procedure rct_2PresupuestoClick(AForm: TfrmMain; Sender: TObject);
begin
end;

procedure rct_2PresupuestoMouseEnter(AForm: TfrmMain; Sender: TObject);
begin
end;

procedure rct_2PresupuestoMouseLeave(AForm: TfrmMain; Sender: TObject);
begin
end;

procedure rct_3PresupuestoClick(AForm: TfrmMain; Sender: TObject);
begin
end;

procedure rct_3PresupuestoMouseEnter(AForm: TfrmMain; Sender: TObject);
begin
end;

procedure rct_3PresupuestoMouseLeave(AForm: TfrmMain; Sender: TObject);
begin
end;

procedure rct_4PresupuestoClick(AForm: TfrmMain; Sender: TObject);
begin
end;

procedure rct_4PresupuestoMouseEnter(AForm: TfrmMain; Sender: TObject);
begin
end;

procedure rct_4PresupuestoMouseLeave(AForm: TfrmMain; Sender: TObject);
begin
end;

procedure rct_5PresupuestoClick(AForm: TfrmMain; Sender: TObject);
begin
end;

procedure rct_5PresupuestoMouseEnter(AForm: TfrmMain; Sender: TObject);
begin
end;

procedure rct_5PresupuestoMouseLeave(AForm: TfrmMain; Sender: TObject);
begin
end;

procedure rct_6PresupuestoClick(AForm: TfrmMain; Sender: TObject);
begin
end;

procedure rct_6PresupuestoMouseEnter(AForm: TfrmMain; Sender: TObject);
begin
end;

procedure rct_6PresupuestoMouseLeave(AForm: TfrmMain; Sender: TObject);
begin
end;

procedure rct_7PresupuestoClick(AForm: TfrmMain; Sender: TObject);
begin
end;

procedure rct_7PresupuestoMouseEnter(AForm: TfrmMain; Sender: TObject);
begin
end;

procedure rct_7PresupuestoMouseLeave(AForm: TfrmMain; Sender: TObject);
begin
end;

procedure rct_8PresupuestoClick(AForm: TfrmMain; Sender: TObject);
begin
end;

procedure rct_8PresupuestoMouseEnter(AForm: TfrmMain; Sender: TObject);
begin
end;

procedure rct_8PresupuestoMouseLeave(AForm: TfrmMain; Sender: TObject);
begin
end;

procedure rect_Presupuestos_abrirBaseClick(AForm: TfrmMain; Sender: TObject);
begin
end;

procedure rect_Presupuestos_AbrirTanteoClick(AForm: TfrmMain; Sender: TObject);
begin
end;

procedure rect_Presupuestos_LimpiarTanteoClick(AForm: TfrmMain; Sender: TObject);
begin
end;

procedure rect_Presupuestos_VisorEDTClick(AForm: TfrmMain; Sender: TObject);
begin
end;

end.

