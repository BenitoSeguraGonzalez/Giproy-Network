unit uPorcentajesIndirectos;

interface

uses
  System.SysUtils, System.Types, System.UITypes, System.Classes,
  System.Variants, FMX.Types,
  FMX.Controls, FMX.Forms, FMX.Graphics, FMX.Dialogs, FMX.TMSFNCTypes,
  FMX.TMSFNCUtils,
  FMX.TMSFNCGraphics, FMX.TMSFNCGraphicsTypes, System.StrUtils,
  FMX.TMSFNCGridCell,
  FMX.TMSFNCGridOptions, FMX.Effects, FMX.DialogService, Uni,
  FMX.TMSFNCCustomControl,
  FMX.TMSFNCCustomScrollControl, FMX.TMSFNCGridData, FMX.TMSFNCCustomGrid,
  FMX.TMSFNCGrid, uAbrirBase3,
  FMX.Objects, FMX.Controls.Presentation, FMX.StdCtrls, FMX.Layouts,
  FMX.ListBox, FMX.Menus;

type
  TfrmPorcentajesIndirectos = class(TForm)
    lyt_background: TLayout;
    lyt_Body: TLayout;
    rect_2: TRectangle;
    lyt_3: TLayout;
    rect_3: TRectangle;
    lyt_6: TLayout;
    rect_4: TRectangle;
    lyt_DatosGenerales: TLayout;
    lyt_9: TLayout;
    lbl_3: TLabel;
    ln_ln1: TLine;
    lyt_7: TLayout;
    lbl_2: TLabel;
    lyt_footer: TLayout;
    rect_Cancelar: TRectangle;
    iGlow_Cancelar: TInnerGlowEffect;
    rect_Aceptar: TRectangle;
    iGlow_Aceptar: TInnerGlowEffect;
    lbl_modo: TLabel;
    lyt_header: TLayout;
    rect_1: TRectangle;
    lbl_1: TLabel;
    lyt_194: TLayout;
    lyt_195: TLayout;
    lbl_193: TLabel;
    cbb_costosIndirectosCat: TComboBox;
    lbl_55: TLabel;
    cbb_CostosIndirectosConceptos: TComboBox;
    rect_btnCostosIndirectosPresupuestos: TRectangle;
    grid_CostosIndirectosPresupuesto: TTMSFNCGrid;
    grdpnlyt1: TGridPanelLayout;
    lyt_1: TLayout;
    lyt_2: TLayout;
    lyt_4: TLayout;
    lbl_CostoIndirectosPresupuesto: TLabel;
    bevel_btnCostosIndirectosPresupuestos: TBevelEffect;
    rect_11: TRectangle;
    bevel_11: TBevelEffect;
    lbl_4: TLabel;
    lbl_5: TLabel;
    rect_12: TRectangle;
    bevel_12: TBevelEffect;
    rect_13: TRectangle;
    bevel_13: TBevelEffect;
    pm1: TPopupMenu;
    MenuItem1: TMenuItem;
    MenuItem2: TMenuItem;
    procedure cbb_costosIndirectosCatChange(Sender: TObject);
    procedure rect_btnCostosIndirectosPresupuestosMouseDown(Sender: TObject;
      Button: TMouseButton;
      Shift: TShiftState; X, Y: Single);
    procedure rect_btnCostosIndirectosPresupuestosMouseUp(Sender: TObject;
      Button: TMouseButton;
      Shift: TShiftState; X, Y: Single);
    procedure rect_btnCostosIndirectosPresupuestosMouseLeave(Sender: TObject);
    procedure rect_AceptarMouseLeave(Sender: TObject);
    procedure rect_AceptarMouseEnter(Sender: TObject);
    procedure rect_CancelarMouseEnter(Sender: TObject);
    procedure rect_CancelarMouseLeave(Sender: TObject);
    procedure rect_CancelarMouseUp(Sender: TObject; Button: TMouseButton; Shift:
      TShiftState; X, Y: Single);
    procedure rect_11MouseUp(Sender: TObject; Button: TMouseButton; Shift:
      TShiftState; X, Y: Single);
    procedure rect_12MouseUp(Sender: TObject; Button: TMouseButton; Shift:
      TShiftState; X, Y: Single);
    procedure rect_13MouseUp(Sender: TObject; Button: TMouseButton; Shift:
      TShiftState; X, Y: Single);
    procedure MenuItem1Click(Sender: TObject);
    procedure pm1Popup(Sender: TObject);
    procedure MenuItem2Click(Sender: TObject);
    procedure rect_1MouseDown(Sender: TObject; Button: TMouseButton; Shift:
      TShiftState; X, Y: Single);
    procedure grid_CostosIndirectosPresupuestoCellEditDone(Sender: TObject;
      ACol, ARow: Integer;
      CellEditor: TTMSFNCGridEditor);
    procedure rect_AceptarClick(Sender: TObject);
    procedure FormShow(Sender: TObject);
  private
    { Private declarations }
    FirmaInicialIndirectos: string;
    FCargando: Boolean;
    function EsItemUsuario(datos: string): Boolean;
    function FirmaIndirectos: string;
    procedure cargaCategoriasIndirectosPresupuestos;
    procedure cargaConceptosIndirectosFijos();
    procedure cargaConceptosIndirectos(codPadre: string);
  public
    { Public declarations }
    procedure creaListadoIndirectos();
    procedure renumeraGrid();
    procedure AdicionaCuentaIndirectos(cuentaAdicionar: string);
    function daIdIndirecto(datos: string): string;
  end;

var
  frmPorcentajesIndirectos: TfrmPorcentajesIndirectos;

implementation

{$R *.fmx}

uses
  DM1, uMain, uBuscar2, uIndirectosUsuarios, uBuscar3, DM_Presupuestos;

procedure TfrmPorcentajesIndirectos.cargaConceptosIndirectos(codPadre: string);
var
  x: Integer;
  qry: TUniQuery;
  tmpstr: string;
begin
  if codPadre <> '' then
  begin
    qry := TUniQuery.Create(nil);
    SetLength(listaPorcentajeUsado, 0);
    try
      with qry do
      begin
        Connection := DModule_1.con2;
        Close;
        SQL.Clear;
        SQL.Text :=
          'SELECT ' +
          '  codigoCuenta, ' +
          '  id ' +
          'FROM conceptosIndirectos ' +
          'WHERE ' +
          'codPadre = :codPadre';
        ParamByName('codPadre').AsString := codPadre;
        Open;
        cbb_CostosIndirectosConceptos.Items.Clear;
        x := 0;
        while not Eof do
        begin
          tmpstr := FieldByName('codigoCuenta').AsString;
          cbb_CostosIndirectosConceptos.Items.
            Add(tmpstr);
          SetLength(listaPorcentajeUsado, x + 1);
          listaPorcentajeUsado[x].descripcion := tmpstr;
          listaPorcentajeUsado[x].id := FieldByName('id').AsString;
          Inc(x);
          Next;
        end;
      end;
    finally
      qry.Free;
      if cbb_CostosIndirectosConceptos.Items.Count - 1 > 0 then
        cbb_CostosIndirectosConceptos.itemindex := 0;
    end;
  end;
end;

procedure TfrmPorcentajesIndirectos.cargaConceptosIndirectosFijos;
var
  qry: TUniQuery;
  x: Integer;
  porcentajeIndirecto: currency;
begin
  qry := TUniQuery.Create(nil);
  porcentajeIndirecto := 0;
  grid_CostosIndirectosPresupuesto.BeginUpdate;

  try
    grid_CostosIndirectosPresupuesto.ClearNormalCells;

    grid_CostosIndirectosPresupuesto.cells[0, 0] := '#';
    grid_CostosIndirectosPresupuesto.cells[1, 0] := 'Cuenta';
    grid_CostosIndirectosPresupuesto.cells[2, 0] := '%';
    grid_CostosIndirectosPresupuesto.cells[3, 0] := 'Observaciones';

    grid_CostosIndirectosPresupuesto.RowCount := 1;

    x := 1;

    qry.Connection := DModule_1.con2;

    qry.SQL.Text :=
      'SELECT ' +
      '    pi.codCuenta AS id, ' +
      '    pi.cuenta AS CodigoCuenta, ' +
      '    IFNULL(NULLIF(pi.valor, ''''), ''0%'') AS valor ' +
      'FROM giproylocal_2.presupuestos_indirectos pi ' +
      'WHERE ' +
      '    pi.codBase = :codBase ' +
      '    AND pi.codPresupuesto = :codPresupuesto ' +
      '    AND pi.revision = :revision ' +
      'UNION ALL ' +
      'SELECT ' +
      '    ci.id, ' +
      '    ci.CodigoCuenta, ' +
      '    ''0%'' AS valor ' +
      'FROM giproylocal_2.conceptosindirectos ci ' +
      'LEFT JOIN giproylocal_2.presupuestos_indirectos pi ' +
      '       ON pi.codCuenta = ci.id ' +
      '      AND pi.codBase = :codBase ' +
      '      AND pi.codPresupuesto = :codPresupuesto ' +
      '      AND pi.revision = :revision ' +
      'WHERE ' +
      '    ci.fijo = 1 ' +
      '    AND pi.id IS NULL ' +
      'ORDER BY CodigoCuenta ';

    qry.Prepare;
    with qry.Params do
    begin
      ParamByName('codBase').AsString := base_activa.codBase;
      ParamByName('codPresupuesto').AsString := codProyecto;
      ParamByName('revision').AsString := revision;
    end;
    qry.Open;

    while not qry.Eof do
    begin
      grid_CostosIndirectosPresupuesto.RowCount := x + 1;

      grid_CostosIndirectosPresupuesto.cells[0, x] := IntToStr(x);

      grid_CostosIndirectosPresupuesto.cells[1, x] :=
        qry.FieldByName('CodigoCuenta').AsString;

      grid_CostosIndirectosPresupuesto.cells[2, x] :=
        qry.FieldByName('valor').AsString;

      grid_CostosIndirectosPresupuesto.cells[4, x] :=
        qry.FieldByName('id').AsString;
      porcentajeIndirecto := porcentajeIndirecto +
        PasaStrtoPorcentaje(qry.FieldByName('valor').AsString);
      Inc(x);

      qry.Next;
    end;

  finally
    grid_CostosIndirectosPresupuesto.EndUpdate;
    lbl_CostoIndirectosPresupuesto.Text := 'Indirectos: ' +
      currtostr(porcentajeIndirecto) + '%';
    qry.Free;
  end;
end;

procedure TfrmPorcentajesIndirectos.cargaCategoriasIndirectosPresupuestos;
var
  qry: TUniQuery;
  tmpstr: string;
begin
  qry := TUniQuery.Create(nil);

  FCargando := True;

  cbb_costosIndirectosCat.Items.Clear;

  try
    qry.Connection := DModule_1.con2;

    qry.SQL.Text :=
      'SELECT ' +
      '  codigo, ' +
      '  descripcion ' +
      'FROM CatIndirectos ' +
      'ORDER BY codigo';
    qry.Open;

    while not qry.Eof do
    begin
      tmpstr :=
        qry.FieldByName('codigo').AsString + ' ' +
        qry.FieldByName('descripcion').AsString;

      cbb_costosIndirectosCat.Items.Add(tmpstr);

      qry.Next;
    end;

  finally
    qry.Free;

    if cbb_costosIndirectosCat.Items.Count > 0 then
      cbb_costosIndirectosCat.ItemIndex := 0
    else
      cbb_costosIndirectosCat.ItemIndex := -1;

    FCargando := False;
  end;
end;

function TfrmPorcentajesIndirectos.FirmaIndirectos: string;
var
  i: Integer;
begin
  Result := '';
  for i := 0 to Length(listadoIndirectos) - 1 do
    Result := Result +
      listadoIndirectos[i].codCuenta + '|' +
      listadoIndirectos[i].porcentaje + '|' +
      listadoIndirectos[i].observaciones + ';';
end;

procedure TfrmPorcentajesIndirectos.AdicionaCuentaIndirectos(cuentaAdicionar:
  string);
var
  X: Integer;
  adicionar: Boolean;
  tmpstr: string;
  id: string;
begin
  X := 1;
  adicionar := True;
  while (X < grid_CostosIndirectosPresupuesto.RowCount) and (adicionar) do
  begin
    tmpstr := grid_CostosIndirectosPresupuesto.Cells[1, X];
    if cuentaAdicionar = tmpstr then
    begin
      adicionar := False;
    end;
    inc(X);
  end;
  if adicionar then
  begin
    id := daIdIndirecto(cuentaAdicionar);
    X := grid_CostosIndirectosPresupuesto.RowCount;
    grid_CostosIndirectosPresupuesto.RowCount := X + 1;
    grid_CostosIndirectosPresupuesto.Cells[0, X] := IntToStr(X);
    grid_CostosIndirectosPresupuesto.Cells[1, X] := cuentaAdicionar;
    grid_CostosIndirectosPresupuesto.Cells[2, X] := '0%';
    grid_CostosIndirectosPresupuesto.Cells[4, X] := id;
  end
  else
  begin
    ShowMessage('Cuenta de Indirectos ya se encuentra en el listado.');
  end;
end;

procedure TfrmPorcentajesIndirectos.cbb_costosIndirectosCatChange(Sender:
  TObject);
var
  codPadreIndirectos: string;
  txt: string;
  p: Integer;
  idx: Integer;
begin
  if (csDestroying in ComponentState) or FCargando then
    Exit;

  idx := cbb_costosIndirectosCat.ItemIndex;

  if (idx < 0) or (idx >= cbb_costosIndirectosCat.Items.Count) then
    Exit;

  txt := Trim(cbb_costosIndirectosCat.Items[idx]);

  if txt = '' then
    Exit;

  p := Pos(' ', txt);

  if p > 0 then
    codPadreIndirectos := Copy(txt, 1, p - 1)
  else
    codPadreIndirectos := txt;

  if codPadreIndirectos = '' then
    Exit;

  cargaConceptosIndirectos(codPadreIndirectos);
end;

procedure TfrmPorcentajesIndirectos.creaListadoIndirectos;
var
  X: Integer;
  tmpstr: string;
  recalcular: Boolean;
  ARow: Integer;
  codAPU: string;
  total: Double;
begin
  if lbl_modo.Text = '0' then
  begin
    recalcular := False;
  end
  else
    recalcular := True;
  total := 0;
  SetLength(listadoIndirectos, 0);
  for X := 1 to grid_CostosIndirectosPresupuesto.RowCount - 1 do
  begin
    SetLength(listadoIndirectos, X);
    listadoIndirectos[X - 1].cuenta := grid_CostosIndirectosPresupuesto.Cells[1,
      X];
    listadoIndirectos[X - 1].observaciones :=
      grid_CostosIndirectosPresupuesto.Cells[3, X];
    listadoIndirectos[X - 1].porcentaje :=
      grid_CostosIndirectosPresupuesto.Cells[2, X];
    total := total +
      StrToFloatdef(ReplaceStr(grid_CostosIndirectosPresupuesto.Cells[2, X],
      '%',
      ''), 0);
    listadoIndirectos[X - 1].codCuenta :=
      grid_CostosIndirectosPresupuesto.Cells[4, X];
  end;
  tmpstr := lbl_CostoIndirectosPresupuesto.Text;
  X := AnsiPos(':', tmpstr);
  tmpstr := Copy(tmpstr, X + 1, Length(tmpstr));
  tmpstr := Trim(tmpstr);
  tmpstr := ReplaceStr(tmpstr, '%', '');
  IndirectosPresupuesto := total;
end;

function TfrmPorcentajesIndirectos.daIdIndirecto(datos: string): string;
var
  X: Integer;
  salir: Boolean;
  tmpstr: string;
begin
  Result := '';
  salir := False;
  X := 0;
  while (X < Length(listaPorcentajeUsado)) and (not salir) do
  begin
    tmpstr := listaPorcentajeUsado[X].descripcion;
    if tmpstr = datos then
    begin
      salir := True;
      Result := listaPorcentajeUsado[X].id;
    end;
    inc(X);
  end;
end;

function TfrmPorcentajesIndirectos.EsItemUsuario(datos: string): Boolean;
var
  qry: TUniQuery;
  tmpstr: string;
begin
  Result := False;

  qry := TUniQuery.Create(nil);
  try
    qry.Connection := DModule_1.con2;

    qry.SQL.Text :=
      'select codPadre from conceptosIndirectos where id=:id';

    qry.ParamByName('id').AsString := datos;

    qry.Open;

    if not qry.IsEmpty then
    begin
      tmpstr := qry.FieldByName('codPadre').AsString;
      Result := tmpstr = '7.1';
    end;

  finally
    qry.Free;
  end;
end;

procedure TfrmPorcentajesIndirectos.FormShow(Sender: TObject);
begin
  FirmaInicialIndirectos := FirmaIndirectos;

  FCargando := True;

  try
    cargaConceptosIndirectosFijos;
    cargaCategoriasIndirectosPresupuestos;
    cargaConceptosIndirectos('1.1');
  finally
    FCargando := False;
  end;

  lbl_CostoIndirectosPresupuesto.Text :=
    'Indirectos: ' + FloatToStr(IndirectosPresupuesto) + '%';
end;

procedure
  TfrmPorcentajesIndirectos.grid_CostosIndirectosPresupuestoCellEditDone(Sender:
  TObject;
  ACol, ARow: Integer; CellEditor: TTMSFNCGridEditor);
var
  valor: string;
begin
  if ACol = 2 then
  begin
    valor := grid_CostosIndirectosPresupuesto.Cells[2, ARow];
    if RightStr(valor, 1) <> '%' then
      valor := valor + '%';
    grid_CostosIndirectosPresupuesto.Cells[2, ARow] := valor;
  end;
  if ACol = 3 then
  begin
    valor := grid_CostosIndirectosPresupuesto.Cells[3, ARow];
    if valor <> '' then
      grid_CostosIndirectosPresupuesto.AutoSizeColumn(3);
  end;
  creaListadoIndirectos;
  lbl_CostoIndirectosPresupuesto.Text := 'Indirectos: ' +
    FloatToStr(IndirectosPresupuesto) + '%';
end;

procedure TfrmPorcentajesIndirectos.MenuItem1Click(Sender: TObject);
var
  posItem: Integer;
begin
  posItem := grid_CostosIndirectosPresupuesto.Selection.StartRow;
  if posItem > 0 then
  begin
    grid_CostosIndirectosPresupuesto.DeleteRow(posItem);
    renumeraGrid;
  end;
end;

procedure TfrmPorcentajesIndirectos.MenuItem2Click(Sender: TObject);
var
  LForm: TfrmIndirectosUsuarios;
begin
  LForm := TfrmIndirectosUsuarios.Create(Application);
  try
    LForm.PopulaIndirectosUsuario;
    LForm.edt_Filtro.Text := '';
    LForm.ShowModal;
  finally
    LForm.Free;
  end;
end;

procedure TfrmPorcentajesIndirectos.pm1Popup(Sender: TObject);
var
  posItem: Integer;
begin
  MenuItem2.Visible := False;
  posItem := grid_CostosIndirectosPresupuesto.Selection.StartRow;
  if posItem > 0 then
  begin
    if EsItemUsuario(grid_CostosIndirectosPresupuesto.Cells[4, posItem]) then
    begin
      MenuItem2.Visible := True;
    end
    else
    begin
      MenuItem2.Visible := False;
    end;
  end;
end;

procedure TfrmPorcentajesIndirectos.rect_11MouseUp(Sender: TObject; Button:
  TMouseButton; Shift:
  TShiftState; X, Y: Single);
var
  posItem: Integer;
begin
  posItem := grid_CostosIndirectosPresupuesto.Selection.StartRow;
  if posItem > 0 then
  begin
    grid_CostosIndirectosPresupuesto.DeleteRow(posItem);
    renumeraGrid;
  end;
end;

procedure TfrmPorcentajesIndirectos.rect_12MouseUp(Sender: TObject; Button:
  TMouseButton; Shift:
  TShiftState; X, Y: Single);
var
  LForm: TfrmBuscar3;
begin
  LForm := TfrmBuscar3.Create(Application);
  try
    LForm.grid_CostosIndirectos.UnHideRowsAll;
    LForm.grid_CostosIndirectos.RemoveFilters;
    LForm.edt_Filtro.Text := '';
    LForm.populaIndirectos;
    LForm.ShowModal;
  finally
    LForm.Free;
  end;
end;

procedure TfrmPorcentajesIndirectos.rect_13MouseUp(Sender: TObject; Button:
  TMouseButton; Shift:
  TShiftState; X, Y: Single);
var
  LForm: TfrmIndirectosUsuarios;
begin
  LForm := TfrmIndirectosUsuarios.Create(Application);
  try
    LForm.PopulaIndirectosUsuario;
    LForm.edt_Filtro.Text := '';
    LForm.ShowModal;
  finally
    LForm.Free;
  end;
end;

procedure TfrmPorcentajesIndirectos.rect_1MouseDown(Sender: TObject; Button:
  TMouseButton; Shift:
  TShiftState; X, Y: Single);
begin
  Self.StartWindowDrag;
end;

procedure TfrmPorcentajesIndirectos.rect_AceptarClick(Sender: TObject);

  procedure BorrarIndirectos(qry: TUniQuery);
  begin
    qry.SQL.Text :=
      'DELETE FROM presupuestos_indirectos ' +
      'WHERE codBase=:codBase AND codPresupuesto=:codPresupuesto AND revision=:revision';

    qry.ParamByName('codBase').AsString := base_activa.codBase;
    qry.ParamByName('codPresupuesto').AsString := codProyecto;
    qry.ParamByName('revision').AsString := revision;

    qry.ExecSQL;
  end;

  procedure ActualizaPorcentajePresupuestosDatosGenerales(qry: TUniQuery);
  begin
    qry.SQL.Text :=
      'UPDATE presupuestos_datosgenerales ' +
      'SET indirectos=:indirectos ' +
      'WHERE codBase=:codBase AND codPresupuesto=:codPresupuesto AND revision=:revision';

    qry.ParamByName('codBase').AsString := base_activa.codBase;
    qry.ParamByName('codPresupuesto').AsString := codProyecto;
    qry.ParamByName('revision').AsString := revision;
    qry.ParamByName('indirectos').AsFloat := IndirectosPresupuesto;

    qry.ExecSQL;
  end;

var
  qry: TUniQuery;
begin
  iGlow_Aceptar.Enabled := False;

  grid_CostosIndirectosPresupuesto.StopEdit;

  creaListadoIndirectos;

  frmMain.lbl_porcentajesIndirectos.Text :=
    FloatToStr(IndirectosPresupuesto) + '%';

  frmMain.iGlow_Presupuestos_SeleccionarIndirectos.Enabled := False;

  if (IndirectosPresupuesto = 0) then
    if realizarPreguntaSiNo('¿Esta seguro de Presupuesto sin Indirectos?') <>
      mrOK then
      Exit;

  if FirmaIndirectos = FirmaInicialIndirectos then
  begin
    ModalResult := mrOK;
    Exit;
  end;

  qry := TUniQuery.Create(nil);

  try
    qry.Connection := DModule_1.con2;

    if not qry.Connection.InTransaction then
      qry.Connection.StartTransaction;

    try

      BorrarIndirectos(qry);

      if Length(listadoIndirectos) > 0 then
        Guardar_Indirectos;

      ActualizaPorcentajePresupuestosDatosGenerales(qry);

      qry.Connection.Commit;

      DMPresupuesto.calculaTotal;

      cbb_costosIndirectosCat.OnChange := nil;
      ModalResult := mrOK;

    except
      qry.Connection.Rollback;
      ModalResult := mrCancel;
      raise;
    end;

  finally
    qry.Free;
  end;

end;

procedure TfrmPorcentajesIndirectos.rect_AceptarMouseEnter(Sender: TObject);
begin
  iGlow_Aceptar.Enabled := True;
end;

procedure TfrmPorcentajesIndirectos.rect_AceptarMouseLeave(Sender: TObject);
begin
  iGlow_Aceptar.Enabled := False;
end;

procedure
  TfrmPorcentajesIndirectos.rect_btnCostosIndirectosPresupuestosMouseDown(Sender:
  TObject;
  Button: TMouseButton; Shift: TShiftState; X, Y: Single);
begin
  bevel_btnCostosIndirectosPresupuestos.Enabled := False;
end;

procedure
  TfrmPorcentajesIndirectos.rect_btnCostosIndirectosPresupuestosMouseLeave(Sender:
  TObject);
begin
  bevel_btnCostosIndirectosPresupuestos.Enabled := True;
end;

procedure
  TfrmPorcentajesIndirectos.rect_btnCostosIndirectosPresupuestosMouseUp(
  Sender: TObject;
  Button: TMouseButton; Shift: TShiftState; X, Y: Single);
var
  cuentaAdicionar: string;
begin
  bevel_btnCostosIndirectosPresupuestos.Enabled := True;

  if cbb_CostosIndirectosConceptos.ItemIndex < 0 then
    Exit;

  cuentaAdicionar :=
    cbb_CostosIndirectosConceptos.Items[
    cbb_CostosIndirectosConceptos.ItemIndex];

  if Trim(cuentaAdicionar) = '' then
    Exit;

  AdicionaCuentaIndirectos(cuentaAdicionar);
end;

procedure TfrmPorcentajesIndirectos.rect_CancelarMouseEnter(Sender: TObject);
begin
  iGlow_Cancelar.Enabled := True;
end;

procedure TfrmPorcentajesIndirectos.rect_CancelarMouseLeave(Sender: TObject);
begin
  iGlow_Cancelar.Enabled := False;
end;

procedure TfrmPorcentajesIndirectos.rect_CancelarMouseUp(Sender: TObject;
  Button: TMouseButton;
  Shift: TShiftState; X, Y: Single);
begin
  iGlow_Cancelar.Enabled := False;
end;

procedure TfrmPorcentajesIndirectos.renumeraGrid;
var
  X: Integer;
begin
  for X := 1 to grid_CostosIndirectosPresupuesto.RowCount - 1 do
  begin
    grid_CostosIndirectosPresupuesto.Cells[0, X] := IntToStr(X);
  end;
end;

end.

