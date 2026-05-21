unit uNuevaCategoria;

interface

uses
  System.SysUtils, System.Types, System.UITypes, System.Classes,
  System.Variants, System.StrUtils,
  FMX.Types, FMX.Controls, FMX.Forms, FMX.Graphics, FMX.Dialogs, FMX.Memo.Types,
  FMX.Effects,
  FMX.ScrollBox, FMX.Memo, FMX.StdCtrls, FMX.ListBox, FMX.Ani,
  FMX.TMSTreeViewBase,
  FMX.TMSTreeViewData, FMX.TMSCustomTreeView, FMX.TMSTreeView, FMX.Edit,
  FMX.Layouts, FMX.Objects,
  FMX.Controls.Presentation, Uni, FMX.TMSFNCTreeViewBase,
  FMX.TMSFNCTreeViewData,
  FMX.TMSFNCCustomTreeView,
  FMX.TMSFNCTreeView;

type
  {
    Formulario para crear / editar / clonar categorías de recursos.

    lbl_funcion.Text controla el modo:
    - 'Adicionar' → crea categoría nueva.
    - 'Editar'    → edita la categoría indicada en lbl_Codigo.
    - 'Clonar'    → crea una nueva categoría a partir de los datos mostrados.

    lbl_Categoria.Text indica el tipo de categoría (1..6).
    lbl_Codigo.Text codifica categoria_base + CIU, p.ej. '1001', '4005', etc.
  }

  TfrmNuevaCategoria = class(TForm)
    lyt_Background: TLayout;
    lyt_Body: TLayout;
    rect_2: TRectangle;
    lyt_3: TLayout;
    rect_3: TRectangle;
    lyt_6: TLayout;
    rect_4: TRectangle;
    lyt_Adicionales: TLayout;
    lyt_7: TLayout;
    lbl_banner2: TLabel;
    lyt_footer: TLayout;
    rect_Cancelar: TRectangle;
    iGlow_Cancelar: TInnerGlowEffect;
    rect_Aceptar: TRectangle;
    iGlow_Aceptar: TInnerGlowEffect;
    lbl_Categoria: TLabel;
    lbl_funcion: TLabel;
    lbl_Codigo: TLabel;
    lyt_header: TLayout;
    rect_1: TRectangle;
    lbl_banner1: TLabel;
    mmo_Observaciones: TMemo;
    Shadow_Observaciones: TShadowEffect;
    lyt3: TLayout;
    lbl_4: TLabel;
    rect_5: TRectangle;
    Shadow_Descripcion: TShadowEffect;
    edt_Descripcion: TEdit;
    lyt4: TLayout;
    lbl_8: TLabel;
    Layout1: TLayout;
    Label1: TLabel;
    Rectangle1: TRectangle;
    Shadow_codAdicional: TShadowEffect;
    edt_codAdicional: TEdit;

    procedure edt_DescripcionMouseEnter(Sender: TObject);
    procedure edt_DescripcionMouseLeave(Sender: TObject);
    procedure mmo_ObservacionesMouseLeave(Sender: TObject);
    procedure mmo_ObservacionesMouseEnter(Sender: TObject);

    procedure rect_CancelarMouseEnter(Sender: TObject);
    procedure rect_CancelarMouseLeave(Sender: TObject);
    procedure rect_CancelarMouseUp(Sender: TObject; Button: TMouseButton;
      Shift: TShiftState; X, Y: Single);

    procedure rect_AceptarMouseEnter(Sender: TObject);
    procedure rect_AceptarMouseLeave(Sender: TObject);

    procedure rect_1MouseDown(Sender: TObject; Button: TMouseButton;
      Shift: TShiftState; X, Y: Single);
    procedure rect_AceptarClick(Sender: TObject);
    procedure edt_codAdicionalMouseEnter(Sender: TObject);
    procedure edt_codAdicionalMouseLeave(Sender: TObject);

  private
    { Private declarations }

  public
    { Public declarations }
    mostrarMensajes: integer;
    // Devuelve el siguiente código CIU (3 dígitos) para una categoría_base dada.
    function DaSiguienteCodigo(modo: integer): string;

    // Inserta una nueva categoría:
    // - Genera código CIU.
    // - Añade el nodo al treeview correspondiente.
    // - Llama a GuardaCategoria para persistirla.
    procedure AdicionarCategoria;

    // Actualiza en BD la categoría indicada por codigocategoria (categoria_base+CIU).
    procedure EditaCategoria(const codigocategoria: string);

  end;

var
  frmNuevaCategoria: TfrmNuevaCategoria;

implementation

{$R *.fmx}

uses
  DM1, uMain;

{ ---------------------------------------------------------------------------- }
{ CÁLCULO DE SIGUIENTE CÓDIGO CIU }
{ ---------------------------------------------------------------------------- }

function TfrmNuevaCategoria.DaSiguienteCodigo(modo: integer): string;
var
  qry: TUniQuery;
  valorCiu: integer;
begin
  Result := '001'; // valor por defecto si no existía ninguna categoría

  qry := TUniQuery.Create(nil);
  try
    qry.Connection := DModule_1.con2;
    qry.Close;
    qry.SQL.Clear;

    // Más eficiente y robusto: obtenemos el MAX(ciu) en lugar de hacer SELECT *
    qry.SQL.Add('select max(ciu) as MaxCiu ' + 'from categoriaapus ' +
      'where categoria_base = :categoria_base ' + '  and codBase = :codBase');

    qry.ParamByName('categoria_base').AsInteger := modo;
    qry.ParamByName('codBase').AsString := base_activa.codBase;

    qry.Open; // Consulta SELECT -> Open

    if not qry.FieldByName('MaxCiu').IsNull then
      valorCiu := qry.FieldByName('MaxCiu').AsInteger + 1
    else
      valorCiu := 1;

    // Formateamos a 3 dígitos (001, 010, 123, ...)
    if valorCiu < 1 then
      valorCiu := 1;

    Result := Format('%.3d', [valorCiu]);
  finally
    qry.Free;
  end;
end;

{ ---------------------------------------------------------------------------- }
{ EDICIÓN DE CATEGORÍA EXISTENTE }
{ ---------------------------------------------------------------------------- }

procedure TfrmNuevaCategoria.EditaCategoria(const codigocategoria: string);
var
  qry: TUniQuery;
  Categoria_base: integer;
  ciu: integer;
  tmpstr: string;
begin
  // Esperamos un código del tipo '1001', '4005', etc. (1 dígito base + 3 dígitos CIU)
  if Length(codigocategoria) < 4 then
  begin
    ShowMessage('Código de categoría inválido.');
    Exit;
  end;

  tmpstr := LeftStr(codigocategoria, 1);
  Categoria_base := StrToIntDef(tmpstr, -1);

  tmpstr := RightStr(codigocategoria, 3);
  ciu := StrToIntDef(tmpstr, -1);

  if (Categoria_base < 0) or (ciu < 0) then
  begin
    ShowMessage('Código de categoría inválido.');
    Exit;
  end;

  qry := TUniQuery.Create(nil);
  try
    qry.Connection := DModule_1.con2;
    qry.Close;
    qry.SQL.Clear;

    // Añadimos también codBase al WHERE para no tocar categorías de otras bases
    { (* }
    qry.SQL.Add('update categoriaApus ' + 'set descripcion = :descripcion, ' +
      '    codExterno  = :codExterno, ' + '    Comentarios = :Comentarios ' +
      'where categoria_base = :categoria_base ' + '  and ciu = :ciu ' +
      '  and codBase = :codBase');
    { *) }
    qry.ParamByName('descripcion').AsString := edt_Descripcion.Text;
    qry.ParamByName('codExterno').AsString := edt_codAdicional.Text;
    qry.ParamByName('comentarios').AsString := mmo_Observaciones.Lines.Text;
    qry.ParamByName('categoria_base').AsInteger := Categoria_base;
    qry.ParamByName('ciu').AsInteger := ciu;
    qry.ParamByName('codBase').AsString := base_activa.codBase;
    qry.ExecSQL;
  finally
    qry.Free;
  end;
end;

{ ---------------------------------------------------------------------------- }
{ ADICIÓN (Y CLONADO) DE CATEGORÍA NUEVA }
{ ---------------------------------------------------------------------------- }

procedure TfrmNuevaCategoria.AdicionarCategoria;
var
  subn: TTMSFNCTreeViewNode;
  datos: item_twvr;
  modo: integer;

  // Helper local para obtener el nodo raíz del treeview deseado

  function GetRootNode(ATree: TTMSFNCTreeView): TTMSFNCTreeViewNode;
  begin
    Result := nil;
    if Assigned(ATree) and (ATree.Nodes.Count > 0) then
      Result := ATree.Nodes[0];
  end;

begin
  // modo = tipo de categoría (1..6) según lbl_Categoria.Text
  modo := StrToIntDef(lbl_Categoria.Text, 0);
  if (modo < 1) or (modo > 6) then
  begin
    if mostrarMensajes <> 1 then
      ShowMessage('Tipo de categoría no válido.');
    Exit;
  end;

  // Rellenamos estructura de datos para el treeview y la BD
  datos.descripcion := edt_Descripcion.Text;
  datos.codExt := edt_codAdicional.Text;
  datos.comentarios := mmo_Observaciones.Text;
  datos.codUnico := generaCodigoUnico;
  datos.accion := 'nuevo';
  datos.codigo := DaSiguienteCodigo(modo); // CIU siguiente
  datos.Categoria := IntToStr(modo); // Categoria_base

  // No permitir duplicados por descripción en la misma categoría_base
  if categoriaExistente(IntToStr(modo), edt_Descripcion.Text) then
  begin
    if mostrarMensajes <> 1 then
      MuestraMensajeGiproy('Advertencia', 'Categoría ya creada.');
    Exit;
  end;

  // Añadimos al árbol correspondiente según el tipo de categoría
  case modo of
    1:
      begin
        subn := GetRootNode(frmMain.trvw_cat1EquiposHerramientas);
        if Assigned(subn) then
          addItemTrvw(frmMain.trvw_cat1EquiposHerramientas, subn, datos);
      end;
    2:
      begin
        subn := GetRootNode(frmMain.trvw_cat2Materiales);
        if Assigned(subn) then
          addItemTrvw(frmMain.trvw_cat2Materiales, subn, datos);
      end;
    3:
      begin
        subn := GetRootNode(frmMain.trvw_cat3Transporte);
        if Assigned(subn) then
          addItemTrvw(frmMain.trvw_cat3Transporte, subn, datos);
      end;
    4:
      begin
        subn := GetRootNode(frmMain.trvw_cat4ManodeObra);
        if Assigned(subn) then
          addItemTrvw(frmMain.trvw_cat4ManodeObra, subn, datos);
      end;
    5:
      begin
        subn := GetRootNode(frmMain.trvw_cat5SeguridadIndustrial);
        if Assigned(subn) then
          addItemTrvw(frmMain.trvw_cat5SeguridadIndustrial, subn, datos);
      end;
    6:
      begin
        subn := GetRootNode(frmMain.trvw_cat6PreciosUnitarios);
        if Assigned(subn) then
          addItemTrvw(frmMain.trvw_cat6PreciosUnitarios, subn, datos);
      end;
  end;

  // Persistimos la categoría en BD
  GuardaCategoria(datos, 'Usuario');
end;

{ ---------------------------------------------------------------------------- }
{ EFECTOS VISUALES DE ENTRADA / SALIDA DE CONTROLES }
{ ---------------------------------------------------------------------------- }

procedure TfrmNuevaCategoria.edt_codAdicionalMouseEnter(Sender: TObject);
begin
  Self.Shadow_codAdicional.Enabled := True;
end;

procedure TfrmNuevaCategoria.edt_codAdicionalMouseLeave(Sender: TObject);
begin
  Self.Shadow_codAdicional.Enabled := False;
end;

procedure TfrmNuevaCategoria.edt_DescripcionMouseEnter(Sender: TObject);
begin
  Self.Shadow_Descripcion.Enabled := True;
end;

procedure TfrmNuevaCategoria.edt_DescripcionMouseLeave(Sender: TObject);
begin
  Self.Shadow_Descripcion.Enabled := False;
end;

procedure TfrmNuevaCategoria.mmo_ObservacionesMouseEnter(Sender: TObject);
begin
  Self.Shadow_Observaciones.Enabled := True;
end;

procedure TfrmNuevaCategoria.mmo_ObservacionesMouseLeave(Sender: TObject);
begin
  Self.Shadow_Observaciones.Enabled := False;
end;

{ ---------------------------------------------------------------------------- }
{ INTERFAZ: ARRASTRE Y BOTONES }
{ ---------------------------------------------------------------------------- }

procedure TfrmNuevaCategoria.rect_1MouseDown(Sender: TObject;
  Button: TMouseButton; Shift: TShiftState; X, Y: Single);
begin
  // Permite arrastrar la ventana desde la barra superior
  Self.StartWindowDrag;
end;

procedure TfrmNuevaCategoria.rect_AceptarClick(Sender: TObject);
var
  codigo: string;
begin
  iGlow_Aceptar.Enabled := False;

  // Opcional: validación básica
  if edt_Descripcion.Text.Trim = '' then
  begin
    ShowMessage('Debe indicar una descripción para la categoría.');
    Exit;
  end;

  if SameText(lbl_funcion.Text, 'Adicionar') then
  begin
    AdicionarCategoria;
  end
  else if SameText(lbl_funcion.Text, 'Editar') then
  begin
    codigo := lbl_Codigo.Text;
    EditaCategoria(codigo);
  end
  else if SameText(lbl_funcion.Text, 'Clonar') then
  begin
    // Clonar equivale a crear una nueva categoría con estos datos
    AdicionarCategoria;
  end;
  ModalResult := mrOk;
end;

procedure TfrmNuevaCategoria.rect_AceptarMouseEnter(Sender: TObject);
begin
  Self.iGlow_Aceptar.Enabled := True;
end;

procedure TfrmNuevaCategoria.rect_AceptarMouseLeave(Sender: TObject);
begin
  Self.iGlow_Aceptar.Enabled := False;
end;

procedure TfrmNuevaCategoria.rect_CancelarMouseEnter(Sender: TObject);
begin
  Self.iGlow_Cancelar.Enabled := True;
end;

procedure TfrmNuevaCategoria.rect_CancelarMouseLeave(Sender: TObject);
begin
  Self.iGlow_Cancelar.Enabled := False;
end;

procedure TfrmNuevaCategoria.rect_CancelarMouseUp(Sender: TObject;
  Button: TMouseButton; Shift: TShiftState; X, Y: Single);
begin
  Self.iGlow_Cancelar.Enabled := False;
  ModalResult := mrCancel;
end;

{
  Botón Aceptar:
  - 'Adicionar' → crea una nueva categoría.
  - 'Editar'    → actualiza la categoría actual.
  - 'Clonar'    → crea una nueva categoría con los datos actuales.
}
end.
