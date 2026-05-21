unit uImportarRecursos2;

interface

uses
  System.SysUtils, System.Types, System.UITypes, System.Classes, System.Variants, FMX.DialogService,
  FMX.Types, FMX.Controls, FMX.Forms, FMX.Graphics, FMX.Dialogs, FMX.TMSFNCTypes, System.JSON,
  FMX.TMSFNCUtils, FMX.TMSFNCGraphics, FMX.TMSFNCGraphicsTypes, FMX.TMSFNCGridCell, system.Math,
  FMX.TMSFNCGridOptions, FMX.Menus, FMX.Effects, FMX.StdCtrls, FMX.TMSFNCCheckedTreeView,
  FMX.Controls.Presentation, FMX.TMSFNCCustomScrollControl, FMX.TMSFNCGridData, FMX.Platform,
  FMX.TMSFNCCustomGrid, FMX.TMSFNCGrid, FMX.TMSFNCPanel, FMX.TMSFNCSplitter, FMX.TMSFNCCustomControl,
  FMX.TMSFNCTreeViewBase, FMX.TMSFNCTreeViewData, Uni, FMX.TMSFNCCustomTreeView, FMX.TMSFNCTreeView,
  FMX.Objects, FMX.Layouts, FMX.TMSFNCCustomPicker, FMX.TMSFNCComboBox, FMX.TMSFNCListBox,
  FMX.ListBox, Data.DB, System.DateUtils;

type
  dat_repeatNode = record
    nodo: TTMSFNCTreeViewNode;
    Estado: Boolean;
  end;

type
  dat_TDBs = record
    codBase: string;
    nombre: string;
  end;

type
  TfrmImportarRecursos2 = class(TForm)
    lyt_Background: TLayout;
    lyt_Body: TLayout;
    rct_2: TRectangle;
    lyt_3: TLayout;
    rct_3: TRectangle;
    lyt_6: TLayout;
    rct_BackgroundGris: TRectangle;
    lyt_7: TLayout;
    lbl_banner2: TLabel;
    lyt_footer: TLayout;
    lbl_modo: TLabel;
    lbl_moneda_pais: TLabel;
    rct__Aceptar: TRectangle;
    iGlow_Aceptar: TInnerGlowEffect;
    rct_Cancelar: TRectangle;
    iGlow_Cancelar: TInnerGlowEffect;
    lyt_header: TLayout;
    rct_1: TRectangle;
    lbl_banner1: TLabel;
    lyt1: TLayout;
    lyt_Izquierda: TLayout;
    tmsfncspltr1: TTMSFNCSplitter;
    lyt_Derecha: TLayout;
    pnl_1: TTMSFNCPanel;
    pnl_2: TTMSFNCPanel;
    TreeView_SubCategorias: TTMSFNCTreeView;
    lyt_BasesDisponibles: TLayout;
    lyt: TLayout;
    pnl_11: TTMSFNCPanel;
    chk_BasesPadres: TCheckBox;
    cbb_BasesDisponibles: TComboBox;
    lyt5: TLayout;
    lyt6: TLayout;
    TreeView_SubCategoriaImportar: TTMSFNCTreeView;
    tmsfncspltr2: TTMSFNCSplitter;
    lyt4: TLayout;
    pnl_12: TTMSFNCPanel;
    grid_RecursosImportar: TTMSFNCGrid;
    pmRecursosImportar: TPopupMenu;
    MenuItem1: TMenuItem;
    procedure rct_1MouseDown(Sender: TObject; Button: TMouseButton; Shift: TShiftState; X, Y: Single);
    procedure rct_CancelarClick(Sender: TObject);
    procedure rct__AceptarClick(Sender: TObject);
    procedure cbb_BasesDisponiblesChange(Sender: TObject);
    procedure TreeView_SubCategoriaImportarNodeClick(Sender: TObject; ANode: TTMSFNCTreeViewVirtualNode);
    procedure grid_RecursosImportarMouseDown(Sender: TObject; Button: TMouseButton; Shift:
      TShiftState; X, Y: Single);
    procedure grid_RecursosImportarMouseEnter(Sender: TObject);
    procedure grid_RecursosImportarMouseMove(Sender: TObject; Shift: TShiftState; X, Y: Single);
    procedure grid_RecursosImportarMouseUp(Sender: TObject; Button: TMouseButton; Shift: TShiftState;
      X, Y: Single);
    procedure TreeView_SubCategoriasDragDrop(Sender: TObject; const Data: TDragObject; const Point: TPointF);
    procedure TreeView_SubCategoriasDragOver(Sender: TObject; const Data: TDragObject; const Point:
      TPointF; var Operation: TDragOperation);
    procedure lyt_IzquierdaResized(Sender: TObject);
    procedure chk_BasesPadresChange(Sender: TObject);
    procedure MenuItem1Click(Sender: TObject);
    procedure grid_RoperecursosImportarDragOver(Sender: TObject; const Data: TDragObject; const
      Point: TPointF; var Operation: TDragOperation);
    procedure FormShow(Sender: TObject);
  private
    { Private declarations }
    codBaseImportar: string;
    codCategoriaImportar: string;
    listadoBasesImportar: array of dat_TDBs;
    cOrigenDrag: string;
    FLastDragJSON: string;
    FMouseDown: Boolean;
    FLoadingBases: Boolean;
    FDragging: Boolean;

    procedure EnsureSubCategoriasColumns;
    procedure MuestrasCategoriasDBImportar(posicionBase: Integer);
    procedure SeleccionarRecursosCategoriaImportar(nodo: TTMSFNCTreeViewNode);
    procedure muestraRecursosaImportar(const codCategoria, codSubcategoria: string);
    procedure cargarRecursosSubCategorias();
    procedure completaRecursosNodo(nodo: TTMSFNCTreeViewNode; codCategoriaBase: string);
    procedure guardarRecursosImportados();
    function daCodCategoriaPadre(descripcion: string): string;
    function daSubCategoriaInicial(nodo: TTMSFNCTreeViewVirtualNode): string;
    function compruebaRecursoRepetido(nodoDestino: TTMSFNCTreeViewNode; categoriaBusqueda,
      descripcionRecurso, unidadRecurso: string): TTMSFNCTreeViewNode;
    function PosicionarenNodo(const descripcion: string): TTMSFNCTreeViewNode;
    function compruebaRecursoRepetido2(nodoDestino: TTMSFNCTreeViewNode; categoriaBusqueda: string;
      descripcionRecurso: string; unidadRecurso: string): dat_repeatNode;
    function daCategoriaPadreNodo(nodo: TTMSFNCTreeViewNode; nivelPadre: Integer): TTMSFNCTreeViewNode;
    function daCodSubCategoriasRecursos(const descripcion, codCategoriaBase: string): string;
    function dacodRecursoNuevo(const codCategoria, codSubcategoria: string): string;
    procedure cargaDBs();
    procedure cargaSubcategoriasDB();
    function SafeSetTextNode(ANode: TTMSFNCTreeViewNode; Col: Integer; const Value: string): Boolean;
    function JsonStr(const O: TJSONObject; const Name: string): string;
    function Norm(const S: string): string;
    function NextCodRecursoSeguro(const ACodBase, ACodCategoriaBase, ACodSubCategoria: string): string;
  public
    { Public declarations }

  end;

var
  frmImportarRecursos2: TfrmImportarRecursos2;

function DragDataAsString(const D: TDragObject): string;
procedure SetParamDateTime(Q: TUniQuery; const ParamName: string; const Value: TDateTime);
function ToMySQLFloatStr(const S: string): string;

implementation

{$R *.fmx}

uses
  DM1, uMain;

function ToMySQLFloatStr(const S: string): string;
var
  t: string;
begin
  t := Trim(S);
  if t = '' then
    Exit('0');

  // Asegura separador decimal con punto
  t := StringReplace(t, ',', '.', [rfReplaceAll]);

  Result := t;
end;

procedure SetParamDateTime(Q: TUniQuery; const ParamName: string; const Value: TDateTime);
var
  P: TParam;
begin
  P := Q.ParamByName(ParamName);
  P.DataType := ftDateTime;
  P.AsDateTime := Value;
end;

procedure TfrmImportarRecursos2.EnsureSubCategoriasColumns;
var
  i: Integer;
  col: TTMSFNCTreeViewColumn;
begin
  if not Assigned(TreeView_SubCategorias) then
    Exit;

  // Asegura 9 columnas (0..8)
  while TreeView_SubCategorias.Columns.Count < 9 do
  begin
    col := TreeView_SubCategorias.Columns.Add;
    col.Width := 100; // valor por defecto, ajusta si quieres
  end;

  // Textos (puedes ajustar)
  TreeView_SubCategorias.Columns[0].Text := 'Recurso';
  TreeView_SubCategorias.Columns[1].Text := 'idUnico';
  TreeView_SubCategorias.Columns[2].Text := 'Unidad';
  TreeView_SubCategorias.Columns[3].Text := 'Precio';
  TreeView_SubCategorias.Columns[4].Text := 'CodCPC';
  TreeView_SubCategorias.Columns[5].Text := 'Especificaciones';
  TreeView_SubCategorias.Columns[6].Text := 'Flag';
  TreeView_SubCategorias.Columns[7].Text := 'TipoCPC';
  TreeView_SubCategorias.Columns[8].Text := '%CPC';

  // Ocultar columnas técnicas (ajusta a tu gusto)
  TreeView_SubCategorias.Columns[1].Width := 0; // idUnico oculto
  TreeView_SubCategorias.Columns[4].Width := 0; // codCPC si no lo quieres visible
  TreeView_SubCategorias.Columns[5].Width := 0; // especificaciones si no lo quieres visible
  TreeView_SubCategorias.Columns[6].Width := 0; // flag "Actualizar" oculto
  TreeView_SubCategorias.Columns[7].Width := 0; // tipoCPC oculto
  TreeView_SubCategorias.Columns[8].Width := 0; // porcentaje oculto

  // AutoSize de las visibles
  TreeView_SubCategorias.AutoSizeColumn(0);
  TreeView_SubCategorias.AutoSizeColumn(2);
  TreeView_SubCategorias.AutoSizeColumn(3);
end;

function TfrmImportarRecursos2.NextCodRecursoSeguro(
  const ACodBase, ACodCategoriaBase, ACodSubCategoria: string): string;
var
  Q: TUniQuery;
  lastVal, nextVal: Integer;
  maxCod: Integer;
  catI, subI: Integer;

  function StrToIntSafe(const S: string): Integer;
  begin
    Result := StrToIntDef(Trim(S), 0);
  end;

  function GetMaxCodRecurso: Integer;
  begin
    Q.Close;
    Q.SQL.Text :=
      'SELECT IFNULL(MAX(codRecurso), 0) AS maxCod ' +
      'FROM recursos ' +
      'WHERE codBase = :codBase AND codCategoriaBase = :cat AND codSubCategoria = :sub';
    Q.ParamByName('codBase').AsString := ACodBase;
    Q.ParamByName('cat').AsInteger := catI;
    Q.ParamByName('sub').AsInteger := subI;
    Q.Open;
    Result := Q.FieldByName('maxCod').AsInteger;
  end;

begin
  Result := '1';

  if Trim(ACodBase) = '' then
    Exit;
  catI := StrToIntSafe(ACodCategoriaBase);
  subI := StrToIntSafe(ACodSubCategoria);
  if (catI <= 0) or (subI <= 0) then
    Exit;

  if not Assigned(DModule_1) or not Assigned(DModule_1.con2) then
    Exit;

  // Debe haber transacción activa (por el FOR UPDATE)
  if not DModule_1.con2.InTransaction then
    raise Exception.Create('NextCodRecursoSeguro requiere transacción activa');

  Q := TUniQuery.Create(nil);
  try
    Q.Connection := DModule_1.con2;

    // 1) Bloquea/lee secuencia
    Q.SQL.Text :=
      'SELECT lastCod ' +
      'FROM recursos_seq ' +
      'WHERE codBase = :codBase AND codCategoriaBase = :cat AND codSubCategoria = :sub ' +
      'FOR UPDATE';
    Q.ParamByName('codBase').AsString := ACodBase;
    Q.ParamByName('cat').AsInteger := catI;
    Q.ParamByName('sub').AsInteger := subI;
    Q.Open;

    if Q.Eof then
    begin
      // 2) NO existe fila de secuencia: inicializa con el MAX real de recursos
      maxCod := GetMaxCodRecurso;

      Q.Close;
      Q.SQL.Text :=
        'INSERT INTO recursos_seq (codBase, codCategoriaBase, codSubCategoria, lastCod) ' +
        'VALUES (:codBase, :cat, :sub, :lastCod)';
      Q.ParamByName('codBase').AsString := ACodBase;
      Q.ParamByName('cat').AsInteger := catI;
      Q.ParamByName('sub').AsInteger := subI;
      Q.ParamByName('lastCod').AsInteger := maxCod;

      try
        Q.ExecSQL;
      except
        on E: Exception do
        begin
          // Si dos hilos intentan crear la fila a la vez, ignora el duplicado
          if (Pos('Duplicate', E.Message) = 0) and (Pos('duplicate', E.Message) = 0) then
            raise;
        end;
      end;

      // 3) Relee bloqueando
      Q.Close;
      Q.SQL.Text :=
        'SELECT lastCod ' +
        'FROM recursos_seq ' +
        'WHERE codBase = :codBase AND codCategoriaBase = :cat AND codSubCategoria = :sub ' +
        'FOR UPDATE';
      Q.ParamByName('codBase').AsString := ACodBase;
      Q.ParamByName('cat').AsInteger := catI;
      Q.ParamByName('sub').AsInteger := subI;
      Q.Open;
    end;

    lastVal := Q.Fields[0].AsInteger;

    // 4) SIEMPRE resincroniza contra MAX(codRecurso) por si la secuencia quedó atrasada
    maxCod := GetMaxCodRecurso;
    if maxCod > lastVal then
      lastVal := maxCod;

    nextVal := lastVal + 1;

    // 5) Actualiza secuencia
    Q.Close;
    Q.SQL.Text :=
      'UPDATE recursos_seq ' +
      'SET lastCod = :nextVal ' +
      'WHERE codBase = :codBase AND codCategoriaBase = :cat AND codSubCategoria = :sub';
    Q.ParamByName('nextVal').AsInteger := nextVal;
    Q.ParamByName('codBase').AsString := ACodBase;
    Q.ParamByName('cat').AsInteger := catI;
    Q.ParamByName('sub').AsInteger := subI;
    Q.ExecSQL;

    Result := IntToStr(nextVal);

  finally
    Q.Free;
  end;
end;

function DragDataAsString(const D: TDragObject): string;
begin
  Result := '';
  if D.Data.IsEmpty then
    Exit;

  if D.Data.IsType<string> then
    Result := D.Data.AsString
  else if D.Data.IsType<UnicodeString> then
    Result := D.Data.AsType<UnicodeString>
  else if D.Data.IsType<AnsiString> then
    Result := string(D.Data.AsType<AnsiString>);
end;

function TfrmImportarRecursos2.SafeSetTextNode(ANode: TTMSFNCTreeViewNode; Col: Integer; const Value:
  string): Boolean;
begin
  Result := False;
  if not Assigned(ANode) then
    Exit;
  if not Assigned(TreeView_SubCategorias) then
    Exit;
  if (Col < 0) or (Col >= TreeView_SubCategorias.Columns.Count) then
    Exit;
  ANode.Text[Col] := Value;
  Result := True;
end;

function TfrmImportarRecursos2.Norm(const S: string): string;
begin
  Result := UpperCase(Trim(S));
end;

function TfrmImportarRecursos2.JsonStr(const O: TJSONObject; const Name: string): string;
var
  V: TJSONValue;
begin
  Result := '';
  if not Assigned(O) then
    Exit;
  V := O.GetValue(Name);
  if not Assigned(V) or V.Null then
    Exit;
  Result := V.Value;
end;
// =================================================

procedure TfrmImportarRecursos2.cargaDBs;
var
  qry: TUniQuery;
  X: Integer;
  totalWidth: Double;
  tmpstr: string;
begin
  SetLength(listadoBasesImportar, 0);
  cbb_BasesDisponibles.clear;
  TreeView_SubCategoriaImportar.ClearNodes;
  grid_RecursosImportar.ClearNormalCells;
  X := 0;
  qry := TUniQuery.Create(nil);
  try
    with qry do
    begin
      Connection := DModule_1.con2;
      Close;
      sql.Clear;
      sql.Add('select codBase, nombre from bases where codBase <> :codBase');
      if not chk_BasesPadres.IsChecked then
        sql.Add(' and presupuestoAsignado is null');
      sql.Add(' order by fechahoramodificacion desc');

      Prepare;
      ParamByName('codBase').AsString := base_activa.codBase;
      Open;

      X := 0;
      while not Eof do
      begin
        SetLength(listadoBasesImportar, X + 1);
        listadoBasesImportar[X].codBase := FieldByName('codBase').AsString;
        tmpstr := FieldByName('nombre').AsString;
        listadoBasesImportar[X].nombre := tmpstr;
        cbb_BasesDisponibles.Items.Add(tmpstr);
        Inc(X);
        Next;
      end;

    end;
  finally
    qry.Free;
    // Bloquear el evento mientras tocamos ItemIndex y cargamos categorías
    FLoadingBases := True;
    try
      // Evita reentrancia por DoChange
      cbb_BasesDisponibles.OnChange := nil;

      if cbb_BasesDisponibles.Items.Count > 0 then
      begin
        cbb_BasesDisponibles.ItemIndex := 0;
        TreeView_SubCategoriaImportar.ClearNodes;

        // Llamada directa (sin pasar por OnChange)
        MuestrasCategoriasDBImportar(cbb_BasesDisponibles.ItemIndex);
      end;
    finally
      // Restaura handler
      cbb_BasesDisponibles.OnChange := cbb_BasesDisponiblesChange;
      FLoadingBases := False;
    end;
  end;
end;

procedure TfrmImportarRecursos2.cargarRecursosSubCategorias;
var
  nodobase, nodo: TTMSFNCTreeViewNode;
  codCategoriaBase: string;
begin
  nodobase := TreeView_SubCategorias.Nodes[0];
  while Assigned(nodobase) do
  begin
    codCategoriaBase := daCodCategoriaPadre(nodobase.Text[0]);
    nodo := TreeView_SubCategorias.GetFirstChildNode(nodobase);
    if Assigned(nodo) then { Primer Elemento }
    begin
      completaRecursosNodo(nodo, codCategoriaBase);
      nodo := TreeView_SubCategorias.GetNextSiblingNode(nodo);
    end;
    while Assigned(nodo) do { Resto de Elementos }
    begin
      completaRecursosNodo(nodo, codCategoriaBase);
      nodo := TreeView_SubCategorias.GetNextSiblingNode(nodo);
    end;
    nodobase := TreeView_SubCategorias.GetNextSiblingNode(nodobase);
  end;
end;

procedure TfrmImportarRecursos2.cargaSubcategoriasDB;
const
  {(*}
  BASE_CATS: array[1..6] of string = (
    'Equipos y Herramientas',
    'Materiales',
    'Transporte',
    'Mano de Obra',
    'Seguridad Industrial',
    'Precios Unitarios'
  );
  {*)}
var
  qry: TUniQuery;
  i: Integer;
  RootNodes: array[1..6] of TTMSFNCTreeViewNode;
  nRoot, nChild: TTMSFNCTreeViewNode;
  ColumnCount: integer;

  procedure SafeSetupColumns;
  begin
    ColumnCount := TreeView_SubCategorias.Columns.Count;
    // Ajusta solo si existen
    if ColumnCount > 0 then
    begin
      TreeView_SubCategorias.Columns[0].Text := 'Recursos';
      TreeView_SubCategorias.AutoSizeColumn(0);
    end;

    if ColumnCount > 1 then
      TreeView_SubCategorias.Columns[1].Width := 0;

    if ColumnCount > 2 then
    begin
      TreeView_SubCategorias.Columns[2].Text := 'Unidad';
      TreeView_SubCategorias.Columns[2].Width := 0;
    end;

    if ColumnCount > 3 then
    begin
      TreeView_SubCategorias.Columns[3].Text := 'Costo';
      TreeView_SubCategorias.Columns[3].Width := 0;
    end;

    // Oculta el resto si existen
    if ColumnCount > 4 then
      TreeView_SubCategorias.Columns[4].Width := 0;
    if ColumnCount > 5 then
      TreeView_SubCategorias.Columns[5].Width := 0;
    if ColumnCount > 6 then
      TreeView_SubCategorias.Columns[6].Width := 0;
  end;

begin
  EnsureSubCategoriasColumns;

  if not Assigned(TreeView_SubCategorias) then
    Exit;

  // Validaciones mínimas (evitan AV típicos)
  if not Assigned(DModule_1) or not Assigned(DModule_1.con2) then
  begin
    MuestraMensajeGiproy('Error', 'No hay conexión DB configurada (con2 = nil).');
    Exit;
  end;

  if (Trim(base_activa.codBase) = '') then
  begin
    MuestraMensajeGiproy('Error', 'codBase vacío. No se puede cargar categorías.');
    Exit;
  end;

  TreeView_SubCategorias.BeginUpdate;
  try
    TreeView_SubCategorias.ClearNodes;

    // Crear nodos base (1..6) y guardar referencia
    for i := Low(BASE_CATS) to High(BASE_CATS) do
    begin
      nRoot := TreeView_SubCategorias.Nodes.Add;
      nRoot.Extended := True;
      nRoot.Text[0] := BASE_CATS[i];
      RootNodes[i] := nRoot;

      // Opcional: guardar el id de categoría base
      nRoot.Tag := i;
    end;

    qry := TUniQuery.Create(nil);
    try
      qry.Connection := DModule_1.con2;

      // Importante: seleccionar solo lo que usas
      qry.SQL.Text :=
      {(*}
        'SELECT descripcion, ciu ' +
        'FROM categoriaapus ' +
        'WHERE codBase = :codBase ' +
        '  AND categoria_base = :categoria_base ' +
        'ORDER BY descripcion';
      {*)}
      qry.Prepare;

      // Cargar hijos por cada categoría base
      for i := Low(BASE_CATS) to High(BASE_CATS) do
      begin
        nRoot := RootNodes[i];
        if not Assigned(nRoot) then
          Continue;

        qry.Close;
        qry.ParamByName('codBase').AsString := base_activa.codBase;
        qry.ParamByName('categoria_base').AsInteger := i;

        qry.Open;

        while not qry.Eof do
        begin
          nChild := TreeView_SubCategorias.AddNode(nRoot);
          nChild.Text[0] := qry.FieldByName('descripcion').AsString;
          nChild.Text[1] := qry.FieldByName('ciu').AsString;

          qry.Next;
        end;
      end;

    except
      on E: Exception do
      begin
        // Mensaje directo (FMX)
        MuestraMensajeGiproy('Error', 'Error cargando subcategorías: ' + E.Message);
        Exit;
      end;
    end;

  finally
    qry.Free;

    SafeSetupColumns;

    TreeView_SubCategorias.EndUpdate;
  end;

  // Esto fuera del Begin/EndUpdate está bien si hace más UI o DB
  cargarRecursosSubCategorias;
end;

procedure TfrmImportarRecursos2.cbb_BasesDisponiblesChange(Sender: TObject);
begin
  if FLoadingBases then
    Exit;

  if (csDestroying in ComponentState) then
    Exit;

  // NO frmImportarRecursos2.Visible (global). Usa Self.
  if Self.Visible then
    MuestrasCategoriasDBImportar(cbb_BasesDisponibles.ItemIndex);
end;

procedure TfrmImportarRecursos2.chk_BasesPadresChange(Sender: TObject);
begin
  cargaDBs;
end;

procedure TfrmImportarRecursos2.completaRecursosNodo(nodo: TTMSFNCTreeViewNode; codCategoriaBase: string);
var
  qry: TUniQuery;
  ciu: string;
  nodoNuevo: TTMSFNCTreeViewNode;
begin
  if not Assigned(nodo) then
    Exit;

  ciu := nodo.Text[1];
  if Trim(ciu) = '' then
    Exit;

  qry := TUniQuery.Create(nil);
  try
    qry.Connection := DModule_1.con2;
    {(*}
    qry.SQL.Text :=
                    'SELECT ' +
                    '  Descripcion, ' +
                    '  idUnico, ' +
                    '  unidad, ' +
                    'precio ' +
                    'FROM recursos ' +
                    'WHERE codBase = :codBase AND ' +
                    '  codCategoriaBase = :codCategoriaBase AND ' +
                    '  codSubcategoria = :codSubcategoria';
    {*)}
    qry.Prepare;
    qry.ParamByName('codBase').AsString := base_activa.codBase;
    qry.ParamByName('codCategoriaBase').AsString := codCategoriaBase;
    qry.ParamByName('codSubcategoria').AsString := ciu;
    qry.Open;

    while not qry.Eof do
    begin
      nodoNuevo := TreeView_SubCategorias.AddNode(nodo);
      nodoNuevo.Text[0] := qry.FieldByName('Descripcion').AsString;
      nodoNuevo.Text[1] := qry.FieldByName('idUnico').AsString;
      nodoNuevo.Text[2] := qry.FieldByName('unidad').AsString;
      nodoNuevo.Text[3] := qry.FieldByName('precio').AsString;
      qry.Next;
    end;

  finally
    qry.Free;
  end;
end;

function TfrmImportarRecursos2.compruebaRecursoRepetido2(nodoDestino: TTMSFNCTreeViewNode;
  categoriaBusqueda: string; descripcionRecurso: string; unidadRecurso: string): dat_repeatNode;
var
  nodoBusqueda: TTMSFNCTreeViewNode;
  salir: Boolean;
  categoriaComprobar: string;
begin
  { Comnparativa en descripcion y unidad
    1) Recurso se envia a una categoria y no exista   => Agregar Recurso     (estado=true, nodo=nil)
    2) Recurso se envia a una categoria y existe en la categoria => Actualizar Recurso (estado=true, nodo=nodo)
    3) Recurso se envia a una categoria y existe en otra categoria => No hacer nada (estado=False)
  }
  { Estado 1 }
  Result.Estado := True;
  Result.nodo := nil;

  nodoBusqueda := TreeView_SubCategorias.Nodes[0];
  salir := False;
  while (not salir) and (Assigned(nodoBusqueda)) do
  begin
    if (descripcionRecurso = nodoBusqueda.Text[0]) and (unidadRecurso = nodoBusqueda.Text[2]) then
    begin
      categoriaComprobar := daCategoriaPadreNodo(nodoBusqueda, 1).Text[0];
      salir := True;
      if categoriaComprobar = categoriaBusqueda then
      begin
        { Estado 2 }
        Result.Estado := True;
        Result.nodo := nodoBusqueda;
      end
      else
      begin
        { Estado 3 }
        Result.Estado := False;
      end;
    end;
    nodoBusqueda := nodoBusqueda.GetNext;
  end;

end;

function TfrmImportarRecursos2.daCategoriaPadreNodo(nodo: TTMSFNCTreeViewNode; nivelPadre: Integer):
  TTMSFNCTreeViewNode;
var
  nodovirtual: TTMSFNCTreeViewVirtualNode;
begin
  Result := nil;
  nodovirtual := nodo.VirtualNode;
  if Assigned(nodovirtual) and (nodovirtual.Level > nivelPadre) then
  begin
    while nodovirtual.Level > nivelPadre do
    begin
      nodovirtual := nodovirtual.GetParent;
    end;
    Result := nodovirtual.Node;
  end;
end;

function TfrmImportarRecursos2.compruebaRecursoRepetido(nodoDestino: TTMSFNCTreeViewNode;
  categoriaBusqueda, descripcionRecurso, unidadRecurso: string): TTMSFNCTreeViewNode;

  function Norm(const S: string): string;
  begin
    Result := UpperCase(Trim(S));
  end;

  function SafeText(ANode: TTMSFNCTreeViewNode; Col: Integer): string;
  var
    ColumnCount: integer;
  begin
    Result := '';
    ColumnCount := TreeView_SubCategorias.Columns.Count;
    if not Assigned(ANode) then
      Exit;
    if (Col < 0) or (Col >= ColumnCount) then
      Exit;
    Result := ANode.Text[Col];
  end;

  function GetRootFromNode(ANode: TTMSFNCTreeViewNode): TTMSFNCTreeViewNode;
  var
    V: TTMSFNCTreeViewVirtualNode;
  begin
    Result := nil;
    if not Assigned(ANode) then
      Exit;

    V := ANode.VirtualNode;
    if not Assigned(V) then
      Exit;

    // Sube hasta nivel 0 (raíz de categoría)
    while (V.Level > 0) do
      V := V.GetParent;

    Result := V.Node;
  end;

  function FindRootByCaption(const RootCaption: string): TTMSFNCTreeViewNode;
  var
    i: Integer;
    n: TTMSFNCTreeViewNode;
  begin
    Result := nil;
    if Norm(RootCaption) = '' then
      Exit;

    for i := 0 to TreeView_SubCategorias.Nodes.Count - 1 do
    begin
      n := TreeView_SubCategorias.Nodes[i];
      if Assigned(n) and (n.VirtualNode.Level = 0) then
      begin
        if Norm(SafeText(n, 0)) = Norm(RootCaption) then
          Exit(n);
      end;
    end;
  end;

  function IsWithinRoot(ANode, ARoot: TTMSFNCTreeViewNode): Boolean;
  var
    R: TTMSFNCTreeViewNode;
  begin
    Result := False;
    if not Assigned(ANode) or not Assigned(ARoot) then
      Exit;
    R := GetRootFromNode(ANode);
    Result := Assigned(R) and (R = ARoot);
  end;

var
  StartNode, Cur: TTMSFNCTreeViewNode;
  VN: TTMSFNCTreeViewVirtualNode;
  TargetRoot: TTMSFNCTreeViewNode;
  DescNeed, UnitNeed: string;
begin
  Result := nil;

  // Validaciones mínimas
  if not Assigned(TreeView_SubCategorias) then
    Exit;

  if TreeView_SubCategorias.Nodes.Count = 0 then
    Exit;

  DescNeed := Norm(descripcionRecurso);
  UnitNeed := Norm(unidadRecurso);

  if DescNeed = '' then
    Exit;

  // 1) Determinar el nodo raíz (categoría) objetivo
  TargetRoot := nil;

  // a) Si viene categoría, buscar raíz por texto
  if Norm(categoriaBusqueda) <> '' then
    TargetRoot := FindRootByCaption(categoriaBusqueda);

  // b) Si no se resolvió por texto y hay nodoDestino, usar su raíz
  if (TargetRoot = nil) and Assigned(nodoDestino) then
    TargetRoot := GetRootFromNode(nodoDestino);

  // c) Si aún no hay raíz, caer a recorrer todo desde el primer nodo
  if Assigned(TargetRoot) then
    StartNode := TargetRoot
  else
    StartNode := TreeView_SubCategorias.Nodes[0];

  Cur := StartNode;
  while Assigned(Cur) do
  begin
    if Assigned(TargetRoot) and (not IsWithinRoot(Cur, TargetRoot)) then
      Break;

    if (Norm(SafeText(Cur, 0)) = DescNeed) and (Norm(SafeText(Cur, 2)) = UnitNeed) then
      Exit(Cur);

    Cur := Cur.GetNext;
  end;
end;

function TfrmImportarRecursos2.daCodCategoriaPadre(descripcion: string): string;
var
  s: string;
begin
  Result := '';
  s := LowerCase(Trim(descripcion));

  if s = 'equipos y herramientas' then
    Exit('1');
  if s = 'materiales' then
    Exit('2');
  if s = 'transporte' then
    Exit('3');
  if s = 'mano de obra' then
    Exit('4');
  if s = 'seguridad industrial' then
    Exit('5');
  if s = 'precios unitarios' then
    Exit('6');
end;

function TfrmImportarRecursos2.daSubCategoriaInicial(nodo: TTMSFNCTreeViewVirtualNode): string;
begin
  Result := '';
  if not Assigned(nodo) then
    Exit;

  while nodo.Level > 1 do
    nodo := nodo.GetParent;

  if nodo.Level = 1 then
    Result := nodo.Text[1]; // CIU, no descripcion
end;

procedure TfrmImportarRecursos2.FormShow(Sender: TObject);
begin
  FLoadingBases := True;
  EnsureSubCategoriasColumns;
  try
    cargaSubcategoriasDB;
    grid_RecursosImportar.ClearNormalCells;
    grid_RecursosImportar.RowCount := 0;
    cargaDBs;
  finally
    FLoadingBases := False;
  end;
end;

procedure TfrmImportarRecursos2.grid_RoperecursosImportarDragOver(Sender: TObject; const Data:
  TDragObject; const Point: TPointF; var Operation: TDragOperation);
begin
  Operation := TDragOperation.None;
end;

procedure TfrmImportarRecursos2.guardarRecursosImportados;
var
  QCheck, QUpd, QIns: TUniQuery;
  nodo: TTMSFNCTreeViewNode;
  vn, p1, p2: TTMSFNCTreeViewVirtualNode;
  ahora: TDateTime;
  existe: Boolean;
  StartedHere: Boolean;

  // -------- helpers (integrados) --------
  function DumpParams(Q: TUniQuery): string;
  var
    i: Integer;
    P: TParam;
  begin
    Result := '';
    for i := 0 to Q.Params.Count - 1 do
    begin
      P := Q.Params[i];
      Result := Result + Format('%s [%s] = "%s"%s',
        [P.Name, FieldTypeNames[P.DataType], P.AsString, sLineBreak]);
    end;
  end;

  procedure ExecSQLSafe(Q: TUniQuery; const Tag: string);
  begin
    try
      Q.ExecSQL;
    except
      on E: Exception do
      begin
        MuestraMensajeGiproy(
          'SQL ERROR (' + Tag + ')',
          E.ClassName + ': ' + E.Message + sLineBreak + sLineBreak +
          'SQL:' + sLineBreak + Q.SQL.Text + sLineBreak + sLineBreak +
          'PARAMS:' + sLineBreak + DumpParams(Q)
        );
        raise;
      end;
    end;
  end;

  function SafeText(ANode: TTMSFNCTreeViewNode; Col: Integer): string;
  begin
    Result := '';
    if not Assigned(ANode) then Exit;
    if not Assigned(TreeView_SubCategorias) then Exit;
    if (Col < 0) or (Col >= TreeView_SubCategorias.Columns.Count) then Exit;
    Result := ANode.Text[Col];
  end;

  function HasFlagToProcess(ANode: TTMSFNCTreeViewNode): Boolean;
  begin
    Result := Trim(SafeText(ANode, 6)) <> '';
  end;

  function TryToInt(const S: string; out V: Integer): Boolean;
  begin
    Result := TryStrToInt(Trim(S), V);
  end;

  procedure SetParamDateTimeLocal(Q: TUniQuery; const ParamName: string; const Value: TDateTime);
  var
    P: TParam;
  begin
    P := Q.ParamByName(ParamName);
    P.DataType := ftDateTime;
    P.AsDateTime := Value;
  end;

  function CleanMySQLDecimal(const S: string): string;
  var
    t: string;
  begin
    t := Trim(S);
    if t = '' then Exit('0');
    t := StringReplace(t, ',', '.', [rfReplaceAll]);
    Result := t;
  end;

  procedure SetDecimalParam(Q: TUniQuery; const ParamName, S: string);
  var
    t: string;
    v: Double;
  begin
    t := Trim(S);
    if t = '' then
      t := '0';

    t := StringReplace(t, ',', '.', [rfReplaceAll]);

    if not TryStrToFloat(t, v, TFormatSettings.Invariant) then
      v := 0;

    Q.ParamByName(ParamName).DataType := ftFloat; // UniDAC lo manda como número
    Q.ParamByName(ParamName).AsFloat := v;
  end;

  procedure SetFloatOrNull(Q: TUniQuery; const ParamName, S: string);
  var
    t: string;
    v: Double;
  begin
    t := Trim(S);

    if t = '' then
    begin
      Q.ParamByName(ParamName).Clear; // NULL
      Exit;
    end;

    t := StringReplace(t, ',', '.', [rfReplaceAll]);

    if not TryStrToFloat(t, v, TFormatSettings.Invariant) then
    begin
      Q.ParamByName(ParamName).Clear; // NULL si inválido
      Exit;
    end;

    Q.ParamByName(ParamName).DataType := ftFloat;
    Q.ParamByName(ParamName).AsFloat := v;
  end;

  function GetCategoriaYSubCategoriaFromResourceNode(ANode: TTMSFNCTreeViewNode;
    out CategoriaBaseCaption, SubCategoriaCaption: string): Boolean;
  begin
    Result := False;
    CategoriaBaseCaption := '';
    SubCategoriaCaption := '';

    if not Assigned(ANode) then Exit;

    vn := ANode.VirtualNode;
    if not Assigned(vn) then Exit;

    // Nivel 0 = categoría base, nivel 1 = subcategoría, nivel 2 = recurso
    if vn.Level < 2 then Exit;

    p1 := vn.GetParent; // subcategoría
    if not Assigned(p1) then Exit;

    p2 := p1.GetParent; // categoría base
    if not Assigned(p2) then Exit;

    SubCategoriaCaption := p1.Text[0];
    CategoriaBaseCaption := p2.Text[0];

    Result := (Trim(SubCategoriaCaption) <> '') and (Trim(CategoriaBaseCaption) <> '');
  end;

  procedure PrepareQueries;
  begin
    // Existe por idUnico+codBase
    QCheck.SQL.Text :=
      'SELECT idUnico ' +
      'FROM recursos ' +
      'WHERE idUnico = :idUnico AND codBase = :codBase ' +
      'LIMIT 1';

    // UPDATE (IMPORTANTE: precio como decimal real, NO string con coma)
    QUpd.SQL.Text :=
      'UPDATE recursos SET ' +
      '  precio = :precio, ' +
      '  CodCPC = :CodCPC, ' +
      '  Especificaciones = :Especificaciones, ' +
      '  tipoCPC = :tipoCPC, ' +
      '  porcentajeCPC = :porcentajeCPC, ' +
      '  ultimaModificacion = :ultimaModificacion ' +
      'WHERE idUnico = :idUnico AND codBase = :codBase';

    // INSERT
    QIns.SQL.Text :=
      'INSERT INTO recursos (' +
      '  idUnico, codBase, codRecurso, codRecursoCompleto, codCategoriaBase, codSubCategoria, ' +
      '  Descripcion, unidad, precio, preciolocal, precioBase, moneda, ' +
      '  CodCPC, tipoCPC, porcentajeCPC, Especificaciones, fechahoraCreacion, ultimaModificacion' +
      ') VALUES (' +
      '  :idUnico, :codBase, :codRecurso, :codRecursoCompleto, :codCategoriaBase, :codSubCategoria, ' +
      '  :Descripcion, :unidad, :precio, :preciolocal, :precioBase, :moneda, ' +
      '  :CodCPC, :tipoCPC, :porcentajeCPC, :Especificaciones, :fechahoraCreacion, :ultimaModificacion' +
      ')';

    QCheck.Prepare;
    QUpd.Prepare;
    QIns.Prepare;

    if QIns.Params.FindParam('fechahoraCreacion') = nil then
      raise Exception.Create('Param fechahoraCreacion NO existe en QIns.SQL');
    if QIns.Params.FindParam('ultimaModificacion') = nil then
      raise Exception.Create('Param ultimaModificacion NO existe en QIns.SQL');
    if QIns.Params.FindParam('porcentajeCPC') = nil then
      raise Exception.Create('Param porcentajeCPC NO existe en QIns.SQL');
  end;

  // -------- datos por nodo --------
var
  idUnicoNodo: string;
  descripcion: string;
  unidadRecurso: string;
  precioRecurso: string;
  codCPC: string;
  especificaciones: string;
  tipoCPC: string;
  porcentajeCPC: string;

  categoriaBaseCaption: string;
  subCategoriaCaption: string;

  codCategoriaBaseStr: string;
  codSubcategoriaStr: string;
  codRecursoStr: string;

  codCategoriaBaseInt: Integer;
  codSubCategoriaInt: Integer;
  codRecursoInt: Integer;

  codRecursoCompleto: string;
  idUnicoRecurso: string;
begin
  if not Assigned(TreeView_SubCategorias) then Exit;

  if not Assigned(DModule_1) or not Assigned(DModule_1.con2) then
  begin
    MuestraMensajeGiproy('Error', 'Conexión DB no disponible (con2=nil).');
    Exit;
  end;

  if TreeView_SubCategorias.Nodes.Count = 0 then Exit;

  if Trim(base_activa.codBase) = '' then
  begin
    MuestraMensajeGiproy('Error', 'codBase vacío. No se puede guardar.');
    Exit;
  end;

  if TreeView_SubCategorias.Columns.Count < 9 then
  begin
    MuestraMensajeGiproy('Error', 'TreeView_SubCategorias no tiene columnas suficientes (se requieren 9).');
    Exit;
  end;

  QCheck := TUniQuery.Create(nil);
  QUpd := TUniQuery.Create(nil);
  QIns := TUniQuery.Create(nil);
  try
    QCheck.Connection := DModule_1.con2;
    QUpd.Connection := DModule_1.con2;
    QIns.Connection := DModule_1.con2;

    PrepareQueries;

    StartedHere := not DModule_1.con2.InTransaction;
    if StartedHere then
      DModule_1.con2.StartTransaction;

    try
      ahora := Now;

      nodo := TreeView_SubCategorias.Nodes[0];
      while Assigned(nodo) do
      begin
        if HasFlagToProcess(nodo) then
        begin
          // leer columnas
          descripcion := SafeText(nodo, 0);
          idUnicoNodo := SafeText(nodo, 1);
          unidadRecurso := SafeText(nodo, 2);
          precioRecurso := SafeText(nodo, 3);
          codCPC := SafeText(nodo, 4);
          especificaciones := SafeText(nodo, 5);
          tipoCPC := SafeText(nodo, 7);
          porcentajeCPC := SafeText(nodo, 8);

          if Trim(idUnicoNodo) = '' then
          begin
            nodo := nodo.GetNext;
            Continue;
          end;

          // Normaliza precio a decimal MySQL (punto)
          precioRecurso := CleanMySQLDecimal(decimal_correcto(precioRecurso));

          // existe?
          QCheck.Close;
          QCheck.ParamByName('idUnico').AsString := idUnicoNodo;
          QCheck.ParamByName('codBase').AsString := base_activa.codBase;
          QCheck.Open;
          existe := not QCheck.Eof;

          if existe then
          begin
            // UPDATE
            QUpd.Close;

            SetDecimalParam(QUpd, 'precio', precioRecurso); // <-- FIX: número real, no '0,2'
            QUpd.ParamByName('CodCPC').AsString := codCPC;
            QUpd.ParamByName('Especificaciones').AsString := especificaciones;
            QUpd.ParamByName('tipoCPC').AsString := tipoCPC;

            SetFloatOrNull(QUpd, 'porcentajeCPC', porcentajeCPC);
            SetParamDateTimeLocal(QUpd, 'ultimaModificacion', ahora);

            QUpd.ParamByName('idUnico').AsString := idUnicoNodo;
            QUpd.ParamByName('codBase').AsString := base_activa.codBase;

            ExecSQLSafe(QUpd, 'UPDATE recursos');
          end
          else
          begin
            // resolver categoría/subcategoría
            if not GetCategoriaYSubCategoriaFromResourceNode(nodo, categoriaBaseCaption, subCategoriaCaption) then
            begin
              nodo := nodo.GetNext;
              Continue;
            end;

            codCategoriaBaseStr := daCodCategoriaPadre(categoriaBaseCaption);
            codSubcategoriaStr := daCodSubCategoriasRecursos(subCategoriaCaption, codCategoriaBaseStr);

            if (Trim(codCategoriaBaseStr) = '') or (Trim(codSubcategoriaStr) = '') then
            begin
              nodo := nodo.GetNext;
              Continue;
            end;

            if not TryToInt(codCategoriaBaseStr, codCategoriaBaseInt) then
            begin
              nodo := nodo.GetNext;
              Continue;
            end;

            if not TryToInt(codSubcategoriaStr, codSubCategoriaInt) then
            begin
              nodo := nodo.GetNext;
              Continue;
            end;

            // secuencia segura (requiere transacción activa)
            codRecursoStr := dacodRecursoNuevo(codCategoriaBaseStr, codSubcategoriaStr);
            if not TryToInt(codRecursoStr, codRecursoInt) then
            begin
              nodo := nodo.GetNext;
              Continue;
            end;

            idUnicoRecurso := 'Rsr' + generaCodigoUnico;
            codRecursoCompleto := generaCodigoRecurso(codCategoriaBaseStr, codSubcategoriaStr, codRecursoStr);

            // INSERT
            QIns.Close;
            QIns.ParamByName('idUnico').AsString := idUnicoRecurso;
            QIns.ParamByName('codBase').AsString := base_activa.codBase;

            QIns.ParamByName('codRecurso').AsInteger := codRecursoInt;
            QIns.ParamByName('codRecursoCompleto').AsString := codRecursoCompleto;
            QIns.ParamByName('codCategoriaBase').AsInteger := codCategoriaBaseInt;
            QIns.ParamByName('codSubCategoria').AsInteger := codSubCategoriaInt;

            QIns.ParamByName('Descripcion').AsString := descripcion;
            QIns.ParamByName('unidad').AsString := unidadRecurso;

            SetDecimalParam(QIns, 'precio', precioRecurso);
            SetDecimalParam(QIns, 'preciolocal', precioRecurso);
            SetDecimalParam(QIns, 'precioBase', precioRecurso);
            QIns.ParamByName('moneda').AsString := base_activa.moneda;

            QIns.ParamByName('CodCPC').AsString := codCPC;
            QIns.ParamByName('tipoCPC').AsString := tipoCPC;

            SetFloatOrNull(QIns, 'porcentajeCPC', porcentajeCPC);

            QIns.ParamByName('Especificaciones').AsString := especificaciones;

            SetParamDateTimeLocal(QIns, 'fechahoraCreacion', ahora);
            SetParamDateTimeLocal(QIns, 'ultimaModificacion', ahora);

            ExecSQLSafe(QIns, 'INSERT recursos');
          end;
        end;

        nodo := nodo.GetNext;
      end;

      // -------- FIX CLAVE: confirmar SIEMPRE --------
      if DModule_1.con2.InTransaction then
      begin
        if StartedHere then
          DModule_1.con2.Commit
        else
          DModule_1.con2.CommitRetaining; // confirma sin cerrar la transacción global
      end;

    except
      on E: Exception do
      begin
        // rollback correcto según quién abrió la transacción
        if DModule_1.con2.InTransaction then
        begin
          if StartedHere then
            DModule_1.con2.Rollback
          else
            DModule_1.con2.RollbackRetaining;
        end;

        MuestraMensajeGiproy('Error', 'Error guardando recursos: ' + E.Message);
        raise;
      end;
    end;

  finally
    QCheck.Free;
    QUpd.Free;
    QIns.Free;
  end;
end;

function TfrmImportarRecursos2.dacodRecursoNuevo(const codCategoria, codSubcategoria: string): string;
begin
  // OBLIGATORIO: el caller debe tener transacción abierta (guardarRecursosImportados ya la abre)
  Result := NextCodRecursoSeguro(base_activa.codBase, codCategoria, codSubcategoria);
end;

function TfrmImportarRecursos2.daCodSubCategoriasRecursos(const descripcion, codCategoriaBase:
  string): string;
var
  qry: TUniQuery;
begin
  Result := '';

  if not Assigned(DModule_1) or not Assigned(DModule_1.con2) then
    Exit;

  if Trim(base_activa.codBase) = '' then
    Exit;

  if (Trim(descripcion) = '') or (Trim(codCategoriaBase) = '') then
    Exit;

  qry := TUniQuery.Create(nil);
  try
    qry.Connection := DModule_1.con2;

    // Selecciona solo lo necesario, y asegura una sola fila
    {(*}
    qry.SQL.Text :=
      'SELECT ciu ' +
      'FROM categoriaapus ' +
      'WHERE codBase = :codBase ' +
      '  AND categoria_base = :categoria_base ' +
      '  AND descripcion = :descripcion ' +
      'LIMIT 1';
    {*)}
    qry.Prepare;
    qry.ParamByName('codBase').AsString := base_activa.codBase;

    // Si categoria_base en tu tabla es entero, cambia a AsInteger con TryStrToInt
    qry.ParamByName('categoria_base').AsInteger := StrToIntDef(codCategoriaBase, 0);

    qry.ParamByName('descripcion').AsString := descripcion;

    qry.Open;

    if not qry.Eof then
      Result := qry.FieldByName('ciu').AsString
    else
      Result := ''; // no encontrado

  finally
    qry.Free;
  end;
end;

procedure TfrmImportarRecursos2.grid_RecursosImportarMouseDown(Sender: TObject; Button: TMouseButton;
  Shift: TShiftState; X, Y: Single);
begin
  if ssLeft in Shift then
    FMouseDown := True;
end;

procedure TfrmImportarRecursos2.grid_RecursosImportarMouseEnter(Sender: TObject);
begin
  FMouseDown := False;
end;

procedure TfrmImportarRecursos2.grid_RecursosImportarMouseMove(Sender: TObject; Shift: TShiftState;
  X, Y: Single);
var
  ddService: IFMXDragDropService;
  d: TDragObject;
  row: Integer;
  jsonRoot, objMensaje: TJSONObject;
  arr: TJSONArray;
  subCiuOrigen, subCaptionOrigen: string;
  dragBmp: TBitmap;

  function HasRowSelected: Boolean;
  begin
    Result :=
      (grid_RecursosImportar.RowCount > 1) and
      (grid_RecursosImportar.Selection.StartRow >= 1) and
      (grid_RecursosImportar.Selection.StartRow < grid_RecursosImportar.RowCount);
  end;

  function SafeCell(ACol, ARow: Integer): string;
  begin
    Result := '';
    if not Assigned(grid_RecursosImportar) then
      Exit;
    if (ARow < 0) or (ARow >= grid_RecursosImportar.RowCount) then
      Exit;
    if (ACol < 0) or (ACol >= grid_RecursosImportar.ColumnCount) then
      Exit;
    Result := grid_RecursosImportar.Cells[ACol, ARow];
  end;

  function GetSubCategoriaOrigenCiu(out ACaption: string): string;
  var
    n, p: TTMSFNCTreeViewNode;
  begin
    Result := '';
    ACaption := '';

    if not Assigned(TreeView_SubCategoriaImportar) then
      Exit;

    n := TreeView_SubCategoriaImportar.SelectedNode;
    if not Assigned(n) then
      Exit;

    // En tu TreeView_SubCategoriaImportar:
    // nivel 0 = categoría, nivel 1 = subcategoría (Text[1] = CIU)
    p := n.GetParent;
    if not Assigned(p) then
      Exit; // si es raíz/categoría, no sirve

    ACaption := n.Text[0]; // solo display
    Result := n.Text[1]; // CIU estable
  end;

begin
  // Requisitos básicos
  if not Assigned(grid_RecursosImportar) then
    Exit;

  if not TPlatformServices.Current.SupportsPlatformService(IFMXDragDropService, ddService) then
    Exit;

  // Solo con botón izq “arrastrando”
  if not FMouseDown then
    Exit;
  if not (ssLeft in Shift) then
    Exit;

  // Evita iniciar drag varias veces
  if FDragging then
    Exit;

  // Debe haber una fila válida seleccionada (y no cabecera)
  if not HasRowSelected then
    Exit;

  // Fila origen
  row := grid_RecursosImportar.Selection.StartRow;

  // Subcategoría origen (CIU + caption)
  subCiuOrigen := GetSubCategoriaOrigenCiu(subCaptionOrigen);
  if Trim(subCiuOrigen) = '' then
    Exit;

  // Construir JSON
  jsonRoot := TJSONObject.Create;
  try
    arr := TJSONArray.Create;
    jsonRoot.AddPair('CambioRecurso', arr);

    objMensaje := TJSONObject.Create;

    // OJO: tus columnas según muestraRecursosaImportar:
    // 1=descripcion,2=unidad,3=precio,4=codCPC,5=idUnico,6=especificaciones,7=tipoCPC,8=porcentajeCPC
    objMensaje.AddPair('codUnicoRecurso', SafeCell(5, row)); // idUnico del recurso origen
    objMensaje.AddPair('descripcion', SafeCell(1, row));
    objMensaje.AddPair('unidad', SafeCell(2, row));
    objMensaje.AddPair('precio', SafeCell(3, row));
    objMensaje.AddPair('codCPC', SafeCell(4, row));
    objMensaje.AddPair('especificaciones', SafeCell(6, row));
    objMensaje.AddPair('tipoCPC', SafeCell(7, row));
    objMensaje.AddPair('porcentajeCPC', SafeCell(8, row));

    // FIX BUG 3: usar CIU estable de subcategoría, no texto
    objMensaje.AddPair('ciuSubcategoria', subCiuOrigen);
    objMensaje.AddPair('subcategoriaTexto', subCaptionOrigen); // opcional (solo display)

    arr.AddElement(objMensaje);

    // Cache interno
    FLastDragJSON := jsonRoot.ToJSON;

    // Iniciar DragDrop (una sola vez)
    FDragging := True;

    d := Default(TDragObject);
    d.Data := 'CambioRecursoJSON';
    d.Source := Self;

    dragBmp := TBitmap.Create(1, 1);
    try
      ddService.BeginDragDrop(Self, d, dragBmp);
    finally
      dragBmp.Free;
    end;

  finally
    jsonRoot.Free;
  end;
end;

procedure TfrmImportarRecursos2.grid_RecursosImportarMouseUp(Sender: TObject; Button: TMouseButton;
  Shift: TShiftState; X, Y: Single);
begin
  // Siempre suelta flags al terminar el gesto
  FMouseDown := False;
  FDragging := False;

  // Si quieres limpiar el cache del drag para evitar reusar datos viejos:
  FLastDragJSON := '';
end;

procedure TfrmImportarRecursos2.lyt_IzquierdaResized(Sender: TObject);
var
  numero: Double;
begin
  if lyt_Izquierda.Width < 450 then
    lyt_Izquierda.Width := 450;
  numero := rct_BackgroundGris.Width;
  numero := numero - 450;
  if lyt_Izquierda.Width > numero then
    lyt_Izquierda.Width := numero;
end;

procedure TfrmImportarRecursos2.MenuItem1Click(Sender: TObject);
var
  descripcion, unidadRecurso, codUnicoRecurso, precio, codCPC: string;
  especificaciones, tipoCPC, porcentajeCPC: string;
  X: Integer;
  creados, actualizados, enOtraSub: Integer;
  nodo, nodoPadre: TTMSFNCTreeViewNode;
  vSel, vTmp: TTMSFNCTreeViewVirtualNode;
  dNodo: dat_repeatNode;

  function SafeCell(ACol, ARow: Integer): string;
  begin
    Result := '';
    if not Assigned(grid_RecursosImportar) then
      Exit;
    if (ARow < 0) or (ARow >= grid_RecursosImportar.RowCount) then
      Exit;
    if (ACol < 0) or (ACol >= grid_RecursosImportar.ColumnCount) then
      Exit;
    Result := grid_RecursosImportar.Cells[ACol, ARow];
  end;

  function Norm(const S: string): string;
  begin
    Result := UpperCase(Trim(S));
  end;

  function GetPadreSubCategoriaFromSelected(out APadre: TTMSFNCTreeViewNode): Boolean;
  begin
    Result := False;
    APadre := nil;

    if not Assigned(TreeView_SubCategorias) then
      Exit;

    APadre := TreeView_SubCategorias.SelectedNode;
    if not Assigned(APadre) then
      Exit;

    vSel := APadre.VirtualNode;
    if not Assigned(vSel) then
      Exit;

    // Queremos que el padre sea la SubCategoría (nivel 1)
    vTmp := vSel;
    while (vTmp.Level > 1) do
      vTmp := vTmp.GetParent;

    // Si seleccionaron una categoría raíz (nivel 0), no sirve para importar recursos
    if vTmp.Level = 0 then
      Exit;

    APadre := vTmp.Node;
    Result := Assigned(APadre);
  end;

  function EnsureColumnCountForResourceWrite: Boolean;
  begin
    // Vamos a escribir hasta Text[8]
    Result := Assigned(TreeView_SubCategorias) and (TreeView_SubCategorias.Columns.Count >= 9);
  end;

begin
  // Validaciones básicas
  if not Assigned(TreeView_SubCategorias) or not Assigned(grid_RecursosImportar) then
    Exit;

  if not GetPadreSubCategoriaFromSelected(nodoPadre) then
  begin
    MuestraMensajeGiproy('Información', 'Seleccione una subcategoría donde importar, por favor.');
    Exit;
  end;

  if not EnsureColumnCountForResourceWrite then
  begin
    MuestraMensajeGiproy('Información', 'El TreeView no tiene columnas suficientes (se requieren 9).');
    Exit;
  end;

  if grid_RecursosImportar.RowCount <= 1 then
  begin
    MuestraMensajeGiproy('Información', 'No hay recursos para importar.');
    Exit;
  end;

  creados := 0;
  actualizados := 0;
  enOtraSub := 0;

  TreeView_SubCategorias.BeginUpdate;
  try
    for X := 1 to grid_RecursosImportar.RowCount - 1 do
    begin
      // Col 0 es "seleccionado" según tu lógica
      if Norm(SafeCell(0, X)) = '' then
        Continue;

      // Leer datos (ajusta columnas según tu grid real)
      descripcion := SafeCell(1, X);
      unidadRecurso := SafeCell(2, X);
      precio := SafeCell(3, X);
      codCPC := SafeCell(4, X);

      // En tu código original hay un bug: especificaciones lo lees de col 5, pero en tu llenado estaba en col 6.
      // Aquí uso col 6 (coherente con muestraRecursosaImportar donde pones especificaciones en col 6).
      codUnicoRecurso := SafeCell(5, X); // idUnico
      especificaciones := SafeCell(6, X);

      tipoCPC := SafeCell(7, X);
      porcentajeCPC := SafeCell(8, X);

      if Norm(descripcion) = '' then
        Continue;

      // comprobar para actualizar o crear
      dNodo := compruebaRecursoRepetido2(nodoPadre, nodoPadre.Text[0], descripcion, unidadRecurso);

      { Estados esperados:
        1) No existe en la subcategoría destino  => crear (Estado=true, nodo=nil)
        2) Existe en la subcategoría destino     => actualizar (Estado=true, nodo=nodo)
        3) Existe en otra subcategoría           => no hacer nada (Estado=false)
      }

      if dNodo.Estado then
      begin
        if not Assigned(dNodo.nodo) then
        begin
          nodo := TreeView_SubCategorias.AddNode(nodoPadre);
          Inc(creados);
        end
        else
        begin
          nodo := dNodo.nodo;
          Inc(actualizados);
        end;

        // Asignar datos
        nodo.Text[0] := descripcion;
        nodo.Text[1] := codUnicoRecurso; // idUnico
        nodo.Text[2] := unidadRecurso;
        nodo.Text[3] := precio;
        nodo.Text[4] := codCPC;
        nodo.Text[5] := especificaciones;
        nodo.Text[6] := 'Actualizar';
        nodo.Text[7] := tipoCPC;
        nodo.Text[8] := porcentajeCPC;
      end
      else
        Inc(enOtraSub);
    end;

  finally
    TreeView_SubCategorias.EndUpdate;
  end;
  {(*}
  MuestraMensajeGiproy(
    'Información',
    'Recursos Actualizados: ' + IntToStr(actualizados) + sLineBreak +
    'Recursos Creados: ' + IntToStr(creados) + sLineBreak +
    'Recursos en otra Subcategoria: ' + IntToStr(enOtraSub)
  );
  {*)}
end;

function TfrmImportarRecursos2.PosicionarenNodo(const descripcion: string): TTMSFNCTreeViewNode;
var
  selNode: TTMSFNCTreeViewNode;
  vSel, vCat, vSub: TTMSFNCTreeViewVirtualNode;
  target: string;

  function Norm(const S: string): string;
  begin
    Result := UpperCase(Trim(S));
  end;

begin
  Result := nil;

  if not Assigned(TreeView_SubCategorias) then
    Exit;
  if TreeView_SubCategorias.Nodes.Count = 0 then
    Exit;

  target := Norm(descripcion);
  if target = '' then
    Exit;

  selNode := TreeView_SubCategorias.SelectedNode;

  // Si no hay selección, intenta: intenta devolver el primer nodo del árbol
  if not Assigned(selNode) then
  begin
    Result := TreeView_SubCategorias.Nodes[0];
    Exit;
  end;

  vSel := selNode.VirtualNode;
  if not Assigned(vSel) then
    Exit;

  // Si está en raíz (nivel 0): devolver su primer hijo (si existe)
  if vSel.Level = 0 then
  begin
    Result := selNode.GetFirstChild;
    Exit;
  end;

  // Subir hasta nivel 1 (SubCategoría) o nivel 0 si por estructura no existe
  vCat := vSel;
  while (vCat.Level > 1) do
    vCat := vCat.GetParent;

  if vCat.Level = 1 then
  begin
    vSub := vCat;

    if vSub.Level = 1 then
    begin

      vSub := vSub.GetParent;
      if not Assigned(vSub) then
        Exit;

      vSub := vSub.GetFirstChild;
      if not Assigned(vSub) then
        Exit;

      while Assigned(vSub) do
      begin
        if Norm(vSub.Text[0]) = target then
        begin
          Result := vSub.Node;
          Exit;
        end;
        vSub := vSub.GetNextSibling;
      end;
    end;

    while Assigned(vSub) do
    begin
      if Norm(vSub.Text[0]) = target then
      begin
        Result := vSub.Node;
        Exit;
      end;
      vSub := vSub.GetNextSibling;
    end;

    Result := vCat.Node;
    Exit;
  end;

  if vCat.Level = 0 then
  begin
    Result := vCat.Node.GetFirstChild;
    Exit;
  end;
end;

procedure TfrmImportarRecursos2.muestraRecursosaImportar(const codCategoria, codSubcategoria: string);
var
  qry: TUniQuery;
  r: Integer;
  tmp: string;
  fixedW: Integer;

  procedure SetupHeader;
  begin
    // Asegura mínimo de columnas (0..8) si tu grid lo permite. Si no, al menos valida antes de escribir.
    grid_RecursosImportar.RowCount := 1;

    // Cabecera (fila 0)
    if grid_RecursosImportar.ColumnCount > 1 then
      grid_RecursosImportar.Cells[1, 0] := 'Descripción';
    if grid_RecursosImportar.ColumnCount > 2 then
      grid_RecursosImportar.Cells[2, 0] := 'Unidad';
    if grid_RecursosImportar.ColumnCount > 3 then
      grid_RecursosImportar.Cells[3, 0] := 'Precio';
    if grid_RecursosImportar.ColumnCount > 4 then
      grid_RecursosImportar.Cells[4, 0] := 'Cod. CPC';
  end;

  procedure SafeSetCell(ACol, ARow: Integer; const AValue: string);
  begin
    if (ACol < 0) or (ACol >= grid_RecursosImportar.ColumnCount) then
      Exit;
    if (ARow < 0) or (ARow >= grid_RecursosImportar.RowCount) then
      Exit;
    grid_RecursosImportar.Cells[ACol, ARow] := AValue;
  end;

  procedure SafeHideColumn(ACol: Integer);
  begin
    if (ACol >= 0) and (ACol < grid_RecursosImportar.ColumnCount) then
      grid_RecursosImportar.Columns[ACol].Width := 0;
  end;

  procedure SafeAutoSizeColumn(ACol: Integer);
  begin
    if (ACol >= 0) and (ACol < grid_RecursosImportar.ColumnCount) then
      grid_RecursosImportar.AutoSizeColumn(ACol);
  end;

begin
  if not Assigned(grid_RecursosImportar) then
    Exit;
  if not Assigned(DModule_1) or not Assigned(DModule_1.con2) then
    Exit;

  grid_RecursosImportar.BeginUpdate;
  try
    grid_RecursosImportar.ClearNormalCells;
    SetupHeader;

    // Validaciones de entrada
    if (Trim(codCategoria) = '') or (Trim(codSubcategoria) = '') or (Trim(codBaseImportar) = '') then
      Exit;

    qry := TUniQuery.Create(nil);
    try
      qry.Connection := DModule_1.con2;

      {(*}
      qry.SQL.Text :=
        'SELECT ' +
        '  descripcion, ' +
        '  unidad, ' +
        '  precio, ' +
        '  codCPC, ' +
        '  idUnico, ' +
        '  especificaciones, ' +
        '  tipoCPC, ' +
        '  porcentajeCPC ' +
        'FROM recursos ' +
        'WHERE  ' +
        '  codCategoriaBase = :codCategoriaBase AND ' +
        '  codBase = :codBase AND ' +
        '  codSubcategoria = :codSubcategoria ' +
        'ORDER BY descripcion ASC';
      {*)}
      qry.Prepare;
      qry.ParamByName('codCategoriaBase').AsString := codCategoria;
      qry.ParamByName('codBase').AsString := codBaseImportar;
      qry.ParamByName('codSubcategoria').AsString := codSubcategoria;

      qry.Open;

      r := 1;
      while not qry.Eof do
      begin
        grid_RecursosImportar.RowCount := r + 1;

        SafeSetCell(1, r, qry.FieldByName('descripcion').AsString);
        SafeSetCell(2, r, qry.FieldByName('unidad').AsString);

        tmp := qry.FieldByName('precio').AsString;
        tmp := decimal_correcto(tmp);
        SafeSetCell(3, r, tmp);

        SafeSetCell(4, r, qry.FieldByName('codCPC').AsString);
        SafeSetCell(5, r, qry.FieldByName('idUnico').AsString);
        SafeSetCell(6, r, qry.FieldByName('especificaciones').AsString);
        SafeSetCell(7, r, qry.FieldByName('tipoCPC').AsString);
        SafeSetCell(8, r, qry.FieldByName('porcentajeCPC').AsString);

        Inc(r);
        qry.Next;
      end;

    finally
      qry.Free;
    end;

    // Ajuste de columnas (solo si existen)
    SafeAutoSizeColumn(2);
    SafeAutoSizeColumn(3);
    SafeAutoSizeColumn(4);

    // Ocultar columnas técnicas
    SafeHideColumn(5);
    SafeHideColumn(6);
    // Si quieres ocultar tipo/porcentaje, descomenta:
    // SafeHideColumn(7);
    // SafeHideColumn(8);

    // Calcular ancho para descripción (col 1)
    fixedW := 20;
    if (grid_RecursosImportar.ColumnCount > 2) then
      fixedW := fixedW + Trunc(grid_RecursosImportar.Columns[2].Width);
    if (grid_RecursosImportar.ColumnCount > 3) then
      fixedW := fixedW + Trunc(grid_RecursosImportar.Columns[3].Width);
    if (grid_RecursosImportar.ColumnCount > 4) then
      fixedW := fixedW + Trunc(grid_RecursosImportar.Columns[4].Width);

    if (grid_RecursosImportar.ColumnCount > 1) then
    begin
      // -30 deja margen para scroll/bordes (ajusta si lo necesitas)
      grid_RecursosImportar.Columns[1].Width := Max(80, grid_RecursosImportar.Width - fixedW - 30);
    end;

  finally
    grid_RecursosImportar.EndUpdate;
  end;
end;

procedure TfrmImportarRecursos2.MuestrasCategoriasDBImportar(posicionBase: Integer);
const
  {*}
  BASE_CATS: array[1..6] of string = ('Equipos y Herramientas',
    'Materiales',
    'Transporte',
    'Mano de Obra',
    'Seguridad Industrial',
    'Precios Unitarios');
  {*)}
var
  qry: TUniQuery;
  i: Integer;
  nodoBase, nodoHijo: TTMSFNCTreeViewNode;
  RootNodes: array[1..6] of TTMSFNCTreeViewNode;

  function SafeNodeByIndex(Index: Integer): TTMSFNCTreeViewNode;
  begin
    Result := nil;
    if (Index >= 0) and (Index < TreeView_SubCategoriaImportar.Nodes.Count) then
      Result := TreeView_SubCategoriaImportar.Nodes[Index];
  end;

begin
  if not Assigned(TreeView_SubCategoriaImportar) then
    Exit;
  if not Assigned(DModule_1) or not Assigned(DModule_1.con2) then
    Exit;

  if (posicionBase < 0) or (posicionBase >= Length(listadoBasesImportar)) then
    Exit;

  codBaseImportar := listadoBasesImportar[posicionBase].codBase;
  if Trim(codBaseImportar) = '' then
    Exit;

  TreeView_SubCategoriaImportar.BeginUpdate;
  try
    TreeView_SubCategoriaImportar.ClearNodes;
    for i := Low(BASE_CATS) to High(BASE_CATS) do
    begin
      nodoBase := TreeView_SubCategoriaImportar.Nodes.Add;
      nodoBase.Extended := True;
      nodoBase.Text[0] := BASE_CATS[i];
      RootNodes[i] := nodoBase;
      nodoBase.Tag := i;
    end;

    qry := TUniQuery.Create(nil);
    try
      qry.Connection := DModule_1.con2;
      {(*}
      qry.SQL.Text :=
        'SELECT descripcion, ciu ' +
        'FROM categoriaapus ' +
        'WHERE codBase = :codBase ' +
        '  AND categoria_base = :categoria_base ' +
        'ORDER BY descripcion ASC';
      {*)}
      for i := Low(BASE_CATS) to High(BASE_CATS) do
      begin
        nodoBase := RootNodes[i];
        if not Assigned(nodoBase) then
          Continue;

        qry.Close;
        qry.ParamByName('codBase').AsString := codBaseImportar;
        qry.ParamByName('categoria_base').AsInteger := i;
        qry.Open;

        while not qry.Eof do
        begin
          nodoHijo := TreeView_SubCategoriaImportar.AddNode(nodoBase);
          nodoHijo.Text[0] := qry.FieldByName('descripcion').AsString;
          nodoHijo.Text[1] := qry.FieldByName('ciu').AsString;
          qry.Next;
        end;
      end;

    finally
      qry.Free;
    end;

    // Ajustes de columnas (seguros)
    if TreeView_SubCategoriaImportar.Columns.Count > 0 then
      TreeView_SubCategoriaImportar.AutoSizeColumn(0);

    if TreeView_SubCategoriaImportar.Columns.Count > 1 then
      TreeView_SubCategoriaImportar.Columns[1].Width := 0;

  finally
    TreeView_SubCategoriaImportar.EndUpdate;
  end;
end;

procedure TfrmImportarRecursos2.rct_1MouseDown(Sender: TObject; Button: TMouseButton; Shift:
  TShiftState; X, Y: Single);
begin
  Self.StartWindowDrag;
end;

procedure TfrmImportarRecursos2.rct_CancelarClick(Sender: TObject);
begin
  modalresult := mrCancel;
end;

procedure TfrmImportarRecursos2.rct__AceptarClick(Sender: TObject);
begin
  guardarRecursosImportados;
  modalresult := mrOk;
end;

procedure TfrmImportarRecursos2.SeleccionarRecursosCategoriaImportar(nodo: TTMSFNCTreeViewNode);
var
  nodobase: TTMSFNCTreeViewNode;
  codCategoriaNodoPadre: string;
  codSubcategoria: string;
begin
  if Assigned(nodo) then
  begin
    codSubcategoria := nodo.Text[1];
    nodobase := nodo.GetParent;
    codCategoriaNodoPadre := daCodCategoriaPadre(nodobase.Text[0]);
    muestraRecursosaImportar(codCategoriaNodoPadre, codSubcategoria);
  end;
end;

procedure TfrmImportarRecursos2.TreeView_SubCategoriaImportarNodeClick(Sender: TObject; ANode:
  TTMSFNCTreeViewVirtualNode);
begin
  SeleccionarRecursosCategoriaImportar(ANode.Node);
end;

procedure TfrmImportarRecursos2.TreeView_SubCategoriasDragOver(Sender: TObject; const Data:
  TDragObject; const Point: TPointF; var Operation: TDragOperation);
begin
  if DragDataAsString(Data) = 'CambioRecursoJSON' then
    Operation := TDragOperation.Link
  else
    Operation := TDragOperation.None;
end;

procedure TfrmImportarRecursos2.TreeView_SubCategoriasDragDrop(Sender: TObject; const Data: TDragObject;
  const Point: TPointF);
var
  ddService: IFMXDragDropService;
  vHit: TTMSFNCTreeViewVirtualNode;
  nodoDestino, nodoExistente, nodoNuevo, n: TTMSFNCTreeViewNode;
  jsonRoot: TJSONObject;
  arr: TJSONArray;
  obj0: TJSONObject;

  codUnicoRecurso, descripcion, unidad, precio, codCPC, tipoCPC, porcentajeCPC, especificaciones: string;
  subCiuOrigen, subCiuDestino: string;
  subTextoOrigen: string;

  function GetDropTarget(out TargetNode: TTMSFNCTreeViewNode; out HitVirtual: TTMSFNCTreeViewVirtualNode):
      Boolean;
  begin
    Result := False;
    TargetNode := nil;
    HitVirtual := nil;

    if not Assigned(TreeView_SubCategorias) then
      Exit;

    HitVirtual := TreeView_SubCategorias.XYToNode(Point.X, Point.Y, 0);
    if not Assigned(HitVirtual) then
      Exit;

    if HitVirtual.Level <= 0 then
      Exit; // no permitir drop en categoría raíz

    TargetNode := HitVirtual.Node;
    if not Assigned(TargetNode) then
      Exit;

    // Si dropean en un recurso (nivel > 1), el destino real es su padre (subcategoría)
    if HitVirtual.Level > 1 then
      TargetNode := TargetNode.GetParent;

    Result := Assigned(TargetNode);
  end;

  function JsonStrSafe(const O: TJSONObject; const Name: string): string;
  var
    V: TJSONValue;
  begin
    Result := '';
    if not Assigned(O) then
      Exit;
    V := O.GetValue(Name);
    if not Assigned(V) or V.Null then
      Exit;
    Result := V.Value;
  end;

begin
  // Servicio DragDrop
  if not TPlatformServices.Current.SupportsPlatformService(IFMXDragDropService, ddService) then
    Exit;

  // Valida que sea nuestro tipo de drag
  if DragDataAsString(Data) <> 'CambioRecursoJSON' then
    Exit;

  // Determinar nodo destino (subcategoría)
  if not GetDropTarget(nodoDestino, vHit) then
  begin
    FMouseDown := False;
    FDragging := False;
    Exit;
  end;

  // Debe existir JSON en cache
  if Trim(FLastDragJSON) = '' then
  begin
    FMouseDown := False;
    FDragging := False;
    Exit;
  end;

  // Parse JSON
  jsonRoot := TJSONObject.ParseJSONValue(FLastDragJSON) as TJSONObject;
  try
    if not Assigned(jsonRoot) then
      Exit;

    arr := jsonRoot.GetValue('CambioRecurso') as TJSONArray;
    if not Assigned(arr) or (arr.Count = 0) then
      Exit;

    obj0 := arr.Items[0] as TJSONObject;
    if not Assigned(obj0) then
      Exit;

    // Datos del recurso
    codUnicoRecurso := JsonStrSafe(obj0, 'codUnicoRecurso');
    descripcion := JsonStrSafe(obj0, 'descripcion');
    unidad := JsonStrSafe(obj0, 'unidad');
    precio := JsonStrSafe(obj0, 'precio');
    codCPC := JsonStrSafe(obj0, 'codCPC');
    especificaciones := JsonStrSafe(obj0, 'especificaciones');
    tipoCPC := JsonStrSafe(obj0, 'tipoCPC');
    porcentajeCPC := JsonStrSafe(obj0, 'porcentajeCPC');

    // FIX BUG 3: CIU estable de subcategoría
    subCiuOrigen := Trim(JsonStrSafe(obj0, 'ciuSubcategoria'));
    subTextoOrigen := Trim(JsonStrSafe(obj0, 'subcategoriaTexto')); // opcional

    // CIU destino (daSubCategoriaInicial ya debe devolver Text[1])
    subCiuDestino := Trim(daSubCategoriaInicial(vHit));

    if (Norm(subCiuOrigen) = '') or (Norm(subCiuDestino) = '') then
      Exit;

    // Si quieres BLOQUEAR drops a otra subcategoría, descomenta:
    // if Norm(subCiuOrigen) <> Norm(subCiuDestino) then Exit;

    // Si son distintas, pregunta (recomendado para “importar” real)
    if Norm(subCiuOrigen) <> Norm(subCiuDestino) then
    begin
      if realizarPreguntaSiNo(
        'Importar desde "' + subTextoOrigen + '" a otra subcategoría. ¿Continuar?'
        ) <> mrOk then
        Exit;
    end;

    // Buscar si ya existe en el árbol (tu función actual trabaja por texto de subcategoría)
    // nodoDestino es subcategoría, su Text[0] es el caption visible.
    nodoExistente := compruebaRecursoRepetido(nodoDestino, nodoDestino.Text[0], descripcion, unidad);

    if Assigned(nodoExistente) then
    begin
      if realizarPreguntaSiNo(
        'Recurso existente, ¿desea reemplazar los datos?' + sLineBreak +
        'P. Actual: ' + base_activa.simboloMoneda + nodoExistente.Text[3] +
        ' -> P. Nuevo: ' + precio
        ) = mrOk then
      begin
        // Re-ubicar nodo real (por seguridad)
        n := compruebaRecursoRepetido(nil, nodoDestino.Text[0], descripcion, unidad);
        if not Assigned(n) then
          Exit;

        SafeSetTextNode(n, 3, precio);
        if Trim(codCPC) <> '' then
          SafeSetTextNode(n, 4, codCPC);
        if Trim(especificaciones) <> '' then
          SafeSetTextNode(n, 5, especificaciones);

        SafeSetTextNode(n, 6, 'Actualizar');
        SafeSetTextNode(n, 7, tipoCPC);
        SafeSetTextNode(n, 8, porcentajeCPC);
      end;
    end
    else
    begin
      TreeView_SubCategorias.BeginUpdate;
      try
        nodoNuevo := TreeView_SubCategorias.AddNode(nodoDestino);

        SafeSetTextNode(nodoNuevo, 0, descripcion);
        SafeSetTextNode(nodoNuevo, 1, codUnicoRecurso);
        SafeSetTextNode(nodoNuevo, 2, unidad);
        SafeSetTextNode(nodoNuevo, 3, precio);
        SafeSetTextNode(nodoNuevo, 4, codCPC);
        SafeSetTextNode(nodoNuevo, 5, especificaciones);
        SafeSetTextNode(nodoNuevo, 6, 'Actualizar');
        SafeSetTextNode(nodoNuevo, 7, tipoCPC);
        SafeSetTextNode(nodoNuevo, 8, porcentajeCPC);
      finally
        TreeView_SubCategorias.EndUpdate;
      end;
    end;

  finally
    jsonRoot.Free;
    FMouseDown := False;
    FDragging := False;
  end;
end;

end.

