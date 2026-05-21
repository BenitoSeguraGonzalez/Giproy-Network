unit uDuplicarBase;

interface

uses
  System.SysUtils, System.Types, System.UITypes, System.Classes,
  System.Variants,
  System.StrUtils,
  FMX.Types, FMX.Controls, FMX.Forms, FMX.Graphics, FMX.Dialogs, FMX.Layouts,
  FMX.Controls.Presentation, FMX.StdCtrls,
  FMX.Objects, FMX.Memo.Types, FMX.ScrollBox, FMX.Memo, FMX.ListBox, FMX.Ani,
  FMX.Edit, FMX.TMSFNCSplitter, FMX.Menus,
  FMX.Effects, System.Character,
  FMX.TMSFNCTypes, FMX.TMSFNCUtils, FMX.TMSFNCGraphics, FMX.TMSFNCGraphicsTypes,
  FMX.TMSFNCCustomControl, FMX.TMSFNCCustomScrollControl,
  FMX.TMSFNCGridData, FMX.TMSFNCCustomGrid, FMX.TMSFNCGrid,
  System.Net.URLClient, System.Net.HttpClient, System.Net.HttpClientComponent,
  System.JSON,
  System.Math, System.Generics.Collections,
  Uni, FMX.TMSFNCGridCell, FMX.TMSFNCGridOptions;

const
  valorYDuplicar = 1160;
  ValorYReducido = 500;

type
  {
    Formulario para crear una nueva base a partir de otras bases existentes.
    - Permite duplicar una base (o combinar varias como "bases padre").
    - Opcionalmente importa también APUS de la base seleccionada.
    - Consulta el cambio de moneda según el país seleccionado (API JSON, sin WebView).
  }
  TfrmDuplicarBase = class(TForm)
    lyt_Background: TLayout;
    lyt_Body: TLayout;
    rect_2: TRectangle;
    lyt_3: TLayout;
    rect_3: TRectangle;
    lyt_6: TLayout;
    rect_4: TRectangle;
    lyt_BasesDisponibles: TLayout;
    lyt_9: TLayout;
    lbl_3: TLabel;
    ln_ln1: TLine;
    grid_BasesDisponibles: TTMSFNCGrid;
    lyt_7: TLayout;
    lbl_banner2: TLabel;
    lyt_footer: TLayout;
    lbl_modo: TLabel;
    lyt_header: TLayout;
    rect_1: TRectangle;
    lbl_banner1: TLabel;
    lyt_12: TLayout;
    lbl_11: TLabel;
    ln_1: TLine;
    grid_BasesSeleccionadas: TTMSFNCGrid;
    lyt_2: TLayout;
    chk_ImportarAPUS: TCheckBox;
    lyt_4: TLayout;
    lyt_117: TLayout;
    rect_13: TRectangle;
    lyt_118: TLayout;
    lyt_119: TLayout;
    lbl_18: TLabel;
    ln_11: TLine;
    grdpnlyt: TGridPanelLayout;
    lyt_10: TLayout;
    lbl_4: TLabel;
    lyt_120: TLayout;
    rect_5: TRectangle;
    Shadow_NombreBase: TShadowEffect;
    edt_NombreBase: TEdit;
    lyt_121: TLayout;
    lbl_5: TLabel;
    lyt_13: TLayout;
    rect_11: TRectangle;
    Shadow_Descripcion: TShadowEffect;
    edt_Descripcion: TEdit;
    lyt_14: TLayout;
    lbl_6: TLabel;
    lyt_15: TLayout;
    rect_12: TRectangle;
    Shadow_Indirectos: TShadowEffect;
    edt_Indirectos: TEdit;
    lyt_RendimientoBase: TLayout;
    lyt_16: TLayout;
    lbl_19: TLabel;
    ln_ln11: TLine;
    fAngle_12: TFloatAnimation;
    grdpnlyt11: TGridPanelLayout;
    lyt_17: TLayout;
    lbl_12: TLabel;
    lyt_18: TLayout;
    cbb_Rendimiento: TComboBox;
    lyt_19: TLayout;
    lbl_13: TLabel;
    lyt_110: TLayout;
    cbb_UTiempos: TComboBox;
    lyt_Adicionales: TLayout;
    lyt_111: TLayout;
    lbl_14: TLabel;
    ln_ln111: TLine;
    fAngle_1: TFloatAnimation;
    chk_SeguridadIndustrial: TCheckBox;
    lbl_7: TLabel;
    mmo_Observaciones: TMemo;
    Shadow_Observaciones: TShadowEffect;
    lyt_Pais: TLayout;
    lyt_112: TLayout;
    lbl_15: TLabel;
    ln_12: TLine;
    fAngle_11: TFloatAnimation;
    grdpnlyt111: TGridPanelLayout;
    lyt_113: TLayout;
    lbl_16: TLabel;
    lyt_114: TLayout;
    cbb_pais: TComboBox;
    lyt_115: TLayout;
    lbl_17: TLabel;
    lyt_116: TLayout;
    lbl_moneda: TLabel;
    pm1: TPopupMenu;
    MenuItem1: TMenuItem;
    lbl_moneda_pais: TLabel;
    rect_Aceptar: TRectangle;
    iGlow_Aceptar: TInnerGlowEffect;
    rect_Cancelar: TRectangle;
    iGlow_Cancelar: TInnerGlowEffect;
    lytBasesAdicionales: TLayout;
    lyt2: TLayout;
    lyt3: TLayout;
    chk_soloBasesPadres: TCheckBox;
    lyt4: TLayout;
    chk_adicionarBases: TCheckBox;
    procedure FormCreate(Sender: TObject);
    procedure cbb_paisChange(Sender: TObject);
    procedure grid_BasesDisponiblesColumnSized(Sender: TObject; ACol: Integer;
      NewWidth: Single);
    procedure grid_BasesDisponiblesDblClick(Sender: TObject);
    procedure MenuItem1Click(Sender: TObject);
    procedure rect_AceptarMouseEnter(Sender: TObject);
    procedure rect_AceptarMouseLeave(Sender: TObject);
    procedure rect_CancelarMouseEnter(Sender: TObject);
    procedure rect_CancelarMouseLeave(Sender: TObject);
    procedure rect_1MouseDown(Sender: TObject; Button: TMouseButton;
      Shift: TShiftState; X, Y: Single);
    procedure FormShow(Sender: TObject);
    procedure chk_soloBasesPadresChange(Sender: TObject);
    procedure chk_adicionarBasesChange(Sender: TObject);
    procedure rect_AceptarClick(Sender: TObject);
    procedure rect_CancelarClick(Sender: TObject);
  private
    FHttp: TNetHTTPClient;
    procedure ObtenerTipoCambio(const ACodPais: string);
    procedure ProcesarJSONCambio(const AJSON: string; const ACodPais: string);
    procedure GuardaBasesDatos;
  public
    procedure daCambioMoneda(const codMonedaPais: string);
    procedure limpiaGridSeleccionadas;
    procedure limpiaGridDisponibles;
    procedure populaGridBaseDatosDisponibles;
  end;

var
  frmDuplicarBase: TfrmDuplicarBase;

implementation

{$R *.fmx}

uses
  DM1, uNuevaBase, uMain;

procedure TfrmDuplicarBase.FormCreate(Sender: TObject);
begin
  FHttp := TNetHTTPClient.Create(Self);
  FHttp.ConnectionTimeout := 10000;
  FHttp.ResponseTimeout := 10000;
end;

{============== HELPERS ====================}

function ColumnExists(C: TUniConnection; const ATable, ACol: string): Boolean;
var
  Q: TUniQuery;
begin
  Result := False;
  Q := TUniQuery.Create(nil);
  try
    Q.Connection := C;
    Q.SQL.Text :=
      'SELECT 1 ' +
      'FROM INFORMATION_SCHEMA.COLUMNS ' +
      'WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = :t AND COLUMN_NAME = :c ' +
      'LIMIT 1';
    Q.ParamByName('t').AsString := ATable;
    Q.ParamByName('c').AsString := ACol;
    Q.Open;
    Result := not Q.Eof;
  finally
    Q.Free;
  end;
end;

function ExistingColumns(C: TUniConnection; const ATable: string;
  const Candidates: array of string): TArray<string>;
var
  L: TList<string>;
  I: Integer;
begin
  L := TList<string>.Create;
  try
    for I := Low(Candidates) to High(Candidates) do
      if ColumnExists(C, ATable, Candidates[I]) then
        L.Add(Candidates[I]);
    Result := L.ToArray;
  finally
    L.Free;
  end;
end;

function JoinCols(const Cols: TArray<string>): string;
var
  I: Integer;
begin
  Result := '';
  for I := 0 to High(Cols) do
  begin
    if Result <> '' then
      Result := Result + ', ';
    Result := Result + Cols[I];
  end;
end;

function JoinSelectExpr(const Cols: TArray<string>; const ExprMap: TDictionary<string, string>): string;
var
  I: Integer;
  Col, Expr: string;
begin
  Result := '';
  for I := 0 to High(Cols) do
  begin
    Col := Cols[I];

    if (ExprMap <> nil) and ExprMap.TryGetValue(Col, Expr) then
    begin
      // usa expresión custom (ej: ':newCodBase', 'codCategoriaBase + :off', etc.)
    end
    else
      Expr := Col;

    if Result <> '' then
      Result := Result + ', ';
    Result := Result + Expr;
  end;
end;

function GetCatOffset(C: TUniConnection): Integer;
var
  Q: TUniQuery;
begin
  Result := 1000;
  Q := TUniQuery.Create(nil);
  try
    Q.Connection := C;
    // si Categoria_base no es numérico, igual devolvemos 1000 y el CASE de abajo se encarga
    Q.SQL.Text := 'SELECT IFNULL(MAX(CAST(Categoria_base AS UNSIGNED)),0) + 1000 AS v FROM categoriaapus';
    try
      Q.Open;
      Result := Q.FieldByName('v').AsInteger;
    except
      Result := 1000;
    end;
  finally
    Q.Free;
  end;
end;

{ ==== COMBOS Y MONEDA (API JSON, SIN WEBVIEW) =============================== }

procedure TfrmDuplicarBase.cbb_paisChange(Sender: TObject);
var
  codPais: string;
begin
  // listadoCodigoPaises es casi seguro un TStringList
  if (cbb_pais.ItemIndex < 0) or
    (cbb_pais.ItemIndex >= listadoCodigoPaises.Count) then
    Exit;

  codPais := listadoCodigoPaises[cbb_pais.ItemIndex];
  daCambioMoneda(codPais);
end;

procedure TfrmDuplicarBase.daCambioMoneda(const codMonedaPais: string);
begin
  if codMonedaPais = '' then
    Exit;

  ObtenerTipoCambio(codMonedaPais);
end;

procedure TfrmDuplicarBase.ObtenerTipoCambio(const ACodPais: string);
var
  URL: string;
  Resp: IHTTPResponse;
begin
  URL := 'https://api.exchangerate.host/latest?base=' + ACodPais + '&symbols=USD';

  try
    Resp := FHttp.Get(URL);

    if Resp.StatusCode = 200 then
      ProcesarJSONCambio(Resp.ContentAsString(TEncoding.UTF8), ACodPais)
    else
      raise Exception.Create('Error HTTP: ' + Resp.StatusCode.ToString);

  except
    on E: Exception do
      ShowMessage('Error obteniendo tipo de cambio: ' + E.Message);
  end;
end;

procedure TfrmDuplicarBase.ProcesarJSONCambio(const AJSON: string; const ACodPais: string);
var
  JSONObject, RatesObj: TJSONObject;
  RateValue: Double;
  moneda: string;
begin
  JSONObject := TJSONObject.ParseJSONValue(AJSON) as TJSONObject;
  if not Assigned(JSONObject) then
    Exit;

  try
    RatesObj := JSONObject.GetValue('rates') as TJSONObject;
    if not Assigned(RatesObj) then
      Exit;

    if not RatesObj.TryGetValue<Double>('USD', RateValue) then
      Exit;

    moneda := daDatosMonedaPais(ACodPais);
    lbl_moneda_pais.Text := ACodPais;
    lbl_moneda.Text :=
      FormatFloat('0.00', 1.00) + ' ' + ACodPais + ' (' + moneda + ') = ' +
      FormatFloat('0.0000', RateValue) + ' USD';

  finally
    JSONObject.Free;
  end;
end;

procedure TfrmDuplicarBase.FormShow(Sender: TObject);
var
  codPais: string;
begin
  // Estado inicial del formulario
  Width := ValorYReducido;
  lytBasesAdicionales.Visible := False;

  // Seleccionamos por defecto el país de Ecuador (si el índice es válido)
  if (posicionEcuador >= 0) and (posicionEcuador < cbb_pais.Count) then
    cbb_pais.ItemIndex := posicionEcuador
  else if cbb_pais.Count > 0 then
    cbb_pais.ItemIndex := 0;

  if (cbb_pais.ItemIndex >= 0) and
    (cbb_pais.ItemIndex < listadoCodigoPaises.Count) then
  begin
    codPais := listadoCodigoPaises[cbb_pais.ItemIndex];
    daCambioMoneda(codPais);
  end;
end;

{ ==== GESTIÓN DE BASES ADICIONALES Y GRIDS ================================== }

procedure TfrmDuplicarBase.chk_adicionarBasesChange(Sender: TObject);
begin
  limpiaGridSeleccionadas;

  if chk_adicionarBases.IsChecked then
  begin
    // Modo "adicionar bases": mostramos panel adicional y ensanchamos el form
    lytBasesAdicionales.Visible := True;
    Width := valorYDuplicar;
    populaGridBaseDatosDisponibles;
  end
  else
  begin
    // Modo "una sola base": ocultamos panel de bases adicionales
    lytBasesAdicionales.Visible := False;
    Width := ValorYReducido;
  end;
end;

procedure TfrmDuplicarBase.chk_soloBasesPadresChange(Sender: TObject);
begin
  // Activa/desactiva filtro de solo bases padre (sin presupuesto)
  populaGridBaseDatosDisponibles;
end;

procedure TfrmDuplicarBase.grid_BasesDisponiblesColumnSized(Sender: TObject;
  ACol: Integer; NewWidth: Single);
begin
  // No permitir columnas demasiado estrechas
  if grid_BasesDisponibles.Columns[ACol].Width < 40 then
    grid_BasesDisponibles.Columns[ACol].Width := 40;
end;

procedure TfrmDuplicarBase.grid_BasesDisponiblesDblClick(Sender: TObject);
var
  posicion: Integer;
  codBase: string;
  nombre: string;
  descripcion: string;
  fecha: string;
  datos: string;
  X: Integer;
  tmpstr: string;
  adicionar: Boolean;
  filaNueva: Integer;
begin
  posicion := grid_BasesDisponibles.Selection.StartRow;

  // No hacer nada si se hace doble clic en la cabecera o fuera de rango
  if (posicion <= 0) or (posicion >= grid_BasesDisponibles.RowCount) then
    Exit;

  // Datos a importar según el checkbox de APUS
  if chk_ImportarAPUS.IsChecked then
    datos := 'Todo'
  else
    datos := 'Recursos';

  codBase := grid_BasesDisponibles.Cells[1, posicion];
  if codBase = '' then
    Exit;

  // Si no estamos añadiendo bases, solo se permite una: limpiamos antes
  if not chk_adicionarBases.IsChecked then
    limpiaGridSeleccionadas;

  // Comprobar que la base no esté ya seleccionada (filas > 0)
  adicionar := True;
  X := 1;
  while (X < grid_BasesSeleccionadas.RowCount) and adicionar do
  begin
    tmpstr := grid_BasesSeleccionadas.Cells[1, X];
    if tmpstr = codBase then
      adicionar := False;
    Inc(X);
  end;

  if not adicionar then
    Exit;

  // Obtenemos datos de la base seleccionada
  nombre := grid_BasesDisponibles.Cells[2, posicion];
  descripcion := grid_BasesDisponibles.Cells[3, posicion];
  fecha := grid_BasesDisponibles.Cells[4, posicion];

  // Añadimos nueva fila al grid de seleccionadas
  filaNueva := grid_BasesSeleccionadas.RowCount;
  grid_BasesSeleccionadas.RowCount := filaNueva + 1;

  tmpstr := IntToStr(filaNueva);
  tmpstr := ponerCerosInicio(tmpstr, 3);

  grid_BasesSeleccionadas.Cells[0, filaNueva] := tmpstr;
  grid_BasesSeleccionadas.Cells[1, filaNueva] := codBase;
  grid_BasesSeleccionadas.Cells[2, filaNueva] := nombre;
  grid_BasesSeleccionadas.Cells[3, filaNueva] := descripcion;
  grid_BasesSeleccionadas.Cells[4, filaNueva] := datos;
  grid_BasesSeleccionadas.Cells[5, filaNueva] := fecha;

  // Ajustamos columnas
  grid_BasesSeleccionadas.AutoSizeColumn(1);
  grid_BasesSeleccionadas.AutoSizeColumn(2);
  grid_BasesSeleccionadas.AutoSizeColumn(3);
  grid_BasesSeleccionadas.AutoSizeColumn(4);
  grid_BasesSeleccionadas.AutoSizeColumn(5);
end;

procedure TfrmDuplicarBase.limpiaGridDisponibles;
begin
  grid_BasesDisponibles.ClearNormalCells;
  grid_BasesDisponibles.RowCount := 1;

  grid_BasesDisponibles.Cells[0, 0] := '#';
  grid_BasesDisponibles.Cells[1, 0] := 'Codigo';
  grid_BasesDisponibles.Cells[2, 0] := 'Nombre';
  grid_BasesDisponibles.Cells[3, 0] := 'Descripcion';
  grid_BasesDisponibles.Cells[4, 0] := 'Ult. Actualización';
end;

procedure TfrmDuplicarBase.limpiaGridSeleccionadas;
begin
  grid_BasesSeleccionadas.ClearNormalCells;
  grid_BasesSeleccionadas.RowCount := 1;

  grid_BasesSeleccionadas.Cells[0, 0] := '#';
  grid_BasesSeleccionadas.Cells[1, 0] := 'Codigo';
  grid_BasesSeleccionadas.Cells[2, 0] := 'Nombre';
  grid_BasesSeleccionadas.Cells[3, 0] := 'Descripcion';
  grid_BasesSeleccionadas.Cells[4, 0] := 'Datos Importar';
  grid_BasesSeleccionadas.Cells[5, 0] := 'Ult. Actualización';
end;

procedure TfrmDuplicarBase.populaGridBaseDatosDisponibles;
var
  qry: TUniQuery;
  fila: Integer;
  tmpstr: string;
  fecha: TDateTime;
  soloPadres: Boolean;
begin
  soloPadres := chk_soloBasesPadres.IsChecked;

  limpiaGridDisponibles;
  fila := 1;

  qry := TUniQuery.Create(nil);
  try
    qry.Connection := DModule_1.con2;
    qry.Close;
    qry.SQL.Clear;

    if soloPadres then
    begin
      // Solo bases padre (sin presupuesto asignado)
      qry.SQL.Add('select * from bases where presupuestoAsignado is null ');
    end
    else
    begin
      // Todas las bases
      qry.SQL.Add('select * from bases ');
    end;

    qry.SQL.Add('order by fechaHoraModificacion asc');
    qry.Open; // SELECT -> Open

    while not qry.Eof do
    begin
      grid_BasesDisponibles.RowCount := fila + 1;

      tmpstr := ponerCerosInicio(IntToStr(fila), 3);
      grid_BasesDisponibles.Cells[0, fila] := tmpstr;
      grid_BasesDisponibles.Cells[1, fila] :=
        qry.FieldByName('CodBase').AsString;
      grid_BasesDisponibles.Cells[2, fila] := qry.FieldByName('Nombre')
        .AsString;
      grid_BasesDisponibles.Cells[3, fila] :=
        qry.FieldByName('descripcion').AsString;

      fecha := qry.FieldByName('fechaHoraModificacion').AsDateTime;
      tmpstr := FormatDateTime('dd/mm/yyyy hh:nn', fecha);
      grid_BasesDisponibles.Cells[4, fila] := tmpstr;

      Inc(fila);
      qry.Next;
    end;

    grid_BasesDisponibles.RowCount := fila;
    grid_BasesDisponibles.AutoSizeColumn(1);
    grid_BasesDisponibles.AutoSizeColumn(2);
    grid_BasesDisponibles.AutoSizeColumn(3);
    grid_BasesDisponibles.AutoSizeColumn(4);
  finally
    qry.Free;
  end;
end;

procedure TfrmDuplicarBase.MenuItem1Click(Sender: TObject);
var
  posicion: Integer;
  X: Integer;
begin
  posicion := grid_BasesSeleccionadas.Selection.StartRow;
  if (posicion > 0) and (posicion < grid_BasesSeleccionadas.RowCount) then
  begin
    grid_BasesSeleccionadas.DeleteRow(posicion);
    for X := 1 to grid_BasesSeleccionadas.RowCount - 1 do
      grid_BasesSeleccionadas.Cells[0, X] := ponerCerosInicio(IntToStr(X), 3);
  end;
end;

{ ==== CREACIÓN Y DUPLICADO DE BASES ======================================== }
procedure TfrmDuplicarBase.GuardaBasesDatos;
var
  qry: TUniQuery;
  listadoBases: TStringList;
  codNuevaBase: string;
  FechaHora: TDateTime;
  baseCreada: Boolean;
  basePadre: string;

  // ===== Helpers (locales) =====

  function IsValidIdent(const S: string): Boolean;
  var
    i: Integer;
    c: Char;
  begin
    Result := S <> '';
    if not Result then Exit;

    for i := 1 to Length(S) do
    begin
      c := S[i];
      if not (
        ((c >= 'A') and (c <= 'Z')) or
        ((c >= 'a') and (c <= 'z')) or
        ((c >= '0') and (c <= '9')) or
        (c = '_')
      ) then
        Exit(False);
    end;
  end;

  function NormalizeCols(const Cols: TArray<string>): TArray<string>;
  var
    seen: TDictionary<string, Byte>;
    outList: TList<string>;
    s, raw, k: string;
  begin
    seen := TDictionary<string, Byte>.Create;
    outList := TList<string>.Create;
    try
      for s in Cols do
      begin
        raw := Trim(s);
        if raw = '' then
          Continue;

        if not IsValidIdent(raw) then
          Continue;

        k := LowerCase(raw);
        if seen.ContainsKey(k) then
          Continue;

        seen.Add(k, 1);
        outList.Add(raw);
      end;

      Result := outList.ToArray;
    finally
      outList.Free;
      seen.Free;
    end;
  end;

  function JoinCSV(const Cols: TArray<string>; const Prefix: string = ''): string;
  var
    i: Integer;
  begin
    Result := '';
    for i := 0 to High(Cols) do
    begin
      if i > 0 then
        Result := Result + ',';
      Result := Result + Prefix + Cols[i];
    end;
  end;

  function JoinSelectExpr_CI(const Cols: TArray<string>): string;
  var
    i: Integer;
    col, expr: string;
  begin
    // SOLO cambia codBase (case-insensitive). Todo lo demás queda igual.
    Result := '';
    for i := 0 to High(Cols) do
    begin
      col := Cols[i];
      expr := col;

      if SameText(col, 'codBase') then
        expr := ':newCodBase';

      if i > 0 then
        Result := Result + ',';
      Result := Result + expr;
    end;
  end;

  procedure EnsureConn;
  begin
    if not DModule_1.con2.Connected then
      DModule_1.con2.Connect;
  end;

  procedure FillSelectedBases;
  var
    tmp: string;
    Y: Integer;
  begin
    listadoBases.Clear;
    for Y := 1 to grid_BasesSeleccionadas.RowCount - 1 do
    begin
      tmp := Trim(grid_BasesSeleccionadas.Cells[1, Y]);
      if tmp <> '' then
        listadoBases.Add(tmp);
    end;
  end;

  function CountRows(const TableName: string; const ACodBase: string): Int64;
  begin
    qry.Close;
    qry.SQL.Clear;
    qry.SQL.Add('select count(*) c from ' + TableName + ' where codBase = :b');
    qry.ParamByName('b').AsString := ACodBase;
    qry.Open;
    Result := qry.FieldByName('c').AsLargeInt;
  end;

  procedure DoInsertBases;
  var
    ColsBases: TArray<string>;
    tmpIndirectos: string;
  begin
    // Inserta la base "bases" nueva
    ColsBases := NormalizeCols(
      ExistingColumns(qry.Connection, 'bases', [
        'codBase', 'nombre', 'descripcion', 'indirectos', 'UTiempo', 'TRendimiento',
        'seguridadIndustrial', 'observaciones', 'fechahoraCreacion', 'FechaHoraModificacion',
        'pais', 'cambioAplicado', 'sincronizada', 'moneda', 'simboloMoneda', 'basesPadres',
        'presupuestoAsignado'
      ])
    );

    if Length(ColsBases) = 0 then
      raise Exception.Create('No hay columnas válidas en "bases" para insertar.');

    qry.Close;
    qry.SQL.Clear;
    qry.SQL.Add('INSERT INTO bases (' + JoinCSV(ColsBases) + ')');
    qry.SQL.Add('VALUES (' + JoinCSV(ColsBases, ':') + ')');
    qry.Prepare;

    if qry.Params.FindParam('codBase') <> nil then
      qry.ParamByName('codBase').AsString := codNuevaBase;

    if qry.Params.FindParam('nombre') <> nil then
      qry.ParamByName('nombre').AsString := edt_NombreBase.Text;

    if qry.Params.FindParam('descripcion') <> nil then
      qry.ParamByName('descripcion').AsString := edt_Descripcion.Text;

    if qry.Params.FindParam('indirectos') <> nil then
    begin
      tmpIndirectos := decimal_correcto(edt_Indirectos.Text);
      qry.ParamByName('indirectos').AsFloat := StrToFloatDef(tmpIndirectos, 0);
    end;

    if qry.Params.FindParam('TRendimiento') <> nil then
    begin
      if (cbb_Rendimiento.ItemIndex >= 0) and (cbb_Rendimiento.ItemIndex < cbb_Rendimiento.Count) then
        qry.ParamByName('TRendimiento').AsString := cbb_Rendimiento.Items[cbb_Rendimiento.ItemIndex]
      else
        qry.ParamByName('TRendimiento').AsString := '';
    end;

    if qry.Params.FindParam('UTiempo') <> nil then
    begin
      if (cbb_UTiempos.ItemIndex >= 0) and (cbb_UTiempos.ItemIndex < cbb_UTiempos.Count) then
        qry.ParamByName('UTiempo').AsString := cbb_UTiempos.Items[cbb_UTiempos.ItemIndex]
      else
        qry.ParamByName('UTiempo').AsString := '';
    end;

    if qry.Params.FindParam('observaciones') <> nil then
      qry.ParamByName('observaciones').AsString := mmo_Observaciones.Text;

    if qry.Params.FindParam('fechahoraCreacion') <> nil then
      qry.ParamByName('fechahoraCreacion').AsDateTime := FechaHora;

    if qry.Params.FindParam('FechaHoraModificacion') <> nil then
      qry.ParamByName('FechaHoraModificacion').AsDateTime := FechaHora;

    if qry.Params.FindParam('seguridadIndustrial') <> nil then
      qry.ParamByName('seguridadIndustrial').AsBoolean := chk_SeguridadIndustrial.IsChecked;

    if qry.Params.FindParam('pais') <> nil then
    begin
      if (cbb_pais.ItemIndex >= 0) and (cbb_pais.ItemIndex < cbb_pais.Count) then
        qry.ParamByName('pais').AsString := cbb_pais.Items[cbb_pais.ItemIndex]
      else
        qry.ParamByName('pais').AsString := '';
    end;

    if qry.Params.FindParam('cambioAplicado') <> nil then
      qry.ParamByName('cambioAplicado').AsString := lbl_moneda.Text;

    if qry.Params.FindParam('moneda') <> nil then
      qry.ParamByName('moneda').AsString := lbl_moneda_pais.Text;

    if qry.Params.FindParam('simboloMoneda') <> nil then
    begin
      if FindComponent('lbl_simbolo_moneda') <> nil then
        qry.ParamByName('simboloMoneda').AsString := (FindComponent('lbl_simbolo_moneda') as TLabel).Text
      else
        qry.ParamByName('simboloMoneda').AsString := '';
    end;

    if qry.Params.FindParam('sincronizada') <> nil then
      qry.ParamByName('sincronizada').AsBoolean := False;

    if qry.Params.FindParam('basesPadres') <> nil then
    begin
      // si quieres registrar el listado, mantenlo así
      if chk_adicionarBases.IsChecked then
        qry.ParamByName('basesPadres').AsString := listadoBases.Text
      else
        qry.ParamByName('basesPadres').AsString := '';
    end;

    // CLAVE: para que sea "padre" en el selector (IS NULL)
    if qry.Params.FindParam('presupuestoAsignado') <> nil then
      qry.ParamByName('presupuestoAsignado').Clear;

    qry.ExecSQL;
  end;

  procedure CopyTableOnlyCodBase_CI(const TableName: string; const CandidateCols: array of string);
  var
    Cols: TArray<string>;
    InsertCols, SelectExpr: string;
    srcCount, dstCount: Int64;
  begin
    Cols := NormalizeCols(ExistingColumns(qry.Connection, TableName, CandidateCols));
    if Length(Cols) = 0 then
      Exit;

    // Precheck: si el padre no tiene filas, no copies
    srcCount := CountRows(TableName, basePadre);
    if srcCount = 0 then
      Exit;

    InsertCols := JoinCSV(Cols);
    SelectExpr := JoinSelectExpr_CI(Cols);

    qry.Close;
    qry.SQL.Clear;
    qry.SQL.Add('INSERT INTO ' + TableName + ' (' + InsertCols + ')');
    qry.SQL.Add('SELECT ' + SelectExpr);
    qry.SQL.Add('FROM ' + TableName);
    qry.SQL.Add('WHERE codBase = :basePadre');

    qry.ParamByName('newCodBase').AsString := codNuevaBase;
    qry.ParamByName('basePadre').AsString := basePadre;

    qry.ExecSQL;

    // Postcheck: asegura que no quede “huérfano/vacío” por fallo de mapeo
    dstCount := CountRows(TableName, codNuevaBase);
    if dstCount = 0 then
      raise Exception.Create('Copia fallida en "' + TableName + '": el padre tiene datos pero la base nueva quedó vacía.');
  end;

  procedure CopyAllTables;
  begin
    // IMPORTANTE:
    // - NO tocamos Categoria_base / codCategoriaBase / CodCategoria
    // - NO offsets
    // - SOLO se cambia codBase (case-insensitive)

    CopyTableOnlyCodBase_CI('categoriaapus', [
      'Categoria_base', 'Ciu', 'codBase', 'NombreBase', 'Descripcion', 'codExterno',
      'comentarios', 'Usado', 'sincronizada', 'origen', 'fechaCreacion',
      'CodExterno', 'Comentarios' // por si tu DB usa estas mayúsculas
    ]);

    CopyTableOnlyCodBase_CI('recursos', [
      'idUnico', 'codBase', 'codRecurso', 'codRecursoCompleto', 'codCategoriaBase', 'codSubCategoria',
      'Descripcion', 'descripcion', 'unidad', 'precio', 'precioLocal', 'preciolocal', 'precioBase',
      'codCPC', 'tipoCPC', 'porcentajeCPC',
      'Especificaciones', 'Especificaciones2', 'especificaciones', 'especificaciones2',
      'fechaHoraCreacion', 'ultimaModificacion',
      'codDistribuidor', 'Distribuidor', 'moneda'
    ]);

    if chk_ImportarAPUS.IsChecked then
    begin
      CopyTableOnlyCodBase_CI('apus', [
        'codBase', 'codCategoriaAPU', 'codRecursoAPU', 'CategoriaAPU', 'CodAPU', 'codAPUAlternativo',
        'Descripcion', 'Unidad',
        'Rendimiento', 'RendimientoTodoAnalisis', 'RendimientoTodoEscenario',
        'FechaHoraCreacion', 'ultimaModificacion',
        'CostoDirectoTotal', 'CostoIndirectoTotal', 'PorcentajeCostoIndirecto', 'PrecioUnitarioTotal',
        'moneda', 'codCPC', 'pendienteRevision', 'rendimientoHUnidad', 'nhCuadrillas', 'anidado'
      ]);

      CopyTableOnlyCodBase_CI('apus_items', [
        'codBase', 'CodAPU', 'codAPUAlternativo', 'CodCategoria', 'codSubCategoria',
        'idUnicoRecurso', 'codRecurso', 'codRecursoCompleto',
        'Descripcion', 'Unidad', 'Precio', 'moneda',
        'CantidadUnidad', 'Rendimiento', 'Total', 'porcentaje',
        'codCPC', 'TipoCPC', 'porcentajeCPC', 'termino'
      ]);
    end;
  end;

begin
  qry := TUniQuery.Create(nil);
  listadoBases := TStringList.Create;
  baseCreada := False;

  FechaHora := Now;
  codNuevaBase := 'DB' + generaCodigoUnicoShort;

  try
    FillSelectedBases;

    qry.Connection := DModule_1.con2;
    EnsureConn;

    // Base padre = la primera seleccionada (si hay)
    if listadoBases.Count > 0 then
      basePadre := listadoBases[0]
    else
      basePadre := '';

    qry.Connection.StartTransaction;
    try
      DoInsertBases;

      if basePadre <> '' then
      begin
        CopyAllTables;
      end
      else
      begin
        // Si no hay padre, crea estructura inicial
        CreaSubCategoriasIniciales(codNuevaBase, edt_NombreBase.Text);
      end;

      qry.Connection.Commit;
      baseCreada := True;

    except
      on E: Exception do
      begin
        if qry.Connection.InTransaction then
          qry.Connection.Rollback;
        raise Exception.Create('GuardaBasesDatos falló (rollback completo).' + sLineBreak + E.Message);
      end;
    end;

  finally
    listadoBases.Free;
    qry.Free;

    // Activa y refresca UI solo si todo salió bien
    if baseCreada then
    begin
      activaBaseDatos(codNuevaBase);
      if base_activa.nombre <> '' then
      begin
        muestraOPC(True);
        limpiaOPC1;
        frmMain.rect_OPC1_Subcategorias.Fill.Bitmap.Bitmap :=
          frmMain.img_OPC1_Subcategorias.MultiResBitmap[0].Bitmap;
        frmMain.moverTab(1);
      end;
    end;
  end;
end;

{ ==== INTERFAZ: BOTONES, ARRASTRE, EFECTOS ================================== }

procedure TfrmDuplicarBase.rect_1MouseDown(Sender: TObject;
  Button: TMouseButton; Shift: TShiftState; X, Y: Single);
begin
  // Permite arrastrar la ventana desde la barra superior
  Self.StartWindowDrag;
end;

procedure TfrmDuplicarBase.rect_AceptarClick(Sender: TObject);
begin
  iGlow_Aceptar.Enabled := False;
  GuardaBasesDatos;
  ModalResult := mrOk;
end;

procedure TfrmDuplicarBase.rect_AceptarMouseEnter(Sender: TObject);
begin
  iGlow_Aceptar.Enabled := True;
end;

procedure TfrmDuplicarBase.rect_AceptarMouseLeave(Sender: TObject);
begin
  iGlow_Aceptar.Enabled := False;
end;

procedure TfrmDuplicarBase.rect_CancelarClick(Sender: TObject);
begin
  iGlow_Cancelar.Enabled := False;
  ModalResult := mrCancel;
end;

procedure TfrmDuplicarBase.rect_CancelarMouseEnter(Sender: TObject);
begin
  iGlow_Cancelar.Enabled := True;
end;

procedure TfrmDuplicarBase.rect_CancelarMouseLeave(Sender: TObject);
begin
  iGlow_Cancelar.Enabled := False;
end;

end.
