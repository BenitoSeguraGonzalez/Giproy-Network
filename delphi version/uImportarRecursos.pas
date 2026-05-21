unit uImportarRecursos;

interface

uses
  System.SysUtils, System.Types, System.UITypes, System.Classes, System.Variants,
  FMX.DialogService, FMX.Types, FMX.Controls, FMX.Forms, FMX.Graphics, FMX.Dialogs,
  FMX.TMSFNCTypes, system.JSON, FMX.TMSFNCUtils, FMX.TMSFNCGraphics,
  FMX.TMSFNCGraphicsTypes, FMX.TMSFNCGridCell, FMX.TMSFNCGridOptions, FMX.Menus,
  FMX.Effects, FMX.StdCtrls, FMX.TMSFNCCheckedTreeView, FMX.Controls.Presentation,
  FMX.TMSFNCCustomScrollControl, FMX.TMSFNCGridData, FMX.Platform, FMX.TMSFNCCustomGrid,
  FMX.TMSFNCGrid, FMX.TMSFNCPanel, FMX.TMSFNCSplitter, FMX.TMSFNCCustomControl,
  FMX.TMSFNCTreeViewBase, FMX.TMSFNCTreeViewData, Uni, FMX.TMSFNCCustomTreeView,
  FMX.TMSFNCTreeView, FMX.Objects, FMX.Layouts, FMX.TMSFNCCustomPicker, FMX.TMSFNCComboBox,
  FMX.TMSFNCListBox, FMX.ListBox;

type
  dat_TDBs = record
    codBase: string;
    nombre: string;
  end;

type
  TfrmImportarRecursos = class(TForm)
    lyt_Background: TLayout;
    lyt_Body: TLayout;
    rct__2: TRectangle;
    lyt_3: TLayout;
    rct__3: TRectangle;
    lyt_6: TLayout;
    rct_BackgroundGris: TRectangle;
    lyt_subcategorias: TLayout;
    TreeView_SubCategorias: TTMSFNCTreeView;
    tmsfncspltr1: TTMSFNCSplitter;
    lyt_BasesDisponibles: TLayout;
    lyt2: TLayout;
    pnl_1: TTMSFNCPanel;
    chk_BasesPadres: TCheckBox;
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
    pmSubcategorias: TPopupMenu;
    MenuItem1: TMenuItem;
    lyt1: TLayout;
    lyt3: TLayout;
    tmsfncspltr2: TTMSFNCSplitter;
    lyt4: TLayout;
    TreeView_SubCategoriaImportar: TTMSFNCTreeView;
    cbb_BasesDisponibles: TComboBox;
    pnl_2: TTMSFNCPanel;
    grid_RecursosImportar: TTMSFNCGrid;
    lyt5: TLayout;
    procedure rct_1MouseDown(Sender: TObject; Button: TMouseButton; Shift: TShiftState; X, Y: Single);
    procedure rct__AceptarClick(Sender: TObject);
    procedure rct_CancelarClick(Sender: TObject);
    procedure cbb_BasesDisponiblesChange(Sender: TObject);
    procedure TreeView_SubCategoriaImportarNodeClick(Sender: TObject; ANode: TTMSFNCTreeViewVirtualNode);
    procedure TreeView_SubCategoriasDragOver(Sender: TObject; const Data: TDragObject;
      const Point: TPointF; var Operation: TDragOperation);
    procedure grid_RecursosImportarMouseMove(Sender: TObject; Shift: TShiftState; X, Y: Single);
    procedure grid_RecursosImportarMouseDown(Sender: TObject; Button: TMouseButton; Shift:
      TShiftState; X, Y: Single);
    procedure grid_RecursosImportarMouseUp(Sender: TObject; Button: TMouseButton; Shift:
      TShiftState; X, Y: Single);
    procedure TreeView_SubCategoriasMouseUp(Sender: TObject; Button: TMouseButton; Shift:
      TShiftState; X, Y: Single);
    procedure TreeView_SubCategoriasDragDrop(Sender: TObject; const Data: TDragObject; const Point: TPointF);
    procedure grid_RecursosImportarMouseEnter(Sender: TObject);
    procedure TreeView_SubCategoriasNodeClick(Sender: TObject; ANode: TTMSFNCTreeViewVirtualNode);
  private
    { Private declarations }
    codBaseImportar: string;
    codCategoriaImportar: string;
    listadoBasesImportar: array of dat_TDBs;
    cOrigenDrag: string;
    procedure MuestrasCategoriasDBImportar(posicionBase: Integer);
    procedure SeleccionarRecursosCategoriaImportar(nodo: TTMSFNCTreeViewNode);
    procedure muestraRecursosaImportar(codCategoria: string);
    procedure cargarRecursosSubCategorias();
    procedure completaRecursosNodo(nodo: TTMSFNCTreeViewNode);
    function daCodCategoriaPadre(descripcion: string): string;
    function daSubCategoriaInicial(nodo: TTMSFNCTreeViewVirtualNode): string;
    function compruebaRecursoRepetido(nodoPadre: TTMSFNCTreeViewNode; categoriaBusqueda,
      descripcionRecurso, unidadRecurso: string): TTMSFNCTreeViewNode;
  public
    { Public declarations }
    procedure cargaSubcategoriasDB();
    procedure cargaDBs();
  end;

var
  frmImportarRecursos: TfrmImportarRecursos;

implementation

{$R *.fmx}

uses
  DM1, uMain;

procedure TfrmImportarRecursos.cargaDBs;
var
  qry: TUniQuery;
  x: integer;
  totalWidth: Double;
  tmpstr: string;
begin
  SetLength(listadoBasesImportar, 0);
  cbb_BasesDisponibles.clear;
  x := 0;
  qry := TUniQuery.Create(nil);
  try
    with qry do
    begin
      Connection := DModule_1.con2;
      Close;
      sql.Clear;
      sql.Add('select * from bases where codBase <> ' + QuotedStr(base_activa.codBase));
      if not chk_BasesPadres.IsChecked then
      begin
        sql.Add(' and presupuestoAsignado is null');
      end;
      SQL.Add(' order by fechahoramodificacion desc');
      Prepare;
      ExecSQL;
      x := 1;
      while not Eof do
      begin
        tmpstr := FieldByName('nombre').AsString;
        SetLength(listadoBasesImportar, x + 1);
        listadoBasesImportar[x].codBase := FieldByName('codBase').AsString;
        listadoBasesImportar[x].nombre := FieldByName('codBase').AsString;
        cbb_BasesDisponibles.Items.Add(tmpstr);
        inc(x);
        Next;
      end;
    end;
  finally
    qry.Free;
    cbb_BasesDisponibles.ItemIndex := 0;
    cbb_BasesDisponibles.Repaint;
    TreeView_SubCategoriaImportar.ClearNodes;
    MuestrasCategoriasDBImportar(cbb_BasesDisponibles.ItemIndex);
  end;
end;

procedure TfrmImportarRecursos.cargaSubcategoriasDB;
var
  nodobase, nodo: TTMSFNCTreeViewNode;
  qry: TUniQuery;
  x: integer;
  tmpstr: string;
begin
  TreeView_SubCategorias.ClearNodes;

  nodo := TreeView_SubCategorias.Nodes.Add;
  nodo.Extended := True;
  nodo.Text[0] := 'Equipos y Herramientas';

  nodo := TreeView_SubCategorias.Nodes.Add;
  nodo.Extended := True;
  nodo.Text[0] := 'Materiales';

  nodo := TreeView_SubCategorias.Nodes.Add;
  nodo.Extended := true;
  nodo.Text[0] := 'Transporte';

  nodo := TreeView_SubCategorias.Nodes.Add;
  nodo.Extended := true;
  nodo.Text[0] := 'Mano de Obra';

  nodo := TreeView_SubCategorias.Nodes.Add;
  nodo.Extended := true;
  nodo.Text[0] := 'Seguridad Industrial';

  nodo := TreeView_SubCategorias.Nodes.Add;
  nodo.Extended := true;
  nodo.Text[0] := 'Precios Unitarios';

  qry := TUniQuery.Create(nil);
  try
    with qry do
    begin
      Connection := DModule_1.con2;
      Close;
      sql.Clear;
      sql.Add('select * from categoriaapus where codBase=' + QuotedStr(base_activa.codBase)
        + ' and categoria_base=:categoria_base');
      Prepare;
      for x := 0 to 5 do
      begin
        nodobase := TreeView_SubCategorias.Nodes[x];
        tmpstr := nodobase.Text[0];
        ParamByName('categoria_base').AsInteger := x + 1;
        ExecSQL;
        while not Eof do
        begin
          nodo := TreeView_SubCategorias.AddNode(nodobase);
          nodo.Text[0] := FieldByName('descripcion').AsString;
          nodo.Text[1] := FieldByName('ciu').AsString;
          Next;
        end;
      end;
    end;
  finally
    qry.Free;
    TreeView_SubCategorias.Columns[1].Width := 0;
    TreeView_SubCategorias.Columns[2].Width := 0;
    TreeView_SubCategorias.Columns[3].Width := 0;
    TreeView_SubCategorias.Columns[4].Width := 0;
    TreeView_SubCategorias.Columns[5].Width := 0;
    TreeView_SubCategorias.Columns[6].Width := 0;
    TreeView_SubCategorias.AutoSizeColumn(0);
    cargarRecursosSubCategorias();
  end;
end;

procedure TfrmImportarRecursos.cargarRecursosSubCategorias();
var
  nodobase, nodo: TTMSFNCTreeViewNode;
begin
  nodobase := TreeView_SubCategorias.Nodes[0];
  while Assigned(nodobase) do
  begin
    nodo := TreeView_SubCategorias.GetFirstChildNode(nodobase);
    if Assigned(nodo) then   {Primer Elemento}
    begin
      completaRecursosNodo(nodo);
      nodo := TreeView_SubCategorias.GetNextSiblingNode(nodo);
    end;
    while Assigned(nodo) do  {Resto de Elementos}
    begin
      completaRecursosNodo(nodo);
      nodo := TreeView_SubCategorias.GetNextSiblingNode(nodo);
    end;
    nodobase := TreeView_SubCategorias.GetNextSiblingNode(nodobase);
  end;
end;

procedure TfrmImportarRecursos.completaRecursosNodo(nodo: TTMSFNCTreeViewNode);
var
  qry: TUniQuery;
  ciu: string;
  nodoNuevo: TTMSFNCTreeViewNode;
begin
  qry := TUniQuery.Create(nil);
  try
    with qry do
    begin
      ciu := nodo.Text[1];
      Connection := DModule_1.con2;
      close;
      sql.Clear;
      sql.Add('select * from recursos where codBase=' + QuotedStr(base_activa.codBase) +
        ' and codCategoriaBase=' + QuotedStr(ciu));
      Prepare;
      ExecSQL;
      while not Eof do
      begin
        nodoNuevo := TreeView_SubCategorias.AddNode(nodo);
        nodoNuevo.Text[0] := FieldByName('Descripcion').AsString;
        nodoNuevo.Text[1] := FieldByName('idUnico').AsString;
        nodoNuevo.Text[2] := FieldByName('unidad').AsString;
        nodoNuevo.Text[3] := FieldByName('precio').AsString;
        Next;
      end;
    end;
  finally
    qry.Free;
    TreeView_SubCategorias.AutoSizeColumn(0);
    TreeView_SubCategorias.Columns[1].Width := 0;
    TreeView_SubCategorias.Columns[2].Width := 0;
    TreeView_SubCategorias.Columns[3].Width := 0;
    TreeView_SubCategorias.Columns[4].Width := 0;
  end;
end;

procedure TfrmImportarRecursos.cbb_BasesDisponiblesChange(Sender: TObject);
begin
  MuestrasCategoriasDBImportar(cbb_BasesDisponibles.ItemIndex);
end;

function TfrmImportarRecursos.daCodCategoriaPadre(descripcion: string): string;
begin
  if LowerCase(descripcion) = 'equipos y herramientas' then
  begin
    Result := '1';
  end;
  if LowerCase(descripcion) = 'materiales' then
  begin
    Result := '2'
  end;
  if LowerCase(descripcion) = 'transporte' then
  begin
    Result := '3';
  end;
  if LowerCase(descripcion) = 'mano de obra' then
  begin
    Result := '4';
  end;
  if LowerCase(descripcion) = 'seguridad industrial' then
  begin
    Result := '5';
  end;
  if LowerCase(descripcion) = 'precios unitarios' then
  begin
    Result := '6';
  end;
end;

procedure TfrmImportarRecursos.grid_RecursosImportarMouseDown(Sender: TObject; Button:
  TMouseButton; Shift: TShiftState; X, Y: Single);
begin
  if Button = TMouseButton.mbLeft then
    FMouseDown := true;
end;

procedure TfrmImportarRecursos.grid_RecursosImportarMouseEnter(Sender: TObject);
begin
  FMouseDown := False;
end;

procedure TfrmImportarRecursos.grid_RecursosImportarMouseMove(Sender: TObject; Shift:
  TShiftState; X, Y: Single);
var
  ddService: IFMXDragDropService;
  d: TDragObject;
  JSON_mensaje: TJSONObject;
  Amensaje: TJSONArray;
  obj_mensaje: TJSONObject;
  posicion: Integer;
  imagen: TImage;
  subCategoriaOrigen: string;
  nodoTrabajo: TTMSFNCTreeViewNode;
begin
  posicion := grid_RecursosImportar.Selection.StartRow;
  if TPlatformServices.Current.SupportsPlatformService(IFMXDragDropService) then
  begin
    if (FMouseDown) and (posicion > 0) then
    begin
      JSON_mensaje := TJSONObject.Create;
      Amensaje := TJSONArray.Create;
      JSON_mensaje.AddPair(TJSONPair.Create('CambioRecurso', Amensaje));
      obj_mensaje := TJSONObject.Create;
      obj_mensaje.AddPair(TJSONPair.Create('codUnicoRecurso', grid_RecursosImportar.cells[5, posicion]));
      obj_mensaje.AddPair(TJSONPair.Create('descripcion', grid_RecursosImportar.Cells[1, posicion]));
      obj_mensaje.AddPair(TJSONPair.Create('unidad', grid_RecursosImportar.Cells[2, posicion]));
      obj_mensaje.AddPair(TJSONPair.Create('precio', grid_RecursosImportar.Cells[3, posicion]));
      obj_mensaje.AddPair(TJSONPair.Create('codCPC', grid_RecursosImportar.Cells[4, posicion]));
      obj_mensaje.AddPair(TJSONPair.Create('especificaciones', grid_RecursosImportar.Cells[6, posicion]));
      subCategoriaOrigen := TreeView_SubCategoriaImportar.SelectedNode.Text[0];
      nodoTrabajo := TreeView_SubCategoriaImportar.SelectedNode.GetParent;
      if Assigned(nodoTrabajo) then
      begin
        subCategoriaOrigen := TreeView_SubCategoriaImportar.SelectedNode.GetParent.Text[0];
      end;
      obj_mensaje.AddPair(TJSONPair.Create('subcategoria', subCategoriaOrigen));
      Amensaje.Add(obj_mensaje);
      imagen := TImage.Create(nil);
      if Assigned(JSON_mensaje) and (TPlatformServices.Current.SupportsPlatformService(IFMXDragDropService,
        ddService)) then
      begin
        d.Source := JSON_mensaje;
        ddService.BeginDragDrop(Self, d, imagen.Bitmap);
      end;

    end;
  end;

end;

function TfrmImportarRecursos.daSubCategoriaInicial(nodo: TTMSFNCTreeViewVirtualNode): string;
var
  level: integer;
begin
  level := nodo.Level;
  while level > 0 do
  begin
    nodo := nodo.GetParent;
    level := nodo.Level;
  end;
  Result := nodo.text[0];
end;

procedure TfrmImportarRecursos.grid_RecursosImportarMouseUp(Sender: TObject; Button:
  TMouseButton; Shift: TShiftState; X, Y: Single);
begin
  FMouseDown := False;
end;

procedure TfrmImportarRecursos.muestraRecursosaImportar(codCategoria: string);
var
  qry: TUniQuery;
  x: integer;
  tmpstr: string;
begin
  grid_RecursosImportar.ClearNormalCells;
  grid_RecursosImportar.RowCount := 1;
  grid_RecursosImportar.Cells[1, 0] := 'Descripción';
  grid_RecursosImportar.cells[2, 0] := 'Unidad';
  grid_RecursosImportar.cells[3, 0] := 'Precio';
  grid_RecursosImportar.cells[4, 0] := 'Cod. CPC';
  qry := TUniQuery.Create(nil);
  try
    with qry do
    begin
      Connection := DModule_1.con2;
      close;
      sql.Clear;
      sql.Add('select * from recursos where codCategoriaBase=' + QuotedStr(codCategoria) +
        ' and codBase=' + QuotedStr(codBaseImportar));
      Prepare;
      ExecSQL;
      x := 1;
      while not Eof do
      begin
        grid_RecursosImportar.RowCount := x + 1;
        grid_RecursosImportar.Cells[1, x] := FieldByName('descripcion').AsString;
        grid_RecursosImportar.Cells[2, x] := FieldByName('unidad').AsString;
        tmpstr := FieldByName('precio').AsString;
        tmpstr := decimal_correcto(tmpstr);
        grid_RecursosImportar.Cells[3, x] := tmpstr;
        grid_RecursosImportar.Cells[4, x] := FieldByName('codCPC').AsString;
        grid_RecursosImportar.Cells[5, x] := FieldByName('idUnico').AsString;
        grid_RecursosImportar.Cells[6, x] := FieldByName('especificaciones').AsString;
        Next;
        Inc(x);
      end;
    end;
  finally
    qry.Free;
    x := 20;
    grid_RecursosImportar.AutoSizeColumn(2);
    grid_RecursosImportar.AutoSizeColumn(3);
    grid_RecursosImportar.AutoSizeColumn(4);
    grid_RecursosImportar.Columns[5].Width := 0;
    grid_RecursosImportar.Columns[6].Width := 0;
    x := x + Trunc(grid_RecursosImportar.Columns[2].Width);
    x := x + Trunc(grid_RecursosImportar.Columns[3].Width);
    x := x + Trunc(grid_RecursosImportar.Columns[4].Width);
    grid_RecursosImportar.Columns[1].Width := grid_RecursosImportar.Width - x - 30;
  end;
end;

procedure TfrmImportarRecursos.MuestrasCategoriasDBImportar(posicionBase: Integer);
var
  nodobase, nodo: TTMSFNCTreeViewNode;
  qry: TUniQuery;
  x: integer;
begin
  CodBaseImportar := listadoBasesImportar[posicionBase].codBase;
  TreeView_SubCategoriaImportar.ClearNodes;

  nodo := TreeView_SubCategoriaImportar.Nodes.Add;
  nodo.Extended := True;
  nodo.Text[0] := 'Equipos y Herramientas';

  nodo := TreeView_SubCategoriaImportar.Nodes.Add;
  nodo.Extended := True;
  nodo.Text[0] := 'Materiales';

  nodo := TreeView_SubCategoriaImportar.Nodes.Add;
  nodo.Extended := true;
  nodo.Text[0] := 'Transporte';

  nodo := TreeView_SubCategoriaImportar.Nodes.Add;
  nodo.Extended := true;
  nodo.Text[0] := 'Mano de Obra';

  nodo := TreeView_SubCategoriaImportar.Nodes.Add;
  nodo.Extended := true;
  nodo.Text[0] := 'Seguridad Industrial';

  nodo := TreeView_SubCategoriaImportar.Nodes.Add;
  nodo.Extended := true;
  nodo.Text[0] := 'Precios Unitarios';

  qry := TUniQuery.Create(nil);

  try
    with qry do
    begin
      Connection := DModule_1.con2;
      Close;
      sql.Clear;
      sql.Add('select * from categoriaapus where codBase=' + QuotedStr(listadoBasesImportar
        [cbb_BasesDisponibles.ItemIndex].codBase) + ' and categoria_base=:categoria_base');
      Prepare;
      for x := 0 to 5 do
      begin
        nodobase := TreeView_SubCategoriaImportar.Nodes[x];
        ParamByName('categoria_base').AsInteger := x + 1;
        ExecSQL;
        while not Eof do
        begin
          nodo := TreeView_SubCategoriaImportar.AddNode(nodobase);
          nodo.Text[0] := FieldByName('descripcion').AsString;
          Next;
        end;
      end;
    end;
  finally
    qry.Free;
    TreeView_SubCategoriaImportar.AutoSizeColumn(0);
  end;
end;

procedure TfrmImportarRecursos.rct_1MouseDown(Sender: TObject; Button: TMouseButton; Shift:
  TShiftState; X, Y: Single);
begin
  Self.StartWindowDrag;
end;

procedure TfrmImportarRecursos.rct_CancelarClick(Sender: TObject);
begin
  modalresult := mrCancel;
end;

procedure TfrmImportarRecursos.rct__AceptarClick(Sender: TObject);
begin
  modalresult := mrOk;
end;

procedure TfrmImportarRecursos.SeleccionarRecursosCategoriaImportar(nodo: TTMSFNCTreeViewNode);
var
  nodobase: TTMSFNCTreeViewNode;
  codCategoriaNodoPadre: string;
begin
  if Assigned(nodo) then
  begin
    nodobase := nodo.GetParent;
    codCategoriaNodoPadre := daCodCategoriaPadre(nodobase.Text[0]);
    muestraRecursosaImportar(codCategoriaNodoPadre);
  end;
end;

procedure TfrmImportarRecursos.TreeView_SubCategoriaImportarNodeClick(Sender: TObject;
  ANode: TTMSFNCTreeViewVirtualNode);
begin
  SeleccionarRecursosCategoriaImportar(ANode.Node);
end;

procedure TfrmImportarRecursos.TreeView_SubCategoriasDragDrop(Sender: TObject; const Data:
  TDragObject; const Point: TPointF);
var
  JSON_respuesta: TJSONObject;
  respuesta: TJSONArray;
  NodeDetails: TJSONObject;
  Details: TJSONString;
  nodo, nodoDestino: TTMSFNCTreeViewNode;
  tmpstr: string;
  codUnicoRecurso: string;
  descripcion: string;
  level: integer;
  unidad: string;
  precio: string;
  codCPC: string;
  especificaciones: string;
  SubcategoriaDestino: string;
  subcategoriaOrigen: string;
begin
  if TPlatformServices.Current.SupportsPlatformService(IFMXDragDropService) then
  begin
    JSON_respuesta := Data.Source as TJSONObject;
    try
      level := TreeView_SubCategorias.XYToNode(Point.X, Point.y, 0).level;
      if level > 0 then
      begin
        nodoDestino := TreeView_SubCategorias.XYToNode(Point.X, Point.y, 0).Node;

        if level > 1 then
        begin
          nodoDestino := nodoDestino.GetParent;
        end;
        if Assigned(nodoDestino) then
        begin
          respuesta := JSON_respuesta.GetValue('CambioRecurso') as TJSONArray;
          NodeDetails := respuesta.Get(0) as TJSONObject;
          Details := NodeDetails.Get('codUnicoRecurso').JsonValue as TJSONString;
          codUnicoRecurso := Details.AsString;
          Details := NodeDetails.Get('descripcion').JsonValue as TJSONString;
          descripcion := Details.AsString;
          Details := NodeDetails.Get('unidad').JsonValue as TJSONString;
          unidad := Details.AsString;
          Details := NodeDetails.Get('precio').JsonValue as TJSONString;
          precio := Details.AsString;
          Details := NodeDetails.Get('codCPC').JsonValue as TJSONString;
          codCPC := Details.AsString;
          Details := NodeDetails.Get('especificaciones').JsonValue as TJSONString;
          especificaciones := Details.AsString;
          Details := NodeDetails.Get('subcategoria').JsonValue as TJSONString;
          subcategoriaOrigen := Details.AsString.Trim;
          SubcategoriaDestino := daSubCategoriaInicial(TreeView_SubCategorias.XYToNode(Point.X, Point.y, 0));
          SubcategoriaDestino := Trim(SubcategoriaDestino);
          if subcategoriaOrigen = SubcategoriaDestino then
          begin
            nodo := compruebaRecursoRepetido(nodoDestino, SubcategoriaDestino, descripcion, unidad);
            if Assigned(nodo) then
            begin
              // Recurso ya existente
              TDialogService.PreferredMode := TDialogService.TPreferredMode.platform;
              TDialogService.MessageDialog('Recurso existente, ¿desea reemplazar los datos?'
                + #13 + 'P. Actual: ' + base_activa.simboloMoneda + PasarCadenaNDecimales(nodo.Text
                [3], 2) + base_activa.simboloMoneda + ' -> P. Nuevo: ' +
                PasarCadenaNDecimales(precio, 2), TMsgDlgType.mtConfirmation, [TMsgDlgBtn.mbYes,
                TMsgDlgBtn.mbNo], TMsgDlgBtn.mbNo, 0,
                procedure(const AResult: TModalResult)
                begin
                  case AResult of
                    mrYES:
                      begin
                        nodo.Text[3] := precio;
                        if codCPC <> '' then
                          nodo.Text[4] := codCPC;
                        if especificaciones <> '' then
                          nodo.Text[5] := especificaciones;
                        nodo.Text[6] := 'Actualizar';
                      end;
                  end;
                  TreeView_SubCategorias.AutoSizeColumn(0);
                  TreeView_SubCategorias.Columns[1].Width := 0;
                  TreeView_SubCategorias.Columns[2].Width := 0;
                  TreeView_SubCategorias.Columns[3].Width := 0;
                  TreeView_SubCategorias.Columns[4].Width := 0;
                  TreeView_SubCategorias.Columns[5].Width := 0;
                  TreeView_SubCategorias.Columns[6].Width := 0;
                end);
            end
            else
            begin
              // Recurso Nuevo
              nodo := TreeView_SubCategorias.AddNode(nodoDestino);
              nodo.Text[0] := descripcion;
              nodo.text[1] := codUnicoRecurso;
              nodo.Text[2] := unidad;
              nodo.Text[3] := precio;
              nodo.text[4] := codCPC;
              nodo.Text[5] := especificaciones;
              nodo.text[6] := 'Actualizar';
              TreeView_SubCategorias.AutoSizeColumn(0);
              TreeView_SubCategorias.Columns[1].Width := 0;
              TreeView_SubCategorias.Columns[2].Width := 0;
              TreeView_SubCategorias.Columns[3].Width := 0;
              TreeView_SubCategorias.Columns[4].Width := 0;
            end;
          end;
        end;
      end;
    finally
      JSON_respuesta.Free;
      FMouseDown := False;

    end;
  end;
end;

function TfrmImportarRecursos.compruebaRecursoRepetido(nodoPadre: TTMSFNCTreeViewNode;
  categoriaBusqueda, descripcionRecurso, unidadRecurso: string): TTMSFNCTreeViewNode;
var
  salir: Boolean;
begin
  Result := nil;
  while Assigned(nodoPadre) and (nodoPadre.Text[0] <> categoriaBusqueda) do
  begin
    nodoPadre := nodoPadre.GetParent;
  end;
  salir := false;
  while (not salir) and Assigned(nodoPadre) do
  begin
    if (nodoPadre.Text[0] = descripcionRecurso) and (nodoPadre.Text[2] = unidadRecurso) then
    begin
      salir := True;
      Result := nodoPadre;
    end;
    nodoPadre := nodoPadre.GetNext;
  end;
end;

procedure TfrmImportarRecursos.TreeView_SubCategoriasDragOver(Sender: TObject; const Data:
  TDragObject; const Point: TPointF; var Operation: TDragOperation);
begin
  if (Data.Source <> nil) and (Data.Source is TJSONObject) then
  begin
    Operation := TDragOperation.Link;
  end
  else
    Operation := TDragOperation.None;
end;

procedure TfrmImportarRecursos.TreeView_SubCategoriasMouseUp(Sender: TObject; Button:
  TMouseButton; Shift: TShiftState; X, Y: Single);
begin
  FMouseDown := False;
end;

procedure TfrmImportarRecursos.TreeView_SubCategoriasNodeClick(Sender: TObject; ANode:
  TTMSFNCTreeViewVirtualNode);
begin
  ShowMessage('Precio: ' + base_activa.simboloMoneda + PasarCadenaNDecimales(ANode.Text[3],
    2) + #13 + 'Cod CPC: ' + ANode.Text[4] + #13 + 'Especificaciones: ' + ANode.Text[5]);
end;

end.

