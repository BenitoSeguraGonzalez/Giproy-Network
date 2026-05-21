unit uImportarApus;

interface

uses
  System.SysUtils, System.Types, System.UITypes, System.Classes,
  System.Variants,
  System.StrUtils, FMX.Types, FMX.Controls, FMX.Forms, FMX.Graphics,
  FMX.Dialogs,
  Uni, FMX.TMSFNCTypes, FMX.TMSFNCUtils, FMX.TMSFNCGraphics,
  FMX.TMSFNCGraphicsTypes, FMX.Effects, FMX.StdCtrls,
  FMX.Controls.Presentation,
  FMX.ListBox, FMX.TMSFNCSplitter, FMX.TMSFNCTreeViewBase,
  FMX.TMSFNCTreeViewData,
  FMX.TMSFNCCustomTreeView, FMX.TMSFNCTreeView, FMX.TMSFNCCustomControl,
  FMX.TMSFNCPanel, FMX.Objects, FMX.Layouts, FMX.DialogService,
  System.JSON,
  FMX.Menus, FMX.TMSFNCCustomScrollControl, FMX.TMSFNCGridData,
  FMX.Platform,
  FMX.TMSFNCCustomGrid, FMX.TMSFNCGrid, FMX.TMSFNCCustomPicker,
  FMX.TMSFNCComboBox, FMX.TMSFNCListBox;

type
  dat_TDBs = record
    codBase: string;
    nombre: string;
    codPresupuesto: string;
    Revision: string;
  end;

type
  TfrmImportarApus = class(TForm)
    lyt_Background: TLayout;
    lyt_Body: TLayout;
    rct_2: TRectangle;
    lyt_3: TLayout;
    rct_3: TRectangle;
    lyt_6: TLayout;
    rct_BackgroundGris: TRectangle;
    lyt1: TLayout;
    lyt_Izquierda: TLayout;
    pnl_1: TTMSFNCPanel;
    TreeView_ApusActivas: TTMSFNCTreeView;
    tmsfncspltr1: TTMSFNCSplitter;
    lyt_Derecha: TLayout;
    pnl_2: TTMSFNCPanel;
    lyt_BasesDisponibles: TLayout;
    lyt_seleccionBase: TLayout;
    lyt5: TLayout;
    lyt4: TLayout;
    lyt_7: TLayout;
    lbl_banner2: TLabel;
    lyt_footer: TLayout;
    lbl_modo: TLabel;
    lbl_moneda_pais: TLabel;
    rect_Aceptar: TRectangle;
    iGlow_Aceptar: TInnerGlowEffect;
    rct_Cancelar: TRectangle;
    iGlow_Cancelar: TInnerGlowEffect;
    lyt_header: TLayout;
    rct_1: TRectangle;
    lbl_banner1: TLabel;
    TreeView_APusDisponibles: TTMSFNCTreeView;
    pm1: TPopupMenu;
    MenuItem1: TMenuItem;
    lyt_1: TLayout;
    rect_1: TRectangle;
    lbl_1: TLabel;
    lyt_2: TLayout;
    rect_2: TRectangle;
    lbl_2: TLabel;
    lbl_BaseSeleccionada: TLabel;
    lyt_4: TLayout;
    rect_3: TRectangle;
    lyt_5: TLayout;
    rect_4: TRectangle;
    chkBasesProyectos: TCheckBox;
    Trvw_AbrirBases: TTMSFNCTreeView;
    procedure rect_AceptarClick(Sender: TObject);
    procedure rct_1MouseDown(Sender: TObject; Button: TMouseButton;
      Shift: TShiftState; X, Y: Single);
    procedure rct_CancelarClick(Sender: TObject);
    procedure TreeView_APusDisponiblesDragOver(Sender: TObject;
      const Data: TDragObject; const Point: TPointF;
      var Operation: TDragOperation);
    procedure TreeView_APusDisponiblesMouseDown(Sender: TObject;
      Button: TMouseButton; Shift: TShiftState; X, Y: Single);
    procedure TreeView_APusDisponiblesMouseMove(Sender: TObject;
      Shift: TShiftState; X, Y: Single);
    procedure TreeView_ApusActivasDragOver(Sender: TObject;
      const Data: TDragObject; const Point: TPointF;
      var Operation: TDragOperation);
    procedure TreeView_ApusActivasDragDrop(Sender: TObject;
      const Data: TDragObject; const Point: TPointF);
    procedure TreeView_APusDisponiblesEnter(Sender: TObject);
    procedure FormShow(Sender: TObject);
    procedure TreeView_APusDisponiblesMouseUp(Sender: TObject;
      Button: TMouseButton; Shift: TShiftState; X, Y: Single);
    procedure MenuItem1Click(Sender: TObject);
    procedure TreeView_APusDisponiblesAfterCheckNode
      (Sender: TObject; ANode: TTMSFNCTreeViewVirtualNode;
      AColumn: Integer);
    procedure chkBasesProyectosChange(Sender: TObject);
    procedure rect_3Click(Sender: TObject);
    procedure Trvw_AbrirBasesNodeDblClick(Sender: TObject;
      ANode: TTMSFNCTreeViewVirtualNode);
  private
    { Private declarations }
    listadoBasesImportar: array of dat_TDBs;
    baseSeleccionadaImp: dat_TDBs;
    FMouseDown: Boolean;
    FFormReady: Boolean;

    procedure completaAPUSenCategorias();
    procedure CargaApusDisponibles(codBaseImportar: dat_TDBs);
    procedure completaApusenCategoriaDisponibles(codBaseImportar
      : dat_TDBs);
    procedure GuardayActualizaAPUS();
    function compruebaRecursoRepetido
      (nodoDestino: TTMSFNCTreeViewNode;
      categoriaBusqueda, descripcionRecurso, unidadRecurso: string)
      : TTMSFNCTreeViewNode;
    function daSubCategoriaInicial
      (nodo: TTMSFNCTreeViewVirtualNode): string;
  public
    { Public declarations }
    procedure cargaDBs;
    procedure cargaCategoriasyAPUS;

  end;

var
  frmImportarApus: TfrmImportarApus;

implementation

{$R *.fmx}

uses
  DM1;

// =================================
// Helpers
// =================================
function NewQuery: TUniQuery;
begin
  Result := TUniQuery.Create(nil);
  Result.Connection := DModule_1.con2;
end;

// =================================
// Helpers
// =================================


procedure TfrmImportarApus.GuardayActualizaAPUS;
var
  nodo, subnodo: TTMSFNCTreeViewNode;
  codBaseOrigen: string;
  codAPUOrigen: string;
  X: Integer;
  codApu, descripcion, unidad: string;
  precio: string;
  categoria: string;
  subcategoria: string;
begin
  X := 0;
  nodo := TreeView_ApusActivas.Nodes[0];
  SetLength(listadoAPUImportar, X);
  SetLength(listadoRecursosImportar, 0);
  while Assigned(nodo) do
  begin
    codBaseOrigen := nodo.Text[5];
    if codBaseOrigen <> '' then
    begin
      codAPUOrigen := nodo.Text[6];

      descripcion := nodo.Text[0];
      unidad := nodo.Text[1];
      precio := nodo.Text[2];
      precio := ReplaceStr(precio,
        base_activa.simboloMoneda, '');
      codApu := nodo.Text[4];
      subcategoria := nodo.GetParent.Text[3];
      categoria := nodo.GetParent.Text[4];
      SetLength(listadoAPUImportar, X + 1);
      listadoAPUImportar[X].codBaseOrigen := codBaseOrigen;
      listadoAPUImportar[X].codAPUOrigen := codAPUOrigen;
      listadoAPUImportar[X].descripcion := descripcion;
      listadoAPUImportar[X].unidad := unidad;
      listadoAPUImportar[X].precio := precio;
      listadoAPUImportar[X].codApu := codApu;
      listadoAPUImportar[X].codCategoriaApu := categoria;
      listadoAPUImportar[X].categoria :=
        nodo.GetParent.Text[0];
      listadoAPUImportar[X].codSubCategoriaAPU :=
        subcategoria;
      listadoAPUImportar[X].tipoImportacion := nodo.Text[7];
      listadoAPUImportar[X].fechaHoraActualizacion :=
        StrToFloat(nodo.Text[8]);
      listadoAPUImportar[X].codPresupuestoOrigen :=
        baseSeleccionadaImp.codPresupuesto;
      listadoAPUImportar[X].revisionOrigen :=
        baseSeleccionadaImp.Revision;

      Inc(X);
    end;
    nodo := nodo.GetNext;
  end;
  if Length(listadoAPUImportar) > 0 then
  begin
    generaListadoRecursosImportar();
  end;
end;

procedure TfrmImportarApus.completaApusenCategoriaDisponibles(codBaseImportar
  : dat_TDBs);
var
  nodo, subnodo: TTMSFNCTreeViewNode;
  qry: TUniQuery;
  codCategoriaApu: string;
  tmpstr: string;
  tieneItems: Boolean;
  sqlText: string;
  SQLtext2: string;
  datoControl: string;
begin
  nodo := TreeView_APusDisponibles.Nodes[0];
  qry := NewQuery;
  try
    with qry do
    begin
      while Assigned(nodo) do
      begin
        if nodo.Extended then
        begin
          codCategoriaApu := nodo.Text[3];
          if codCategoriaApu <> '' then
          begin
            Close;
            sql.Clear;
            if codBaseImportar.codPresupuesto = '' then
            begin
              sqlText :=
                'select * from APUS where codBase=:codBase and codCategoriaAPU=:codCategoriaAPU order by descripcion';
              sql.Add(sqlText);
            end
            else
            begin
              sqlText := 'SELECT' + #13#10 +
                '  apubase.Descripcion,' + #13#10 +
                '  apubase.Unidad,' + #13#10 + 'CASE' +
                #13#10 + '    ' + #13#10 + '    WHEN ('
                + #13#10 + '    SELECT' + #13#10 +
                '      apuTanteo.CostoDirectoTotal ' +
                #13#10 + '    FROM' + #13#10 +
                '      presupuestos_tanteo_apus apuTanteo '
                + #13#10 + '    WHERE' + #13#10 +
                '      apuTanteo.codBase = apuBase.codBase '
                + #13#10 +
                '      AND apuTanteo.codPresupuesto = :codPresupuesto '
                + #13#10 +
                '      AND apuTanteo.revision = :revision '
                + #13#10 +
                '      AND apuTanteo.CodAPU = apuBase.CodAPU '
                + #13#10 + '      ) IS NOT NULL THEN' +
                #13#10 + '      (' + #13#10 +
                '      SELECT' + #13#10 +
                '        apuTanteo.CostoDirectoTotal ' +
                #13#10 + '      FROM' + #13#10 +
                '        presupuestos_tanteo_apus apuTanteo '
                + #13#10 + '      WHERE' + #13#10 +
                '        apuTanteo.codBase = apuBase.codBase '
                + #13#10 +
                '        AND apuTanteo.codPresupuesto = :codPresupuesto '
                + #13#10 +
                '        AND apuTanteo.revision = :revision '
                + #13#10 +
                '        AND apuTanteo.CodAPU = apuBase.CodAPU '
                + #13#10 +
                '      ) ELSE apuBase.CostoDirectoTotal '
                + #13#10 + '    END CostoDirectoTotal,'
                + #13#10 + '  apuBase.CodAPU,' + #13#10
                + 'CASE' + #13#10 + '    ' + #13#10 +
                '    WHEN (' + #13#10 + '    SELECT' +
                #13#10 + '      aputanteo.ultimaModificacion '
                + #13#10 + '    FROM' + #13#10 +
                '      presupuestos_tanteo_apus apuTanteo '
                + #13#10 + '    WHERE' + #13#10 +
                '      apuTanteo.codBase = apuBase.codBase '
                + #13#10 +
                '      AND apuTanteo.codPresupuesto = :codPresupuesto '
                + #13#10 +
                '      AND apuTanteo.revision = :revision '
                + #13#10 +
                '      AND apuTanteo.CodAPU = apuBase.CodAPU '
                + #13#10 + '      ) IS NOT NULL THEN' +
                #13#10 + '      (' + #13#10 +
                '      SELECT' + #13#10 +
                '        aputanteo.ultimaModificacion '
                + #13#10 + '      FROM' + #13#10 +
                '        presupuestos_tanteo_apus apuTanteo '
                + #13#10 + '      WHERE' + #13#10 +
                '        apuTanteo.codBase = apuBase.codBase '
                + #13#10 +
                '        AND apuTanteo.codPresupuesto = :codPresupuesto '
                + #13#10 +
                '        AND apuTanteo.revision = :revision '
                + #13#10 +
                '        AND apuTanteo.CodAPU = apuBase.CodAPU '
                + #13#10 +
                '      ) ELSE apuBase.ultimaModificacion '
                + #13#10 +
                '    END fechaHoraModificacion, apuBase.codAPU '
                + #13#10 + 'FROM' + #13#10 +
                '  apus apuBase ' + #13#10 + 'WHERE' +
                #13#10 + '  CodBase = :codBase ' +
                #13#10 + '  AND codCategoriaAPU = :codCategoriaAPU '
                + #13#10 + 'ORDER BY' + #13#10 +
                '  Descripcion ASC';
              sql.Add(sqlText);
              ParamByName('codPresupuesto').AsString
                := codBaseImportar.codPresupuesto;
              ParamByName('revision').AsString :=
                codBaseImportar.Revision;
            end;

            ParamByName('codBase').AsString :=
              codBaseImportar.codBase;
            ParamByName('codCategoriaAPU').AsString
              := codCategoriaApu;
            prepare;
            ExecSQL;
            tieneItems := False;
            while not Eof do
            begin
              subnodo :=
                TreeView_APusDisponibles.AddNode(nodo);
              tieneItems := True;
              subnodo.Text[0] :=
                FieldByName('descripcion').AsString;
              tmpstr := FieldByName
                ('descripcion').AsString;
              if tmpstr = 'Acero de refuerzo' then
              begin
                datoControl :=
                  FieldByName('codAPU').AsString;
                tmpstr := tmpstr;
              end;
              subnodo.CheckTypes[0] := tvntCheckBox;
              subnodo.Text[1] :=
                FieldByName('unidad').AsString;
              tmpstr := FieldByName
                ('costodirectoTotal').AsString;
              subnodo.Text[2] :=
                base_activa.simboloMoneda + tmpstr;
              subnodo.Text[4] :=
                FieldByName('CodAPU').AsString;
              subnodo.Text[7] :=
                formatDateTime('dd/mm/yyyy hh:nn:ss',
                FieldByName('fechaHoraModificacion')
                .AsDateTime);
              Next;
            end;
          end;
        end;
        if not tieneItems then
          nodo.CheckTypes[0] := tvntNone;
        nodo := nodo.GetNextSibling;
      end;
    end;
  finally
    qry.Free;
    TreeView_APusDisponibles.AutoSizeColumn(0);
    TreeView_APusDisponibles.AutoSizeColumn(1);
    TreeView_APusDisponibles.AutoSizeColumn(2);
    TreeView_APusDisponibles.Columns[3].Width := 0;
    TreeView_APusDisponibles.Columns[4].Width := 0;
    TreeView_APusDisponibles.Columns[5].Width := 0;
    TreeView_APusDisponibles.Columns[6].Width := 0;
    TreeView_APusDisponibles.Columns[7].Width := 0;
  end;
end;

procedure TfrmImportarApus.CargaApusDisponibles(codBaseImportar: dat_TDBs);
var
  qry: TUniQuery;
  nodo: TTMSFNCTreeViewNode;
  tmpstr: string;
  X: Integer;
begin
  TreeView_APusDisponibles.ClearNodes;
  TreeView_APusDisponibles.Columns[0].Text := 'Descripción';
  TreeView_APusDisponibles.Columns[1].Text := 'Unidad';
  TreeView_APusDisponibles.Columns[2].Text := 'Costo D.';
  qry := NewQuery;
  try
    with qry do
    begin
      Close;
      sql.Clear;
      sql.Add('select * from categoriaapus where codBase=' +
        QuotedStr(codBaseImportar.codBase) +
        'and categoria_base=:categoria_base order by descripcion asc');
      prepare;
      ParamByName('categoria_base').AsString := IntToStr(6);
      ExecSQL;
      while not Eof do
      begin
        nodo := TreeView_APusDisponibles.AddNode();
        nodo.CheckTypes[0] := tvntCheckBox;
        tmpstr := FieldByName('descripcion').AsString;

        nodo.Text[0] := tmpstr;
        tmpstr := FieldByName('ciu').AsString;
        nodo.Text[3] := tmpstr;
        nodo.Extended := True;
        Next;
      end;
    end;
  finally
    qry.Free;
    completaApusenCategoriaDisponibles(codBaseImportar);
  end;
end;

procedure TfrmImportarApus.completaAPUSenCategorias();
var
  nodo, subnodo: TTMSFNCTreeViewNode;
  qry: TUniQuery;
  codCategoriaApu: string;
  tmpstr: string;
  X: Integer;
begin
  qry := NewQuery;
  try
    if TreeView_ApusActivas.Nodes.Count - 1 > 0 then
    begin
      nodo := TreeView_ApusActivas.Nodes[0];
      with qry do
      begin
        while Assigned(nodo) do
        begin
          codCategoriaApu := nodo.Text[3];
          Close;
          sql.Clear;
          sql.Add('select * from APUS where codBase='
            + QuotedStr(base_activa.codBase) +
            ' and codCategoriaAPU=' +
            QuotedStr(codCategoriaApu) +
            ' order by descripcion');
          prepare;
          ExecSQL;

          while not Eof do
          begin
            subnodo :=
              TreeView_ApusActivas.AddNode(nodo);

            subnodo.Text[0] :=
              FieldByName('descripcion').AsString;
            subnodo.Text[1] :=
              FieldByName('unidad').AsString;
            tmpstr := FieldByName
              ('costodirectoTotal').AsString;
            subnodo.Text[2] :=
              base_activa.simboloMoneda + tmpstr;
            subnodo.Text[4] :=
              FieldByName('codAPU').AsString;
            Next;
          end;
          nodo := nodo.GetNextSibling;
        end;
      end;
    end;
  finally
    qry.Free;
    TreeView_ApusActivas.AutoSizeColumn(0);
    TreeView_ApusActivas.AutoSizeColumn(1);
    TreeView_ApusActivas.AutoSizeColumn(2);
    TreeView_ApusActivas.Columns[3].Width := 0;
    TreeView_ApusActivas.Columns[4].Width := 0;
    TreeView_ApusActivas.Columns[5].Width := 0;
    TreeView_ApusActivas.Columns[6].Width := 0;
  end;

end;

procedure TfrmImportarApus.cargaCategoriasyAPUS;
var
  qry: TUniQuery;
  nodo: TTMSFNCTreeViewNode;
  tmpstr: string;
  X: Integer;
begin
  TreeView_ApusActivas.ClearNodes;
  TreeView_ApusActivas.Columns[0].Text := 'Descripción';
  TreeView_ApusActivas.Columns[1].Text := 'Unidad';
  TreeView_ApusActivas.Columns[2].Text := 'Costo D.';
  qry := NewQuery;
  try
    with qry do
    begin
      Close;
      sql.Clear;
      sql.Add('select * from categoriaapus where codBase=' +
        QuotedStr(base_activa.codBase) +
        'and categoria_base=:categoria_base order by descripcion asc');
      prepare;
      ParamByName('categoria_base').AsString := IntToStr(6);
      ExecSQL;
      while not Eof do
      begin
        nodo := TreeView_ApusActivas.AddNode();
        tmpstr := FieldByName('descripcion').AsString;
        nodo.Text[0] := tmpstr;
        tmpstr := FieldByName('ciu').AsString;
        nodo.Text[3] := tmpstr;
        tmpstr := FieldByName('categoria_base')
          .AsString;
        nodo.Text[4] := tmpstr;
        nodo.Extended := True;
        Next;
      end;
    end;
  finally
    qry.Free;
    completaAPUSenCategorias();
    TreeView_ApusActivas.Columns[7].Width := 0;
  end;
end;

procedure TfrmImportarApus.cargaDBs;
var
  qry: TUniQuery;
  nodo, subnodo: TTMSFNCTreeViewNode;
  tmpstr, sqlText: string;
  fecha: TDateTime;
begin
  if not FFormReady then
    Exit;

  SetLength(listadoBasesImportar, 0);
  Trvw_AbrirBases.ClearNodes;

  Trvw_AbrirBases.Columns[0].Text := 'Cod Base';
  Trvw_AbrirBases.Columns[1].Text := 'Nombre';
  Trvw_AbrirBases.Columns[2].Text := 'Ult. Act.';

  if chkBasesProyectos.IsChecked then
    sqlText :=
      'SELECT * FROM bases WHERE presupuestoAsignado IS NOT NULL ' +
      'AND codBase <> :codBase ORDER BY FechaHoraModificacion ASC'
  else
    sqlText :=
      'SELECT * FROM bases WHERE presupuestoAsignado IS NULL ' +
      'AND codBase <> :codBase ORDER BY FechaHoraModificacion ASC';

  qry := NewQuery;
  try
    qry.SQL.Text := sqlText;
    qry.ParamByName('codBase').AsString := base_activa.codBase;
    qry.Open;

    while not qry.Eof do
    begin
      nodo := Trvw_AbrirBases.AddNode;
      nodo.Text[0] := qry.FieldByName('CodBase').AsString;
      nodo.Text[1] := qry.FieldByName('Nombre').AsString;
      fecha := qry.FieldByName('fechaHoraModificacion').AsDateTime;
      nodo.Text[2] := FormatDateTime('dd/mm/yyyy hh:nn', fecha);
      nodo.Text[3] := qry.FieldByName('presupuestoAsignado').AsString;
      qry.Next;
    end;

    nodo := Trvw_AbrirBases.Nodes[0];
    while Assigned(nodo) do
    begin
      if nodo.Text[3].Trim <> '' then
      begin
        qry.Close;
        qry.SQL.Text :=
          'SELECT revision, fechaModificacion ' +
          'FROM presupuestos_datosGenerales ' +
          'WHERE codBase=:codBase AND codPresupuesto=:codPresupuesto ' +
          'ORDER BY revision';

        qry.ParamByName('codBase').AsString := nodo.Text[0];
        qry.ParamByName('codPresupuesto').AsString := nodo.Text[3];
        qry.Open;

        while not qry.Eof do
        begin
          subnodo := Trvw_AbrirBases.AddNode(nodo);
          subnodo.Text[0] := 'Rev. ' + qry.FieldByName('revision').AsString;
          fecha := qry.FieldByName('fechaModificacion').AsDateTime;
          subnodo.Text[3] := FormatDateTime('dd/mm/yyyy hh:nn:ss', fecha);
          qry.Next;
        end;
      end;
      nodo := nodo.GetNextSibling;
    end;
  finally
    Trvw_AbrirBases.Columns[0].Width := 150;
    Trvw_AbrirBases.Columns[1].Width := 200;
    Trvw_AbrirBases.Columns[2].Width := 120;
    Trvw_AbrirBases.Columns[3].Width := 0;
    qry.Free;
  end;
end;

procedure TfrmImportarApus.chkBasesProyectosChange(Sender: TObject);
begin
  cargaDBs;
end;

procedure TfrmImportarApus.rct_1MouseDown(Sender: TObject; Button: TMouseButton;
  Shift: TShiftState; X, Y: Single);
begin
  self.StartWindowDrag;
end;

procedure TfrmImportarApus.rct_CancelarClick(Sender: TObject);
begin
  ModalResult := mrCancel;
end;

procedure TfrmImportarApus.rect_3Click(Sender: TObject);
begin
  if lyt_seleccionBase.Height <> 275 then
  begin
    lyt_seleccionBase.Height := 275;
    cargaDBs;
  end
  else
  begin
    if (lbl_BaseSeleccionada.Text <> 'Seleccionar Base') then
      lyt_seleccionBase.Height := 60;
  end;

end;

procedure TfrmImportarApus.rect_AceptarClick(Sender: TObject);
begin
  GuardayActualizaAPUS;
  ModalResult := mrOK;
end;

procedure TfrmImportarApus.TreeView_ApusActivasDragDrop(Sender: TObject;
  const Data: TDragObject; const Point: TPointF);
var
  JSON_respuesta: TJSONObject;
  respuesta: TJSONArray;
  NodeDetails: TJSONObject;
  Details: TJSONString;
  nodo, nodoDestino: TTMSFNCTreeViewNode;
  tmpstr: string;
  codUnicoAPU: string;
  descripcion: string;
  level: Integer;
  unidad: string;
  precio: string;
  codCPC: string;
  tipoCPC: string;
  porcentajeCPC: string;
  especificaciones: string;
  SubcategoriaDestino: string;
  subcategoriaOrigen: string;
  codBaseOrigen: string;
  codProyectoOrigen: string;
  revisionOrigen: string;
  ultModificacion: string;
begin
  if TPlatformServices.Current.SupportsPlatformService(IFMXDragDropService) then
  begin
    JSON_respuesta := Data.Source as TJSONObject;
    try
      level := TreeView_ApusActivas.XYToNode(Point.X,
        Point.Y, 0).level;
      if level > -1 then
      begin
        nodoDestino := TreeView_ApusActivas.XYToNode
          (Point.X, Point.Y, 0).Node;

        if level > 1 then
        begin
          nodoDestino := nodoDestino.GetParent;
        end;
        if Assigned(nodoDestino) then
        begin
          respuesta :=
            JSON_respuesta.GetValue('AdicionAPU')
            as TJSONArray;
          NodeDetails := respuesta.Get(0)
            as TJSONObject;
          Details :=
            NodeDetails.Get('codUnicoAPU')
            .JsonValue as TJSONString;
          codUnicoAPU := Details.AsString;
          Details :=
            NodeDetails.Get('descripcion')
            .JsonValue as TJSONString;
          descripcion := Details.AsString;
          Details := NodeDetails.Get('unidad')
            .JsonValue as TJSONString;
          unidad := Details.AsString;
          Details := NodeDetails.Get('costo')
            .JsonValue as TJSONString;
          precio := Details.AsString;
          Details :=
            NodeDetails.Get('codBaseOrigen')
            .JsonValue as TJSONString;
          codBaseOrigen := Details.AsString;
          Details :=
            NodeDetails.Get('codPresupuestoOrigen')
            .JsonValue as TJSONString;
          codProyectoOrigen := Details.AsString;
          Details :=
            NodeDetails.Get('RevisionOrigen')
            .JsonValue as TJSONString;
          revisionOrigen := Details.AsString;
          Details :=
            NodeDetails.Get('ultModificacion')
            .JsonValue as TJSONString;
          ultModificacion := Details.AsString;
          nodo := compruebaRecursoRepetido
            (nodoDestino, SubcategoriaDestino,
            descripcion, unidad);
          if Assigned(nodo) then
          begin
            // Recurso ya existente
            TDialogService.PreferredMode :=
              TDialogService.TPreferredMode.Platform;
            TDialogService.MessageDialog
              ('Recurso existente, ¿desea reemplazar los datos?'
              + #13 + 'P. Actual: ' +
              base_activa.simboloMoneda + nodo.Text[2]
              + base_activa.simboloMoneda +
              ' -> P. Nuevo: ' +
              base_activa.simboloMoneda + precio,
              TMsgDlgType.mtConfirmation,
              [TMsgDlgBtn.mbYes, TMsgDlgBtn.mbNo],
              TMsgDlgBtn.mbNo, 0,
              procedure(const AResult: TModalResult)
              begin
                case AResult of
                  mrYES:
                    begin
                      nodo.Text[2] := precio;
                      nodo.Text[5] := codBaseOrigen;
                      nodo.Text[6] := codUnicoAPU;
                      nodo.Text[8] :=
                        decimal_correcto(ultModificacion);
                    end;
                end;
              end);
          end
          else
          begin
            // Recurso Nuevo
            nodo := TreeView_ApusActivas.AddNode
              (nodoDestino);
            nodo.Text[0] := descripcion;
            nodo.Text[1] := unidad;
            nodo.Text[2] := precio;
            nodo.Text[6] := codUnicoAPU;
            nodo.Text[5] := codBaseOrigen;
            nodo.Text[8] :=
              decimal_correcto(ultModificacion);
          end;
        end;
      end;
    finally
      JSON_respuesta.Free;
    end;
  end;
  FMouseDown := False;
end;

function TfrmImportarApus.compruebaRecursoRepetido
  (nodoDestino: TTMSFNCTreeViewNode; categoriaBusqueda, descripcionRecurso,
  unidadRecurso: string): TTMSFNCTreeViewNode;
var
  salir: Boolean;
  nodo: TTMSFNCTreeViewNode;
  vnodo: TTMSFNCTreeViewVirtualNode;
begin
  Result := nil;
  if nodoDestino = nil then
    nodo := TreeView_ApusActivas.Nodes[0]
  else
  begin
    vnodo := nodoDestino.VirtualNode;
    if vnodo.level > 1 then
    begin
      vnodo := vnodo.GetParent;
    end;
    nodo := vnodo.Node;
  end;

  salir := False;
  while (not salir) and (Assigned(nodo)) do
  begin
    if (nodo.Text[0] = descripcionRecurso) and
      (nodo.Text[1] = unidadRecurso) then
    begin
      salir := True;
      Result := nodo;
    end;
    nodo := nodo.GetNext;
  end;
end;

function TfrmImportarApus.daSubCategoriaInicial
  (nodo: TTMSFNCTreeViewVirtualNode): string;
var
  level: Integer;
begin
  level := nodo.level;
  while level > 0 do
  begin
    nodo := nodo.GetParent;
    level := nodo.level;
  end;
  Result := nodo.Text[0];
end;

procedure TfrmImportarApus.FormShow(Sender: TObject);
begin
  FFormReady := True;

  FMouseDown := False;
  TreeView_APusDisponibles.ClearNodes;
  TreeView_APusDisponibles.Columns[0].Text := 'Descripción';
  TreeView_APusDisponibles.Columns[1].Text := 'Unidad';
  TreeView_APusDisponibles.Columns[2].Text := 'Costo D.';
  TreeView_APusDisponibles.AutoSizeColumn(0);
  TreeView_APusDisponibles.AutoSizeColumn(1);
  TreeView_APusDisponibles.AutoSizeColumn(2);
  TreeView_APusDisponibles.Columns[3].Width := 0;
  TreeView_APusDisponibles.Columns[4].Width := 0;
  TreeView_APusDisponibles.Columns[5].Width := 0;
  TreeView_APusDisponibles.Columns[6].Width := 0;

  Trvw_AbrirBases.ClearNodes;
  Trvw_AbrirBases.Columns[0].Text := 'Cod Base';
  Trvw_AbrirBases.Columns[1].Text := 'Nombre';
  Trvw_AbrirBases.Columns[2].Text := 'Ult. Act.';

  lyt_seleccionBase.Height := 60;
  lbl_BaseSeleccionada.Text := 'Seleccionar Base';
end;

procedure TfrmImportarApus.MenuItem1Click(Sender: TObject);
var
  X: Integer;
  nodoOrigen, nodoDestino, nodoNuevo: TTMSFNCTreeViewNode;
  SubcategoriaDestino: string;
  descripcion: string;
  unidad: string;
  i, j: Integer;
  mensaje: string;
  codBaseOrigen: string;
begin
  nodoDestino := TreeView_ApusActivas.SelectedNode;
  if Assigned(nodoDestino) then
  begin
    i := 0;
    codBaseOrigen := baseSeleccionadaImp.codBase;
    j := 0;
    nodoOrigen := TreeView_APusDisponibles.Nodes[0];
    while Assigned(nodoOrigen) do
    begin
      if not nodoOrigen.Extended then
      begin
        if nodoOrigen.Checked[0] then
        begin
          descripcion := nodoOrigen.Text[0];
          unidad := nodoOrigen.Text[1];
          nodoNuevo :=
            compruebaRecursoRepetido(nodoDestino,
            SubcategoriaDestino,
            descripcion, unidad);
          if not Assigned(nodoNuevo) then
          begin
            nodoNuevo :=
              TreeView_ApusActivas.AddNode
              (nodoDestino);
            nodoNuevo.Text[7] := 'Nuevo';
            Inc(i);
          end
          else
            Inc(j);
          nodoNuevo.Text[0] := nodoOrigen.Text[0];
          nodoNuevo.Text[1] := nodoOrigen.Text[1];
          nodoNuevo.Text[2] := nodoOrigen.Text[2];
          nodoNuevo.Text[5] := codBaseOrigen;
          nodoNuevo.Text[6] := nodoOrigen.Text[4];
          if nodoNuevo.Text[7] = '' then
            nodoNuevo.Text[7] := 'Actualizacion';
          nodoNuevo.Text[8] := nodoOrigen.Text[7];
        end;
      end;
      nodoOrigen := nodoOrigen.GetNext;
    end;

    mensaje := 'Recursos Actualizados: ' + IntToStr(j) + #13 +
      'Recursos Creados: ' + IntToStr(i);
  end
  else
  begin
    mensaje :=
      'Seleccione un categoria en la que importar, por favor.';
  end;
  TDialogService.MessageDialog(mensaje, TMsgDlgType.mtInformation,
    [TMsgDlgBtn.mbOk], TMsgDlgBtn.mbOk, 0, nil);
  TreeView_ApusActivas.Columns[7].Width := 0;
  TreeView_ApusActivas.Columns[8].Width := 0;
end;

procedure TfrmImportarApus.TreeView_ApusActivasDragOver(Sender: TObject;
  const Data: TDragObject; const Point: TPointF; var Operation: TDragOperation);
begin
  if (Data.Source <> nil) and (Data.Source is TJSONObject) then
  begin
    Operation := TDragOperation.Link;
  end
  else
    Operation := TDragOperation.None;
end;

procedure TfrmImportarApus.TreeView_APusDisponiblesAfterCheckNode
  (Sender: TObject; ANode: TTMSFNCTreeViewVirtualNode; AColumn: Integer);
var
  nodo, subnodo: TTMSFNCTreeViewNode;
begin
  nodo := ANode.Node;
  if (Assigned(nodo)) then
  begin
    if nodo.Extended then
    begin
      nodo.Expand(True);
      subnodo := nodo.GetFirstChild;
      while Assigned(subnodo) do
      begin
        subnodo.Checked[0] := True;
        subnodo := subnodo.GetNextSibling;
      end;
    end;
  end;
end;

procedure TfrmImportarApus.TreeView_APusDisponiblesDragOver(Sender: TObject;
  const Data: TDragObject; const Point: TPointF; var Operation: TDragOperation);
begin
  Operation := TDragOperation.None;
end;

procedure TfrmImportarApus.TreeView_APusDisponiblesEnter(Sender: TObject);
begin
  FMouseDown := False;
end;

procedure TfrmImportarApus.TreeView_APusDisponiblesMouseDown(Sender: TObject;
  Button: TMouseButton; Shift: TShiftState; X, Y: Single);
begin
  if (Shift = [ssLeft]) and
    (Assigned(TreeView_APusDisponibles.SelectedNode)) then
    FMouseDown := True;
end;

procedure TfrmImportarApus.TreeView_APusDisponiblesMouseMove(
  Sender: TObject; Shift: TShiftState; X, Y: Single);
var
  ddService: IFMXDragDropService;
  d: TDragObject;
  JSON_mensaje: TJSONObject;
  Amensaje: TJSONArray;
  obj_mensaje: TJSONObject;
  nodoTrabajo: TTMSFNCTreeViewNode;
  DragBitmap: TBitmap;
begin
  if not FMouseDown then
    Exit;
  if baseSeleccionadaImp.codBase = '' then
    Exit;

  if not TPlatformServices.Current.SupportsPlatformService(
    IFMXDragDropService, ddService) then
    Exit;

  nodoTrabajo := TreeView_APusDisponibles.SelectedNode;
  if not Assigned(nodoTrabajo) or nodoTrabajo.Extended then
    Exit;

  JSON_mensaje := TJSONObject.Create;
  try
    Amensaje := TJSONArray.Create;
    JSON_mensaje.AddPair('AdicionAPU', Amensaje);

    obj_mensaje := TJSONObject.Create;
    obj_mensaje.AddPair('codUnicoAPU', nodoTrabajo.Text[4]);
    obj_mensaje.AddPair('descripcion', nodoTrabajo.Text[0]);
    obj_mensaje.AddPair('unidad', nodoTrabajo.Text[1]);
    obj_mensaje.AddPair('costo', nodoTrabajo.Text[2]);
    obj_mensaje.AddPair('codBaseOrigen', baseSeleccionadaImp.codBase);
    obj_mensaje.AddPair('codPresupuestoOrigen', baseSeleccionadaImp.codPresupuesto);
    obj_mensaje.AddPair('RevisionOrigen', baseSeleccionadaImp.Revision);
    Amensaje.Add(obj_mensaje);

    DragBitmap := TBitmap.Create;
    try
      DragBitmap.SetSize(32, 32);
      DragBitmap.Clear(TAlphaColors.Null);

      d.Source := JSON_mensaje;
      ddService.BeginDragDrop(Self, d, DragBitmap);
    finally
      DragBitmap.Free; // SE COPIA INTERNAMENTE → aquí sí es seguro
    end;

  finally
    JSON_mensaje.Free;
    FMouseDown := False;
  end;
end;

procedure TfrmImportarApus.TreeView_APusDisponiblesMouseUp(Sender: TObject;
  Button: TMouseButton; Shift: TShiftState; X, Y: Single);
begin
  FMouseDown := False;
end;

procedure TfrmImportarApus.Trvw_AbrirBasesNodeDblClick(Sender: TObject;
  ANode: TTMSFNCTreeViewVirtualNode);
var
  X: Integer;
  descripcion: string;
  tmpstr: string;
begin
  if Assigned(frmImportarApus) and frmImportarApus.FFormReady then
  begin
    if (ANode.Text[3].Trim = '') and (ANode.level = 0) then
    begin
      // Base Padre
      baseSeleccionadaImp.codBase := ANode.Text[0];
      baseSeleccionadaImp.codPresupuesto := '';
      baseSeleccionadaImp.Revision := '';
    end;
    if (ANode.Text[3].Trim <> '') then
    begin
      // Base de Proyecto
      if ANode.level = 0 then
      begin
        tmpstr := ANode.GetLastChild.Text[0];
        tmpstr := ReplaceStr(tmpstr, 'Rev. ', '').Trim;
        baseSeleccionadaImp.codBase := ANode.Text[0];
        baseSeleccionadaImp.nombre := ANode.Text[1];
        baseSeleccionadaImp.codPresupuesto :=
          ANode.Text[3];
        baseSeleccionadaImp.Revision := tmpstr;

      end
      else
      begin
        tmpstr := ANode.Text[0];
        tmpstr := ReplaceStr(tmpstr, 'Rev. ', '').Trim;
        baseSeleccionadaImp.Revision := tmpstr;
        baseSeleccionadaImp.codPresupuesto :=
          ANode.GetParent.Text[3];
        baseSeleccionadaImp.nombre :=
          ANode.GetParent.Text[1];
        baseSeleccionadaImp.codBase :=
          ANode.GetParent.Text[0];
      end;
    end;
    if baseSeleccionadaImp.codBase <> '' then
    begin
      lbl_BaseSeleccionada.Text := baseSeleccionadaImp.nombre;
      if baseSeleccionadaImp.Revision <> '' then
        lbl_BaseSeleccionada.Text :=
          lbl_BaseSeleccionada.Text + ' - Revisión: ' +
          baseSeleccionadaImp.Revision;
      lyt_seleccionBase.Height := 60;
      CargaApusDisponibles(baseSeleccionadaImp);
    end;
  end;
end;

end.

