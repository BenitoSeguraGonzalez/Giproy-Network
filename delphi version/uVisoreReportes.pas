unit uVisoreReportes;

interface

uses
  System.SysUtils, System.Types, System.UITypes, System.Classes, System.Variants, fmx.DialogService,
  Winapi.Windows, Winapi.ShellAPI, IOUtils, fmx.Types, fmx.Controls, fmx.Forms, fmx.Graphics,
  fmx.Dialogs, fmx.Printer, fmx.Controls.Presentation, fmx.StdCtrls, fmx.Objects, fmx.Layouts,
  fmx.Menus, FlexCel.FMXSupport, FlexCel.Core, FlexCel.XlsAdapter, FlexCel.Render, System.Actions,
  fmx.ActnList, fmx.Effects, fmx.Edit, fmx.ListBox, System.StrUtils, fmx.FlexCel.Preview, Uni,
  fmx.Ani, UPasswordDialog, UPdfExporting, UPrinting, Data.DB, MemDS, DBAccess, uLicenciasPermisos,
  Unit_UsersIni, uApiGiProy, system.JSON;

const
  punteroInicioCurvaS = 49;

type
  dat_edt = record
    codEdt: string;
    descripcion: string;
    Responsable: string;
    definicion: string;
    Valor: string;
  end;

type
  dat_datosPresupuesto = record
    codigo: string;
    codigoReferencial: string;
    revision: string;
    Titulo: string;
    Oferente: string;
    Ubicacion: string;
    Fecha: string;
    subtotal: string;
    porcentajeIVA: string;
    IVA: string;
    Total: string;
    moneda: string
  end;

type
  posExcel = record
    Columna: Integer;
    RFila: Integer;
  end;

type
  dat_actaProyecto = record
    PTitulo: string;
    PcodReferencial: string;
    PGeorefencia: TBitmap;
    PImagenProyecto: TBitmap;
    PDireccion: string;
    PCiudad: string;
    PProvincia, PPais: string;
    PObjetoContrato: string;
    PAmbitoContratacion: string;
    PTipoContrato: string;
    PTipoProyecto: string;
    PCategoriaProyecto: string;
    PTipoConstruccion: string;
    PAreaTerreno: string;
    PAreaConstruccion: string;
    PFechaInicio: string;
    PFechaFin: string;
    PPlazoTiempo: string;
  end;

type
  dat_cronogramaValorado = record
    PTitulo: string;
    POferente: string;
    PcodReferencial: string;
    PUbicacion: string;
    PFecha_Inicio: string;
    PFecha_Fin: string;
    PPlazo: string;
    PTipoPeriodo: string;
    PNumPeriodo: string;
    PTotalParcial: string;
    PTotalAcumulado: string;
    PPorcentajeParcial: string;
    PPorcentajeAcumulado: string;
    PCiudad: string;
  end;

type
  TfrmVisorReportes = class(TForm)
    lyt_header: TLayout;
    rect_1: TRectangle;
    lbl_banner1: TLabel;
    PdfSaveDialog: TSaveDialog;
    PrintDialog: TPrintDialog;
    stylbk_1: TStyleBook;
    AutofitMenu: TPopupMenu;
    NoAutofit1: TMenuItem;
    FittoWidth1: TMenuItem;
    FittoHeight1: TMenuItem;
    FittoPage1: TMenuItem;
    lyt_Body: TLayout;
    rect_2: TRectangle;
    lyt_3: TLayout;
    rect_3: TRectangle;
    lyt_6: TLayout;
    lyt_11: TLayout;
    spl1: TSplitter;
    lyt_18: TLayout;
    rect_ThumbsBkg: TRectangle;
    Thumbs: TFlexCelPreviewer;
    lyt_PanelSheets: TLayout;
    lbSheets: TListBox;
    pnl: TPanel;
    lbl_1: TLabel;
    pnl1: TPanel;
    cbAllSheets: TCheckBox;
    rect_MainBkg: TRectangle;
    MainPreview: TFlexCelPreviewer;
    tlb1: TToolBar;
    btn_ActionOpen: TButton;
    img: TImage;
    btn_ActionPdf: TButton;
    img1: TImage;
    btn_ActionPrint: TButton;
    img2: TImage;
    btn_ActionAutofit: TButton;
    img3: TImage;
    OpenDialog: TOpenDialog;
    lyt_PanelSelectPage: TLayout;
    lbl_PdfPage1: TLabel;
    lblTotalPages: TLabel;
    edPage: TEdit;
    btn_ActionZoom: TButton;
    img5: TImage;
    btn_ActionGridlines: TButton;
    img6: TImage;
    btn_ActionHeadings: TButton;
    img7: TImage;
    btn_ActionRecalc: TButton;
    img8: TImage;
    lyt_1: TLayout;
    btn_ActionGenerate: TButton;
    img11: TImage;
    btn_ActionExcel: TButton;
    img12: TImage;
    pnlPdf: TPanel;
    lyt_12: TLayout;
    btnPdfCancel: TButton;
    lbl_11: TLabel;
    lblPdfPage: TLabel;
    PdfProgressBar: TProgressBar;
    pnlPdfError: TPanel;
    lyt_13: TLayout;
    btnPdfErrorClose: TButton;
    lblPdfError: TLabel;
    pnlPdfOk: TPanel;
    lyt_14: TLayout;
    btnPdfOkClose: TButton;
    btnOpenGeneratedFile: TButton;
    lbl_12: TLabel;
    pnlPrinting: TPanel;
    lyt_15: TLayout;
    btnPrintCancel: TButton;
    lbl_13: TLabel;
    PrintProgressBar: TProgressBar;
    lblPrintPage: TLabel;
    pnlPrintingError: TPanel;
    lyt_16: TLayout;
    btnPrintingErrorClose: TButton;
    lbl_PrintingError: TLabel;
    pnlPrintingOk: TPanel;
    lyt_17: TLayout;
    btnPrintOkClose: TButton;
    lbl_14: TLabel;
    pnlZoom: TPanel;
    TrackBarZoom: TTrackBar;
    btn25: TButton;
    btn50: TButton;
    btn75: TButton;
    btn100: TButton;
    btn150: TButton;
    lyt_7: TLayout;
    lbl_descripcion: TLabel;
    lyt_footer: TLayout;
    rect___Cancelar: TRectangle;
    iGlow_Cancelar: TInnerGlowEffect;
    rect_Aceptar: TRectangle;
    iGlow_Aceptar: TInnerGlowEffect;
    lbl_adicional: TLabel;
    lbl_paquete: TLabel;
    actlst1: TActionList;
    act_GenerarReporte: TAction;
    act_ExportarPDF: TAction;
    act_ExportarExcel: TAction;
    act_Zoom: TAction;
    act_VerGuias: TAction;
    act_ActivarCabecera: TAction;
    lbl_modo: TLabel;
    chk_ConsolidarReporte: TCheckBox;
    act_Imprimir: TAction;
    chk_ConApus: TCheckBox;
    QPresupuestoItems: TUniQuery;
    lyt1: TLayout;
    lyt2: TLayout;

    procedure rect_1MouseDown(Sender: TObject; Button: TMouseButton; Shift: TShiftState; X, Y: Single);
    procedure act_GenerarReporteExecute(Sender: TObject);
    procedure FormShow(Sender: TObject);
    procedure act_ExportarExcelExecute(Sender: TObject);
    procedure FormClose(Sender: TObject; var Action: TCloseAction);
    procedure rect_AceptarClick(Sender: TObject);
    procedure lbSheetsChange(Sender: TObject);
    procedure edPageExit(Sender: TObject);
    procedure edPageKeyDown(Sender: TObject; var Key: Word; var KeyChar: Char; Shift: TShiftState);
    procedure NoAutofit1Click(Sender: TObject);
    procedure act_VerGuiasExecute(Sender: TObject);
    procedure act_ActivarCabeceraExecute(Sender: TObject);
    procedure FittoWidth1Click(Sender: TObject);
    procedure FittoHeight1Click(Sender: TObject);
    procedure FittoPage1Click(Sender: TObject);
    procedure act_ExportarPDFExecute(Sender: TObject);
    procedure btnOpenGeneratedFileClick(Sender: TObject);
    procedure btnPrintCancelClick(Sender: TObject);
    procedure btnPdfCancelClick(Sender: TObject);
    procedure btnPrintingErrorCloseClick(Sender: TObject);
    procedure btnPrintOkCloseClick(Sender: TObject);
    procedure btnPdfErrorCloseClick(Sender: TObject);
    procedure btnPdfOkCloseClick(Sender: TObject);
    procedure FormCreate(Sender: TObject);
    procedure act_ImprimirExecute(Sender: TObject);
    procedure cbAllSheetsChange(Sender: TObject);
    procedure TrackBarZoomChange(Sender: TObject);
    procedure btn25Click(Sender: TObject);
    procedure btn100Click(Sender: TObject);
    procedure btn150Click(Sender: TObject);
    procedure btn50Click(Sender: TObject);
    procedure btn75Click(Sender: TObject);
    procedure act_ZoomExecute(Sender: TObject);
    procedure act_AjusteAnchoExecute(Sender: TObject);
    procedure lyt2MouseDown(Sender: TObject; Button: TMouseButton; Shift: TShiftState; X, Y: Single);
  private
    { Private declarations }
    Xls: TExcelFile;
    ImgExport: TFlexCelImgExport;
    PrintingThread: TPrintingThread;
    PdfThread: TPdfThread;
    DisabledCount: Integer;
    ChangingZoom: boolean;
    excelProyecto: TExcelFile;
    SERCOP: boolean;
    FileNames: TArray<string>;
    datosActaProyecto: dat_actaProyecto;
    datosCronogramaValorado: dat_cronogramaValorado;
    lista_EDT: array of dat_edt;

    procedure GetPassword(const e: TOnPasswordEventArgs);
    procedure GeneraReporteTipo2();
    procedure LoadFile(const FileName: string);
    procedure EnableCommonActions(const Enable: boolean);
    procedure UpdatePages;
    procedure ChangePages;
    procedure UpdateAutofitText;
    procedure estadoActions(estado: boolean);
    procedure GeneraReportePresupuesto;
    procedure generaReporteProyecto();
    procedure ExportarExcelTipo2;
    procedure generaCuerpoPresupuesto(Xls: TExcelFile);
    procedure RecogeDatosActaProyecto();
    procedure CompletaActaProyecto();
    procedure RecogeDatosCronogramaValorado();
    procedure CompletaCronogramaValoradoDatosGenerales();
    procedure CompletaCronogramaValoradoDatosPeriodos(Xls: TExcelFile; CellInicio: posExcel);
    procedure CompletaTotalParcialCronogramaValorado(Xls: TExcelFile);
    procedure CompletaPorcentajeParcialCronogramaValorado(Xls: TExcelFile);
    procedure CompletaTotalAcumuladoCronogramaValorado(Xls: TExcelFile);
    procedure CompletaPorcentajeAcumuladoCronogramaValorado(Xls: TExcelFile);
    procedure RellenaExcelParteInicio(Xls: TExcelFile);
    procedure RellenaExcelParteCronograma(gridTratar: Integer; Xls: TExcelFile; nPeriodos: Integer);
    procedure CompletaCronogramaValoradoDatosPeriodosSERCOP(Xls: TExcelFile);
    procedure CompletaDatosCronogramaValoradoSERCOP(Xls: TExcelFile);
    procedure RecogeDatosEdt();
    procedure RecogeDatosEdt_valorada();
    procedure CompletaEDTValorada(Xls: TExcelFile);
    procedure clonarLineaXLS(Xls: TExcelFile; trigger: string);
    procedure CompletaEDTDiccionario(Xls: TExcelFile);
    procedure CompletaDirectorioEquipoAsignado(Xls: TExcelFile);
    procedure CompletaEDOAsignada(Xls: TExcelFile);
    procedure CompletaCurvaS(Xls: TExcelFile; rutaPlantillaProyecto, nombreExcelTPresupuesto: string);
    procedure rellena_en_Excel(Xls: TExcelFile; Columna: string; Fila: Integer; Valor: Variant);
    procedure CompletaEncabezadoDesagregacion(Xls: TExcelFile);
    procedure CompletaCuerpoDesagregacion(Xls: TExcelFile);
    procedure GeneraHojasApus(Xls: TExcelFile; directorioTrabajo, NexcelBase: string);
    procedure CompletaCabeceraFPolinomica(Xls: TExcelFile);
    procedure CompletaFormulaPolinomica(Xls: TExcelFile);
    procedure CompletaDesagregacionSercop(Xls: TExcelFile);
    function recibeDatosPresupuestos(): dat_datosPresupuesto;
    function daPosicionExcel(Xls: TExcelFile; parametroBusqueda: string): posExcel;
    function daCodigoSTKR(datos: string): string;
    function daResponsableyCargo(datos: string): string;
    function ajustaStringtoMoney(datos: string): string;
    function cargarPlantillasProyecto(modoE: Integer): string;
  public
    { Public declarations }
    modo: Integer;
    XLSPlantilla: string;
    carpetaGuardadoTemporal: string;
    SSO: boolean;
    listadoApusReporteAnalisis: TStringList;

  end;

var
  frmVisorReportes: TfrmVisorReportes;

implementation

{$R *.fmx}

uses
  DM1, PlantillasExcel, uMain, DMSeguridad, DM_Presupuestos;

procedure TfrmVisorReportes.rellena_en_Excel(Xls: TExcelFile; Columna: string; Fila: Integer; Valor:
  Variant);
var
  salir: boolean;
  R, C: Integer;
  v: TCellValue;
  cadenaBusqueda: string;
  valorFloat: Real;
begin
  Columna := UpperCase(Columna);
  C := Ord(Columna[1]);
  C := (C - 65) + 1;
  R := Fila;
  Xls.SetCellValue(R, C, Valor, -1);
end;

function TfrmVisorReportes.daPosicionExcel(Xls: TExcelFile; parametroBusqueda: string): posExcel;
var
  R, C: Integer;
  v: TCellValue;
  salir: boolean;
  cadenaBusqueda: string;
begin
  Result.Columna := -1;
  Result.RFila := -1;
  salir := False;
  R := 1;
  while (not salir) and (R < Xls.RowCount + 1) do
  begin
    C := 1;
    while (C < Xls.ColCount + 1) and (not salir) do
    begin
      v := Xls.GetCellValue(R, C);
      cadenaBusqueda := v.ToString;
      if cadenaBusqueda = parametroBusqueda then
      begin
        salir := True;
        Result.Columna := C;
        Result.RFila := R;
      end;
      Inc(C);
    end;
    Inc(R);
  end;
end;

procedure TfrmVisorReportes.GeneraReportePresupuesto;
var
  reporteGenerado: boolean;
  modelo: Integer;
  nombrePlantilla: string;
  apusAdiconadas: boolean;
  tipoPresupuesto: Integer;
  X: Integer;
  datosPresupuesto: dat_datosPresupuesto;
  nombreExcelTPresupuesto: string;
  nombreExcelTAPUS: string;
  listadoAPUSConcatenar: TStringList;
  tipoApus: Integer;
  SSO: boolean;
  excelApus: TXlsFile;
  codigoApus: string;
  apusTratar: dat_localRespApus;
  listadoApusProyecto: TStringList;
  FileNames: TArray<string>;
  nombreExcelNewAPUS: string;
  nombreExcelPlantillaPresupuesto: string;
  nombreExcelPlantillaAPUS: string;
  rutaPlantillaProyecto: string;
  RutaPlantillaAPUS: string;
begin
  excelProyecto := TXlsFile.Create(False);
  reporteGenerado := False;
  listadoAPUSConcatenar := TStringList.Create;
  apusAdiconadas := chk_ConApus.IsChecked;
  carpetaGuardadoTemporal := rutaApp + FormatDateTime('yyyymmddhhnnss', Now) + '\';

  nombreExcelPlantillaPresupuesto := frmMain.Reportes.Presupuesto;
  rutaPlantillaProyecto := danombrePlantilla(nombreExcelPlantillaPresupuesto);
  // ???
  rutaPlantillaProyecto := descomprimeArchivoZIP2excel(rutaPlantillaProyecto, carpetaGuardadoTemporal);
  rutaPlantillaProyecto := desencriptafichero(rutaPlantillaProyecto);

  nombreExcelPlantillaAPUS :=frmMain.Reportes.AnalisisPrecios;
  RutaPlantillaAPUS := danombrePlantilla(nombreExcelPlantillaAPUS);
  RutaPlantillaAPUS := descomprimeArchivoZIP2excel(RutaPlantillaAPUS, carpetaGuardadoTemporal);
  RutaPlantillaAPUS := desencriptafichero(RutaPlantillaAPUS);

  if (FileExists(rutaPlantillaProyecto)) then
  begin
    excelProyecto.Open(rutaPlantillaProyecto);
    excelProyecto.PrintToFit := True;
    if not DirectoryExists(carpetaGuardadoTemporal) then
      CreateDir(carpetaGuardadoTemporal);
    X := AnsiPos('SERCOP', nombreExcelPlantillaPresupuesto);
    if X > 0 then
    begin
      tipoPresupuesto := 2;
      SERCOP := True;
    end
    else
    begin
      SERCOP := False;
      tipoPresupuesto := 1;
    end;

    datosPresupuesto := recibeDatosPresupuestos;
    creaEncabezadoPresupuesto(excelProyecto, tipoPresupuesto, datosPresupuesto.Titulo,
      datosPresupuesto.Oferente, datosPresupuesto.Ubicacion, datosPresupuesto.Fecha,
      datosPresupuesto.codigoReferencial);
    creaResumenPresupuesto(excelProyecto, tipoPresupuesto, datosPresupuesto.subtotal,
      datosPresupuesto.porcentajeIVA, datosPresupuesto.IVA, datosPresupuesto.Total, datosPresupuesto.moneda);
    generaCuerpoPresupuesto(excelProyecto);
    nombreExcelTPresupuesto := carpetaGuardadoTemporal + codProyecto + '_' + revision + '.xlsx';
    excelProyecto.Save(nombreExcelTPresupuesto);
    listadoAPUSConcatenar.Add(nombreExcelTPresupuesto);
    if apusAdiconadas then
    begin
      listadoApusProyecto := TStringList.Create;
      listadoApusProyecto := generaApusProyecto();
      if not chk_ConApus.IsChecked then
      begin
        RutaPlantillaAPUS := '';
      end;

      if (FileExists(RutaPlantillaAPUS)) then
      begin
        for X := 0 to listadoApusProyecto.Count - 1 do
        begin
          excelApus := TXlsFile.Create(False);
          excelApus.Open(RutaPlantillaAPUS);
          codigoApus := listadoApusProyecto[X];
          apusTratar := daDatos1Apus(codigoApus);
          case modelo of
            0:
              begin
                CrearEncabezadoAPUS(excelApus, apusTratar.codigoApus, apusTratar.descripcion,
                  apusTratar.unidad);
              end;
            1:
              begin
                CrearEncabezadoAPUS_SERCOP(excelApus, apusTratar.codigoApus, apusTratar.descripcion,
                  apusTratar.unidad);
              end;
          end;
          CrearResumenAPUS(excelApus, apusTratar.costoDirectoTotal, apusTratar.porcentajeIndirecto,
            apusTratar.costoIndirecto, apusTratar.Total, apusTratar.moneda);
          crearCuerpoAPUS(excelApus, codigoApus, modelo, SSO, apusTratar.Total);
          if not DirectoryExists(carpetaGuardadoTemporal) then
            CreateDir(carpetaGuardadoTemporal);
          nombreExcelNewAPUS := carpetaGuardadoTemporal + apusTratar.codigoApus + '.xls';
          listadoAPUSConcatenar.Add(nombreExcelNewAPUS);
          excelApus.PrintToFit := True;
          excelApus.Save(nombreExcelNewAPUS);
          excelApus.free;
        end;
        SetLength(FileNames, listadoAPUSConcatenar.Count);
        for X := 0 to listadoAPUSConcatenar.Count - 1 do
        begin
          FileNames[X] := listadoAPUSConcatenar[X];
        end;
        excelProyecto := Consolidate(FileNames, False);
        excelProyecto.PrintToFit := True;
        excelProyecto.Save(nombreExcelTPresupuesto);
      end;
    end;
    reporteGenerado := True;
  end;
  LoadFile(nombreExcelTPresupuesto);
  estadoActions(reporteGenerado);
end;

function TfrmVisorReportes.recibeDatosPresupuestos(): dat_datosPresupuesto;
var
  qry: TUniQuery;
  fechaPresupuesto: TdateTime;
  valTmp1, valTmp2: double;
begin
  qry := TUniQuery.Create(nil);
  try
    with qry do
    begin
      Connection := DModule_1.con2;
      close;
      sql.Clear;
      sql.Add('select * from Presupuestos_datosGenerales where codPresupuesto=:codPresupuesto and revision=:revision and codBase='
        + QuotedStr(base_activa.codBase));
      ParamByName('codPresupuesto').AsString := codProyecto;
      ParamByName('revision').AsString := revision;
      Prepare;
      ExecSQL;
      First;
      Result.codigo := codProyecto;
      Result.revision := revision;
      Result.codigoReferencial := FieldByName('codReferencial').AsString;
      Result.Titulo := FieldByName('descripcion').AsString;
      fechaPresupuesto := FieldByName('fechaCreacion').AsDateTime;
      Result.Fecha := FormatDateTime('dd/mm/yyyy', fechaPresupuesto);
      Result.subtotal := decimal_correcto(FieldByName('subtotal').AsString);
      valTmp1 := StrToFloat(Result.subtotal);
      Result.IVA := decimal_correcto(FieldByName('iva').AsString);
      valTmp2 := StrToFloat(Result.IVA);
      valTmp2 := calculaPorcentajeIvaPrecios(valTmp1, valTmp2);
      Result.porcentajeIVA := FloatToStr(valTmp2) + '%';
      Result.Total := decimal_correcto(FieldByName('total').AsString);

      close;
      sql.Clear;
      sql.Add('select * from presupuestos_DatosProyecto where codPresupuesto=:codPresupuesto and revision=:revision and codBase='
        + QuotedStr(base_activa.codBase));
      ParamByName('codPresupuesto').AsString := codProyecto;
      ParamByName('revision').AsString := revision;
      Prepare;
      ExecSQL;
      if FieldByName('direccion').AsString <> '' then
        Result.Ubicacion := FieldByName('direccion').AsString + ' - ' + FieldByName('ciudad').AsString
          + ' - ' + FieldByName('Provincia').AsString
      else
        Result.Ubicacion := FieldByName('ciudad').AsString + ' - ' + FieldByName('Provincia').AsString;
      close;
      sql.Clear;
      sql.Add('select * from empresas where codUnico=' + QuotedStr(CodUnicoEmpresaActiva));
      Prepare;
      ExecSQL;
      Result.Oferente := FieldByName('nombre').AsString;
      if base_activa.simboloMoneda = '' then
        base_activa.simboloMoneda := '$';
      Result.moneda := daNombreMoneda(base_activa.moneda);
    end;
  finally
    qry.free;
  end;
end;

procedure TfrmVisorReportes.RecogeDatosCronogramaValorado();
begin
  with DMPresupuesto.QDatosCronogramasValorados do
  begin
    ParamByName('codBase').AsString := base_activa.codBase;
    ParamByName('codPresupuesto').AsString := codProyecto;
    ParamByName('revision').AsString := revision;
    Open;
    First;
  end;
  datosCronogramaValorado.PTitulo := DMPresupuesto.QDatosCronogramasValoradosdescripcion.AsString;
  datosCronogramaValorado.POferente := DMPresupuesto.QDatosCronogramasValoradosNombreApellido.AsString;
  datosCronogramaValorado.PcodReferencial := DMPresupuesto.QDatosCronogramasValoradoscodreferencial.AsString;
  datosCronogramaValorado.PUbicacion := DMPresupuesto.QDatosCronogramasValoradosUbicacion.AsString;
  datosCronogramaValorado.PFecha_Inicio := FormatDateTime('dd/mm/yyyy',
    DMPresupuesto.QDatosCronogramasValoradosfechainicio.AsDateTime);
  datosCronogramaValorado.PFecha_Fin := FormatDateTime('dd/mm/yyyy',
    DMPresupuesto.QDatosCronogramasValoradosfechafinalizacion.AsDateTime);
  datosCronogramaValorado.PCiudad := DMPresupuesto.QDatosCronogramasValoradosciudad.AsString;
  datosCronogramaValorado.PPlazo := DMPresupuesto.QDatosCronogramasValoradosplazoejecucion.AsString;
end;

procedure TfrmVisorReportes.RecogeDatosActaProyecto;
var
  qry: TUniQuery;
  tmpstr: string;
begin
  qry := TUniQuery.Create(nil);
  try
    with qry do
    begin
      Connection := DModule_1.con2;
      close;
      sql.Clear;
      sql.Add('select * from presupuestos_datosProyecto where codBase=:codBase and codPresupuesto=:codPresupuesto and revision=:revision');
      ParamByName('codBase').AsString := base_activa.codBase;
      ParamByName('codPresupuesto').AsString := codProyecto;
      ParamByName('revision').AsString := revision;
      Prepare;
      ExecSQL;
      datosActaProyecto.PTitulo := FieldByName('Descripcion').AsString;
      datosActaProyecto.PcodReferencial := FieldByName('codReferencial').AsString;
      tmpstr := FieldByName('foto1').AsString;
      if tmpstr <> '' then
      begin
        datosActaProyecto.PGeorefencia := StringToBitmap(tmpstr);
      end
      else
      begin
        datosActaProyecto.PGeorefencia := nil;
      end;
      tmpstr := FieldByName('foto2').AsString;
      if tmpstr <> '' then
      begin
        datosActaProyecto.PImagenProyecto := StringToBitmap(tmpstr);
      end
      else
      begin
        datosActaProyecto.PImagenProyecto := nil;
      end;
      datosActaProyecto.PDireccion := FieldByName('Direccion').AsString;
      datosActaProyecto.PCiudad := FieldByName('Ciudad').AsString;
      datosActaProyecto.PProvincia := FieldByName('Provincia').AsString;
      datosActaProyecto.PPais := FieldByName('pais').AsString;
      datosActaProyecto.PObjetoContrato := FieldByName('objetoContrato').AsString;
      datosActaProyecto.PAmbitoContratacion := FieldByName('AConstruccion').AsString;
      datosActaProyecto.PTipoContrato := FieldByName('tipoContrato').AsString;
      datosActaProyecto.PTipoProyecto := FieldByName('tipoProyecto').AsString;
      datosActaProyecto.PCategoriaProyecto := FieldByName('Categoria').AsString;
      datosActaProyecto.PTipoConstruccion := FieldByName('tipoConstruccion').AsString;
      datosActaProyecto.PAreaTerreno := FormatFloat(cadenaDecimales, FieldByName('Aterreno').AsFloat);
      datosActaProyecto.PAreaConstruccion := FormatFloat(cadenaDecimales,
        FieldByName('AConstruccion').AsFloat);
      datosActaProyecto.PFechaInicio := FormatDateTime('dd/mm/aaaa', FieldByName('fechaInicio').AsDateTime);
      datosActaProyecto.PFechaFin := FormatDateTime('dd/mm/yyyy',
        FieldByName('fechaFinalizacion').AsDateTime);
      datosActaProyecto.PPlazoTiempo := IntToStr(FieldByName('plazoEjecucion').AsInteger);
    end;
  finally
    qry.free;
  end;
end;

procedure TfrmVisorReportes.generaReporteProyecto;
var
  reporteGenerado: boolean;
  nombreExcelPlantillaPresupuesto: string;
  rutaPlantillaProyecto: string;
  nombreExcelTPresupuesto: string;
  Csearch: posExcel;
  SERCOP: boolean;
  cargarXLS: boolean;
begin
  excelProyecto := TXlsFile.Create(False);
  reporteGenerado := False;
  cargarXLS := True;
  carpetaGuardadoTemporal := rutaApp + FormatDateTime('yyyymmddhhnnss', Now) + '\';
  nombreExcelPlantillaPresupuesto := cargarPlantillasProyecto(modo);
  rutaPlantillaProyecto := danombrePlantilla(nombreExcelPlantillaPresupuesto);
  rutaPlantillaProyecto := descomprimeArchivoZIP2excel(rutaPlantillaProyecto, carpetaGuardadoTemporal);
  rutaPlantillaProyecto := desencriptafichero(rutaPlantillaProyecto);
  if AnsiPos('sercop', LowerCase(nombreExcelPlantillaPresupuesto)) > 0 then
    SERCOP := True
  else
    SERCOP := False;
  if (FileExists(rutaPlantillaProyecto)) then
  begin
    if (frmMain.tbc1.ActiveTab = frmMain.tab_5) and (modo = 4) then
    begin
      //
    end
    else
    begin
      excelProyecto.Open(rutaPlantillaProyecto);
      excelProyecto.PrintToFit := True;
    end;
    if not DirectoryExists(carpetaGuardadoTemporal) then
      CreateDir(carpetaGuardadoTemporal);
  end;
  // Recoger datos Proyecto
  case modo of
    1:
      begin
        nombreExcelTPresupuesto := carpetaGuardadoTemporal + 'ActaProyecto-' + codProyecto + '_' +
          revision + '.xlsx';
        RecogeDatosActaProyecto;
        CompletaActaProyecto();
      end;
    4:
      begin
        nombreExcelTPresupuesto := carpetaGuardadoTemporal + 'CronogramaValorados [ncronograma]-' +
          codProyecto + '_' + revision + '.xlsx';
        RecogeDatosCronogramaValorado();
        if frmMain.tbc1.ActiveTab <> frmMain.tab_5 then
        begin

          if SERCOP then
          begin
            nombreExcelTPresupuesto := StringReplace(nombreExcelTPresupuesto, 'ncronograma', 'SERCOP', []);
            CompletaCronogramaValoradoDatosPeriodosSERCOP(excelProyecto);
          end
          else
          begin
            if frmMain.tbc1.ActiveTab = frmMain.tab_1 then
            begin
              nombreExcelTPresupuesto := StringReplace(nombreExcelTPresupuesto, 'ncronograma',
                'Porcentajes', []);
            end;
            if frmMain.tbc1.ActiveTab = frmMain.tab_2 then
            begin
              nombreExcelTPresupuesto := StringReplace(nombreExcelTPresupuesto, 'ncronograma',
                'Inversion', []);
            end;
            if frmMain.tbc1.ActiveTab = frmMain.tab_3 then
            begin
              nombreExcelTPresupuesto := StringReplace(nombreExcelTPresupuesto, 'ncronograma',
                'Cantidades', []);
            end;
            if frmMain.tbc1.ActiveTab = frmMain.tab_4 then
            begin
              nombreExcelTPresupuesto := StringReplace(nombreExcelTPresupuesto, 'ncronograma', 'GBarras',
                []);
            end;
            if frmMain.tbc1.ActiveTab = frmMain.tab_5 then
            begin
              nombreExcelTPresupuesto := StringReplace(nombreExcelTPresupuesto, 'ncronograma', 'CurvaS', []);
            end;
            CompletaCronogramaValoradoDatosGenerales();
            Csearch := daPosicionExcel(excelProyecto, '#PRO_NUM_PERIODO');
            CompletaCronogramaValoradoDatosPeriodos(excelProyecto, Csearch);
            borraLineaPlantilla(excelProyecto, '#DATOPERIODO');
            sustituye_en_Excel(excelProyecto, '#TOTAL_PRESUPUESTO', frmMain.lbl_SubtotalPresupuesto.text);
          end;
          CompletaTotalParcialCronogramaValorado(excelProyecto);
          CompletaPorcentajeParcialCronogramaValorado(excelProyecto);
          CompletaTotalAcumuladoCronogramaValorado(excelProyecto);
          CompletaPorcentajeAcumuladoCronogramaValorado(excelProyecto);
        end
        else
        begin
          CompletaCurvaS(Xls, rutaPlantillaProyecto, nombreExcelTPresupuesto);
          CompletaCronogramaValoradoDatosGenerales();
          cargarXLS := False;
          excelProyecto.PrintToFit := True;
          if FileExists(nombreExcelTPresupuesto) then
            DeleteFile(PChar(nombreExcelTPresupuesto));
          excelProyecto.Save(nombreExcelTPresupuesto);
          LoadFile(nombreExcelTPresupuesto);
        end;
      end;
    5:
      begin
        nombreExcelTPresupuesto := carpetaGuardadoTemporal + 'Desagregacion' + codProyecto + '_' +
          revision + '.xlsx';
        if not SERCOP then
        begin
          CompletaEncabezadoDesagregacion(excelProyecto);
          CompletaCuerpoDesagregacion(excelProyecto);
          if chk_ConApus.IsChecked then
          begin
            excelProyecto.Save(nombreExcelTPresupuesto);
            GeneraHojasApus(Xls, carpetaGuardadoTemporal, nombreExcelTPresupuesto);
          end;
        end
        else
        begin
          CompletaDesagregacionSercop(excelProyecto);
          if chk_ConApus.IsChecked then
          begin
            excelProyecto.Save(nombreExcelTPresupuesto);
            GeneraHojasApus(Xls, carpetaGuardadoTemporal, nombreExcelTPresupuesto);
          end;
        end;
      end;
    6:
      begin
        nombreExcelTPresupuesto := carpetaGuardadoTemporal + 'EDT[Diccionario]-' + codProyecto + '_'
          + revision + '.xlsx';
        RecogeDatosCronogramaValorado();
        RecogeDatosEdt();
        CompletaEDTDiccionario(excelProyecto);
      end;
    8:
      begin
        nombreExcelTPresupuesto := carpetaGuardadoTemporal + 'EDT[Valorada]-' + codProyecto + '_' +
          revision + '.xlsx';
        RecogeDatosCronogramaValorado();
        RecogeDatosEdt_valorada();
        CompletaEDTValorada(excelProyecto);
      end;
    9:
      begin
        nombreExcelTPresupuesto := carpetaGuardadoTemporal + 'Directorio_Equipo_Asignado-' +
          codProyecto + '_' + revision + '.xlsx';
        RecogeDatosCronogramaValorado;
        CompletaDirectorioEquipoAsignado(excelProyecto);
      end;
    10:
      begin
        nombreExcelTPresupuesto := carpetaGuardadoTemporal + 'EDO' + codProyecto + '_' + revision + '.xlsx';
        RecogeDatosCronogramaValorado;
        CompletaEDOAsignada(excelProyecto);
      end;
    11:
      begin
        nombreExcelTPresupuesto := carpetaGuardadoTemporal + 'FPolinomica-' + codProyecto + '_' +
          revision + '.xlsx';
        RecogeDatosCronogramaValorado;
        CompletaCabeceraFPolinomica(excelProyecto);
        CompletaFormulaPolinomica(excelProyecto);
      end;
  end;
  if cargarXLS then
  begin
    if FileExists(nombreExcelTPresupuesto) then
      DeleteFile(PChar(nombreExcelTPresupuesto));
    excelProyecto.PrintToFit := True;
    excelProyecto.Save(nombreExcelTPresupuesto);
    excelProyecto.Open(nombreExcelTPresupuesto);
    LoadFile(nombreExcelTPresupuesto);
  end;
  estadoActions(True);
end;

procedure TfrmVisorReportes.CompletaFormulaPolinomica(Xls: TExcelFile);
var
  coeficienteRecurso: double;
  Totalcoeficiente: double;
  totalRecurso: double;
  X: Integer;
  FormulaCuadrillaTipo: string;
  FormulaPolinomica: string;
  totalHorasHombre: double;
  totalManoObra: double;
  TotalCoeficientoMO: double;
  tmpstr: string;
begin
  { --- Parte 1 CUADRILLA TIPO --- }
  FormulaPolinomica := frmMain.lbl_FpolGeneral.text;
  FormulaCuadrillaTipo := frmMain.lbl_FpolCuadrilla.text;
  totalHorasHombre := 0;
  totalManoObra := 0;
  TotalCoeficientoMO := 0;

  for X := 1 to frmMain.grid_FpolCuadrillaTipo.RowCount - 1 do
  begin
    clonarLineaXLS(Xls, '#TERMINO_MANO_OBRA');
    sustituye_en_Excel(Xls, '#TERMINO_MANO_OBRA', frmMain.grid_FpolCuadrillaTipo.cells[2, X]);
    sustituye_en_Excel(Xls, '#CAT_MANO_OBRA', frmMain.grid_FpolCuadrillaTipo.cells[3, X]);
    sustituye_en_Excel(Xls, '#SALARIO_DE_LEY', frmMain.grid_FpolCuadrillaTipo.cells[5, X]);
    sustituye_en_Excel(Xls, '#SALARIO_EFECTIVO', frmMain.grid_FpolCuadrillaTipo.cells[6, X]);
    sustituye_en_Excel(Xls, '#HORAS_HOMBRE', frmMain.grid_FpolCuadrillaTipo.cells[7, X]);
    tmpstr := frmMain.grid_FpolCuadrillaTipo.cells[7, X];
    totalHorasHombre := totalHorasHombre + quitaFormatFloat(tmpstr);
    sustituye_en_Excel(Xls, '#COSTO_DIRECTO_MANO_OBRA', frmMain.grid_FpolCuadrillaTipo.cells[8, X]);
    tmpstr := frmMain.grid_FpolCuadrillaTipo.cells[8, X];
    totalManoObra := totalManoObra + quitaFormatFloat(tmpstr);
    sustituye_en_Excel(Xls, '#COEF_MANO_OBRA', frmMain.grid_FpolCuadrillaTipo.cells[9, X]);
    /// /
    tmpstr := frmMain.grid_FpolCuadrillaTipo.cells[9, X];
    TotalCoeficientoMO := TotalCoeficientoMO + quitaFormatFloat(tmpstr);
  end;
  borraLineaPlantilla(Xls, '#TERMINO_MANO_OBRA');
  sustituye_en_Excel(Xls, '#FORMULA_CUADRILLA_TIPO', FormulaCuadrillaTipo);
  sustituye_en_Excel(Xls, '#TOTAL_HORAS_HOMBRE', totalHorasHombre);
  sustituye_en_Excel(Xls, '#TOTAL_CD_MANO_OBRA', totalManoObra);
  sustituye_en_Excel(Xls, '#TOTAL_COEF_MANO_OBRA', TotalCoeficientoMO);

  { --- Parte 2 FORMULA POLINOMICA --- }
  Totalcoeficiente := 0;
  totalRecurso := 0;
  DModule_1.QIndicesFormulaPolinomica.close;
  DModule_1.QIndicesFormulaPolinomica.ParamByName('codBase').AsString := base_activa.codBase;
  DModule_1.QIndicesFormulaPolinomica.ParamByName('codPresupuesto').AsString := codProyecto;
  DModule_1.QIndicesFormulaPolinomica.ParamByName('revision').AsString := revision;
  DModule_1.QIndicesFormulaPolinomica.Execute;
  DModule_1.QDatosGeneralesPresupuesto.close;
  DModule_1.QDatosGeneralesPresupuesto.ParamByName('codbase').AsString := base_activa.codBase;
  DModule_1.QDatosGeneralesPresupuesto.ParamByName('codPresupuesto').AsString := codProyecto;
  DModule_1.QDatosGeneralesPresupuesto.ParamByName('revision').AsString := revision;
  DModule_1.QDatosGeneralesPresupuesto.Execute;

  while not DModule_1.QIndicesFormulaPolinomica.Eof do
  begin
    clonarLineaXLS(Xls, '#TERMINO_RECURSO');
    sustituye_en_Excel(Xls, '#TERMINO_RECURSO', DModule_1.QIndicesFormulaPolinomicaterminoRecurso.AsString);
    sustituye_en_Excel(Xls, '#DESCRIPCION_TERMINO_RECURSO',
      DModule_1.QIndicesFormulaPolinomicadescripcion.AsString);
    sustituye_en_Excel(Xls, '#COSTO_DIRECTO_RECURSOS',
      DModule_1.QIndicesFormulaPolinomicaSubtotalTermino.AsFloat);
    coeficienteRecurso := DModule_1.QIndicesFormulaPolinomicaSubtotalTermino.AsFloat /
      DModule_1.QDatosGeneralesPresupuestototal.AsFloat;
    Totalcoeficiente := Totalcoeficiente + coeficienteRecurso;
    totalRecurso := totalRecurso + DModule_1.QIndicesFormulaPolinomicaSubtotalTermino.AsFloat;
    sustituye_en_Excel(Xls, '#COEF_RECURSOS', coeficienteRecurso);
    DModule_1.QIndicesFormulaPolinomica.next;
  end;
  borraLineaPlantilla(Xls, '#TERMINO_RECURSO');
  sustituye_en_Excel(Xls, '#FORMULA_POLINOMICA', FormulaPolinomica);
  sustituye_en_Excel(Xls, '#TOTAL_CD_RECURSOS', totalRecurso);
  sustituye_en_Excel(Xls, '#TOTAL_COEF_RECURSOS', Totalcoeficiente);
end;

procedure TfrmVisorReportes.CompletaCabeceraFPolinomica(Xls: TExcelFile);
begin
  sustituye_en_Excel(Xls, '#PRO_TITULO', datosCronogramaValorado.PTitulo);
  sustituye_en_Excel(Xls, '#CODIGOREFERENCIAL', datosCronogramaValorado.PcodReferencial);
  sustituye_en_Excel(Xls, '#CODIGOPROYECTO', codProyecto);
  sustituye_en_Excel(Xls, '#REVISION', revision);
  sustituye_en_Excel(Xls, '#PRO_OFERENTE', datosCronogramaValorado.POferente);
  sustituye_en_Excel(Xls, '#PRO_UBICACION', datosCronogramaValorado.PUbicacion);
  sustituye_en_Excel(Xls, '#PRO_FECHA', FormatDateTime('dd/mm/yyyy', Now));
end;

procedure TfrmVisorReportes.GeneraHojasApus(Xls: TExcelFile; directorioTrabajo, NexcelBase: string);
var
  nombreExcelApus: string;
  excelApus: TExcelFile;
  rutaExcelApus: string;
  FileNames: TArray<string>;
  X, Y, z: Integer;
  codApu: string;
  punteroGrupo: string;
  subtotal: double;
  subtotal1: double;
  VAE1: double;
  subtotal2: double;
  VAE2: double;
  subtotal3: double;
  VAE3: double;
  subtotal4: double;
  VAE4: double;
  Valor_indirectos: double;
  VAETotal: double;
  fichHojaExcel: string;
  tmpstr: string;
begin
  excelApus := TXlsFile.Create(False);
  nombreExcelApus := cargarPlantillasProyecto(51);
  rutaExcelApus := danombrePlantilla(nombreExcelApus);
  rutaExcelApus := descomprimeArchivoZIP2excel(rutaExcelApus, directorioTrabajo);
  rutaExcelApus := desencriptafichero(rutaExcelApus);
  z := 0;
  SetLength(FileNames, z + 1);
  FileNames[0] := NexcelBase;
  Inc(z);
  for X := 1 to frmMain.grid_DesagregacionAPUS.RowCount - 1 do
  begin
    excelApus.Open(rutaExcelApus);
    subtotal1 := 0;
    subtotal2 := 0;
    subtotal3 := 0;
    subtotal4 := 0;
    VAE1 := 0;
    VAE2 := 0;
    VAE3 := 0;
    VAE4 := 0;
    VAETotal := 0;
    codApu := frmMain.grid_DesagregacionAPUS.cells[11, X];
    if codApu <> '' then
    begin
      SetLength(FileNames, z + 1);
      DModule_1.QAPU.close;
      DModule_1.QAPU.ParamByName('codBase').AsString := base_activa.codBase;
      DModule_1.QAPU.ParamByName('codApu').AsString := codApu;
      DModule_1.QAPU.Execute;
      DModule_1.QAPU.First;
      sustituye_en_Excel(excelApus, '#DESCRIPCION', DModule_1.QAPUdescripcionAPU.AsString);
      sustituye_en_Excel(excelApus, '#UNIDAD', DModule_1.QAPUUnidadAPU.AsString);
      sustituye_en_Excel(excelApus, '#CODIGO_APU', codApu);
      while not DModule_1.QAPU.Eof do
      begin
        punteroGrupo := '#DESCRIPCION' + DModule_1.QAPUCodCategoria.AsString;
        clonarLineaXLS(excelApus, punteroGrupo);

        case DModule_1.QAPUCodCategoria.AsInteger of
          1:
            begin
              sustituye_en_Excel(excelApus, '#DESCRIPCION1', DModule_1.QAPUdescripcion.AsString);
              tmpstr := DModule_1.QAPUCantidad.AsString;
              tmpstr := decimal_correcto(tmpstr);
              sustituye_en_Excel(excelApus, '#CANTIDAD1', tmpstr);
              tmpstr := DModule_1.QAPUPrecio.AsString;
              tmpstr := decimal_correcto(tmpstr);
              sustituye_en_Excel(excelApus, '#PRECIO1', tmpstr);
              tmpstr := DModule_1.QAPUrendimiento.AsString;
              tmpstr := decimal_correcto(tmpstr);
              sustituye_en_Excel(excelApus, '#RENDIMIENTO1', StrToFloatDef(tmpstr, 0));
              tmpstr := DModule_1.QAPUTotal.AsString;
              tmpstr := decimal_correcto(tmpstr);
              sustituye_en_Excel(excelApus, '#SUBTOTAL1', StrToFloatDef(tmpstr, 0));
              sustituye_en_Excel(excelApus, '#CODCPC1', DModule_1.QAPUcodCPC.AsString);
              sustituye_en_Excel(excelApus, '#CATCPC1', DModule_1.QAPUTipoCPC.AsString);
              tmpstr := DModule_1.QAPUCostoHora.AsString;
              tmpstr := decimal_correcto(tmpstr);
              sustituye_en_Excel(excelApus, '#COSTOHORA1', StrToFloatDef(tmpstr, 0));
              tmpstr := DModule_1.QAPUpesoRelativo.AsString;
              tmpstr := decimal_correcto(tmpstr);
              sustituye_en_Excel(excelApus, '#PORCENT1', forzarNdecimales(StrToFloatDef(tmpstr, 0), 2) +
                '%');
              tmpstr := DModule_1.QAPUVAER.AsString;
              tmpstr := decimal_correcto(tmpstr);
              sustituye_en_Excel(excelApus, '#PVAER1', forzarNdecimales(StrToFloatDef(tmpstr, 0), 2) + '%');
              tmpstr := DModule_1.QAPUPtotalVAER.AsString;
              tmpstr := decimal_correcto(tmpstr);
              sustituye_en_Excel(excelApus, '#PTOTALVAER1', forzarNdecimales(StrToFloatDef(tmpstr, 0),
                2) + '%');
              VAE1 := VAE1 + StrToFloatDef(tmpstr, 0);
              tmpstr := DModule_1.QAPUTotal.AsString;
              tmpstr := decimal_correcto(tmpstr);
              subtotal1 := subtotal1 + StrToFloatDef(tmpstr, 0);
            end;
          2:
            begin
              sustituye_en_Excel(excelApus, '#DESCRIPCION2', DModule_1.QAPUdescripcion.AsString);
              sustituye_en_Excel(excelApus, '#UNIDAD2', DModule_1.QAPUunidad.AsString);
              sustituye_en_Excel(excelApus, '#CANTIDAD2', DModule_1.QAPUCantidad.AsString);
              sustituye_en_Excel(excelApus, '#PRECIO2', DModule_1.QAPUPrecio.AsString);
              sustituye_en_Excel(excelApus, '#SUBTOTAL2', StrToFloatDef(DModule_1.QAPUTotal.AsString, 0));
              sustituye_en_Excel(excelApus, '#CODCPC4', DModule_1.QAPUcodCPC.AsString);

              sustituye_en_Excel(excelApus, '#CATCPC2', DModule_1.QAPUTipoCPC.AsString);
              sustituye_en_Excel(excelApus, '#PORCENT2',
                forzarNdecimales(StrToFloatDef(DModule_1.QAPUpesoRelativo.AsString,
                0), 2) + '%');
              sustituye_en_Excel(excelApus, '#PVAER2',
                forzarNdecimales(StrToFloatDef(DModule_1.QAPUVAER.AsString,
                0), 2) + '%');
              sustituye_en_Excel(excelApus, '#PTOTALVAER2',
                forzarNdecimales(StrToFloatDef(DModule_1.QAPUPtotalVAER.AsString,
                0), 2) + '%');
              subtotal2 := subtotal2 + StrToFloatDef(DModule_1.QAPUTotal.AsString, 0);
              VAE2 := VAE2 + StrToFloatDef(DModule_1.QAPUPtotalVAER.AsString, 0);
            end;
          3:
            begin
              sustituye_en_Excel(excelApus, '#DESCRIPCION3', DModule_1.QAPUdescripcion.AsString);
              sustituye_en_Excel(excelApus, '#UNIDAD3', DModule_1.QAPUunidad.AsString);
              sustituye_en_Excel(excelApus, '#CANTIDAD3', DModule_1.QAPUCantidad.AsString);
              sustituye_en_Excel(excelApus, '#PRECIO3', DModule_1.QAPUPrecio.AsString);
              sustituye_en_Excel(excelApus, '#SUBTOTAL3', StrToFloatDef(DModule_1.QAPUTotal.AsString, 0));
              sustituye_en_Excel(excelApus, '#CODCPC3', DModule_1.QAPUcodCPC.AsString);
              sustituye_en_Excel(excelApus, '#CATCPC3', DModule_1.QAPUTipoCPC.AsString);
              sustituye_en_Excel(excelApus, '#PORCENT3',
                forzarNdecimales(StrToFloatDef(DModule_1.QAPUpesoRelativo.AsString,
                0), 2) + '%');
              sustituye_en_Excel(excelApus, '#PVAER3',
                forzarNdecimales(StrToFloatDef(DModule_1.QAPUVAER.AsString,
                0), 2) + '%');
              sustituye_en_Excel(excelApus, '#PTOTALVAER3', StrToFloatDef(DModule_1.QAPUPtotalVAER.AsString,
                0));
              subtotal3 := subtotal3 + StrToFloatDef(DModule_1.QAPUTotal.AsString, 0);
              VAE3 := VAE3 + StrToFloatDef(DModule_1.QAPUPtotalVAER.AsString, 0);
            end;
          4:
            begin
              sustituye_en_Excel(excelApus, '#DESCRIPCION4', DModule_1.QAPUdescripcion.AsString);
              sustituye_en_Excel(excelApus, '#CANTIDAD4', DModule_1.QAPUCantidad.AsString);
              sustituye_en_Excel(excelApus, '#PRECIO4', DModule_1.QAPUPrecio.AsString);
              sustituye_en_Excel(excelApus, '#RENDIMIENTO4',
                StrToFloatDef(DModule_1.QAPUrendimiento.AsString,
                0));
              sustituye_en_Excel(excelApus, '#SUBTOTAL4', StrToFloatDef(DModule_1.QAPUTotal.AsString, 0));
              sustituye_en_Excel(excelApus, '#COSTOHORA4', DModule_1.QAPUCostoHora.AsFloat);
              sustituye_en_Excel(excelApus, '#CODCPC4', DModule_1.QAPUcodCPC.AsString);
              sustituye_en_Excel(excelApus, '#CATCPC4', DModule_1.QAPUTipoCPC.AsString);
              sustituye_en_Excel(excelApus, '#PORCENT4',
                forzarNdecimales(StrToFloatDef(DModule_1.QAPUpesoRelativo.AsString,
                0), 2) + '%');
              sustituye_en_Excel(excelApus, '#PVAER4',
                forzarNdecimales(StrToFloatDef(DModule_1.QAPUVAER.AsString,
                0), 2) + '%');
              sustituye_en_Excel(excelApus, '#PTOTALVAER4',
                forzarNdecimales(StrToFloatDef(DModule_1.QAPUPtotalVAER.AsString,
                0), 2) + '%');
              sustituye_en_Excel(excelApus, '#CCOSTOHORA4', StrToFloatDef(DModule_1.QAPUCostoHora.AsString,
                0));
              subtotal4 := subtotal4 + StrToFloatDef(DModule_1.QAPUTotal.AsString, 0);
              VAE4 := VAE4 + StrToFloatDef(DModule_1.QAPUPtotalVAER.AsString, 0)
            end;
        end;

        DModule_1.QAPU.next;
      end;

      for Y := 1 to 4 do
      begin
        punteroGrupo := '#DESCRIPCION' + IntToStr(Y);
        borraLineaPlantilla(excelApus, punteroGrupo);
      end;

      sustituye_en_Excel(excelApus, '#TOTAL1', subtotal1);
      sustituye_en_Excel(excelApus, '#TOTAL2', subtotal2);
      sustituye_en_Excel(excelApus, '#TOTAL3', subtotal3);
      sustituye_en_Excel(excelApus, '#TOTAL4', subtotal4);
      sustituye_en_Excel(excelApus, '#PVAESUBTOTAL1', forzarNdecimales(VAE1, 2) + '%');
      sustituye_en_Excel(excelApus, '#PVAESUBTOTAL2', forzarNdecimales(VAE2, 2) + '%');
      sustituye_en_Excel(excelApus, '#PVAESUBTOTAL3', forzarNdecimales(VAE3, 2) + '%');
      sustituye_en_Excel(excelApus, '#PVAESUBTOTAL4', forzarNdecimales(VAE4, 2) + '%');

      VAETotal := VAE1 + VAE2 + VAE3 + VAE4;
      subtotal := subtotal1 + subtotal2 + subtotal3 + subtotal4;
      sustituye_en_Excel(excelApus, '#COSTODIRECTO', subtotal);
      sustituye_en_Excel(excelApus, '#%INDIRECTO', forzarNdecimales(base_activa.indirectos, 2) + '% ');
      Valor_indirectos := (base_activa.indirectos * subtotal) / 100;
      sustituye_en_Excel(excelApus, '#COSTOINDIRECTO', Valor_indirectos);
      sustituye_en_Excel(excelApus, '#TTOTAL', subtotal + Valor_indirectos);
      sustituye_en_Excel(excelApus, '#TOTALO', subtotal + Valor_indirectos);
      sustituye_en_Excel(excelApus, '#PVAEAPUTOTAL', forzarNdecimales(VAETotal, 2) + '%');
      excelApus.SheetName := codApu;
      fichHojaExcel := 'APUTmp_' + IntToStr(z) + '.xlsx';
      if FileExists(directorioTrabajo + fichHojaExcel) then
        DeleteFile(PWideChar(directorioTrabajo + fichHojaExcel));
      excelApus.Save(directorioTrabajo + fichHojaExcel);
      FileNames[z] := directorioTrabajo + fichHojaExcel;
      Inc(z);
    end;
  end;
  Xls := Consolidate(FileNames, False);
  Xls.Save(NexcelBase);
  excelProyecto.Open(NexcelBase);
end;

procedure TfrmVisorReportes.CompletaCuerpoDesagregacion(Xls: TExcelFile);
var
  X, Y: Integer;
  subtotalSinIva: double;
  v_IVA: double;
  tmpstr: string;
  totalPonderado: double;
begin
  Y := 1;
  subtotalSinIva := 0;
  totalPonderado := 0;
  for X := 1 to frmMain.grid_DesagregacionAPUS.RowCount - 1 do
  begin
    if frmMain.grid_DesagregacionAPUS.cells[1, X] <> '' then
    begin
      clonarLineaXLS(Xls, '#ITEM');
      sustituye_en_Excel(Xls, '#ITEM', IntToStr(Y));
      sustituye_en_Excel(Xls, '#DESCRIPCION', frmMain.grid_DesagregacionAPUS.cells[2, X]);
      sustituye_en_Excel(Xls, '#UNIDAD', frmMain.grid_DesagregacionAPUS.cells[3, X]);
      sustituye_en_Excel(Xls, '#CANTIDAD', frmMain.grid_DesagregacionAPUS.cells[4, X]);
      sustituye_en_Excel(Xls, '#PUNITARIO', frmMain.grid_DesagregacionAPUS.cells[5, X]);
      tmpstr := frmMain.grid_DesagregacionAPUS.cells[6, X];
      sustituye_en_Excel(Xls, '#SUBTOTAL', tmpstr);
      tmpstr := AnsiReplaceStr(tmpstr, base_activa.simboloMoneda, '');
      subtotalSinIva := subtotalSinIva + quitaFormatFloat(tmpstr);
      sustituye_en_Excel(Xls, '#PRAPU', frmMain.grid_DesagregacionAPUS.cells[7, X]);
      sustituye_en_Excel(Xls, '#VAEAPU', frmMain.grid_DesagregacionAPUS.cells[8, X]);
      tmpstr := frmMain.grid_DesagregacionAPUS.cells[9, X];
      sustituye_en_Excel(Xls, '#AEPAPU', tmpstr);
      tmpstr := AnsiReplaceStr(tmpstr, '%', '');
      if tmpstr = '' then
        tmpstr := '0';
      totalPonderado := totalPonderado + StrToFloat(tmpstr);
      Inc(Y);
    end;
  end;
  borraLineaPlantilla(Xls, '#ITEM');
  sustituye_en_Excel(Xls, '#SUBTOTALSINIVA', forzarNdecimales(subtotalSinIva, 2));
  v_IVA := StrToFloatDef(frmMain.edt_porcentajeIVANuevoPresupuesto.text, 0);
  v_IVA := (subtotalSinIva * v_IVA) / 100;
  sustituye_en_Excel(Xls, '#IVA', forzarNdecimales(v_IVA, 2));
  sustituye_en_Excel(Xls, '#TOTAL', forzarNdecimales(subtotalSinIva + v_IVA, 2));
  sustituye_en_Excel(Xls, '#AEPAPUTOTAL', forzarNdecimales(totalPonderado, 2) + '%');
end;

procedure TfrmVisorReportes.CompletaEncabezadoDesagregacion(Xls: TExcelFile);
var
  qry: TUniQuery;
begin
  qry := TUniQuery.Create(nil);
  try
    with qry do
    begin
      Connection := DModule_1.con2;
      close;
      sql.Clear;
      sql.Add('SELECT dat.codPresupuesto, dat.revision, dat.codReferencial,  dat.Descripcion, edo.Responsable AS oferente, '
        + '  CONCAT(dat.ciudad,' + QuotedStr(' ') + ',  dat.provincia, ' + QuotedStr(' - ') +
        ', dat.pais) AS Ubicacion                   ' +
        'FROM presupuestos_datosproyecto dat                                  ' +
        '  LEFT JOIN presupuestos_edo_datos edo ON edo.codbase = dat.codBase  ' +
        '  AND edo.codPresupuesto = dat.codPresupuesto                        ' +
        '  AND edo.revision = dat.revision                                    ' +
        '  AND LOWER(edo.rolProyecto) = ' + QuotedStr('oferente') +
        '  WHERE                                                                ' +
        '  dat.codbase = :codBase                                               ' +
        '  AND dat.codPresupuesto = :codPresupuesto                             ' +
        '  AND dat.revision =  :revision ');
      Prepare;
      ExecSQL;
      sustituye_en_Excel(Xls, '#PRO_TITULO', FieldByName('descripcion').AsString);
      sustituye_en_Excel(Xls, '#CODIGOPROYECTO', FieldByName('codPresupuesto').AsString);
      sustituye_en_Excel(Xls, '#CODIGOREFERENCIAL', FieldByName('codReferencial').AsString);
      sustituye_en_Excel(Xls, '#REVISION', FieldByName('revision').AsString);
      sustituye_en_Excel(Xls, '#PRO_OFERENTE', FieldByName('oferente').AsString);
      sustituye_en_Excel(Xls, '#PRO_UBICACION', FieldByName('ubicacion').AsString);
      sustituye_en_Excel(Xls, '#PRO_FECHA', FormatDateTime('dd/mm/yyyy', Now));
    end;
  finally
    qry.free;
  end;
end;

procedure TfrmVisorReportes.CompletaEDOAsignada(Xls: TExcelFile);
var
  X: Integer;
begin
  sustituye_en_Excel(Xls, '#PRO_TITULO', datosCronogramaValorado.PTitulo);
  sustituye_en_Excel(Xls, '#CODIGOPROYECTO', codProyecto);
  sustituye_en_Excel(Xls, '#REVISION', revision);
  sustituye_en_Excel(Xls, '#CODIGOREFERENCIAL', datosCronogramaValorado.PcodReferencial);
  sustituye_en_Excel(Xls, '#CIUDAD', datosCronogramaValorado.PCiudad);
  sustituye_en_Excel(Xls, '#PRO_FECHA', FormatDateTime('dd/mm/yyyy', Now));
  with DMPresupuesto.QEDOProyecto do
  begin
    ParamByName('codBase').AsString := base_activa.codBase;
    ParamByName('codPresupuesto').AsString := codProyecto;
    ParamByName('revision').AsString := revision;
    Open;
    First;
    X := 1;
    while not Eof do
    begin
      clonarLineaXLS(Xls, '#ITEM');
      sustituye_en_Excel(Xls, '#ITEM', IntToStr(X));
      sustituye_en_Excel(Xls, '#ROL', DMPresupuesto.QEDOProyectorolproyecto.AsString);
      sustituye_en_Excel(Xls, '#NOMBRE_RESPONSABLE', DMPresupuesto.QEDOProyectoresponsable.AsString);
      sustituye_en_Excel(Xls, '#CODIGO_STKR', DMPresupuesto.QEDOProyectoidstake.AsString);
      sustituye_en_Excel(Xls, '#ACTIVIDADES_CLAVE', DMPresupuesto.QEDOProyectoactividadclave.AsString);
      next;
      Inc(X);
    end;
    borraLineaPlantilla(Xls, '#ITEM');
  end;

end;

procedure TfrmVisorReportes.CompletaDirectorioEquipoAsignado(Xls: TExcelFile);
begin
  sustituye_en_Excel(Xls, '#PRO_TITULO', datosCronogramaValorado.PTitulo);
  sustituye_en_Excel(Xls, '#CODIGOPROYECTO', codProyecto);
  sustituye_en_Excel(Xls, '#REVISION', revision);
  sustituye_en_Excel(Xls, '#CODIGOREFERENCIAL', datosCronogramaValorado.PcodReferencial);
  sustituye_en_Excel(Xls, '#CIUDAD', datosCronogramaValorado.PCiudad);
  sustituye_en_Excel(Xls, '#PRO_FECHA', FormatDateTime('dd/mm/yyyy', Now));
  with DMPresupuesto.QDirectorioAsignados do
  begin
    ParamByName('icodBase').AsString := base_activa.codBase;
    ParamByName('icodPresupuesto').AsString := codProyecto;
    ParamByName('iRevision').AsString := revision;
    Open;
    First;
    while not Eof do
    begin
      clonarLineaXLS(Xls, '#ITEM');
      sustituye_en_Excel(Xls, '#ITEM', DMPresupuesto.QDirectorioAsignadosidGrid.AsString);
      sustituye_en_Excel(Xls, '#CODIGO_STKR', DMPresupuesto.QDirectorioAsignadosidFiscal.AsString);
      sustituye_en_Excel(Xls, '#NOMBRES', DMPresupuesto.QDirectorioAsignadosnombre.AsString);
      sustituye_en_Excel(Xls, '#APELLIDOS', DMPresupuesto.QDirectorioAsignadosapellidos.AsString);
      sustituye_en_Excel(Xls, '#DIRECCIONSTKR', DMPresupuesto.QDirectorioAsignadosDireccion.AsString);
      sustituye_en_Excel(Xls, '#CIUDADSTKR', DMPresupuesto.QDirectorioAsignadoslocalidad.AsString);
      sustituye_en_Excel(Xls, '#PROVINCIASTKR', DMPresupuesto.QDirectorioAsignadosprovincia.AsString);
      sustituye_en_Excel(Xls, '#PAISSTKR', DMPresupuesto.QDirectorioAsignadospais.AsString);
      sustituye_en_Excel(Xls, '#CORREOSTKR', DMPresupuesto.QDirectorioAsignadosemail.AsString);
      sustituye_en_Excel(Xls, '#ROL', DMPresupuesto.QDirectorioAsignadosrolPresupuesto.AsString);
      sustituye_en_Excel(Xls, '#TELEFONOSTKR', DMPresupuesto.QDirectorioAsignadostelefono.AsString);
      sustituye_en_Excel(Xls, '#PROFESION', DMPresupuesto.QDirectorioAsignadosTitulacion.AsString);
      next;
    end;
  end;
  borraLineaPlantilla(Xls, '#ITEM');
end;

procedure TfrmVisorReportes.CompletaEDTDiccionario(Xls: TExcelFile);
var
  tmpstr: string;
  X: Integer;
  Csearch: posExcel;
  R, C: Integer;
begin
  sustituye_en_Excel(Xls, '#PRO_TITULO', datosCronogramaValorado.PTitulo);
  sustituye_en_Excel(Xls, '#CODIGOPROYECTO', codProyecto);
  sustituye_en_Excel(Xls, '#REVISION', revision);
  sustituye_en_Excel(Xls, '#CODIGOREFERENCIAL', datosCronogramaValorado.PcodReferencial);
  sustituye_en_Excel(Xls, '#PRO_UBICACION', datosCronogramaValorado.PUbicacion);
  sustituye_en_Excel(Xls, '#PRO_FECHA', datosCronogramaValorado.PFecha_Inicio);
  sustituye_en_Excel(Xls, '#PRO_FECHA', FormatDateTime('dd/mm/yyyy', Now));
  sustituye_en_Excel(Xls, '#CIUDAD', datosCronogramaValorado.PCiudad);
  sustituye_en_Excel(Xls, '#PRO_OFERENTE', datosCronogramaValorado.POferente);

  Csearch := daPosicionExcel(Xls, datosCronogramaValorado.PTitulo);
  R := Csearch.RFila;
  C := Csearch.Columna;
  Xls.SetCellFormat(R, C, R, C + 1, 2); // Formato de border de celda

  for X := 0 to Length(lista_EDT) - 1 do
  begin
    clonarLineaXLS(Xls, '#CODIGOEDT');
    sustituye_en_Excel(Xls, '#CODIGOEDT', lista_EDT[X].codEdt);
    sustituye_en_Excel(Xls, '#DESCRIPCION_CUENTA_PAQUETE', lista_EDT[X].descripcion);
    tmpstr := lista_EDT[X].Responsable;
    sustituye_en_Excel(Xls, '#NOMBRE_RESPONSABLE', daResponsableyCargo(tmpstr));
    sustituye_en_Excel(Xls, '#CODIGO_STKR', daCodigoSTKR(tmpstr));
    sustituye_en_Excel(Xls, '#DEFINICION', lista_EDT[X].definicion);
  end;
  borraLineaPlantilla(Xls, '#CODIGOEDT');
end;

function TfrmVisorReportes.daCodigoSTKR(datos: string): string;
var
  X: Integer;
begin
  X := AnsiPos(' - ', datos);
  if X > 0 then
  begin
    datos := Copy(datos, 1, X - 1).Trim;
  end;
  Result := datos;
end;

function TfrmVisorReportes.daResponsableyCargo(datos: string): string;
var
  X: Integer;
begin
  X := AnsiPos(' - ', datos);
  if X > 0 then
  begin
    datos := Copy(datos, X + 3, Length(datos)).Trim;
  end;
  Result := datos;
end;

procedure TfrmVisorReportes.CompletaEDTValorada(Xls: TExcelFile);
var
  tmpstr: string;
  X: Integer;
begin
  // Completar Encabezado
  sustituye_en_Excel(Xls, '#PRO_TITULO', datosCronogramaValorado.PTitulo);
  sustituye_en_Excel(Xls, '#CODIGOPROYECTO', codProyecto);
  sustituye_en_Excel(Xls, '#REVISION', revision);
  sustituye_en_Excel(Xls, '#PRO_OFERENTE', datosCronogramaValorado.POferente);
  sustituye_en_Excel(Xls, '#CODIGOREFERENCIAL', datosCronogramaValorado.PcodReferencial);
  sustituye_en_Excel(Xls, '#PRO_UBICACION', datosCronogramaValorado.PUbicacion);
  sustituye_en_Excel(Xls, '#PRO_FECHA', datosCronogramaValorado.PFecha_Inicio);
  tmpstr := frmMain.lbl_SubtotalPresupuesto.text;
  tmpstr := quitaSimboloMoneda(quitaSignoMiles(tmpstr));
  tmpstr := CantidadALetra(StrToCurr(tmpstr), base_activa.moneda);
  sustituye_en_Excel(Xls, '#TEXTOTOTAL', tmpstr);
  for X := 0 to Length(lista_EDT) - 1 do
  begin
    clonarLineaXLS(Xls, '#CODIGOEDT');
    sustituye_en_Excel(Xls, '#CODIGOEDT', lista_EDT[X].codEdt);
    sustituye_en_Excel(Xls, '#DESCRIPCION_CUENTA_PAQUETE', lista_EDT[X].descripcion);
    sustituye_en_Excel(Xls, '#SUBTOTAL_CUENTA', lista_EDT[X].Valor);
  end;
  borraLineaPlantilla(Xls, '#CODIGOEDT');
end;

procedure TfrmVisorReportes.RecogeDatosEdt();
var
  X: Integer;
begin
  X := 0;
  SetLength(lista_EDT, 0);
  with DMPresupuesto.QEDT_Diccionario do
  begin
    ParamByName('codBase').AsString := base_activa.codBase;
    ParamByName('codPresupuesto').AsString := codProyecto;
    ParamByName('Revision').AsString := revision;
    Open;
    First;
    while not Eof do
    begin
      SetLength(lista_EDT, X + 1);
      lista_EDT[X].codEdt := DMPresupuesto.QEDT_DiccionariocodEdt.AsString;
      lista_EDT[X].descripcion := DMPresupuesto.QEDT_Diccionariodescripcion.AsString;
      lista_EDT[X].Responsable := DMPresupuesto.QEDT_DiccionarioResponsable.AsString;
      lista_EDT[X].definicion := DMPresupuesto.QEDT_DiccionarioDefinicion.AsString;
      next;
      Inc(X);
    end;
  end;
end;

procedure TfrmVisorReportes.RecogeDatosEdt_valorada();
var
  X: Integer;
begin
  X := 0;
  SetLength(lista_EDT, 0);
  with DMPresupuesto.QEDT_Valorada do
  begin
    close;
    ParamByName('codBase').AsString := base_activa.codBase;
    ParamByName('codPresupuesto').AsString := codProyecto;
    ParamByName('Revision').AsString := revision;
    Execute;
    First;
    while not Eof do
    begin
      SetLength(lista_EDT, X + 1);
      lista_EDT[X].codEdt := DMPresupuesto.QEDT_ValoradaPTotal.AsString;
      lista_EDT[X].descripcion := DMPresupuesto.QEDT_Valoradadescripcion.AsString;
      lista_EDT[X].Responsable := DMPresupuesto.QEDT_ValoradaResponsable.AsString;
      lista_EDT[X].definicion := DMPresupuesto.QEDT_ValoradaDefinicion.AsString;
      lista_EDT[X].Valor := DMPresupuesto.QEDT_ValoradaPTotal.AsString;
      next;
      Inc(X);
    end;
  end;
end;

procedure TfrmVisorReportes.CompletaTotalParcialCronogramaValorado(Xls: TExcelFile);
const
  trigger = '#TOTAL_PARCIAL';
var
  R, C: Integer;
  nPeridodos: Integer;
  Csearch: posExcel;
  X: Integer;
  Valor: string;
begin
  Csearch := daPosicionExcel(Xls, trigger);
  R := Csearch.RFila;
  C := Csearch.Columna;
  nPeridodos := StrToIntDef(frmMain.lbl_cronogramaNPeriodos.text, -1);
  for X := 0 to nPeridodos - 1 do
  begin
    Valor := frmMain.grid_CronoTotales.cells[X, 0];
    Valor := ajustaStringtoMoney(Valor);
    Xls.SetCellValue(R, C, Valor, -1);
    Xls.SetCellFormat(R, C, R, C, 2);
    Inc(C);
  end;
end;

procedure TfrmVisorReportes.CompletaPorcentajeParcialCronogramaValorado(Xls: TExcelFile);
const
  trigger = '#PORCENT_PARCIAL';
var
  R, C: Integer;
  nPeridodos: Integer;
  Csearch: posExcel;
  X: Integer;
  Valor: string;
begin
  Csearch := daPosicionExcel(Xls, trigger);
  R := Csearch.RFila;
  C := Csearch.Columna;
  nPeridodos := StrToIntDef(frmMain.lbl_cronogramaNPeriodos.text, -1);
  for X := 0 to nPeridodos - 1 do
  begin
    Valor := frmMain.grid_CronoTotales.cells[X, 1];
    Valor := ajustaStringtoMoney(Valor);
    Xls.SetCellValue(R, C, Valor, -1);
    Xls.SetCellFormat(R, C, R, C, 2);
    Inc(C);
  end;
end;

procedure TfrmVisorReportes.CompletaTotalAcumuladoCronogramaValorado(Xls: TExcelFile);
const
  trigger = '#TOTAL_ACUM';
var
  R, C: Integer;
  nPeridodos: Integer;
  Csearch: posExcel;
  X: Integer;
  Valor: string;
begin
  Csearch := daPosicionExcel(Xls, trigger);
  R := Csearch.RFila;
  C := Csearch.Columna;
  nPeridodos := StrToIntDef(frmMain.lbl_cronogramaNPeriodos.text, -1);
  for X := 0 to nPeridodos - 1 do
  begin
    Valor := frmMain.grid_CronoTotales.cells[X, 2];
    Valor := ajustaStringtoMoney(Valor);
    Xls.SetCellValue(R, C, Valor, -1);
    Xls.SetCellFormat(R, C, R, C, 2); // Formato de border de celda
    Inc(C);
  end;
end;

procedure TfrmVisorReportes.CompletaPorcentajeAcumuladoCronogramaValorado(Xls: TExcelFile);
const
  trigger = '#PORCENT_ACUM';
var
  R, C: Integer;
  nPeridodos: Integer;
  Csearch: posExcel;
  X: Integer;
  Valor: string;
begin
  Csearch := daPosicionExcel(Xls, trigger);
  R := Csearch.RFila;
  C := Csearch.Columna;
  nPeridodos := StrToIntDef(frmMain.lbl_cronogramaNPeriodos.text, -1);
  for X := 0 to nPeridodos - 1 do
  begin
    Valor := frmMain.grid_CronoTotales.cells[X, 3];
    Valor := ajustaStringtoMoney(Valor);
    Xls.SetCellValue(R, C, Valor, -1);
    Xls.SetCellFormat(R, C, R, C, 2);
    Inc(C);
  end;
end;

procedure TfrmVisorReportes.CompletaCronogramaValoradoDatosPeriodosSERCOP(Xls: TExcelFile);
var
  R, C: Integer;
  X, Y: Integer;
  nPeriodos: Integer;
  Csearch: posExcel;
  ordinalPeriodo: string;
begin
  nPeriodos := StrToIntDef(frmMain.lbl_cronogramaNPeriodos.text, -1) - 2;
  ordinalPeriodo := ordinalPeriodos[frmMain.cbb_cronoTipoPeriodo.ItemIndex + 1];

  Csearch := daPosicionExcel(Xls, 'TIEMPO EN');
  R := Csearch.RFila;
  C := Csearch.Columna;
  Xls.MergeCells(R, C, R, C + nPeriodos + 1);
  Xls.SetCellFormat(R, C, R, C + nPeriodos + 1, 2);

  Csearch := daPosicionExcel(Xls, '#PRO_TIPO_PERIODO');
  R := Csearch.RFila;
  C := Csearch.Columna;
  Xls.MergeCells(R, C, R, C + nPeriodos + 1);
  sustituye_en_Excel(Xls, '#PRO_TIPO_PERIODO', ordinalPeriodo);
  Xls.SetCellFormat(R, C, R, C + nPeriodos + 1, 2);

  Csearch := daPosicionExcel(Xls, '#PRO_NUM_PERIODO');
  R := Csearch.RFila;
  C := Csearch.Columna;
  X := 1;
  for Y := C to C + nPeriodos do
  begin
    copiaXLSRow(Xls, R, C, R, C, R, C + 1);
    sustituye_en_Excel(Xls, '#PRO_NUM_PERIODO', IntToStr(X));
    Inc(C);
    Inc(X);
  end;
  sustituye_en_Excel(Xls, '#PRO_NUM_PERIODO', IntToStr(X));

  Csearch := daPosicionExcel(Xls, '#DATOS_PERIODO');
  R := Csearch.RFila;
  C := Csearch.Columna;
  for Y := C to C + nPeriodos do
  begin
    copiaXLSRow(Xls, R, C, R, C, R, C + 1);
    Inc(C);
  end;

  Csearch := daPosicionExcel(Xls, '#DESCRIPCION');
  R := Csearch.RFila;
  C := Csearch.Columna;
  X := 1;
  while X < frmMain.grid_crono0.RowCount - 1 do
  begin
    if frmMain.grid_crono0.cells[2, X] <> '' then
    begin
      copiaXLSRow(Xls, R, 1, R, Xls.ColCount, R + 1, 1);
      Inc(R);
    end;
    Inc(X);
  end;

  Csearch := daPosicionExcel(Xls, '#TOTAL_PARCIAL');
  R := Csearch.RFila;
  C := Csearch.Columna;
  for Y := C to C + nPeriodos do
  begin
    copiaXLSRow(Xls, R, C, R, C, R, C + 1);
    Inc(C);
  end;

  Csearch := daPosicionExcel(Xls, '#PORCENT_PARCIAL');
  R := Csearch.RFila;
  C := Csearch.Columna;
  for Y := C to C + nPeriodos do
  begin
    copiaXLSRow(Xls, R, C, R, C, R, C + 1);
    Inc(C);
  end;

  Csearch := daPosicionExcel(Xls, '#TOTAL_ACUM');
  R := Csearch.RFila;
  C := Csearch.Columna;
  for Y := C to C + nPeriodos do
  begin
    copiaXLSRow(Xls, R, C, R, C, R, C + 1);
    Inc(C);
  end;

  Csearch := daPosicionExcel(Xls, '#PORCENT_ACUM');
  R := Csearch.RFila;
  C := Csearch.Columna;
  for Y := C to C + nPeriodos do
  begin
    copiaXLSRow(Xls, R, C, R, C, R, C + 1);
    Inc(C);
  end;

  Csearch := daPosicionExcel(Xls, '#DESCRIPCION');
  R := Csearch.RFila;
  C := Csearch.Columna;
  X := 1;
  while X < frmMain.grid_crono0.RowCount - 1 do
  begin
    if frmMain.grid_crono0.cells[2, X] <> '' then
    begin
      Xls.SetCellValue(R, C, frmMain.grid_crono0.cells[3, X], -1);
      Xls.SetCellValue(R, C + 1, frmMain.grid_crono0.cells[5, X], -1);
      Xls.SetCellValue(R, C + 2, frmMain.grid_crono0.cells[6, X], -1);
      Xls.SetCellValue(R, C + 3, frmMain.grid_crono0.cells[7, X], -1);
      Inc(R);
    end;
    Inc(X);
  end;
  CompletaDatosCronogramaValoradoSERCOP(Xls);
  borraLineaPlantilla(Xls, '#DESCRIPCION');
end;

procedure TfrmVisorReportes.CompletaCurvaS(Xls: TExcelFile; rutaPlantillaProyecto,
  nombreExcelTPresupuesto: string);
var
  nPeriodos: Integer;
  ValoresCurvaS: array of Real;
  ValoresInversion: array of Real;
  ValoresAvanceParcial: array of string;
  ValoresAvanceAcumulado: array of string;
  Valor: double;
  tmpstr: string;
  rowInicio: Integer;
  punteroInicio: Integer;
  X: Integer;
  posicion: posExcel;
begin
  nPeriodos := StrToIntDef(frmMain.lbl_cronogramaNPeriodos.text, -1);
  punteroInicio := punteroInicioCurvaS;
  try
    for X := 0 to nPeriodos - 1 do
    begin
      SetLength(ValoresCurvaS, X + 1);
      SetLength(ValoresInversion, X + 1);
      SetLength(ValoresAvanceParcial, X + 1);
      SetLength(ValoresAvanceAcumulado, X + 1);

      tmpstr := frmMain.grid_CronoTotales.cells[X, 2];
      Valor := quitaFormatFloat(tmpstr);
      ValoresCurvaS[X] := Valor;

      tmpstr := frmMain.grid_CronoTotales.cells[X, 0];
      Valor := quitaFormatFloat(tmpstr);
      ValoresInversion[X] := Valor;

      tmpstr := frmMain.grid_CronoTotales.cells[X, 1];
      ValoresAvanceParcial[X] := tmpstr;

      tmpstr := frmMain.grid_CronoTotales.cells[X, 3];
      ValoresAvanceAcumulado[X] := tmpstr;
    end;

    if FileExists(nombreExcelTPresupuesto) then
      DeleteFile(PWideChar(nombreExcelTPresupuesto));
    DMPresupuesto.AjustaSeries(rutaPlantillaProyecto, nPeriodos);
    Xls.Open(rutaPlantillaProyecto);
    for rowInicio := punteroInicio to punteroInicio + nPeriodos - 1 do
    begin
      clonarLineaXLS(Xls, '#PERIODO');
      sustituye_en_Excel(Xls, '#PERIODO', rowInicio - punteroInicio);

      sustituye_en_Excel(Xls, '#ACUMULADA', ValoresCurvaS[rowInicio - punteroInicio]);
      sustituye_en_Excel(Xls, '#MENSUAL', ValoresInversion[rowInicio - punteroInicio]);
      sustituye_en_Excel(Xls, '#PORCENT_PARCIAL', ValoresAvanceParcial[rowInicio - punteroInicio]);
      sustituye_en_Excel(Xls, '#PORCENT_ACUM', ValoresAvanceAcumulado[rowInicio - punteroInicio]);
    end;

    posicion := daPosicionExcel(Xls, '#PERIODO');
    borraLineaPlantilla(Xls, '#PERIODO');
    rellena_en_Excel(Xls, 'A', posicion.RFila + 2, '#CIUDAD');
    rellena_en_Excel(Xls, 'B', posicion.RFila + 2, '#PRO_FECHA');
    rellena_en_Excel(Xls, 'A', posicion.RFila + 2 + 6, 'FIRMA DEL OFERENTE O ');
    rellena_en_Excel(Xls, 'A', posicion.RFila + 2 + 7, 'REPRESENTANTE LEGAL ');
    Xls.Save(nombreExcelTPresupuesto);
    excelProyecto.Open(nombreExcelTPresupuesto);
  except
    ShowMessage('Archivo Excel utilizado por otro proceso. Liberelo y vuelva a intentarlo.');
  end;
end;

procedure TfrmVisorReportes.CompletaDatosCronogramaValoradoSERCOP(Xls: TExcelFile);
var
  X, R: Integer;
  valorCelda: string;
  nPeriodos: Integer;
begin
  R := 1;
  nPeriodos := StrToIntDef(frmMain.lbl_cronogramaNPeriodos.text, -1);
  while R < frmMain.grid_crono2.RowCount do
  begin
    if frmMain.grid_crono2.cells[1, R] <> '' then
    begin
      for X := 0 to nPeriodos - 1 do
      begin
        valorCelda := frmMain.grid_crono2.cells[X, R];
        sustituye_en_Excel(Xls, '#DATOS_PERIODO', valorCelda);
      end;
    end;
    Inc(R);
  end;
end;

procedure TfrmVisorReportes.CompletaDesagregacionSercop(Xls: TExcelFile);
var
  nSecuenciaAPU: Integer;
  X: Integer;
  codApu: string;
  tmpstr: string;
begin
  nSecuenciaAPU := 1;
  for X := 1 to frmMain.grid_DesagregacionAPUS.RowCount - 1 do
  begin
    codApu := frmMain.grid_DesagregacionAPUS.cells[11, X];
    if codApu <> '' then
    begin
      clonarLineaXLS(Xls, '#NUMERO_SECUENCIA');
      sustituye_en_Excel(Xls, '#NUMERO_SECUENCIA', nSecuenciaAPU);
      sustituye_en_Excel(Xls, '#DESCRIPCION', frmMain.grid_DesagregacionAPUS.cells[2, X]);
      sustituye_en_Excel(Xls, '#UNIDAD', frmMain.grid_DesagregacionAPUS.cells[3, X]);
      sustituye_en_Excel(Xls, '#CANTIDAD', frmMain.grid_DesagregacionAPUS.cells[4, X]);
      sustituye_en_Excel(Xls, '#PUNITARIO', frmMain.grid_DesagregacionAPUS.cells[5, X]);
      sustituye_en_Excel(Xls, '#SUBTOTAL', frmMain.grid_DesagregacionAPUS.cells[6, X]);
      tmpstr := frmMain.grid_DesagregacionAPUS.cells[7, X];
      tmpstr := AnsiReplaceStr(tmpstr, '%', '').Trim;
      sustituye_en_Excel(Xls, '#PRAPU', forzarNdecimales(StrToFloat(tmpstr), 2) + '%');

      tmpstr := frmMain.grid_DesagregacionAPUS.cells[8, X];
      tmpstr := AnsiReplaceStr(tmpstr, '%', '').Trim;
      sustituye_en_Excel(Xls, '#VAEAPU', forzarNdecimales(StrToFloat(tmpstr), 2) + '%');
      tmpstr := frmMain.grid_DesagregacionAPUS.cells[9, X];
      tmpstr := AnsiReplaceStr(tmpstr, '%', '').Trim;
      sustituye_en_Excel(Xls, '#AEPAPU', forzarNdecimales(StrToFloat(tmpstr), 2) + '%');
      Inc(nSecuenciaAPU);
    end;
  end;
  borraLineaPlantilla(Xls, '#NUMERO_SECUENCIA');
  sustituye_en_Excel(Xls, '#SUBTOTALSINIVA', frmMain.lbl_DesagPrecioTotalRubro.text);
  tmpstr := frmMain.lbl_DesgAgregadoPonderado.text;
  tmpstr := AnsiReplaceStr(tmpstr, '%', '').Trim;
  sustituye_en_Excel(Xls, '#AEPAPUTOTAL', forzarNdecimales(StrToFloat(tmpstr), 2) + '%');
end;

procedure TfrmVisorReportes.CompletaCronogramaValoradoDatosPeriodos(Xls: TExcelFile; CellInicio: posExcel);
var
  R, C: Integer;
  X, Y: Integer;
  nPeriodos: Integer;
  gridTratar: Integer;
  Csearch: posExcel;
begin
  gridTratar := -1;
  if frmMain.tbc1.ActiveTab = frmMain.tab_1 then
  begin
    gridTratar := 0;
  end;
  if frmMain.tbc1.ActiveTab = frmMain.tab_2 then
  begin
    gridTratar := 1;
  end;
  if frmMain.tbc1.ActiveTab = frmMain.tab_3 then
  begin
    gridTratar := 2;
  end;
  if frmMain.tbc1.ActiveTab = frmMain.tab_4 then
  begin
    gridTratar := 3;
  end;
  if frmMain.tbc1.ActiveTab = frmMain.tab_5 then
  begin
    gridTratar := 4;
  end;
  if gridTratar > -1 then
  begin
    R := CellInicio.RFila;
    nPeriodos := StrToIntDef(frmMain.lbl_cronogramaNPeriodos.text, 0);
    nPeriodos := nPeriodos - 2;
    if nPeriodos > 0 then
    begin
      for X := 1 to frmMain.grid_crono0.RowCount do
      begin
        for Y := C to C + nPeriodos do
        begin
          copiaXLSRow(Xls, R, Y, R, Y, R, Y + 1);
        end;
        Inc(R);
      end;
    end;
    Csearch := daPosicionExcel(Xls, '#ITEM');
    R := Csearch.RFila;

    case gridTratar of
      0:
        begin
          // cronograma de porcentajes
          for X := 1 to frmMain.grid_crono1.RowCount - 1 do
          begin
            copiaXLSRow(Xls, R, 1, R, Xls.RowCount, R + 1, 1);
            Inc(R);
          end;
          RellenaExcelParteInicio(Xls);
          RellenaExcelParteCronograma(gridTratar, Xls, nPeriodos);
        end;
      1:
        begin
          // cronograma de inversion
          for X := 1 to frmMain.grid_crono2.RowCount - 1 do
          begin
            copiaXLSRow(Xls, R, 1, R, Xls.RowCount, R + 1, 1);
            Inc(R);
          end;
          RellenaExcelParteInicio(Xls);
        end;
      2:
        begin
          // cronograma de Cantidades
          for X := 1 to frmMain.grid_crono3.RowCount - 1 do
          begin
            copiaXLSRow(Xls, R, 1, R, Xls.RowCount, R + 1, 1);
            Inc(R);
          end;
          RellenaExcelParteInicio(Xls);
        end;
      3:
        begin
          // Grafico de Barras
          for X := 1 to frmMain.grid_GBarras.RowCount - 1 do
          begin
            copiaXLSRow(Xls, R, 1, R, Xls.RowCount, R + 1, 1);
            Inc(R);
          end;
          RellenaExcelParteInicio(Xls);
        end;
      4:
        begin
          // Curva S
          RellenaExcelParteInicio(Xls);
        end;
    end;
    Csearch := daPosicionExcel(Xls, 'PERÍODOS');
    R := Csearch.RFila;
    C := Csearch.Columna;
    Xls.MergeCells(R, C, R, C + nPeriodos + 1);
    Csearch := daPosicionExcel(Xls, 'PERÍODOS');
    R := Csearch.RFila;
    C := Csearch.Columna;
    Xls.SetCellFormat(R, C, R, C + nPeriodos + 1, 2);

  end;
end;

procedure TfrmVisorReportes.RellenaExcelParteCronograma(gridTratar: Integer; Xls: TExcelFile;
  nPeriodos: Integer);
var
  Csearch: posExcel;
  R, C: Integer;
  X, Y: Integer;
  Valor: string;
begin
  for X := 1 to frmMain.grid_crono1.RowCount - 1 do
  begin
    sustituye_en_Excel(Xls, '#PRO_NUM_PERIODO', IntToStr(X));
    case gridTratar of
      0:
        begin

          Csearch := daPosicionExcel(Xls, '#DATOPERIODO');
          R := Csearch.RFila;
          C := Csearch.Columna;

          for Y := 0 to nPeriodos + 1 do
          begin
            Valor := frmMain.grid_crono1.cells[Y, X];
            Xls.SetCellValue(R, C, Valor, -1);
            Inc(C);
          end;
          Inc(R);

        end;
      1:
        begin

          Csearch := daPosicionExcel(Xls, '#DATOPERIODO');
          R := Csearch.RFila;
          C := Csearch.Columna;

          for Y := 0 to nPeriodos + 1 do
          begin
            Valor := frmMain.grid_crono2.cells[Y, X];
            Xls.SetCellValue(R, C, Valor, -1);
            Inc(C);
          end;
          Inc(R);

        end;
      2:
        begin
          Csearch := daPosicionExcel(Xls, '#DATOPERIODO');
          R := Csearch.RFila;
          C := Csearch.Columna;

          for Y := 0 to nPeriodos + 1 do
          begin
            Valor := frmMain.grid_crono1.cells[Y, X];
            Xls.SetCellValue(R, C, Valor, -1);
            Inc(C);
          end;
          Inc(R);

        end;
      3:
        begin
          Csearch := daPosicionExcel(Xls, '#DATOPERIODO');
          R := Csearch.RFila;
          C := Csearch.Columna;

          for Y := 0 to nPeriodos + 1 do
          begin
            Valor := frmMain.grid_crono1.cells[Y, X];
            Xls.SetCellValue(R, C, Valor, -1);
            Inc(C);
          end;
          Inc(R);
        end;
    end;
  end;
  sustituye_en_Excel(Xls, '#PRO_NUM_PERIODO', IntToStr(X));
end;

procedure TfrmVisorReportes.RellenaExcelParteInicio(Xls: TExcelFile);
var
  X: Integer;
  Valor: string;
  Csearch: posExcel;
  R, C: Integer;
begin
  for X := 1 to frmMain.grid_crono0.RowCount do
  begin
    Csearch := daPosicionExcel(Xls, '#ITEM');
    R := Csearch.RFila;
    C := Csearch.Columna;
    Valor := frmMain.grid_crono0.cells[0, X];
    if Valor = '' then
      Valor := frmMain.grid_crono0.cells[1, X];
    Xls.SetCellValue(R, C, Valor, -1);
    Inc(C);
    Valor := frmMain.grid_crono0.cells[2, X];
    Xls.SetCellValue(R, C, Valor, -1);
    Inc(C);
    Valor := frmMain.grid_crono0.cells[3, X];
    Xls.SetCellValue(R, C, Valor, -1);
    Inc(C);
    Valor := frmMain.grid_crono0.cells[4, X];
    Xls.SetCellValue(R, C, Valor, -1);
    Inc(C);
    Valor := frmMain.grid_crono0.cells[5, X];
    Xls.SetCellValue(R, C, Valor, -1);
    Inc(C);
    Valor := frmMain.grid_crono0.cells[6, X];
    Xls.SetCellValue(R, C, Valor, -1);
    Inc(C);
    Valor := frmMain.grid_crono0.cells[7, X];
    Xls.SetCellValue(R, C, Valor, -1);
    Inc(C);
  end;
end;

function TfrmVisorReportes.ajustaStringtoMoney(datos: string): string;
var
  X: Integer;
  valordatos: Currency;
  simboloMiles: string;
begin
  // '$ 2,520'
  Result := datos;
  X := AnsiPos(base_activa.simboloMoneda, datos);
  if X > 0 then
  begin
    simboloMiles := ',';
    simboloMiles := decimal_correcto(simboloMiles);
    if simboloMiles = ',' then
      simboloMiles := '.'
    else
      simboloMiles := ',';
    datos := StringReplace(datos, base_activa.simboloMoneda, '', []).Trim;
    datos := StringReplace(datos, simboloMiles, '', []).Trim;
    valordatos := StrToFloatDef(datos, 0);
    Result := FormatFloat(cadenaCurrency, valordatos);
  end;
end;

procedure TfrmVisorReportes.CompletaCronogramaValoradoDatosGenerales();
begin
  sustituye_en_Excel(excelProyecto, '#PRO_TITULO', datosCronogramaValorado.PTitulo);
  sustituye_en_Excel(excelProyecto, '#REVISION', revision);
  sustituye_en_Excel(excelProyecto, '#PRO_OFERENTE', datosCronogramaValorado.POferente);
  sustituye_en_Excel(excelProyecto, '#PRO_UBICACION', datosCronogramaValorado.PUbicacion);
  sustituye_en_Excel(excelProyecto, '#PRO_FECHA_INICIO', datosCronogramaValorado.PFecha_Inicio);
  sustituye_en_Excel(excelProyecto, '#PRO_FECHA_FIN', datosCronogramaValorado.PFecha_Fin);
  sustituye_en_Excel(excelProyecto, '#PRO_PLAZO', datosCronogramaValorado.PPlazo);
  sustituye_en_Excel(excelProyecto, '#PRO_TIPO_PERIODO',
    frmMain.cbb_cronoTipoPeriodo.Items[frmMain.cbb_cronoTipoPeriodo.ItemIndex]);
  sustituye_en_Excel(excelProyecto, '#PRO_NUM_PERIODO', frmMain.lbl_cronogramaNPeriodos.text);
  sustituye_en_Excel(excelProyecto, '#CIUDAD', datosCronogramaValorado.PCiudad);
  sustituye_en_Excel(excelProyecto, '#PRO_FECHA', FormatDateTime('dd/mm/yyyy', Now));
end;

procedure TfrmVisorReportes.CompletaActaProyecto();
begin
  sustituye_en_Excel(excelProyecto, '#PRO_TITULO', datosActaProyecto.PTitulo);
  sustituye_en_Excel(excelProyecto, '#CODIGOPROYECTO', codProyecto);
  sustituye_en_Excel(excelProyecto, '#REVISION', revision);
  sustituye_en_Excel(excelProyecto, '#CODIGOREFERENCIAL', datosActaProyecto.PcodReferencial);
  sustituye_en_Excel(excelProyecto, '#DIRECCIONPROYECTO', datosActaProyecto.PDireccion);
  sustituye_en_Excel(excelProyecto, '#CIUDAD', datosActaProyecto.PCiudad);
  sustituye_en_Excel(excelProyecto, '#PAIS', datosActaProyecto.PPais);
  sustituye_en_Excel(excelProyecto, '#PROVINCIA', datosActaProyecto.PProvincia);
  sustituye_en_Excel(excelProyecto, '#OBJETOCONTRATO', datosActaProyecto.PObjetoContrato);
  sustituye_en_Excel(excelProyecto, '#AMBITOCONTRATACION', datosActaProyecto.PAmbitoContratacion);
  sustituye_en_Excel(excelProyecto, '#TIPOCONTRATO', datosActaProyecto.PTipoContrato);
  sustituye_en_Excel(excelProyecto, '#TIPOPROYECTO', datosActaProyecto.PTipoProyecto);
  sustituye_en_Excel(excelProyecto, '#CATEGORIAPROYECTO', datosActaProyecto.PCategoriaProyecto);
  sustituye_en_Excel(excelProyecto, '#TIPOCONSTRUCCION', datosActaProyecto.PTipoConstruccion);
  sustituye_en_Excel(excelProyecto, '#AREATERRENO', datosActaProyecto.PAreaTerreno);
  sustituye_en_Excel(excelProyecto, '#AREACONSTRUCCION', datosActaProyecto.PAreaConstruccion);
  sustituye_en_Excel(excelProyecto, '#PRO_FECHA_INICIO', datosActaProyecto.PFechaInicio);
  sustituye_en_Excel(excelProyecto, '#PRO_PLAZO', datosActaProyecto.PPlazoTiempo);
  sustituye_en_Excel(excelProyecto, '#PRO_FECHA_FIN', datosActaProyecto.PFechaFin);
  sustituye_en_Excel(excelProyecto, '#CIUDAD', datosActaProyecto.PCiudad);
  sustituye_en_Excel(excelProyecto, '#PRO_FECHA', FormatDateTime('dd/mm/yyyy', Now));
end;

procedure TfrmVisorReportes.generaCuerpoPresupuesto(Xls: TExcelFile);
var
  ArowInsercion: Integer;
  nitemAnt: string;
  tmpstr: string;
  codEdt, nitem, codItem, descripcion, unidad, cantidad, Punitario, Total: string;
begin
  with QPresupuestoItems do
  begin
    close;
    ParamByName('codPresupuesto').AsString := codProyecto;
    ParamByName('Revision').AsString := revision;
    ParamByName('codBase').AsString := base_activa.codBase;
    Prepare;
    ExecSQL;
    ArowInsercion := localizaArow(Xls, '#ITEM') - 1;
    while not Eof do
    begin
      Inc(ArowInsercion);
      codEdt := FieldByName('codEdt').AsString.Trim;
      nitem := FieldByName('codItems').AsString.Trim;
      codItem := FieldByName('codApuGenerico').AsString;
      descripcion := FieldByName('descripcion').AsString;
      unidad := FieldByName('unidad').AsString;
      cantidad := FieldByName('cantidad').AsString;
      cantidad := decimal_correcto(cantidad);
      Punitario := FieldByName('Punitario').AsString;
      Punitario := decimal_correcto(Punitario);
      Total := FieldByName('Ptotal').AsString;
      Total := decimal_correcto(Total);
      creaLineaPresupuesto(Xls, ArowInsercion, codEdt, nitem, codItem, descripcion, unidad, cantidad,
        Punitario, Total);
      next;
    end;
    borraLineaPlantilla(Xls, '#ITEM');
  end;
end;

procedure TfrmVisorReportes.estadoActions(estado: boolean);
begin
  btn_ActionPdf.Enabled := estado;
  btn_ActionPrint.Enabled := estado;
  lyt_PanelSelectPage.Enabled := estado;
  btn_ActionAutofit.Enabled := estado;
  btn_ActionZoom.Enabled := estado;
  btn_ActionGridlines.Enabled := estado;
  btn_ActionHeadings.Enabled := estado;
  btn_ActionExcel.Enabled := estado;
end;

procedure TfrmVisorReportes.GeneraReporteTipo2;
var
  X, Y: Integer;
  tmpstr: string;
  apusTratar: dat_localRespApus;
  codigoApus: string;
  nombreExcelTAPUS: string;
  tipoCuerpo: Integer;
  listadoAPUSConcatenar: TStringList;
  excelApus: TExcelFile;
begin
  if not DirectoryExists(carpetaGuardadoTemporal) then
    CreateDir(carpetaGuardadoTemporal);
  SERCOP := False;
  X := AnsiPos('sercop', LowerCase(XLSPlantilla));
  if X > 0 then
    SERCOP := True;
  listadoAPUSConcatenar := TStringList.Create;
  for X := 0 to listadoApusReporteAnalisis.Count - 1 do
  begin
    excelApus := TXlsFile.Create(False);
    excelApus.Open(XLSPlantilla);
    codigoApus := listadoApusReporteAnalisis[X];
    apusTratar := daDatos1Apus(codigoApus);
    if SERCOP then
    begin
      tipoCuerpo := 1;
      CrearEncabezadoAPUS_SERCOP(excelApus, apusTratar.codigoApus, apusTratar.descripcion,
        apusTratar.unidad);
    end
    else
    begin
      tipoCuerpo := 0;
      CrearEncabezadoAPUS(excelApus, apusTratar.codigoApus, apusTratar.descripcion, apusTratar.unidad);
    end;

    CrearResumenAPUS(excelApus, apusTratar.costoDirectoTotal, apusTratar.porcentajeIndirecto,
      apusTratar.costoIndirecto, apusTratar.Total, apusTratar.moneda);
    crearCuerpoAPUS(excelApus, codigoApus, tipoCuerpo, SSO, apusTratar.Total);
    if not DirectoryExists(carpetaGuardadoTemporal) then
      CreateDir(carpetaGuardadoTemporal);
    nombreExcelTAPUS := carpetaGuardadoTemporal + apusTratar.codigoApus + '.xls';
    listadoAPUSConcatenar.Add(nombreExcelTAPUS);
    excelApus.Save(nombreExcelTAPUS);
  end;
  SetLength(FileNames, listadoAPUSConcatenar.Count);
  for Y := 0 to listadoAPUSConcatenar.Count - 1 do
  begin
    FileNames[Y] := listadoAPUSConcatenar[Y];
  end;
  excelApus := Consolidate(FileNames, False);
  for Y := 0 to Length(FileNames) - 1 do
  begin
    DeleteFile(PWideChar(FileNames[Y]));
  end;
  excelApus.PrintToFit := True;
  excelApus.Save(carpetaGuardadoTemporal + 'ApusConsolidada.xls');
  LoadFile(carpetaGuardadoTemporal + 'ApusConsolidada.xls');
  estadoActions(True);
end;

procedure TfrmVisorReportes.EnableCommonActions(const Enable: boolean);
begin
  if Enable then
    Dec(DisabledCount)
  else
    Inc(DisabledCount);
  if DisabledCount < 0 then
    DisabledCount := 0;
  if Enable and (DisabledCount > 0) then
    exit;

  btn_ActionOpen.Enabled := Enable;
  btn_ActionGridlines.Enabled := Enable;
  btn_ActionHeadings.Enabled := Enable;
  btn_ActionRecalc.Enabled := Enable;
end;

procedure TfrmVisorReportes.ExportarExcelTipo2();
var
  SaveDialog: TSaveDialog;
begin

  SaveDialog := TSaveDialog.Create(nil);
  try
    SaveDialog.Title := 'Guardar Reporte';
    SaveDialog.Filter := 'Excel Files (*.xls)|*.xls|*.xlsx';
    if SaveDialog.Execute then
    begin
      Xls.PrintToFit := True;
      Xls.Save(SaveDialog.FileName + '.xls');
      TDialogService.MessageDialog('Reporte Guardado, ¿Abrir archivo?', TMsgDlgType.mtConfirmation,
        fmx.Dialogs.mbYesNoCancel, TMsgDlgBtn.mbNo, 0,
        procedure(const AResult: System.UITypes.TModalResult)
        begin
          if AResult = mrYES then
            ShellExecute(GetDesktopWindow, 'open', PWideChar(SaveDialog.FileName + '.xls'), nil, nil,
              SW_SHOWNORMAL);
        end);
    end
    else
    begin
      ShowMessage('Reporte Cancelado.');
    end;
  finally
    SaveDialog.free;
  end;
end;

procedure TfrmVisorReportes.act_ActivarCabeceraExecute(Sender: TObject);
var
  i: Integer;
  SaveActiveSheet: Integer;
begin
  if cbAllSheets.IsChecked then
  begin
    SaveActiveSheet := Xls.ActiveSheet;
    for i := 1 to Xls.SheetCount do
    begin
      Xls.ActiveSheet := i;
      Xls.PrintHeadings := btn_ActionHeadings.IsPressed;
    end;
    Xls.ActiveSheet := SaveActiveSheet;
  end
  else
  begin
    Xls.PrintHeadings := btn_ActionHeadings.IsPressed;
  end;
  MainPreview.InvalidatePreview;
end;

procedure TfrmVisorReportes.act_AjusteAnchoExecute(Sender: TObject);
var
  PopPoint: TPointF;
begin
  if not (Sender is TControl) then
    exit;
  PopPoint.X := (Sender as TControl).Position.X;
  PopPoint.Y := (Sender as TControl).Position.Y + (Sender as TControl).Height;
  PopPoint := ClientToScreen(PopPoint);
  AutofitMenu.Popup(PopPoint.X, PopPoint.Y);
end;

procedure TfrmVisorReportes.act_ExportarExcelExecute(Sender: TObject);
var
  entrar: Boolean;
  ForzarMarcaAgua: Boolean;
  Msg: string;
  InfoModulo: TInfoModuloUsuario;
  TipoPlan: TTipoPlanLicencia;
  JsonResp: TJSONObject;
  FechaSrv: TDateTime;
begin
  // 1) Preguntar a uLicenciasPermisos si podemos generar el reporte
  //    (para Excel realmente nos da igual la marca de agua)
  InfoModulo.Clear;
  entrar := InfoModulo.ValidarOperacionReporte(TUsuario, ID_usuario, srExcel, ForzarMarcaAgua, Msg);
  if not entrar then
  begin
    MuestraMensajeGiproy('Error', Msg);
    Exit;
  end;

  // 2) Si el plan es Exprés y tenemos token, registramos el uso online (mejor esfuerzo)
  TipoPlan := InfoModulo.TipoPlanDesdeDescripcion(TUsuario);
  if (TipoPlan = tpExpress) and (GlobalAuthToken <> '') then
  begin
    JsonResp := nil;
    try
      try
        if RegistrarUsoReporteExpress(UrlRegistrarUsoReporteExpress, GlobalAuthToken, codIDUSuario,
          FechaSrv, JsonResp) then
        begin
          // Si el servidor devuelve fecha válida, sincronizamos el INI local
          if (FechaSrv > 0) and Assigned(frmMain.Users) then
            frmMain.Users.SetLastReportDate(ID_usuario, FechaSrv);
        end;
      except
        on E: Exception do
        begin
          // Ignoramos errores de red/token para no bloquear la exportación
        end;
      end;
    finally
      JsonResp.Free;
    end;
  end;

  // 3) Si está permitido, generamos el Excel normalmente
  ExportarExcelTipo2();
end;

procedure TfrmVisorReportes.act_ExportarPDFExecute(Sender: TObject);
var
  ForzarMarcaAgua: Boolean;
  Msg: string;
  InfoModulo: TInfoModuloUsuario;
  TipoPlan: TTipoPlanLicencia;
  JsonResp: TJSONObject;
  FechaSrv: TDateTime;
begin
  // 1) Validar permisos según plan
  InfoModulo.Clear;
  if not InfoModulo.ValidarOperacionReporte(TUsuario, ID_usuario, srPdf, ForzarMarcaAgua, Msg) then
  begin
    MuestraMensajeGiproy('Error', Msg);
    Exit;
  end;

  // 2) Si el plan es Exprés y tenemos token, registramos el uso online (mejor esfuerzo)
  TipoPlan := InfoModulo.TipoPlanDesdeDescripcion(TUsuario);
  if (TipoPlan = tpExpress) and (GlobalAuthToken <> '') then
  begin
    JsonResp := nil;
    try
      try
        if RegistrarUsoReporteExpress(UrlRegistrarUsoReporteExpress, GlobalAuthToken, codIDUSuario,
          FechaSrv, JsonResp) then
        begin
          // Si el servidor devuelve fecha válida, sincronizamos el INI local
          if (FechaSrv > 0) and Assigned(frmMain.Users) then
            frmMain.Users.SetLastReportDate(ID_usuario, FechaSrv);
        end;
      except
        on E: Exception do
        begin
          // Ignoramos errores de red/token para no bloquear la exportación
        end;
      end;
    finally
      JsonResp.Free;
    end;
  end;

  // 3) Configurar protección según el plan
  SetPdfUseWatermark(ForzarMarcaAgua);
  if ForzarMarcaAgua then
  begin
    SetPdfUserInfo(ID_usuario + ' - ' + TUsuario);
    // Plan Express: se aplicará protección máxima con marcas de agua
  end;

  // 4) Continuar con la exportación
  if not PdfSaveDialog.Execute then
    Exit;

  PdfProgressBar.Value := 0;
  lblPdfPage.text := 'Inicializando';
  EnableCommonActions(False);
  btn_ActionPdf.Enabled := False;
  btnPdfCancel.Enabled := True;
  btnPdfCancel.text := 'Cancelar';

  pnlPdfOk.Visible := False;
  pnlPdfError.Visible := False;
  pnlPdf.Visible := True;

  FreeAndNil(PdfThread);

  // Usar la sintaxis correcta con TProc<>
  PdfThread := TPdfThread.Create(Xls,
    procedure(Progress: Integer; Msg: string)
    begin
      // Este callback se ejecuta en el contexto del thread
      TThread.Synchronize(nil,
        procedure
        begin
          PdfProgressBar.Value := Progress;
          lblPdfPage.text := Msg;
        end);
    end,
    procedure(Ok: boolean; Msg: string)
    begin
      // Este callback ya se ejecuta en el contexto principal gracias a Synchronize
      pnlPdf.Visible := False;
      if not Ok then
      begin
        pnlPdfError.Visible := True;
        lblPdfError.text := 'Error al crear PDF: ' + Msg;
      end
      else
      begin
        pnlPdfOk.Visible := True;
      end;
      EnableCommonActions(True);
      btn_ActionPdf.Enabled := True;
    end, PdfSaveDialog.FileName, cbAllSheets.IsChecked);

  PdfThread.Start;
end;

procedure TfrmVisorReportes.act_GenerarReporteExecute(Sender: TObject);
begin
  case modo of
    1: // Acta de Constitucion del Proyecto
      begin
        lbl_descripcion.text := 'Acta de Constitución del Proyecto';
        generaReporteProyecto;
      end;
    2: // Analisis
      begin
        lbl_descripcion.text := 'Analísis Precios Unitarios';
        GeneraReporteTipo2;
      end;
    3: // Cronograma de Trabajo  (Proyect no se usa aqui)
      begin

      end;
    4: // Cronograma Valorado
      begin
        lbl_descripcion.text := 'Cronograma Valorado';
        generaReporteProyecto;
      end;
    5: // Desagregacion Tecnologica
      begin
        lbl_descripcion.text := 'Desagregación Técnologica';
        generaReporteProyecto;
      end;
    6: // EDT - Diccionario
      begin
        lbl_descripcion.text := 'EDT - Diccionario';
        generaReporteProyecto;
      end;
    7: // EDT - Listado
      begin
        lbl_descripcion.text := 'EDT - Listado';
      end;
    8: // EDT - Valorada
      begin
        lbl_descripcion.text := 'EDT - Valoración';
        generaReporteProyecto;
      end;
    9: // Equipo del Proyecto (Stake Holders)
      begin
        lbl_descripcion.text := 'Equipo del Proyecto (StakeHolders)';
        generaReporteProyecto;
      end;
    10: // Estructura Descomposicion Organización (EDO)
      begin
        lbl_descripcion.text := 'Estructura Descomposición Organización (EDO)';
        generaReporteProyecto;
      end;
    11: // Formulas Polinomicas
      begin
        lbl_descripcion.text := 'Fórmula Polinomica';
        generaReporteProyecto;
      end;
    12: // Gestion de Tiempos
      begin
        lbl_descripcion.text := 'Gestión de Tiempos';
      end;
    13: // Porcentaje Indirectos
      begin
        lbl_descripcion.text := 'Porcentaje Indirectos';
      end;
    14: // Presupuestos
      begin
        lbl_descripcion.text := 'Presupuesto de Proyecto';
        GeneraReportePresupuesto;
      end;
  end;
end;

procedure TfrmVisorReportes.act_ImprimirExecute(Sender: TObject);
var
  ForzarMarcaAgua: Boolean;
  Msg: string;
  InfoModulo: TInfoModuloUsuario; // Agregar esta variable
begin
  // 1) Validar permisos de impresión según plan
  if not InfoModulo.ValidarOperacionReporte(TUsuario, ID_usuario, srImpresion, ForzarMarcaAgua, Msg) then
  begin
    MuestraMensajeGiproy('Error', Msg);
    Exit;
  end;

  // 2) Si procede, activar marca de agua
  SetPrintUseWatermark(ForzarMarcaAgua); // Cambiar esta línea

  // 3) Resto de la lógica existente
  if not PrintDialog.Execute then
    exit;

  PrintProgressBar.Value := 0;
  lblPrintPage.text := 'Inizializando';
  EnableCommonActions(False);
  btn_ActionPrint.Enabled := False;

  btnPrintCancel.Enabled := True;
  btnPrintCancel.text := 'Cancelar';

  pnlPrintingOk.Visible := False;
  pnlPrintingError.Visible := False;
  pnlPrinting.Visible := True;

  FreeAndNil(PrintingThread);
  PrintingThread := TPrintingThread.Create(Xls,
    procedure(Progress: Integer; Msg: string)
    begin
      PrintProgressBar.Value := Progress;
      lblPrintPage.text := Msg;
    end,
    procedure(Ok: boolean; Msg: string)
    begin
      pnlPrinting.Visible := False;
      if not Ok then
      begin
        pnlPrintingError.Visible := True;
        lbl_PrintingError.text := 'Error al imprimir: ' + Msg;
      end
      else
      begin
        pnlPrintingOk.Visible := True;
      end;
      EnableCommonActions(True);
      btn_ActionPrint.Enabled := True;
    end, '', cbAllSheets.IsChecked);

  PrintingThread.Start;
end;

procedure TfrmVisorReportes.act_VerGuiasExecute(Sender: TObject);
var
  i: Integer;
  SaveActiveSheet: Integer;
begin
  if cbAllSheets.IsChecked then
  begin
    SaveActiveSheet := Xls.ActiveSheet;
    for i := 1 to Xls.SheetCount do
    begin
      Xls.ActiveSheet := i;
      Xls.PrintGridLines := btn_ActionGridlines.IsPressed;
    end;
    Xls.ActiveSheet := SaveActiveSheet;
  end
  else
  begin
    Xls.PrintGridLines := btn_ActionGridlines.IsPressed;
  end;
  MainPreview.InvalidatePreview;
end;

procedure TfrmVisorReportes.act_ZoomExecute(Sender: TObject);
var
  p: TPointF;
begin
  pnlZoom.Visible := not pnlZoom.Visible;
  if pnlZoom.Visible then
  begin
    p := TPointF.Create(btn_ActionZoom.Position.Point.X, btn_ActionZoom.Position.Point.Y);
    p.Y := p.Y + btn_ActionZoom.Height;
    pnlZoom.Position.Point := p;
    TrackBarZoom.SetFocus;
  end;
end;

procedure TfrmVisorReportes.btn100Click(Sender: TObject);
begin
  MainPreview.Zoom := 1;
  pnlZoom.Visible := False;
end;

procedure TfrmVisorReportes.btn150Click(Sender: TObject);
begin
  MainPreview.Zoom := 1.50;
  pnlZoom.Visible := False;
end;

procedure TfrmVisorReportes.btn25Click(Sender: TObject);
begin
  MainPreview.Zoom := 0.25;
  pnlZoom.Visible := False;
end;

procedure TfrmVisorReportes.btn50Click(Sender: TObject);
begin
  MainPreview.Zoom := 0.50;
  pnlZoom.Visible := False;
end;

procedure TfrmVisorReportes.btn75Click(Sender: TObject);
begin
  MainPreview.Zoom := 0.75;
  pnlZoom.Visible := False;
end;

procedure TfrmVisorReportes.btnOpenGeneratedFileClick(Sender: TObject);
begin
{$IFDEF MSWINDOWS}
  ShellExecute(0, 'open', PChar(PdfSaveDialog.FileName), '', '', SW_SHOWNORMAL);
{$ENDIF}
{$IFDEF POSIX}
  _system(PAnsiChar('open ' + UTF8Encode(PdfSaveDialog.FileName)));
{$ENDIF POSIX}
end;

procedure TfrmVisorReportes.btnPdfCancelClick(Sender: TObject);
begin
  if PdfThread = nil then
  begin
    pnlPdf.Visible := False;
    exit;
  end;
  btnPdfCancel.Enabled := False;
  btnPdfCancel.text := 'Cancelando...';
  PdfThread.Terminate;
end;

procedure TfrmVisorReportes.btnPdfErrorCloseClick(Sender: TObject);
begin
  pnlPdfError.Visible := False;
end;

procedure TfrmVisorReportes.btnPdfOkCloseClick(Sender: TObject);
begin
  pnlPdfOk.Visible := False;
end;

procedure TfrmVisorReportes.btnPrintCancelClick(Sender: TObject);
begin
  if PrintingThread = nil then
  begin
    pnlPrinting.Visible := False;
    exit;
  end;
  btnPrintCancel.Enabled := False;
  btnPrintCancel.text := 'Cancelando...';
  PrintingThread.Terminate;
end;

procedure TfrmVisorReportes.btnPrintingErrorCloseClick(Sender: TObject);
begin
  pnlPrintingError.Visible := False;
end;

procedure TfrmVisorReportes.btnPrintOkCloseClick(Sender: TObject);
begin
  pnlPrintingOk.Visible := False;
end;

function TfrmVisorReportes.cargarPlantillasProyecto(modoE: Integer): string;
var
  qry: TUniQuery;
begin
  qry := TUniQuery.Create(nil);
  Result := '';
  try
    with qry do
    begin
      Connection := DModule_1.con2;
      close;
      sql.Clear;
      { /* }
      sql.Add('SELECT ' + '  e.* ' + 'FROM ' + '  usuarios u ' +
        '  INNER JOIN empresas_config e ON e.CodUnico = u.configBase ' + 'WHERE ' +
        '  u.email = :email_usuario ');
      { */ }
      ParamByName('email_usuario').AsString := id_usuario;
      Prepare;
      ExecSQL;
      case modoE of
        1:
          begin
            Result := FieldByName('RConstitucionProyecto').AsString;
          end;
        4:
          begin
            Result := FieldByName('RcronogramaValorado').AsString;
            if frmMain.tbc1.ActiveTab = frmMain.tab_5 then
              Result := '000 - Curva S';
          end;
        5:
          begin
            Result := FieldByName('RDesagregacionTecnologica').AsString;
          end;
        51:
          begin
            Result := FieldByName('RDesagregacionTecnologicaAPUS').AsString;
          end;
        6:
          begin
            Result := FieldByName('REDTDiccionario').AsString;
          end;
        8:
          begin
            Result := FieldByName('REDTValorada').AsString;
          end;
        9:
          begin
            Result := FieldByName('REquipoProyecto').AsString;
          end;
        10:
          begin
            Result := FieldByName('RDescomposicionOrganizacion').AsString;
          end;
        11:
          begin
            Result := FieldByName('RFormulaPolinomicas').AsString;
          end;
      end;
    end;
  finally
    qry.free;
  end;
end;

procedure TfrmVisorReportes.cbAllSheetsChange(Sender: TObject);
begin
  lyt_PanelSheets.Visible := not cbAllSheets.IsChecked;
  ImgExport.AllVisibleSheets := cbAllSheets.IsChecked;
  MainPreview.InvalidatePreview();
end;

procedure TfrmVisorReportes.ChangePages;
var
  pn: Integer;
begin
  if (ChangingZoom) then
    exit;
  MainPreview.Zoom := TrackBarZoom.Value / 100.0;
end;

procedure TfrmVisorReportes.clonarLineaXLS(Xls: TExcelFile; trigger: string);
var
  Csearch: posExcel;
  R: Integer;
begin
  Csearch := daPosicionExcel(Xls, trigger);
  R := Csearch.RFila;
  copiaXLSRow(Xls, R, 1, R, Xls.ColCountInRow(R), R + 1, 1);
  // copiaXLSRow(xls, R, 1, R, xls.RowCount, R + 1, 1);
end;

procedure TfrmVisorReportes.edPageExit(Sender: TObject);
begin
  ChangePages;
end;

procedure TfrmVisorReportes.edPageKeyDown(Sender: TObject; var Key: Word; var KeyChar: Char; Shift:
  TShiftState);
begin
  if Key = 13 then
  begin
    ChangePages;
    Key := 0;
  end
  else if Key = 27 then
  begin
    UpdatePages;
    Key := 0;
  end;
end;

procedure TfrmVisorReportes.FittoHeight1Click(Sender: TObject);
begin
  MainPreview.AutofitPreview := TAutofitPreview.Height;
  UpdateAutofitText;
end;

procedure TfrmVisorReportes.FittoPage1Click(Sender: TObject);
begin
  MainPreview.AutofitPreview := TAutofitPreview.Full;
  UpdateAutofitText;
end;

procedure TfrmVisorReportes.FittoWidth1Click(Sender: TObject);
begin
  MainPreview.AutofitPreview := TAutofitPreview.Width;
  UpdateAutofitText;
end;

procedure TfrmVisorReportes.FormClose(Sender: TObject; var Action: TCloseAction);
begin
  deltree(carpetaGuardadoTemporal);
  if DirectoryExists(carpetaGuardadoTemporal) then
    RemoveDir(carpetaGuardadoTemporal);

  FreeAndNil(PrintingThread);
  FreeAndNil(PdfThread);
  FreeAndNil(ImgExport);
  FreeAndNil(Xls);
end;

procedure TfrmVisorReportes.FormCreate(Sender: TObject);
begin
  FreeAndNil(PrintingThread);
  FreeAndNil(PdfThread);
  FreeAndNil(ImgExport);
  FreeAndNil(Xls);
end;

procedure TfrmVisorReportes.FormShow(Sender: TObject);
begin
  pnlPdfOk.Visible := False;
  pnlPdfError.Visible := False;
  pnlPdf.Visible := False;
  pnlPrintingOk.Visible := False;
  pnlPrintingError.Visible := False;
  pnlPrinting.Visible := False;
  Xls := TXlsFile.Create(1, False);
  Xls.Protection.OnPassword := GetPassword;
  ImgExport := TFlexCelImgExport.Create(Xls, False);
  ImgExport.AllVisibleSheets := False;
  MainPreview.Document := ImgExport;
  Thumbs.Document := ImgExport;
  estadoActions(False);
  cbAllSheets.IsChecked := True;
  SERCOP := False;
  btn_ActionGenerate.OnClick(btn_ActionGenerate);
  /// ???
  chk_ConApus.IsChecked := True;
  chk_ConApus.Visible := False;
  chk_ConsolidarReporte.Visible := False;
  case modo of
    1: // Acta de Constitucion del Proyecto
      begin

      end;
    2: // Analisis
      begin

      end;
    3: // Cronograma de Trabajo  (Proyect no se usa aqui)
      begin

      end;
    4: // Cronograma Valorado
      begin

      end;
    5: // Desagregacion Tecnologica
      begin
        chk_ConApus.Visible := True;
        chk_ConsolidarReporte.Visible := True;
      end;
    6: // EDT - Diccionario
      begin

      end;
    7: // EDT - Listado
      begin

      end;
    8: // EDT - Valorada
      begin

      end;
    9: // Equipo del Proyecto (Stake Holders)
      begin

      end;
    10: // Estructura Descomposicion Organización (EDO)
      begin

      end;
    11: // Formulas Polinomicas
      begin

      end;
    12: // Gestion de Tiempos
      begin

      end;
    13: // Porcentaje Indirectos
      begin

      end;
    14: // Presupuestos
      begin
        chk_ConApus.Visible := True;
      end;
  end;
  MainPreview.AutofitPreviewOnce(TAutofitPreview.Height);
end;

procedure TfrmVisorReportes.GetPassword(const e: TOnPasswordEventArgs);
var
  Pwd: TPasswordDialog;
begin
  Pwd := TPasswordDialog.Create(self);
  try
    Pwd.SetFileName(OpenDialog.FileName);
    if Pwd.ShowModal <> mrOk then
      exit;
    e.Password := Pwd.Password;
  finally
    FreeAndNil(Pwd);
  end;
end;

procedure TfrmVisorReportes.lbSheetsChange(Sender: TObject);
begin
  if (lbSheets.Items.Count > Xls.SheetCount) or (lbSheets.ItemIndex < 0) then
    exit;
  Xls.ActiveSheet := lbSheets.ItemIndex + 1;
  MainPreview.InvalidatePreview();
end;

procedure TfrmVisorReportes.LoadFile(const FileName: string);
var
  i: Integer;
begin
  pnlPdfOk.Visible := False;
  pnlPdfError.Visible := False;
  pnlPdf.Visible := False;
  pnlPrintingOk.Visible := False;
  pnlPrintingError.Visible := False;
  pnlPrinting.Visible := False;

  OpenDialog.FileName := FileName;
  lbSheets.Items.Clear;

  try
    Xls.Open(FileName);
  except
    on ex: Exception do
    begin
      EnableCommonActions(False);
      btn_ActionPrint.Enabled := False;
      btn_ActionPdf.Enabled := False;
      btn_ActionZoom.Enabled := False;
      btn_ActionAutofit.Enabled := False;
      btn_ActionOpen.Enabled := True;
      lyt_PanelSelectPage.Visible := False;
      Xls.NewFile(1, TExcelFileFormat.v2019);
      Caption := 'Custom Preview';
      ShowMessage('Error opening file: ' + ex.Message);
      MainPreview.InvalidatePreview;
      exit;
    end;
  end;

  for i := 1 to Xls.SheetCount do
  begin
    lbSheets.Items.Add(Xls.GetSheetName(i));
  end;
  lbSheets.ItemIndex := Xls.ActiveSheet - 1;

  EnableCommonActions(True);
  btn_ActionPrint.Enabled := True;
  btn_ActionPdf.Enabled := True;
  btn_ActionZoom.Enabled := True;
  btn_ActionAutofit.Enabled := True;
  Caption := 'Custom Preview: ' + OpenDialog.FileName;
  lyt_PanelSelectPage.Visible := True;
  MainPreview.InvalidatePreview;
end;

procedure TfrmVisorReportes.lyt2MouseDown(Sender: TObject; Button: TMouseButton; Shift: TShiftState;
  X, Y: Single);
begin
  self.StartWindowResize;
end;

procedure TfrmVisorReportes.NoAutofit1Click(Sender: TObject);
begin
  MainPreview.AutofitPreview := TAutofitPreview.None;
  UpdateAutofitText;
end;

procedure TfrmVisorReportes.rect_1MouseDown(Sender: TObject; Button: TMouseButton; Shift:
  TShiftState; X, Y: Single);
begin
  self.StartWindowDrag;
end;

procedure TfrmVisorReportes.rect_AceptarClick(Sender: TObject);
begin
  ModalResult := mrOk;
end;

procedure TfrmVisorReportes.TrackBarZoomChange(Sender: TObject);
begin
  if (ChangingZoom) then
    exit;
  MainPreview.Zoom := TrackBarZoom.Value / 100.0;
end;

procedure TfrmVisorReportes.UpdateAutofitText;
begin
  case MainPreview.AutofitPreview of
    TAutofitPreview.None:
      btn_ActionAutofit.text := 'Sin Autoajuste';
    TAutofitPreview.Width:
      btn_ActionAutofit.text := 'Ajuste ancho';
    TAutofitPreview.Height:
      btn_ActionAutofit.text := 'Ajuste alto';
    TAutofitPreview.Full:
      btn_ActionAutofit.text := 'Ajuste a la página';
  end;
end;

procedure TfrmVisorReportes.UpdatePages;
begin
  edPage.text := IntToStr(MainPreview.StartPage);
  lblTotalPages.text := 'de ' + IntToStr(MainPreview.TotalPages);
end;

end.

