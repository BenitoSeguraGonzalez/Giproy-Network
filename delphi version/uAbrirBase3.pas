unit uAbrirBase3;

interface

uses
  System.SysUtils, System.Types, System.UITypes, System.Classes,
  System.Variants, System.StrUtils,
  FMX.Types, FMX.Controls, FMX.Forms, FMX.Graphics, FMX.Dialogs, FMX.Layouts,
  FMX.Objects,
  FMX.Controls.Presentation, FMX.StdCtrls, FMX.Effects, FMX.ListBox,
  FMX.TMSFNCTypes,
  FMX.TMSFNCUtils, FMX.TMSFNCGraphics, FMX.TMSFNCGraphicsTypes,
  FMX.TMSFNCTreeViewBase,
  FMX.TMSFNCTreeViewData, FMX.TMSFNCCustomTreeView, FMX.TMSFNCTreeView, Uni,
  FMX.TMSFNCCustomControl;

type
  TfrmAbrirBase3 = class(TForm)
    lyt_Header: TLayout;
    rect__1: TRectangle;
    lbl_lbl1: TLabel;
    lyt_Body: TLayout;
    rect__Background: TRectangle;
    rect__3: TRectangle;
    lyt_lyt2: TLayout;
    lyt_lyt3: TLayout;
    lbl_lbl2: TLabel;
    lyt_lyt4: TLayout;
    rect__fondoGrid: TRectangle;
    lyt_lyt5: TLayout;
    lbl_lbl3: TLabel;
    ln_ln1: TLine;
    lyt_lyt6: TLayout;
    chkPadres: TCheckBox;
    chkPresupuestos: TCheckBox;
    lyt_lyt1: TLayout;
    lbl_modo: TLabel;
    rect__Cancelar: TRectangle;
    iGlow_Cancelar: TInnerGlowEffect;
    Trvw_AbrirBases: TTMSFNCTreeView;
    tmr1: TTimer;
    rect_Aceptar: TRectangle;
    iGlow_Aceptar: TInnerGlowEffect;
    procedure chkPadresChange(Sender: TObject);
    procedure chkPresupuestosChange(Sender: TObject);
    procedure FormShow(Sender: TObject);
    procedure rect__1MouseDown(Sender: TObject; Button: TMouseButton;
      Shift: TShiftState; X, Y: Single);
    procedure rect__CancelarClick(Sender: TObject);
    procedure rect__CancelarMouseEnter(Sender: TObject);
    procedure rect__CancelarMouseLeave(Sender: TObject);
    procedure Trvw_AbrirBasesNodeDblClick(Sender: TObject;
      ANode: TTMSFNCTreeViewVirtualNode);
    procedure tmr1Timer(Sender: TObject);
    procedure rect_AceptarClick(Sender: TObject);
  private
    procedure EnsureColumns(AMin: Integer);
    procedure limpiaTrvw;
    procedure cambiaBaseDatos(const BaseAntigua, BaseNueva: string);
    procedure activarBaseDatosNueva(const codBaseNueva: string);
    procedure Ejecuta(ANode: TTMSFNCTreeViewVirtualNode);
  public
    procedure PopulaGridBase;
    function estableceDatosDB(Nodo: TTMSFNCTreeViewNode): string;
  end;

var
  frmAbrirBase3: TfrmAbrirBase3;

implementation

{$R *.fmx}

uses
  DM1, uMain, uPorcentajesIndirectos, DM_Presupuestos;

{ TfrmAbrirBase3 }

procedure TfrmAbrirBase3.chkPadresChange(Sender: TObject);
begin
  if Visible then
    PopulaGridBase;
end;

procedure TfrmAbrirBase3.chkPresupuestosChange(Sender: TObject);
begin
  if Visible then
    PopulaGridBase;
end;

procedure TfrmAbrirBase3.FormShow(Sender: TObject);
begin
  tmr1.Enabled := True;
end;

procedure TfrmAbrirBase3.EnsureColumns(AMin: Integer);
var
  i: Integer;
begin
  // Garantiza que existan columnas suficientes (para ocultas y compatibilidad)
  while Trvw_AbrirBases.Columns.Count < AMin do
    Trvw_AbrirBases.Columns.Add;

  // Asegura índices válidos (si el control requiere inicialización)
  for i := 0 to Trvw_AbrirBases.Columns.Count - 1 do
    Trvw_AbrirBases.Columns[i].Width := Trvw_AbrirBases.Columns[i].Width;
end;

procedure TfrmAbrirBase3.limpiaTrvw;
begin
  EnsureColumns(5);

  Trvw_AbrirBases.ClearNodes;

  Trvw_AbrirBases.Columns[0].Text := 'Cod Base';
  Trvw_AbrirBases.Columns[1].Text := 'Nombre';
  Trvw_AbrirBases.Columns[2].Text := 'Ult. Act.';
  // 3 = codPresupuesto (oculta)
  // 4 = codBase real para subnodos (oculta)
end;

procedure TfrmAbrirBase3.PopulaGridBase;
const
  COL_CODBASE = 0;
  COL_TEXTO = 1;
  COL_FECHA = 2;
  COL_CODPRESU = 3; // oculta
  COL_CODBASE_REAL = 4; // oculta
var
  QryBases: TUniQuery;
  QryRevisiones: TUniQuery;
  SQLBase: string;
  Nodo, SubNodo: TTMSFNCTreeViewNode;

  function SafeDateField(Q: TUniQuery; const FieldName: string; const Fmt:
    string): string;
  begin
    if (Q.FindField(FieldName) <> nil) and (not Q.FieldByName(FieldName).IsNull)
      then
      Result := FormatDateTime(Fmt, Q.FieldByName(FieldName).AsDateTime)
    else
      Result := '';
  end;

begin
  if not (chkPadres.IsChecked or chkPresupuestos.IsChecked) then
  begin
    limpiaTrvw;
    Exit;
  end;

  SQLBase :=
    'select codBase, nombre, fechaHoraModificacion, presupuestoAsignado ' +
    'from bases ';

  if chkPadres.IsChecked xor chkPresupuestos.IsChecked then
  begin
    SQLBase := SQLBase + 'where ';
    if chkPadres.IsChecked then
      SQLBase := SQLBase + 'presupuestoAsignado is null '
    else
      SQLBase := SQLBase + 'presupuestoAsignado is not null ';
  end;

  SQLBase := SQLBase + 'order by fechaHoraModificacion desc';

  Trvw_AbrirBases.BeginUpdate;
  try
    limpiaTrvw;

    QryBases := TUniQuery.Create(nil);
    QryRevisiones := TUniQuery.Create(nil);
    try
      QryBases.Connection := DModule_1.con2;
      QryBases.SQL.Text := SQLBase;
      QryBases.Open;

      while not QryBases.Eof do
      begin
        Nodo := Trvw_AbrirBases.AddNode;

        // Visible
        Nodo.Text[COL_CODBASE] := QryBases.FieldByName('CodBase').AsString;
        Nodo.Text[COL_TEXTO] := QryBases.FieldByName('Nombre').AsString;
        Nodo.Text[COL_FECHA] := SafeDateField(QryBases, 'fechaHoraModificacion',
          'dd/mm/yyyy hh:nn');

        // Ocultas
        Nodo.Text[COL_CODPRESU] :=
          QryBases.FieldByName('presupuestoAsignado').AsString;
        Nodo.Text[COL_CODBASE_REAL] := Nodo.Text[COL_CODBASE];

        QryBases.Next;
      end;

      // Revisiones SOLO para bases con presupuesto
      if Trvw_AbrirBases.Nodes.Count > 0 then
      begin
        QryRevisiones.Connection := DModule_1.con2;
        QryRevisiones.SQL.Text :=
          'select revision, fechaModificacion ' +
          'from presupuestos_datosGenerales ' +
          'where codBase = :codBase ' +
          '  and codPresupuesto = :codPresupuesto ' +
          'order by revision';
        QryRevisiones.Prepare;

        Nodo := Trvw_AbrirBases.Nodes[0];
        while Assigned(Nodo) do
        begin
          if Nodo.Text[COL_CODPRESU].Trim <> '' then
          begin
            QryRevisiones.Close;
            QryRevisiones.ParamByName('codBase').AsString :=
              Nodo.Text[COL_CODBASE_REAL];
            QryRevisiones.ParamByName('codPresupuesto').AsString :=
              Nodo.Text[COL_CODPRESU];
            QryRevisiones.Open;

            while not QryRevisiones.Eof do
            begin
              SubNodo := Trvw_AbrirBases.AddNode(Nodo);

              // IMPORTANTE: tu loader (estableceDatosDB) esperaba "Rev. X" en Text[0].
              SubNodo.Text[COL_CODBASE] := 'Rev. ' +
                QryRevisiones.FieldByName('revision').AsString;
              SubNodo.Text[COL_TEXTO] := ''; // opcional
              SubNodo.Text[COL_FECHA] := SafeDateField(QryRevisiones,
                'fechaModificacion',
                'dd/mm/yyyy hh:nn:ss');

              // Ocultas (claves)
              SubNodo.Text[COL_CODPRESU] := Nodo.Text[COL_CODPRESU];
              SubNodo.Text[COL_CODBASE_REAL] := Nodo.Text[COL_CODBASE_REAL];

              QryRevisiones.Next;
            end;
          end;

          Nodo := Nodo.GetNextSibling;
        end;

        // Ajuste columnas (con 5 columnas garantizadas)
        Trvw_AbrirBases.Columns[COL_CODBASE].Width := 150;
        Trvw_AbrirBases.Columns[COL_TEXTO].Width := 220;
        Trvw_AbrirBases.Columns[COL_FECHA].Width := 150;
        Trvw_AbrirBases.Columns[COL_CODPRESU].Width := 0;
        Trvw_AbrirBases.Columns[COL_CODBASE_REAL].Width := 0;
      end;

    finally
      QryBases.Free;
      QryRevisiones.Free;
    end;
  finally
    Trvw_AbrirBases.EndUpdate;
  end;
end;

procedure TfrmAbrirBase3.rect_AceptarClick(Sender: TObject);
var
  VNode: TTMSFNCTreeViewVirtualNode;
begin
  VNode := nil;
  if Assigned(Trvw_AbrirBases.SelectedNode) then
    VNode := Trvw_AbrirBases.SelectedNode.VirtualNode;

  if Assigned(VNode) then
  begin
    Ejecuta(VNode);
    ModalResult := mrOK;
  end
  else
    ModalResult := mrCancel;
end;

procedure TfrmAbrirBase3.rect__1MouseDown(Sender: TObject; Button: TMouseButton;
  Shift: TShiftState; X, Y: Single);
begin
  Self.StartWindowDrag;
end;

procedure TfrmAbrirBase3.rect__CancelarClick(Sender: TObject);
begin
  ModalResult := mrOK;
end;

procedure TfrmAbrirBase3.rect__CancelarMouseEnter(Sender: TObject);
begin
  iGlow_Cancelar.Enabled := True;
end;

procedure TfrmAbrirBase3.rect__CancelarMouseLeave(Sender: TObject);
begin
  iGlow_Cancelar.Enabled := False;
end;

procedure TfrmAbrirBase3.tmr1Timer(Sender: TObject);
begin
  tmr1.Enabled := False;

  if not Visible then
    Exit;

  chkPadres.IsChecked := True;
  chkPresupuestos.IsChecked := False;

  PopulaGridBase;
end;

function TfrmAbrirBase3.estableceDatosDB(Nodo: TTMSFNCTreeViewNode): string;
const
  COL_CODBASE = 0;
  COL_CODPRESU = 3;
  COL_CODBASE_REAL = 4;
var
  ParentNode: TTMSFNCTreeViewNode;
  codBaseAbrir: string;
  sRev: string;

  function GetCodBaseReal(N: TTMSFNCTreeViewNode): string;
  begin
    Result := '';
    if not Assigned(N) then
      Exit;
    if (Trvw_AbrirBases.Columns.Count > COL_CODBASE_REAL) and
      (N.Text[COL_CODBASE_REAL].Trim <> '') then
      Result := N.Text[COL_CODBASE_REAL].Trim
    else
      Result := N.Text[COL_CODBASE].Trim;
  end;

  function ExtractRevision(const S: string): string;
  var
    T: string;
  begin
    T := Trim(S);
    if StartsText('Rev.', T) then
      Result := Trim(ReplaceText(T, 'Rev.', ''))
    else if StartsText('Rev', T) then
      Result := Trim(ReplaceText(T, 'Rev', ''))
    else
      Result := '';
    // deja solo números si viene "Rev. 3"
    Result := Result.Trim;
    if StartsText('.', Result) then
      Result := Trim(Result.Substring(1));
  end;

begin
  Result := '';
  if not Assigned(Nodo) then
    Exit;

  ParentNode := Nodo.GetParent;
  codBaseAbrir := '';

  // Base padre: sin presupuesto y sin padre
  if (Nodo.Text[COL_CODPRESU].Trim = '') and (not Assigned(ParentNode)) then
  begin
    codBaseAbrir := GetCodBaseReal(Nodo);
  end
    // Base con presupuesto
  else if Nodo.Text[COL_CODPRESU].Trim <> '' then
  begin
    // Click en revisión (tiene padre)
    if Assigned(ParentNode) then
    begin
      codProyecto := ParentNode.Text[COL_CODPRESU];
      sRev := ExtractRevision(Nodo.Text[COL_CODBASE]); // ahora sí viene "Rev. X"
      if sRev = '' then
        sRev := ExtractRevision(Nodo.Text[1]); // respaldo
      revision := sRev;

      codBaseAbrir := GetCodBaseReal(ParentNode);
    end
      // Click en nodo raíz del proyecto (sin padre): cargar última revisión si existe
    else
    begin
      ParentNode := Nodo.GetLastChild;
      if Assigned(ParentNode) then
      begin
        sRev := ExtractRevision(ParentNode.Text[COL_CODBASE]);
        if sRev = '' then
          sRev := ExtractRevision(ParentNode.Text[1]);
        revision := sRev;
      end
      else
        revision := '';

      codProyecto := Nodo.Text[COL_CODPRESU];
      codBaseAbrir := GetCodBaseReal(Nodo);
    end;
  end;

  Result := codBaseAbrir;
end;

procedure TfrmAbrirBase3.Trvw_AbrirBasesNodeDblClick(Sender: TObject;
  ANode: TTMSFNCTreeViewVirtualNode);
begin
  if Assigned(ANode) then
  begin
    Ejecuta(ANode);
    ModalResult := mrOK;
  end;
end;

procedure TfrmAbrirBase3.Ejecuta(ANode: TTMSFNCTreeViewVirtualNode);
var
  modo: Integer;
  codBaseAbrir: string;
  codBaseNueva: string;
begin
  if not Assigned(ANode) then
    Exit;

  codBaseAbrir := estableceDatosDB(ANode.Node);
  if codBaseAbrir = '' then
    Exit;

  modo := StrToIntDef(lbl_modo.Text, 0);

  case modo of
    1:
      begin
        // 1) Activa base
        activaBaseDatos(codBaseAbrir);

        // 2) Refresca UI igual que cuando creas una base nueva
        if base_activa.nombre <> '' then
        begin
          muestraOPC(True);

          // IMPORTANTÍSIMO: si no haces esto, los árboles/grids se quedan vacíos visualmente
          limpiaOPC1;

          // si tu UI depende de ese bitmap como en tu otro flujo
          if Assigned(frmMain.img_OPC1_Subcategorias) and
            Assigned(frmMain.rect_OPC1_Subcategorias) then
            frmMain.rect_OPC1_Subcategorias.Fill.Bitmap.Bitmap :=
              frmMain.img_OPC1_Subcategorias.MultiResBitmap[0].Bitmap;

          frmMain.moverTab(1);
        end;
      end;

    2:
      begin
        frmMain.iGlow_Presupuestos_SeleccionarIndirectos.Enabled := True;

        if base_activa.codBase <> '' then
        begin
          if realizarPreguntaSiNo('¿Desea cambiar la base de trabajo?' +
            sLineBreak +
            'Tenga en cuenta que se perderán todos los ítems del presupuesto.') =
              mrOK then
          begin
            codBaseNueva := creaDataBaseDesdePadre(codBaseAbrir);
            cambiaBaseDatos(codBaseAbrir, codBaseNueva);
            activarBaseDatosNueva(codBaseNueva);
          end
          else
            ModalResult := mrCancel;
        end
        else
        begin
          codBaseNueva := creaDataBaseDesdePadre(codBaseAbrir);
          activarBaseDatosNueva(codBaseNueva);
        end;
      end;
  end;
end;

procedure TfrmAbrirBase3.activarBaseDatosNueva(const codBaseNueva: string);
var
  descripcion: string;
  LForm: TfrmPorcentajesIndirectos;
begin
  DModule_1.con2.StartTransaction;
  try
    LForm := TfrmPorcentajesIndirectos.Create(Application);
    try

      activaBaseDatos(codBaseNueva);
      frmMain.iGlow_Presupuestos_SeleccionarIndirectos.Enabled := True;

      descripcion := base_activa.nombre;
      if descripcion <> '' then
      begin
        LForm.lbl_modo.Text := '0';
        DMPresupuesto.activaSubcategoriayApusPresupuesto;

        Visible := False;
        LForm.ShowModal;
        if LForm.ModalResult = mrOK then
        begin
          if proyectoNuevo then
          begin
            GuardarProyecto;
            DMPresupuesto.sincronizaEdt2Presupuesto;
          end;

          proyectoNuevo := False;
          ModalResult := mrOK;
          if LForm.ModalResult = mrOK then
          begin
            CargaProyecto(base_activa.codBase);
            frmMain.tbcPresupuestos.ActiveTab := frmMain.tab_5Presupuesto;
            ModalResult := mrOK;
          end;
        end;
      end;
    finally
      LForm.Free;
    end;
    DModule_1.con2.Commit;
  except
    Dmodule_1.con2.Rollback;
  end;
end;

procedure TfrmAbrirBase3.cambiaBaseDatos(const BaseAntigua, BaseNueva: string);
var
  qry: TUniQuery;

  procedure ExecSQLParams(const ASQL, ACodBase, ACodPresu: string);
  begin
    qry.Close;
    qry.SQL.Text := ASQL;
    qry.Prepare;

    if qry.Params.FindParam('codBase') <> nil then
      qry.ParamByName('codBase').AsString := ACodBase;

    if qry.Params.FindParam('codBasenueva') <> nil then
      qry.ParamByName('codBasenueva').AsString := BaseNueva;

    if qry.Params.FindParam('codPresupuesto') <> nil then
      qry.ParamByName('codPresupuesto').AsString := ACodPresu;

    if qry.Params.FindParam('revision') <> nil then
      qry.ParamByName('revision').AsString := revision;

    qry.ExecSQL;
  end;

begin
  if (BaseAntigua = '') or (BaseNueva = '') or (codProyecto = '') then
    Exit;

  qry := TUniQuery.Create(nil);
  try
    qry.Connection := DModule_1.con2;

    if not qry.Connection.InTransaction then
      qry.Connection.StartTransaction;

    try
      // 1) Borra la DB vieja (IMPORTANTE: BorrarDB NO debe hacer Commit por dentro)
      BorrarDB(BaseAntigua);

      // 2) Limpieza completa del presupuesto en la base antigua (por revision actual)
      ExecSQLParams(
        'DELETE FROM presupuestos_tanteo_apus ' +
        'WHERE codBase=:codBase AND codPresupuesto=:codPresupuesto AND revision=:revision',
        BaseAntigua, codProyecto
        );

      ExecSQLParams(
        'DELETE FROM presupuestos_tanteo_recursos ' +
        'WHERE codBase=:codBase AND codPresupuesto=:codPresupuesto AND revision=:revision',
        BaseAntigua, codProyecto
        );

      ExecSQLParams(
        'DELETE FROM presupuestos_anotaciones ' +
        'WHERE codBase=:codBase AND codPresupuesto=:codPresupuesto AND revision=:revision',
        BaseAntigua, codProyecto
        );

      ExecSQLParams(
        'DELETE FROM presupuestos_anotacionesp2 ' +
        'WHERE codBase=:codBase AND codPresupuesto=:codPresupuesto AND revision=:revision',
        BaseAntigua, codProyecto
        );

      ExecSQLParams(
        'DELETE FROM presupuestos_asignacionterminos ' +
        'WHERE codBase=:codBase AND codPresupuesto=:codPresupuesto AND revision=:revision',
        BaseAntigua, codProyecto
        );

      ExecSQLParams(
        'DELETE FROM presupuestos_cronogramas ' +
        'WHERE codBase=:codBase AND codPresupuesto=:codPresupuesto AND revision=:revision',
        BaseAntigua, codProyecto
        );

      ExecSQLParams(
        'DELETE FROM presupuestos_desagregacion ' +
        'WHERE codBase=:codBase AND codPresupuesto=:codPresupuesto AND revision=:revision',
        BaseAntigua, codProyecto
        );

      ExecSQLParams(
        'DELETE FROM presupuestos_fpolcuadrillas ' +
        'WHERE codBase=:codBase AND codPresupuesto=:codPresupuesto AND revision=:revision',
        BaseAntigua, codProyecto
        );

      ExecSQLParams(
        'DELETE FROM presupuestos_fpolinomica ' +
        'WHERE codBase=:codBase AND codPresupuesto=:codPresupuesto AND revision=:revision',
        BaseAntigua, codProyecto
        );

      ExecSQLParams(
        'DELETE FROM presupuestos_indicesseleccionados ' +
        'WHERE codBase=:codBase AND codPresupuesto=:codPresupuesto AND revision=:revision',
        BaseAntigua, codProyecto
        );

      ExecSQLParams(
        'DELETE FROM presupuestos_indirectos ' +
        'WHERE codBase=:codBase AND codPresupuesto=:codPresupuesto AND revision=:revision',
        BaseAntigua, codProyecto
        );

      ExecSQLParams(
        'DELETE FROM presupuestos_items ' +
        'WHERE codBase=:codBase AND codPresupuesto=:codPresupuesto AND revision=:revision',
        BaseAntigua, codProyecto
        );

      ExecSQLParams(
        'DELETE FROM presupuestos_items_trabajo ' +
        'WHERE codBase=:codBase AND codPresupuesto=:codPresupuesto AND revision=:revision',
        BaseAntigua, codProyecto
        );

      ExecSQLParams(
        'DELETE FROM presupuestos_notasrevision ' +
        'WHERE codBase=:codBase AND codPresupuesto=:codPresupuesto AND revision=:revision',
        BaseAntigua, codProyecto
        );

      ExecSQLParams(
        'DELETE FROM presupuestos_recursos ' +
        'WHERE codBase=:codBase AND codPresupuesto=:codPresupuesto AND revision=:revision',
        BaseAntigua, codProyecto
        );

      // 3) Eliminar revisiones > 0 en tablas “cabecera” y cambiar codBase en revision=0
      ExecSQLParams(
        'DELETE FROM presupuestos_datosgenerales ' +
        'WHERE codBase=:codBase AND codPresupuesto=:codPresupuesto AND revision>0',
        BaseAntigua, codProyecto
        );
      ExecSQLParams(
        'UPDATE presupuestos_datosgenerales SET codBase=:codBasenueva ' +
        'WHERE codBase=:codBase AND codPresupuesto=:codPresupuesto AND revision=0',
        BaseAntigua, codProyecto
        );

      ExecSQLParams(
        'DELETE FROM presupuestos_datosproyecto ' +
        'WHERE codBase=:codBase AND codPresupuesto=:codPresupuesto AND revision>0',
        BaseAntigua, codProyecto
        );
      ExecSQLParams(
        'UPDATE presupuestos_datosproyecto SET codBase=:codBasenueva ' +
        'WHERE codBase=:codBase AND codPresupuesto=:codPresupuesto AND revision=0',
        BaseAntigua, codProyecto
        );

      ExecSQLParams(
        'DELETE FROM presupuestos_edo ' +
        'WHERE codBase=:codBase AND codPresupuesto=:codPresupuesto AND revision>0',
        BaseAntigua, codProyecto
        );
      ExecSQLParams(
        'UPDATE presupuestos_edo SET codBase=:codBasenueva ' +
        'WHERE codBase=:codBase AND codPresupuesto=:codPresupuesto AND revision=0',
        BaseAntigua, codProyecto
        );

      ExecSQLParams(
        'DELETE FROM presupuestos_edt ' +
        'WHERE codBase=:codBase AND codPresupuesto=:codPresupuesto AND revision>0',
        BaseAntigua, codProyecto
        );
      ExecSQLParams(
        'UPDATE presupuestos_edt SET codBase=:codBasenueva ' +
        'WHERE codBase=:codBase AND codPresupuesto=:codPresupuesto AND revision=0',
        BaseAntigua, codProyecto
        );

      ExecSQLParams(
        'DELETE FROM presupuestos_stakeholders ' +
        'WHERE codBase=:codBase AND codPresupuesto=:codPresupuesto AND revision>0',
        BaseAntigua, codProyecto
        );
      ExecSQLParams(
        'UPDATE presupuestos_stakeholders SET codBase=:codBasenueva ' +
        'WHERE codBase=:codBase AND codPresupuesto=:codPresupuesto AND revision=0',
        BaseAntigua, codProyecto
        );

      // 4) Commit final
      qry.Connection.Commit;

    except
      on E: Exception do
      begin
        if qry.Connection.InTransaction then
          qry.Connection.Rollback;
        raise Exception.Create('cambiaBaseDatos falló y se revirtió todo.' +
          sLineBreak + E.Message);
      end;
    end;

  finally
    qry.Free;
  end;
end;

end.

