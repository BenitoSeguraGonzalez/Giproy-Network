unit uAddAPU;

interface

uses
  System.SysUtils, System.Types, System.UITypes, System.Classes,
  System.Variants, FMX.Types,
  FMX.Controls, FMX.Forms, FMX.Graphics, FMX.Dialogs, FMX.TMSFNCTypes,
  FMX.TMSFNCUtils,
  FMX.TMSFNCGraphics, FMX.TMSFNCGraphicsTypes, FMX.Platform, FMX.TMSFNCGridCell,
  FMX.TMSFNCGridOptions, FMX.Effects, Uni, System.Math, FMX.TMSFNCCustomControl,
  FMX.Ani,
  FMX.TMSFNCCustomScrollControl, FMX.TMSFNCGridData, FMX.TMSFNCCustomGrid,
  FMX.TMSFNCGrid,
  FMX.Objects, FMX.Controls.Presentation, FMX.StdCtrls, FMX.Layouts,
  FMX.TreeView, FMX.ListBox,
  FMX.Edit, System.StrUtils, FMX.TMSBaseControl, FMX.TMSTreeViewBase,
  FMX.TMSTreeViewData,
  FMX.TMSCustomTreeView, FMX.TMSTreeView, FMX.Menus, System.ImageList,
  FMX.ImgList,
  System.Generics.Collections,
  Winapi.Windows, UniProvider, MySQLUniProvider, DB, EditNumericHelper,
  formutils, uRectFillBitmapColoriz,
  uAPUModel, uFMXTooltip,
  System.Rtti;

const
  {(*}
  COL_COD       = 0; // codigo completo
  COL_DESC      = 1; // descripcion
  COL_UNI       = 2; // unidad
  COL_CANT      = 3; // cantidad
  COL_PRE       = 4; // precio
  COL_REND      = 5; // rendimiento
  COL_TOT       = 6; // total
  COL_PORC      = 7; // porcentaje
  COL_CAT       = 8; // categoria base
  COL_ID        = 9; // SIEMPRE idUnicoRecurso (string)
  COL_APU       = 10; // codAPU anidado (solo si aplica, si no '')
  COL_FLAG_GRID = 11;
  COL_FLAG      = 20; // flag modificar
  {*)}

type
  TAPUItem = record
    IdUnicoRecurso: string;
    CodCategoria: string;
    CodSubCategoria: string;
    CodRecurso: string;
    CodRecursoCompleto: string;
    Descripcion: string;
    Unidad: string;
    Precio: Double;
    Cantidad: Double;
    Rendimiento: Double;
    Total: Double;
    Porcentaje: Double;
  end;

  TAPUModel = class
  private
    FCodAPU: string;
    FCodRecursoAPU: Integer;
    FItems: TList<TAPUItem>;

  public
    constructor Create;
    destructor Destroy; override;

    property CodAPU: string read FCodAPU write FCodAPU;
    property CodRecursoAPU: Integer read FCodRecursoAPU write FCodRecursoAPU;
    property Items: TList<TAPUItem>read FItems;

    procedure Clear;
    procedure RebuildFromTree(ATree: TTMSFMXTreeView);
  end;

type
  datActualizacion = record
    IdUnicoRecurso: string;
    Descripcion: string;
    Precio: string;
  end;

type
  unidades = record
    codigo: string;
    Descripcion: string;
  end;

type
  TfrmAddAPU = class(TForm)
    lyt_Background: TLayout;
    ilAPU1: TImageList;
    lyt_Body: TLayout;
    rect_2: TRectangle;
    lyt_3: TLayout;
    rect_3: TRectangle;
    lyt_6: TLayout;
    rect_4: TRectangle;
    lyt_DatosAPUS: TLayout;
    lyt_9: TLayout;
    lbl_3: TLabel;
    lyt_2: TLayout;
    lyt_10: TLayout;
    lyt_15: TLayout;
    rect_11: TRectangle;
    edt_FindCategorias: TEdit;
    Shadow_FindCategorias: TShadowEffect;
    rect_bntFindCategoria: TRectangle;
    tv_SubCategoriaAPU: TTMSFMXTreeView;
    spl2: TSplitter;
    lyt_4: TLayout;
    lyt_8: TLayout;
    lyt_16: TLayout;
    rect_5: TRectangle;
    edt_FindRecursos: TEdit;
    Shadow_FindRecursos: TShadowEffect;
    rect_btnFindRecursos: TRectangle;
    lyt_17: TLayout;
    grid_APUSRecursos: TTMSFNCGrid;
    lyt_29: TLayout;
    lyt_32: TLayout;
    lbl_1: TLabel;
    lbl_nItemsMostrados: TLabel;
    lyt_33: TLayout;
    lbl_CategoriaItemMostrado: TLabel;
    lyt_1: TLayout;
    lyt_11: TLayout;
    lbl_11: TLabel;
    lyt_12: TLayout;
    lyt_54: TLayout;
    grdpnlyt2: TGridPanelLayout;
    lyt_30: TLayout;
    lbl_6: TLabel;
    edt_APUSDescripcion: TEdit;
    lyt_31: TLayout;
    lbl_7: TLabel;
    lyt_132: TLayout;
    lyt_35: TLayout;
    lbl_8: TLabel;
    lbl_APUSRendimiento: TLabel;
    lyt_36: TLayout;
    chkRevision: TCheckBox;
    lyt_112: TLayout;
    chkRendimiento: TCheckBox;
    lyt_13: TLayout;
    rect_6: TRectangle;
    lyt_18: TLayout;
    grdpnlyt1: TGridPanelLayout;
    lyt_19: TLayout;
    lbl_4: TLabel;
    lyt_20: TLayout;
    rect_7: TRectangle;
    lbl_APUCostoDirectoTotal: TLabel;
    lyt_21: TLayout;
    lbl_5: TLabel;
    lyt_27: TLayout;
    ln_ln2: TLine;
    edt_PorcentajeIndirecto: TEdit;
    lbl_12: TLabel;
    lyt_22: TLayout;
    rect_8: TRectangle;
    lbl_APUCostoIndirectoTotal: TLabel;
    lyt_23: TLayout;
    lbl_9: TLabel;
    lyt_24: TLayout;
    rect_9: TRectangle;
    lbl_APUPrecioUnitario: TLabel;
    lyt_14: TLayout;
    trvw_APUS: TTMSFMXTreeView;
    spl1: TSplitter;
    lyt_7: TLayout;
    lbl_Titulo2: TLabel;
    lyt_footer: TLayout;
    rect_Cancelar: TRectangle;
    iGlow_Cancelar: TInnerGlowEffect;
    lbl_modo: TLabel;
    lbl_codAPU: TLabel;
    lyt_Aceptar: TLayout;
    rect_Aceptar: TRectangle;
    iGlow_Aceptar: TInnerGlowEffect;
    lbl_codSubCategoria: TLabel;
    lyt_header: TLayout;
    rect_1: TRectangle;
    lbl_Titulo1: TLabel;
    pm1: TPopupMenu;
    MenuItem5: TMenuItem;
    MenuItem2: TMenuItem;
    MenuItem3: TMenuItem;
    MenuItem4: TMenuItem;
    MenuItem6: TMenuItem;
    lbl_rendimientoHUnidad: TLabel;
    lbl_HombresCuadrilla: TLabel;
    cb_unidades: TComboBox;
    rect_addUnidades: TRectangle;
    rect_editUnidades: TRectangle;
    procedure rect_CloseMouseUp(Sender: TObject; Button: TMouseButton;
      Shift: TShiftState; X, Y: Single);
    procedure edt_FindRecursosEnter(Sender: TObject);
    procedure edt_FindRecursosExit(Sender: TObject);
    procedure edt_FindCategoriasEnter(Sender: TObject);
    procedure edt_FindCategoriasExit(Sender: TObject);
    procedure tv_SubCategoriaAPUNodeClick(Sender: TObject;
      ANode: TTMSFMXTreeViewVirtualNode);
    procedure edt_PorcentajeIndirectoChange(Sender: TObject);

    procedure rect_CancelarMouseEnter(Sender: TObject);
    procedure rect_CancelarMouseLeave(Sender: TObject);
    procedure lbl_Titulo1MouseDown(Sender: TObject; Button: TMouseButton;
      Shift: TShiftState; X, Y: Single);
    procedure lyt_111MouseDown(Sender: TObject; Button: TMouseButton;
      Shift: TShiftState; X, Y: Single);
    procedure lyt_26MouseDown(Sender: TObject; Button: TMouseButton;
      Shift: TShiftState; X, Y: Single);
    procedure rect_bntFindCategoriaMouseUp(Sender: TObject;
      Button: TMouseButton; Shift: TShiftState; X, Y: Single);
    procedure rect_btnFindRecursosMouseUp(Sender: TObject; Button: TMouseButton;
      Shift: TShiftState; X, Y: Single);
    procedure edt_FindCategoriasKeyUp(Sender: TObject; var Key: Word;
      var KeyChar: Char; Shift: TShiftState);
    procedure lbl_Titulo2KeyDown(Sender: TObject; var Key: Word;
      var KeyChar: Char; Shift: TShiftState);
    procedure MenuItem2Click(Sender: TObject);
    procedure FormShow(Sender: TObject);
    procedure lyt_28MouseEnter(Sender: TObject);
    procedure lyt_28MouseLeave(Sender: TObject);
    procedure tv_SubCategoriaAPUKeyUp(Sender: TObject; var Key: Word;
      var KeyChar: Char; Shift: TShiftState);
    procedure edt_FindRecursosChangeTracking(Sender: TObject);
    procedure rect_AceptarMouseEnter(Sender: TObject);
    procedure rect_AceptarMouseLeave(Sender: TObject);
    procedure rect_1MouseDown(Sender: TObject; Button: TMouseButton;
      Shift: TShiftState; X, Y: Single);
    procedure trvw_APUSAfterUpdateNode(Sender: TObject;
      ANode: TTMSFMXTreeViewVirtualNode; AColumn: Integer);
    procedure trvw_APUSBeforeOpenInplaceEditor(Sender: TObject;
      ANode: TTMSFMXTreeViewVirtualNode; AColumn: Integer;
      var ACanOpen: Boolean);
    procedure trvw_APUSBeforeReorderNode(Sender: TObject;
      AFromNode, AToNode: TTMSFMXTreeViewVirtualNode; var ACanReorder: Boolean);
    procedure trvw_APUSGetInplaceEditor(Sender: TObject;
      ANode: TTMSFMXTreeViewVirtualNode; AColumn: Integer;
      var ATransparent: Boolean;
      var AInplaceEditorClass: TTMSFMXTreeViewInplaceEditorClass);
    procedure trvw_APUSNodeClick(Sender: TObject;
      ANode: TTMSFMXTreeViewVirtualNode);
    procedure rect_AceptarClick(Sender: TObject);
    procedure grid_APUSRecursosCellEditGetData(Sender: TObject;
      ACol, ARow: Integer; CellEditor: TTMSFNCGridEditor;
      var CellString: string);
    procedure grid_APUSRecursosCellEditDone(Sender: TObject;
      ACol, ARow: Integer; CellEditor: TTMSFNCGridEditor);
    procedure rect_CancelarClick(Sender: TObject);
    procedure grid_APUSRecursosCellDblClick(Sender: TObject;
      ACol, ARow: Integer);
    procedure FormMouseDown(Sender: TObject; Button: TMouseButton;
      Shift: TShiftState; X, Y: Single);
    procedure trvw_APUSKeyDown(Sender: TObject; var Key: Word;
      var KeyChar: WideChar; Shift: TShiftState);
    procedure grid_APUSRecursosCellEditCancel(Sender: TObject;
      ACol, ARow: Integer);
    procedure grid_APUSRecursosKeyUp(Sender: TObject; var Key: Word;
      var KeyChar: WideChar; Shift: TShiftState);
    procedure rect_addUnidadesClick(Sender: TObject);
    procedure rect_editUnidadesClick(Sender: TObject);
    procedure cb_unidadesChange(Sender: TObject);
    procedure rect_addUnidadesMouseEnter(Sender: TObject);
    procedure rect_addUnidadesMouseLeave(Sender: TObject);
    procedure rect_editUnidadesMouseEnter(Sender: TObject);
    procedure rect_editUnidadesMouseLeave(Sender: TObject);
    procedure MenuItem5Click(Sender: TObject);
    procedure FormCreate(Sender: TObject);
    procedure grid_APUSRecursosSelectCell(Sender: TObject; ACol, ARow: Integer;
      var Allow: Boolean);
    procedure FormDestroy(Sender: TObject);
    procedure grid_APUSRecursosMouseLeave(Sender: TObject);
    procedure grid_APUSRecursosMouseMove(Sender: TObject; Shift: TShiftState; X,
      Y: Single);
    procedure trvw_APUSDblClick(Sender: TObject);
    procedure trvw_APUSMouseMove(Sender: TObject; Shift: TShiftState; X,
      Y: Single);
  private
    { Private declarations }

    FLoadingRecursos: Boolean;
    FLoadingCategorias: Boolean;

    FEditColumn: Integer;
    WasEditing: Boolean;
    ACOLMouseAPUS: integer;

    FTVEditing: Boolean;
    FTVEditNode: TTMSFMXTreeViewNode;
    FTVOldText: string;

    listadoUnidadesAPU: array of unidades;
    unidadAPU: string;

    FTooltip: TFMXTooltip;

    RootNodes: array[1..5] of TTMSFMXTreeViewNode;

    procedure TVBeginEdit(AVNode: TTMSFMXTreeViewVirtualNode);
    procedure TVCancelEdit;
    procedure FadeControl(AControl: TControl; const FadeIn: Boolean;
      const DurationSec: Single = 0.12);
    procedure HideColSafe(AGrid: TTMSFNCGrid; ACol: Integer);
    procedure addItemSucategoria(const AParentIndex, ACatBaseDB, ACiu: Integer;
      const ADescripcion: string);
    procedure muestraAPUSRecursos(codBase: string; categoria_base: string;
      ciu: string);
    procedure AddAPU(categoriaBase, SubCategoria, CodRecurso: Integer;
      Descripcion, Precio, Unidad, idUnico, CodAPU: string);
    procedure actualizaListadoAPUSubcagoriaFiltrado(filtro: string);
    procedure actualizaRendimientoTotal();
    procedure actualizaApusenCreacion(idUnico, Descripcion, Unidad, Precio,
      categoriaBase: string);
    // procedure actualizaAnidosConRecurso(const codAPU: string);
    procedure CallUpdatePresupuestoItemsSafe(const ACodApu: string);
    procedure CambiaValoresGridRecursos(IdUnicoRecurso, Descripcion: string;
      Precio: currency);
    procedure MarkRecursoModifiedInTree(const AIdUnico, ADesc, APrecio: string);
    procedure MarkGApusRecursos(ARow: Integer);
    procedure ActualizaRecursos();
    procedure populaUnidadesAPU();
    procedure PropagateApuAsRecursoChange(const ACodApuChanged: string);
    procedure EditarRecursos();
    procedure ActualizaNodoRecurso(ANode: TTMSFMXTreeViewNode; const
      ADescripcion: string; const APrecio:
      currency);
    procedure InitRootNodes;

    function guardarNuevaAPU(): string;
    function actualizarAPU(): string;
    function RecursoDuplicado(Descripcion, Unidad: string): Boolean;
    function daPrecioMO(): string;
    function AntiguoValortrvw(): string;
    function TVIsEditing: Boolean;
    function DaCodigoUnidad(Dunidad: string): string;
    function DaDescripcionUnidad(CUnidad: string): string;

  public
    { Public declarations }
    codRecApuT: string;
    procedure actualizaListadoAPUSubcategoria();
    procedure limpiaListatoRecursos();
    procedure limpiaItemsAPU(idItem: Integer);
    procedure LimpiaAPU();
    procedure calculaTotales();
    procedure actualizaDatosRecursos();
    procedure muestraAPUSTodosRecursos(const codBase, categoria_base: string);
    procedure MuestraSubCategoriaItemsAPUSRecursos(codCompletoItem: string);
    procedure cuentaItemsAPUSRecursos();
    procedure cargaAPUEdicion(const CodAPU: string);
    procedure limpiaNuevaAPUs();
    procedure cargarValoresInicialesTrvw(trvw: TTMSFMXTreeView);
    procedure cargarValoresInicialesTrvw2(trvw: TTMSFMXTreeView);
    function calcularTotal(Cantidad, Precio, Rendimiento: string;
      categoriaBase: Integer): string;
  end;

var
  frmAddAPU: TfrmAddAPU;
  antiguoValor: string;
  columnaSelecionda: Integer;
  rendimientoGlobal: Double;
  antiguoValorGrid: string;

procedure NodeTextSetSafe(const ANode: TTMSFMXTreeViewNode;
  const AIndex: Integer; const AValue: string);
procedure EnsureTreeColumnsForAPU(const TV: TTMSFMXTreeView;
  const NeededIndex: Integer);

function SafeStrToInt(const S: string; const ADefault: Integer = 0): Integer;
function SafeStrToFloat(const S: string; const ADefault: Double = 0): Double;
function S2F(const S: string; const Def: Double = 0): Double;
function NodeTextSafe(const ANode: TTMSFMXTreeViewNode;
  const AIndex: Integer): string;
function Clamp(const V, AMin, AMax: Integer): Integer;
function S2FLocal(const S: string; const Def: Double = 0): Double;
function FmtPorcD(const AValue: Double): string; inline;
function FmtMonD(const AValue: Double): string; inline;
function FmtPresuD(const AValue: Double): string; inline;
function _FmtDec(const AValue: Double; const ADecs: Integer): string;
function ToFloatDef(const A: string; const Def: Double = 0): Double;

implementation

{$R *.fmx}

uses
  DM1, uNuevoRecurso, uMain, uEditorUnidades;

procedure TfrmAddAPU.InitRootNodes;
begin
  RootNodes[1] := trvw_APUS.AddNode(nil);
  RootNodes[2] := trvw_APUS.AddNode(nil);
  RootNodes[3] := trvw_APUS.AddNode(nil);
  RootNodes[4] := trvw_APUS.AddNode(nil);
  //RootNodes[5] := trvw_APUS.AddNode(nil);

  NodeTextSetSafe(RootNodes[1], COL_DESC, 'Mano de obra');
  NodeTextSetSafe(RootNodes[2], COL_DESC, 'Materiales');
  NodeTextSetSafe(RootNodes[3], COL_DESC, 'Equipos');
  NodeTextSetSafe(RootNodes[4], COL_DESC, 'Transporte');
 // NodeTextSetSafe(RootNodes[5], COL_DESC, 'Seguridad');
end;

constructor TAPUModel.Create;
begin
  inherited;
  FItems := TList<TAPUItem>.Create;
end;

procedure TfrmAddAPU.cargaAPUEdicion(const CodAPU: string);
var
  Q: TUniQuery;
  costoDirecto, costoIndirecto, porcentajeIndirecto, totalAPU: Double;
  LoadedOk: Boolean;

  procedure Dbg(const S: string);
  begin
    OutputDebugString(PChar('[cargaAPUEdicion] ' + S));
  end;

  function NodeIndexFromCategoria(const ACodCat: Integer): Integer;
  var
    X: Integer;
  begin
    X := ACodCat;
    if X = 6 then
      X := 2;
    Result := X - 1;
  end;

  function TryGetRootNode(const ACodCat: Integer;
    out ANode: TTMSFMXTreeViewNode): Boolean;
  begin
    Result := False;
    ANode := nil;

    if (ACodCat < Low(RootNodes)) or (ACodCat > High(RootNodes)) then
    begin
      Dbg(Format('Categoria UI fuera de rango. ACodCat=%d', [ACodCat]));
      Exit;
    end;

    ANode := RootNodes[ACodCat];
    Result := Assigned(ANode);
  end;

  function SafeFieldStr(const F: TField): string;
  begin
    if Assigned(F) then
      Result := F.AsString
    else
      Result := '';
  end;

  function SafeToFloat(const S: string; const ADefault: Double = 0): Double;
  var
    t: string;
  begin
    t := Trim(S);
    if t = '' then
      Exit(ADefault);

    t := StringReplace(t, '%', '', [rfReplaceAll]);

    if not TryStrToFloat(t, Result) then
    begin
      if not TryStrToFloat(StringReplace(t, ',', '.', [rfReplaceAll]), Result)
        then
        Result := ADefault;
    end;
  end;

  function AllowCategoria(const ACodCat: Integer): Boolean;
  begin
    if (not base_activa.SeguridadIndustrial) and (ACodCat = 5) then
      Exit(False);
    Result := True;
  end;

  procedure FillHeaderFromQuery;
  var
    tUnidad: string;
  begin
    edt_APUSDescripcion.Text := Q.FieldByName('descripcion').AsString;

    tUnidad := Q.FieldByName('unidad').AsString;
    tUnidad := DaDescripcionUnidad(tUnidad);
    unidadAPU := tUnidad;
    posicionaCombo(cb_unidades, tUnidad);

    codCategoriaAPUSeleccionada := Q.FieldByName('codCategoriaApu').AsString;
    CategoriaAPUSeleccionada := Q.FieldByName('CategoriaAPU').AsString;

    lbl_codAPU.Text := CodAPU;
    lbl_APUSRendimiento.Text := Q.FieldByName('rendimiento').AsString;

    lbl_APUCostoDirectoTotal.Text :=
      Q.FieldByName('CostoDirectoTotal').AsString;

    lbl_APUCostoIndirectoTotal.Text :=
      Q.FieldByName('CostoIndirectoTotal').AsString;

    if lbl_modo.Text <> '3' then
      edt_PorcentajeIndirecto.Text :=
        Q.FieldByName('PorcentajeCostoIndirecto').AsString
    else
      edt_PorcentajeIndirecto.Text := FloatToStr(IndirectosPresupuesto);

    lbl_APUPrecioUnitario.Text :=
      decimal_correcto(Q.FieldByName('PrecioUnitarioTotal').AsString);

    chkRevision.IsChecked :=
      Q.FieldByName('pendienteRevision').AsInteger > 0;
  end;

  procedure FillHeaderFromTanteo;
  var
    tUnidad: string;
    FDescripcion, FUnidad, FCategoriaApu, FCategoriaDesc,
      FRendimiento, FCostoDirecto, FPendiente: TField;
  begin
    if not Q.Active then
      Exit;

    FDescripcion := Q.FindField('descripcion');
    FUnidad := Q.FindField('unidad');
    FCategoriaApu := Q.FindField('codCategoriaApu');
    FCategoriaDesc := Q.FindField('CategoriaAPU');
    FRendimiento := Q.FindField('rendimiento');
    FCostoDirecto := Q.FindField('CostoDirectoTotal');
    FPendiente := Q.FindField('pendienteRevision');

    edt_APUSDescripcion.Text := SafeFieldStr(FDescripcion);

    tUnidad := SafeFieldStr(FUnidad);
    tUnidad := DaDescripcionUnidad(tUnidad);
    unidadAPU := tUnidad;
    posicionaCombo(cb_unidades, tUnidad);

    codCategoriaAPUSeleccionada := SafeFieldStr(FCategoriaApu);
    CategoriaAPUSeleccionada := SafeFieldStr(FCategoriaDesc);

    lbl_codAPU.Text := CodAPU;
    lbl_APUSRendimiento.Text := SafeFieldStr(FRendimiento);

    lbl_APUCostoDirectoTotal.Text := SafeFieldStr(FCostoDirecto);

    costoDirecto := SafeToFloat(
      decimal_correcto(lbl_APUCostoDirectoTotal.Text), 0);

    if lbl_modo.Text <> '3' then
      edt_PorcentajeIndirecto.Text := FloatToStr(base_activa.indirectos)
    else
      edt_PorcentajeIndirecto.Text := FloatToStr(IndirectosPresupuesto);

    porcentajeIndirecto :=
      SafeToFloat(decimal_correcto(edt_PorcentajeIndirecto.Text), 0);

    costoIndirecto := (costoDirecto * porcentajeIndirecto) / 100;
    totalAPU := costoDirecto + costoIndirecto;

    lbl_APUCostoIndirectoTotal.Text := FloatToStr(costoIndirecto);
    lbl_APUPrecioUnitario.Text := FloatToStr(totalAPU);

    if Assigned(FPendiente) then
      chkRevision.IsChecked := FPendiente.AsBoolean
    else
      chkRevision.IsChecked := False;
  end;

  procedure AddItemNodeFromRow;
  var
    node, subNode: TTMSFMXTreeViewNode;
    catDB, catUI: Integer;
    categoriaBase, SubCategoria, CodRecurso: string;
    Cantidad, Precio, Rendimiento, Total: string;
    porcStr: string;
    IdUnicoRecurso, codAPUAnidado: string;
    vCant, vPre, vRend: Double;

    FcodCategoria,
      FcodSubCategoria,
      FcodRecurso,
      Fdescripcion,
      Funidad,
      Fcantidad,
      Fprecio,
      Frendimiento,
      Fporcentaje,
      FidRecurso,
      FcodAPU: TField;

  begin
    if not Q.Active then
      Exit;

    { cache campos }
    FcodCategoria := Q.FindField('codCategoria');
    if not Assigned(FcodCategoria) then
      Exit;

    FcodSubCategoria := Q.FindField('codSubCategoria');
    FcodRecurso := Q.FindField('codRecurso');
    Fdescripcion := Q.FindField('descripcion');
    Funidad := Q.FindField('Unidad');
    Fcantidad := Q.FindField('CantidadUnidad');
    Fprecio := Q.FindField('precio');
    Frendimiento := Q.FindField('rendimiento');
    Fporcentaje := Q.FindField('porcentaje');
    FidRecurso := Q.FindField('idUnicoRecurso');
    FcodAPU := Q.FindField('codAPU');

    { categoria }
    catDB := FcodCategoria.AsInteger;

    if not AllowCategoria(catDB) then
      Exit;

    if catDB = 6 then
      catUI := 2
    else
      catUI := catDB;

    if (catUI < 1) or (catUI > 5) then
      Exit;

    node := RootNodes[catUI];
    if not Assigned(node) then
      Exit;

    { datos base }
    categoriaBase := SafeFieldStr(FcodCategoria);
    SubCategoria := SafeFieldStr(FcodSubCategoria);
    CodRecurso := SafeFieldStr(FcodRecurso);

    subNode := trvw_APUS.AddNode(node);

    NodeTextSetSafe(subNode, COL_COD,
      generaCodigoRecurso(categoriaBase, SubCategoria, CodRecurso));

    NodeTextSetSafe(subNode, COL_DESC,
      SafeFieldStr(Fdescripcion));

    NodeTextSetSafe(subNode, COL_UNI,
      SafeFieldStr(Funidad));

    { cantidad }
    vCant := S2FLocal(SafeFieldStr(Fcantidad), 0);
    Cantidad := FmtPresuD(vCant);
    NodeTextSetSafe(subNode, COL_CANT, Cantidad);

    { precio }
    vPre := S2FLocal(SafeFieldStr(Fprecio), 0);
    Precio := FmtMonD(vPre);
    NodeTextSetSafe(subNode, COL_PRE, Precio);

    { rendimiento }
    if (catUI = 1) or (catUI = 3) or (catUI = 4) then
    begin
      vRend := S2FLocal(SafeFieldStr(Frendimiento), 1);
      Rendimiento := FmtPresuD(vRend);
    end
    else
      Rendimiento := '';

    NodeTextSetSafe(subNode, COL_REND, Rendimiento);

    { total }
    Total := calcularTotal(Cantidad, Precio, Rendimiento, catUI);
    Total := FmtMonD(S2FLocal(Total, 0));
    NodeTextSetSafe(subNode, COL_TOT, Total);

    { porcentaje }
    porcStr := FmtPorcD(S2FLocal(SafeFieldStr(Fporcentaje), 0)) + '%';
    NodeTextSetSafe(subNode, COL_PORC, porcStr);

    { categoria real }
    NodeTextSetSafe(subNode, COL_CAT, IntToStr(catDB));

    { id recurso }
    IdUnicoRecurso := SafeFieldStr(FidRecurso);
    NodeTextSetSafe(subNode, COL_ID, IdUnicoRecurso);

    { APU anidado }
    codAPUAnidado := '';
    if (catDB = 6) and Assigned(FcodAPU) then
      codAPUAnidado := FcodAPU.AsString;

    NodeTextSetSafe(subNode, COL_APU, codAPUAnidado);

    NodeTextSetSafe(subNode, COL_FLAG, '');
  end;

  procedure LoadNormal;
  begin
    Q.Close;
    Q.SQL.Text :=
      'SELECT * FROM APUS WHERE codAPU=:codAPU AND codBase=:codBase';
    Q.ParamByName('codAPU').AsString := CodAPU;
    Q.ParamByName('codBase').AsString := base_activa.codBase;
    Q.Open;

    if Q.IsEmpty then
      raise Exception.CreateFmt(
        'No existe APU %s en base %s', [CodAPU, base_activa.codBase]);

    FillHeaderFromQuery;

    Q.Close;
    Q.SQL.Text :=
      'SELECT * FROM APUS_Items WHERE codAPU=:codAPU AND codBase=:codBase';
    Q.ParamByName('codAPU').AsString := CodAPU;
    Q.ParamByName('codBase').AsString := base_activa.codBase;
    Q.Open;

    while not Q.Eof do
    begin
      AddItemNodeFromRow;
      Q.Next;
    end;
  end;

  procedure LoadTanteo;
  var
    HeaderLoaded: Boolean;
  begin
    // 1) EXISTENCIA REAL DEL APU: siempre desde APUS
    Q.Close;
    Q.SQL.Text :=
      'SELECT * FROM APUS WHERE codAPU=:codAPU AND codBase=:codBase';
    Q.ParamByName('codAPU').AsString := CodAPU;
    Q.ParamByName('codBase').AsString := base_activa.codBase;
    Q.Open;

    if Q.IsEmpty then
      raise Exception.CreateFmt(
        'No existe APU %s en base %s', [CodAPU, base_activa.codBase]);

    // Header se carga aunque NO haya items
    FillHeaderFromQuery;

    // 2) Ahora intenta cargar items (si no hay, no es error)
    HeaderLoaded := True; // ya está cargado

    Q.Close;
    Q.SQL.Clear;
    Q.SQL.Add(daSQLQueryText(8));
    // tu SQL de tanteo (normalmente devuelve filas por items)

    Q.ParamByName('codPresupuesto').AsString := codProyecto;
    Q.ParamByName('revision').AsString := revision;
    Q.ParamByName('codBase').AsString := base_activa.codBase;
    Q.ParamByName('codAPU').AsString := CodAPU;

    Q.Open;

    // Si no hay items, simplemente termina (APU existe igual)
    if Q.IsEmpty then
      Exit;

    while not Q.Eof do
    begin
      // si tu daSQLQueryText(8) trae campos de header y quieres sobreescribir:
      // (yo NO lo haría si es un query basado en items)
      if not HeaderLoaded then
      begin
        FillHeaderFromTanteo;
        HeaderLoaded := True;
      end;

      AddItemNodeFromRow;
      Q.Next;
    end;
  end;

begin
  LoadedOk := False;

  trvw_APUS.BeginUpdate;

  trvw_APus.ClearNodes;

  InitRootNodes;

  Q := TUniQuery.Create(nil);
  try
    try
      Q.Connection := DModule_1.con2;

      if not contieneTanteo then
        LoadNormal
      else
        LoadTanteo;

      LoadedOk := True;

    except
      on E: Exception do
      begin
        addlog('ERROR: ' + E.ClassName + ' - ' + E.Message);
        raise;
      end;
    end;

  finally
    if LoadedOk then
      calculaTotales;
    Q.Free;
    trvw_APUS.EndUpdate;
  end;
end;

procedure TAPUModel.RebuildFromTree(ATree: TTMSFMXTreeView);
var
  nodo, subNodo: TTMSFMXTreeViewNode;
  Item: TAPUItem;
  Cod: string;
  i: Integer;
begin
  Clear;

  if ATree.Nodes.Count = 0 then
    raise Exception.Create('APU sin nodos en TreeView');

  // Nodo raíz = primer nodo del TreeView
  nodo := ATree.Nodes[0];

  // codRecursoAPU SIEMPRE sale del nodo raíz
  Cod := daDatoCodigo(nodo.Text[COL_COD], 3);
  if (Cod = '') or (not TryStrToInt(Cod, FCodRecursoAPU)) then
    raise Exception.Create('codRecursoAPU inválido en nodo raíz');

  // Recorremos hijos
  subNodo := nodo.GetFirstChild;
  while Assigned(subNodo) do
  begin
    if Trim(subNodo.Text[0]) <> '' then
    begin
      Item.IdUnicoRecurso := subNodo.Text[9];
      Item.CodCategoria := daDatoCodigo(subNodo.Text[0], 1);
      Item.CodSubCategoria := daDatoCodigo(subNodo.Text[0], 2);
      Item.CodRecurso := daDatoCodigo(subNodo.Text[0], 3);
      Item.CodRecursoCompleto := generaCodigoRecurso(Item.CodCategoria,
        Item.CodSubCategoria, Item.CodRecurso);

      Item.Descripcion := subNodo.Text[1];
      Item.Unidad := subNodo.Text[2];
      Item.Cantidad := ToFloatDef(subNodo.Text[3], 0);
      Item.Precio := ToFloatDef(subNodo.Text[4], 0);
      Item.Rendimiento := IfThen(subNodo.Text[5] = '', 1,
        ToFloatDef(subNodo.Text[5], 1));
      Item.Total := ToFloatDef(subNodo.Text[6], 0);
      Item.Porcentaje := ToFloatDef(ReplaceStr(subNodo.Text[7], '%', ''), 0);

      FItems.Add(Item);
    end;

    subNodo := subNodo.GetNextSibling;
  end;
end;

destructor TAPUModel.Destroy;
begin
  FItems.Free;
  inherited;
end;

procedure TAPUModel.Clear;
begin
  FItems.Clear;
  FCodRecursoAPU := 0;
end;

procedure TfrmAddAPU.ActualizaNodoRecurso(ANode: TTMSFMXTreeViewNode;
  const ADescripcion: string; const APrecio: currency);
var
  cat: Integer;
  Cantidad, precioStr, rend, Total: string;
  IdUnicoRecurso: string;
begin
  if not Assigned(ANode) then
    Exit;

  // Actualizar datos visibles
  NodeTextSetSafe(ANode, COL_DESC, ADescripcion);
  NodeTextSetSafe(ANode, COL_PRE, FmtMonD(APrecio));

  // Marcar modificación
  NodeTextSetSafe(ANode, COL_FLAG, 'modificar');

  cat := SafeStrToInt(Trim(NodeTextSafe(ANode, COL_CAT)), 0);

  // Rendimiento
  rend := Trim(NodeTextSafe(ANode, COL_REND));
  if not ((cat = 1) or (cat = 3) or (cat = 4)) then
  begin
    rend := '';
    NodeTextSetSafe(ANode, COL_REND, '');
  end;

  if rend = '' then
    rend := '1';

  // Recalcular total
  Cantidad := decimal_correcto(NodeTextSafe(ANode, COL_CANT));
  precioStr := decimal_correcto(FmtMonD(APrecio));

  Total := calcularTotal(Cantidad, precioStr, rend, cat);
  NodeTextSetSafe(ANode, COL_TOT, Total);

  // Sincronizar con grid / cache
  IdUnicoRecurso := Trim(NodeTextSafe(ANode, COL_ID));
  CambiaValoresGridRecursos(IdUnicoRecurso, ADescripcion, APrecio);
  MarkRecursoModifiedInTree(IdUnicoRecurso, ADescripcion, precioStr);

  calculaTotales;
end;

procedure TfrmAddAPU.cargarValoresInicialesTrvw2(trvw: TTMSFMXTreeView);
var
  nodo: TTMSFMXTreeViewNode;
  X: Integer;
begin
  trvw.ClearNodes;
  nodo := trvw.addnode;
  nodo.Text[0] := 'Equipos y Herramientas';
  nodo.Extended := True;
  nodo := trvw.addnode;
  nodo.Text[0] := 'Materiales';
  nodo.Extended := True;
  nodo := trvw.addnode;
  nodo.Text[0] := 'Transporte';
  nodo.Extended := True;
  nodo := trvw.addnode;
  nodo.Text[0] := 'Mano de Obra';
  nodo.Extended := True;
  {
    if base_activa.SeguridadIndustrial then
    begin
    nodo := trvw.addnode;
    nodo.Text[0] := 'Seguridad Industrial';
    nodo.Extended := True;
    end;
  }
  nodo := trvw.addnode;
  nodo.Text[0] := 'Análisis de Precios Unitarios';
  nodo.Extended := True;
  trvw.CollapseAll;
end;

procedure TfrmAddAPU.cargarValoresInicialesTrvw(trvw: TTMSFMXTreeView);
var
  nodo: TTMSFMXTreeViewNode;
  X: Integer;
begin
  trvw.ClearNodes;
  nodo := trvw.addnode;
  nodo.Text[0] := 'Equipos y Herramientas';
  nodo.Extended := True;
  nodo := trvw.addnode;
  nodo.Text[0] := 'Materiales';
  nodo.Extended := True;
  nodo := trvw.addnode;
  nodo.Text[0] := 'Transporte';
  nodo.Extended := True;
  nodo := trvw.addnode;
  nodo.Text[0] := 'Mano de Obra';
  nodo.Extended := True;
  { if base_activa.SeguridadIndustrial then
    begin
    nodo := trvw.addnode;
    nodo.Text[0] := 'Seguridad Industrial';
    nodo.Extended := True;
    end; }
  trvw.ExpandAll;
end;

// ===================== APU como Recurso: Propagación Recursiva =====================
function NextCodRecursoAPUUnique(const ACodBase, ACodCategoriaAPU: string;
  AConn: TUniConnection): string;
var
  Q: TUniQuery;
  MaxVal: Int64;
begin
  Result := '1';
  if (Trim(ACodBase) = '') or (Trim(ACodCategoriaAPU) = '') or (AConn = nil)
    then
    Exit;

  Q := TUniQuery.Create(nil);
  try
    Q.Connection := AConn;
    Q.SQL.Text :=
      'SELECT IFNULL(MAX(CAST(codRecursoAPU AS UNSIGNED)), 0) AS mx ' +
      'FROM apus ' + 'WHERE codBase = :b AND codCategoriaAPU = :c';
    Q.ParamByName('b').AsString := ACodBase;
    Q.ParamByName('c').AsString := ACodCategoriaAPU;
    Q.Open;

    MaxVal := Q.FieldByName('mx').AsLargeInt;
    Result := IntToStr(MaxVal + 1);
  finally
    Q.Free;
  end;
end;

function NormalizeCodAPU(const S: string): string;
var
  t: string;
begin
  t := Trim(S);
  // Si viene "APU: 000123" o "APU:000123"
  if SameText(Copy(t, 1, 4), 'APU:') then
    t := Trim(Copy(t, 5, MaxInt));
  Result := t;
end;

function GetApuRecursoIdUnico(const ACodApu: string): string;
var
  Q: TUniQuery;
  Cod: string;
begin
  Result := '';
  Cod := NormalizeCodAPU(ACodApu);
  if Cod = '' then
    Exit;

  Q := TUniQuery.Create(nil);
  try
    Q.Connection := DModule_1.con2;
    Q.SQL.Text := 'SELECT idUnico ' + 'FROM recursos ' +
      'WHERE codBase = :codBase AND especificaciones = :esp ' + 'LIMIT 1';
    Q.ParamByName('codBase').AsString := base_activa.codBase;
    Q.ParamByName('esp').AsString := 'APU: ' + Cod;
    Q.Open;
    if not Q.IsEmpty then
      Result := Trim(Q.Fields[0].AsString);
  finally
    Q.Free;
  end;
end;

procedure UpdateRecursoApuPrecio(const ACodApu: string);
var
  Q: TUniQuery;
  Cod: string;
begin
  Cod := NormalizeCodAPU(ACodApu);
  if Cod = '' then
    Exit;

  Q := TUniQuery.Create(nil);
  try
    Q.Connection := DModule_1.con2;
    Q.SQL.Text := 'UPDATE recursos r ' + 'JOIN apus a ON a.codBase = r.codBase '
      + 'SET r.precio = a.CostoDirectoTotal, ' +
      '    r.preciolocal = a.CostoDirectoTotal ' + 'WHERE r.codBase = :codBase '
      + '  AND r.especificaciones = :esp ' + '  AND a.codAPU = :codApu';
    Q.ParamByName('codBase').AsString := base_activa.codBase;
    Q.ParamByName('esp').AsString := 'APU: ' + Cod;
    Q.ParamByName('codApu').AsString := Cod;
    Q.ExecSQL;
  finally
    Q.Free;
  end;
end;

procedure UpdateItemsQueUsanApuComoRecurso(const AIdUnicoRecursoApu,
  ACodApu: string);
var
  Q: TUniQuery;
  Cod: string;
begin
  Cod := NormalizeCodAPU(ACodApu);
  if (Trim(AIdUnicoRecursoApu) = '') or (Cod = '') then
    Exit;

  Q := TUniQuery.Create(nil);
  try
    Q.Connection := DModule_1.con2;

    // precio = costoDirecto del APU (cod), total = precio * cantidad * rendimiento
    // (usa subquery para amarrar exactamente el APU)
    {(*}
    Q.SQL.Text :=
      'UPDATE apus_items item ' +
      'SET item.precio = ( ' +
      '   SELECT a.CostoDirectoTotal ' +
      '   FROM apus a ' +
      '   WHERE a.codBase = item.codBase AND a.codAPU = :codApu ' +
      '   LIMIT 1 ' +
      '), ' +
      'item.total = ( ' +
      '   (SELECT a.CostoDirectoTotal ' +
      '    FROM apus a ' +
      '    WHERE a.codBase = item.codBase AND a.codAPU = :codApu ' +
      '    LIMIT 1 ' + '   ) * item.cantidadUnidad * item.rendimiento ' +
      ') ' +
      'WHERE item.codBase = :codBase ' +
      '  AND item.idUnicoRecurso = :idUnicoRecursoApu';
    {*)}
    Q.ParamByName('codBase').AsString := base_activa.codBase;
    Q.ParamByName('codApu').AsString := Cod;
    Q.ParamByName('idUnicoRecursoApu').AsString := Trim(AIdUnicoRecursoApu);
    Q.ExecSQL;

  finally
    Q.Free;
  end;
end;

procedure RecalcCabeceraApu(const ACodApu: string);
var
  Q: TUniQuery;
  Cod: string;
begin
  Cod := NormalizeCodAPU(ACodApu);
  if Cod = '' then
    Exit;

  Q := TUniQuery.Create(nil);
  try
    Q.Connection := DModule_1.con2;

    // Recalcula Directo=SUM(items.total), Indirecto y PrecioUnitario
    Q.SQL.Text := 'UPDATE apus a ' + 'SET a.CostoDirectoTotal = (' +
      '   SELECT COALESCE(SUM(i.Total),0) FROM apus_items i ' +
      '   WHERE i.codBase = a.codBase AND i.codAPU = a.codAPU' + '), ' +
      'a.CostoIndirectoTotal = ((a.CostoDirectoTotal * a.PorcentajeCostoIndirecto)/100), '
      + 'a.PrecioUnitarioTotal = (a.CostoDirectoTotal + ((a.CostoDirectoTotal * a.PorcentajeCostoIndirecto)/100)) '
      + 'WHERE a.codBase = :codBase AND a.codAPU = :codApu';
    Q.ParamByName('codBase').AsString := base_activa.codBase;
    Q.ParamByName('codApu').AsString := Cod;
    Q.ExecSQL;
  finally
    Q.Free;
  end;
end;

procedure ClearTanteoApu(const ACodApu: string);
var
  Q: TUniQuery;
  Cod: string;
begin
  Cod := NormalizeCodAPU(ACodApu);
  if Cod = '' then
    Exit;

  Q := TUniQuery.Create(nil);
  try
    Q.Connection := DModule_1.con2;

    Q.SQL.Text := 'DELETE FROM presupuestos_tanteo_apus ' +
      'WHERE codBase = :codBase AND codApu = :codApu';
    Q.ParamByName('codBase').AsString := base_activa.codBase;
    Q.ParamByName('codApu').AsString := Cod;
    Q.ExecSQL;

    Q.SQL.Text := 'DELETE FROM presupuestos_tanteo_recursos ' +
      'WHERE codBase = :codBase AND codApu = :codApu';
    Q.ParamByName('codBase').AsString := base_activa.codBase;
    Q.ParamByName('codApu').AsString := Cod;
    Q.ExecSQL;
  finally
    Q.Free;
  end;
end;

procedure GetApusPadreQueUsanRecurso(const AIdUnicoRecursoApu: string;
  AList: TStrings);
var
  Q: TUniQuery;
begin
  AList.Clear;
  if Trim(AIdUnicoRecursoApu) = '' then
    Exit;

  Q := TUniQuery.Create(nil);
  try
    Q.Connection := DModule_1.con2;
    Q.SQL.Text := 'SELECT DISTINCT codAPU ' + 'FROM apus_items ' +
      'WHERE codBase = :codBase AND idUnicoRecurso = :idUnico';
    Q.ParamByName('codBase').AsString := base_activa.codBase;
    Q.ParamByName('idUnico').AsString := Trim(AIdUnicoRecursoApu);
    Q.Open;

    while not Q.Eof do
    begin
      if Trim(Q.FieldByName('codAPU').AsString) <> '' then
        AList.Add(Trim(Q.FieldByName('codAPU').AsString));
      Q.Next;
    end;
  finally
    Q.Free;
  end;
end;

// Esta es LA que debes llamar al guardar/actualizar APU.
// Propaga hacia arriba: actualiza items de apus padre, recalcula cabecera, limpia tanteos,
// llama SP de presupuesto, y repite recursivamente (si esos padres también son recursos).
procedure TfrmAddAPU.PropagateApuAsRecursoChange(const ACodApuChanged: string);
var
  queue, parents, processed: TStringList;
  CodAPU, idUnicoRes: string;
  i: Integer;
  APUModel: TAPUModel;
begin
  if not Assigned(DModule_1) or not Assigned(DModule_1.con2) then
    Exit;
  if not DModule_1.con2.InTransaction then
    raise Exception.Create
      ('PropagateApuAsRecursoChange requiere transacción activa (llamar desde Aceptar).');

  queue := TStringList.Create;
  parents := TStringList.Create;
  processed := TStringList.Create;
  try
    queue.Sorted := False;

    processed.Sorted := True;
    processed.Duplicates := dupIgnore;

    queue.Add(NormalizeCodAPU(ACodApuChanged));

    while queue.Count > 0 do
    begin
      CodAPU := NormalizeCodAPU(queue[0]);
      APUModel := TAPUModel.Create;

      APUModel.RebuildFromTree(trvw_APUS);

      queue.Delete(0);

      if CodAPU = '' then
        Continue;
      ;

      if processed.IndexOf(CodAPU) >= 0 then
        Continue;

      processed.Add(CodAPU);

      // 1) Asegura que el recurso "APU: codApu" tenga precio = costoDirecto del APU
      UpdateRecursoApuPrecio(CodAPU);

      // 2) Obtén el idUnico del recurso de ese APU
      idUnicoRes := GetApuRecursoIdUnico(CodAPU);
      if idUnicoRes = '' then
        Continue;

      // 3) Actualiza precio/total en apus_items de todos los APUS que usan ese recurso
      UpdateItemsQueUsanApuComoRecurso(idUnicoRes, CodAPU);

      // 4) Lista apus padre que contienen ese recurso
      GetApusPadreQueUsanRecurso(idUnicoRes, parents);

      // 5) Recalcula cabecera de cada padre, limpia tanteo, SP presupuesto, y encola para seguir propagando
      for i := 0 to parents.Count - 1 do
      begin
        RecalcCabeceraApu(parents[i]);
        ClearTanteoApu(parents[i]);
        CallUpdatePresupuestoItemsSafe(parents[i]);
        // tu helper (si hay codProyecto/revision)

        // si este padre también es usado como recurso, propagamos en cascada
        queue.Add(NormalizeCodAPU(parents[i]));
      end;

    end;
  finally
    queue.Free;
    parents.Free;
    processed.Free;
  end;
end;

// ===================== Robust Helpers =====================

function ToFloatDef(const A: string; const Def: Double = 0): Double;
var
  V: Double;
  t: string;
begin
  t := decimal_correcto(Trim(A));
  if not TryStrToFloat(t, V) then
    V := Def;
  Result := V;
end;

function TfrmAddAPU.DaCodigoUnidad(Dunidad: string): string;
var
  X: Integer;
  salir: Boolean;
  cadenaComparar: string;
begin
  Result := 'u';
  if Trim(Dunidad) = '' then
    Exit;
  salir := False;
  cadenaComparar := Dunidad;
  X := Ansipos('(', cadenaComparar);
  cadenaComparar := Copy(Dunidad, X + 1, length(cadenaComparar));
  cadenaComparar := ansireplaceStr(cadenaComparar, ')', '');
  cadenaComparar := cadenaComparar.ToLower;
  X := 0;
  while (not salir) and (X < length(listadoUnidadesAPU) - 1) do
  begin
    if cadenaComparar = lowercase(listadoUnidadesAPU[X].Descripcion) then
    begin
      salir := True;
      Result := listadoUnidadesAPU[X].codigo;
    end;
    inc(X);
  end;
end;

function TfrmAddAPU.DaDescripcionUnidad(CUnidad: string): string;
var
  X: Integer;
  salir: Boolean;
begin
  Result := 'Unidad (u)';
  if Trim(CUnidad) = '' then
    Exit;
  X := 0;
  salir := False;
  while (not salir) and (X < length(listadoUnidadesAPU) - 1) do
  begin
    if CUnidad = listadoUnidadesAPU[X].codigo then
    begin
      salir := True;
      Result := listadoUnidadesAPU[X].Descripcion + ' (' + listadoUnidadesAPU[X]
        .codigo + ')';
    end;
    inc(X);
  end;
end;

procedure TfrmAddAPU.populaUnidadesAPU();
var
  qry: TUniQuery;
  X: Integer;
begin
  qry := TUniQuery.Create(nil);
  try
    qry.Connection := DModule_1.con2;
    qry.close;
    qry.SQL.Clear;
    cb_unidades.Items.Clear;
    { (* }
    qry.SQL.Text := 'SELECT ' + '  descripcion, ' + '  descripcion_completa ' +
      'FROM unidades ' + 'WHERE ' + '  Subcategoria=6';
    { *) }
    qry.Open;
    X := 0;
    while not qry.Eof do
    begin
      setlength(listadoUnidadesAPU, X + 1);
      listadoUnidadesAPU[X].codigo := qry.FieldByName('descripcion').AsString;
      listadoUnidadesAPU[X].Descripcion :=
        qry.FieldByName('descripcion_completa').AsString;
      cb_unidades.Items.Add(listadoUnidadesAPU[X].Descripcion + ' (' +
        listadoUnidadesAPU[X].codigo + ')');
      qry.Next;
    end;
  finally
    qry.Free;
  end;
  posicionaCombo(cb_unidades, 'Unidad (u)');
  unidadAPU := 'Unidad (u)';
end;

procedure TfrmAddAPU.MarkRecursoModifiedInTree(const AIdUnico, ADesc,
  APrecio: string);
var
  i, maxNode: Integer;
  node, subNode: TTMSFMXTreeViewNode;
begin
  if base_activa.SeguridadIndustrial then
    maxNode := 4
  else
    maxNode := 3;

  for i := 0 to maxNode do
  begin
    node := trvw_APUS.Nodes[i];
    if not Assigned(node) then
      Continue;

    subNode := node.GetFirstChild;
    while Assigned(subNode) do
    begin
      // COL_ID = idUnicoRecurso
      if Trim(NodeTextSafe(subNode, COL_ID)) = Trim(AIdUnico) then
      begin
        NodeTextSetSafe(subNode, COL_DESC, ADesc);
        NodeTextSetSafe(subNode, COL_PRE, decimal_correcto(APrecio));
        NodeTextSetSafe(subNode, COL_FLAG, 'modificar');
        // se aplicará en BD en Aceptar
      end;
      subNode := subNode.GetNextSibling;
    end;
  end;
end;

function TfrmAddAPU.TVIsEditing: Boolean;
begin
  Result := FTVEditing and Assigned(FTVEditNode);
end;

procedure TfrmAddAPU.TVBeginEdit(AVNode: TTMSFMXTreeViewVirtualNode);
var
  N: TTMSFMXTreeViewNode;
begin
  if not Assigned(AVNode) then
    Exit;
  N := AVNode.node; // <- convertir a nodo real
  if not Assigned(N) then
    Exit;

  if TVIsEditing then
    TVCancelEdit;

  FTVEditing := True;
  FTVEditNode := N;

  // 1 columna: texto en índice 0
  FTVOldText := N.Text[0];

  // EditNode requiere TTMSFMXTreeViewNode
  trvw_APUS.EditNode(N, 0);
end;

procedure TfrmAddAPU.TVCancelEdit;
begin
  if not TVIsEditing then
    Exit;

  // cerrar editor sin aceptar
  trvw_APUS.CancelEditing;

  // restaurar texto anterior
  FTVEditNode.Text[0] := FTVOldText;

  FTVEditing := False;
  FTVEditNode := nil;
  FTVOldText := '';
end;

// ===================== FORMATO NUMERICO (NUEVO) =====================
// Pega ESTO en la sección implementation, después de tus helpers actuales
// (por ejemplo después de S2F/NodeTextSafe/etc). Requiere que existan
// ndecimalesPresupuesto y ndecimalesMoneda (como ya los tienes en tu app).

function _FmtDec(const AValue: Double; const ADecs: Integer): string;
var
  FS: TFormatSettings;
  Mask: string;
begin
  FS := FormatSettings;
  // Si tu app trabaja siempre con coma, fuerza aquí:
  // FS.DecimalSeparator := ',';
  // FS.ThousandSeparator := '.';

  if ADecs <= 0 then
    Mask := '0'
  else
    Mask := '0.' + StringOfChar('0', ADecs);

  Result := FormatFloat(Mask, AValue, FS);
  Result := decimal_correcto(Result);
end;

function FmtPresuD(const AValue: Double): string; inline;
begin
  Result := _FmtDec(AValue, ndecimalesPresupuesto);
end;

function FmtMonD(const AValue: Double): string; inline;
begin
  Result := _FmtDec(AValue, ndecimalesMoneda);
end;

function FmtPorcD(const AValue: Double): string; inline;
begin
  // Tu regla: porcentajes usan ndecimalesMoneda
  Result := _FmtDec(AValue, ndecimalesMoneda);
end;

function S2FLocal(const S: string; const Def: Double = 0): Double;
var
  V: Double;
  ss: string;
begin
  ss := decimal_correcto(Trim(S));
  if not TryStrToFloat(ss, V) then
    V := Def;
  Result := V;
end;

procedure TfrmAddAPU.CallUpdatePresupuestoItemsSafe(const ACodApu: string);
var
  Q: TUniQuery;
begin
  // Si no estás en contexto de presupuesto/revisión, NO llames al SP (evita reventar)
  if Trim(ACodApu) = '' then
    Exit;
  if Trim(codProyecto) = '' then
    Exit;
  if Trim(revision) = '' then
    Exit;

  Q := TUniQuery.Create(nil);
  try
    Q.Connection := DModule_1.con2;
    Q.SQL.Text :=
      'CALL updatePresupuestosItems(:codBase, :codApu, :codPresupuesto, :revision)';
    Q.ParamByName('codBase').AsString := base_activa.codBase;
    Q.ParamByName('codApu').AsString := ACodApu;
    Q.ParamByName('codPresupuesto').AsString := codProyecto;
    Q.ParamByName('revision').AsString := revision;
    Q.ExecSQL;
  finally
    Q.Free;
  end;
end;

procedure TfrmAddAPU.actualizaDatosRecursos;
var
  i, maxNode: Integer;
  node, subNode: TTMSFMXTreeViewNode;

  procedure actualizaRecursoTotal(const AIdUnicoRecurso, ADescripcion,
    APrecio: string);
  type
    TDatAPU = record
      CodAPU: string;
      Cantidad: Double;
      Rendimiento: Double;
      totalAPU: Double;
      porcIndirecto: Double;
    end;
  var
    Q: TUniQuery;
    datos: array of TDatAPU;
    idx: Integer;
    precioVal, Total, sumTot: Double;

    function ToF(const S: string; Def: Double): Double;
    begin
      Result := StrToFloatDef(decimal_correcto(S), Def);
    end;

  begin
    if Trim(AIdUnicoRecurso) = '' then
      Exit;

    precioVal := ToF(APrecio, 0);

    Q := TUniQuery.Create(nil);
    try
      Q.Connection := DModule_1.con2;

      // 1) Actualizar recurso
      Q.SQL.Text := 'UPDATE recursos SET descripcion=:d, precio=:p ' +
        'WHERE codBase=:b AND idUnico=:i';
      Q.ParamByName('d').AsString := ADescripcion;
      Q.ParamByName('p').AsFloat := precioVal;
      Q.ParamByName('b').AsString := base_activa.codBase;
      Q.ParamByName('i').AsString := AIdUnicoRecurso;
      Q.ExecSQL;

      // 2) Leer APUs afectados
      Q.SQL.Text := 'SELECT codAPU, cantidadUnidad, rendimiento ' +
        'FROM apus_items WHERE codBase=:b AND idUnicoRecurso=:i';
      Q.ParamByName('b').AsString := base_activa.codBase;
      Q.ParamByName('i').AsString := AIdUnicoRecurso;
      Q.Open;

      idx := 0;
      setlength(datos, 0);
      while not Q.Eof do
      begin
        setlength(datos, idx + 1);
        datos[idx].CodAPU := Q.FieldByName('codAPU').AsString;
        datos[idx].Cantidad := ToF(Q.FieldByName('cantidadUnidad').AsString, 0);
        datos[idx].Rendimiento := ToF(Q.FieldByName('rendimiento').AsString, 1);
        inc(idx);
        Q.Next;
      end;
      Q.close;

      if length(datos) = 0 then
        Exit;

      // 3) Actualizar items
      Q.SQL.Text := 'UPDATE apus_items SET descripcion=:d, precio=:p, total=:t '
        + 'WHERE codBase=:b AND codAPU=:a AND idUnicoRecurso=:i';
      Q.Prepare;

      for idx := 0 to High(datos) do
      begin
        Total := precioVal * datos[idx].Cantidad * datos[idx].Rendimiento;

        Q.ParamByName('d').AsString := ADescripcion;
        Q.ParamByName('p').AsFloat := precioVal;
        Q.ParamByName('t').AsFloat := Total;
        Q.ParamByName('b').AsString := base_activa.codBase;
        Q.ParamByName('a').AsString := datos[idx].CodAPU;
        Q.ParamByName('i').AsString := AIdUnicoRecurso;
        Q.ExecSQL;
      end;

      // 4) Recalcular totales APU
      for idx := 0 to High(datos) do
      begin
        Q.SQL.Text := 'SELECT SUM(total) FROM apus_items ' +
          'WHERE codBase=:b AND codAPU=:a';
        Q.ParamByName('b').AsString := base_activa.codBase;
        Q.ParamByName('a').AsString := datos[idx].CodAPU;
        Q.Open;
        sumTot := Q.Fields[0].AsFloat;
        Q.close;

        Q.SQL.Text := 'SELECT PorcentajeCostoIndirecto FROM apus ' +
          'WHERE codBase=:b AND codAPU=:a';
        Q.ParamByName('b').AsString := base_activa.codBase;
        Q.ParamByName('a').AsString := datos[idx].CodAPU;
        Q.Open;
        datos[idx].porcIndirecto := Q.Fields[0].AsFloat;
        Q.close;

        Q.SQL.Text := 'UPDATE apus SET CostoDirectoTotal=:cd, ' +
          'CostoIndirectoTotal=:ci, PrecioUnitarioTotal=:pt ' +
          'WHERE codBase=:b AND codAPU=:a';
        Q.ParamByName('cd').AsFloat := sumTot;
        Q.ParamByName('ci').AsFloat :=
          (sumTot * datos[idx].porcIndirecto) / 100;
        Q.ParamByName('pt').AsFloat := sumTot +
          (sumTot * datos[idx].porcIndirecto) / 100;
        Q.ParamByName('b').AsString := base_activa.codBase;
        Q.ParamByName('a').AsString := datos[idx].CodAPU;
        Q.ExecSQL;
      end;

    finally
      Q.Free;
    end;
  end;

begin
  if not DModule_1.con2.InTransaction then
    raise Exception.Create('Debe llamarse dentro de una transacción');

  maxNode := IfThen(base_activa.SeguridadIndustrial, 4, 3);

  for i := 0 to maxNode do
  begin
    node := trvw_APUS.Nodes[i];
    if not Assigned(node) then
      Continue;

    subNode := node.GetFirstChild;
    while Assigned(subNode) do
    begin
      if SameText(NodeTextSafe(subNode, COL_FLAG), 'modificar') then
        actualizaRecursoTotal(NodeTextSafe(subNode, COL_ID),
          NodeTextSafe(subNode, COL_DESC), NodeTextSafe(subNode, COL_PRE));
      subNode := subNode.GetNextSibling;
    end;
  end;
end;

procedure EnsureTreeColumnsForAPU(const TV: TTMSFMXTreeView;
  const NeededIndex: Integer);
begin
  // TTMSFMXTreeView maneja Text[] dinámico por nodo, pero algunos builds fallan si el índice es muy alto.
  // Esto "calienta" los índices creando textos vacíos.
  try
    // fuerza un acceso benigno en un nodo raíz si existe
    if (TV.Nodes.Count > 0) and Assigned(TV.Nodes[0]) then
    begin
      TV.Nodes[0].Text[NeededIndex] := TV.Nodes[0].Text[NeededIndex];
    end;
  except
    // si tu versión no soporta esto, igual NodeTextSafe/SetSafe evita crashes
  end;
end;

function SafeStrToInt(const S: string; const ADefault: Integer = 0): Integer;
begin
  if not TryStrToInt(Trim(S), Result) then
    Result := ADefault;
end;

function SafeStrToFloat(const S: string; const ADefault: Double = 0): Double;
var
  t: string;
begin
  t := Trim(S);
  if t = '' then
    Exit(ADefault);

  t := StringReplace(t, '%', '', [rfReplaceAll]);

  // intenta tal cual (según tus regionales)
  if TryStrToFloat(t, Result) then
    Exit;

  // intenta coma->punto
  if TryStrToFloat(StringReplace(t, ',', '.', [rfReplaceAll]), Result) then
    Exit;

  // intenta punto->coma
  if TryStrToFloat(StringReplace(t, '.', ',', [rfReplaceAll]), Result) then
    Exit;

  Result := ADefault;
end;

function S2F(const S: string; const Def: Double = 0): Double;
begin
  Result := SafeStrToFloat(decimal_correcto(Trim(S)), Def);
end;

function NodeTextSafe(const ANode: TTMSFMXTreeViewNode;
  const AIndex: Integer): string;
begin
  Result := '';
  if not Assigned(ANode) then
    Exit;
  try
    Result := ANode.Text[AIndex];
  except
    Result := '';
  end;
end;

procedure NodeTextSetSafe(const ANode: TTMSFMXTreeViewNode;
  const AIndex: Integer; const AValue: string);
begin
  if not Assigned(ANode) then
    Exit;
  try
    ANode.Text[AIndex] := AValue;
  except
    // ignora: el control no tiene esa columna/índice
  end;
end;

function Clamp(const V, AMin, AMax: Integer): Integer;
begin
  Result := V;
  if Result < AMin then
    Result := AMin;
  if Result > AMax then
    Result := AMax;
end;

procedure TfrmAddAPU.limpiaNuevaAPUs();
var
  tmpstr: string;
begin
  lbl_APUCostoIndirectoTotal.Text := decimal_correcto('0,00');
  lbl_APUCostoDirectoTotal.Text := decimal_correcto('0,00');
  lbl_APUPrecioUnitario.Text := decimal_correcto('0,00');
  edt_FindCategorias.Text := '';
  edt_FindRecursos.Text := '';
  posicionaCombo(cb_unidades, 'Unidad (u)');
  unidadAPU := 'Unidad (u)';
  edt_APUSDescripcion.Text := '';
  tmpstr := FloatToStr(base_activa.indirectos);
  tmpstr := decimal_correcto(tmpstr);
  edt_PorcentajeIndirecto.Text := tmpstr;
  LimpiaAPU;
end;

procedure TfrmAddAPU.cb_unidadesChange(Sender: TObject);
begin
  unidadAPU := cb_unidades.Items[cb_unidades.ItemIndex];
end;

procedure TfrmAddAPU.cuentaItemsAPUSRecursos();
var
  X: Integer;
begin
  X := grid_APUSRecursos.RowCount - 1;
  lbl_nItemsMostrados.Text := IntToStr(X);
end;

procedure TfrmAddAPU.MuestraSubCategoriaItemsAPUSRecursos
  (codCompletoItem: string);
var
  CodCategoria, CodSubCategoria: string;
  qry: TUniQuery;
begin
  lbl_CategoriaItemMostrado.Text := '';
  CodCategoria := daDatoCodigo(codCompletoItem, 1);
  CodSubCategoria := daDatoCodigo(codCompletoItem, 2);
  qry := TUniQuery.Create(nil);
  try
    with qry do
    begin
      Connection := DModule_1.con2;
      close;
      SQL.Clear;
      SQL.Add('select descripcion from categoriaapus where codBase=' +
        quotedstr(base_activa.codBase) + ' and categoria_Base=' +
        quotedstr(CodCategoria) + ' and ciu=' + quotedstr(CodSubCategoria));
      Prepare;
      Open;
      lbl_CategoriaItemMostrado.Text := FieldByName('descripcion').AsString;
    end;
  finally
    qry.Free;
  end;
end;

procedure TfrmAddAPU.FadeControl(AControl: TControl; const FadeIn: Boolean;
  const DurationSec: Single);
begin
  if not Assigned(AControl) then
    Exit;
  AControl.Visible := True;
  if FadeIn then
  begin
    AControl.Opacity := 0;
    TAnimator.AnimateFloat(AControl, 'Opacity', 1, DurationSec);
  end
  else
  begin
    TAnimator.AnimateFloat(AControl, 'Opacity', 0, DurationSec);
  end;
end;

procedure TfrmAddAPU.HideColSafe(AGrid: TTMSFNCGrid; ACol: Integer);
begin
  if not Assigned(AGrid) then
    Exit;
  if (ACol >= 0) and (ACol < AGrid.ColumnCount) then
    AGrid.Columns[ACol].Width := 0;
end;

procedure TfrmAddAPU.actualizaListadoAPUSubcagoriaFiltrado(filtro: string);
var
  qry: TUniQuery;
  catBaseDB, ciu: Integer;
  tmpstr: string;

  procedure EnsureCategoriaPadres;
  var
    N: TTMSFMXTreeViewNode;
  begin
    tv_SubCategoriaAPU.ClearNodes;
    tv_SubCategoriaAPU.Interaction.ExtendedSelectable := True;

    // 1) Equipos y Herramientas
    N := tv_SubCategoriaAPU.addnode(nil);
    NodeTextSetSafe(N, 0, 'Equipos y Herramientas');

    N.Extended := True;

    // 2) Materiales
    N := tv_SubCategoriaAPU.addnode(nil);
    NodeTextSetSafe(N, 0, 'Materiales');

    N.Extended := True;

    // 3) Transporte
    N := tv_SubCategoriaAPU.addnode(nil);
    NodeTextSetSafe(N, 0, 'Transporte');

    N.Extended := True;

    // 4) Mano de Obra
    N := tv_SubCategoriaAPU.addnode(nil);
    NodeTextSetSafe(N, 0, 'Mano de Obra');

    N.Extended := True;
    {
      // 5) Seguridad Industrial (CONDICIONAL)
      if base_activa.SeguridadIndustrial then
      begin
      n := tv_SubCategoriaAPU.AddNode(nil);
      NodeTextSetSafe(n, 0, 'Seguridad Industrial');

      n.Extended := True;
      end; }

    // 6) Análisis de Precios Unitarios (SIEMPRE)
    N := tv_SubCategoriaAPU.addnode(nil);
    NodeTextSetSafe(N, 0, 'Análisis de Precios Unitarios');

    N.Extended := True;
  end;

  // Mapea categoria_base DB (1..6) al índice del padre en el TreeView (0..)
  function CatDbToParentIndex(const ACatBaseDB: Integer;
    out AParentIndex: Integer): Boolean;
  begin
    Result := False;
    AParentIndex := -1;

    case ACatBaseDB of
      1:
        AParentIndex := 0; // Equipos
      2:
        AParentIndex := 1; // Materiales
      3:
        AParentIndex := 2; // Transporte
      4:
        AParentIndex := 3; // Mano de obra
      5:
        begin
          if not base_activa.SeguridadIndustrial then
            Exit(False); // ocultar 5 + hijos
          AParentIndex := 4; // Seguridad Industrial
        end;
      6:
        begin
          // APU siempre existe:
          // - con SI: índice 5
          // - sin SI: índice 4
          if base_activa.SeguridadIndustrial then
            AParentIndex := 5
          else
            AParentIndex := 4;
        end;
    else
      Exit(False);
    end;

    Result := True;
  end;

  // Regla vigente que confirmaste: ciu=4 SOLO si SeguridadIndustrial=True
  function AllowSubcategoria(const ACiu: Integer): Boolean;
  begin
    if (ACiu = 4) and (not base_activa.SeguridadIndustrial) then
      Exit(False);
    Result := True;
  end;

begin
  if FLoadingCategorias then
    Exit;

  FLoadingCategorias := True;
  try
    FadeControl(tv_SubCategoriaAPU, False);

    tv_SubCategoriaAPU.BeginUpdate;
    try
      EnsureCategoriaPadres;
    finally
      tv_SubCategoriaAPU.EndUpdate;
    end;

    qry := TUniQuery.Create(nil);
    try
      qry.Connection := DModule_1.con2;

      qry.SQL.Text := 'SELECT categoria_base, ciu, descripcion ' +
        'FROM categoriaApus ' + 'WHERE codBase = :codBase ' +
        '  AND descripcion LIKE :filtro ' +
        'ORDER BY categoria_base ASC, descripcion ASC';

      qry.ParamByName('codBase').AsString := base_activa.codBase;
      qry.ParamByName('filtro').AsString := '%' + filtro + '%';
      qry.Open;

      while not qry.Eof do
      begin
        catBaseDB := qry.FieldByName('categoria_base').AsInteger; // 1..6
        ciu := qry.FieldByName('ciu').AsInteger;
        tmpstr := qry.FieldByName('descripcion').AsString;

        if AllowSubcategoria(ciu) then
        begin
          var
          parentIdx: Integer;
          if CatDbToParentIndex(catBaseDB, parentIdx) then
            // OJO: aquí pasamos catBaseDB REAL (1..6) para que quede bien en Text[1]
            addItemSucategoria(parentIdx, catBaseDB, ciu, tmpstr);
        end;

        qry.Next;
      end;

    finally
      qry.Free;
    end;

    FadeControl(tv_SubCategoriaAPU, True);
  finally
    FLoadingCategorias := False;
  end;
end;

procedure TfrmAddAPU.actualizaListadoAPUSubcategoria;
var
  qry: TUniQuery;
  catBaseDB, ciu: Integer;
  tmpstr: string;

  procedure EnsureCategoriaPadres;
  var
    N: TTMSFMXTreeViewNode;
  begin
    tv_SubCategoriaAPU.ClearNodes;
    tv_SubCategoriaAPU.Interaction.ExtendedSelectable := True;

    N := tv_SubCategoriaAPU.addnode(nil);
    NodeTextSetSafe(N, 0, 'Equipos y Herramientas');

    N.Extended := True;

    N := tv_SubCategoriaAPU.addnode(nil);
    NodeTextSetSafe(N, 0, 'Materiales');

    N.Extended := True;

    N := tv_SubCategoriaAPU.addnode(nil);
    NodeTextSetSafe(N, 0, 'Transporte');

    N.Extended := True;

    N := tv_SubCategoriaAPU.addnode(nil);
    NodeTextSetSafe(N, 0, 'Mano de Obra');

    N.Extended := True;
    {
      if base_activa.SeguridadIndustrial then
      begin
      n := tv_SubCategoriaAPU.AddNode(nil);
      NodeTextSetSafe(n, 0, 'Seguridad Industrial');

      n.Extended := True;
      end; }

    N := tv_SubCategoriaAPU.addnode(nil);
    NodeTextSetSafe(N, 0, 'Análisis de Precios Unitarios');

    N.Extended := True;
  end;

  function CatDbToParentIndex(const ACatBaseDB: Integer;
    out AParentIndex: Integer): Boolean;
  begin
    Result := False;
    AParentIndex := -1;

    case ACatBaseDB of
      1:
        AParentIndex := 0;
      2:
        AParentIndex := 1;
      3:
        AParentIndex := 2;
      4:
        AParentIndex := 3;
      5:
        begin
          { if not base_activa.SeguridadIndustrial then
            Exit(False);
            AParentIndex := 4; }
        end;
      6:
        begin
          { if base_activa.SeguridadIndustrial then
            AParentIndex := 5
            else }
          AParentIndex := 4;
        end;
    else
      Exit(False);
    end;

    Result := True;
  end;

  function AllowSubcategoria(const ACiu: Integer): Boolean;
  begin
    if (not base_activa.SeguridadIndustrial) and (ACiu = 4) then
      Exit(False);
    Result := True;
  end;

begin
  if FLoadingCategorias then
    Exit;

  FLoadingCategorias := True;
  try
    FadeControl(tv_SubCategoriaAPU, False);

    tv_SubCategoriaAPU.BeginUpdate;
    try
      EnsureCategoriaPadres;

      qry := TUniQuery.Create(nil);
      try
        qry.Connection := DModule_1.con2;
        qry.SQL.Text := 'SELECT categoria_base, ciu, descripcion ' +
          'FROM categoriaApus ' + 'WHERE codBase = :codBase ' +
          'ORDER BY categoria_base ASC, descripcion ASC';
        qry.ParamByName('codBase').AsString := base_activa.codBase;
        qry.Open;

        while not qry.Eof do
        begin
          catBaseDB := qry.FieldByName('categoria_base').AsInteger;
          ciu := qry.FieldByName('ciu').AsInteger;
          tmpstr := qry.FieldByName('descripcion').AsString;

          if AllowSubcategoria(ciu) then
          begin
            var
            parentIdx: Integer;
            if CatDbToParentIndex(catBaseDB, parentIdx) then
              addItemSucategoria(parentIdx, catBaseDB, ciu, tmpstr);
          end;

          qry.Next;
        end;

      finally
        qry.Free;
      end;

    finally
      tv_SubCategoriaAPU.EndUpdate;
    end;

    FadeControl(tv_SubCategoriaAPU, True);
  finally
    FLoadingCategorias := False;
  end;
end;

procedure TfrmAddAPU.addItemSucategoria(const AParentIndex, ACatBaseDB,
  ACiu: Integer; const ADescripcion: string);
var
  node, parent: TTMSFMXTreeViewNode;
begin
  // AParentIndex = índice REAL del nodo padre en el TreeView (0..)
  if (AParentIndex < 0) or (AParentIndex >= tv_SubCategoriaAPU.Nodes.Count) then
    Exit;

  parent := tv_SubCategoriaAPU.Nodes[AParentIndex];
  if not Assigned(parent) then
    Exit;

  tv_SubCategoriaAPU.BeginUpdate;
  try
    tv_SubCategoriaAPU.Interaction.ExtendedSelectable := True;

    node := tv_SubCategoriaAPU.addnode(parent);

    // Text[0] = descripción visible
    NodeTextSetSafe(node, 0, ADescripcion);

    // Text[1] = categoria_base REAL (1..6)  <-- CLAVE
    NodeTextSetSafe(node, 1, IntToStr(ACatBaseDB));

    // Text[2] = ciu (subcategoría)
    NodeTextSetSafe(node, 2, IntToStr(ACiu));

    // Asegura que sea nodo hijo (no padre)
    node.Extended := False;
  finally
    tv_SubCategoriaAPU.EndUpdate;
  end;
end;

procedure TfrmAddAPU.limpiaItemsAPU(idItem: Integer);
var
  node: TTMSFMXTreeViewNode;
begin
  if (idItem < 0) or (idItem >= trvw_APUS.Nodes.Count) then
    Exit;

  node := trvw_APUS.Nodes[idItem];
  if not Assigned(node) then
    Exit;

  node.Extended := True;
  node.Expanded := True;
  node.RemoveChildren;
end;

procedure TfrmAddAPU.limpiaListatoRecursos;
begin
  grid_APUSRecursos.BeginUpdate;
  try
    grid_APUSRecursos.ClearNormalCells;

    // Cabeceras
    grid_APUSRecursos.Cells[0, 0] := 'Codigo';
    grid_APUSRecursos.Cells[1, 0] := 'Descripción';
    grid_APUSRecursos.Cells[2, 0] := 'Unidad';
    grid_APUSRecursos.Cells[3, 0] := 'Precio';

    // Asegura al menos 2 filas
    if grid_APUSRecursos.RowCount < 2 then
      grid_APUSRecursos.RowCount := 2
    else
      grid_APUSRecursos.RowCount := 2;

    // Desoculta por si venías de otro contexto
    grid_APUSRecursos.UnHideRowsAll;
    grid_APUSRecursos.Filter.Clear;
  finally
    grid_APUSRecursos.EndUpdate;
  end;
end;

procedure TfrmAddAPU.lyt_111MouseDown(Sender: TObject; Button: TMouseButton;
  Shift: TShiftState; X, Y: Single);
begin
  frmAddAPU.StartWindowResize;
end;

procedure TfrmAddAPU.lyt_26MouseDown(Sender: TObject; Button: TMouseButton;
  Shift: TShiftState; X, Y: Single);
begin
  frmAddAPU.StartWindowResize;
end;

procedure TfrmAddAPU.lyt_28MouseEnter(Sender: TObject);
begin
  iGlow_Aceptar.Enabled := True;
end;

procedure TfrmAddAPU.lyt_28MouseLeave(Sender: TObject);
begin
  iGlow_Aceptar.Enabled := False;
end;

procedure TfrmAddAPU.muestraAPUSTodosRecursos(const codBase,
  categoria_base: string);
var
  qry: TUniQuery;
  tmpstr: string;
  X: Integer;
  Precio: Double;
  CodSubCategoria, CodRecurso, CodRecursoCompleto: string;
  apuSpec: string;
  excludeSelfApu: Boolean;

  // -------- Helpers locales --------
  function S2FDef(const S: string; const Def: Double = 0): Double;
  var
    V: Double;
    ss: string;
  begin
    ss := decimal_correcto(Trim(S));
    if not TryStrToFloat(ss, V) then
      V := Def;
    Result := V;
  end;

  procedure EnsureGridShape;
  var
    needCols: Integer;
  begin
    // Necesitas escribir en col: 0..6, 8, 10 => mínimo 11 columnas
    needCols := 11;

    grid_APUSRecursos.BeginUpdate;
    try
      if grid_APUSRecursos.ColumnCount < needCols then
        grid_APUSRecursos.ColumnCount := needCols;

      if grid_APUSRecursos.RowCount < 2 then
        grid_APUSRecursos.RowCount := 2;

      grid_APUSRecursos.Cells[0, 0] := 'Codigo';
      grid_APUSRecursos.Cells[1, 0] := 'Descripción';
      grid_APUSRecursos.Cells[2, 0] := 'Unidad';
      grid_APUSRecursos.Cells[3, 0] := 'Precio';
    finally
      grid_APUSRecursos.EndUpdate;
    end;
  end;

  procedure HideColSafe(const ACol: Integer);
  begin
    if (ACol >= 0) and (ACol < grid_APUSRecursos.ColumnCount) then
      grid_APUSRecursos.Columns[ACol].Width := 0;
  end;

  procedure EnsureRow(const ARow: Integer);
  begin
    if grid_APUSRecursos.RowCount <= ARow then
      grid_APUSRecursos.RowCount := ARow + 1;
  end;

begin
  EnsureGridShape;

  // Limpieza
  grid_APUSRecursos.BeginUpdate;
  try
    grid_APUSRecursos.ClearNormalCells;
    grid_APUSRecursos.Cells[0, 0] := 'Codigo';
    grid_APUSRecursos.Cells[1, 0] := 'Descripción';
    grid_APUSRecursos.Cells[2, 0] := 'Unidad';
    grid_APUSRecursos.Cells[3, 0] := 'Precio';
    grid_APUSRecursos.UnHideRowsAll;
    grid_APUSRecursos.Filter.Clear;
    if grid_APUSRecursos.RowCount < 2 then
      grid_APUSRecursos.RowCount := 2;
  finally
    grid_APUSRecursos.EndUpdate;
  end;

  // ===== EXCLUIR EL RECURSO DEL APU EDITADO (si aplica) =====
  excludeSelfApu := (Trim(lbl_modo.Text) = '2') and
    (Trim(lbl_codAPU.Text) <> '');
  apuSpec := 'APU: ' + Trim(lbl_codAPU.Text);

  qry := TUniQuery.Create(nil);
  try
    qry.Connection := DModule_1.con2;
    qry.SQL.Clear;
    qry.Params.Clear;

    if excludeSelfApu then
    begin
      qry.SQL.Text :=
        'SELECT codRecurso, codSubcategoria, descripcion, unidad, precio, idUnico, especificaciones '
        + 'FROM recursos ' + 'WHERE codBase = :codBase ' +
        '  AND codCategoriaBase = :codCategoriaBase ' +
        '  AND COALESCE(especificaciones, '''') <> :apuSpec ' +
        'ORDER BY descripcion ASC';
      qry.ParamByName('apuSpec').AsString := apuSpec;
    end
    else
    begin
      qry.SQL.Text :=
        'SELECT codRecurso, codSubcategoria, descripcion, unidad, precio, idUnico, especificaciones '
        + 'FROM recursos ' + 'WHERE codBase = :codBase ' +
        '  AND codCategoriaBase = :codCategoriaBase ' +
        'ORDER BY descripcion ASC';
    end;

    qry.ParamByName('codBase').AsString := codBase;
    qry.ParamByName('codCategoriaBase').AsString := categoria_base;
    qry.Open;

    grid_APUSRecursos.BeginUpdate;
    try
      X := 1;
      while not qry.Eof do
      begin
        EnsureRow(X);

        CodRecurso := qry.FieldByName('codRecurso').AsString;
        CodSubCategoria := qry.FieldByName('codSubcategoria').AsString;
        CodRecursoCompleto := generaCodigoRecurso(categoria_base,
          CodSubCategoria, CodRecurso);

        grid_APUSRecursos.Cells[0, X] := CodRecursoCompleto;
        grid_APUSRecursos.Cells[1, X] := qry.FieldByName('descripcion')
          .AsString;
        grid_APUSRecursos.Cells[2, X] := qry.FieldByName('unidad').AsString;

        tmpstr := decimal_correcto(qry.FieldByName('precio').AsString);
        Precio := S2FDef(tmpstr, 0);
        grid_APUSRecursos.Cells[3, X] := FmtMonD(Precio);

        // ocultos / metadatos
        grid_APUSRecursos.Cells[4, X] := categoria_base;
        grid_APUSRecursos.Cells[5, X] := CodSubCategoria;
        grid_APUSRecursos.Cells[6, X] := CodRecurso;
        grid_APUSRecursos.Cells[8, X] := qry.FieldByName('idUnico').AsString;
        grid_APUSRecursos.Cells[10, X] :=
          qry.FieldByName('especificaciones').AsString;

        inc(X);
        qry.Next;
      end;

      grid_APUSRecursos.RowCount := X;
    finally
      grid_APUSRecursos.EndUpdate;
    end;

  finally
    qry.Free;

    HideColSafe(10);
    HideColSafe(8);
    HideColSafe(6);
    HideColSafe(5);
    HideColSafe(4);

    cuentaItemsAPUSRecursos();
  end;
end;

procedure TfrmAddAPU.muestraAPUSRecursos(codBase: string;
  categoria_base: string; ciu: string);
var
  qry: TUniQuery;
  X: Integer;
  Precio: Double;
  tmpstr: string;
  CodRecurso, CodSubCategoria, CodRecursoCompleto: string;
  excluirApuPropio: Boolean;
  apuSpec: string;

  procedure EnsureRow(ARow: Integer);
  begin
    if grid_APUSRecursos.RowCount <= ARow then
      grid_APUSRecursos.RowCount := ARow + 1;
  end;

begin
  if FLoadingRecursos then
    Exit;

  FLoadingRecursos := True;
  try
    FadeControl(grid_APUSRecursos, False);
    limpiaListatoRecursos;

    // ===== REGLA CLAVE =====
    excluirApuPropio := (Trim(lbl_modo.Text) = '2') and
      (Trim(lbl_codAPU.Text) <> '');

    apuSpec := 'APU: ' + Trim(lbl_codAPU.Text);

    qry := TUniQuery.Create(nil);
    try
      qry.Connection := DModule_1.con2;
      qry.SQL.Clear;
      qry.Params.Clear;

      if excluirApuPropio then
      begin
        qry.SQL.Text :=
          'SELECT codRecurso, codSubcategoria, descripcion, unidad, precio, idUnico, especificaciones '
          + 'FROM recursos ' + 'WHERE codBase = :codBase ' +
          '  AND codCategoriaBase = :codCategoriaBase ' +
          '  AND codSubCategoria = :ciu ' +
          '  AND COALESCE(especificaciones, '''') <> :apuSpec ' +
          'ORDER BY descripcion ASC';
        qry.ParamByName('apuSpec').AsString := apuSpec;
      end
      else
      begin
        qry.SQL.Text :=
          'SELECT codRecurso, codSubcategoria, descripcion, unidad, precio, idUnico, especificaciones '
          + 'FROM recursos ' + 'WHERE codBase = :codBase ' +
          '  AND codCategoriaBase = :codCategoriaBase ' +
          '  AND codSubCategoria = :ciu ' + 'ORDER BY descripcion ASC';
      end;

      qry.ParamByName('codBase').AsString := codBase;
      qry.ParamByName('codCategoriaBase').AsString := categoria_base;
      qry.ParamByName('ciu').AsString := ciu;
      qry.Open;

      grid_APUSRecursos.BeginUpdate;
      try
        X := 1;
        while not qry.Eof do
        begin
          EnsureRow(X);

          CodRecurso := qry.FieldByName('codRecurso').AsString;
          CodSubCategoria := qry.FieldByName('codSubcategoria').AsString;
          CodRecursoCompleto := generaCodigoRecurso(categoria_base,
            CodSubCategoria, CodRecurso);

          grid_APUSRecursos.Cells[0, X] := CodRecursoCompleto;
          grid_APUSRecursos.Cells[1, X] :=
            qry.FieldByName('descripcion').AsString;
          grid_APUSRecursos.Cells[2, X] := qry.FieldByName('unidad').AsString;

          tmpstr := decimal_correcto(qry.FieldByName('precio').AsString);
          if not TryStrToFloat(tmpstr, Precio) then
            Precio := 0;

          grid_APUSRecursos.Cells[3, X] := FmtMonD(Precio);

          // columnas ocultas / metadatos
          grid_APUSRecursos.Cells[4, X] := categoria_base;
          grid_APUSRecursos.Cells[5, X] := CodSubCategoria;
          grid_APUSRecursos.Cells[6, X] := CodRecurso;
          grid_APUSRecursos.Cells[8, X] := qry.FieldByName('idUnico').AsString;
          grid_APUSRecursos.Cells[10, X] :=
            qry.FieldByName('especificaciones').AsString;

          inc(X);
          qry.Next;
        end;

        grid_APUSRecursos.RowCount := X;
      finally
        grid_APUSRecursos.EndUpdate;
      end;

    finally
      qry.Free;
      cuentaItemsAPUSRecursos;
    end;

    FadeControl(grid_APUSRecursos, True);
  finally
    FLoadingRecursos := False;
  end;
end;

procedure TfrmAddAPU.edt_FindCategoriasEnter(Sender: TObject);
begin
  Shadow_FindCategorias.Enabled := True;
end;

procedure TfrmAddAPU.edt_FindCategoriasExit(Sender: TObject);
begin
  Shadow_FindCategorias.Enabled := False;
end;

procedure TfrmAddAPU.edt_FindCategoriasKeyUp(Sender: TObject; var Key: Word;
  var KeyChar: Char; Shift: TShiftState);
var
  filtro: string;
begin
  // if Key = vkreturn then
  begin
    filtro := edt_FindCategorias.Text;
    if filtro <> '' then
    begin
      actualizaListadoAPUSubcagoriaFiltrado(filtro);
    end
    else
    begin
      actualizaListadoAPUSubcategoria();
    end;
  end;
end;

procedure TfrmAddAPU.edt_FindRecursosChangeTracking(Sender: TObject);
var
  fltr: TTMSFNCGridFilterData;
begin
  grid_APUSRecursos.UnHideRowsAll;
  grid_APUSRecursos.Filter.Clear;
  if edt_FindRecursos.Text <> '' then
  begin
    fltr := grid_APUSRecursos.Filter.Add;
    fltr.Column := 1;
    fltr.CaseSensitive := False;
    fltr.Condition := '*' + edt_FindRecursos.Text + '*';
    grid_APUSRecursos.ApplyFilter;
  end;
end;

procedure TfrmAddAPU.edt_FindRecursosEnter(Sender: TObject);
begin
  Shadow_FindRecursos.Enabled := True;
end;

procedure TfrmAddAPU.edt_FindRecursosExit(Sender: TObject);
begin
  Shadow_FindRecursos.Enabled := False;
end;

procedure TfrmAddAPU.edt_PorcentajeIndirectoChange(Sender: TObject);
begin
  if (edt_PorcentajeIndirecto.Text <> '') and (lbl_modo.Text <> '') then
  begin
    edt_PorcentajeIndirecto.Text :=
      decimal_correcto(edt_PorcentajeIndirecto.Text);
    calculaTotales;
  end;
end;

procedure TfrmAddAPU.FormCreate(Sender: TObject);
begin
  FTooltip := TFMXTooltip.Create(Self);
  InitRootNodes;
  FEditColumn := -1;
  WasEditing := False;
end;

procedure TfrmAddAPU.FormDestroy(Sender: TObject);
begin
  FTooltip.Free;
end;

procedure TfrmAddAPU.FormMouseDown(Sender: TObject; Button: TMouseButton;
  Shift: TShiftState; X, Y: Single);
var
  P: TPointF;
begin
  if not TVIsEditing then
    Exit;

  // Coordenadas absolutas del click
  P := (Sender as TControl).LocalToAbsolute(PointF(X, Y));

  // Si el click NO fue dentro del TreeView, cancelar
  if not trvw_APUS.AbsoluteRect.Contains(P) then
    TVCancelEdit;
end;

procedure TfrmAddAPU.FormShow(Sender: TObject);
var
  i, maxNode: Integer;
  node, subNode: TTMSFMXTreeViewNode;
begin
  rendimientoGlobal := 1;
  EntrarAPUfrm := False;
  populaUnidadesAPU();
  // Asegura que no reviente al usar Text[10] y Text[20]
  EnsureTreeColumnsForAPU(trvw_APUS, COL_APU);
  EnsureTreeColumnsForAPU(trvw_APUS, COL_FLAG);

  if base_activa.SeguridadIndustrial then
    maxNode := 4
  else
    maxNode := 3;

  for i := 0 to maxNode do
  begin
    node := trvw_APUS.Nodes[i];
    if not Assigned(node) then
      Continue;

    subNode := node.GetFirstChild;
    while Assigned(subNode) do
    begin
      // inicializa campos “ocultos” si no existen
      NodeTextSetSafe(subNode, COL_ID, NodeTextSafe(subNode, COL_ID));
      // idUnicoRecurso
      NodeTextSetSafe(subNode, COL_APU, NodeTextSafe(subNode, COL_APU));
      // codAPU anidado
      NodeTextSetSafe(subNode, COL_FLAG, ''); // limpio

      subNode := subNode.GetNextSibling;
    end;
  end;
end;

procedure TfrmAddAPU.grid_APUSRecursosCellDblClick(Sender: TObject;
  ACol, ARow: Integer);
var
  categoriaBase, SubCategoria, CodRecurso: Integer;
  Descripcion, Precio, Unidad, idUnico, CodAPU: string;

  function CellTrim(ACol, ARow: Integer): string;
  begin
    Result := Trim(grid_APUSRecursos.Cells[ACol, ARow]);
  end;

  function CellIntDef(ACol, ARow: Integer; Def: Integer = 0): Integer;
  var
    S: string;
  begin
    S := CellTrim(ACol, ARow);
    if (S = '') or (not TryStrToInt(S, Result)) then
      Result := Def;
  end;

begin
  if ARow <= 0 then
    Exit;

  categoriaBase := CellIntDef(4, ARow, 0);

  // Regla especial para categoriaBase=6 en col 1 o 3: cancela edición y guarda valor
  if (categoriaBase = 6) and ((ACol = 1) or (ACol = 3)) then
  begin
    antiguoValorGrid := grid_APUSRecursos.Cells[ACol, ARow];
    columnaSelecionda := ACol;
    grid_APUSRecursos.CancelEdit;
    Exit;
  end;

  SubCategoria := CellIntDef(5, ARow, 0);
  CodRecurso := CellIntDef(6, ARow, 0);

  Descripcion := CellTrim(1, ARow);
  Unidad := CellTrim(2, ARow); // <- NO decimal_correcto
  idUnico := CellTrim(8, ARow);

  // Precio
  if SameText(Unidad, '%MO') then
    Precio := daPrecioMO
  else
    Precio := CellTrim(3, ARow);

  CodAPU := '';

  // Solo aplica a categoriaBase = 6 (APU anidado como recurso)
  if categoriaBase = 6 then
  begin
    CodAPU := CellTrim(10, ARow);

    if (Descripcion = '') or (Unidad = '') then
      Exit;
  end;
  if not RecursoDuplicado(Descripcion, Unidad) then
    AddAPU(categoriaBase, SubCategoria, CodRecurso, Descripcion, Precio,
      Unidad, idUnico, CodAPU);

end;

procedure TfrmAddAPU.grid_APUSRecursosCellEditCancel(Sender: TObject;
  ACol, ARow: Integer);
begin
  grid_APUSRecursos.Cells[ACol, ARow] := antiguoValorGrid;
end;

procedure TfrmAddAPU.grid_APUSRecursosCellEditDone(Sender: TObject;
  ACol, ARow: Integer; CellEditor: TTMSFNCGridEditor);
var
  nuevoValorGrid: string;
  idUnico, CodCategoria, descripcionNueva, unidadRecurso, Precio: string;

begin
  if antiguoValorGrid = '' then
    Exit;

  nuevoValorGrid := grid_APUSRecursos.Cells[ACol, ARow];
  if antiguoValorGrid = nuevoValorGrid then
  begin
    antiguoValorGrid := '';
    Exit;
  end;

  // Datos editados
  idUnico := grid_APUSRecursos.Cells[8, ARow];
  CodCategoria := grid_APUSRecursos.Cells[4, ARow];
  descripcionNueva := grid_APUSRecursos.Cells[1, ARow];
  unidadRecurso := grid_APUSRecursos.Cells[2, ARow];
  Precio := grid_APUSRecursos.Cells[3, ARow];

  // 1) NO tocar BD aquí.
  // 2) Actualiza UI (APUs en creación) y marca pendiente de guardar.
  actualizaApusenCreacion(idUnico, descripcionNueva, unidadRecurso, Precio,
    CodCategoria);
  MarkRecursoModifiedInTree(idUnico, descripcionNueva, Precio);

  MarkGApusRecursos(ARow);

  antiguoValorGrid := '';
end;

procedure TfrmAddAPU.MarkGApusRecursos(ARow: Integer);
begin
  grid_APUSRecursos.Cells[COL_FLAG_GRID, ARow] := 'modificar';
end;

procedure TfrmAddAPU.grid_APUSRecursosCellEditGetData(Sender: TObject;
  ACol, ARow: Integer; CellEditor: TTMSFNCGridEditor; var CellString: string);
begin
  antiguoValorGrid := grid_APUSRecursos.Cells[ACol, ARow];
  columnaSelecionda := ACol;
end;

procedure TfrmAddAPU.grid_APUSRecursosKeyUp(Sender: TObject; var Key: Word;
  var KeyChar: WideChar; Shift: TShiftState);
begin
  if Key = vkEscape then
    grid_APUSRecursos.CancelEdit;
end;

procedure TfrmAddAPU.grid_APUSRecursosMouseLeave(Sender: TObject);
begin
  FTooltip.HideTooltip;

end;

procedure TfrmAddAPU.grid_APUSRecursosMouseMove(Sender: TObject;
  Shift: TShiftState; X, Y: Single);
var
  posicion: TTMSFNCGridCellRec;
  ARow: integer;
  descripcion: string;
begin
  posicion := grid_apusRecursos.XYToCell(X, Y);
  ARow := posicion.Row;
  if Arow < 1 then
    exit;
  descripcion := grid_ApusRecursos.cells[1, Arow];
  FTooltip.ShowAtCursor(descripcion);
end;

procedure TfrmAddAPU.grid_APUSRecursosSelectCell(Sender: TObject; ACol,
  ARow: Integer; var Allow: Boolean);
var
  codCompletoItem: string;
begin
  if ARow > 0 then
  begin
    codCompletoItem := grid_APUSRecursos.Cells[0, ARow];
    MuestraSubCategoriaItemsAPUSRecursos(codCompletoItem);
  end;
end;

function TfrmAddAPU.daPrecioMO(): string;
var
  node: TTMSFMXTreeViewNode;
  tmpstr: string;
  X: Integer;
  floattmp: Double;
begin
  Result := FmtMonD(0);

  node := trvw_APUS.Nodes[3];
  tmpstr := node.Text[0];

  X := Ansipos('[Subtotal: ', tmpstr);
  if X <= 0 then
    Exit;

  tmpstr := Copy(tmpstr, X + length('[Subtotal: '), MaxInt);
  X := Ansipos(']', tmpstr);
  if X <= 0 then
    Exit;

  tmpstr := Trim(Copy(tmpstr, 1, X - 1));
  if tmpstr = '' then
    tmpstr := '0';

  floattmp := S2FLocal(tmpstr, 0);

  // 5% de MO (moneda)
  floattmp := (floattmp * 5) / 100;

  Result := FmtMonD(floattmp);
end;

procedure TfrmAddAPU.EditarRecursos;
var
  LForm: TfrmNuevoRecurso;
  node: TTMSFMXTreeViewNode;

  codCat, codSubCat, CodRec, CodCPC: string;
  idUnico, Descripcion, especificaciones, Unidad: string;
  Precio: currency;

  procedure DaDatosRecurso(IdUnicoRecurso: string;
    out codCat, codSubCat, CodRec, Descripcion, Unidad, CodCPC, especificaciones
    : string; out Precio: currency);
  var
    qry: TUniQuery;
  begin
    qry := TUniQuery.Create(nil);
    try
      qry.Connection := DModule_1.con2;
      qry.SQL.Text :=
        'SELECT codCategoriaBase, codSubCategoria, codRecurso, descripcion, ' +
        '       especificaciones2, unidad, precio, codCPC ' + 'FROM Recursos ' +
        'WHERE idUnico = :idUnico AND codBase = :codBase LIMIT 1';

      qry.ParamByName('idUnico').AsString := IdUnicoRecurso;
      qry.ParamByName('codBase').AsString := base_activa.codBase;
      qry.Open;

      if not qry.Eof then
      begin
        codCat := qry.FieldByName('codCategoriaBase').AsString;
        codSubCat := qry.FieldByName('codSubCategoria').AsString;
        CodRec := qry.FieldByName('codRecurso').AsString;
        CodCPC := qry.FieldByName('codCPC').AsString;
        Descripcion := qry.FieldByName('descripcion').AsString;
        especificaciones := qry.FieldByName('especificaciones2').AsString;
        Unidad := qry.FieldByName('unidad').AsString;
        Precio := qry.FieldByName('precio').AsCurrency;
      end;
    finally
      qry.Free;
    end;
  end;

begin
  node := trvw_APUS.SelectedNode;
  if not Assigned(node) then
    Exit;
  if node.Extended then
    Exit;

  idUnico := node.Text[COL_ID];

  DaDatosRecurso(idUnico, codCat, codSubCat, CodRec, Descripcion, Unidad,
    CodCPC, especificaciones, Precio);

  LForm := TfrmNuevoRecurso.Create(nil);
  try
    IniciaNuevoRecurso(LForm);

    // Modo edición
    LForm.lbl_banner1.Text := 'Editar Recurso';
    LForm.lbl_banner2.Text := 'Edición de Recurso';
    LForm.lbl_modo.Text := 'editar';

    // Datos
    LForm.lbl_codCategoria.Text := codCat;
    LForm.lbl_codSubCategoria.Text := codSubCat;
    LForm.lbl_codRecurso.Text := CodRec;
    LForm.lbl_idUnicoRecurso.Text := idUnico;

    LForm.populaUnidadesRecursos(codCat);

    LForm.edt_codCPC.Text := CodCPC;
    LForm.edt_descripcion.Text := Descripcion;
    LForm.mmo_especificaciones.Text := especificaciones;
    posicionaCombo(LForm.cbb_UTiempos, Unidad);
    LForm.edt_precio.Text := CurrToStr(Precio);

    LForm.ShowModal;

    if LForm.ModalResult = mrOK then
    begin
      // Volver a leer desde BD
      DaDatosRecurso(idUnico, codCat, codSubCat, CodRec, Descripcion, Unidad,
        CodCPC, especificaciones, Precio);

      // ACTUALIZACIÓN UNIFICADA
      ActualizaNodoRecurso(node, Descripcion, Precio);
    end;
  finally
    LForm.Free;
  end;
end;

function TfrmAddAPU.actualizarAPU: string;
type
  dat_nodeT = record
    IdUnicoRecurso: string;
    cantidadRecurso: currency;
    rendimiento: currency;
  end;
var
  listadoRecursos: array of dat_nodeT;
  i, j: Integer;
  nodetmp, subnodetmp: TTMSFMXTreeViewNode;
  IdUnicoRecurso: string;
  cantidadRecurso: currency;
  rendimientoRecurso: currency;
  CodAPU: string;

  QBorrarItemAPU: TUniQuery;
  QInsertarItemApu: TUniQuery;
  QActualizarAPU: TUniQuery;
  QActualizarAnidado: TUniQuery;
  QValidacionAPU: TUniQuery;

  tmpstr: string;

begin
  Result := 'correcto';
  CodAPU := lbl_codAPU.Text.Trim;
  if CodAPU = '' then
    Exit;

  QBorrarItemAPU := TUniQuery.Create(nil);
  QInsertarItemApu := TUniQuery.Create(nil);
  QActualizarAPU := TUniQuery.Create(nil);
  QActualizarAnidado := TUniQuery.Create(nil);
  QValidacionAPU := TUniQuery.Create(nil);

  try
    // 0. Crear Tabla Dinamica con solo los codigos de recursos que contiene el APU
    j := 0;
    for i := 0 to trvw_APUS.Nodes.Count - 1 do
    begin
      if (Assigned(trvw_APUS.Nodes[i])) then
      begin
        nodetmp := trvw_APUS.Nodes[i];

        subnodetmp := nodetmp.GetFirstChild;
        while assigned(subnodetmp) do
        begin
          IdUnicoRecurso := subnodetmp.Text[COL_ID].Trim;
          if IdUnicoRecurso <> '' then
          begin
            setlength(listadoRecursos, j + 1);
            cantidadRecurso := strTocurr(subnodetmp.Text[COL_CANT]);
            tmpstr := subnodeTmp.Text[COL_REND].Trim;
            addlog('Rendimientos: ' + tmpstr);
            if tmpstr = '' then
              tmpstr := '1';
            rendimientoRecurso := strTocurr(tmpstr);
            listadoRecursos[j].IdUnicoRecurso := IdUnicoRecurso;
            listadoRecursos[j].cantidadRecurso := cantidadRecurso;
            listadoRecursos[j].rendimiento := rendimientoRecurso;
            inc(j);
          end;
          subnodetmp := subnodetmp.GetNextSibling;
        end;
      end;
    end;

    // 1. Borrar todos los recursos del apu-codBase para insertar los actuales
    with QBorrarItemAPU do
    begin
      Connection := DModule_1.con2;
      close;
      SQL.Clear;
      {(*}
      SQL.Text :=
        'DELETE FROM ' +
        '  apus_items ' +
        'WHERE ' +
        ' codBase = :codBase AND ' +
        '  codAPU = :codAPU';
      {*)}
      ParamByName('codBase').AsString := base_activa.codBase;
      ParamByName('codAPU').AsString := CodAPU;
      ExecSQL;
    end;

    // 2. Regenero los items de apus_items actualizados
    try
      for i := 0 to length(listadoRecursos) - 1 do
      begin
        with QInsertarItemApu do
        begin
          Connection := DModule_1.con2;
          close;
          SQL.Clear;
          SQL.Text :=
            'CALL insertar_item_apu (:p_codBase, :p_codAPU, :p_idUnicoRecurso, :p_CantidadUnidad, :p_rendimiento)';
          ParamByName('p_codBase').AsString := base_activa.codBase;
          ParamByName('p_codAPU').AsString := CodAPU;
          ParamByName('p_idUnicoRecurso').AsString := listadoRecursos[i]
            .IdUnicoRecurso;
          ParamByName('p_CantidadUnidad').AsCurrency := listadoRecursos[i]
            .cantidadRecurso;
          ParamByName('p_rendimiento').AsCurrency :=
            listadoRecursos[i].rendimiento;
          ExecSQL;
        end;
      end;
    except
      Result := 'error: insertar_item_apu';
    end;

    // 3. Actualizar Total APUS y Porcentaje Recursos
    try
      with QActualizarAPU do
      begin
        Connection := DModule_1.con2;
        close;
        SQL.Clear;
        SQL.Text := 'CALL recalcular_apu_totales (:p_codBase, :p_codAPU)';
        ParamByName('p_codBase').AsString := base_activa.codBase;
        ParamByName('p_codAPU').AsString := CodAPU;
        ExecSQL;
      end;
    except
      Result := 'error: recalcular_apu_totales';
    end;

    // 3.1 Actualizar Apu Validacion
    try
      with QValidacionAPU do
      begin
        Connection := DModule_1.con2;
        Close;
        SQL.Clear;
        {(*}
        SQL.Text:=
          'UPDATE apus ' +
          'SET ' +
          '  pendienteRevision=:pendienteRevision ' +
          'WHERE ' +
          '  codAPU = :codAPU AND ' +
          '  codBase = :codBase';
        {*)}
        if chkRevision.IsChecked then
          ParamByName('pendienteRevision').AsInteger := 1
        else
          ParamByName('pendienteRevision').AsInteger := 0;
        ParamByName('codBase').AsString := base_activa.codBase;
        ParamByName('codAPU').AsString := CodAPU;
        ExeCSQL;
      end;
    finally
      QValidacionAPU.free;
    end;

    // 4. Actualizar si esta anidado
    try
      with QActualizarAnidado do
      begin
        Connection := DModule_1.con2;
        close;
        SQL.Clear;
        SQL.Text := 'CALL sincronizar_apu_como_recurso (:p_codBase, :p_codAPU)';
        ParamByName('p_codBase').AsString := base_activa.codBase;
        ParamByName('p_codAPU').AsString := CodAPU;
        ExecSQL;
      end;
    except
      Result := 'error: sincronizar_apu_como_recurso';
    end;

  finally
    QBorrarItemAPU.Free;
    QInsertarItemApu.Free;
    QActualizarAPU.Free;
    QActualizarAnidado.Free;
  end;
end;

procedure TfrmAddAPU.ActualizaRecursos();
var
  QRecursos: TUniQuery;
  i: Integer;
  IdUnicoRecurso: string;
  descripcionRecurso: string;
  PrecioRecurso: string;
begin
  QRecursos := TUniQuery.Create(nil);
  try
    QRecursos.Connection := DModule_1.con2;
    QRecursos.close;
    QRecursos.SQL.Clear;
    { (* }
    QRecursos.SQL.Text := 'UPDATE recursos ' +
      'SET Descripcion = :descripcion, ' + '  precio = :precio, ' +
      '  preciolocal = :precioLocal ' + 'WHERE ' + '  idUnico = :idUnico AND ' +
      '  codBase = :codBase';
    { *) }

    for i := 1 to grid_APUSRecursos.RowCount - 1 do
    begin
      if grid_APUSRecursos.Cells[10, i] <> '' then
      begin
        IdUnicoRecurso := grid_APUSRecursos.Cells[8, i];
        descripcionRecurso := grid_APUSRecursos.Cells[1, i];
        PrecioRecurso := grid_APUSRecursos.Cells[3, i];
        QRecursos.ParamByName('codBase').AsString := base_activa.codBase;
        QRecursos.ParamByName('idUnico').AsString := IdUnicoRecurso;
        QRecursos.ParamByName('descripcion').AsString := descripcionRecurso;
        QRecursos.ParamByName('precio').AsCurrency :=
          ToFloatDef(PrecioRecurso, 0);
        QRecursos.ParamByName('precioLocal').AsCurrency :=
          ToFloatDef(PrecioRecurso, 0);
        QRecursos.ExecSQL;
      end;
    end;
  finally
    QRecursos.Free;
  end;
end;

function TfrmAddAPU.guardarNuevaAPU: string;
var
  Q, QItem: TUniQuery;
  APUModel: TAPUModel;
  Item: TAPUItem;
  CodAPU, CodRecurso, CodRecursoCompleto, IdUnicoRecurso: string;
  fechaHoraCreacion: TDateTime;
  startedHere: Boolean;

  function S(const A: string): string;
  begin
    Result := Trim(A);
  end;

  function F(const A: string; const Def: Double = 0): Double;
  var
    V: Double;
  begin
    if not TryStrToFloat(decimal_correcto(S(A)), V) then
      V := Def;
    Result := V;
  end;

begin
  Result := 'correcto';

  if S(edt_APUSDescripcion.Text) = '' then
    Exit('Sin descripción');

  if not Assigned(DModule_1) or not Assigned(DModule_1.con2) then
    Exit('Sin conexión');

  fechaHoraCreacion := Now;

  Q := TUniQuery.Create(nil);
  QItem := TUniQuery.Create(nil);
  APUModel := TAPUModel.Create;
  try
    Q.Connection := DModule_1.con2;
    QItem.Connection := DModule_1.con2;

    // -------- MODELO ÚNICO --------
    APUModel.RebuildFromTree(trvw_APUS);

    // Código APU
    CodAPU := S(lbl_codAPU.Text);
    if CodAPU = '' then
      CodAPU := GeneraCodUnicoAPU;

    // Código recurso APU (categoría 6)
    CodRecurso := nuevoCodigoRecurso('6', S(lbl_codSubCategoria.Text));
    CodRecursoCompleto := generaCodigoRecurso('6', codCategoriaAPUSeleccionada,
      CodRecurso);

    startedHere := not Q.Connection.InTransaction;
    if startedHere then
    begin
      Q.Connection.StartTransaction;
      BeginGuardarAPU;
    end;

    try
      // 1) Duplicado
      Q.SQL.Text :=
        'SELECT 1 FROM apus WHERE descripcion=:d AND unidad=:u AND codBase=:b LIMIT 1';
      Q.ParamByName('d').AsString := S(edt_APUSDescripcion.Text);
      Q.ParamByName('u').AsString :=
        DaCodigoUnidad(cb_unidades.Items[cb_unidades.ItemIndex]);
      Q.ParamByName('b').AsString := base_activa.codBase;
      Q.Open;
      if not Q.IsEmpty then
        raise Exception.Create('APU duplicado');
      Q.close;

      // 2) INSERT APUS
      Q.SQL.Text := 'INSERT INTO apus (' +
        'codBase, CategoriaAPU, codCategoriaAPU, codRecursoAPU, codAPU, descripcion, unidad,'
        + 'rendimiento, rendimientoTodoAnalisis, RendimientoTodoEscenario, FechaHoraCreacion,'
        + 'CostoDirectoTotal, CostoIndirectoTotal, PorcentajeCostoIndirecto, PrecioUnitarioTotal,'
        + 'pendienteRevision, ultimaModificacion, moneda, rendimientoHUnidad, nhCuadrillas, anidado'
        + ') VALUES (' +
        ':b,:c,:cca,:cr,:apu,:d,:u,:r,:rta,1,:f,0,0,:p,0,:pr,:f,:m,:rh,:nh,0)';

      Q.ParamByName('b').AsString := base_activa.codBase;
      Q.ParamByName('c').AsString := CategoriaAPUSeleccionada;
      Q.ParamByName('cca').AsString := codCategoriaAPUSeleccionada;
      Q.ParamByName('cr').AsInteger := APUModel.CodRecursoAPU;
      Q.ParamByName('apu').AsString := CodAPU;
      Q.ParamByName('d').AsString := S(edt_APUSDescripcion.Text);
      Q.ParamByName('u').AsString :=
        DaCodigoUnidad(cb_unidades.Items[cb_unidades.ItemIndex]);
      Q.ParamByName('r').AsString := decimal_correcto(lbl_APUSRendimiento.Text);
      Q.ParamByName('rta').AsBoolean := chkRendimiento.IsChecked;
      Q.ParamByName('f').AsDateTime := fechaHoraCreacion;
      Q.ParamByName('p').AsFloat := F(edt_PorcentajeIndirecto.Text, 0);
      Q.ParamByName('pr').AsBoolean := chkRevision.IsChecked;
      Q.ParamByName('m').AsString := base_activa.moneda;
      Q.ParamByName('rh').AsString := lbl_rendimientoHUnidad.Text;
      Q.ParamByName('nh').AsString := lbl_HombresCuadrilla.Text;
      Q.ExecSQL;

      // 3) INSERT recurso APU
      IdUnicoRecurso := 'Rsr' + generaCodigoUnico;

      Q.SQL.Text := 'INSERT INTO recursos (' +
        'idUnico, codBase, codRecurso, codCategoriaBase, codSubcategoria, codRecursoCompleto,'
        + 'descripcion, unidad, precio, preciolocal, termino, Especificaciones, fechahoraCreacion'
        + ') VALUES (' + ':i,:b,:r,6,:s,:rc,:d,:u,0,0,0,:e,:f)';

      Q.ParamByName('i').AsString := IdUnicoRecurso;
      Q.ParamByName('b').AsString := base_activa.codBase;
      Q.ParamByName('r').AsString := CodRecurso;
      Q.ParamByName('s').AsInteger :=
        StrToIntDef(codCategoriaAPUSeleccionada, 0);
      Q.ParamByName('rc').AsString := CodRecursoCompleto;
      Q.ParamByName('d').AsString := S(edt_APUSDescripcion.Text);
      Q.ParamByName('u').AsString :=
        DaCodigoUnidad(cb_unidades.Items[cb_unidades.ItemIndex]);
      Q.ParamByName('e').AsString := 'APU: ' + CodAPU;
      Q.ParamByName('f').AsDateTime := fechaHoraCreacion;
      Q.ExecSQL;

      // 4) INSERT ITEMS DESDE MODELO
      QItem.SQL.Text := 'INSERT INTO apus_items (' +
        'codBase,codAPU,codCategoria,codSubcategoria,idUnicoRecurso,' +
        'codRecurso,codRecursoCompleto,descripcion,Unidad,Precio,' +
        'CantidadUnidad,Rendimiento,Total,Porcentaje) ' +
        'VALUES (:codBase,:codAPU,:codCategoria,:codSubcategoria,:idUnicoRecurso,'
        + ':codRecurso,:codRecursoCompleto,:descripcion,:Unidad,:Precio,' +
        ':CantidadUnidad,:Rendimiento,:Total,:Porcentaje)';
      QItem.Prepare;

      for Item in APUModel.Items do
      begin
        QItem.ParamByName('codBase').AsString := base_activa.codBase;
        QItem.ParamByName('codAPU').AsString := CodAPU;
        QItem.ParamByName('codCategoria').AsString := Item.CodCategoria;
        QItem.ParamByName('codSubcategoria').AsString := Item.CodSubCategoria;
        QItem.ParamByName('idUnicoRecurso').AsString := Item.IdUnicoRecurso;
        QItem.ParamByName('codRecurso').AsString := Item.CodRecurso;
        QItem.ParamByName('codRecursoCompleto').AsString :=
          Item.CodRecursoCompleto;
        QItem.ParamByName('descripcion').AsString := Item.Descripcion;
        QItem.ParamByName('Unidad').AsString := Item.Unidad;
        QItem.ParamByName('Precio').AsFloat := Item.Precio;
        QItem.ParamByName('CantidadUnidad').AsFloat := Item.Cantidad;
        QItem.ParamByName('Rendimiento').AsFloat := Item.Rendimiento;
        QItem.ParamByName('Total').AsFloat := Item.Total;
        QItem.ParamByName('Porcentaje').AsFloat := Item.Porcentaje;
        QItem.ExecSQL;
      end;

      // 5) Recalculo final
      Q.SQL.Text := 'CALL actualizar_apu_completo(:b,:a)';
      Q.ParamByName('b').AsString := base_activa.codBase;
      Q.ParamByName('a').AsString := CodAPU;
      Q.ExecSQL;

      if startedHere then
      begin
        EndGuardarAPU;
        Q.Connection.Commit;
        RecalcularAPUsPendientes();
      end;

    except
      on E: Exception do
      begin
        if startedHere then
        begin
          Q.Connection.Rollback;
          EndGuardarAPU;
        end;
        Exit('error AddAPU.guardarNuevaAPU: ' + E.Message);
      end;
    end;

  finally
    APUModel.Free;
    QItem.Free;
    Q.Free;
  end;
end;

procedure TfrmAddAPU.lbl_Titulo1MouseDown(Sender: TObject; Button: TMouseButton;
  Shift: TShiftState; X, Y: Single);
begin
  Self.StartWindowDrag;
end;

procedure TfrmAddAPU.lbl_Titulo2KeyDown(Sender: TObject; var Key: Word;
  var KeyChar: Char; Shift: TShiftState);
begin
  Self.StartWindowDrag;
end;

procedure TfrmAddAPU.AddAPU(categoriaBase, SubCategoria, CodRecurso: Integer;
  Descripcion, Precio, Unidad, idUnico, CodAPU: string);
var
  parentNode, node: TTMSFMXTreeViewNode;
  Cantidad, Rendimiento, Total, codCompletoRecurso: string;
  catUI: Integer;
  esAPU: Boolean;

  function Zeros(const N: Integer): string;
  begin
    if N > 0 then
      Result := StringOfChar('0', N)
    else
      Result := '';
  end;

  function FmtFixed(const V: Double; const NDec: Integer): string;
  var
    FS: TFormatSettings;
    fmt: string;
  begin
    FS := TFormatSettings.Create;
    FS.DecimalSeparator := '.';
    // normaliza; luego decimal_correcto lo deja como tu app
    if NDec > 0 then
      fmt := '0.' + Zeros(NDec)
    else
      fmt := '0';
    Result := FormatFloat(fmt, V, FS);
    Result := decimal_correcto(Result);
  end;

  function FmtPresupuestoD(const V: Double): string;
  begin
    Result := FmtFixed(V, ndecimalesPresupuesto);
  end;

  function FmtMonedaD(const V: Double): string;
  begin
    Result := FmtFixed(V, ndecimalesMoneda);
  end;

  function S2FLocal(const S: string; const Def: Double = 0): Double;
  begin
    Result := S2F(S, Def);
  end;

  function RendBaseStr: string;
  var
    r: Double;
  begin
    // rendimientoGlobal ya es Double
    r := rendimientoGlobal;

    // seguridad: si es 0, no lo dejes en 0
    if r = 0 then
      r := 1;

    Result := FmtPresupuestoD(r);
  end;

var
  dPrecio: Double;
begin
  esAPU := (categoriaBase = 6);

  // Código completo SIEMPRE con la categoría REAL (1..6)
  codCompletoRecurso := generaCodigoRecurso(IntToStr(categoriaBase),
    IntToStr(SubCategoria), IntToStr(CodRecurso));

  // UI: si es APU anidado (cat 6), se muestra dentro de Materiales (2)
  if esAPU then
    catUI := 2
  else
    catUI := categoriaBase;

  if (catUI - 1 < 0) or (catUI - 1 >= trvw_APUS.Nodes.Count) then
    Exit;

  parentNode := trvw_APUS.Nodes[catUI - 1];
  if not Assigned(parentNode) then
    Exit;

  // ====== VALORES CON FORMATO (REGLA NUEVA) ======
  // Cantidad: ndecimalesPresupuesto
  Cantidad := FmtPresupuestoD(1);

  // Precio: ndecimalesMoneda
  dPrecio := S2FLocal(Precio, 0);
  Precio := FmtMonedaD(dPrecio);

  // Rendimiento (solo aplica a 1,3,4; si no, vacío)
  Rendimiento := '';
  if Unidad = '%MO' then
    Rendimiento := ''
  else if chkRendimiento.IsChecked then
  begin
    if categoriaBase = 3 then
      Rendimiento := FmtPresupuestoD(1)
    else if (categoriaBase = 1) or (categoriaBase = 4) then
      Rendimiento := RendBaseStr
    else
      Rendimiento := '';
  end
  else
  begin
    if (categoriaBase = 1) or (categoriaBase = 3) or (categoriaBase = 4) then
      Rendimiento := FmtPresupuestoD(1)
    else
      Rendimiento := '';
  end;

  trvw_APUS.BeginUpdate;
  try
    node := trvw_APUS.addnode(parentNode);

    NodeTextSetSafe(node, COL_COD, codCompletoRecurso);
    NodeTextSetSafe(node, COL_DESC, Descripcion);
    NodeTextSetSafe(node, COL_UNI, Unidad);

    // Cantidad (Presupuesto)
    NodeTextSetSafe(node, COL_CANT, Cantidad);

    // Precio (Moneda)
    NodeTextSetSafe(node, COL_PRE, Precio);

    // Rendimiento (Presupuesto) solo para 1,3,4
    if (catUI = 1) or (catUI = 3) or (catUI = 4) then
      NodeTextSetSafe(node, COL_REND, Rendimiento)
    else
      NodeTextSetSafe(node, COL_REND, '');

    // Total (Moneda)
    Total := calcularTotal(Cantidad, Precio, Rendimiento, catUI);
    Total := FmtMonedaD(S2FLocal(Total, 0));
    NodeTextSetSafe(node, COL_TOT, Total);

    // Porcentaje (Moneda) -> aquí normalmente queda vacío y lo rellena calculaTotales;
    // cuando se rellene, debe formatearse en calculaTotales/trvw_APUSAfterUpdateNode.
    NodeTextSetSafe(node, COL_PORC, '');

    // Categoría UI (como vienes manejando)
    NodeTextSetSafe(node, COL_CAT, IntToStr(catUI));

    // SIEMPRE idUnicoRecurso
    NodeTextSetSafe(node, COL_ID, idUnico);

    // Si es APU anidado, guarda el codAPU; si no, vacío
    if esAPU then
      NodeTextSetSafe(node, COL_APU, CodAPU)
    else
      NodeTextSetSafe(node, COL_APU, '');

    // flag
    NodeTextSetSafe(node, COL_FLAG, '');
  finally
    trvw_APUS.EndUpdate;
  end;

  calculaTotales;
end;

procedure TfrmAddAPU.actualizaApusenCreacion(idUnico, Descripcion, Unidad,
  Precio, categoriaBase: string);
var
  i, maxNode: Integer;
  node, subNode: TTMSFMXTreeViewNode;
  Total, Cantidad, Rendimiento: string;
  cat: Integer;
begin
  if base_activa.SeguridadIndustrial then
    maxNode := 4
  else
    maxNode := 3;

  for i := 0 to maxNode do
  begin
    node := trvw_APUS.Nodes[i];
    if not Assigned(node) then
      Continue;

    subNode := node.GetFirstChild;
    while Assigned(subNode) do
    begin
      if NodeTextSafe(subNode, COL_ID) = idUnico then
      begin
        subNode.Text[1] := Descripcion;
        subNode.Text[2] := Unidad;
        subNode.Text[4] := decimal_correcto(Precio);

        cat := StrToIntDef(categoriaBase, 0);

        Rendimiento := subNode.Text[5];
        if (cat <> 1) and (cat <> 3) and (cat <> 4) then
          Rendimiento := '1';
        if Trim(Rendimiento) = '' then
          Rendimiento := '1';

        Cantidad := decimal_correcto(subNode.Text[3]);
        Total := calcularTotal(Cantidad, Precio, Rendimiento, cat);

        subNode.Text[6] := Total;
        subNode.Text[7] := ''; // luego calculaTotales recalcula porcentajes
        Break;
      end;

      subNode := subNode.GetNextSibling;
    end;
  end;

  calculaTotales;
end;

function TfrmAddAPU.calcularTotal(Cantidad, Precio, Rendimiento: string;
  categoriaBase: Integer): string;
var
  Tcantidad, Tprecio, Trendimiento, tTotal: Double;
  tipoBase: Integer;
begin
  Result := FmtMonD(0);

  if lbl_modo.Text = '' then
    Exit;

  if base_activa.Trendimiento = 'Rendimiento Unitario (Tiempo/Unidad)' then
    tipoBase := 1
  else
    tipoBase := 2;

  Tcantidad := S2FLocal(Cantidad, 0);
  Tprecio := S2FLocal(Precio, 0);

  if Trim(Rendimiento) <> '' then
    Trendimiento := S2FLocal(Rendimiento, 1)
  else
    Trendimiento := 1;

  if Trendimiento = 0 then
    Trendimiento := 1;

  // tu regla: si tipoBase=2 invierte
  if tipoBase = 2 then
    Trendimiento := 1 / Trendimiento;

  tTotal := Tcantidad * Tprecio * Trendimiento;

  // Total SIEMPRE moneda
  Result := FmtMonD(tTotal);
end;

procedure TfrmAddAPU.calculaTotales;
var
  maxNode, X: Integer;
  node, subNode: TTMSFMXTreeViewNode;

  costoDirectoTotal: Double;
  porcIndirectoPct: Double; // porcentaje (0..100)
  porcIndirecto: Double; // factor (0..1)
  costoIndirecto: Double;
  precioUnitTotal: Double;

  subtotal: array[0..5] of Double;
  subPorc: array[0..5] of Double;

  rendimientoHUnidad: Double;
  hombresCuadrilla: Double;

  procedure AccumMO(const ANode: TTMSFMXTreeViewNode);
  var
    c, r: Double;
  begin
    c := S2FLocal(NodeTextSafe(ANode, COL_CANT), 0);
    r := S2FLocal(NodeTextSafe(ANode, COL_REND), 0);

    // Hombres en cuadrilla = Cantidad (presupuesto)
    hombresCuadrilla := hombresCuadrilla + c;

    // Rendimiento HH = Cantidad * Rendimiento (presupuesto)
    rendimientoHUnidad := rendimientoHUnidad + (c * r);
  end;

  function RootTitle(const RootIndex: Integer): string;
  begin
    case RootIndex of
      0:
        Result := 'Equipos y Herramientas';
      1:
        Result := 'Materiales';
      2:
        Result := 'Transporte';
      3:
        Result := 'Mano de Obra';
      // 4: Result := 'Seguridad Industrial';
    else
      Result := 'Categoría';
    end;
  end;

  procedure SetRootTitle(const RootIndex: Integer);
  var
    title: string;
  begin
    title := RootTitle(RootIndex) + ' [Subtotal: ' + FmtMonD(subtotal[RootIndex]
      ) + ']' + ' [Porcentaje: ' + FmtPorcD(subPorc[RootIndex]) + '%]';

    if RootIndex = 3 then
    begin
      title := title + '     [Rendimiento Horas-Hombre: ' +
        FmtPresuD(rendimientoHUnidad) + ']' + '     [Hombres en Cuadrilla: ' +
        FmtPresuD(hombresCuadrilla) + ']';

      lbl_rendimientoHUnidad.Text := FmtPresuD(rendimientoHUnidad);
      lbl_HombresCuadrilla.Text := FmtPresuD(hombresCuadrilla);
    end;

    NodeTextSetSafe(trvw_APUS.Nodes[RootIndex], 0, title);
  end;

begin
  if lbl_modo.Text = '' then
    Exit;

  if base_activa.SeguridadIndustrial then
    maxNode := 4
  else
    maxNode := 3;

  FillChar(subtotal, SizeOf(subtotal), 0);
  FillChar(subPorc, SizeOf(subPorc), 0);

  rendimientoHUnidad := 0;
  hombresCuadrilla := 0;
  lbl_rendimientoHUnidad.Text := FmtPresuD(0);
  lbl_HombresCuadrilla.Text := FmtPresuD(0);

  // Porcentaje indirecto: UI en % (0..100)
  porcIndirectoPct := S2FLocal(edt_PorcentajeIndirecto.Text, 0);
  porcIndirecto := porcIndirectoPct / 100;

  // 1) Subtotales por categoría (Total ya está en moneda, pero lo leemos como float)
  for X := 0 to maxNode do
  begin
    node := trvw_APUS.Nodes[X];
    if not Assigned(node) then
      Continue;

    subNode := node.GetFirstChild;
    while Assigned(subNode) do
    begin
      subtotal[X] := subtotal[X] + S2FLocal(NodeTextSafe(subNode, COL_TOT), 0);

      if X = 3 then
        AccumMO(subNode);

      subNode := subNode.GetNextSibling;
    end;
  end;

  costoDirectoTotal := 0;
  for X := 0 to maxNode do
    costoDirectoTotal := costoDirectoTotal + subtotal[X];

  // Labels moneda
  lbl_APUCostoDirectoTotal.Text := FmtMonD(costoDirectoTotal);

  // 2) Indirectos + PU (moneda)
  costoIndirecto := costoDirectoTotal * porcIndirecto;
  precioUnitTotal := costoDirectoTotal + costoIndirecto;

  lbl_APUCostoIndirectoTotal.Text := FmtMonD(costoIndirecto);
  lbl_APUPrecioUnitario.Text := FmtMonD(precioUnitTotal);

  // 3) Porcentajes (ndecimalesMoneda) por item + por subtotal
  if costoDirectoTotal > 0 then
  begin
    for X := 0 to maxNode do
    begin
      node := trvw_APUS.Nodes[X];
      if not Assigned(node) then
        Continue;

      subNode := node.GetFirstChild;
      while Assigned(subNode) do
      begin
        var
        itemTot := S2FLocal(NodeTextSafe(subNode, COL_TOT), 0);
        var
        P := (itemTot / costoDirectoTotal) * 100;

        NodeTextSetSafe(subNode, COL_PORC, FmtPorcD(P) + '%');
        subPorc[X] := subPorc[X] + P;

        subNode := subNode.GetNextSibling;
      end;
    end;
  end
  else
  begin
    for X := 0 to maxNode do
    begin
      node := trvw_APUS.Nodes[X];
      if not Assigned(node) then
        Continue;

      subNode := node.GetFirstChild;
      while Assigned(subNode) do
      begin
        NodeTextSetSafe(subNode, COL_PORC, FmtPorcD(0) + '%');
        subNode := subNode.GetNextSibling;
      end;
    end;
  end;

  // 4) Títulos raíz
  for X := 0 to maxNode do
    if Assigned(trvw_APUS.Nodes[X]) then
      SetRootTitle(X);
end;

procedure TfrmAddAPU.LimpiaAPU;
var
  X, maxNode: Integer;
  salida: Integer;
begin

  X := 0;
  while X < 6 do
  begin
    if X = 4 then
    begin
      if base_activa.SeguridadIndustrial then
      begin
        limpiaItemsAPU(X);
      end;
    end
    else
    begin
      limpiaItemsAPU(X);
    end;
    inc(X);
  end;
end;

procedure TfrmAddAPU.rect_addUnidadesClick(Sender: TObject);
var
  LForm: Tfrm_editorUnidades;
begin
  // Nueva unidad de medida
  LForm := Tfrm_editorUnidades.Create(Application);
  try
    LForm.lbl_banner1.Text := 'Crear Unidad de Medida';
    LForm.edt_Unidad.Text := '';
    LForm.edt_Nombre.Text := '';
    LForm.modoTrabajo := 1;
    LForm.Height := 165;
    LForm.SubCategoria := '6';
    LForm.CentrarSobre(Self.rect_4);
    LForm.ShowModal;
  finally
    LForm.Free;
  end;
end;

procedure TfrmAddAPU.rect_addUnidadesMouseEnter(Sender: TObject);
begin
  TRectFillBitmapColorizer.Apply(rect_addUnidades, $FFF39200);
end;

procedure TfrmAddAPU.rect_addUnidadesMouseLeave(Sender: TObject);
begin
  TRectFillBitmapColorizer.Restore(rect_addUnidades);
end;

procedure TfrmAddAPU.rect_editUnidadesClick(Sender: TObject);
var
  LForm: Tfrm_editorUnidades;
  tCodUnidad: string;
  tDescripcionUnidad: string;
  X: Integer;
begin
  // Edita unidad de medida
  LForm := Tfrm_editorUnidades.Create(Application);
  try

    LForm.lbl_banner1.Text := 'Editar Unidad de Medida';

    tDescripcionUnidad := cb_unidades.Items[cb_unidades.ItemIndex];
    tCodUnidad := DaCodigoUnidad(tDescripcionUnidad);
    X := Ansipos('(', tDescripcionUnidad);
    tDescripcionUnidad := Copy(tDescripcionUnidad, 1, X - 1).Trim;
    LForm.old_descripcion := tCodUnidad;
    LForm.old_descripcion_completa := tDescripcionUnidad;
    LForm.SubCategoria := '6';
    LForm.edt_Unidad.Text := LForm.old_descripcion;
    LForm.edt_Nombre.Text := LForm.old_descripcion_completa;
    LForm.modoTrabajo := 2;
    LForm.Height := 165;
    LForm.CentrarSobre(Self.rect_4);
    LForm.ShowModal;
  finally
    LForm.Free;
  end;
end;

procedure TfrmAddAPU.rect_editUnidadesMouseEnter(Sender: TObject);
begin
  TRectFillBitmapColorizer.Apply(rect_editUnidades, $FFF39200);
end;

procedure TfrmAddAPU.rect_editUnidadesMouseLeave(Sender: TObject);
begin
  TRectFillBitmapColorizer.Restore(rect_editUnidades);
end;

procedure TfrmAddAPU.rect_1MouseDown(Sender: TObject; Button: TMouseButton;
  Shift: TShiftState; X, Y: Single);
begin
  Self.StartWindowDrag;
end;

procedure TfrmAddAPU.rect_AceptarClick(Sender: TObject);
var
  modo: Integer;
  res: string;
begin
  trvw_APUS.StopEditing;
  iGlow_Aceptar.Enabled := False;

  if not Assigned(DModule_1) or not Assigned(DModule_1.con2) then
  begin
    MuestraMensajeGiproy('Error', 'Sin conexión a base de datos');
    Exit;
  end;

  modo := StrToIntDef(lbl_modo.Text, 0);
  if modo = 0 then
    Exit;

  if not DModule_1.con2.InTransaction then
  begin

    DModule_1.con2.StartTransaction;
    BeginGuardarAPU;
  end;

  try
    case modo of
      1:
        res := guardarNuevaAPU; // debe NO hacer commit propio
      2:
        res := actualizarAPU; // debe NO hacer commit propio
    else
      res := 'Modo inválido';
    end;

    if res <> 'correcto' then
      raise Exception.Create(res);

    // Aplica aquí cambios pendientes de recursos (marcados con COL_FLAG='modificar')
    // OJO: este método debe hacer UPDATEs usando la conexión actual (misma transacción) y NO commit.
    actualizaDatosRecursos;
    EndGuardarAPU;
    DModule_1.con2.Commit;
    RecalcularAPUsPendientes();

    refrescalistaAPUsDisponibles;
    ModalResult := mrOK;
  except
    on E: Exception do
    begin
      if DModule_1.con2.InTransaction then
      begin
        DModule_1.con2.Rollback;
        EndGuardarAPU;
      end;

      MuestraMensajeGiproy('Información', E.Message);
      Exit;
    end;
  end;
end;

procedure TfrmAddAPU.rect_AceptarMouseEnter(Sender: TObject);
begin
  iGlow_Aceptar.Enabled := True;
end;

procedure TfrmAddAPU.rect_AceptarMouseLeave(Sender: TObject);
begin
  iGlow_Aceptar.Enabled := False;
end;

procedure TfrmAddAPU.rect_bntFindCategoriaMouseUp(Sender: TObject;
  Button: TMouseButton; Shift: TShiftState; X, Y: Single);
var
  filtro: string;
begin
  filtro := edt_FindCategorias.Text;
  if filtro <> '' then
  begin
    actualizaListadoAPUSubcagoriaFiltrado(filtro);
  end
  else
  begin
    actualizaListadoAPUSubcategoria();
  end;
end;

procedure TfrmAddAPU.rect_btnFindRecursosMouseUp(Sender: TObject;
  Button: TMouseButton; Shift: TShiftState; X, Y: Single);
var
  fltr: TTMSFNCGridFilterData;
begin
  grid_APUSRecursos.UnHideRowsAll;
  grid_APUSRecursos.Filter.Clear;
  if edt_FindRecursos.Text <> '' then
  begin
    fltr := grid_APUSRecursos.Filter.Add;
    fltr.Column := 1;
    fltr.CaseSensitive := False;
    fltr.Condition := '*' + edt_FindRecursos.Text + '*';
    grid_APUSRecursos.ApplyFilter;
  end;
end;

procedure TfrmAddAPU.rect_CancelarClick(Sender: TObject);
begin
  ModalResult := mrCancel;
end;

procedure TfrmAddAPU.rect_CancelarMouseEnter(Sender: TObject);
begin
  iGlow_Cancelar.Enabled := True;
end;

procedure TfrmAddAPU.rect_CancelarMouseLeave(Sender: TObject);
begin
  iGlow_Cancelar.Enabled := False;
end;

procedure TfrmAddAPU.rect_CloseMouseUp(Sender: TObject; Button: TMouseButton;
  Shift: TShiftState; X, Y: Single);
begin
  frmAddAPU.close;
end;

function TfrmAddAPU.RecursoDuplicado(Descripcion, Unidad: string): Boolean;
var
  X: Integer;
  node, subNode: TTMSFMXTreeViewNode;
  maxNode: Integer;
begin
  Result := False;

  if base_activa.SeguridadIndustrial then
    maxNode := 4
  else
    maxNode := 3;

  for X := 0 to maxNode do
  begin
    node := trvw_APUS.Nodes[X];
    if not Assigned(node) then
      Continue;

    subNode := node.GetFirstChild;
    while Assigned(subNode) do
    begin
      if (subNode.Text[1] = Descripcion) and (subNode.Text[2] = Unidad) then
        Exit(True);
      subNode := subNode.GetNextSibling;
    end;
  end;
end;

procedure TfrmAddAPU.trvw_APUSAfterUpdateNode(Sender: TObject;
  ANode: TTMSFMXTreeViewVirtualNode; AColumn: Integer);
var
  subNode: TTMSFMXTreeViewNode;
begin
  subNode := trvw_APUS.SelectedNode;
  if not Assigned(subNode) then
    Exit;

  // Normalización numérica
  case AColumn of
    COL_CANT:
      NodeTextSetSafe(subNode, COL_CANT,
        FmtPresuD(S2FLocal(NodeTextSafe(subNode, COL_CANT), 0)));

    COL_PRE:
      NodeTextSetSafe(subNode, COL_PRE,
        FmtMonD(S2FLocal(NodeTextSafe(subNode, COL_PRE), 0)));

    COL_REND:
      NodeTextSetSafe(subNode, COL_REND,
        FmtPresuD(S2FLocal(NodeTextSafe(subNode, COL_REND), 1)));
  end;

  // Delegar TODA la lógica
  ActualizaNodoRecurso(subNode, NodeTextSafe(subNode, COL_DESC),
    StrToCurrDef(NodeTextSafe(subNode, COL_PRE), 0));
end;

procedure TfrmAddAPU.CambiaValoresGridRecursos(IdUnicoRecurso,
  Descripcion: string; Precio: currency);
var
  X: Integer;
  salir: Boolean;
begin
  X := 0;
  salir := False;
  while (not salir) and (X < grid_APUSRecursos.RowCount - 1) do
  begin
    if IdUnicoRecurso = grid_APUSRecursos.Cells[8, X] then
    begin
      salir := True;
      grid_APUSRecursos.Cells[1, X] := Descripcion;
      grid_APUSRecursos.Cells[3, X] := CurrToStr(Precio);
    end;
    inc(X);
  end;
end;

procedure TfrmAddAPU.trvw_APUSBeforeOpenInplaceEditor(Sender: TObject;
  ANode: TTMSFMXTreeViewVirtualNode; AColumn: Integer; var ACanOpen: Boolean);
begin
  FTVOldText := ANode.Text[AColumn]; // ????
  if (LeftStr(ANode.Text[0], 1) = '6') and ((AColumn = 1) or (AColumn = 4)) then
  begin
    ACanOpen := False;
    MuestraMensajeGiproy('Información',
      'APU Anidado. Para editar use el APU Original.');
  end
  else
    ACanOpen := True;
end;

procedure TfrmAddAPU.trvw_APUSBeforeReorderNode(Sender: TObject;
  AFromNode, AToNode: TTMSFMXTreeViewVirtualNode; var ACanReorder: Boolean);
var
  codCategoriaPadre: Integer;
  final, Origen: string;
begin
  final := AToNode.Text[0];
  Origen := AFromNode.Text[0];
  final := LeftStr(final, 1);
  Origen := LeftStr(Origen, 1);
  if Origen = '6' then
    Origen := '2';
  if Origen = final then
    ACanReorder := True
  else
    ACanReorder := False;
end;

procedure TfrmAddAPU.trvw_APUSDblClick(Sender: TObject);
begin
  if (ACOLMouseAPUS = 1) or (ACOLMouseAPUS = 0) then
    EditarRecursos;
end;

procedure TfrmAddAPU.trvw_APUSGetInplaceEditor(Sender: TObject;
  ANode: TTMSFMXTreeViewVirtualNode; AColumn: Integer;
  var ATransparent: Boolean;
  var AInplaceEditorClass: TTMSFMXTreeViewInplaceEditorClass);
var
  nodo: TTMSFMXTreeViewNode;
begin
  nodo := trvw_APUS.SelectedNode;
  antiguoValor := nodo.Text[AColumn].Trim;
  FEditColumn := AColumn;
  WasEditing := True;
end;

procedure TfrmAddAPU.trvw_APUSKeyDown(Sender: TObject; var Key: Word;
  var KeyChar: WideChar; Shift: TShiftState);
var
  NodeActual: TTMSFMXTreeViewNode;
  NodeSiguiente: TTMSFMXTreeViewNode;
  Col: Integer;
  OldValue: string;
begin
  NodeActual := trvw_APUS.SelectedNode;
  if (NodeActual = nil) or (FEditColumn < 0) then
    Exit;

  case Key of

    VK_ESCAPE:
      begin
        Col := FEditColumn;
        if (Col < 0) or (Col >= trvw_APUS.Columns.Count) then
        begin
          Key := 0;
          KeyChar := #0;
          Exit;
        end;
        WasEditing := False;
        OldValue := antiguoValor;

        // Consumir tecla
        Key := 0;
        KeyChar := #0;

        // Cerrar editor
        if trvw_APUS.IsEditing then
          trvw_APUS.CancelEditing;

        // Restaurar DESPUÉS de la lógica interna del control
        TThread.Queue(nil,
          procedure
          begin
            if Assigned(NodeActual) then
              NodeActual.Text[Col] := OldValue;
            trvw_APUS.RePaint;
          end);

        Exit;
      end;

    VK_DOWN:
      begin
        Col := FEditColumn;
        if (Col < 0) or (Col >= trvw_APUS.Columns.Count) then
        begin
          Key := 0;
          KeyChar := #0;
          Exit;
        end;

        // Consumir tecla
        Key := 0;
        KeyChar := #0;

        // Si estaba editando → validar y cerrar
        if WasEditing then
        begin
          if Trim(NodeActual.Text[Col]) = '' then
            NodeActual.Text[Col] := antiguoValor;

          trvw_APUS.StopEditing;
        end;

        // Navegar cuando el editor ya liberó el foco
        TThread.Queue(nil,
          procedure
          var
            NodeDestino: TTMSFMXTreeViewNode;
          begin
            // OJO: volver a obtener el nodo actual aquí
            NodeDestino := trvw_APUS.GetNextNode(trvw_APUS.SelectedNode);
            if NodeDestino = nil then
              Exit;

            trvw_APUS.SelectNode(NodeDestino);

            // Si no estaba editando antes → solo navegar
            if not WasEditing then
              Exit;

            // No editar nodos expandibles
            if NodeDestino.Extended then
              Exit;

            // Preparar valor anterior
            antiguoValor := Trim(NodeDestino.Text[Col]);

            // En tu versión la forma correcta de entrar en edición
            trvw_APUS.EditNode(NodeDestino, FEditColumn);
          end);

        Exit;
      end;
  end;
end;

procedure TfrmAddAPU.trvw_APUSMouseMove(Sender: TObject;
  Shift: TShiftState; X, Y: Single);
var
  Col, I: Integer;
  PosX: Single;
begin
  PosX := X;
  Col := -1;

  // Recorrer anchos de columnas
  for I := 0 to trvw_APUS.Columns.Count - 1 do
  begin
    if PosX < trvw_APUS.Columns[I].Width then
    begin
      Col := I;
      Break;
    end;

    PosX := PosX - trvw_APUS.Columns[I].Width;
  end;

  ACOLMouseAPUS := Col;
end;

procedure TfrmAddAPU.trvw_APUSNodeClick(Sender: TObject;
  ANode: TTMSFMXTreeViewVirtualNode);
var
  codItemCompleto: string;
  categoriaBaseItem: Integer;
  X: Integer;
  nodo: TTMSFMXTreeViewNode;
begin
  codItemCompleto := ANode.Text[0];
  codItemCompleto := Trim(lowercase(codItemCompleto));
  X := Ansipos(' ', codItemCompleto);
  if X > 0 then
    codItemCompleto := Copy(codItemCompleto, 1, X - 1);
  categoriaBaseItem := -1;
  if (codItemCompleto = 'equipos') then
    categoriaBaseItem := 1;

  if codItemCompleto = 'materiales' then
    categoriaBaseItem := 2;

  if codItemCompleto = 'transporte' then
    categoriaBaseItem := 3;

  if codItemCompleto = 'mano' then
    categoriaBaseItem := 4;

  if codItemCompleto = 'seguridad' then
    categoriaBaseItem := 5;
  if (categoriaBaseItem = -1) and (codItemCompleto <> '') then
  begin
    codItemCompleto := daDatoCodigo(codItemCompleto, 1);
    if codItemCompleto = '6' then
      categoriaBaseItem := 2
    else
      categoriaBaseItem := StrToInt(codItemCompleto);
  end;
  nodo := tv_SubCategoriaAPU.Nodes[categoriaBaseItem - 1];
  tv_SubCategoriaAPU.SelectNode(nodo);
  tv_SubCategoriaAPU.CollapseAll;
  grid_APUSRecursos.UnHideRowsAll;
  grid_APUSRecursos.Filter.Clear;
  edt_FindRecursos.Text := '';
  muestraAPUSTodosRecursos(base_activa.codBase, IntToStr(categoriaBaseItem));
end;

procedure TfrmAddAPU.actualizaRendimientoTotal();
var
  X: Integer;
  nodo, subNodo: TTMSFMXTreeViewNode;
  tmpR: string;
  categoriaBase: Integer;
  Cantidad, Precio, subtotal: string;
begin
  tmpR := decimal_correcto(FloatToStr(rendimientoGlobal));

  trvw_APUS.BeginUpdate;
  try
    for X := 0 to trvw_APUS.Nodes.Count - 1 do
    begin
      nodo := trvw_APUS.Nodes[X];
      if not Assigned(nodo) then
        Continue;

      subNodo := nodo.GetFirstChild;
      while Assigned(subNodo) do
      begin
        categoriaBase := SafeStrToInt(NodeTextSafe(subNodo, COL_CAT), 0);

        if (categoriaBase = 1) or (categoriaBase = 3) or (categoriaBase = 4)
          then
        begin
          if Trim(NodeTextSafe(subNodo, COL_CANT)) <> '' then
          begin
            NodeTextSetSafe(subNodo, COL_REND, tmpR);

            Cantidad := decimal_correcto(NodeTextSafe(subNodo, COL_CANT));
            Precio := decimal_correcto(NodeTextSafe(subNodo, COL_PRE));

            subtotal := calcularTotal(Cantidad, Precio, tmpR, categoriaBase);
            NodeTextSetSafe(subNodo, COL_TOT, subtotal);
          end;
        end;

        subNodo := subNodo.GetNextSibling;
      end;
    end;
  finally
    trvw_APUS.EndUpdate;
  end;

  calculaTotales;
end;

function TfrmAddAPU.AntiguoValortrvw(): string;
var
  nodo: TTMSFMXTreeViewNode;
begin
  nodo := trvw_APUS.SelectedNode;
  if nodo.Text[columnaSelecionda] = '' then
  begin
    if (columnaSelecionda > -1) and (antiguoValor <> '') then
    begin
      // nodo.Text[columnaSelecionda] := antiguoValor;
      Result := antiguoValor;
    end;
  end;
  columnaSelecionda := -1;
  antiguoValor := '';
end;

procedure TfrmAddAPU.MenuItem2Click(Sender: TObject);
var
  node, Node2: TTMSFMXTreeViewNode;
  X: Integer;
  Borrar: Boolean;
  maxNode: Integer;

  function GetCurrentNode: TTMSFMXTreeViewNode;
  begin
    Result := nil;

    // TMS TreeView suele exponer SelectedNode; si no existe en tu versión,
    // cambia por FocusedNode/SelectedItem según tu componente.
    if Assigned(trvw_APUS.SelectedNode) then
      Exit(trvw_APUS.SelectedNode);

    if Assigned(trvw_APUS.FocusedNode) then
      Exit(trvw_APUS.FocusedNode);
  end;

begin
  node := GetCurrentNode;
  if not Assigned(node) then
    Exit;

  Borrar := True;

  // Proteger nodos raiz (categorías principales)
  // Si SeguridadIndustrial NO está activa, el árbol tiene 4 raíces (0..3).
  // Si está activa, tiene 5 raíces (0..4).
  if base_activa.SeguridadIndustrial then
    maxNode := 4
  else
    maxNode := 3;

  // Asegurar que nunca nos salimos del rango real
  if trvw_APUS.Nodes.Count = 0 then
    Exit;

  if maxNode > trvw_APUS.Nodes.Count - 1 then
    maxNode := trvw_APUS.Nodes.Count - 1;

  for X := 0 to maxNode do
  begin
    Node2 := trvw_APUS.Nodes[X];
    if node = Node2 then
    begin
      Borrar := False; // es un nodo raíz protegido
      Break;
    end;
  end;

  if not Borrar then
  begin
    MuestraMensajeGiproy('Advertencia',
      'No se puede borrar una categoría raíz.');
    Exit;
  end;

  // Confirmación
  if realizarPreguntaSiNo('¿Borrar el elemento seleccionado?') <> mrOK then
    Exit;
  trvw_APUS.BeginUpdate;
  try
    node.Free;

    // Limpieza de selección/foco (evita referencias colgantes)
    if Assigned(trvw_APUS.SelectedNode) then
      trvw_APUS.SelectedNode := nil;

    if Assigned(trvw_APUS.FocusedNode) then
      trvw_APUS.FocusedNode := nil;
  finally
    trvw_APUS.EndUpdate;
  end;

end;

procedure TfrmAddAPU.MenuItem5Click(Sender: TObject);
begin
  EditarRecursos;
end;

procedure TfrmAddAPU.tv_SubCategoriaAPUKeyUp(Sender: TObject; var Key: Word;
  var KeyChar: Char; Shift: TShiftState);
var
  tmpstr: string;
  categoria, ciu: string;
  ANode: TTMSFMXTreeViewNode;
begin
  ANode := tv_SubCategoriaAPU.SelectedNode;
  if Assigned(ANode) then
  begin
    if (Key = vkUp) or (Key = vkDown) then
    begin
      edt_FindRecursos.Text := '';
      if not ANode.Extended then
      begin
        categoria := ANode.Text[1];
        ciu := ANode.Text[2];
        tmpstr := ANode.Text[0];
        muestraAPUSRecursos(base_activa.codBase, categoria, ciu);
      end
      else
      begin
        tmpstr := ANode.Text[0];
        tmpstr := lowercase(tmpstr);
        if tmpstr = 'equipos y herramientas' then
        begin
          categoria := '1';
        end;
        if tmpstr = 'materiales' then
        begin
          categoria := '2';
        end;
        if tmpstr = 'transporte' then
        begin
          categoria := '3';
        end;
        if tmpstr = 'mano de obra' then
        begin
          categoria := '4';
        end;
        if tmpstr = 'seguridad industrial' then
        begin
          categoria := '5';
        end;
        if tmpstr = 'análisis precios unitarios' then
        begin
          categoria := '6';
        end;

        muestraAPUSTodosRecursos(base_activa.codBase, categoria);
        cuentaItemsAPUSRecursos();
      end;
    end;
  end;
end;

procedure TfrmAddAPU.tv_SubCategoriaAPUNodeClick(Sender: TObject;
  ANode: TTMSFMXTreeViewVirtualNode);
var
  categoria, ciu, titulo: string;
begin
  if FLoadingRecursos then
    Exit;

  edt_FindRecursos.Text := '';
  lbl_CategoriaItemMostrado.Text := '';

  // Habilita edición solo si NO es categoría 6
  // (si es nodo hijo, categoria viene de text[1])
  if not ANode.node.Extended then
  begin
    categoria := ANode.Text[1];
    ciu := ANode.Text[2];

    grid_APUSRecursos.Options.Editing.Enabled := (categoria <> '6');
    muestraAPUSRecursos(base_activa.codBase, categoria, ciu);
    Exit;
  end;

  // Nodo padre (extended) => mapeo por texto
  titulo := lowercase(Trim(ANode.Text[0]));

  if titulo = 'equipos y herramientas' then
    categoria := '1'
  else if titulo = 'materiales' then
    categoria := '2'
  else if titulo = 'transporte' then
    categoria := '3'
  else if titulo = 'mano de obra' then
    categoria := '4'
  else if titulo = 'seguridad industrial' then
    categoria := '5'
  else if titulo = 'análisis de precios unitarios' then
    categoria := '6'
  else
    categoria := '2'; // fallback seguro

  grid_APUSRecursos.Options.Editing.Enabled := (categoria <> '6');
  muestraAPUSTodosRecursos(base_activa.codBase, categoria);
end;

end.

