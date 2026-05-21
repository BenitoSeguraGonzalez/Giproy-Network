unit uConfiguracion;

interface

uses
  System.SysUtils, System.Types, System.UITypes, System.Classes, System.Variants,
  FMX.Types, FMX.Controls, FMX.Forms, FMX.Graphics, FMX.Dialogs,
  FMX.Controls.Presentation, FMX.StdCtrls, FMX.Objects, FMX.Layouts,
  FMX.TabControl, FMX.ListBox, Uni, Data.DB, system.StrUtils, uMain, FMX.Edit,
  FMX.EditBox, FMX.NumberBox, FMX.Effects;
const
  COL_BASE = $FF606060;
  COL_RESALTADO = $FFF39200;
  COL_SELECCIONADO = $FFE94F1A;
type
  TfrmConfiguracion = class(TForm)
    lyt_Background: TLayout;
    lyt_header: TLayout;
    rect_1: TRectangle;
    lbl_banner1: TLabel;
    Rectangle1: TRectangle;
    lyt_Body: TLayout;
    lyt_footer: TLayout;
    lyt2: TLayout;
    rect_Aceptar: TRectangle;
    lbl1: TLabel;
    Layout1: TLayout;
    Layout2: TLayout;
    lbl_apu: TLabel;
    Layout3: TLayout;
    Layout4: TLayout;
    GridPanelLayout1: TGridPanelLayout;
    lyt1: TLayout;
    rct_C1: TRectangle;
    lbl_41: TLabel;
    Layout5: TLayout;
    rct_C2: TRectangle;
    Label1: TLabel;
    Layout6: TLayout;
    rct_C3: TRectangle;
    Label2: TLabel;
    TabConfiguracion: TTabControl;
    TabC1: TTabItem;
    TabC2: TTabItem;
    TabC3: TTabItem;
    TabC4: TTabItem;
    Layout8: TLayout;
    Layout22: TLayout;
    Label11: TLabel;
    cbb_cfgAnalisisPrecios: TComboBox;
    Layout25: TLayout;
    Label14: TLabel;
    cbb_cfgActaConstitucion: TComboBox;
    Layout28: TLayout;
    Label17: TLabel;
    cbb_cfgEquipoProyecto: TComboBox;
    Layout29: TLayout;
    Label18: TLabel;
    cbb_cfgDescomposicionOrganizacion: TComboBox;
    Layout32: TLayout;
    Label21: TLabel;
    cbb_cfgEDTDiccionario: TComboBox;
    Layout33: TLayout;
    Label22: TLabel;
    cbb_cfgEDTListado: TComboBox;
    Layout34: TLayout;
    Label23: TLabel;
    cbb_cfgEDTValorada: TComboBox;
    Layout23: TLayout;
    Label12: TLabel;
    cbb_cfgPresupuestos: TComboBox;
    Layout24: TLayout;
    Label13: TLabel;
    cbb_cfgCronoValorado: TComboBox;
    Layout26: TLayout;
    Label15: TLabel;
    cbb_cfgCronoTrabajo: TComboBox;
    Layout27: TLayout;
    Label16: TLabel;
    cbb_cfgDesagrecacionTecnologica: TComboBox;
    Layout30: TLayout;
    Label19: TLabel;
    cbb_cfgFormulaPolinomica: TComboBox;
    Layout31: TLayout;
    Label20: TLabel;
    cbb_cfgPorcentajeIndirecto: TComboBox;
    Layout35: TLayout;
    Label24: TLabel;
    cbb_cfgGestionTiempos: TComboBox;
    Layout9: TLayout;
    Layout10: TLayout;
    GridPanelLayout2: TGridPanelLayout;
    Layout11: TLayout;
    Layout12: TLayout;
    Label4: TLabel;
    Label5: TLabel;
    Label6: TLabel;
    NB_NDecimalesPresupuesto: TNumberBox;
    NB_NDecimalesMoneda: TNumberBox;
    Glow_NDecimalesPresupuesto: TGlowEffect;
    Glow_NDecimalesMoneda: TGlowEffect;
    Layout7: TLayout;
    GridPanelLayout3: TGridPanelLayout;
    Layout13: TLayout;
    Label3: TLabel;
    Layout14: TLayout;
    Label7: TLabel;
    NB_PrimerSecuencial: TNumberBox;
    Glow_PrimerSecuencial: TGlowEffect;
    Label8: TLabel;
    Layout15: TLayout;
    Label9: TLabel;
    NB_SegundoSecuencial: TNumberBox;
    Glow_SegundoSecuencial: TGlowEffect;
    edt_PrimerValor: TEdit;
    Glow_PrimerValor: TGlowEffect;
    procedure rect_AceptarClick(Sender: TObject);
    procedure rct_C3Click(Sender: TObject);
    procedure rct_C1MouseEnter(Sender: TObject);
    procedure rct_C1MouseLeave(Sender: TObject);
    procedure rct_C2MouseEnter(Sender: TObject);
    procedure rct_C2MouseLeave(Sender: TObject);
    procedure rct_C3MouseEnter(Sender: TObject);
    procedure rct_C3MouseLeave(Sender: TObject);
    procedure rct_C4MouseLeave(Sender: TObject);
    procedure FormCreate(Sender: TObject);
    procedure FormShow(Sender: TObject);
    procedure rct_C1Click(Sender: TObject);
    procedure rct_C2Click(Sender: TObject);
    procedure NB_NDecimalesPresupuestoKeyDown(Sender: TObject; var Key: Word;
      var KeyChar: WideChar; Shift: TShiftState);
    procedure NB_NDecimalesMonedaKeyDown(Sender: TObject; var Key: Word;
      var KeyChar: WideChar; Shift: TShiftState);
    procedure NB_NDecimalesPresupuestoEnter(Sender: TObject);
    procedure NB_NDecimalesPresupuestoExit(Sender: TObject);
    procedure NB_NDecimalesMonedaEnter(Sender: TObject);
    procedure NB_NDecimalesMonedaExit(Sender: TObject);
    procedure edt_PrimerValorEnter(Sender: TObject);
    procedure edt_PrimerValorExit(Sender: TObject);
    procedure NB_PrimerSecuencialEnter(Sender: TObject);
    procedure NB_PrimerSecuencialExit(Sender: TObject);
    procedure NB_SegundoSecuencialEnter(Sender: TObject);
    procedure NB_SegundoSecuencialExit(Sender: TObject);
  private
    { Private declarations }
    Seleccion: integer;
    procedure CambiaColor(opcion: integer);
    procedure SeleccionOpcion(opcion: integer);
    procedure IniciaCombosConfiguracion();
    procedure CumplimentaComboConfiguracion(comboCfg: TComboBox);
    procedure SetComboFromRecord(const FieldName: string; Combo: TComboBox);
    procedure BorraConfiguracionReportes();

    procedure GuardarTodaConfiguracion();

    procedure GuardarConfiguracionReportes();
    procedure GuardarSecuenciales();
    procedure GuardarConfiguracionDecimales();

  public
    { Public declarations }
  end;

var
  frmConfiguracion: TfrmConfiguracion;

implementation

{$R *.fmx}
uses DM1, uRectFillBitmapColoriz;

// =======================================
procedure TfrmConfiguracion.SetComboFromRecord(const FieldName: string; Combo: TComboBox);
var
  V: string;
  F: TField;
begin
  if Combo = nil then
    Exit;

  if fieldname = 'RConstitucionProyecto' then
    V := frmMain.Reportes.ActaConstitucion;

  if fieldname = 'RAnalisisPrecios' then
    V := frmMain.Reportes.AnalisisPrecios;

  if fieldname = 'RCronogramaTrabajo' then
    V := frmMain.Reportes.CronoTrabajo;

  if fieldname = 'RCronogramaValorado' then
    V := frmMain.Reportes.CronoValorado;

  if fieldname = 'RDesagregacionTecnologica' then
    V := frmMain.Reportes.DesagregacionTecnologica;

  if fieldname = 'REDTDiccionario' then
    V := frmMain.Reportes.EDTDiccionario;

  if fieldname = 'REDTListado' then
    V := frmMain.Reportes.EDTListado;

  if fieldname = 'REDTValorada' then
    V := frmMain.Reportes.EDTValorada;

  if fieldname = 'REquipoProyecto' then
    V := frmMain.Reportes.EquipoProyecto;

  if fieldname = 'RDescomposicionOrganizacion' then
    V := frmMain.Reportes.DesagregacionTecnologica;

  if fieldname = 'RFormulaPolinomicas' then
    V := frmMain.Reportes.FormulaPolinomica;

  if fieldname = 'RGestionTiempos' then
    V := frmMain.Reportes.GestionTiempos;

  if fieldname = 'RPorcentajeIndirectos' then
    V := frmMain.Reportes.PorcentajeIndirecto;

  if fieldname = 'RPresupuestos' then
    V := frmMain.Reportes.Presupuesto;

  if fieldname = 'RCurvaS' then
    V := frmMain.Reportes.CurvasS;

  V := Trim(V);

  if V <> '' then
    posicionaCombo(Combo, V)
  else
    combo.ItemIndex := 0;
end;

procedure TfrmConfiguracion.IniciaCombosConfiguracion();
begin
  cumplimentaComboConfiguracion(cbb_cfgActaConstitucion);
  cumplimentaComboConfiguracion(cbb_cfgAnalisisPrecios);
  cumplimentaComboConfiguracion(cbb_cfgCronoTrabajo);
  cumplimentaComboConfiguracion(cbb_cfgCronoValorado);
  cumplimentaComboConfiguracion(cbb_cfgDesagrecacionTecnologica);
  cumplimentaComboConfiguracion(cbb_cfgEDTDiccionario);
  cumplimentaComboConfiguracion(cbb_cfgEDTListado);
  cumplimentaComboConfiguracion(cbb_cfgEDTValorada);
  cumplimentaComboConfiguracion(cbb_cfgEquipoProyecto);
  cumplimentaComboConfiguracion(cbb_cfgDescomposicionOrganizacion);
  cumplimentaComboConfiguracion(cbb_cfgFormulaPolinomica);
  cumplimentaComboConfiguracion(cbb_cfgGestionTiempos);
  cumplimentaComboConfiguracion(cbb_cfgPorcentajeIndirecto);
  cumplimentaComboConfiguracion(cbb_cfgPresupuestos);

  SetComboFromRecord('RConstitucionProyecto', cbb_cfgActaConstitucion);
  SetComboFromRecord('RAnalisisPrecios', cbb_cfgAnalisisPrecios);
  SetComboFromRecord('RCronogramaTrabajo', cbb_cfgCronoTrabajo);
  SetComboFromRecord('RCronogramaValorado', cbb_cfgCronoValorado);
  SetComboFromRecord('RDesagregacionTecnologica', cbb_cfgDesagrecacionTecnologica);
  SetComboFromRecord('REDTDiccionario', cbb_cfgEDTDiccionario);
  SetComboFromRecord('REDTListado', cbb_cfgEDTListado);
  SetComboFromRecord('REDTValorada', cbb_cfgEDTValorada);
  SetComboFromRecord('REquipoProyecto', cbb_cfgEquipoProyecto);
  SetComboFromRecord('RDescomposicionOrganizacion', cbb_cfgDescomposicionOrganizacion);
  SetComboFromRecord('RFormulaPolinomicas', cbb_cfgFormulaPolinomica);
  SetComboFromRecord('RGestionTiempos', cbb_cfgGestionTiempos);
  SetComboFromRecord('RPorcentajeIndirectos', cbb_cfgPorcentajeIndirecto);
  SetComboFromRecord('RPresupuestos', cbb_cfgPresupuestos);
  // SetComboFromRecord('RCurvaS', cbb_cfgCurvaS);

end;

procedure TfrmConfiguracion.NB_NDecimalesMonedaEnter(Sender: TObject);
begin
  Glow_NDecimalesMoneda.Enabled := True;
end;

procedure TfrmConfiguracion.NB_NDecimalesMonedaExit(Sender: TObject);
begin
  Glow_NDecimalesMoneda.Enabled := False;
end;

procedure TfrmConfiguracion.NB_NDecimalesMonedaKeyDown(Sender: TObject;
  var Key: Word; var KeyChar: WideChar; Shift: TShiftState);
begin
  if key = vkESCape then
    NB_NDecimalesMoneda.Value := ndecimalesMoneda;
end;

procedure TfrmConfiguracion.NB_NDecimalesPresupuestoEnter(Sender: TObject);
begin
  Glow_NDecimalesPresupuesto.Enabled := True;
end;

procedure TfrmConfiguracion.NB_NDecimalesPresupuestoExit(Sender: TObject);
begin
  Glow_NDecimalesPresupuesto.Enabled := False;
end;

procedure TfrmConfiguracion.NB_NDecimalesPresupuestoKeyDown(Sender: TObject;
  var Key: Word; var KeyChar: WideChar; Shift: TShiftState);
begin
  if key = vkESCape then
    NB_NdecimalesPresupuesto.Value := ndecimalesPresupuesto;
end;

procedure TfrmConfiguracion.NB_PrimerSecuencialEnter(Sender: TObject);
begin
  Glow_PrimerSecuencial.Enabled := True;
end;

procedure TfrmConfiguracion.NB_PrimerSecuencialExit(Sender: TObject);
begin
  Glow_PrimerSecuencial.Enabled := False;
end;

procedure TfrmConfiguracion.NB_SegundoSecuencialEnter(Sender: TObject);
begin
  Glow_SegundoSecuencial.Enabled := True;
end;

procedure TfrmConfiguracion.NB_SegundoSecuencialExit(Sender: TObject);
begin
  Glow_SegundoSecuencial.Enabled := False;
end;

procedure TfrmConfiguracion.cumplimentaComboConfiguracion(comboCfg: TComboBox);
var
  nombreCombo: string;
  folderCombo: string;
  rutaArchivosReporte: string;
  listadoReportes: TStringList;
  x: Integer;
  tmpstr: string;
begin
  comboCfg.Items.Clear;
  nombreCombo := comboCfg.Name;
  if nombreCombo = 'cbb_cfgActaConstitucion' then
    folderCombo := folder_actaConstitucion;
  if nombreCombo = 'cbb_cfgAnalisisPrecios' then
    folderCombo := folder_analisis;
  if nombreCombo = 'cbb_cfgCronoTrabajo' then
    folderCombo := folder_cronogramaTrabajo;
  if nombreCombo = 'cbb_cfgCronoValorado' then
    folderCombo := folder_cronogramaValorado;
  if nombreCombo = 'cbb_cfgDesagrecacionTecnologica' then
    folderCombo := folder_desagregacionTecnologica;
  if nombreCombo = 'cbb_cfgEDTDiccionario' then
    folderCombo := folder_EDTDiccionario;
  if nombreCombo = 'cbb_cfgEDTListado' then
    folderCombo := folder_EDTListado;
  if nombreCombo = 'cbb_cfgEDTValorada' then
    folderCombo := folder_EDTValorada;
  if nombreCombo = 'cbb_cfgEquipoProyecto' then
    folderCombo := folder_equipoProyecto;
  if nombreCombo = 'cbb_cfgDescomposicionOrganizacion' then
    folderCombo := folder_DescomposicionOrganizacion;
  if nombreCombo = 'cbb_cfgFormulaPolinomica' then
    folderCombo := folder_formulasPolinomicas;
  if nombreCombo = 'cbb_cfgPorcentajeIndirecto' then
    folderCombo := folder_porcentajesIndirectos;
  if nombreCombo = 'cbb_cfgPresupuestos' then
    folderCombo := folder_presupuestos;
  if nombreCombo = 'cbb_cfgGestionTiempos' then
    folderCombo := folder_GestionTiempos;
  rutaArchivosReporte := rutaApp + 'Plantillas\' + folderCombo;
  listadoReportes := TStringList.Create;
  ArchivosDirectorio(rutaArchivosReporte, '*.zip', listadoReportes, True);
  for x := 0 to listadoReportes.Count - 1 do
  begin
    tmpstr := listadoReportes[x];
    tmpstr := ExtractFileName(tmpstr);
    tmpstr := ReplaceStr(tmpstr, '.zip', '');
    comboCfg.Items.Add(tmpstr);
  end;
  comboCfg.itemindex := 0;
end;

procedure TfrmConfiguracion.edt_PrimerValorEnter(Sender: TObject);
begin
  Glow_PrimerValor.Enabled := True;
end;

procedure TfrmConfiguracion.edt_PrimerValorExit(Sender: TObject);
begin
  Glow_PrimerValor.Enabled := False;
end;

procedure TfrmConfiguracion.BorraConfiguracionReportes();
var
  qry: TUniQuery;
  textoQry: string;
begin
  qry := TUniQuery.Create(nil);
  {(*}
  textoQry :=
    '  DELETE ' +
    'FROM ' +
    '  presupuestos_configreportes cr ' +
    'WHERE ' +
    '  cr.codPresupuesto = :codPresupuesto ' +
    '  AND cr.Revision = :revision  ';
  { *) }
  try
    with qry do
    begin
      Connection := DModule_1.con2;
      close;
      sql.Clear;
      sql.Text := textoQry;
      Prepare;
      ParamByName('codPresupuesto').asstring :=
        frmMain.edt_CodigoPresupuesto1.Text;
      ParamByName('revision').AsInteger :=
        StrToIntDef(frmMain.lbl_RevisionPresupuesto.Text, 0);
      ExecSql;
    end;
  finally
    qry.Free;
  end;

end;

procedure TfrmConfiguracion.GuardarConfiguracionDecimales;
var
  qry: TUniQuery;
  vDec, vDecMon: Integer;
begin
  qry := TUniQuery.Create(nil);
  try
    qry.Connection := DModule_1.con2;

    qry.SQL.Text :=
      'UPDATE empresas_config ' +
      'SET ' +
      '  nDecimales = :nDecimales, ' +
      '  nDecimalesMoneda = :nDecimalesMoneda ' +
      'WHERE CodUnico = :CodUnico';

    // Float -> Integer (NumberBox devuelve Double)
    vDec    := Trunc(NB_nDecimalesPresupuesto.Value);
    vDecMon := Trunc(NB_nDecimalesMoneda.Value);

    // Seguridad básica (evitar valores inválidos)
    if vDec < 0 then vDec := 0;
    if vDecMon < 0 then vDecMon := 0;

    // Opcional: límite razonable
    if vDec > 6 then vDec := 6;
    if vDecMon > 6 then vDecMon := 6;

    qry.ParamByName('nDecimales').AsInteger := vDec;
    qry.ParamByName('nDecimalesMoneda').AsInteger := vDecMon;
    qry.ParamByName('CodUnico').AsString := codProyecto;

    qry.ExecSQL;

  finally
    qry.Free;
  end;
end;

procedure TfrmConfiguracion.GuardarConfiguracionReportes();
var
  qry: TUniQuery;
  textoQry, textoQry2: string;
  tmpstr: string;
begin
  {(*}
  textoQry :=
    'SELECT ' +
    '  id ' +
    'FROM ' +
    '  presupuestos_datosgenerales pd ' +
    'WHERE ' +
    '  pd.codPresupuesto = :codPresupuesto ' +
    '  AND pd.revision = :revision';
  {*)}

  {(*}
  textoQry2 :=
    'INSERT INTO presupuestos_configreportes ' +
    '( ' +
    '  codPresupuesto ' +
    ' ,revision ' +
    ' ,RConstitucionProyecto ' +
    ' ,RAnalisisPrecios ' +
    ' ,RCronogramaTrabajo ' +
    ' ,RCronogramaValorado ' +
    ' ,RDesagregacionTecnologica ' +
    ' ,RDesagregacionTecnologicaAPUS ' +
    ' ,REDTDiccionario ' +
    ' ,REDTListado ' +
    ' ,REDTValorada ' +
    ' ,REquipoProyecto ' +
    ' ,RDescomposicionOrganizacion ' +
    ' ,RFormulaPolinomicas ' +
    ' ,RGestionTiempos ' +
    ' ,RPorcentajeIndirectos ' +
    ' ,RPresupuestos ' +
    ' ,RCurvaS ' +
    ') ' +
    'VALUES ' +
    '( ' +
    '  :codPresupuesto ' +
    ' ,:revision ' +
    ' ,:RConstitucionProyecto ' +
    ' ,:RAnalisisPrecios ' +
    ' ,:RCronogramaTrabajo ' +
    ' ,:RCronogramaValorado ' +
    ' ,:RDesagregacionTecnologica ' +
    ' ,:RDesagregacionTecnologicaAPUS ' +
    ' ,:REDTDiccionario ' +
    ' ,:REDTListado ' +
    ' ,:REDTValorada ' +
    ' ,:REquipoProyecto ' +
    ' ,:RDescomposicionOrganizacion ' +
    ' ,:RFormulaPolinomicas ' +
    ' ,:RGestionTiempos ' +
    ' ,:RPorcentajeIndirectos ' +
    ' ,:RPresupuestos ' +
    ' ,:RCurvaS ' +
    ')';
  {*)}
  if TRIM(codProyecto) <> '' then
  begin
    qry := TUniQuery.Create(nil);
    try
      with qry do
      begin
        Connection := DModule_1.con2;
        close;
        sql.Clear;
        sql.Text := textoQry;
        ParamByName('codPresupuesto').asstring := codProyecto;
        ParamByName('revision').AsInteger := StrToIntDef(revision, 0);
        Prepare;
        ExecSql;
        tmpstr := FieldByName('id').asstring;
        tmpstr := Trim(tmpstr);
        if tmpstr <> '' then
        begin
          borraConfiguracionReportes();
          close;
          sql.Clear;
          sql.Text := textoQry2;
          Prepare;
          ParamByName('codPresupuesto').asstring := codProyecto;
          ParamByName('revision').AsInteger := StrToIntDef(revision, 0);
          ParamByName('RConstitucionProyecto').asstring :=
            cbb_cfgActaConstitucion.Items[cbb_cfgActaConstitucion.itemindex];
          ParamByName('RAnalisisPrecios').asstring :=
            cbb_cfgAnalisisPrecios.Items[cbb_cfgAnalisisPrecios.itemindex];
          ParamByName('RCronogramaTrabajo').asstring :=
            cbb_cfgCronoTrabajo.Items[cbb_cfgCronoTrabajo.itemindex];
          ParamByName('RCronogramaValorado').asstring :=
            cbb_cfgCronoValorado.Items[cbb_cfgCronoValorado.itemindex];
          ParamByName('RDesagregacionTecnologica').asstring :=
            cbb_cfgDesagrecacionTecnologica.Items[cbb_cfgDesagrecacionTecnologica.itemindex];
          ParamByName('RDesagregacionTecnologicaAPUS').asstring := '001 - VAE APU';
          ParamByName('REDTDiccionario').asstring :=
            cbb_cfgEDTDiccionario.Items[cbb_cfgEDTDiccionario.itemindex];
          ParamByName('REDTListado').asstring := cbb_cfgEDTListado.Items[cbb_cfgEDTListado.itemindex];
          ParamByName('REDTValorada').asstring := cbb_cfgEDTValorada.Items[cbb_cfgEDTValorada.itemindex];
          ParamByName('REquipoProyecto').asstring :=
            cbb_cfgEquipoProyecto.Items[cbb_cfgEquipoProyecto.itemindex];
          ParamByName('RDescomposicionOrganizacion').asstring :=
            cbb_cfgDescomposicionOrganizacion.Items[cbb_cfgDescomposicionOrganizacion.itemindex];
          ParamByName('RFormulaPolinomicas').asstring :=
            cbb_cfgFormulaPolinomica.Items[cbb_cfgFormulaPolinomica.itemindex];
          ParamByName('RGestionTiempos').asstring :=
            cbb_cfgGestionTiempos.Items[cbb_cfgGestionTiempos.itemindex];
          ParamByName('RPorcentajeIndirectos').asstring :=
            cbb_cfgPorcentajeIndirecto.Items[cbb_cfgPorcentajeIndirecto.itemindex];
          ParamByName('RPresupuestos').asstring := cbb_cfgPresupuestos.Items[cbb_cfgPresupuestos.itemindex];
          ParamByName('RCurvaS').asstring := '000 - Curva S';
          ExecSql;
        end;
      end;
    finally
      // Actualizar el record de reportes

      frmMain.Reportes.ActaConstitucion := cbb_cfgActaConstitucion.Items[cbb_cfgActaConstitucion.itemindex];
      frmMain.Reportes.AnalisisPrecios := cbb_cfgAnalisisPrecios.Items[cbb_cfgAnalisisPrecios.itemindex];
      frmMain.Reportes.CronoTrabajo := cbb_cfgCronoTrabajo.Items[cbb_cfgCronoTrabajo.itemindex];
      frmMain.Reportes.CronoValorado := cbb_cfgCronoValorado.Items[cbb_cfgCronoValorado.itemindex];
      frmMain.Reportes.DesagregacionTecnologica :=
        cbb_cfgDesagrecacionTecnologica.Items[cbb_cfgDesagrecacionTecnologica.itemindex];
      frmMain.Reportes.DesagregacionTecnologicaAPUS := '001 - VAE APU';
      frmMain.Reportes.EDTDiccionario := cbb_cfgEDTDiccionario.Items[cbb_cfgEDTDiccionario.itemindex];
      frmMain.Reportes.EDTListado := cbb_cfgEDTListado.Items[cbb_cfgEDTListado.itemindex];
      frmMain.Reportes.EDTValorada := cbb_cfgEDTValorada.Items[cbb_cfgEDTValorada.itemindex];
      frmMain.Reportes.EquipoProyecto := cbb_cfgEquipoProyecto.Items[cbb_cfgEquipoProyecto.itemindex];
      frmMain.Reportes.DescomposicionOrganizacion :=
        cbb_cfgDescomposicionOrganizacion.Items[cbb_cfgDescomposicionOrganizacion.itemindex];
      frmMain.Reportes.FormulaPolinomica :=
        cbb_cfgFormulaPolinomica.Items[cbb_cfgFormulaPolinomica.itemindex];
      frmMain.Reportes.GestionTiempos := cbb_cfgGestionTiempos.Items[cbb_cfgGestionTiempos.itemindex];
      frmMain.Reportes.PorcentajeIndirecto :=
        cbb_cfgPorcentajeIndirecto.Items[cbb_cfgPorcentajeIndirecto.itemindex];
      frmMain.Reportes.Presupuesto := cbb_cfgPresupuestos.Items[cbb_cfgPresupuestos.itemindex];
      frmMain.Reportes.CurvasS := '000 - Curva S';

      qry.Free;
    end;
  end
  else
  begin
    muestraMensajeGiproy('Advertencia',
      'Se necesita un proyecto activo para guardar reportes personalizados.');
  end;
end;

procedure TfrmConfiguracion.guardarSecuenciales;
var
  qry: TUniQuery;
begin
  qry := TUniquery.Create(nil);
  try
    with qry do
    begin
      connection := DModule_1.con2;
      close;
      sql.Clear;
      {(*}
      sql.Text:=
        'UPDATE configuracion ' +
        'SET ' +
        '  PresupuestoValor1 = :PresupuestoValor1, ' +
        '  PresupuestoValor2 = :PresupuestoValor2, ' +
        '  PresupuestoValor3 = :PresupuestoValor3 ' +
        'WHERE ' +
        '  id_usuario = :id_usuario';
      {*)}
      ParamByName('id_usuario').AsInteger := UsuarioGiproy.idUsuario;
      ParamByName('PresupuestoValor1').AsString := edt_PrimerValor.Text.Trim;
      ParamByName('PresupuestoValor2').AsInteger := Trunc(NB_PrimerSecuencial.Value);
      ParamByName('PresupuestoValor3').AsInteger := Trunc(NB_SegundoSecuencial.Value);
      ExecSQL;
    end;
  finally
    qry.free;
  end;
end;

procedure TfrmConfiguracion.GuardarTodaConfiguracion;
begin
  // Evitar transacciones anidadas
  if not DModule_1.con2.InTransaction then
    DModule_1.con2.StartTransaction;
  try
    GuardarConfiguracionReportes;
    GuardarConfiguracionDecimales;
    guardarSecuenciales;

    DModule_1.con2.Commit;

  except
    on E: Exception do
    begin
      if DModule_1.con2.InTransaction then
        DModule_1.con2.Rollback;
      raise; // Propaga el error
    end;
  end;
end;

// =======================================
procedure TfrmConfiguracion.CambiaColor(opcion: integer);
begin
  rct_C1.Fill.Color := COL_BASE;
  rct_C2.Fill.Color := COL_BASE;
  rct_C3.Fill.Color := COL_BASE;

  case opcion of
    1: if opcion <> Seleccion then
        rct_C1.Fill.Color := COL_RESALTADO;
    2: if opcion <> Seleccion then
        rct_C2.Fill.Color := COL_RESALTADO;
    3: if opcion <> Seleccion then
        rct_C3.Fill.Color := COL_RESALTADO;
  end;
  case Seleccion of
    1: rct_C1.Fill.Color := COL_SELECCIONADO;
    2: rct_C2.Fill.Color := COL_SELECCIONADO;
    3: rct_C3.Fill.Color := COL_SELECCIONADO;
  end;
end;

procedure TfrmConfiguracion.FormCreate(Sender: TObject);
begin
  seleccion := 0;
  NB_NdecimalesPresupuesto.Value := ndecimalesPresupuesto;
  NB_NDecimalesMoneda.Value := ndecimalesMoneda;
end;

procedure TfrmConfiguracion.FormShow(Sender: TObject);
begin
  CambiaColor(0);
  IniciaCombosConfiguracion;
end;

procedure TfrmConfiguracion.rct_C1Click(Sender: TObject);
begin
  SeleccionOpcion(1);
end;

procedure TfrmConfiguracion.rct_C1MouseEnter(Sender: TObject);
begin
  CambiaColor(1);
end;

procedure TfrmConfiguracion.rct_C1MouseLeave(Sender: TObject);
begin
  CambiaColor(0);
end;

procedure TfrmConfiguracion.rct_C2Click(Sender: TObject);
begin
  SeleccionOpcion(2);
end;

procedure TfrmConfiguracion.rct_C2MouseEnter(Sender: TObject);
begin
  CambiaColor(2);
end;

procedure TfrmConfiguracion.rct_C2MouseLeave(Sender: TObject);
begin
  CambiaColor(0);
end;

procedure TfrmConfiguracion.rct_C3Click(Sender: TObject);
begin
  SeleccionOpcion(3);
end;

procedure TfrmConfiguracion.rct_C3MouseEnter(Sender: TObject);
begin
  CambiaColor(3);
end;

procedure TfrmConfiguracion.rct_C3MouseLeave(Sender: TObject);
begin
  CambiaColor(0);
end;

procedure TfrmConfiguracion.rct_C4MouseLeave(Sender: TObject);
begin
  CambiaColor(0);
end;

procedure TfrmConfiguracion.rect_AceptarClick(Sender: TObject);
begin
  if realizarPreguntaSiNo('¿Guardar configuración?') = mrOK then
  begin
    GuardarTodaConfiguracion;
    ModalResult := mrOK;
  end
  else
    ModalResult := mrCancel;
end;

procedure TfrmConfiguracion.SeleccionOpcion(opcion: integer);
begin
  case opcion of
    1:
      begin
        tabConfiguracion.activetab := TabC1;
        Seleccion := 1;
      end;
    2:
      begin
        tabConfiguracion.activetab := TabC2;
        Seleccion := 2;
      end;
    3:
      begin
        tabConfiguracion.activetab := TabC3;
        Seleccion := 3;
      end;
  end;
end;

end.

