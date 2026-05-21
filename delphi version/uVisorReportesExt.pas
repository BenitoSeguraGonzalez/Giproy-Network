unit uVisorReportesExt;

interface

uses
  System.SysUtils, System.Types, System.UITypes, System.Classes, System.Variants, fmx.DialogService,
  Winapi.Windows, Winapi.ShellAPI, fmx.Types, fmx.Controls, fmx.Forms, fmx.Graphics,
  fmx.Dialogs, fmx.Printer, fmx.Controls.Presentation, fmx.StdCtrls, fmx.Objects, fmx.Layouts,
  fmx.Menus, FlexCel.FMXSupport, FlexCel.Core, FlexCel.Render, System.Actions, fmx.ActnList,
  fmx.Effects, fmx.Edit, fmx.ListBox, System.StrUtils, fmx.FlexCel.Preview, Uni, fmx.Ani,
  UPasswordDialog, UPdfExporting, UPrinting, Data.DB, MemDS, DBAccess, fmx.TabControl,
  FlexCel.XlsAdapter, System.IOUtils, System.RegularExpressions;

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
  TfVisorReportesExt = class(TForm)
    lyt_background: TLayout;
    lyt_Body: TLayout;
    rect_2: TRectangle;
    lyt_3: TLayout;
    rect_3: TRectangle;
    lyt_6: TLayout;
    rect_4: TRectangle;
    lyt_DatosGenerales: TLayout;
    lyt_11: TLayout;
    lbl_11: TLabel;
    ln_1: TLine;
    lytOpciones: TLayout;
    rect_5: TRectangle;
    lytBodyContainer: TLayout;
    lytVisorxHojas: TLayout;
    lytExcelViewer: TLayout;
    MainBkg: TRectangle;
    MainPreview: TFlexCelPreviewer;
    lyt_7: TLayout;
    lbl_descripcion: TLabel;
    lyt_footer: TLayout;
    rect_Cancelar: TRectangle;
    iGlow_Cancelar: TInnerGlowEffect;
    rect_Aceptar: TRectangle;
    iGlow_Aceptar: TInnerGlowEffect;
    lbl_modo: TLabel;
    lyt_header: TLayout;
    rect_1: TRectangle;
    lbl_1: TLabel;
    rect_6: TRectangle;
    lyt_18: TLayout;
    rect_ThumbsBkg: TRectangle;
    Thumbs: TFlexCelPreviewer;
    lyt_PanelSheets: TLayout;
    lbSheets: TListBox;
    pnl: TPanel;
    Label1: TLabel;
    pnl1: TPanel;
    QPresupuestoItems: TUniQuery;
    lbl1: TLabel;
    cbbConApus: TComboBox;
    Panel1: TPanel;
    Label2: TLabel;
    ln1: TLine;
    lbl2: TLabel;
    rect_ExportarExcel: TRectangle;
    Shadow_ExportarExcel: TShadowEffect;
    img12: TImage;
    rect_ExportarPDF: TRectangle;
    Shadow_ExportarPDF: TShadowEffect;
    img1: TImage;
    pnlExportando: TPanel;
    lblExportando: TLabel;
    Shadow_1: TShadowEffect;
    pbExportacion: TProgressBar;
    PdfSaveDialog: TSaveDialog;
    SaveDialog1: TSaveDialog;
    PrintDialog: TPrintDialog;
    procedure rect_ExportarExcelMouseDown(Sender: TObject; Button: TMouseButton; Shift: TShiftState;
      X, Y: Single);
    procedure rect_ExportarExcelMouseLeave(Sender: TObject);
    procedure rect_ExportarExcelMouseUp(Sender: TObject; Button: TMouseButton; Shift: TShiftState; X,
      Y: Single);
    procedure rect_ExportarPDFMouseDown(Sender: TObject; Button: TMouseButton; Shift: TShiftState; X,
      Y: Single);
    procedure rect_ExportarPDFMouseLeave(Sender: TObject);
    procedure rect_ExportarPDFMouseUp(Sender: TObject; Button: TMouseButton; Shift: TShiftState; X,
      Y: Single);
    procedure MainPreviewMouseWheel(Sender: TObject; Shift: TShiftState; WheelDelta: Integer; var
      Handled: Boolean);
    procedure rect_ExportarPDFClick(Sender: TObject);
    procedure FormCreate(Sender: TObject);
    procedure FormShow(Sender: TObject);
    procedure rect_ExportarExcelClick(Sender: TObject);
    procedure rect_1MouseDown(Sender: TObject; Button: TMouseButton; Shift: TShiftState; X, Y: Single);
    procedure rect_AceptarClick(Sender: TObject);
    procedure lbSheetsChange(Sender: TObject);
    procedure FormClose(Sender: TObject; var Action: TCloseAction);
  private
    { Private declarations }
    Xls: TExcelFile;
    ImgExport: TFlexCelImgExport;
    PrintingThread: TPrintingThread;
    PdfThread: TPdfThread;
    DisabledCount: Integer;
    ChangingZoom: Boolean;
    excelProyecto: TExcelFile;
    excelApus: TExcelFile;
    SERCOP: Boolean;
    FileNames: TArray<string>;
    datosActaProyecto: dat_actaProyecto;
    datosCronogramaValorado: dat_cronogramaValorado;
    lista_EDT: array of dat_edt;
    procedure exportarExcel();
    procedure exportarPDF();
    procedure LoadFile(const FileName: string);
    procedure generarReporte();
    procedure GeneraReporteTipo2();
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
    procedure ExpandirApusAnidados(const listado: TStringList);
    function recibeDatosPresupuestos(): dat_datosPresupuesto;
    function daPosicionExcel(Xls: TExcelFile; parametroBusqueda: string): posExcel;
    function daCodigoSTKR(datos: string): string;
    function daResponsableyCargo(datos: string): string;
    function ajustaStringtoMoney(datos: string): string;
    function cargarPlantillasProyecto(modoE: Integer): string;
  public
    { Public declarations }
    modo: Integer;
    IncluirApusAnidados: boolean;
    XLSPlantilla: string;
    carpetaGuardadoTemporal: string;
    SSO: Boolean;
    listadoApusReporteAnalisis: TStringList;

  end;

var
  fVisorReportesExt: TfVisorReportesExt;

procedure BorrarDirectoriosTimestamp(const RutaBase: string);
implementation

{$R *.fmx}

uses
  DM1, PlantillasExcel, uMain, DMSeguridad, DM_Presupuestos;

procedure BorrarDirectoriosTimestamp(const RutaBase: string);
var
  Dir: string;
  Dirs: TStringDynArray;
  Nombre: string;
begin
  if not TDirectory.Exists(RutaBase) then
    Exit;

  Dirs := TDirectory.GetDirectories(RutaBase);

  for Dir in Dirs do
  begin
    Nombre := TPath.GetFileName(Dir);

    // Validar formato: exactamente 14 dígitos
    if TRegEx.IsMatch(Nombre, '^\d{14}$') then
    begin
      try
        TDirectory.Delete(Dir, True); // True = borrar recursivo
      except
        on E: Exception do
        begin
          // Aquí puedes loguear si quieres
          // ShowMessage('Error borrando: ' + Dir);
        end;
      end;
    end;
  end;
end;

procedure TfVisorReportesExt.ExpandirApusAnidados(const listado: TStringList);
var
  Q: TUniQuery;
  listadoFinal: TStringList;
  i: Integer;
  codAPUPadre, codAPUAnidado: string;
begin
  if listado = nil then
    Exit;

  listadoFinal := TStringList.Create;
  Q := TUniQuery.Create(nil);
  try
    // Preparar query UNA sola vez
    Q.Connection := DModule_1.con2;
    Q.SQL.Text :=
      'SELECT DISTINCT ' +
      '  SUBSTRING(r.Especificaciones, 6) AS CodAPUAnidado ' +
      'FROM apus_items ai ' +
      'INNER JOIN recursos r ' +
      '  ON r.codBase = ai.codBase ' +
      ' AND r.idUnico = ai.idUnicoRecurso ' +
      'WHERE ai.codAPU  = :codAPU ' +
      '  AND ai.codBase = :codBase ' +
      '  AND r.Especificaciones LIKE ''APU: %''';

    for i := 0 to listado.Count - 1 do
    begin
      codAPUPadre := listado[i];

      // Añadir padre una sola vez
      if listadoFinal.IndexOf(codAPUPadre) = -1 then
        listadoFinal.Add(codAPUPadre);

      Q.Close;
      Q.ParamByName('codAPU').AsString := codAPUPadre;
      Q.ParamByName('codBase').AsString := base_Activa.codBase;
      Q.Open;

      while not Q.Eof do
      begin
        codAPUAnidado := Trim(Q.FieldByName('CodAPUAnidado').AsString);

        // Validación extra por seguridad
        if (codAPUAnidado <> '') and
          (listadoFinal.IndexOf(codAPUAnidado) = -1) then
        begin
          listadoFinal.Add(codAPUAnidado);
        end;

        Q.Next;
      end;
    end;

    // Sustituir contenido original
    listado.Assign(listadoFinal);

  finally
    Q.Free;
    listadoFinal.Free;
  end;
end;

function TfVisorReportesExt.ajustaStringtoMoney(datos: string): string;
var
  X: Integer;
  valordatos: Currency;
  simboloMiles: string;
begin
  // '$ 2,520'
  result := datos;
  X := AnsiPos(base_activa.simboloMoneda, datos);
  if X > 0 then
  begin
    simboloMiles := ',';
    simboloMiles := decimal_correcto(simboloMiles);
    if simboloMiles = ',' then
      simboloMiles := '.'
    else
      simboloMiles := ',';
    datos := StringReplace(datos, base_activa.simboloMoneda, '', []).trim;
    datos := StringReplace(datos, simboloMiles, '', []).trim;
    valordatos := StrToFloatdef(datos, 0);
    result := FormatFloat(cadenaCurrency, valordatos);
  end;
end;

function TfVisorReportesExt.cargarPlantillasProyecto(modoE: Integer): string;
var
  qry: TUniQuery;
begin
  qry := TUniQuery.Create(nil);
  result := '';
  try
    with qry do
    begin
      Connection := DModule_1.con2;
      close;
      sql.clear;
      {(*}
      sql.text:=
        'SELECT ' +
        '  * ' +
        'FROM ' +
        '  presupuestos_configreportes pcr ' +
        'WHERE ' +
        '  pcr.codBase = :CodBase AND ' +
        '  pcr.CodPresupuesto = :CodPresupuesto AND' +
        '  pcr.revision = :revision';
      {*)}
      ParamByName('CodBase').AsString := base_activa.codBase;
      ParamByName('CodPresupuesto').AsString := codProyecto;
      ParamByName('revision').AsString := revision;
      Open;
      case modoE of
        1:
          begin
            result := FieldByName('RConstitucionProyecto').AsString;
          end;
        4:
          begin
            result := FieldByName('RcronogramaValorado').AsString;
            if frmMain.tbc1.ActiveTab = frmMain.tab_5 then
              result := '000 - Curva S';
          end;
        5:
          begin
            result := FieldByName('RDesagregacionTecnologica').AsString;
          end;
        51:
          begin
            result := FieldByName('RDesagregacionTecnologicaAPUS').AsString;
          end;
        6:
          begin
            result := FieldByName('REDTDiccionario').AsString;
          end;
        8:
          begin
            result := FieldByName('REDTValorada').AsString;
          end;
        9:
          begin
            result := FieldByName('REquipoProyecto').AsString;
          end;
        10:
          begin
            result := FieldByName('RDescomposicionOrganizacion').AsString;
          end;
        11:
          begin
            result := FieldByName('RFormulaPolinomicas').AsString;
          end;
      end;
    end;
  finally
    qry.free;
  end;
end;

procedure TfVisorReportesExt.clonarLineaXLS(Xls: TExcelFile; trigger: string);
var
  cSearch: posExcel;
  R: Integer;
begin
  cSearch := daPosicionExcel(Xls, trigger);
  R := cSearch.RFila;
  copiaXLSRow(Xls, R, 1, R, Xls.ColCountInRow(R), R + 1, 1);
end;

procedure TfVisorReportesExt.CompletaActaProyecto;
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
  sustituye_en_Excel(excelProyecto, '#PRO_FECHA', FormatDateTime('dd/mm/yyyy', now));
end;

procedure TfVisorReportesExt.CompletaCabeceraFPolinomica(Xls: TExcelFile);
begin
  sustituye_en_Excel(Xls, '#PRO_TITULO', datosCronogramaValorado.PTitulo);
  sustituye_en_Excel(Xls, '#CODIGOREFERENCIAL', datosCronogramaValorado.PcodReferencial);
  sustituye_en_Excel(Xls, '#CODIGOPROYECTO', codProyecto);
  sustituye_en_Excel(Xls, '#REVISION', revision);
  sustituye_en_Excel(Xls, '#PRO_OFERENTE', datosCronogramaValorado.POferente);
  sustituye_en_Excel(Xls, '#PRO_UBICACION', datosCronogramaValorado.PUbicacion);
  sustituye_en_Excel(Xls, '#PRO_FECHA', FormatDateTime('dd/mm/yyyy', now));
end;

procedure TfVisorReportesExt.CompletaCronogramaValoradoDatosGenerales;
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
  sustituye_en_Excel(excelProyecto, '#PRO_NUM_PERIODO', frmMain.lbl_cronogramaNPeriodos.Text);
  sustituye_en_Excel(excelProyecto, '#CIUDAD', datosCronogramaValorado.PCiudad);
  sustituye_en_Excel(excelProyecto, '#PRO_FECHA', FormatDateTime('dd/mm/yyyy', now));
end;

procedure TfVisorReportesExt.CompletaCronogramaValoradoDatosPeriodos(Xls: TExcelFile; CellInicio: posExcel);
var
  R, C: Integer;
  X, Y: Integer;
  nPeriodos: Integer;
  cSearch: posExcel;
  ordinalPeriodo: string;
begin
  nPeriodos := StrToIntdef(frmMain.lbl_cronogramaNPeriodos.Text, -1) - 2;
  ordinalPeriodo := ordinalPeriodos[frmMain.cbb_cronoTipoPeriodo.ItemIndex + 1];

  cSearch := daPosicionExcel(Xls, 'TIEMPO EN');
  R := cSearch.RFila;
  C := cSearch.Columna;
  Xls.MergeCells(R, C, R, C + nPeriodos + 1);
  Xls.SetCellFormat(R, C, R, C + nPeriodos + 1, 2);

  cSearch := daPosicionExcel(Xls, '#PRO_TIPO_PERIODO');
  R := cSearch.RFila;
  C := cSearch.Columna;
  Xls.MergeCells(R, C, R, C + nPeriodos + 1);
  sustituye_en_Excel(Xls, '#PRO_TIPO_PERIODO', ordinalPeriodo);
  Xls.SetCellFormat(R, C, R, C + nPeriodos + 1, 2);

  cSearch := daPosicionExcel(Xls, '#PRO_NUM_PERIODO');
  R := cSearch.RFila;
  C := cSearch.Columna;
  X := 1;
  for Y := C to C + nPeriodos do
  begin
    copiaXLSRow(Xls, R, C, R, C, R, C + 1);
    sustituye_en_Excel(Xls, '#PRO_NUM_PERIODO', IntToStr(X));
    Inc(C);
    Inc(X);
  end;
  sustituye_en_Excel(Xls, '#PRO_NUM_PERIODO', IntToStr(X));

  cSearch := daPosicionExcel(Xls, '#DATOS_PERIODO');
  R := cSearch.RFila;
  C := cSearch.Columna;
  for Y := C to C + nPeriodos do
  begin
    copiaXLSRow(Xls, R, C, R, C, R, C + 1);
    Inc(C);
  end;

  cSearch := daPosicionExcel(Xls, '#DESCRIPCION');
  R := cSearch.RFila;
  C := cSearch.Columna;
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

  cSearch := daPosicionExcel(Xls, '#TOTAL_PARCIAL');
  R := cSearch.RFila;
  C := cSearch.Columna;
  for Y := C to C + nPeriodos do
  begin
    copiaXLSRow(Xls, R, C, R, C, R, C + 1);
    Inc(C);
  end;

  cSearch := daPosicionExcel(Xls, '#PORCENT_PARCIAL');
  R := cSearch.RFila;
  C := cSearch.Columna;
  for Y := C to C + nPeriodos do
  begin
    copiaXLSRow(Xls, R, C, R, C, R, C + 1);
    Inc(C);
  end;

  cSearch := daPosicionExcel(Xls, '#TOTAL_ACUM');
  R := cSearch.RFila;
  C := cSearch.Columna;
  for Y := C to C + nPeriodos do
  begin
    copiaXLSRow(Xls, R, C, R, C, R, C + 1);
    Inc(C);
  end;

  cSearch := daPosicionExcel(Xls, '#PORCENT_ACUM');
  R := cSearch.RFila;
  C := cSearch.Columna;
  for Y := C to C + nPeriodos do
  begin
    copiaXLSRow(Xls, R, C, R, C, R, C + 1);
    Inc(C);
  end;

  cSearch := daPosicionExcel(Xls, '#DESCRIPCION');
  R := cSearch.RFila;
  C := cSearch.Columna;
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

procedure TfVisorReportesExt.CompletaCronogramaValoradoDatosPeriodosSERCOP(Xls: TExcelFile);
var
  R, C: Integer;
  X, Y: Integer;
  nPeriodos: Integer;
  cSearch: posExcel;
  ordinalPeriodo: string;
begin
  nPeriodos := StrToIntdef(frmMain.lbl_cronogramaNPeriodos.Text, -1) - 2;
  ordinalPeriodo := ordinalPeriodos[frmMain.cbb_cronoTipoPeriodo.ItemIndex + 1];

  cSearch := daPosicionExcel(Xls, 'TIEMPO EN');
  R := cSearch.RFila;
  C := cSearch.Columna;
  Xls.MergeCells(R, C, R, C + nPeriodos + 1);
  Xls.SetCellFormat(R, C, R, C + nPeriodos + 1, 2);

  cSearch := daPosicionExcel(Xls, '#PRO_TIPO_PERIODO');
  R := cSearch.RFila;
  C := cSearch.Columna;
  Xls.MergeCells(R, C, R, C + nPeriodos + 1);
  sustituye_en_Excel(Xls, '#PRO_TIPO_PERIODO', ordinalPeriodo);
  Xls.SetCellFormat(R, C, R, C + nPeriodos + 1, 2);

  cSearch := daPosicionExcel(Xls, '#PRO_NUM_PERIODO');
  R := cSearch.RFila;
  C := cSearch.Columna;
  X := 1;
  for Y := C to C + nPeriodos do
  begin
    copiaXLSRow(Xls, R, C, R, C, R, C + 1);
    sustituye_en_Excel(Xls, '#PRO_NUM_PERIODO', IntToStr(X));
    Inc(C);
    Inc(X);
  end;
  sustituye_en_Excel(Xls, '#PRO_NUM_PERIODO', IntToStr(X));

  cSearch := daPosicionExcel(Xls, '#DATOS_PERIODO');
  R := cSearch.RFila;
  C := cSearch.Columna;
  for Y := C to C + nPeriodos do
  begin
    copiaXLSRow(Xls, R, C, R, C, R, C + 1);
    Inc(C);
  end;

  cSearch := daPosicionExcel(Xls, '#DESCRIPCION');
  R := cSearch.RFila;
  C := cSearch.Columna;
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

  cSearch := daPosicionExcel(Xls, '#TOTAL_PARCIAL');
  R := cSearch.RFila;
  C := cSearch.Columna;
  for Y := C to C + nPeriodos do
  begin
    copiaXLSRow(Xls, R, C, R, C, R, C + 1);
    Inc(C);
  end;

  cSearch := daPosicionExcel(Xls, '#PORCENT_PARCIAL');
  R := cSearch.RFila;
  C := cSearch.Columna;
  for Y := C to C + nPeriodos do
  begin
    copiaXLSRow(Xls, R, C, R, C, R, C + 1);
    Inc(C);
  end;

  cSearch := daPosicionExcel(Xls, '#TOTAL_ACUM');
  R := cSearch.RFila;
  C := cSearch.Columna;
  for Y := C to C + nPeriodos do
  begin
    copiaXLSRow(Xls, R, C, R, C, R, C + 1);
    Inc(C);
  end;

  cSearch := daPosicionExcel(Xls, '#PORCENT_ACUM');
  R := cSearch.RFila;
  C := cSearch.Columna;
  for Y := C to C + nPeriodos do
  begin
    copiaXLSRow(Xls, R, C, R, C, R, C + 1);
    Inc(C);
  end;

  cSearch := daPosicionExcel(Xls, '#DESCRIPCION');
  R := cSearch.RFila;
  C := cSearch.Columna;
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

procedure TfVisorReportesExt.CompletaCuerpoDesagregacion(Xls: TExcelFile);
var
  X, Y: Integer;
  subtotalSinIva: Double;
  v_IVA: Double;
  tmpstr: string;
  totalPonderado: Double;
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
  v_IVA := StrToFloatdef(frmMain.edt_porcentajeIVANuevoPresupuesto.Text, 0);
  v_IVA := (subtotalSinIva * v_IVA) / 100;
  sustituye_en_Excel(Xls, '#IVA', forzarNdecimales(v_IVA, 2));
  sustituye_en_Excel(Xls, '#TOTAL', forzarNdecimales(subtotalSinIva + v_IVA, 2));
  sustituye_en_Excel(Xls, '#AEPAPUTOTAL', forzarNdecimales(totalPonderado, 2) + '%');
end;

procedure TfVisorReportesExt.CompletaCurvaS(Xls: TExcelFile; rutaPlantillaProyecto,
  nombreExcelTPresupuesto: string);
var
  nPeriodos: Integer;
  ValoresCurvaS: array of Real;
  ValoresInversion: array of Real;
  ValoresAvanceParcial: array of string;
  ValoresAvanceAcumulado: array of string;
  Valor: Double;
  tmpstr: string;
  rowInicio: Integer;
  punteroInicio: Integer;
  X: Integer;
  posicion: posExcel;
begin
  nPeriodos := StrToIntdef(frmMain.lbl_cronogramaNPeriodos.Text, -1);
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

procedure TfVisorReportesExt.CompletaDatosCronogramaValoradoSERCOP(Xls: TExcelFile);
var
  X, R: Integer;
  valorCelda: string;
  nPeriodos: Integer;
begin
  R := 1;
  nPeriodos := StrToIntdef(frmMain.lbl_cronogramaNPeriodos.Text, -1);
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

procedure TfVisorReportesExt.CompletaDesagregacionSercop(Xls: TExcelFile);
var
  nSecuenciaAPU: Integer;
  X: Integer;
  codAPU: string;
  tmpstr: string;
begin
  nSecuenciaAPU := 1;
  for X := 1 to frmMain.grid_DesagregacionAPUS.RowCount - 1 do
  begin
    codAPU := frmMain.grid_DesagregacionAPUS.cells[11, X];
    if codAPU <> '' then
    begin
      clonarLineaXLS(Xls, '#NUMERO_SECUENCIA');
      sustituye_en_Excel(Xls, '#NUMERO_SECUENCIA', nSecuenciaAPU);
      sustituye_en_Excel(Xls, '#DESCRIPCION', frmMain.grid_DesagregacionAPUS.cells[2, X]);
      sustituye_en_Excel(Xls, '#UNIDAD', frmMain.grid_DesagregacionAPUS.cells[3, X]);
      sustituye_en_Excel(Xls, '#CANTIDAD', frmMain.grid_DesagregacionAPUS.cells[4, X]);
      sustituye_en_Excel(Xls, '#PUNITARIO', frmMain.grid_DesagregacionAPUS.cells[5, X]);
      sustituye_en_Excel(Xls, '#SUBTOTAL', frmMain.grid_DesagregacionAPUS.cells[6, X]);
      tmpstr := frmMain.grid_DesagregacionAPUS.cells[7, X];
      tmpstr := AnsiReplaceStr(tmpstr, '%', '').trim;
      sustituye_en_Excel(Xls, '#PRAPU', forzarNdecimales(StrToFloat(tmpstr), 2) + '%');

      tmpstr := frmMain.grid_DesagregacionAPUS.cells[8, X];
      tmpstr := AnsiReplaceStr(tmpstr, '%', '').trim;
      sustituye_en_Excel(Xls, '#VAEAPU', forzarNdecimales(StrToFloat(tmpstr), 2) + '%');
      tmpstr := frmMain.grid_DesagregacionAPUS.cells[9, X];
      tmpstr := AnsiReplaceStr(tmpstr, '%', '').trim;
      sustituye_en_Excel(Xls, '#AEPAPU', forzarNdecimales(StrToFloat(tmpstr), 2) + '%');
      Inc(nSecuenciaAPU);
    end;
  end;
  borraLineaPlantilla(Xls, '#NUMERO_SECUENCIA');
  sustituye_en_Excel(Xls, '#SUBTOTALSINIVA', frmMain.lbl_DesagPrecioTotalRubro.Text);
  tmpstr := frmMain.lbl_DesgAgregadoPonderado.Text;
  tmpstr := AnsiReplaceStr(tmpstr, '%', '').trim;
  sustituye_en_Excel(Xls, '#AEPAPUTOTAL', forzarNdecimales(StrToFloat(tmpstr), 2) + '%');
end;

procedure TfVisorReportesExt.CompletaDirectorioEquipoAsignado(Xls: TExcelFile);
begin
  sustituye_en_Excel(Xls, '#PRO_TITULO', datosCronogramaValorado.PTitulo);
  sustituye_en_Excel(Xls, '#CODIGOPROYECTO', codProyecto);
  sustituye_en_Excel(Xls, '#REVISION', revision);
  sustituye_en_Excel(Xls, '#CODIGOREFERENCIAL', datosCronogramaValorado.PcodReferencial);
  sustituye_en_Excel(Xls, '#CIUDAD', datosCronogramaValorado.PCiudad);
  sustituye_en_Excel(Xls, '#PRO_FECHA', FormatDateTime('dd/mm/yyyy', now));
  with DMPresupuesto.QDirectorioAsignados do
  begin
    parambyname('icodBase').AsString := base_activa.codBase;
    parambyname('icodPresupuesto').AsString := codProyecto;
    parambyname('iRevision').AsString := revision;
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
      Next;
    end;
  end;
  borraLineaPlantilla(Xls, '#ITEM');
end;

procedure TfVisorReportesExt.CompletaEDOAsignada(Xls: TExcelFile);
var
  X: Integer;
begin
  sustituye_en_Excel(Xls, '#PRO_TITULO', datosCronogramaValorado.PTitulo);
  sustituye_en_Excel(Xls, '#CODIGOPROYECTO', codProyecto);
  sustituye_en_Excel(Xls, '#REVISION', revision);
  sustituye_en_Excel(Xls, '#CODIGOREFERENCIAL', datosCronogramaValorado.PcodReferencial);
  sustituye_en_Excel(Xls, '#CIUDAD', datosCronogramaValorado.PCiudad);
  sustituye_en_Excel(Xls, '#PRO_FECHA', FormatDateTime('dd/mm/yyyy', now));
  with DMPresupuesto.QEDOProyecto do
  begin
    parambyname('codBase').AsString := base_activa.codBase;
    parambyname('codPresupuesto').AsString := codProyecto;
    parambyname('revision').AsString := revision;
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
      Next;
      Inc(X);
    end;
    borraLineaPlantilla(Xls, '#ITEM');
  end;
end;

procedure TfVisorReportesExt.CompletaEDTDiccionario(Xls: TExcelFile);
var
  tmpstr: string;
  X: Integer;
  cSearch: posExcel;
  R, C: Integer;
begin
  sustituye_en_Excel(Xls, '#PRO_TITULO', datosCronogramaValorado.PTitulo);
  sustituye_en_Excel(Xls, '#CODIGOPROYECTO', codProyecto);
  sustituye_en_Excel(Xls, '#REVISION', revision);
  sustituye_en_Excel(Xls, '#CODIGOREFERENCIAL', datosCronogramaValorado.PcodReferencial);
  sustituye_en_Excel(Xls, '#PRO_UBICACION', datosCronogramaValorado.PUbicacion);
  sustituye_en_Excel(Xls, '#PRO_FECHA', datosCronogramaValorado.PFecha_Inicio);
  sustituye_en_Excel(Xls, '#PRO_FECHA', FormatDateTime('dd/mm/yyyy', now));
  sustituye_en_Excel(Xls, '#CIUDAD', datosCronogramaValorado.PCiudad);
  sustituye_en_Excel(Xls, '#PRO_OFERENTE', datosCronogramaValorado.POferente);

  cSearch := daPosicionExcel(Xls, datosCronogramaValorado.PTitulo);
  R := cSearch.RFila;
  C := cSearch.Columna;
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

procedure TfVisorReportesExt.CompletaEDTValorada(Xls: TExcelFile);
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
  tmpstr := frmMain.lbl_SubtotalPresupuesto.Text;
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

procedure TfVisorReportesExt.CompletaEncabezadoDesagregacion(Xls: TExcelFile);
var
  qry: TUniQuery;
begin
  qry := TUniQuery.Create(nil);
  try
    with qry do
    begin
      Connection := DModule_1.con2;
      close;
      sql.clear;
      { /* }
      sql.add('SELECT ' + 'dat.codPresupuesto, ' + 'dat.revision, ' + 'dat.codReferencial, ' +
        'dat.Descripcion, ' + 'edo.Responsable AS oferente, ' + 'CONCAT(dat.ciudad, ' + Char(32) +
        ', dat.provincia, ' + chr(45) + ', dat.pais) AS Ubicacion ' + 'FROM ' +
        'presupuestos_datosproyecto dat ' + 'LEFT JOIN presupuestos_edo_datos edo ' +
        'ON edo.codbase = dat.codBase ' + 'AND edo.codPresupuesto = dat.codPresupuesto ' +
        'AND edo.revision = dat.revision ' + 'AND LOWER(edo.rolProyecto) = :oferente ' + 'WHERE ' +
        'dat.codbase = :codBase ' + 'AND dat.codPresupuesto = :codPresupuesto ' +
        'AND dat.revision = :revision');
      { */ }
      Prepare;
      ExecSQL;
      sustituye_en_Excel(Xls, '#PRO_TITULO', FieldByName('descripcion').AsString);
      sustituye_en_Excel(Xls, '#CODIGOPROYECTO', FieldByName('codPresupuesto').AsString);
      sustituye_en_Excel(Xls, '#CODIGOREFERENCIAL', FieldByName('codReferencial').AsString);
      sustituye_en_Excel(Xls, '#REVISION', FieldByName('revision').AsString);
      sustituye_en_Excel(Xls, '#PRO_OFERENTE', FieldByName('oferente').AsString);
      sustituye_en_Excel(Xls, '#PRO_UBICACION', FieldByName('ubicacion').AsString);
      sustituye_en_Excel(Xls, '#PRO_FECHA', FormatDateTime('dd/mm/yyyy', now));
    end;
  finally
    qry.free;
  end;
end;

procedure TfVisorReportesExt.CompletaFormulaPolinomica(Xls: TExcelFile);
var
  coeficienteRecurso: Double;
  Totalcoeficiente: Double;
  totalRecurso: Double;
  X: Integer;
  FormulaCuadrillaTipo: string;
  FormulaPolinomica: string;
  totalHorasHombre: Double;
  totalManoObra: Double;
  TotalCoeficientoMO: Double;
  tmpstr: string;
begin
  { --- Parte 1 CUADRILLA TIPO --- }
  FormulaPolinomica := frmMain.lbl_FpolGeneral.Text;
  FormulaCuadrillaTipo := frmMain.lbl_FpolCuadrilla.Text;
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
  DModule_1.QIndicesFormulaPolinomica.parambyname('codBase').AsString := base_activa.codBase;
  DModule_1.QIndicesFormulaPolinomica.parambyname('codPresupuesto').AsString := codProyecto;
  DModule_1.QIndicesFormulaPolinomica.parambyname('revision').AsString := revision;
  DModule_1.QIndicesFormulaPolinomica.Execute;
  DModule_1.QDatosGeneralesPresupuesto.close;
  DModule_1.QDatosGeneralesPresupuesto.parambyname('codbase').AsString := base_activa.codBase;
  DModule_1.QDatosGeneralesPresupuesto.parambyname('codPresupuesto').AsString := codProyecto;
  DModule_1.QDatosGeneralesPresupuesto.parambyname('revision').AsString := revision;
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
    DModule_1.QIndicesFormulaPolinomica.Next;
  end;
  borraLineaPlantilla(Xls, '#TERMINO_RECURSO');
  sustituye_en_Excel(Xls, '#FORMULA_POLINOMICA', FormulaPolinomica);
  sustituye_en_Excel(Xls, '#TOTAL_CD_RECURSOS', totalRecurso);
  sustituye_en_Excel(Xls, '#TOTAL_COEF_RECURSOS', Totalcoeficiente);
end;

procedure TfVisorReportesExt.CompletaPorcentajeAcumuladoCronogramaValorado(Xls: TExcelFile);
const
  trigger = '#PORCENT_ACUM';
var
  R, C: Integer;
  nPeridodos: Integer;
  cSearch: posExcel;
  X: Integer;
  Valor: string;
begin
  cSearch := daPosicionExcel(Xls, trigger);
  R := cSearch.RFila;
  C := cSearch.Columna;
  nPeridodos := StrToIntdef(frmMain.lbl_cronogramaNPeriodos.Text, -1);
  for X := 0 to nPeridodos - 1 do
  begin
    Valor := frmMain.grid_CronoTotales.cells[X, 3];
    Valor := ajustaStringtoMoney(Valor);
    Xls.SetCellValue(R, C, Valor, -1);
    Xls.SetCellFormat(R, C, R, C, 2);
    Inc(C);
  end;
end;

procedure TfVisorReportesExt.CompletaPorcentajeParcialCronogramaValorado(Xls: TExcelFile);
const
  trigger = '#PORCENT_PARCIAL';
var
  R, C: Integer;
  nPeridodos: Integer;
  cSearch: posExcel;
  X: Integer;
  Valor: string;
begin
  cSearch := daPosicionExcel(Xls, trigger);
  R := cSearch.RFila;
  C := cSearch.Columna;
  nPeridodos := StrToIntdef(frmMain.lbl_cronogramaNPeriodos.Text, -1);
  for X := 0 to nPeridodos - 1 do
  begin
    Valor := frmMain.grid_CronoTotales.cells[X, 1];
    Valor := ajustaStringtoMoney(Valor);
    Xls.SetCellValue(R, C, Valor, -1);
    Xls.SetCellFormat(R, C, R, C, 2);
    Inc(C);
  end;
end;

procedure TfVisorReportesExt.CompletaTotalAcumuladoCronogramaValorado(Xls: TExcelFile);
const
  trigger = '#TOTAL_ACUM';
var
  R, C: Integer;
  nPeridodos: Integer;
  cSearch: posExcel;
  X: Integer;
  Valor: string;
begin
  cSearch := daPosicionExcel(Xls, trigger);
  R := cSearch.RFila;
  C := cSearch.Columna;
  nPeridodos := StrToIntdef(frmMain.lbl_cronogramaNPeriodos.Text, -1);
  for X := 0 to nPeridodos - 1 do
  begin
    Valor := frmMain.grid_CronoTotales.cells[X, 2];
    Valor := ajustaStringtoMoney(Valor);
    Xls.SetCellValue(R, C, Valor, -1);
    Xls.SetCellFormat(R, C, R, C, 2); // Formato de border de celda
    Inc(C);
  end;
end;

procedure TfVisorReportesExt.CompletaTotalParcialCronogramaValorado(Xls: TExcelFile);
const
  trigger = '#TOTAL_PARCIAL';
var
  R, C: Integer;
  nPeridodos: Integer;
  cSearch: posExcel;
  X: Integer;
  Valor: string;
begin
  cSearch := daPosicionExcel(Xls, trigger);
  R := cSearch.RFila;
  C := cSearch.Columna;
  nPeridodos := StrToIntdef(frmMain.lbl_cronogramaNPeriodos.Text, -1);
  for X := 0 to nPeridodos - 1 do
  begin
    Valor := frmMain.grid_CronoTotales.cells[X, 0];
    Valor := ajustaStringtoMoney(Valor);
    Xls.SetCellValue(R, C, Valor, -1);
    Xls.SetCellFormat(R, C, R, C, 2);
    Inc(C);
  end;
end;

function TfVisorReportesExt.daCodigoSTKR(datos: string): string;
var
  X: Integer;
begin
  X := AnsiPos(' - ', datos);
  if X > 0 then
  begin
    datos := Copy(datos, 1, X - 1).trim;
  end;
  result := datos;
end;

function TfVisorReportesExt.daPosicionExcel(Xls: TExcelFile; parametroBusqueda: string): posExcel;
var
  R, C: Integer;
  v: TCellValue;
  salir: Boolean;
  cadenaBusqueda: string;
begin
  result.Columna := -1;
  result.RFila := -1;
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
        result.Columna := C;
        result.RFila := R;
      end;
      Inc(C);
    end;
    Inc(R);
  end;
end;

function TfVisorReportesExt.daResponsableyCargo(datos: string): string;
var
  X: Integer;
begin
  X := AnsiPos(' - ', datos);
  if X > 0 then
  begin
    datos := Copy(datos, X + 3, Length(datos)).trim;
  end;
  result := datos;
end;

procedure TfVisorReportesExt.exportarExcel;
var
  entrar: Boolean;
  triggerComprobacion: string;
  tipoComplemento: Integer;
begin
  entrar := False;
  tipoComplemento := 0;
  if LowerCase(TUsuario) <> LowerCase('express') then
    entrar := True
  else
  begin
    case modo of
      14:
        begin
          triggerComprobacion := frmMain.lbl_TotalIVAPresupuestos.Text;
          tipoComplemento := 1;
        end;
      2:
        begin
          if LowerCase(TUsuario) <> 'Express' then
          begin
            entrar := False;
          end;
        end;
    end;

    if (not entrar) and (tipoComplemento > 0) and (daCantidadReportesRestantes(tipoComplemento) > 0) then
    begin
      if ejecutaExportacionReporte(tipoComplemento, triggerComprobacion) <> '0' then
        entrar := True;
    end;
  end;

  if entrar then
  begin
    ExportarExcelTipo2();
  end;
end;

procedure TfVisorReportesExt.ExportarExcelTipo2;
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

procedure TfVisorReportesExt.exportarPDF;
var
  triggerComprobacion: string;
  tipoComplemento: Integer;
  entrar: Boolean;
begin
  entrar := False;
  if LowerCase(TUsuario) <> LowerCase('Express') then
    entrar := True
  else
  begin
    case modo of
      14:
        begin
          triggerComprobacion := frmMain.lbl_TotalIVAPresupuestos.Text;
          tipoComplemento := 1;
        end;
    end;

    if (not entrar) and (daCantidadReportesRestantes(tipoComplemento) > 0) then
    begin
      if ejecutaExportacionReporte(tipoComplemento, triggerComprobacion) <> '0' then
        entrar := True;
    end;
  end;
  if entrar then
  begin
    if not PdfSaveDialog.Execute then
      exit;

    pbExportacion.Value := 0;
    lblExportando.Text := 'Exportando a PDF';
    pnlExportando.Visible := True;
    FreeAndNil(PdfThread);
    PdfThread := TPdfThread.Create(Xls,
      procedure(Progress: Integer; Msg: string)
      begin
        pbExportacion.Value := Progress;
      end,
      procedure(Ok: Boolean; Msg: string)
      begin
        if not Ok then
        begin
          ShowMessage('Error a crear PDF: ' + Msg);
        end
        else
        begin
          ShowMessage('Exportación Completada.');
        end;
        pnlExportando.Visible := False;
      end, PdfSaveDialog.FileName, True);
    PdfThread.Start;
  end
  else
    ShowMessage('Debe adquirir tickets de exportación desde el sistema de venta online');

end;

procedure TfVisorReportesExt.FormClose(Sender: TObject;
  var Action: TCloseAction);
begin
  BorrarDirectoriosTimestamp(rutaApp);
end;

procedure TfVisorReportesExt.FormCreate(Sender: TObject);
begin
  lblExportando.Text := 'Exportando a PDF';
  pnlExportando.Visible := False;
  IncluirApusAnidados := False;
end;

procedure TfVisorReportesExt.FormShow(Sender: TObject);
begin
  Xls := TXlsFile.Create(1, False);
  ImgExport := TFlexCelImgExport.Create(Xls, False);
  ImgExport.AllVisibleSheets := True; // false;
  MainPreview.Document := ImgExport;
  Thumbs.Document := ImgExport;
  generarReporte;
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
        cbbConApus.ItemIndex := 0;
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
        cbbConApus.ItemIndex := 0;
      end;
  end;
  MainPreview.AutofitPreviewOnce(TAutofitPreview.Height);
end;

procedure TfVisorReportesExt.generaCuerpoPresupuesto(Xls: TExcelFile);
var
  ArowInsercion: Integer;
  nitemAnt: string;
  tmpstr: string;
  codEdt, nitem, codItem, descripcion, unidad, cantidad, Punitario, Total: string;
begin
  with QPresupuestoItems do
  begin
    parambyname('codPresupuesto').AsString := codProyecto;
    parambyname('Revision').AsString := revision;
    parambyname('codBase').AsString := base_activa.codBase;
    Prepare;
    ExecSQL;
    ArowInsercion := localizaArow(Xls, '#ITEM') - 1;
    while not Eof do
    begin
      Inc(ArowInsercion);
      codEdt := FieldByName('codEdt').AsString.trim;
      nitem := FieldByName('codItems').AsString.trim;
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
      Next;
    end;
    borraLineaPlantilla(Xls, '#ITEM');
  end;
end;

procedure TfVisorReportesExt.GeneraHojasApus(Xls: TExcelFile; directorioTrabajo, NexcelBase: string);
var
  nombreExcelApus: string;
  excelApus: TExcelFile;
  rutaExcelApus: string;
  FileNames: TArray<string>;
  X, Y, z: Integer;
  codAPU: string;
  punteroGrupo: string;
  subtotal: Double;
  subtotal1: Double;
  VAE1: Double;
  subtotal2: Double;
  VAE2: Double;
  subtotal3: Double;
  VAE3: Double;
  subtotal4: Double;
  VAE4: Double;
  Valor_indirectos: Double;
  VAETotal: Double;
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
    codAPU := frmMain.grid_DesagregacionAPUS.cells[11, X];
    if codAPU <> '' then
    begin
      SetLength(FileNames, z + 1);
      DModule_1.QAPU.close;
      DModule_1.QAPU.parambyname('codBase').AsString := base_activa.codBase;
      DModule_1.QAPU.parambyname('codApu').AsString := codAPU;
      DModule_1.QAPU.Execute;
      DModule_1.QAPU.First;
      sustituye_en_Excel(excelApus, '#DESCRIPCION', DModule_1.QAPUdescripcionAPU.AsString);
      sustituye_en_Excel(excelApus, '#UNIDAD', DModule_1.QAPUUnidadAPU.AsString);
      sustituye_en_Excel(excelApus, '#CODIGO_APU', codAPU);
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
              sustituye_en_Excel(excelApus, '#RENDIMIENTO1', StrToFloatdef(tmpstr, 0));
              tmpstr := DModule_1.QAPUTotal.AsString;
              tmpstr := decimal_correcto(tmpstr);
              sustituye_en_Excel(excelApus, '#SUBTOTAL1', StrToFloatdef(tmpstr, 0));
              sustituye_en_Excel(excelApus, '#CODCPC1', DModule_1.QAPUcodCPC.AsString);
              sustituye_en_Excel(excelApus, '#CATCPC1', DModule_1.QAPUTipoCPC.AsString);
              tmpstr := DModule_1.QAPUCostoHora.AsString;
              tmpstr := decimal_correcto(tmpstr);
              sustituye_en_Excel(excelApus, '#COSTOHORA1', StrToFloatdef(tmpstr, 0));
              tmpstr := DModule_1.QAPUpesoRelativo.AsString;
              tmpstr := decimal_correcto(tmpstr);
              sustituye_en_Excel(excelApus, '#PORCENT1', forzarNdecimales(StrToFloatdef(tmpstr, 0), 2) +
                '%');
              tmpstr := DModule_1.QAPUVAER.AsString;
              tmpstr := decimal_correcto(tmpstr);
              sustituye_en_Excel(excelApus, '#PVAER1', forzarNdecimales(StrToFloatdef(tmpstr, 0), 2) + '%');
              tmpstr := DModule_1.QAPUPtotalVAER.AsString;
              tmpstr := decimal_correcto(tmpstr);
              sustituye_en_Excel(excelApus, '#PTOTALVAER1', forzarNdecimales(StrToFloatdef(tmpstr, 0),
                2) + '%');
              VAE1 := VAE1 + StrToFloatdef(tmpstr, 0);
              tmpstr := DModule_1.QAPUTotal.AsString;
              tmpstr := decimal_correcto(tmpstr);
              subtotal1 := subtotal1 + StrToFloatdef(tmpstr, 0);
            end;
          2:
            begin
              sustituye_en_Excel(excelApus, '#DESCRIPCION2', DModule_1.QAPUdescripcion.AsString);
              sustituye_en_Excel(excelApus, '#UNIDAD2', DModule_1.QAPUunidad.AsString);
              sustituye_en_Excel(excelApus, '#CANTIDAD2', DModule_1.QAPUCantidad.AsString);
              sustituye_en_Excel(excelApus, '#PRECIO2', DModule_1.QAPUPrecio.AsString);
              sustituye_en_Excel(excelApus, '#SUBTOTAL2', StrToFloatdef(DModule_1.QAPUTotal.AsString, 0));
              sustituye_en_Excel(excelApus, '#CODCPC4', DModule_1.QAPUcodCPC.AsString);

              sustituye_en_Excel(excelApus, '#CATCPC2', DModule_1.QAPUTipoCPC.AsString);
              sustituye_en_Excel(excelApus, '#PORCENT2',
                forzarNdecimales(StrToFloatdef(DModule_1.QAPUpesoRelativo.AsString,
                0), 2) + '%');
              sustituye_en_Excel(excelApus, '#PVAER2',
                forzarNdecimales(StrToFloatdef(DModule_1.QAPUVAER.AsString,
                0), 2) + '%');
              sustituye_en_Excel(excelApus, '#PTOTALVAER2',
                forzarNdecimales(StrToFloatdef(DModule_1.QAPUPtotalVAER.AsString,
                0), 2) + '%');
              subtotal2 := subtotal2 + StrToFloatdef(DModule_1.QAPUTotal.AsString, 0);
              VAE2 := VAE2 + StrToFloatdef(DModule_1.QAPUPtotalVAER.AsString, 0);
            end;
          3:
            begin
              sustituye_en_Excel(excelApus, '#DESCRIPCION3', DModule_1.QAPUdescripcion.AsString);
              sustituye_en_Excel(excelApus, '#UNIDAD3', DModule_1.QAPUunidad.AsString);
              sustituye_en_Excel(excelApus, '#CANTIDAD3', DModule_1.QAPUCantidad.AsString);
              sustituye_en_Excel(excelApus, '#PRECIO3', DModule_1.QAPUPrecio.AsString);
              sustituye_en_Excel(excelApus, '#SUBTOTAL3', StrToFloatdef(DModule_1.QAPUTotal.AsString, 0));
              sustituye_en_Excel(excelApus, '#CODCPC3', DModule_1.QAPUcodCPC.AsString);
              sustituye_en_Excel(excelApus, '#CATCPC3', DModule_1.QAPUTipoCPC.AsString);
              sustituye_en_Excel(excelApus, '#PORCENT3',
                forzarNdecimales(StrToFloatdef(DModule_1.QAPUpesoRelativo.AsString,
                0), 2) + '%');
              sustituye_en_Excel(excelApus, '#PVAER3',
                forzarNdecimales(StrToFloatdef(DModule_1.QAPUVAER.AsString,
                0), 2) + '%');
              sustituye_en_Excel(excelApus, '#PTOTALVAER3', StrToFloatdef(DModule_1.QAPUPtotalVAER.AsString,
                0));
              subtotal3 := subtotal3 + StrToFloatdef(DModule_1.QAPUTotal.AsString, 0);
              VAE3 := VAE3 + StrToFloatdef(DModule_1.QAPUPtotalVAER.AsString, 0);
            end;
          4:
            begin
              sustituye_en_Excel(excelApus, '#DESCRIPCION4', DModule_1.QAPUdescripcion.AsString);
              sustituye_en_Excel(excelApus, '#CANTIDAD4', DModule_1.QAPUCantidad.AsString);
              sustituye_en_Excel(excelApus, '#PRECIO4', DModule_1.QAPUPrecio.AsString);
              sustituye_en_Excel(excelApus, '#RENDIMIENTO4',
                StrToFloatdef(DModule_1.QAPUrendimiento.AsString,
                0));
              sustituye_en_Excel(excelApus, '#SUBTOTAL4', StrToFloatdef(DModule_1.QAPUTotal.AsString, 0));
              sustituye_en_Excel(excelApus, '#COSTOHORA4', DModule_1.QAPUCostoHora.AsFloat);
              sustituye_en_Excel(excelApus, '#CODCPC4', DModule_1.QAPUcodCPC.AsString);
              sustituye_en_Excel(excelApus, '#CATCPC4', DModule_1.QAPUTipoCPC.AsString);
              sustituye_en_Excel(excelApus, '#PORCENT4',
                forzarNdecimales(StrToFloatdef(DModule_1.QAPUpesoRelativo.AsString,
                0), 2) + '%');
              sustituye_en_Excel(excelApus, '#PVAER4',
                forzarNdecimales(StrToFloatdef(DModule_1.QAPUVAER.AsString,
                0), 2) + '%');
              sustituye_en_Excel(excelApus, '#PTOTALVAER4',
                forzarNdecimales(StrToFloatdef(DModule_1.QAPUPtotalVAER.AsString,
                0), 2) + '%');
              sustituye_en_Excel(excelApus, '#CCOSTOHORA4', StrToFloatdef(DModule_1.QAPUCostoHora.AsString,
                0));
              subtotal4 := subtotal4 + StrToFloatdef(DModule_1.QAPUTotal.AsString, 0);
              VAE4 := VAE4 + StrToFloatdef(DModule_1.QAPUPtotalVAER.AsString, 0)
            end;
        end;

        DModule_1.QAPU.Next;
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
      excelApus.SheetName := codAPU;
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

procedure TfVisorReportesExt.GeneraReportePresupuesto;
var
  reporteGenerado: Boolean;
  modelo: Integer;
  nombrePlantilla: string;
  tipoPresupuesto: Integer;
  X: Integer;
  datosPresupuesto: dat_datosPresupuesto;
  nombreExcelTPresupuesto: string;
  nombreExcelTAPUS: string;
  listadoAPUSConcatenar: TStringList;
  tipoApus: Integer;
  SSO: Boolean;
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
  carpetaGuardadoTemporal := rutaApp + FormatDateTime('yyyymmddhhnnss', now) + '\';

  nombreExcelPlantillaPresupuesto := frmMain.Reportes.Presupuesto;
  rutaPlantillaProyecto := danombrePlantilla(nombreExcelPlantillaPresupuesto);

  rutaPlantillaProyecto := descomprimeArchivoZIP2excel(rutaPlantillaProyecto, carpetaGuardadoTemporal);
  rutaPlantillaProyecto := desencriptafichero(rutaPlantillaProyecto);

  nombreExcelPlantillaAPUS := frmMain.Reportes.AnalisisPrecios;
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
    listadoAPUSConcatenar.add(nombreExcelTPresupuesto);

    listadoApusProyecto := TStringList.Create;
    listadoApusProyecto := generaApusProyecto();
    if cbbConApus.ItemIndex > 0 then
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
        listadoAPUSConcatenar.add(nombreExcelNewAPUS);
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

    reporteGenerado := True;
  end;
  LoadFile(nombreExcelTPresupuesto);

end;

procedure TfVisorReportesExt.generaReporteProyecto;
var
  reporteGenerado: Boolean;
  nombreExcelPlantillaPresupuesto: string;
  rutaPlantillaProyecto: string;
  nombreExcelTPresupuesto: string;
  cSearch: posExcel;
  SERCOP: Boolean;
  cargarXLS: Boolean;
begin
  excelProyecto := TXlsFile.Create(False);
  reporteGenerado := False;
  cargarXLS := True;
  carpetaGuardadoTemporal := rutaApp + FormatDateTime('yyyymmddhhnnss', now) + '\';
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
            cSearch := daPosicionExcel(excelProyecto, '#PRO_NUM_PERIODO');
            CompletaCronogramaValoradoDatosPeriodos(excelProyecto, cSearch);
            borraLineaPlantilla(excelProyecto, '#DATOPERIODO');
            sustituye_en_Excel(excelProyecto, '#TOTAL_PRESUPUESTO', frmMain.lbl_SubtotalPresupuesto.Text);
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
          if cbbConApus.ItemIndex = 0 then
          begin
            excelProyecto.Save(nombreExcelTPresupuesto);
            GeneraHojasApus(Xls, carpetaGuardadoTemporal, nombreExcelTPresupuesto);
          end;
        end
        else
        begin
          CompletaDesagregacionSercop(excelProyecto);
          if cbbConApus.ItemIndex = 0 then
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

end;

procedure TfVisorReportesExt.GeneraReporteTipo2;
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
  if IncluirApusAnidados then
    ExpandirApusAnidados(listadoApusReporteAnalisis);

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
    listadoAPUSConcatenar.add(nombreExcelTAPUS);
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
end;

procedure TfVisorReportesExt.generarReporte;
begin
  case modo of
    1: // Acta de Constitucion del Proyecto
      begin
        lbl_descripcion.Text := 'Acta de Constitución del Proyecto';
        generaReporteProyecto;
      end;
    2: // Analisis
      begin
        lbl_descripcion.Text := 'Analísis Precios Unitarios';
        GeneraReporteTipo2;
      end;
    3: // Cronograma de Trabajo  (Proyect no se usa aqui)
      begin

      end;
    4: // Cronograma Valorado
      begin
        lbl_descripcion.Text := 'Cronograma Valorado';
        generaReporteProyecto;
      end;
    5: // Desagregacion Tecnologica
      begin
        lbl_descripcion.Text := 'Desagregación Técnologica';
        generaReporteProyecto;
      end;
    6: // EDT - Diccionario
      begin
        lbl_descripcion.Text := 'EDT - Diccionario';
        generaReporteProyecto;
      end;
    7: // EDT - Listado
      begin
        lbl_descripcion.Text := 'EDT - Listado';
      end;
    8: // EDT - Valorada
      begin
        lbl_descripcion.Text := 'EDT - Valoración';
        generaReporteProyecto;
      end;
    9: // Equipo del Proyecto (Stake Holders)
      begin
        lbl_descripcion.Text := 'Equipo del Proyecto (StakeHolders)';
        generaReporteProyecto;
      end;
    10: // Estructura Descomposicion Organización (EDO)
      begin
        lbl_descripcion.Text := 'Estructura Descomposición Organización (EDO)';
        generaReporteProyecto;
      end;
    11: // Formulas Polinomicas
      begin
        lbl_descripcion.Text := 'Fórmula Polinomica';
        generaReporteProyecto;
      end;
    12: // Gestion de Tiempos
      begin
        lbl_descripcion.Text := 'Gestión de Tiempos';
      end;
    13: // Porcentaje Indirectos
      begin
        lbl_descripcion.Text := 'Porcentaje Indirectos';
      end;
    14: // Presupuestos
      begin
        lbl_descripcion.Text := 'Presupuesto de Proyecto';
        GeneraReportePresupuesto;
      end;
  end;
end;

procedure TfVisorReportesExt.lbSheetsChange(Sender: TObject);
begin
  if (lbSheets.Items.Count > Xls.SheetCount) or (lbSheets.ItemIndex < 0) then
    exit;
  Xls.ActiveSheet := lbSheets.ItemIndex + 1;
  MainPreview.InvalidatePreview();
end;

procedure TfVisorReportesExt.LoadFile(const FileName: string);
var
  i: Integer;
begin
  pnlExportando.Visible := False;
  lbSheets.Items.clear;
  try
    Xls.Open(FileName);
  except
    on ex: Exception do
    begin
      ShowMessage('Error opening file: ' + ex.Message);
      MainPreview.InvalidatePreview;
      exit;
    end;
  end;

  for i := 1 to Xls.SheetCount do
  begin
    lbSheets.Items.add(Xls.GetSheetName(i));
  end;
  lbSheets.ItemIndex := Xls.ActiveSheet - 1;
  MainPreview.InvalidatePreview;
end;

procedure TfVisorReportesExt.MainPreviewMouseWheel(Sender: TObject; Shift: TShiftState; WheelDelta:
  Integer; var Handled: Boolean);
var
  X: Integer;
  valorZoom: Real;
begin
  X := WheelDelta;
  valorZoom := MainPreview.Zoom;
  if X > 0 then
    valorZoom := valorZoom + 0.025
  else
    valorZoom := valorZoom - 0.025;
  MainPreview.Zoom := valorZoom;
end;

function TfVisorReportesExt.recibeDatosPresupuestos: dat_datosPresupuesto;
var
  qry: TUniQuery;
  fechaPresupuesto: TdateTime;
  valTmp1, valTmp2: Double;
begin
  qry := TUniQuery.Create(nil);
  try
    with qry do
    begin
      Connection := DModule_1.con2;
      close;
      sql.clear;
      sql.add('select * from Presupuestos_datosGenerales where codPresupuesto=:codPresupuesto and revision=:revision and codBase='
        + QuotedStr(base_activa.codBase));
      parambyname('codPresupuesto').AsString := codProyecto;
      parambyname('revision').AsString := revision;
      Prepare;
      ExecSQL;
      First;
      result.codigo := codProyecto;
      result.revision := revision;
      result.codigoReferencial := FieldByName('codReferencial').AsString;
      result.Titulo := FieldByName('descripcion').AsString;
      fechaPresupuesto := FieldByName('fechaCreacion').AsDateTime;
      result.Fecha := FormatDateTime('dd/mm/yyyy', fechaPresupuesto);
      result.subtotal := decimal_correcto(FieldByName('subtotal').AsString);
      valTmp1 := StrToFloat(result.subtotal);
      result.IVA := decimal_correcto(FieldByName('iva').AsString);
      valTmp2 := StrToFloat(result.IVA);
      valTmp2 := calculaPorcentajeIvaPrecios(valTmp1, valTmp2);
      result.porcentajeIVA := FloatToStr(valTmp2) + '%';
      result.Total := decimal_correcto(FieldByName('total').AsString);

      close;
      sql.clear;
      sql.add('select * from presupuestos_DatosProyecto where codPresupuesto=:codPresupuesto and revision=:revision and codBase='
        + QuotedStr(base_activa.codBase));
      parambyname('codPresupuesto').AsString := codProyecto;
      parambyname('revision').AsString := revision;
      Prepare;
      ExecSQL;
      if FieldByName('direccion').AsString <> '' then
        result.Ubicacion := FieldByName('direccion').AsString + ' - ' + FieldByName('ciudad').AsString
          + ' - ' + FieldByName('Provincia').AsString
      else
        result.Ubicacion := FieldByName('ciudad').AsString + ' - ' + FieldByName('Provincia').AsString;
      close;
      sql.clear;
      sql.add('select * from empresas where codUnico=' + QuotedStr(CodUnicoEmpresaActiva));
      Prepare;
      ExecSQL;
      result.Oferente := FieldByName('nombre').AsString;
      if base_activa.simboloMoneda = '' then
        base_activa.simboloMoneda := '$';
      result.moneda := daNombreMoneda(base_activa.moneda);
    end;
  finally
    qry.free;
  end;
end;

procedure TfVisorReportesExt.RecogeDatosActaProyecto;
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
      sql.clear;
      sql.add('select * from presupuestos_datosProyecto where codBase=:codBase and codPresupuesto=:codPresupuesto and revision=:revision');
      parambyname('codBase').AsString := base_activa.codBase;
      parambyname('codPresupuesto').AsString := codProyecto;
      parambyname('revision').AsString := revision;
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

procedure TfVisorReportesExt.RecogeDatosCronogramaValorado;
begin
  with DMPresupuesto.QDatosCronogramasValorados do
  begin
    parambyname('codBase').AsString := base_activa.codBase;
    parambyname('codPresupuesto').AsString := codProyecto;
    parambyname('revision').AsString := revision;
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

procedure TfVisorReportesExt.RecogeDatosEdt;
var
  X: Integer;
begin
  X := 0;
  SetLength(lista_EDT, 0);
  with DMPresupuesto.QEDT_Diccionario do
  begin
    parambyname('codBase').AsString := base_activa.codBase;
    parambyname('codPresupuesto').AsString := codProyecto;
    parambyname('Revision').AsString := revision;
    Open;
    First;
    while not Eof do
    begin
      SetLength(lista_EDT, X + 1);
      lista_EDT[X].codEdt := DMPresupuesto.QEDT_DiccionariocodEdt.AsString;
      lista_EDT[X].descripcion := DMPresupuesto.QEDT_Diccionariodescripcion.AsString;
      lista_EDT[X].Responsable := DMPresupuesto.QEDT_DiccionarioResponsable.AsString;
      lista_EDT[X].definicion := DMPresupuesto.QEDT_DiccionarioDefinicion.AsString;
      Next;
      Inc(X);
    end;
  end;
end;

procedure TfVisorReportesExt.RecogeDatosEdt_valorada;
var
  X: Integer;
begin
  X := 0;
  SetLength(lista_EDT, 0);
  with DMPresupuesto.QEDT_Valorada do
  begin
    parambyname('codBase').AsString := base_activa.codBase;
    parambyname('codPresupuesto').AsString := codProyecto;
    parambyname('Revision').AsString := revision;
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
      Next;
      Inc(X);
    end;
  end;
end;

procedure TfVisorReportesExt.rect_1MouseDown(Sender: TObject; Button: TMouseButton; Shift:
  TShiftState; X, Y: Single);
begin
  Self.StartWindowDrag;
end;

procedure TfVisorReportesExt.rect_AceptarClick(Sender: TObject);
begin
  if DirectoryExists(carpetaGuardadoTemporal) then
    RemoveDir(carpetaGuardadoTemporal);

  ModalResult := mrOk;
end;

procedure TfVisorReportesExt.rect_ExportarExcelClick(Sender: TObject);
begin
  exportarExcel;
end;

procedure TfVisorReportesExt.rect_ExportarExcelMouseDown(Sender: TObject; Button: TMouseButton;
  Shift: TShiftState; X, Y: Single);
begin
  Shadow_ExportarExcel.Enabled := False;
end;

procedure TfVisorReportesExt.rect_ExportarExcelMouseLeave(Sender: TObject);
begin
  Shadow_ExportarExcel.Enabled := True;
end;

procedure TfVisorReportesExt.rect_ExportarExcelMouseUp(Sender: TObject; Button: TMouseButton; Shift:
  TShiftState; X, Y: Single);
begin
  Shadow_ExportarExcel.Enabled := True;
end;

procedure TfVisorReportesExt.rect_ExportarPDFClick(Sender: TObject);
begin
  exportarPDF;
end;

procedure TfVisorReportesExt.rect_ExportarPDFMouseDown(Sender: TObject; Button: TMouseButton; Shift:
  TShiftState; X, Y: Single);
begin
  Shadow_ExportarPDF.Enabled := False;
end;

procedure TfVisorReportesExt.rect_ExportarPDFMouseLeave(Sender: TObject);
begin
  Shadow_ExportarPDF.Enabled := True;
end;

procedure TfVisorReportesExt.rect_ExportarPDFMouseUp(Sender: TObject; Button: TMouseButton; Shift:
  TShiftState; X, Y: Single);
begin
  Shadow_ExportarPDF.Enabled := True;
end;

procedure TfVisorReportesExt.RellenaExcelParteCronograma(gridTratar: Integer; Xls: TExcelFile;
  nPeriodos: Integer);
var
  cSearch: posExcel;
  R, C: Integer;
  X, Y: Integer;
  Valor: string;
begin
  for X := 1 to frmMain.grid_Crono1.RowCount - 1 do
  begin
    sustituye_en_Excel(Xls, '#PRO_NUM_PERIODO', IntToStr(X));
    case gridTratar of
      0:
        begin

          cSearch := daPosicionExcel(Xls, '#DATOPERIODO');
          R := cSearch.RFila;
          C := cSearch.Columna;

          for Y := 0 to nPeriodos + 1 do
          begin
            Valor := frmMain.grid_Crono1.cells[Y, X];
            Xls.SetCellValue(R, C, Valor, -1);
            Inc(C);
          end;
          Inc(R);

        end;
      1:
        begin

          cSearch := daPosicionExcel(Xls, '#DATOPERIODO');
          R := cSearch.RFila;
          C := cSearch.Columna;

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
          cSearch := daPosicionExcel(Xls, '#DATOPERIODO');
          R := cSearch.RFila;
          C := cSearch.Columna;

          for Y := 0 to nPeriodos + 1 do
          begin
            Valor := frmMain.grid_Crono1.cells[Y, X];
            Xls.SetCellValue(R, C, Valor, -1);
            Inc(C);
          end;
          Inc(R);

        end;
      3:
        begin
          cSearch := daPosicionExcel(Xls, '#DATOPERIODO');
          R := cSearch.RFila;
          C := cSearch.Columna;

          for Y := 0 to nPeriodos + 1 do
          begin
            Valor := frmMain.grid_Crono1.cells[Y, X];
            Xls.SetCellValue(R, C, Valor, -1);
            Inc(C);
          end;
          Inc(R);
        end;
    end;
  end;
  sustituye_en_Excel(Xls, '#PRO_NUM_PERIODO', IntToStr(X));
end;

procedure TfVisorReportesExt.RellenaExcelParteInicio(Xls: TExcelFile);
var
  X: Integer;
  Valor: string;
  cSearch: posExcel;
  R, C: Integer;
begin
  for X := 1 to frmMain.grid_crono0.RowCount do
  begin
    cSearch := daPosicionExcel(Xls, '#ITEM');
    R := cSearch.RFila;
    C := cSearch.Columna;
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

procedure TfVisorReportesExt.rellena_en_Excel(Xls: TExcelFile; Columna: string; Fila: Integer; Valor:
  Variant);
var
  salir: Boolean;
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

end.

