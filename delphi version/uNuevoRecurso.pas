unit uNuevoRecurso;

interface

uses
  System.SysUtils, System.Types, System.UITypes, System.Classes,
  System.Variants, FMX.Types,
  FMX.Controls, FMX.Forms, FMX.Graphics, FMX.Dialogs, FMX.Memo.Types,
  FMX.Effects, FMX.ScrollBox,
  FMX.Memo, FMX.StdCtrls, FMX.ListBox, FMX.Ani, Uni, FMX.Edit, FMX.Layouts,
  FMX.Objects, Data.DB,
  FMX.Controls.Presentation, FMX.EditBox, FMX.NumberBox, FormUtils,
  EditNumericHelper, uRectfillBitmapColoriz;

type
  TfrmNuevoRecurso = class(TForm)
    lyt_Background: TLayout;
    lyt_Body: TLayout;
    rect_2: TRectangle;
    lyt_3: TLayout;
    rect_3: TRectangle;
    lyt_6: TLayout;
    rect_4: TRectangle;
    lyt_DatosGenerales: TLayout;
    grdpnlyt1: TGridPanelLayout;
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
    Shadow_Precio: TShadowEffect;
    lyt_19: TLayout;
    lbl_13: TLabel;
    lyt_110: TLayout;
    cbb_UTiempos: TComboBox;
    rect_addUnidades: TRectangle;
    rect_editUnidades: TRectangle;
    lyt_RendimientoBase: TLayout;
    mmo_Especificaciones: TMemo;
    Shadow_especificaciones: TShadowEffect;
    lbl_7: TLabel;
    lyt_7: TLayout;
    lbl_banner2: TLabel;
    lyt_footer: TLayout;
    rect_Cancelar: TRectangle;
    iGlow_Cancelar: TInnerGlowEffect;
    rect_Aceptar: TRectangle;
    iGlow_Aceptar: TInnerGlowEffect;
    lbl_CodCategoria: TLabel;
    lbl_CodSubCategoria: TLabel;
    lbl_Modo: TLabel;
    lbl_codRecurso: TLabel;
    lyt_header: TLayout;
    rect_1: TRectangle;
    lbl_banner1: TLabel;
    lyt_17: TLayout;
    lbl_12: TLabel;
    lyt_18: TLayout;
    rctngl_14: TRectangle;
    shadow_Shadow_codCPC: TShadowEffect;
    edt_codCPC: TEdit;
    rctngl_Buscar: TRectangle;
    inrglwfctGlow_1: TInnerGlowEffect;
    stylbk_1: TStyleBook;
    lbl_idUnicoRecurso: TLabel;
    edt_precio: TEdit;

    procedure FormClose(Sender: TObject; var Action: TCloseAction);

    // Efectos visuales
    procedure rect_CancelarMouseEnter(Sender: TObject);
    procedure rect_CancelarMouseLeave(Sender: TObject);
    procedure rect_AceptarMouseEnter(Sender: TObject);
    procedure rect_AceptarMouseLeave(Sender: TObject);
    procedure rect_CancelarMouseUp(Sender: TObject; Button: TMouseButton;
      Shift: TShiftState; X, Y: Single);

    // Sombras de controles
    procedure edt_DescripcionEnter(Sender: TObject);
    procedure edt_DescripcionExit(Sender: TObject);
    procedure edt_PrecioEnter(Sender: TObject);
    procedure edt_PrecioExit(Sender: TObject);
    procedure mmo_EspecificacionesEnter(Sender: TObject);
    procedure mmo_EspecificacionesExit(Sender: TObject);

    procedure rect_closeMouseUp(Sender: TObject; Button: TMouseButton;
      Shift: TShiftState; X, Y: Single);

    // Arrastrar ventana
    procedure rect_1MouseDown(Sender: TObject; Button: TMouseButton;
      Shift: TShiftState; X, Y: Single);

    // Handlers heredados para un edit antiguo (mantengo por compatibilidad)
    procedure edt1Enter(Sender: TObject);
    procedure edt1Exit(Sender: TObject);
    procedure rect_addUnidadesClick(Sender: TObject);
    procedure rect_editUnidadesClick(Sender: TObject);
    procedure cbb_UTiemposChange(Sender: TObject);
    procedure FormShow(Sender: TObject);
    procedure edt_precioKeyUp(Sender: TObject; var Key: Word;
      var KeyChar: WideChar; Shift: TShiftState);
    procedure rect_AceptarClick(Sender: TObject);
    procedure FormCreate(Sender: TObject);
    procedure rctngl_BuscarClick(Sender: TObject);
    procedure edt_codCPCKeyUp(Sender: TObject; var Key: Word;
      var KeyChar: WideChar; Shift: TShiftState);
    procedure rect_addUnidadesMouseEnter(Sender: TObject);
    procedure rect_addUnidadesMouseLeave(Sender: TObject);
    procedure rect_editUnidadesMouseEnter(Sender: TObject);
    procedure rect_editUnidadesMouseLeave(Sender: TObject);
  private
    { Private declarations }

    FSubCategoriaUnidades: string;
    FInTxn: Boolean;
    FCommitted: Boolean;

    procedure BeginFormTransaction;
    procedure CommitFormTransaction;
    procedure RollbackFormTransaction;

    function ParsePrecioToFloat(const S: string): Double;
    function ComboTextBeforeParen(const S: string): string;
    function CategoriaApusExisteFK(const ACodBase, ACodCategoriaBase,
      ACodSubCategoria: string): Boolean;

    // Inserta un recurso nuevo en la BD
    procedure addNuevoRecurso;

    // Actualiza un recurso existente (por idUnico)
    procedure editaNuevoRecurso;

    // Comprueba si el CPC existe en la tabla codCPC
    function codCPCCorrecto: Boolean;

    // Obtiene el código CPC a partir de una descripción
    function daCodCPC(const descripcionCPC: string): string;

    // Obtiene la descripcion larga de la unidad medida
    procedure daDescripcionUM();

  public
    { Public declarations }
    automatico: Boolean;
    unidadRecurso: string;

    // Rellena el combo de unidades para la subcategoría indicada
    procedure populaUnidadesRecursos(const subCategoria: string);

    procedure ProcesarAceptar;

    // Comprueba si ya existe un recurso con misma descripción y unidad en la base activa
    function estaItemDuplicado(const descripcion, medida: string): Boolean;

    function existeCodCPC(codCPC: string): Boolean;
  end;

var
  frmNuevoRecurso: TfrmNuevoRecurso;

implementation

{$R *.fmx}

uses
  DM1, uCPCSeleccion, uPregunta, uMain, uEditorUnidades;

procedure TfrmNuevoRecurso.BeginFormTransaction;
begin
  FCommitted := False;
  FInTxn := False;

  if (DModule_1 = nil) or (DModule_1.con2 = nil) then
    Exit;

  if not DModule_1.con2.Connected then
    DModule_1.con2.Connect;

  if not DModule_1.con2.InTransaction then
  begin
    DModule_1.con2.StartTransaction;
    BeginGuardarAPU;
    FInTxn := True;
  end;
end;

procedure TfrmNuevoRecurso.CommitFormTransaction;
begin
  if (DModule_1 = nil) or (DModule_1.con2 = nil) then
    Exit;

  if DModule_1.con2.InTransaction then
  begin
    EndGuardarAPU;
    DModule_1.con2.Commit;
    RecalcularAPUsPendientes();
    FCommitted := True;
    FInTxn := False;
  end;
end;

procedure TfrmNuevoRecurso.RollbackFormTransaction;
begin
  if (DModule_1 = nil) or (DModule_1.con2 = nil) then
    Exit;

  // Solo rollback si NO se confirmó
  if (not FCommitted) and DModule_1.con2.InTransaction then
  begin
    DModule_1.con2.Rollback;
    FInTxn := False;
  end;
end;

{ --------------------------------------------------------------------------- }
{ INSERCIÓN Y EDICIÓN DE RECURSOS }
{ --------------------------------------------------------------------------- }

function TfrmNuevoRecurso.ComboTextBeforeParen(const S: string): string;
var
  p: Integer;
begin
  Result := Trim(S);
  p := Pos('(', Result);
  if p > 0 then
    Result := Trim(Copy(Result, 1, p - 1));
end;

function TfrmNuevoRecurso.ParsePrecioToFloat(const S: string): Double;
var
  tmp: string;
  fs: TFormatSettings;
begin
  // normaliza primero
  tmp := decimal_correcto(Trim(S));

  // intenta con locale actual
  if TryStrToFloat(tmp, Result) then
    Exit;

  // intenta forzando punto decimal
  fs := TFormatSettings.Create;
  fs.DecimalSeparator := '.';
  fs.ThousandSeparator := ',';
  if TryStrToFloat(tmp, Result, fs) then
    Exit;

  // intenta forzando coma decimal
  fs.DecimalSeparator := ',';
  fs.ThousandSeparator := '.';
  if TryStrToFloat(tmp, Result, fs) then
    Exit;

  Result := 0;
end;

procedure TfrmNuevoRecurso.daDescripcionUM;
var
  qry: TUniQuery;
  tmpstr: string;
begin
  unidadRecurso := '';

  if (cbb_UTiempos.ItemIndex < 0) or (cbb_UTiempos.Items.Count = 0) then
    Exit;

  if Trim(FSubCategoriaUnidades) = '' then
    FSubCategoriaUnidades := Trim(lbl_CodSubCategoria.Text);
  // fallback, si tu label realmente guarda la subcategoría

  tmpstr := ComboTextBeforeParen(cbb_UTiempos.Items[cbb_UTiempos.ItemIndex]);

  if (tmpstr = '') or (Trim(FSubCategoriaUnidades) = '') then
    Exit;

  qry := TUniQuery.Create(nil);
  try
    qry.Connection := DModule_1.con2;
    {(*}
    qry.SQL.Text :=
        'SELECT ' +
        '  descripcion ' +
        'FROM unidades ' +
        'WHERE ' +
        '  descripcion_completa = :descripcion_completa AND ' +
        '  subcategoria = :subcategoria ' +
        'LIMIT 1';
    {*)}
    qry.ParamByName('descripcion_completa').AsString := tmpstr;
    qry.ParamByName('subcategoria').AsString := FSubCategoriaUnidades;
    qry.Open;

    if not qry.Eof then
      unidadRecurso := qry.FieldByName('descripcion').AsString;

  finally
    qry.Free;
  end;
end;

function TfrmNuevoRecurso.CategoriaApusExisteFK(const ACodBase,
  ACodCategoriaBase, ACodSubCategoria: string): Boolean;
var
  Q: TUniQuery;
  CatInt, CiuInt: Integer;
begin
  Result := False;

  if not TryStrToInt(Trim(ACodCategoriaBase), CatInt) then
    Exit;
  if not TryStrToInt(Trim(ACodSubCategoria), CiuInt) then
    Exit;

  Q := TUniQuery.Create(nil);
  try
    Q.Connection := DModule_1.con2;
    Q.SQL.Text :=
      {(*}
      'SELECT 1 ' +
      'FROM categoriaapus ' +
      'WHERE ' +
      '  codBase = :codBase AND ' +
      '  Categoria_base = :cat AND ' +
      '  Ciu = :ciu ' +
      'LIMIT 1';
    {*)}
    Q.ParamByName('codBase').AsString := Trim(ACodBase);
    Q.ParamByName('cat').AsInteger := CatInt;
    Q.ParamByName('ciu').AsInteger := CiuInt;
    Q.Open;
    Result := not Q.Eof;
  finally
    Q.Free;
  end;
end;

procedure TfrmNuevoRecurso.addNuevoRecurso;
var
  qry: TUniQuery;
  codRecurso: string;
  codCategoriaBase: string;
  codSubCategoria: string;
  idUnicoRecurso: string;
  fechaHoraModificacion: TDateTime;
  precioVal: Double;
begin
  // Validaciones mínimas
  if not Assigned(DModule_1) or not Assigned(DModule_1.con2) then
    raise Exception.Create('Conexión DB no disponible (con2=nil).');

  codCategoriaBase := Trim(lbl_CodCategoria.Text);
  codSubCategoria := Trim(lbl_CodSubCategoria.Text);

  if codCategoriaBase = '' then
    raise Exception.Create('codCategoriaBase vacío.');
  if codSubCategoria = '' then
    raise Exception.Create('codSubCategoria vacío.');

  if Trim(edt_Descripcion.Text) = '' then
    raise Exception.Create('Debe ingresar una descripción.');

  if Trim(unidadRecurso) = '' then
    raise Exception.Create('Debe seleccionar una unidad de medida.');

  idUnicoRecurso := 'Rsr' + generaCodigoUnico;
  fechaHoraModificacion := Now;

  codRecurso := nuevoCodigoRecurso(codCategoriaBase, codSubCategoria);
  if Trim(codRecurso) = '' then
    raise Exception.Create('No se pudo generar codRecurso.');

  precioVal := ParsePrecioToFloat(edt_precio.Text);

  qry := TUniQuery.Create(nil);
  try
    qry.Connection := DModule_1.con2;
    {(*}
    qry.SQL.Text :=
      'INSERT INTO recursos ' +
      '( ' +
      '  codRecurso, ' +
      '  idUnico, ' +
      '  codCategoriaBase, ' +
      '  codSubCategoria, ' +
      '  descripcion, ' +
      '  unidad, ' +
      '  precio, ' +
      '  precioLocal, ' +
      '  codCPC, ' +
      '  Especificaciones2, ' +
      '  fechaHoraCreacion, ' +
      '  codBase, ' +
      '  ultimaModificacion' +
      ') ' +
      'VALUES ' +
      '( ' +
      '  :codRecurso, ' +
      '  :idUnico, ' +
      '  :codCategoriaBase, ' +
      '  :codSubCategoria, ' +
      '  :descripcion, ' +
      '  :unidad, ' +
      '  :precio, ' +
      '  :precioLocal, ' +
      '  :codCPC, ' +
      '  :Especificaciones2, ' +
      '  :fechaHoraCreacion, ' +
      '  :codBase, ' +
      '  :ultimaModificacion' +
      ')';
    {*)}
    qry.Prepare;

    // Tipar parámetros "problemáticos" para MySQL prepared (evita crash en SetAsDateTime)
    with qry.ParamByName('fechaHoraCreacion') do
    begin
      DataType := ftDateTime;
      ParamType := ptInput;
    end;

    with qry.ParamByName('ultimaModificacion') do
    begin
      DataType := ftDateTime;
      ParamType := ptInput;
    end;

    // (Opcional, pero recomendable) tipar numéricos para evitar strings raros
    with qry.ParamByName('precio') do
    begin
      DataType := ftFloat;
      ParamType := ptInput;
    end;

    with qry.ParamByName('precioLocal') do
    begin
      DataType := ftFloat;
      ParamType := ptInput;
    end;

    // Asignación de parámetros
    qry.ParamByName('codRecurso').AsString := codRecurso;
    qry.ParamByName('idUnico').AsString := idUnicoRecurso;
    qry.ParamByName('codCategoriaBase').AsInteger := StrToInt(codCategoriaBase);
    qry.ParamByName('codSubCategoria').AsInteger := StrToInt(codSubCategoria);
    qry.ParamByName('descripcion').AsString := Trim(edt_Descripcion.Text);
    qry.ParamByName('unidad').AsString := unidadRecurso;

    qry.ParamByName('precio').AsFloat := precioVal;
    qry.ParamByName('precioLocal').AsFloat := precioVal;

    qry.ParamByName('codCPC').AsString := Trim(edt_codCPC.Text);
    qry.ParamByName('Especificaciones2').AsString := mmo_Especificaciones.Text;

    qry.ParamByName('codBase').AsString := base_activa.codBase;

    qry.ParamByName('fechaHoraCreacion').AsDateTime := fechaHoraModificacion;
    qry.ParamByName('ultimaModificacion').AsDateTime := fechaHoraModificacion;

    // Exec robusto
    try
      if not CategoriaApusExisteFK(base_activa.codBase, codCategoriaBase,
        codSubCategoria) then
        raise Exception.Create('FK categoriaapus no cumple (categoriaapus).' +
          sLineBreak + 'codBase=' + base_activa.codBase + sLineBreak +
          'codCategoriaBase=' + codCategoriaBase + sLineBreak +
          'codSubCategoria=' + codSubCategoria);

      qry.ExecSQL;
    except
      on E: Exception do
      begin
        // mensaje útil (quítalo si no quieres UI aquí)
        MuestraMensajeGiproy('Error DB', E.Message);
        raise;
      end;
    end;

  finally
    qry.Free;
  end;
end;

procedure TfrmNuevoRecurso.editaNuevoRecurso;
var
  qry: TUniQuery;
  idUnicoRecurso: string;
  precioStr: string;
  descripcion: string;
begin
  idUnicoRecurso := lbl_idUnicoRecurso.Text;

  // Si por lo que sea no hay idUnico, no podemos editar
  if idUnicoRecurso = '' then
    Exit;

  descripcion := edt_Descripcion.Text.Trim;

  precioStr := decimal_correcto(edt_precio.Text);

  qry := TUniQuery.Create(nil);
  try
    qry.Connection := DModule_1.con2;
    qry.Close;
    qry.SQL.Clear;
    {(*}
    qry.SQL.Add('update recursos set ' +
                '  descripcion = :descripcion, ' +
                '  unidad = :unidad, ' +
                '  precio = :precio, ' +
                '  codCPC = :codCPC, ' +
                '  especificaciones2 = :especificaciones2, ' +
                '  ultimaModificacion = :ultimaModificacion ' +
                'WHERE ' +
                '  idUnico = :idUnico AND ' +
                '  codBase = :codBase');
    {*)}
    qry.Prepare;

    qry.ParamByName('descripcion').AsString := descripcion;
    qry.ParamByName('unidad').AsString := unidadRecurso;
    qry.ParamByName('precio').AsFloat := ParsePrecioToFloat(precioStr);
    qry.ParamByName('codCPC').AsString := edt_codCPC.Text.Trim;
    qry.ParamByName('especificaciones2').AsString := mmo_Especificaciones.Text;
    qry.ParamByName('ultimaModificacion').AsDateTime := Now;
    qry.ParamByName('idUnico').AsString := idUnicoRecurso;
    qry.ParamByName('codBase').AsString := base_activa.codBase;

    qry.ExecSQL;

    // Actualiza la información en grillas/listas ya cargadas
    actualizaDatosRecurso(idUnicoRecurso, descripcion, unidadRecurso,
      precioStr);
  finally
    qry.Free;
  end;
end;

{ --------------------------------------------------------------------------- }
{ CPC }
{ --------------------------------------------------------------------------- }

procedure TfrmNuevoRecurso.cbb_UTiemposChange(Sender: TObject);
begin
  daDescripcionUM();
end;

function TfrmNuevoRecurso.codCPCCorrecto: Boolean;
var
  qry: TUniQuery;
begin
  Result := False;

  if edt_codCPC.Text.Trim = '' then
    Exit;

  qry := TUniQuery.Create(nil);
  try
    qry.Connection := DModule_1.con2;
    qry.Close;
    qry.SQL.Clear;
    { (* }
    qry.SQL.Text := 'SELECT 1 FROM codCPC WHERE codCPC = :codCPC LIMIT 1';
    { *) }
    qry.ParamByName('codCPC').AsString := edt_codCPC.Text.Trim;
    qry.Open;
    Result := not qry.IsEmpty;
  finally
    qry.Free;
  end;
end;

function TfrmNuevoRecurso.daCodCPC(const descripcionCPC: string): string;
var
  qry: TUniQuery;
begin
  Result := '';
  if descripcionCPC.Trim = '' then
    Exit;

  qry := TUniQuery.Create(nil);
  try
    qry.Connection := DModule_1.con2;
    qry.Close;
    qry.SQL.Clear;
    { (* }
    qry.SQL.Text := 'SELECT ' + '  codCPC ' + 'FROM codCPC ' + 'WHERE ' +
      '  descripcion = :descripcion ' + 'LIMIT 1';
    { *) }

    qry.ParamByName('descripcion').AsString := descripcionCPC.Trim;
    qry.Open;

    if not qry.IsEmpty then
      Result := qry.FieldByName('codCPC').AsString;
  finally
    qry.Free;
  end;
end;

{ --------------------------------------------------------------------------- }
{ COMPROBAR DUPLICADOS }
{ --------------------------------------------------------------------------- }

function TfrmNuevoRecurso.estaItemDuplicado(const descripcion,
  medida: string): Boolean;
var
  qry: TUniQuery;
  idActual: string;
begin
  Result := False;

  idActual := Trim(lbl_idUnicoRecurso.Text); // vacío si es nuevo

  qry := TUniQuery.Create(nil);
  try
    qry.Connection := DModule_1.con2;
    {(*}
    qry.SQL.Text := 'SELECT ' +
                    '  idUnico ' +
                    'FROM recursos ' +
                    'WHERE ' +
                    '  descripcion  = :descripcion AND ' +
                    '  unidad       = :unidad AND ' +
                    '  codBase      = :codBase AND' +
                    '  (:idActual = '''' or idUnico <> :idActual) ' +
                    'LIMIT 1';
    {*)}
    qry.ParamByName('descripcion').AsString := Trim(descripcion);
    qry.ParamByName('unidad').AsString := Trim(medida);
    qry.ParamByName('codBase').AsString := base_activa.codBase;
    qry.ParamByName('idActual').AsString := idActual;
    qry.Open;

    Result := not qry.Eof;
  finally
    qry.Free;
  end;
end;

{ --------------------------------------------------------------------------- }
{ COMPRUEBA EXISTENCIA COD CPC }
{ --------------------------------------------------------------------------- }
function TfrmNuevoRecurso.existeCodCPC(codCPC: string): Boolean;
var
  qry: TUniQuery;
begin
  Result := False;
  if Trim(codCPC) = '' then
    Exit;

  qry := TUniQuery.Create(nil);
  try
    qry.Connection := DModule_1.con2;
    qry.Close;
    qry.SQL.Clear;
    qry.SQL.Add
      ('select 1 as respuesta from codCPC where codCPC = :codCPC Limit 1');
    qry.ParamByName('codCPC').AsString := codCPC;
    qry.Open;
    if qry.FieldByName('respuesta').AsString.Trim <> '' then
      Result := True
    else
      Result := False;
  finally
    qry.Free;
  end;
end;

{ --------------------------------------------------------------------------- }
{ UNIDADES DE MEDIDA }
{ --------------------------------------------------------------------------- }
procedure TfrmNuevoRecurso.populaUnidadesRecursos(const subCategoria: string);
var
  qry: TUniQuery;
  tmpstr: string;
begin
  cbb_UTiempos.Clear;
  FSubCategoriaUnidades := Trim(subCategoria);

  if FSubCategoriaUnidades = '' then
    Exit;

  qry := TUniQuery.Create(nil);
  try
    qry.Connection := DModule_1.con2;
    qry.SQL.Text := 'SELECT ' +
      '  descripcion, ' +
      '  descripcion_completa ' +
      'FROM unidades ' +
      'WHERE ' +
      '  subcategoria = :subcategoria ' +
      'ORDER BY fechaHora asc';
    qry.ParamByName('subcategoria').AsString := FSubCategoriaUnidades;
    qry.Open;

    while not qry.Eof do
    begin
      tmpstr := qry.FieldByName('descripcion_completa').AsString + ' (' +
        qry.FieldByName('descripcion').AsString + ')';
      cbb_UTiempos.Items.Add(tmpstr);
      qry.Next;
    end;

  finally
    qry.Free;
    if cbb_UTiempos.Items.Count > 0 then
      cbb_UTiempos.ItemIndex := 0;
  end;

  daDescripcionUM; // deja unidadRecurso listo
end;

{ --------------------------------------------------------------------------- }
{ EFECTOS VISUALES Y ENTRADAS }
{ --------------------------------------------------------------------------- }

procedure TfrmNuevoRecurso.edt1Enter(Sender: TObject);
begin
  // Handler heredado (probablemente asignado al precio en versiones anteriores)

end;

procedure TfrmNuevoRecurso.edt1Exit(Sender: TObject);
begin
  edt_precio.Text := NormalizaDecimalTexto(edt_precio.Text);
  Shadow_Precio.Enabled := False;
end;

procedure TfrmNuevoRecurso.edt_codCPCKeyUp(Sender: TObject; var Key: Word;
  var KeyChar: WideChar; Shift: TShiftState);
begin
  if (Key = VKReturn) and (Length(edt_codCPC.Text.Trim) > 2) then
  begin
    rctngl_Buscar.OnClick(rctngl_Buscar);
  end;
end;

procedure TfrmNuevoRecurso.edt_DescripcionEnter(Sender: TObject);
begin
  Shadow_Descripcion.Enabled := True;
end;

procedure TfrmNuevoRecurso.edt_DescripcionExit(Sender: TObject);
begin
  Shadow_Descripcion.Enabled := False;
end;

procedure TfrmNuevoRecurso.edt_PrecioEnter(Sender: TObject);
begin
  Shadow_Precio.Enabled := True;
end;

procedure TfrmNuevoRecurso.edt_PrecioExit(Sender: TObject);
begin
  Shadow_Precio.Enabled := False;
  edt_precio.Text := NormalizaDecimalTexto(edt_precio.Text);
end;

procedure TfrmNuevoRecurso.edt_precioKeyUp(Sender: TObject; var Key: Word;
  var KeyChar: WideChar; Shift: TShiftState);
begin
  if Key = VKReturn then
    edt_precio.Text := NormalizaDecimalTexto(edt_precio.Text);
end;

procedure TfrmNuevoRecurso.mmo_EspecificacionesEnter(Sender: TObject);
begin
  Shadow_especificaciones.Enabled := True;
end;

procedure TfrmNuevoRecurso.mmo_EspecificacionesExit(Sender: TObject);
begin
  // Bug original: dejaba la sombra en True. Lo ponemos a False al salir.
  Shadow_especificaciones.Enabled := False;
end;

procedure TfrmNuevoRecurso.rect_1MouseDown(Sender: TObject;
  Button: TMouseButton; Shift: TShiftState; X, Y: Single);
begin
  Self.StartWindowDrag;
end;

procedure TfrmNuevoRecurso.rect_AceptarClick(Sender: TObject);
begin
  ProcesarAceptar;
end;

procedure TfrmNuevoRecurso.ProcesarAceptar;
var
  codCategoria, codSubCategoria: string;
  cpcValido: Boolean;
begin
  // Validaciones básicas
  if edt_Descripcion.Text.Trim = '' then
  begin
    MuestraMensajeGiproy('Advertencia',
      'Debe indicar una descripción para el recurso.');
    Exit;
  end;

  if (cbb_UTiempos.ItemIndex < 0) or (cbb_UTiempos.Items.Count = 0) then
  begin
    MuestraMensajeGiproy('Advertencia',
      'Debe seleccionar una unidad de medida.');
    Exit;
  end;

  cpcValido := existeCodCPC(edt_codCPC.Text);
  if not cpcValido then
    edt_codCPC.Text := '';
  try
    if lbl_Modo.Text = 'nuevo' then
    begin
      if not estaItemDuplicado(edt_Descripcion.Text, unidadRecurso) then
      begin
        addNuevoRecurso;
        CommitFormTransaction; // <-- AQUÍ

        codCategoria := lbl_CodCategoria.Text;
        codSubCategoria := lbl_CodSubCategoria.Text;
        ModalResult := mrOk;
      end
      else
      begin
        if not automatico then
          MuestraMensajeGiproy('Advertencia', 'Recurso ya creado.');
      end;
    end
    else if lbl_Modo.Text = 'editar' then
    begin
      editaNuevoRecurso;
      CommitFormTransaction; // <-- AQUÍ

      codCategoria := lbl_CodCategoria.Text;
      codSubCategoria := lbl_CodSubCategoria.Text;
      ModalResult := mrOk;
    end;

    // solo refresca grids si se confirmó
    if ModalResult = mrOk then
      MuestraRecursosGrid(codCategoria, codSubCategoria);

  except
    on E: Exception do
    begin
      // si algo falla, revierte todo lo que se intentó
      RollbackFormTransaction;
      raise;
    end;
  end;
end;

procedure TfrmNuevoRecurso.rect_AceptarMouseEnter(Sender: TObject);
begin
  iGlow_Aceptar.Enabled := True;
end;

procedure TfrmNuevoRecurso.rect_AceptarMouseLeave(Sender: TObject);
begin
  // Bug original: se quedaba en True. Al salir lo desactivamos.
  iGlow_Aceptar.Enabled := False;
end;

procedure TfrmNuevoRecurso.rect_CancelarMouseEnter(Sender: TObject);
begin
  iGlow_Cancelar.Enabled := True;
end;

procedure TfrmNuevoRecurso.rect_CancelarMouseLeave(Sender: TObject);
begin
  iGlow_Cancelar.Enabled := False;
end;

procedure TfrmNuevoRecurso.FormClose(Sender: TObject; var Action: TCloseAction);
begin
  RollbackFormTransaction;
  // Nos aseguramos de que la descripción vuelve a ser editable
  edt_Descripcion.ReadOnly := False;
end;

procedure TfrmNuevoRecurso.FormCreate(Sender: TObject);
begin
  // Solo enteros
  TEditNumericHelper.OnlyIntegers(edt_codCPC);
  automatico := False;
end;

procedure TfrmNuevoRecurso.FormShow(Sender: TObject);
begin
  BeginFormTransaction;
  daDescripcionUM;
end;

{ --------------------------------------------------------------------------- }
{ BOTONES EXTRA: UNIDADES Y CPC }
{ --------------------------------------------------------------------------- }

procedure TfrmNuevoRecurso.rect_addUnidadesClick(Sender: TObject);
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
    LForm.subcategoria := lbl_CodCategoria.Text;
    LForm.CentrarSobre(Self.rect_4);
    LForm.ShowModal;
  finally
    LForm.Free;
  end;

end;

procedure TfrmNuevoRecurso.rect_addUnidadesMouseEnter(Sender: TObject);
begin
  TRectFillBitmapColorizer.Apply(rect_addUnidades, $FFF39200);
end;

procedure TfrmNuevoRecurso.rect_addUnidadesMouseLeave(Sender: TObject);
begin
  TRectFillBitmapColorizer.Restore(rect_addUnidades);
end;

procedure TfrmNuevoRecurso.rect_editUnidadesClick(Sender: TObject);
var
  LForm: Tfrm_editorUnidades;
  tmpstr: string;
  X: Integer;
begin
  // Edita unidad de medida
  LForm := Tfrm_editorUnidades.Create(Application);
  try
    LForm.lbl_banner1.Text := 'Editar Unidad de Medida';
    LForm.old_descripcion := unidadRecurso;
    tmpstr := cbb_UTiempos.Items[cbb_UTiempos.ItemIndex];
    X := AnsiPos('(', tmpstr);
    tmpstr := Copy(tmpstr, 1, X - 1).Trim;
    LForm.old_descripcion_completa := tmpstr;
    LForm.subCategoria := lbl_CodCategoria.Text;
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

procedure TfrmNuevoRecurso.rect_editUnidadesMouseEnter(Sender: TObject);
begin
  TRectFillBitmapColorizer.Apply(rect_editUnidades, $FFF39200);
end;

procedure TfrmNuevoRecurso.rect_editUnidadesMouseLeave(Sender: TObject);
begin
  TRectFillBitmapColorizer.Restore(rect_editUnidades);
end;

procedure TfrmNuevoRecurso.rctngl_BuscarClick(Sender: TObject);
var
  LForm: Tfrm_CPCSeleccion;
begin
  LForm := Tfrm_CPCSeleccion.Create(Application);
  try
    LForm.edt_filtro.Text := edt_codCPC.Text.Trim;
    LForm.lbl_adicional.Text := '2';
    LForm.ShowModal;

    if LForm.ModalResult = mrOk then
      if LForm.codCPC.Trim <> '' then
        edt_codCPC.Text := LForm.codCPC;
  finally
    LForm.Free;
  end;
end;

procedure TfrmNuevoRecurso.rect_closeMouseUp(Sender: TObject;
  Button: TMouseButton; Shift: TShiftState; X, Y: Single);
begin
  RollbackFormTransaction;
  ModalResult := MrCancel;
end;

procedure TfrmNuevoRecurso.rect_CancelarMouseUp(Sender: TObject;
  Button: TMouseButton; Shift: TShiftState; X, Y: Single);
begin
  RollbackFormTransaction;
  ModalResult := MrCancel;
end;

end.

