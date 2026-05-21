unit uNuevaBase;

interface

uses
  System.SysUtils, System.Types, System.UITypes, System.Classes, System.Variants, FMX.Types, FMX.Controls,
  FMX.Forms, FMX.Graphics, FMX.Dialogs, FMX.Objects, FMX.Layouts, FMX.Controls.Presentation, FMX.StdCtrls,
  FMX.Effects, FMX.Edit, FMX.Ani, FMX.ListBox, FMX.Memo.Types, FMX.ScrollBox, FMX.Memo,
  System.Net.URLClient, System.Net.HttpClient, System.Net.HttpClientComponent,
  System.JSON,
  Uni;

type
  {
    Formulario para crear o editar una Base:

    - Modo 1 (lbl_modo = '1'): Crear nueva base (llama a GuardaNuevaBase).
    - Modo 2 (lbl_modo = '2'): Actualizar base existente (llama a ActualizaBaseDatos).

    Además:
    - Permite configurar país y obtiene el tipo de cambio vía HTTP (API JSON, sin WebView).
    - Maneja parámetros básicos de la base (nombre, descripción, indirectos, etc.).
  }
  TfrmNuevaBase = class(TForm)
    lyt_Background: TLayout;
    lyt_Body: TLayout;
    rect_2: TRectangle;
    lyt_3: TLayout;
    rect_3: TRectangle;
    lyt_6: TLayout;
    rect_4: TRectangle;
    lyt_DatosGenerales: TLayout;
    lyt_9: TLayout;
    lbl_3: TLabel;
    ln_ln1: TLine;
    grdpnlyt1: TGridPanelLayout;
    lyt_10: TLayout;
    lbl_4: TLabel;
    lyt_11: TLayout;
    rect_5: TRectangle;
    Shadow_NombreBase: TShadowEffect;
    edt_NombreBase: TEdit;
    lyt_12: TLayout;
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
    lbl_11: TLabel;
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
    fAngle_1: TFloatAnimation;
    chk_SeguridadIndustrial: TCheckBox;
    lbl_7: TLabel;
    mmo_Observaciones: TMemo;
    Shadow_Observaciones: TShadowEffect;
    lyt_7: TLayout;
    lbl_2: TLabel;
    lyt_footer: TLayout;
    rect_Cancelar: TRectangle;
    iGlow_Cancelar: TInnerGlowEffect;
    rect_Aceptar: TRectangle;
    iGlow_Aceptar: TInnerGlowEffect;
    lyt_header: TLayout;
    rect_1: TRectangle;
    lyt_Pais: TLayout;
    lyt_112: TLayout;
    lbl_15: TLabel;
    ln_1: TLine;
    fAngle_11: TFloatAnimation;
    grdpnlyt111: TGridPanelLayout;
    lyt_113: TLayout;
    lbl_16: TLabel;
    lyt_114: TLayout;
    cbb_pais: TComboBox;
    lyt_115: TLayout;
    lbl_17: TLabel;
    lyt_116: TLayout;
    lbl_modo: TLabel;
    lbl_moneda: TLabel;
    lbl_moneda_pais: TLabel;
    tmr_SubInicio: TTimer;
    procedure FormCreate(Sender: TObject);
    procedure rect_1MouseDown(Sender: TObject; Button: TMouseButton;
      Shift: TShiftState; X, Y: Single);
    procedure rect_CloseMouseUp(Sender: TObject; Button: TMouseButton;
      Shift: TShiftState; X, Y: Single);
    procedure edt_NombreBaseEnter(Sender: TObject);
    procedure edt_NombreBaseExit(Sender: TObject);
    procedure edt_DescripcionEnter(Sender: TObject);
    procedure edt_DescripcionExit(Sender: TObject);
    procedure edt_IndirectosEnter(Sender: TObject);
    procedure edt_IndirectosExit(Sender: TObject);
    procedure mmo_ObservacionesEnter(Sender: TObject);
    procedure mmo_ObservacionesExit(Sender: TObject);
    procedure rect_CancelarMouseEnter(Sender: TObject);
    procedure rect_CancelarMouseLeave(Sender: TObject);
    procedure rect_AceptarMouseEnter(Sender: TObject);
    procedure rect_AceptarMouseLeave(Sender: TObject);
    procedure cbb_paisChange(Sender: TObject);
    procedure FormShow(Sender: TObject);
    procedure tmr_SubInicioTimer(Sender: TObject);
    procedure rect_AceptarClick(Sender: TObject);
    procedure rect_CancelarClick(Sender: TObject);
  private
    FHttp: TNetHTTPClient;
    procedure ObtenerTipoCambio(const ACodPais: string);
    procedure ProcesarJSONCambio(const AJSON: string; const ACodPais: string);
    procedure ActualizaBaseDatos;
  public
    procedure iniciaTomaDatos;
    procedure daCambioMoneda(const codMonedaPais: string);
  end;

var
  frmNuevaBase: TfrmNuevaBase;

implementation

{$R *.fmx}

uses
  DM1, uMain;

procedure TfrmNuevaBase.FormCreate(Sender: TObject);
begin
  FHttp := TNetHTTPClient.Create(Self);
  FHttp.ConnectionTimeout := 10000;
  FHttp.ResponseTimeout := 10000;
end;

procedure TfrmNuevaBase.ActualizaBaseDatos;
var
  qry: TUniQuery;
  FS: TFormatSettings;
  vIndirectos: Double;
begin
  qry := TUniQuery.Create(nil);
  try
    qry.Connection := DModule_1.con2;

    // 🔧 Formato decimal seguro (MySQL = punto)
    FS := TFormatSettings.Create;
    FS.DecimalSeparator := '.';

    vIndirectos :=
      StrToFloatDef(
        StringReplace(Trim(edt_Indirectos.Text), ',', '.', [rfReplaceAll]),
        0,
        FS
      );

    qry.Close;
    qry.UnPrepare;
    qry.SQL.Clear;
    qry.Params.Clear;

    qry.SQL.Text :=
      'CALL actualizarBaseYRecalcularAPUS(' +
      ':codBase, :descripcion, :indirectos, :seguridadIndustrial, ' +
      ':observaciones, :pais, :cambioAplicado, :moneda, :fechaHora)';

    qry.Prepare;

    qry.ParamByName('codBase').AsString :=
      base_activa.codBase;

    qry.ParamByName('descripcion').AsString :=
      edt_Descripcion.Text;

    qry.ParamByName('indirectos').AsFloat :=
      vIndirectos;

    qry.ParamByName('seguridadIndustrial').AsInteger :=
      Ord(chk_SeguridadIndustrial.IsChecked); // MySQL INT

    qry.ParamByName('observaciones').AsString :=
      mmo_Observaciones.Text;

    qry.ParamByName('pais').AsString :=
      cbb_pais.Items[cbb_pais.ItemIndex];

    qry.ParamByName('cambioAplicado').AsString :=
      lbl_moneda.Text;

    qry.ParamByName('moneda').AsString :=
      lbl_moneda_pais.Text;

    qry.ParamByName('fechaHora').AsDateTime :=
      Now;

    qry.ExecSQL;

  finally
    qry.Free;
  end;
end;

{ ==== PAISES Y MONEDA (API JSON, SIN WEBVIEW) =============================== }

procedure TfrmNuevaBase.cbb_paisChange(Sender: TObject);
var
  codPais: string;
begin
  // Seguridad: evitar acceso fuera de rango a listadoCodigoPaises
  if (cbb_pais.ItemIndex < 0) or
    (cbb_pais.ItemIndex >= listadoCodigoPaises.Count) then
    Exit;

  codPais := listadoCodigoPaises[cbb_pais.ItemIndex];

  // Solo recarga el tipo de cambio si el formulario está visible
  if Visible then
    daCambioMoneda(codPais);
end;

procedure TfrmNuevaBase.daCambioMoneda(const codMonedaPais: string);
begin
  if codMonedaPais = '' then
    Exit;

  ObtenerTipoCambio(codMonedaPais);
end;

procedure TfrmNuevaBase.ObtenerTipoCambio(const ACodPais: string);
var
  URL: string;
  Resp: IHTTPResponse;
begin
  // API estable en JSON. Base = moneda del país. Convertimos a USD.
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

procedure TfrmNuevaBase.ProcesarJSONCambio(const AJSON: string; const ACodPais: string);
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

    // compatibilidad
    frmNuevaBase.lbl_moneda.Text := lbl_moneda.Text;

  finally
    JSONObject.Free;
  end;
end;

{ ==== CICLO DE VIDA DEL FORMULARIO ========================================== }

procedure TfrmNuevaBase.FormShow(Sender: TObject);
begin
  // Usamos el timer para inicializar combos y moneda una vez mostrado el form
  tmr_SubInicio.Enabled := True;
end;

procedure TfrmNuevaBase.tmr_SubInicioTimer(Sender: TObject);
var
  codPais: string;
begin
  tmr_SubInicio.Enabled := False;

  // Cargar lista de países desde listadoPaises
  cbb_pais.Clear;
  cbb_pais.Items.Text := listadoPaises.Text;

  // Posicionar combo según país de la base activa (si existe)
  if (base_activa.pais <> '') and (cbb_pais.Items.Count > 0) then
    posicionaCombo(cbb_pais, base_activa.pais)
  else if cbb_pais.Items.Count > 0 then
    cbb_pais.ItemIndex := 0;

  // Seguridad: evitar ItemIndex fuera de rango
  if (cbb_pais.ItemIndex < 0) or
    (cbb_pais.ItemIndex >= listadoCodigoPaises.Count) then
    Exit;

  codPais := listadoCodigoPaises[cbb_pais.ItemIndex];
  daCambioMoneda(codPais);
end;

{ ==== INICIALIZACIÓN DE CONTROLES ========================================== }

procedure TfrmNuevaBase.iniciaTomaDatos;
begin
  // Reseteo de campos de entrada
  edt_NombreBase.Text := '';
  edt_Descripcion.Text := '';
  edt_Indirectos.Text := decimal_correcto('18.00');
  mmo_Observaciones.Text := '';
  chk_SeguridadIndustrial.IsChecked := False;

  // Solo fijamos índices si hay ítems cargados
  if cbb_UTiempos.Count > 0 then
    cbb_UTiempos.ItemIndex := 0;

  if cbb_Rendimiento.Count > 0 then
    cbb_Rendimiento.ItemIndex := 0;
end;

{ ==== EFECTOS DE SOMBRA Y FOCUS VISUAL ===================================== }

procedure TfrmNuevaBase.edt_DescripcionEnter(Sender: TObject);
begin
  Shadow_Descripcion.Enabled := True;
end;

procedure TfrmNuevaBase.edt_DescripcionExit(Sender: TObject);
begin
  Shadow_Descripcion.Enabled := False;
end;

procedure TfrmNuevaBase.edt_IndirectosEnter(Sender: TObject);
begin
  Shadow_Indirectos.Enabled := True;
end;

procedure TfrmNuevaBase.edt_IndirectosExit(Sender: TObject);
begin
  Shadow_Indirectos.Enabled := False;
end;

procedure TfrmNuevaBase.edt_NombreBaseEnter(Sender: TObject);
begin
  Shadow_NombreBase.Enabled := True;
end;

procedure TfrmNuevaBase.edt_NombreBaseExit(Sender: TObject);
begin
  Shadow_NombreBase.Enabled := False;
end;

procedure TfrmNuevaBase.mmo_ObservacionesEnter(Sender: TObject);
begin
  Shadow_Observaciones.Enabled := True;
end;

procedure TfrmNuevaBase.mmo_ObservacionesExit(Sender: TObject);
begin
  Shadow_Observaciones.Enabled := False;
end;

{ ==== INTERFAZ: ARRASTRE Y BOTONES ========================================= }

procedure TfrmNuevaBase.rect_1MouseDown(Sender: TObject; Button: TMouseButton;
  Shift: TShiftState; X, Y: Single);
begin
  // Permite arrastrar la ventana desde la barra superior
  Self.StartWindowDrag;
end;

procedure TfrmNuevaBase.rect_CloseMouseUp(Sender: TObject;
  Button: TMouseButton; Shift: TShiftState; X, Y: Single);
begin
  // Cierra el formulario (se utiliza como botón de cierre en header)
  ModalResult := mrOk;
end;

procedure TfrmNuevaBase.rect_AceptarClick(Sender: TObject);
var
  modo: Integer;
begin
  iGlow_Aceptar.Enabled := False;
  modo := StrToIntDef(lbl_modo.Text, 0);
  case modo of
    1:
      begin
        GuardaNuevaBase;
        if base_activa.nombre <> '' then
          muestraOPC(True);
      end;
    2:
      begin
        ActualizaBaseDatos;
        activaBaseDatos(base_activa.codBase);
      end;
  end;
  ModalResult := mrOk;
end;

procedure TfrmNuevaBase.rect_AceptarMouseEnter(Sender: TObject);
begin
  iGlow_Aceptar.Enabled := True;
end;

procedure TfrmNuevaBase.rect_AceptarMouseLeave(Sender: TObject);
begin
  iGlow_Aceptar.Enabled := False;
end;

procedure TfrmNuevaBase.rect_CancelarClick(Sender: TObject);
begin
  ModalResult := mrCancel;
end;

procedure TfrmNuevaBase.rect_CancelarMouseEnter(Sender: TObject);
begin
  iGlow_Cancelar.Enabled := True;
end;

procedure TfrmNuevaBase.rect_CancelarMouseLeave(Sender: TObject);
begin
  iGlow_Cancelar.Enabled := False;
end;

end.
