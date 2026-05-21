unit uCPCSeleccion;

interface

uses
  System.SysUtils, System.Types, System.UITypes, System.Classes,
  System.Variants, FMX.Types,
  FMX.Controls, FMX.Forms, FMX.Graphics, FMX.Dialogs, FMX.TMSFNCTypes,
  FMX.TMSFNCUtils,
  FMX.TMSFNCGraphics, FMX.TMSFNCGraphicsTypes, FMX.Effects,
  FMX.TMSFNCCustomControl,
  FMX.TMSFNCCustomPicker, FMX.TMSFNCComboBox, FMX.Edit, FMX.Layouts,
  FMX.Objects,
  FMX.Controls.Presentation, FMX.StdCtrls, Uni, FMX.TMSFNCGridCell,
  FMX.TMSFNCGridOptions,
  FMX.TMSFNCCustomScrollControl, FMX.TMSFNCGridData, FMX.TMSFNCCustomGrid,
  FMX.TMSFNCGrid, System.Math,
  FMX.TMSFNCCustomComponent, FMX.TMSFNCGridDatabaseAdapter, Data.DB, MemDS,
  DBAccess;

type
  Tfrm_CPCSeleccion = class(TForm)
    lyt_Body: TLayout;
    rct__2: TRectangle;
    lyt_3: TLayout;
    rct__3: TRectangle;
    lyt_6: TLayout;
    rct__4: TRectangle;
    lyt_DatosGenerales: TLayout;
    lyt_9: TLayout;
    lbl_3: TLabel;
    ln_ln1: TLine;
    lyt_7: TLayout;
    lbl_Item: TLabel;
    lyt_footer: TLayout;
    lbl_modo: TLabel;
    lyt_header: TLayout;
    rctngl_mover: TRectangle;
    lbl_1: TLabel;
    lyt1: TLayout;
    lyt4: TLayout;
    lyt5: TLayout;
    lbl_5: TLabel;
    rct_11: TRectangle;
    edt_filtro: TEdit;
    lyt6: TLayout;
    grid_SeleccionCPC: TTMSFNCGrid;
    rct_edtFiltro2Clear: TRectangle;
    dbGridConnect_SelCPC: TTMSFNCGridDatabaseAdapter;
    lbl_adicional: TLabel;
    lbl_idUnicoRecursoAsignado: TLabel;
    lbl_posGrid: TLabel;
    ds1: TUniDataSource;
    QcodCPC: TUniQuery;
    QcodCPCid: TIntegerField;
    QcodCPCcodCPC: TStringField;
    QcodCPCDescripcion: TMemoField;
    QcodCPCTipo: TStringField;
    QcodCPCPorcentaje: TFloatField;
    rect_Cancelar: TRectangle;
    iGlow_Cancelar: TInnerGlowEffect;
    rect_Aceptar: TRectangle;
    InnerGlowEffect1: TInnerGlowEffect;
    procedure lbl_1MouseDown(Sender: TObject; Button: TMouseButton;
      Shift: TShiftState; X, Y: Single);
    procedure rctngl_moverMouseDown(Sender: TObject; Button: TMouseButton;
      Shift: TShiftState; X, Y: Single);
    procedure grid_SeleccionCPCCellEditDone(Sender: TObject;
      ACol, ARow: Integer; CellEditor: TTMSFNCGridEditor);
    procedure grid_SeleccionCPCCellDblClick(Sender: TObject;
      ACol, ARow: Integer);
    procedure edt_filtroChangeTracking(Sender: TObject);
    procedure FormShow(Sender: TObject);
    procedure rect_AceptarClick(Sender: TObject);
    procedure rect_CancelarClick(Sender: TObject);
    procedure FormClose(Sender: TObject; var Action: TCloseAction);
  private
    { Private declarations }
    FOwnsTxn: Boolean;
    FInEditSession: Boolean;
    procedure BeginEditSession;
    procedure CommitEditSession;
    procedure CancelEditSession;

    procedure actualizaCPCBasesDatos(idunicoRecurso: string;
      codCPCdB, TipoCPC, porcentajeCPC: string; sincronizarPadre: Boolean);
    procedure grabaCPCenRecurso(codCPCdB, TipoCPC, porcentajeCPC: string);
    procedure EjecutaOpcion(ARow: Integer);
  public
    { Public declarations }
    codCPC: string;
    procedure filtrarCodCPC(const valorFiltrado: string);
  end;

var
  frm_CPCSeleccion: Tfrm_CPCSeleccion;

implementation

{$R *.fmx}

uses
  DM1, uNuevoRecurso, uMain;

procedure Tfrm_CPCSeleccion.BeginEditSession;
begin
  FInEditSession := False;
  FOwnsTxn := False;

  QcodCPC.Connection := dmodule_1.con2;
  if not QcodCPC.Connection.Connected then
    QcodCPC.Connection.Connect;

  // Asegura inactivo antes de tocar CachedUpdates
  if QcodCPC.Active then
    QcodCPC.Close;

  // Si NO hay transacción activa, este form pasa a ser "dueño"
  if not QcodCPC.Connection.InTransaction then
  begin
    QcodCPC.Connection.StartTransaction;
    FOwnsTxn := True;
  end;

  // Cambios diferidos (solo permitido estando inactivo)
  QcodCPC.CachedUpdates := True;

  FInEditSession := True;
end;

procedure Tfrm_CPCSeleccion.CommitEditSession;
begin
  if not FInEditSession then
    Exit;

  if QcodCPC.Active and (QcodCPC.State in dsEditModes) then
    QcodCPC.Post;

  if QcodCPC.Active and QcodCPC.CachedUpdates then
    QcodCPC.ApplyUpdates;

  if FOwnsTxn and QcodCPC.Connection.InTransaction then
    QcodCPC.Connection.Commit;

  FInEditSession := False;
end;

procedure Tfrm_CPCSeleccion.CancelEditSession;
begin
  if not FInEditSession then
    Exit;

  // Si el dataset está en edición/inserción, cancelar eso primero
  if QcodCPC.Active and (QcodCPC.State in dsEditModes) then
    QcodCPC.Cancel;

  // CancelUpdates en UniDAC puede exigir Active según versión:
  // por seguridad, solo si está Active.
  if QcodCPC.Active and QcodCPC.CachedUpdates then
    QcodCPC.CancelUpdates;

  // Rollback solo si este form es dueño
  if FOwnsTxn and QcodCPC.Connection.InTransaction then
    QcodCPC.Connection.Rollback;

  FInEditSession := False;
end;

procedure Tfrm_CPCSeleccion.actualizaCPCBasesDatos(idunicoRecurso: string;
  codCPCdB, TipoCPC, porcentajeCPC: string; sincronizarPadre: Boolean);
var
  qry: TUniQuery;
  X: Integer;
  listaBasePadre: TStringList;
  codBasePadre: string;
begin
  qry := TUniQuery.Create(nil);
  listaBasePadre := TStringList.Create;
  listaBasePadre := base_activa.BasesPadres;
  try
    with qry do
    begin
      Connection := dmodule_1.con2;
      Close;
      sql.Clear;
      sql.Add('update apus_items set codCPC=:codCPC, tipoCPC=:tipoCPC, porcentajeCPC=:porcentajeCPC where idUnicoRecurso='
        + quotedStr(idunicoRecurso) + ' and codBase=' +
        quotedStr(base_activa.codBase));
      Prepare;
      ParamByName('codCPC').AsString := codCPCdB;
      ParamByName('tipoCPC').AsString := TipoCPC;
      ParamByName('porcentajeCPC').AsString := porcentajeCPC;
      ExecSQL;
      dmodule_1.untbl2.Active := False;
      Close;
      sql.Clear;
      sql.Add('update Presupuestos_Recursos set codCPC=:codCPC, tipoCPC=:tipoCPC, porcentajeCPC=:porcentajeCPC where idUnicoRecurso='
        + quotedStr(idunicoRecurso) + ' and codBase=' +
        quotedStr(base_activa.codBase));
      Prepare;
      ParamByName('codCPC').AsString := codCPCdB;
      ParamByName('tipoCPC').AsString := TipoCPC;
      ParamByName('porcentajeCPC').AsString := porcentajeCPC;
      ExecSQL;
      dmodule_1.untbl2.Active := True;
      if sincronizarPadre then
      begin
        for X := 0 to listaBasePadre.Count - 1 do
        begin
          codBasePadre := listaBasePadre[X];
          if codBasePadre <> '' then
          begin
            Close;
            sql.Clear;
            sql.Add('update apus_items set codCPC=:codCPC, tipoCPC=:tipoCPC, porcentajeCPC=:porcentajeCPC where idUnicoRecurso='
              + quotedStr(idunicoRecurso) + ' and codBase=' +
              quotedStr(codBasePadre));
            Prepare;
            ParamByName('codCPC').AsString := codCPCdB;
            ParamByName('tipoCPC').AsString := TipoCPC;
            ParamByName('porcentajeCPC').AsString := porcentajeCPC;
            ExecSQL;
          end;
        end;
      end;
    end;
  finally
    qry.Free;
  end;
end;

procedure Tfrm_CPCSeleccion.edt_filtroChangeTracking(Sender: TObject);
begin
  if QcodCPC.CachedUpdates and QcodCPC.UpdatesPending then
    Exit;

  if Self.edt_filtro.Text.Trim <> '' then
  begin
    filtrarCodCPC(edt_filtro.Text);

    // Si filtrar abrió dataset, asegúrate del adapter
    if not dbGridConnect_SelCPC.Active then
      dbGridConnect_SelCPC.Active := True;

    grid_SeleccionCPC.Visible := not QcodCPC.IsEmpty;
  end
  else
    grid_SeleccionCPC.Visible := False;
end;

procedure Tfrm_CPCSeleccion.filtrarCodCPC(const valorFiltrado: string);
var
  SDesc, SRaw, SDigits: string;
  i: Integer;
begin
  if QcodCPC.CachedUpdates and QcodCPC.UpdatesPending then
    Exit;

  SRaw := Trim(valorFiltrado);
  SDesc := LowerCase(SRaw);

  // extrae solo dígitos del filtro (por si escriben "01-02.03", etc.)
  SDigits := '';
  for i := 1 to Length(SRaw) do
    if CharInSet(SRaw[i], ['0'..'9']) then
      SDigits := SDigits + SRaw[i];

  QcodCPC.Connection := dmodule_1.con2;
  if not QcodCPC.Connection.Connected then
    QcodCPC.Connection.Connect;

  QcodCPC.Close;
  QcodCPC.SQL.Clear;

  // Si es muy corto, muestra todo (tu comportamiento actual)
  if Length(SDesc) <= 2 then
  begin
    QcodCPC.SQL.Add('SELECT * FROM CodCPC ORDER BY descripcion');
    QcodCPC.Open;
  end
  else
  begin
    // OJO: ahora SIEMPRE intentamos por descripción, y por código si hay dígitos
    QcodCPC.SQL.Add('SELECT * FROM CodCPC');
    QcodCPC.SQL.Add('WHERE LOWER(descripcion) LIKE :pdesc');

    if SDigits <> '' then
      QcodCPC.SQL.Add('   OR CAST(codCPC AS CHAR) LIKE :pcode');

    QcodCPC.SQL.Add('ORDER BY descripcion');

    QcodCPC.ParamByName('pdesc').AsString := '%' + SDesc + '%';
    if SDigits <> '' then
      QcodCPC.ParamByName('pcode').AsString := '%' + SDigits + '%';

    QcodCPC.Open;
  end;

  // Forzar que el adapter se reconstruya (por si ya estaba activo)
  if dbGridConnect_SelCPC.Active then
  begin
    dbGridConnect_SelCPC.Active := False;
    dbGridConnect_SelCPC.Active := True;
  end;

  grid_SeleccionCPC.Visible := not QcodCPC.IsEmpty;
  grid_SeleccionCPC.Invalidate;
end;

procedure Tfrm_CPCSeleccion.FormClose(Sender: TObject;
  var Action: TCloseAction);
begin
  if ModalResult <> mrOk then
    CancelEditSession;
end;

procedure Tfrm_CPCSeleccion.FormShow(Sender: TObject);
begin
  BeginEditSession;

  // binding SIEMPRE (no confíes en diseño)
  ds1.DataSet := QcodCPC;
  dbGridConnect_SelCPC.DataSource := ds1;

  dbGridConnect_SelCPC.Active := True;
  grid_SeleccionCPC.Visible := False;

  if (edt_filtro.Text.Trim <> '') and (Length(edt_filtro.Text.Trim) > 2) then
  begin
    filtrarCodCPC(edt_filtro.Text);
  end;
end;

procedure Tfrm_CPCSeleccion.grabaCPCenRecurso(codCPCdB, TipoCPC,
  porcentajeCPC: string);
var
  qry: TUniQuery;
begin
  qry := TUniQuery.Create(nil);
  try
    with qry do
    begin
      Connection := dmodule_1.con2;
      Close;
      sql.Clear;
      sql.Add('update recursos set codCPC=:codCPC, tipoCPC=:tipoCPC, porcentajeCPC=:porcentajeCPC where idUnico='
        + quotedStr(lbl_idUnicoRecursoAsignado.Text) + ' and codBase=' +
        quotedStr(base_activa.codBase));
      Prepare;
      ParamByName('codCPC').AsString := codCPCdB;
      ParamByName('tipoCPC').AsString := TipoCPC;
      ParamByName('porcentajeCPC').AsString := porcentajeCPC;
      ExecSQL;
    end;
  finally
    qry.Free;
  end;
end;

procedure Tfrm_CPCSeleccion.EjecutaOpcion(ARow: Integer);
var
  porcentajeCPC: string;
  TipoCPC: string;
  modoTrabajo: Integer;

  function GridRowToRecNo(const Row: Integer): Integer;
  begin
    // En TMSFNCGrid normalmente:
    // - Row=0 es header
    // - Row=1 es primer registro
    // Si tu grid no tiene header, ajusta aquí.
    Result := Row;
    if Result < 1 then
      Result := 1;
  end;

begin
  modoTrabajo := StrToIntDef(lbl_adicional.Text, -1);

  if not QcodCPC.Active then
    Exit;

  // Asegura fila válida
  if ARow <= 0 then
    Exit;

  // Posiciona el dataset EXACTO al registro mostrado en la fila del grid
  try
    QcodCPC.RecNo := GridRowToRecNo(ARow);
  except
    // Si RecNo no aplica (raro en TUniQuery), salimos para evitar aplicar mal
    Exit;
  end;

  // Lee del dataset correcto (QcodCPC)
  codCPC := QcodCPCcodCPC.AsString; // o FieldByName('codCPC').AsString
  TipoCPC := QcodCPCTipo.AsString; // o FieldByName('tipo').AsString
  porcentajeCPC := QcodCPCPorcentaje.AsString; // o FieldByName('porcentaje').AsString

  case modoTrabajo of
    1:
      begin
        actualizaCPCBasesDatos(lbl_modo.Text, codCPC, TipoCPC, porcentajeCPC, True);
        dmodule_1.untbl2.Active := True;
        dmodule_1.untbl2.Open;
        dmodule_1.untbl2.Refresh;
        sincronizaDesagCPC();
        limpiaGridDesagregacion();
        sincronizaDesagregacion();
      end;

    2:
      begin
        dmodule_1.untbl2.Active := True;
        dmodule_1.untbl2.Refresh;
      end;

    3:
      begin
        dmodule_1.untbl2.Active := True;
        dmodule_1.untbl2.Refresh;

        frmMain.grid_Recursos.Cells[7, StrToInt(lbl_posGrid.Text)] := codCPC;
        frmMain.grid_Recursos.AutoSizeColumn(7);
        frmMain.grid_Recursos.Repaint;

        grabaCPCenRecurso(codCPC, TipoCPC, porcentajeCPC);
      end;
  end;
end;

procedure Tfrm_CPCSeleccion.grid_SeleccionCPCCellDblClick(Sender: TObject;
  ACol, ARow: Integer);
begin
  if Acol = 4 then
    grid_SeleccionCPC.Options.Editing.Enabled := True
  else
    rect_Aceptar.OnClick(rect_Aceptar);
end;

procedure Tfrm_CPCSeleccion.grid_SeleccionCPCCellEditDone(Sender: TObject;
  ACol, ARow: Integer; CellEditor: TTMSFNCGridEditor);
var
  P: Double;
  TipoNuevo: string;

  function AlmostEqual(const A, B, Eps: Double): Boolean;
  begin
    Result := Abs(A - B) <= Eps;
  end;

  function CalcTipo(const Porc: Double): string;
  begin
    if AlmostEqual(Porc, 0.0, 1E-9) then
      Exit('NP');
    if AlmostEqual(Porc, 100.0, 1E-6) then
      Exit('EP');
    if (Porc > 0.0) and (Porc < 100.0) then
      Exit('ND');
    Result := '';
  end;

begin
  if not QcodCPC.Active then
    Exit;

  // campos persistentes tuyos: QcodCPCPorcentaje / QcodCPCTipo
  P := QcodCPCPorcentaje.AsFloat;
  TipoNuevo := CalcTipo(P);
  if TipoNuevo = '' then
    Exit;

  if SameText(QcodCPCTipo.AsString, TipoNuevo) then
    Exit;

  QcodCPC.Edit;
  QcodCPCTipo.AsString := TipoNuevo;
  QcodCPC.Post;

  // OJO: con CachedUpdates=True, esto NO se guarda aún en BD.
end;

procedure Tfrm_CPCSeleccion.lbl_1MouseDown(Sender: TObject;
  Button: TMouseButton; Shift: TShiftState; X, Y: Single);
begin
  Self.StartWindowDrag;
end;

procedure Tfrm_CPCSeleccion.rctngl_moverMouseDown(Sender: TObject;
  Button: TMouseButton; Shift: TShiftState; X, Y: Single);
begin
  Self.StartWindowDrag;
end;

procedure Tfrm_CPCSeleccion.rect_AceptarClick(Sender: TObject);
var
  ARow: Integer;
begin
  grid_SeleccionCPC.CancelEdit;

  ARow := grid_SeleccionCPC.Selection.StartRow;
  if ARow <= 0 then
  begin
    ModalResult := mrCancel;
    Exit;
  end;

  // Ejecuta sobre el registro realmente seleccionado en el grid/dataset
  EjecutaOpcion(ARow);

  CommitEditSession;
  ModalResult := mrOk;
end;

procedure Tfrm_CPCSeleccion.rect_CancelarClick(Sender: TObject);
begin
  // Descarta cambios pendientes del query
  grid_SeleccionCPC.CancelEdit;
  CancelEditSession;
  ModalResult := mrCancel;
end;

end.

