unit uImportarSubCategorias;

interface

uses
  System.SysUtils, System.Types, System.UITypes, System.Classes, System.Variants,
  Uni,
  System.StrUtils,
  FMX.Types, FMX.Controls, FMX.Forms, FMX.Graphics, FMX.Dialogs,
  FMX.Memo.Types,
  FMX.TMSFNCTypes, FMX.TMSFNCUtils, FMX.TMSFNCGraphics, FMX.TMSFNCGraphicsTypes,
  FMX.TMSFNCGridCell, FMX.TMSFNCGridOptions,
  FMX.Effects,
  FMX.TMSFNCCustomControl, FMX.TMSFNCCustomScrollControl,
  FMX.TMSFNCGridData, FMX.TMSFNCCustomGrid, FMX.TMSFNCGrid,
  FMX.ScrollBox, FMX.Memo,
  FMX.StdCtrls, FMX.ListBox,
  FMX.Ani, FMX.Edit, FMX.Layouts, FMX.Objects, FMX.Controls.Presentation,
  FMX.TMSFNCSplitter, FMX.TMSFNCTreeViewBase, FMX.TMSFNCTreeViewData,
  FMX.TMSFNCCustomTreeView, FMX.TMSFNCTreeView,
  FMX.TMSFNCListBox, FMX.TMSFNCCheckedTreeView, FMX.TMSFNCPanel, FMX.Menus;

type
  TfrmImportarSubCategorias = class(TForm)
    lyt_Background: TLayout;
    lyt_Body: TLayout;
    rct__2: TRectangle;
    lyt_3: TLayout;
    rct__3: TRectangle;
    lyt_6: TLayout;
    rct_BackgroundGris: TRectangle;
    lyt_7: TLayout;
    lbl_banner2: TLabel;
    lyt_footer: TLayout;
    lbl_modo: TLabel;
    lbl_moneda_pais: TLabel;
    rct__Aceptar: TRectangle;
    iGlow_Aceptar: TInnerGlowEffect;
    lyt_header: TLayout;
    rct_1: TRectangle;
    lbl_banner1: TLabel;
    lyt_subcategorias: TLayout;
    tmsfncspltr1: TTMSFNCSplitter;
    lyt_BasesDisponibles: TLayout;
    TreeView_SubCategorias: TTMSFNCTreeView;
    lyt2: TLayout;
    lyt3: TLayout;
    TreeView_SubDisponibles: TTMSFNCCheckedTreeView;
    pnl_1: TTMSFNCPanel;
    grid_basesDisponibles: TTMSFNCGrid;
    chk_BasesPadres: TCheckBox;
    rct_Cancelar: TRectangle;
    iGlow_Cancelar: TInnerGlowEffect;
    pmSubcategorias: TPopupMenu;
    pmSubDisponibles: TPopupMenu;
    MenuItem1: TMenuItem;
    MenuItem3: TMenuItem;

    procedure rct_1MouseDown(Sender: TObject; Button: TMouseButton; Shift: TShiftState; X, Y: Single);
    procedure rct__AceptarClick(Sender: TObject);
    procedure chk_BasesPadresChange(Sender: TObject);
    procedure grid_basesDisponiblesCellClick(Sender: TObject; ACol, ARow: Integer);
    procedure TreeView_SubDisponiblesAfterCheckNode(Sender: TObject; ANode: TTMSFNCTreeViewVirtualNode; AColumn: Integer);
    procedure TreeView_SubDisponiblesAfterUnCheckNode(Sender: TObject; ANode: TTMSFNCTreeViewVirtualNode; AColumn: Integer);
    procedure rct_CancelarClick(Sender: TObject);
    procedure MenuItem3Click(Sender: TObject);
    procedure TreeView_SubDisponiblesDblClick(Sender: TObject);
  private
    procedure guardaSubcategoriasAdicionadas;
    procedure addCategoria;
    procedure addSeleccion;
    function encuentraCategoria(const textCategoria: string): Boolean;
    function posicionaNodoPadre(const textoNodo: string): TTMSFNCTreeViewNode;
    function CategoriaNombreToCodigo(const ANombre: string): string;
  public
    procedure cargaSubcategoriasDB;
    procedure cargaDBs;
    procedure cargaSubcategoriaDisponibles(const codBase: string);
  end;

var
  frmImportarSubCategorias: TfrmImportarSubCategorias;

implementation

{$R *.fmx}

uses
  uMain, DM1;

function TfrmImportarSubCategorias.CategoriaNombreToCodigo(const ANombre: string): string;
var
  L: string;
begin
  L := LowerCase(Trim(ANombre));
  if L = 'equipos y herramientas' then Result := '1'
  else if L = 'materiales' then Result := '2'
  else if L = 'transporte' then Result := '3'
  else if L = 'mano de obra' then Result := '4'
  else if L = 'seguridad industrial' then Result := '5'
  else if L = 'precios unitarios' then Result := '6'
  else Result := '';
end;

procedure TfrmImportarSubCategorias.rct_1MouseDown(Sender: TObject; Button: TMouseButton; Shift: TShiftState; X, Y: Single);
begin
  Self.StartWindowDrag;
end;

procedure TfrmImportarSubCategorias.rct_CancelarClick(Sender: TObject);
begin
  ModalResult := mrCancel;
end;

procedure TfrmImportarSubCategorias.rct__AceptarClick(Sender: TObject);
begin
  guardaSubcategoriasAdicionadas;
  RefreshCategorias;
  ModalResult := mrOk;
end;

procedure TfrmImportarSubCategorias.chk_BasesPadresChange(Sender: TObject);
begin
  cargaDBs;
end;

procedure TfrmImportarSubCategorias.grid_basesDisponiblesCellClick(Sender: TObject; ACol, ARow: Integer);
begin
  if ARow > 0 then
    cargaSubcategoriaDisponibles(grid_basesDisponibles.Cells[1, ARow]);
end;

procedure TfrmImportarSubCategorias.MenuItem3Click(Sender: TObject);
begin
  addSeleccion;
end;

procedure TfrmImportarSubCategorias.TreeView_SubDisponiblesDblClick(Sender: TObject);
begin
  addCategoria;
end;

procedure TfrmImportarSubCategorias.TreeView_SubDisponiblesAfterCheckNode(Sender: TObject; ANode: TTMSFNCTreeViewVirtualNode; AColumn: Integer);
begin
end;

procedure TfrmImportarSubCategorias.TreeView_SubDisponiblesAfterUnCheckNode(Sender: TObject; ANode: TTMSFNCTreeViewVirtualNode; AColumn: Integer);
begin
end;

procedure TfrmImportarSubCategorias.cargaSubcategoriasDB;
begin
  TreeView_SubCategorias.ClearNodes;
end;

procedure TfrmImportarSubCategorias.cargaSubcategoriaDisponibles(const codBase: string);
begin
end;

procedure TfrmImportarSubCategorias.cargaDBs;
begin
end;

procedure TfrmImportarSubCategorias.guardaSubcategoriasAdicionadas;
begin
end;

procedure TfrmImportarSubCategorias.addCategoria;
begin
end;

procedure TfrmImportarSubCategorias.addSeleccion;
begin
end;

function TfrmImportarSubCategorias.encuentraCategoria(const textCategoria: string): Boolean;
begin
  Result := False;
end;

function TfrmImportarSubCategorias.posicionaNodoPadre(const textoNodo: string): TTMSFNCTreeViewNode;
begin
  Result := nil;
end;

end.
