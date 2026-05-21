unit uAbrirPresupuesto;

interface

uses
  System.SysUtils, System.Types, System.UITypes, System.Classes, System.Variants, FMX.Types,
  FMX.Controls, FMX.Forms, FMX.Graphics, FMX.Dialogs, FMX.TMSFNCTypes, FMX.TMSFNCUtils,
  FMX.TMSFNCGraphics, FMX.TMSFNCGraphicsTypes, Uni, FMX.TMSFNCGridCell, FMX.TMSFNCGridOptions,
  FMX.DateTimeCtrls, System.StrUtils, FMX.Controls.Presentation, FMX.Edit, FMX.TMSFNCWebBrowser,
  FMX.TMSFNCCustomWEBControl, FMX.TMSFNCMemo, FMX.TMSFNCTreeViewBase, FMX.TMSFNCTreeViewData,
  FMX.TMSFNCCustomTreeView, FMX.TMSFNCTreeView, FMX.TMSFNCCustomControl,
  FMX.TMSFNCCustomScrollControl, FMX.TMSFNCGridData, FMX.TMSFNCCustomGrid, FMX.TMSFNCGrid,
  FMX.Layouts, FMX.Effects, FMX.Objects, FMX.StdCtrls, FMX.TMSFNCSplitter, FMX.ListBox, FMX.Menus;

type
  TfrmAbrirPresupuesto = class(TForm)
    lyt_background: TLayout;
    lyt_Body: TLayout;
    rect_2: TRectangle;
    lyt_3: TLayout;
    rect_3: TRectangle;
    lyt_6: TLayout;
    rect_4: TRectangle;
    lyt_DatosGenerales: TLayout;
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
    lyt_1: TLayout;
    lyt_2: TLayout;
    tmsfncspltr1: TTMSFNCSplitter;
    lyt_5: TLayout;
    lyt_11: TLayout;
    lbl_11: TLabel;
    ln_1: TLine;
    lyt_9: TLayout;
    lbl_3: TLabel;
    ln_ln1: TLine;
    lyt_12: TLayout;
    grdpnlyt1: TGridPanelLayout;
    lyt_13: TLayout;
    lbl_5: TLabel;
    rect_11: TRectangle;
    edt_descripcion: TEdit;
    lyt_4: TLayout;
    lbl_6: TLabel;
    dedt_1: TDateEdit;
    lbl_7: TLabel;
    dedt_2: TDateEdit;
    Trvw_ProyectosDisponibles: TTMSFNCTreeView;
    lst1: TListBox;
    chk1: TCheckBox;
    rect_addNotaGeneral: TRectangle;
    iGlow_addnota: TInnerGlowEffect;
    pm1: TPopupMenu;
    MenuItem1: TMenuItem;
    rect_12: TRectangle;
    iGlow_1: TInnerGlowEffect;
    rect_Importador: TRectangle;
    iGlow_Importador: TInnerGlowEffect;
    rect_5: TRectangle;
    lbl1: TLabel;
    procedure rect_6Click(Sender: TObject);
    procedure Trvw_ProyectosDisponiblesClick(Sender: TObject);
    procedure dedt_1Change(Sender: TObject);
    procedure dedt_2Change(Sender: TObject);
    procedure chk1Change(Sender: TObject);
    procedure rect_addNotaGeneralMouseEnter(Sender: TObject);
    procedure rect_addNotaGeneralMouseLeave(Sender: TObject);
    procedure rect_addNotaGeneralMouseMove(Sender: TObject; Shift: TShiftState; X, Y: Single);
    procedure rect_AceptarMouseEnter(Sender: TObject);
    procedure rect_AceptarMouseLeave(Sender: TObject);
    procedure MenuItem1Click(Sender: TObject);
    procedure rect_1MouseDown(Sender: TObject; Button: TMouseButton; Shift: TShiftState; X, Y: Single);
    procedure rect_12Click(Sender: TObject);
    procedure rect_AceptarClick(Sender: TObject);
    procedure Trvw_ProyectosDisponiblesNodeDblClick(Sender: TObject; ANode: TTMSFNCTreeViewVirtualNode);
    procedure rect_ImportadorMouseEnter(Sender: TObject);
    procedure rect_ImportadorMouseLeave(Sender: TObject);
    procedure rect_ImportadorClick(Sender: TObject);
  private
    { Private declarations }

    procedure addNota(Texto, seccion: string; fecha: TdateTime);
    procedure BorrarProyecto();

    function daUltimaRevision(ANode: TTMSFNCTreeViewNode): string;
    function daCodProyectoDeRevision(ANode: TTMSFNCTreeViewNode): string;

  public
    { Public declarations }
    procedure muestraNotas(codProyecto, Revision: string);
    procedure cargarProyectoRevision();
  end;

var
  frmAbrirPresupuesto: TfrmAbrirPresupuesto;

implementation

{$R *.fmx}

uses
  DM1, uMain, fNotaRevision, uInputMemo, uImportadorPresupuestos;

procedure TfrmAbrirPresupuesto.addNota(Texto, seccion: string; fecha: TdateTime);
var
  frmRevision: Tframe_NotasRevision;
  item: TlistboxItem;
  X: Integer;
begin
  X := lst1.Items.Count;
  lst1.BeginUpdate;
  frmRevision := Tframe_NotasRevision.create(Self);
  item := TlistboxItem.create(Self);
  frmRevision.name := 'name_' + IntToStr(X);
  frmRevision.mmoNotas.text := Texto;
  frmRevision.lbl_fecha.text := formatDateTime('dd/mm/yyyy', fecha);
  frmRevision.lbl_seccion.text := seccion;
  frmRevision.Parent := item;
  frmRevision.margins.left := 10;
  frmRevision.margins.right := 10;
  frmRevision.margins.bottom := 5;
  frmRevision.align := TAlignLayout.Client;

  item.Height := 120;
  item.Parent := lst1;
  lst1.EndUpdate;
end;

procedure TfrmAbrirPresupuesto.BorrarProyecto;
var
  qry: TUniQuery;
  isRevision: boolean;
  X: Integer;
  tmpstr: string;
  noderevision, nodo: TTMSFNCTreeViewNode;
  codBase, codProyecto, Revision: string;
  SQLText: string;
  nRevisiones: Integer;
begin
  nodo := Trvw_ProyectosDisponibles.SelectedNode;
  if Assigned(nodo) then
  begin
    Revision := '';
    if nodo.VirtualNode.Level = 1 then
    begin
      isRevision := True;
    end
    else
      isRevision := False;

    if not nodo.Extended then
    begin
      noderevision := nodo;
    end
    else
    begin
      noderevision := nodo.GetLastChild;
    end;
    codBase := noderevision.text[5];
    qry := TUniQuery.create(nil);
    tmpstr := nodo.text[0];
    if isRevision then
    begin
      Revision := ReplaceStr(tmpstr, 'Rev.', '').Trim;
      nodo := nodo.GetParent;
    end;
    codProyecto := nodo.text[0];
    codProyecto := ReplaceStr(codProyecto, '<B>', '');
    codProyecto := ReplaceStr(codProyecto, '</B>', '');
    codProyecto := Trim(codProyecto);
    X := AnsiPos(' ', codProyecto);
    codProyecto := Copy(codProyecto, 1, X - 1);
    codProyecto := Trim(codProyecto);
    try
      with qry do
      begin
        Connection := DModule_1.con2;
        close;
        sql.Clear;
        sql.Add('update presupuestos_datosGenerales set activo=0 where codBase=:codbase and codPresupuesto=:codPresupuesto');
        ParamByName('codBase').AsString := codBase;
        ParamByName('codPresupuesto').AsString := codProyecto;
        prepare;
        ExecSQL;
      end;
    finally
      qry.Free;
    end;
  end;
end;

procedure TfrmAbrirPresupuesto.chk1Change(Sender: TObject);
var
  fechaInicio, fechaFinal: TdateTime;
begin
  if chk1.IsChecked then
  begin
    CargaProyectosDisponibles(-1, -1, Self);
    dedt_1.Enabled := False;
    dedt_2.Enabled := False;
  end
  else
  begin
    dedt_1.Enabled := True;
    dedt_2.Enabled := True;
    fechaInicio := dedt_1.Date;
    fechaFinal := dedt_2.Date;
    if fechaInicio <= fechaFinal then
    begin
      CargaProyectosDisponibles(fechaInicio, fechaFinal, Self);
    end;
  end;
end;

procedure TfrmAbrirPresupuesto.dedt_1Change(Sender: TObject);
var
  fechaInicio, fechaFinal: TdateTime;
begin
  fechaInicio := dedt_1.Date;
  fechaFinal := dedt_2.Date;
  if fechaInicio <= fechaFinal then
  begin
    CargaProyectosDisponibles(fechaInicio, fechaFinal, Self);
  end;
end;

procedure TfrmAbrirPresupuesto.dedt_2Change(Sender: TObject);
var
  fechaInicio, fechaFinal: TdateTime;
begin
  fechaInicio := dedt_1.Date;
  fechaFinal := dedt_2.Date;
  if fechaInicio <= fechaFinal then
  begin
    CargaProyectosDisponibles(fechaInicio, fechaFinal, Self);
  end;
end;

procedure TfrmAbrirPresupuesto.MenuItem1Click(Sender: TObject);
begin
  if realizarPreguntaSiNo('¿Confirmar Borrar Proyecto o Revision?') <> mrOk then
    Exit;
  BorrarProyecto;
  CargaProyectosDisponibles(-1, -1, Self);
end;

procedure TfrmAbrirPresupuesto.muestraNotas(codProyecto, Revision: string);
var
  qry: TUniQuery;
  Texto: string;
  seccion: string;
  valor: TdateTime;
begin
  lst1.Items.Clear;
  qry := TUniQuery.create(nil);
  try
    with qry do
    begin
      Connection := DModule_1.con2;
      close;
      sql.Clear;
      sql.Add('select * from presupuestos_notasRevision where codpresupuesto=' + QuotedStr(codProyecto)
        + ' and revision=' + QuotedStr(Revision));
      prepare;
      ExecSQL;
      while not Eof do
      begin
        seccion := FieldByName('seccion').AsString;
        Texto := FieldByName('nota').AsString;
        valor := FieldByName('fechaHora').AsDatetime;
        addNota(Texto, seccion, valor);
        Next;
      end;
    end;
  finally
    qry.Free;
  end;
end;

procedure TfrmAbrirPresupuesto.rect_12Click(Sender: TObject);
begin
  ModalResult := mrCancel;
end;

procedure TfrmAbrirPresupuesto.rect_1MouseDown(Sender: TObject; Button: TMouseButton; Shift:
  TShiftState; X, Y: Single);
begin
  Self.StartWindowDrag;
end;

procedure TfrmAbrirPresupuesto.rect_6Click(Sender: TObject);
begin
  CargaProyectosDisponibles(-1, -1, Self);
end;

procedure TfrmAbrirPresupuesto.rect_AceptarClick(Sender: TObject);
begin
  cargarProyectoRevision();
end;

procedure TfrmAbrirPresupuesto.rect_AceptarMouseEnter(Sender: TObject);
begin
  iGlow_Aceptar.Enabled := True;
end;

procedure TfrmAbrirPresupuesto.rect_AceptarMouseLeave(Sender: TObject);
begin
  iGlow_Aceptar.Enabled := False;
end;

procedure TfrmAbrirPresupuesto.rect_addNotaGeneralMouseEnter(Sender: TObject);
begin
  iGlow_addnota.Enabled := True;
end;

procedure TfrmAbrirPresupuesto.rect_addNotaGeneralMouseLeave(Sender: TObject);
begin
  iGlow_addnota.Enabled := False;
end;

procedure TfrmAbrirPresupuesto.rect_addNotaGeneralMouseMove(Sender: TObject; Shift: TShiftState; X,
  Y: Single);
begin
  iGlow_addnota.Enabled := False;
end;

procedure TfrmAbrirPresupuesto.rect_ImportadorClick(Sender: TObject);
var
  LForm: TfImportadorPresupuestos;
begin
  LForm := TfImportadorPresupuestos.Create(Application);
  try
    LForm.ShowModal;
  finally
    LForm.Free;
  end;
end;

procedure TfrmAbrirPresupuesto.rect_ImportadorMouseEnter(Sender: TObject);
begin
  iGlow_Importador.Enabled := True;
end;

procedure TfrmAbrirPresupuesto.rect_ImportadorMouseLeave(Sender: TObject);
begin
  iGlow_Importador.Enabled := False;
end;

procedure TfrmAbrirPresupuesto.Trvw_ProyectosDisponiblesClick(Sender: TObject);
var
  nodoPadre: TTMSFNCTreeViewNode;
  nodo: TTMSFNCTreeViewNode;
  codPresupuesto: string;
  Revision: string;
  X: Integer;
begin
  if Assigned(Trvw_ProyectosDisponibles.SelectedNode) then
  begin
    nodo := Trvw_ProyectosDisponibles.SelectedNode;
    if nodo <> Trvw_ProyectosDisponibles.Nodes[0] then
    begin
      if Assigned(nodo) then
      begin
        if not nodo.Extended then
        begin
          Revision := nodo.text[0];
          Revision := ReplaceStr(Revision, 'Rev. ', '');
          nodoPadre := nodo.GetParent;
          codPresupuesto := nodoPadre.text[0];
          X := AnsiPos(' ', codPresupuesto);
          codPresupuesto := Copy(codPresupuesto, 1, X - 1);
          codPresupuesto := ReplaceStr(codPresupuesto, '<B>', '');
          codPresupuesto := ReplaceStr(codPresupuesto, '</B>', '');
          muestraNotas(codPresupuesto, Revision);
        end;
      end;
    end;
  end;
end;

procedure TfrmAbrirPresupuesto.Trvw_ProyectosDisponiblesNodeDblClick(Sender: TObject; ANode:
  TTMSFNCTreeViewVirtualNode);
var
  tmpstr: string;
  X: Integer;
begin
  limpiaBaseDatos();
  if ANode.Level = 0 then
  begin
    codProyecto := ANode.text[0];
    X := AnsiPos('</B>', codProyecto);
    codProyecto := Copy(codProyecto, 1, X - 1);
    codProyecto := ReplaceStr(codProyecto, '<B>', '');
    codProyecto := Trim(codProyecto);
    Revision := daUltimaRevision(ANode.Node);
  end
  else
  begin
    Revision := ANode.text[0];
    X := AnsiPos('.', Revision);
    Revision := Copy(Revision, X + 1, length(Revision)).Trim;
    codProyecto := daCodProyectoDeRevision(ANode.Node);
  end;
  cargarProyectoRevision();
end;

function TfrmAbrirPresupuesto.daCodProyectoDeRevision(ANode: TTMSFNCTreeViewNode): string;
var
  nodoTMP: TTMSFNCTreeViewNode;
  tmpstr: string;
  X: Integer;
begin
  tmpstr := '';
  nodoTMP := ANode.GetParent;
  if Assigned(nodoTMP) then
  begin
    tmpstr := nodoTMP.text[0];
    X := AnsiPos('</B>', tmpstr);
    tmpstr := Copy(tmpstr, 1, X - 1);
    tmpstr := ReplaceStr(tmpstr, '<B>', '');
    tmpstr := Trim(tmpstr);
  end;
  Result := tmpstr;
end;

function TfrmAbrirPresupuesto.daUltimaRevision(ANode: TTMSFNCTreeViewNode): string;
var
  nodoTMP: TTMSFNCTreeViewNode;
  tmpstr: string;
  X: Integer;
begin
  tmpstr := '';
  nodoTMP := ANode.GetLastChild;
  if Assigned(nodoTMP) then
  begin
    tmpstr := nodoTMP.text[0];
    X := AnsiPos('.', tmpstr);
    tmpstr := Copy(tmpstr, X + 1, length(tmpstr)).Trim;
  end;
  Result := tmpstr;
end;

procedure TfrmAbrirPresupuesto.cargarProyectoRevision();
var
  nodepresupuesto, noderevision: TTMSFNCTreeViewNode;
  codBase: string;
  X: Integer;
  tmpstr: string;
  codProyectoAnterior: string;
  descripcion: string;
  RevisionAnterior: string;
  codBaseActualizar: string;
begin
  cierraGridTanteo();
  codProyectoAnterior := frmmain.edt_CodigoPresupuesto1.text;
  if codProyectoAnterior = '--' then
    codProyectoAnterior := '';
  descripcion := frmmain.edt_descripcionPresupuesto.text;
  RevisionAnterior := frmmain.lbl_RevisionPresupuesto.text;
  if RevisionAnterior = 'revision' then
    RevisionAnterior := '';

  begin
    if (codProyectoAnterior <> '') and (RevisionAnterior <> '') and (descripcion <> '') then
    begin
      if realizarPreguntaSiNo('¿Guardar el proyecto actual?') = mrOK then
      begin
        // Actualizar tablas Padres
        GuardarProyecto();
      end;
      if Assigned(Trvw_ProyectosDisponibles.SelectedNode) then
      begin
        nodepresupuesto := Trvw_ProyectosDisponibles.SelectedNode;
        if Assigned(nodepresupuesto) then
        begin
          if not nodepresupuesto.Extended then
          begin
            noderevision := nodepresupuesto;
            nodepresupuesto := nodepresupuesto.GetParent;
          end
          else
          begin
            noderevision := nodepresupuesto.GetLastChild;
          end;
          codProyecto := quitaHTML(nodepresupuesto.text[0]);
          X := AnsiPos(' ', codProyecto);
          codProyecto := Copy(codProyecto, 1, X - 1);
          codProyecto := Trim(codProyecto);
          codBase := noderevision.text[5];
          Revision := noderevision.text[0];
          Revision := ReplaceStr(Revision, 'Rev. ', '');
          tmpstr := CargaProyecto(codBase);
          X := StrToIntDef(tmpstr, 1);
          if X > 0 then
            MuestraMensajeGiProy('Error', 'Error en el proyecto. codigo: ' + tmpstr)
          else
          begin
            proyectoNuevo := False;
            ModalResult := mrOk;
          end;
        end;
      end;
    end
    else
    begin
      if Assigned(Trvw_ProyectosDisponibles.SelectedNode) then
      begin
        nodepresupuesto := Trvw_ProyectosDisponibles.SelectedNode;
        if Assigned(nodepresupuesto) then
        begin
          if not nodepresupuesto.Extended then
          begin
            noderevision := nodepresupuesto;
            nodepresupuesto := nodepresupuesto.GetParent;
          end
          else
          begin
            noderevision := nodepresupuesto.GetLastChild;
          end;
          codProyecto := quitaHTML(nodepresupuesto.text[0]);
          X := AnsiPos(' ', codProyecto);
          codProyecto := Copy(codProyecto, 1, X - 1);
          codProyecto := Trim(codProyecto);
          codBase := noderevision.text[5];
          tmpstr := noderevision.text[5];
          Revision := noderevision.text[0];
          Revision := ReplaceStr(Revision, 'Rev. ', '');
          tmpstr := CargaProyecto(codBase);
          X := StrToIntDef(tmpstr, 1);
          if X > 0 then
            MuestraMensajeGiProy('Error', 'Error en el proyecto. codigo: ' + IntToStr(X))
          else
          begin
            proyectoNuevo := False;
            ModalResult := mrOk;
          end;
        end;
      end;
    end;
    frmmain.tbcPresupuestos.ActiveTab := frmmain.tab_5Presupuesto;
  end;
end;

end.

