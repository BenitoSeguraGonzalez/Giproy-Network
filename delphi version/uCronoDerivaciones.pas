unit uCronoDerivaciones;

interface

uses
  System.SysUtils, System.Types, System.UITypes, System.Classes,
  System.Variants, FMX.Types,
  FMX.Controls, FMX.Forms, FMX.Graphics, FMX.Dialogs, FMX.Effects,
  System.StrUtils, FMX.ListBox,
  FMX.Edit, FMX.Objects, FMX.Controls.Presentation, FMX.StdCtrls, FMX.Layouts,
  FMX.TMSFNCTypes,
  FMX.TMSFNCUtils, FMX.TMSFNCGraphics, System.Math, FMX.TMSFNCGraphicsTypes,
  FMX.TMSFNCGridCell,
  FMX.TMSFNCGridOptions, FMX.TMSFNCCustomControl, FMX.TMSFNCCustomScrollControl,
  FMX.TMSFNCGridData,
  FMX.TMSFNCCustomGrid, FMX.TMSFNCGrid;

type
  Tfrm_CronoDerivaciones = class(TForm)
    lyt_background: TLayout;
    lyt_Body: TLayout;
    rect_2: TRectangle;
    lyt_3: TLayout;
    rect_3: TRectangle;
    lyt_6: TLayout;
    rect_4: TRectangle;
    lyt_1: TLayout;
    lyt_11: TLayout;
    lbl_11: TLabel;
    ln_1: TLine;
    lyt_14: TLayout;
    lyt_15: TLayout;
    lyt_12: TLayout;
    lyt_7: TLayout;
    lbl_codCuenta: TLabel;
    lyt_footer: TLayout;
    rect_Cancelar: TRectangle;
    iGlow_Cancelar: TInnerGlowEffect;
    rect_Aceptar: TRectangle;
    iGlow_Aceptar: TInnerGlowEffect;
    lbl_modo: TLabel;
    lyt_header: TLayout;
    rect_1: TRectangle;
    lbl_1: TLabel;
    grid_DefDerivacion: TTMSFNCGrid;
    grdpnlyt1: TGridPanelLayout;
    lyt_2: TLayout;
    chkHomogenea: TCheckBox;
    lyt_13: TLayout;
    lyt_16: TLayout;
    lyt_17: TLayout;
    chkCustom: TCheckBox;
    lbl_cronoNPeriodos: TLabel;
    lbl_PorcentajeRestante: TLabel;
    lbl_codigo: TLabel;
    lbl_TodoProyexto: TLabel;
    procedure chkHomogeneaChange(Sender: TObject);
    procedure rect_AceptarMouseEnter(Sender: TObject);
    procedure rect_AceptarMouseLeave(Sender: TObject);
    procedure rect_CancelarMouseUp(Sender: TObject; Button: TMouseButton; Shift:
      TShiftState; X, Y: Single);
    procedure rect_CancelarMouseLeave(Sender: TObject);
    procedure rect_CancelarMouseEnter(Sender: TObject);
    procedure chkCustomChange(Sender: TObject);
    procedure FormShow(Sender: TObject);
    procedure rect_1MouseDown(Sender: TObject; Button: TMouseButton; Shift:
      TShiftState; X, Y: Single);
    procedure rect_AceptarClick(Sender: TObject);
    procedure grid_DefDerivacionCellEditDone(Sender: TObject; ACol, ARow:
      Integer; CellEditor:
      TTMSFNCGridEditor);
  private
    { Private declarations }
    estadoBase: string;
  public
    { Public declarations }
    procedure CalculaCronogramaEjecucionObras();
    procedure derivacionHomogenea();
    procedure cargaDerivacionAsignada(datos: string);

  end;

var
  frm_CronoDerivaciones: Tfrm_CronoDerivaciones;

implementation

{$R *.fmx}

uses
  uMain, DM1;

{ Tfrm_CronoDerivaciones }
procedure Tfrm_CronoDerivaciones.CalculaCronogramaEjecucionObras;
var
  X: Integer;
  nperiodos: Integer;
begin
  nperiodos := StrToIntDef(frmMain.lbl_cronogramaNPeriodos.Text, 0);
  if nperiodos <= 0 then
    nperiodos := 1;

  lbl_cronoNPeriodos.Text := 'Periodos: ' + IntToStr(nperiodos);

  // Limpiar columnas de forma segura
  while grid_DefDerivacion.ColumnCount > 0 do
    grid_DefDerivacion.DeleteColumn(0);

  grid_DefDerivacion.ClearNormalCells;

  // Debe haber EXACTAMENTE nperiodos columnas
  grid_DefDerivacion.ColumnCount := nperiodos;

  for X := 0 to nperiodos - 1 do
  begin
    grid_DefDerivacion.Cells[X, 0] := 'P' + IntToStr(X + 1);
    grid_DefDerivacion.Columns[X].Width := 50;
  end;
end;

procedure Tfrm_CronoDerivaciones.cargaDerivacionAsignada(datos: string);
var
  listadoDerivacionAsignada: TStringList;
  X: Integer;
  valor: Double;
  suma: Double;
  fmt: string;
  tmpstr: string;
begin
  listadoDerivacionAsignada := TStringList.Create;
  try
    listadoDerivacionAsignada.Text := datos;

    // Formato dinámico según ndecimalesMoneda
    fmt := '0';
    if ndecimalesMoneda > 0 then
      fmt := fmt + '.' + StringOfChar('0', ndecimalesMoneda);

    suma := 0;

    if listadoDerivacionAsignada.Count = grid_DefDerivacion.ColumnCount then
    begin
      for X := 0 to grid_DefDerivacion.ColumnCount - 1 do
      begin
        tmpstr := listadoDerivacionAsignada[X];
        tmpstr := ReplaceStr(tmpstr, '%', '');
        tmpstr := Trim(tmpstr);
        tmpstr := decimal_correcto(tmpstr);

        valor := StrToFloatDef(tmpstr, 0);

        grid_DefDerivacion.Cells[X, 1] :=
          FormatFloat(fmt, valor) + '%';

        suma := suma + valor;
        grid_DefDerivacion.AutoSizeColumn(X);
      end;

      // Actualizar porcentaje restante
      lbl_PorcentajeRestante.Visible := True;
      lbl_PorcentajeRestante.Text :=
        '% Restante: ' + FormatFloat(fmt, 100 - suma);
    end;
  finally
    listadoDerivacionAsignada.Free;
  end;
end;

procedure Tfrm_CronoDerivaciones.chkCustomChange(Sender: TObject);
var
  X: Integer;
  Y: Integer;
  tmpstr: string;
begin
  if (chkCustom.IsChecked) then
  begin
    distribucionDerivacion := 'Distribuida';
    chkHomogenea.IsChecked := false;
    lbl_PorcentajeRestante.Visible := True;
    lbl_PorcentajeRestante.Text := '% Restante: 100';
    tmpstr := lbl_cronoNPeriodos.Text;
    Y := AnsiPos(':', tmpstr);
    tmpstr := Copy(tmpstr, Y + 1, Length(tmpstr));
    tmpstr := Trim(tmpstr);
    Y := StrToInt(tmpstr);
    for X := 0 to Y - 1 do
    begin
      grid_DefDerivacion.Cells[X, 1] := '0%';
      grid_DefDerivacion.Columns[X].Width := 50;
    end;
    grid_DefDerivacion.Options.Editing.Enabled := True;
  end;
end;

procedure Tfrm_CronoDerivaciones.chkHomogeneaChange(Sender: TObject);
begin
  if chkHomogenea.IsChecked then
  begin
    lbl_PorcentajeRestante.Visible := false;
    chkCustom.IsChecked := false;
    derivacionHomogenea;
    distribucionDerivacion := 'Homogenea';
  end;
end;

procedure Tfrm_CronoDerivaciones.derivacionHomogenea;
var
  nperiodos: Integer;
  porcentaje: Double;
  X: Integer;
  suma: Double;
  lastPct: Double;
  fmt: string;
begin
  nperiodos := StrToIntDef(frmMain.lbl_cronogramaNPeriodos.Text, 0);
  if nperiodos <= 0 then
    nperiodos := 1;

  // asegurar columnas
  if grid_DefDerivacion.ColumnCount <> nperiodos then
    CalculaCronogramaEjecucionObras;

  // Formato dinámico según ndecimalesMoneda
  fmt := '0';
  if ndecimalesMoneda > 0 then
    fmt := fmt + '.' + StringOfChar('0', ndecimalesMoneda);

  if nperiodos = 1 then
  begin
    grid_DefDerivacion.Cells[0, 1] := FormatFloat(fmt, 100) + '%';
    Exit;
  end;

  porcentaje := 100.0 / nperiodos;
  suma := 0;

  for X := 0 to nperiodos - 2 do
  begin
    grid_DefDerivacion.Cells[X, 1] :=
      FormatFloat(fmt, porcentaje) + '%';
    suma := suma + StrToFloat(FormatFloat(fmt, porcentaje));
    grid_DefDerivacion.AutoSizeColumn(X);
  end;

  lastPct := 100.0 - suma;

  grid_DefDerivacion.Cells[nperiodos - 1, 1] :=
    FormatFloat(fmt, lastPct) + '%';

  grid_DefDerivacion.AutoSizeColumn(nperiodos - 1);
end;

procedure Tfrm_CronoDerivaciones.FormShow(Sender: TObject);
var
  tipoPeriodo, tipoDerivacion, derivacion: string;
  periodos: Integer;
begin
  chkHomogenea.IsChecked := False;
  chkCustom.IsChecked := False;

  // Asegura global si no existe (primera vez)
  AseguraCronoConfigGlobalPorDefecto;

  // Aplica a UI principal y grid base
  AplicaCronoConfigGlobalAUI;

  // Construir grid del form con nperiodos
  CalculaCronogramaEjecucionObras;

  // Cargar valores globales
  if CargaCronoConfigGlobal(tipoPeriodo, periodos, tipoDerivacion, derivacion)
    then
  begin
    if SameText(tipoDerivacion, 'Homogenea') then
    begin
      chkHomogenea.IsChecked := True;
      derivacionHomogenea;
    end
    else
    begin
      chkCustom.IsChecked := True;
      cargaDerivacionAsignada(derivacion);
      grid_DefDerivacion.Options.Editing.Enabled := True;
      lbl_PorcentajeRestante.Visible := True;
      lbl_PorcentajeRestante.Text := '% Restante: 0';
    end;
  end;
end;

procedure Tfrm_CronoDerivaciones.grid_DefDerivacionCellEditDone(
  Sender: TObject; ACol, ARow: Integer;
  CellEditor: TTMSFNCGridEditor);
var
  valorTotal: Double;
  valorCelda: Double;
  tmpstr: string;
  X: Integer;
  fmt: string;
begin
  // Formato dinámico
  fmt := '0';
  if ndecimalesMoneda > 0 then
    fmt := fmt + '.' + StringOfChar('0', ndecimalesMoneda);

  valorTotal := 0;

  for X := 0 to grid_DefDerivacion.Columns.Count - 1 do
  begin
    tmpstr := grid_DefDerivacion.Cells[X, 1];
    if tmpstr = '' then
      tmpstr := '0';

    tmpstr := ReplaceStr(tmpstr, '%', '');
    tmpstr := Trim(tmpstr);
    tmpstr := decimal_correcto(tmpstr);

    valorCelda := StrToFloatDef(tmpstr, 0);
    valorTotal := valorTotal + valorCelda;
  end;

  // Calcular restante
  lbl_PorcentajeRestante.Text :=
    '% Restante: ' + FormatFloat(fmt, 100 - valorTotal);

  // Normalizar celda editada
  tmpstr := ReplaceStr(grid_DefDerivacion.Cells[ACol, ARow], '%', '');
  tmpstr := decimal_correcto(tmpstr);
  valorCelda := StrToFloatDef(tmpstr, 0);

  grid_DefDerivacion.Cells[ACol, ARow] :=
    FormatFloat(fmt, valorCelda) + '%';

  grid_DefDerivacion.AutoSizeColumn(ACol);

  chkHomogenea.IsChecked := False;
  chkCustom.IsChecked := True;
end;

procedure Tfrm_CronoDerivaciones.rect_1MouseDown(Sender: TObject; Button:
  TMouseButton; Shift:
  TShiftState; X, Y: Single);
begin
  Self.StartWindowDrag;
end;

procedure Tfrm_CronoDerivaciones.rect_AceptarClick(Sender: TObject);
begin
  iGlow_Aceptar.Enabled := False;

  // Guardar GLOBAL desde este form (sin copiar a items)
  if not guardarDatosDerivacion(Self) then
    raise
      Exception.Create('No se pudo guardar la configuración global del cronograma.');

  // Recalcular cronos usando la global persistida
  ejecutaCronoDerivaciones();

  ModalResult := mrOk;
end;

procedure Tfrm_CronoDerivaciones.rect_AceptarMouseEnter(Sender: TObject);
begin
  iGlow_Aceptar.Enabled := True;
end;

procedure Tfrm_CronoDerivaciones.rect_AceptarMouseLeave(Sender: TObject);
begin
  iGlow_Aceptar.Enabled := false;
end;

procedure Tfrm_CronoDerivaciones.rect_CancelarMouseEnter(Sender: TObject);
begin
  iGlow_Cancelar.Enabled := True;
end;

procedure Tfrm_CronoDerivaciones.rect_CancelarMouseLeave(Sender: TObject);
begin
  iGlow_Cancelar.Enabled := false;
end;

procedure Tfrm_CronoDerivaciones.rect_CancelarMouseUp(Sender: TObject; Button:
  TMouseButton; Shift:
  TShiftState; X, Y: Single);
var
  tmpstr: string;
  i: Integer;
begin
  iGlow_Cancelar.Enabled := false;
  i := AnsiPos(',', cancelarDerivacion);
  if i > 0 then
  begin
    tmpstr := Copy(cancelarDerivacion, i + 1, Length(cancelarDerivacion));
    frmmain.lbl_cronogramaNPeriodos.Text := tmpstr;
    tmpstr := Copy(cancelarDerivacion, 1, i - 1);
    posicionaCombo(frmmain.cbb_cronoTipoPeriodo, tmpstr);
  end;
  ModalResult := mrOk;
end;

end.

