unit uReportesPresupuestos;

interface

uses
  System.SysUtils, System.Types, System.UITypes, System.Classes, System.Variants,
  Uni, FMX.Types, FMX.Controls, FMX.Forms, FMX.Graphics, FMX.Dialogs,
  FlexCel.FMXSupport, fmx.DialogService, FlexCel.Core, FlexCel.XlsAdapter,
  FlexCel.Render, FMX.Edit, FMX.Objects, FMX.StdCtrls, FMX.Printer,
  FMX.Controls.Presentation, FMX.ListBox, FMX.Layouts, FMX.FlexCel.Preview,
  FMX.Menus, FMX.Ani, UPasswordDialog, UPdfExporting, UPrinting, FMX.Effects;

type
  dat_datosPresupuesto = record
    codigo: string;
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
 // 2708

type
  TfrmReportesPresupuestos = class(TForm)
    AutofitMenu: TPopupMenu;
    NoAutofit1: TMenuItem;
    FittoWidth1: TMenuItem;
    FittoHeight1: TMenuItem;
    FittoPage1: TMenuItem;
    Layout1: TLayout;
    spl1: TSplitter;
    Layout2: TLayout;
    ThumbsBkg: TRectangle;
    Thumbs: TFlexCelPreviewer;
    PanelSheets: TLayout;
    lbSheets: TListBox;
    Panel1: TPanel;
    Label5: TLabel;
    Panel2: TPanel;
    cbAllSheets: TCheckBox;
    MainBkg: TRectangle;
    MainPreview: TFlexCelPreviewer;
    PanelPdf: TPanel;
    lyt_12: TLayout;
    btnPdfCancel: TButton;
    lbl_11: TLabel;
    lbl_PdfPage: TLabel;
    PdfProgressBar: TProgressBar;
    PanelPdfError: TPanel;
    lyt_13: TLayout;
    btn_PdfErrorClose: TButton;
    lblPdfError: TLabel;
    PanelPdfOk: TPanel;
    lyt_14: TLayout;
    btn_PdfOkClose: TButton;
    btnOpenGeneratedFile: TButton;
    lbl_12: TLabel;
    PanelPrinting: TPanel;
    lyt_15: TLayout;
    btnPrintCancel: TButton;
    lbl_13: TLabel;
    PrintProgressBar: TProgressBar;
    lblPrintPage: TLabel;
    PanelPrintingError: TPanel;
    lyt_16: TLayout;
    btn_PrintingErrorClose: TButton;
    lblPrintingError: TLabel;
    PanelPrintingOk: TPanel;
    lyt_17: TLayout;
    btn_PrintOkClose: TButton;
    lbl_14: TLabel;
    PanelZoom: TPanel;
    TrackBarZoom: TTrackBar;
    btn25: TButton;
    btn50: TButton;
    btn75: TButton;
    btn100: TButton;
    btn150: TButton;
    PdfSaveDialog: TSaveDialog;
    PrintDialog: TPrintDialog;
    stylbk_1: TStyleBook;
    ToolBar1: TToolBar;
    ActionOpen: TButton;
    img: TImage;
    ActionPdf: TButton;
    img1: TImage;
    ActionPrint: TButton;
    img2: TImage;
    ActionAutofit: TButton;
    img3: TImage;
    OpenDialog: TOpenDialog;
    PanelSelectPage: TLayout;
    lblPdfPage: TLabel;
    lblTotalPages: TLabel;
    edPage: TEdit;
    ActionZoom: TButton;
    img5: TImage;
    ActionGridlines: TButton;
    img6: TImage;
    ActionHeadings: TButton;
    img7: TImage;
    ActionRecalc: TButton;
    img8: TImage;
    lyt_header: TLayout;
    rect___1: TRectangle;
    lbl_banner1: TLabel;
    lyt_Body: TLayout;
    rect___2: TRectangle;
    lyt_3: TLayout;
    rect___3: TRectangle;
    lyt_6: TLayout;
    lyt_7: TLayout;
    lbl_descripcion: TLabel;
    lyt_footer: TLayout;
    rect___Cancelar: TRectangle;
    iGlow_Cancelar: TInnerGlowEffect;
    rect_Aceptar: TRectangle;
    iGlow_Aceptar: TInnerGlowEffect;
    lbl_adicional: TLabel;
    lbl_paquete: TLabel;
    lyt_1: TLayout;
    cbbPlatillasPresupuesto: TComboBox;
    chkApus: TCheckBox;
    ActionGenerate: TButton;
    img11: TImage;
    ActionExcel: TButton;
    img12: TImage;
    procedure FormShow(Sender: TObject);
    procedure FormCreate(Sender: TObject);
    procedure ActionCloseClick(Sender: TObject);
    procedure cbAllSheetsChange(Sender: TObject);
    procedure lbSheetsChange(Sender: TObject);
    procedure ActionPdfClick(Sender: TObject);
    procedure ActionPrintClick(Sender: TObject);
    procedure btnOpenGeneratedFileClick(Sender: TObject);
    procedure btnPdfCancelClick(Sender: TObject);
    procedure btnPrintCancelClick(Sender: TObject);
    procedure btn_PdfErrorCloseClick(Sender: TObject);
    procedure btn_PrintingErrorCloseClick(Sender: TObject);
    procedure btn_PrintOkCloseClick(Sender: TObject);
    procedure btn_PdfOkCloseClick(Sender: TObject);
    procedure MainPreviewStartPageChanged(Sender: TObject);
    procedure edPageExit(Sender: TObject);
    procedure MainPreviewZoomChanged(Sender: TObject);
    procedure ActionZoomClick(Sender: TObject);
    procedure btn25Click(Sender: TObject);
    procedure btn50Click(Sender: TObject);
    procedure btn75Click(Sender: TObject);
    procedure btn100Click(Sender: TObject);
    procedure btn150Click(Sender: TObject);
    procedure TrackBarZoomChange(Sender: TObject);
    procedure PanelZoomExit(Sender: TObject);
    procedure PanelZoomMouseLeave(Sender: TObject);
    procedure ActionAutofitClick(Sender: TObject);
    procedure NoAutofit1Click(Sender: TObject);
    procedure FittoWidth1Click(Sender: TObject);
    procedure FittoHeight1Click(Sender: TObject);
    procedure FittoPage1Click(Sender: TObject);
    procedure ActionRecalcClick(Sender: TObject);
    procedure ActionGridlinesClick(Sender: TObject);
    procedure ActionHeadingsClick(Sender: TObject);
    procedure edPageKeyDown(Sender: TObject; var Key: Word; var KeyChar:
      WideChar; Shift: TShiftState);
    procedure ActionOpenClick(Sender: TObject);
    procedure rect___1MouseDown(Sender: TObject; Button: TMouseButton; Shift:
      TShiftState; X, Y: Single);
    procedure rect_AceptarClick(Sender: TObject);
    procedure ActionGenerateClick(Sender: TObject);
    procedure ActionExcelClick(Sender: TObject);
  private
    { Private declarations }

    Xls: TExcelFile;
    ImgExport: TFlexCelImgExport;
    PrintingThread: TPrintingThread;
    PdfThread: TPdfThread;
    DisabledCount: integer;
    ChangingZoom: boolean;
    excelPresupuesto: TExcelFile;
    excelApus: TExcelFile;
    procedure EnableCommonActions(const Enable: boolean);
    procedure LoadFile(const FileName: string);
    procedure GetPassword(const e: TOnPasswordEventArgs);
    procedure UpdateZoom;
    procedure UpdateAutofitText;
    procedure UpdatePages;
    procedure ChangePages;
    procedure GeneraReportePresupuesto();
    procedure cargaPlantillasPresupuestos;
    procedure generaCuerpoPresupuesto(xls: TExcelFile);
    function recibeDatosPresupuestos(codPresupuesto: string): dat_datosPresupuesto;
  public
    { Public declarations }
    codPresupuesto: string;
    procedure estadoActions(estado: Boolean);
  end;

var
  frmReportesPresupuestos: TfrmReportesPresupuestos;

implementation

{$R *.fmx}

uses
{$IFDEF MSWINDOWS}
  Winapi.ShellAPI, Winapi.Windows,
{$ENDIF MSWINDOWS}
{$IFDEF POSIX}
  Posix.Stdlib,
{$ENDIF POSIX}
  DM1, PlantillasExcel;

procedure TfrmReportesPresupuestos.cargaPlantillasPresupuestos;
var
  qry: TUniQuery;
  posCBB: integer;
  tmpstr: string;
  x: integer;
begin
  cbbPlatillasPresupuesto.items.Clear;
  qry := TUniQuery.Create(nil);
  posCBB := 0;
  try
    with qry do
    begin
      Connection := DModule_1.con2;
      close;
      sql.Clear;
      SQL.Add('select * from plantillas where categoria=:categoria order by plantilla');
      ParamByName('categoria').AsString := 'Presupuestos';
      Prepare;
      ExecSQL;
      while not Eof do
      begin
        tmpstr := FieldByName('descripcion').AsString;
        cbbPlatillasPresupuesto.items.Add(tmpstr);
        Next;
      end;
      if idFiscalEmpresaSeleccionada <> '' then
      begin
        Close;
        sql.Clear;
        sql.Add('select * from empresas_config where codUnico=:codUnico');
        ParamByName('codUnico').AsString := idFiscalEmpresaSeleccionada;
        ExecSQL;
        tmpstr := FieldByName('reportePresupuestos').AsString;
        posCBB := StrToIntDef(tmpstr, 0);
      end;
    end;
  finally
    qry.free;
    cbbPlatillasPresupuesto.ItemIndex := posCBB;
  end;

end;

procedure TfrmReportesPresupuestos.ActionAutofitClick(Sender: TObject);
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

procedure TfrmReportesPresupuestos.ActionCloseClick(Sender: TObject);
begin
  ModalResult := mrOk;
end;

procedure TfrmReportesPresupuestos.ActionExcelClick(Sender: TObject);
var
  SaveDialog: TSaveDialog;
begin
  if OpenDialog.FileName <> '' then
  begin
    SaveDialog := TSaveDialog.Create(nil);
    try
      SaveDialog.Title := 'Guardar Reporte';
      SaveDialog.Filter := 'Excel Files (*.xls)|*.xls|*.xlsx';
      SaveDialog.FileName := ExtractFileName(OpenDialog.FileName);
      if SaveDialog.Execute then
      begin
        excelPresupuesto.PrintToFit := True;
        excelPresupuesto.Save(SaveDialog.FileName + '.xls');
        TDialogService.MessageDialog('Reporte Guardado, ¿Abrir archivo?',
          TMsgDlgType.mtConfirmation, FMX.Dialogs.mbYesNoCancel, TMsgDlgBtn.mbNo, 0,
          procedure(const AResult: System.UITypes.TModalResult)
          begin
            if AResult = mrYES then
              ShellExecute(GetDesktopWindow, 'open', PWideChar(SaveDialog.FileName
                + '.xls'), nil, nil, SW_SHOWNORMAL);
          end);
      end
      else
      begin
        ShowMessage('Reporte Cancelado.');
      end;
    finally
      SaveDialog.Free;
    end;
  end
  else
  begin
    ShowMessage('Genere el reporte. Por favor');
  end;
end;

procedure TfrmReportesPresupuestos.ActionGenerateClick(Sender: TObject);
begin
  GeneraReportePresupuesto();
end;

procedure TfrmReportesPresupuestos.ActionGridlinesClick(Sender: TObject);
var
  i: Integer;
  SaveActiveSheet: integer;
begin
  if cbAllSheets.IsChecked then
  begin
    SaveActiveSheet := Xls.ActiveSheet;
    for i := 1 to Xls.SheetCount do
    begin
      Xls.ActiveSheet := i;
      Xls.PrintGridLines := ActionGridLines.IsPressed;
    end;
    Xls.ActiveSheet := SaveActiveSheet;

  end
  else
  begin
    Xls.PrintGridLines := ActionGridLines.IsPressed;
  end;
  MainPreview.InvalidatePreview;
end;

procedure TfrmReportesPresupuestos.ActionHeadingsClick(Sender: TObject);
var
  i: Integer;
  SaveActiveSheet: integer;
begin
  if cbAllSheets.IsChecked then
  begin
    SaveActiveSheet := Xls.ActiveSheet;
    for i := 1 to Xls.SheetCount do
    begin
      Xls.ActiveSheet := i;
      Xls.PrintHeadings := ActionHeadings.IsPressed;
    end;

    Xls.ActiveSheet := SaveActiveSheet;

  end
  else
  begin
    Xls.PrintHeadings := ActionHeadings.IsPressed;
  end;
  MainPreview.InvalidatePreview;
end;

procedure TfrmReportesPresupuestos.ActionOpenClick(Sender: TObject);
begin
  OpenDialog.Execute;
  if OpenDialog.FileName <> '' then
    LoadFile(OpenDialog.FileName);
end;

procedure TfrmReportesPresupuestos.ActionPdfClick(Sender: TObject);
begin
  if not PdfSaveDialog.Execute then
    exit;

  PdfProgressBar.Value := 0;
  lblPdfPage.Text := 'Inizializando';
  EnableCommonActions(false);
  ActionPdf.Enabled := false;
  btnPdfCancel.Enabled := true;
  btnPdfCancel.Text := 'Cancelar';

  PanelPdfOk.Visible := false;
  PanelPdfError.Visible := false;
  PanelPdf.Visible := true;

  FreeAndNil(PdfThread);
  PdfThread := TPdfThread.Create(Xls,
    procedure(Progress: integer; Msg: string)
    begin
      PdfProgressBar.Value := Progress;
      lblPdfPage.Text := Msg;
    end,
    procedure(Ok: boolean; Msg: string)
    begin
      PanelPdf.Visible := false;
      if not Ok then
      begin
        PanelPdfError.Visible := true;
        lblPdfError.Text := 'Error a crear PDF: ' + Msg;
      end
      else
      begin
        PanelPdfOk.Visible := true;
      end;
      EnableCommonActions(true);
      ActionPdf.Enabled := true;
    end, PdfSaveDialog.FileName, cbAllSheets.IsChecked);

  PdfThread.Start;
end;

procedure TfrmReportesPresupuestos.ActionPrintClick(Sender: TObject);
begin
  if not PrintDialog.Execute then
    exit;

  PrintProgressBar.Value := 0;
  lblPrintPage.Text := 'Inizializando';
  EnableCommonActions(false);
  ActionPrint.Enabled := false;

  btnPrintCancel.Enabled := true;
  btnPrintCancel.Text := 'Cancelar';

  PanelPrintingOk.Visible := false;
  PanelPrintingError.Visible := false;
  PanelPrinting.Visible := true;

  FreeAndNil(PrintingThread);
  PrintingThread := TPrintingThread.Create(Xls,
    procedure(Progress: integer; Msg: string)
    begin
      PrintProgressBar.Value := Progress;
      lblPrintPage.Text := Msg;
    end,
    procedure(Ok: boolean; Msg: string)
    begin
      PanelPrinting.Visible := false;
      if not Ok then
      begin
        PanelPrintingError.Visible := true;
        lblPrintingError.Text := 'Error al imprimir: ' + Msg;
      end
      else
      begin
        PanelPrintingOk.Visible := true;
      end;
      EnableCommonActions(true);
      ActionPrint.Enabled := true;
    end, '', cbAllSheets.IsChecked);

  PrintingThread.Start;
end;

procedure TfrmReportesPresupuestos.ActionRecalcClick(Sender: TObject);
begin
  Xls.Recalc;
  MainPreview.InvalidatePreview;
end;

procedure TfrmReportesPresupuestos.ActionZoomClick(Sender: TObject);
var
  p: TPointF;
begin
  p := TPointF.Create(ActionZoom.Position.Point.X, ActionZoom.Position.Point.Y);
  p.Y := p.Y + ActionZoom.Height;

  PanelZoom.Position.Point := p;
  PanelZoom.Visible := true;
  TrackBarZoom.SetFocus;
end;

procedure TfrmReportesPresupuestos.btn100Click(Sender: TObject);
begin
  MainPreview.Zoom := 1;
  PanelZoom.Visible := false;
end;

procedure TfrmReportesPresupuestos.btn150Click(Sender: TObject);
begin
  MainPreview.Zoom := 1.50;
  PanelZoom.Visible := false;
end;

procedure TfrmReportesPresupuestos.btn25Click(Sender: TObject);
begin
  MainPreview.Zoom := 0.25;
  PanelZoom.Visible := false;
end;

procedure TfrmReportesPresupuestos.btn50Click(Sender: TObject);
begin
  MainPreview.Zoom := 0.50;
  PanelZoom.Visible := false;
end;

procedure TfrmReportesPresupuestos.btn75Click(Sender: TObject);
begin
  MainPreview.Zoom := 0.75;
  PanelZoom.Visible := false;
end;

procedure TfrmReportesPresupuestos.btnOpenGeneratedFileClick(Sender: TObject);
begin
{$IFDEF MSWINDOWS}
  ShellExecute(0, 'open', PChar(PdfSaveDialog.FileName), '', '', SW_SHOWNORMAL);
{$ENDIF}
{$IFDEF POSIX}
  _system(PAnsiChar('open ' + UTF8Encode(PdfSaveDialog.FileName)));
{$ENDIF POSIX}
end;

procedure TfrmReportesPresupuestos.btnPdfCancelClick(Sender: TObject);
begin
  if PdfThread = nil then //it shouldn't really happen
  begin
    PanelPdf.Visible := false;
    exit;
  end;
  btnPdfCancel.Enabled := false;
  btnPdfCancel.Text := 'Cancelando...';
  PdfThread.Terminate;
end;

procedure TfrmReportesPresupuestos.btnPrintCancelClick(Sender: TObject);
begin
  if PrintingThread = nil then //it shouldn't really happen
  begin
    PanelPrinting.Visible := false;
    exit;
  end;
  btnPrintCancel.Enabled := false;
  btnPrintCancel.Text := 'Cancelando...';
  PrintingThread.Terminate;
end;

procedure TfrmReportesPresupuestos.btn_PdfErrorCloseClick(Sender: TObject);
begin
  PanelPdfError.Visible := false;
end;

procedure TfrmReportesPresupuestos.btn_PdfOkCloseClick(Sender: TObject);
begin
  PanelPrintingOk.Visible := false;
end;

procedure TfrmReportesPresupuestos.btn_PrintingErrorCloseClick(Sender: TObject);
begin
  PanelPrintingError.Visible := false;
end;

procedure TfrmReportesPresupuestos.btn_PrintOkCloseClick(Sender: TObject);
begin
  PanelPdfOk.Visible := false;
end;

procedure TfrmReportesPresupuestos.cbAllSheetsChange(Sender: TObject);
begin
  PanelSheets.Visible := not cbAllSheets.IsChecked;
  ImgExport.AllVisibleSheets := cbAllSheets.IsChecked;
  MainPreview.InvalidatePreview();
end;

procedure TfrmReportesPresupuestos.ChangePages;
var
  pn: integer;
begin
  if TryStrToInt(Trim(edPage.Text), pn) then
    MainPreview.StartPage := pn;
end;

procedure TfrmReportesPresupuestos.edPageExit(Sender: TObject);
begin
  ChangePages;
end;

procedure TfrmReportesPresupuestos.edPageKeyDown(Sender: TObject; var Key: Word;
  var KeyChar: WideChar; Shift: TShiftState);
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

procedure TfrmReportesPresupuestos.EnableCommonActions(const Enable: boolean);
begin
  if Enable then
    Dec(DisabledCount)
  else
    Inc(DisabledCount);
  if DisabledCount < 0 then
    DisabledCount := 0;
  if Enable and (DisabledCount > 0) then
    exit;

  ActionOpen.Enabled := Enable;
  ActionGridLines.Enabled := Enable;
  ActionHeadings.Enabled := Enable;
  ActionRecalc.Enabled := Enable;
end;

procedure TfrmReportesPresupuestos.estadoActions(estado: Boolean);
begin
  ActionPdf.Enabled := estado;
  ActionPrint.Enabled := estado;
  PanelSelectPage.Enabled := estado;
  ActionAutofit.enabled := estado;
  ActionZoom.enabled := estado;
  ActionGridlines.enabled := estado;
  ActionHeadings.enabled := estado;
  ActionExcel.Enabled := estado;
end;

procedure TfrmReportesPresupuestos.FittoHeight1Click(Sender: TObject);
begin
  MainPreview.AutofitPreview := TAutofitPreview.Height;
  UpdateAutofitText;
end;

procedure TfrmReportesPresupuestos.FittoPage1Click(Sender: TObject);
begin
  MainPreview.AutofitPreview := TAutofitPreview.Full;
  UpdateAutofitText;
end;

procedure TfrmReportesPresupuestos.FittoWidth1Click(Sender: TObject);
begin
  MainPreview.AutofitPreview := TAutofitPreview.Width;
  UpdateAutofitText;
end;

procedure TfrmReportesPresupuestos.FormCreate(Sender: TObject);
begin
  FreeAndNil(PrintingThread);
  FreeAndNil(PdfThread);
  FreeAndNil(ImgExport);
  FreeAndNil(Xls);
end;

procedure TfrmReportesPresupuestos.FormShow(Sender: TObject);
begin
  PanelPdfOk.Visible := false;
  PanelPdfError.Visible := false;
  PanelPdf.Visible := false;
  PanelPrintingOk.Visible := false;
  PanelPrintingError.Visible := false;
  PanelPrinting.Visible := false;
  cargaPlantillasPresupuestos;
  Xls := TXlsFile.Create(1, false);
  Xls.Protection.OnPassword := GetPassword;
  ImgExport := TFlexCelImgExport.Create(Xls, false);
  ImgExport.AllVisibleSheets := false;
  MainPreview.Document := ImgExport;
  Thumbs.Document := ImgExport;
  estadoActions(False);
  cbAllSheets.IsChecked := True;
  ActionGenerate.OnClick(ActionGenerate);
end;

procedure TfrmReportesPresupuestos.GeneraReportePresupuesto;
var
  reporteGenerado: Boolean;
  modelo: integer;
  nombrePlantilla: string;
  carpetaGuardadoTemporal: string;
  apusAdiconadas: Boolean;
  tipoPresupuesto: Integer;
  x: integer;
  datosPresupuesto: dat_datosPresupuesto;
  nombreExcelTPresupuesto: string;
  nombreExcelTAPUS: string;
  listadoAPUSConcatenar: TStringList;
  tipoApus: Integer;
  SSO: Boolean;
  excelAPUS: TXlsFile;
  codigoApus: string;
  apusTratar: dat_localRespApus;
  listadoApusProyecto: Tstringlist;
  FileNames: TArray<string>;
  nombreExcelNewAPUS: string;
begin
  excelPresupuesto := TXlsFile.Create(false);
  listadoAPUSConcatenar := TStringList.Create;
  apusAdiconadas := chkApus.IsChecked;
  modelo := cbbPlatillasPresupuesto.ItemIndex;
  nombrePlantilla := danombrePlantilla('');
  carpetaGuardadoTemporal := rutaApp + FormatDateTime('yyyymmddhhnnss', Now) + '\';
  if (nombrePlantilla <> '') and (FileExists(nombrePlantilla)) then
  begin
    excelPresupuesto.Open(nombrePlantilla);
    excelPresupuesto.PrintToFit := True;
    if not DirectoryExists(carpetaGuardadoTemporal) then
      CreateDir(carpetaGuardadoTemporal)
    else
    begin
      BorrarCarpeta(carpetaGuardadoTemporal);
    end;

    x := AnsiPos('SERCOP', nombrePlantilla);
    if x > 0 then
      tipoPresupuesto := 2
    else
      tipoPresupuesto := 1;
    datosPresupuesto := recibeDatosPresupuestos(codPresupuesto);
    creaEncabezadoPresupuesto(excelPresupuesto, tipoPresupuesto,
      datosPresupuesto.Titulo, datosPresupuesto.Oferente, datosPresupuesto.Ubicacion,
      datosPresupuesto.Fecha);
    creaResumenPresupuesto(excelPresupuesto, tipoPresupuesto, datosPresupuesto.subtotal,
      datosPresupuesto.porcentajeIVA, datosPresupuesto.iva, datosPresupuesto.Total,
      datosPresupuesto.moneda);
    generaCuerpoPresupuesto(excelPresupuesto);
    nombreExcelTPresupuesto := carpetaGuardadoTemporal + codPresupuesto + '.xls';
    excelPresupuesto.Save(nombreExcelTPresupuesto);
    listadoAPUSConcatenar.Add(nombreExcelTPresupuesto);
    if apusAdiconadas then
    begin
      listadoApusProyecto := TStringList.Create;
      listadoApusProyecto := generaApusProyecto(codPresupuesto);
      case tipoPresupuesto of
        1:
          begin
            // Plantilla General
            x := AnsiPos('SSO', nombrePlantilla);
            if x > 0 then
            begin
              nombreExcelTAPUS := danombrePlantilla('Analisis');
            end
            else
            begin
              nombreExcelTAPUS := danombrePlantilla('Analisis')
            end;
            modelo := 0;
          end;
        2:
          begin
            // Plantilla APUS Sercop
            nombreExcelTAPUS := danombrePlantilla('Analisis');
            modelo := 1
          end;
      end;

      if (nombreExcelTAPUS <> '') and (FileExists(nombreExcelTAPUS)) then
      begin
        for x := 0 to listadoApusProyecto.Count - 1 do
        begin
          excelAPUS := TXlsFile.Create(false);
          excelAPUS.Open(nombreExcelTAPUS);
          codigoApus := listadoApusProyecto[x];
          apusTratar := daDatos1Apus(codigoApus);
          case modelo of
            0:
              begin
                CrearEncabezadoAPUS(excelAPUS, apusTratar.codigoApus, apusTratar.descripcion,
                  apusTratar.unidad);
              end;
            1:
              begin
                CrearEncabezadoAPUS_SERCOP(excelAPUS, apusTratar.codigoApus,
                  apusTratar.descripcion, apusTratar.unidad);
              end;
          end;
          CrearResumenAPUS(excelAPUS, apusTratar.costoDirectoTotal, apusTratar.porcentajeIndirecto,
            apusTratar.costoIndirecto, apusTratar.Total, apusTratar.moneda);
          crearCuerpoAPUS(excelAPUS, codigoApus, modelo, SSO, apusTratar.Total);
          if not DirectoryExists(carpetaGuardadoTemporal) then
            CreateDir(carpetaGuardadoTemporal);
          nombreExcelNewAPUS := carpetaGuardadoTemporal + apusTratar.codigoApus + '.xls';
          listadoAPUSConcatenar.Add(nombreExcelNewAPUS);
          excelAPUS.PrintToFit := True;
          excelAPUS.Save(nombreExcelNewAPUS);
          excelAPUS.free;
        end;
        SetLength(FileNames, listadoAPUSConcatenar.Count);
        for x := 0 to listadoAPUSConcatenar.Count - 1 do
        begin
          FileNames[x] := listadoAPUSConcatenar[x];
        end;
        excelPresupuesto := Consolidate(FileNames, False);
        excelPresupuesto.PrintToFit := True;
        excelPresupuesto.Save(nombreExcelTPresupuesto);
      end;
    end;
    reporteGenerado := True;
  end
  else
  begin
    reporteGenerado := False;
  end;
  LoadFile(nombreExcelTPresupuesto);
  estadoActions(reporteGenerado);
end;

procedure TfrmReportesPresupuestos.generaCuerpoPresupuesto(xls: TExcelFile);
var
  qry: TUniQuery;
  ArowInsercion: integer;
  nitemAnt: string;
  tmpstr: string;
  nitem, codItem, descripcion, unidad, cantidad, Punitario, total: string;
begin

  qry := TUniQuery.Create(nil);
  try
    with qry do
    begin
      Connection := DModule_1.con2;
      close;
      sql.Clear;
      sql.Add('select * from presupuestos_items where codPresupuesto=:codPresupuesto and codBase=:codBase ');
      ParamByName('codPresupuesto').AsString := codPresupuesto;
      ParamByName('codBase').AsString := base_activa.codBase;
      Prepare;
      ExecSQL;
      ArowInsercion := localizaArow(xls, '#item') - 1;
      while not Eof do
      begin
        Inc(ArowInsercion);
        nitem := FieldByName('codEdt').AsString;
        if nitem = '' then
          nitem := nitemAnt
        else
          nitemAnt := nitem;
        tmpstr := FieldByName('codItems').AsString;
        if tmpstr <> '' then
          nitem := nitem + '.' + tmpstr;
        codItem := FieldByName('codApuGenerico').AsString;
        descripcion := FieldByName('descripcion').AsString;
        unidad := FieldByName('unidad').AsString;
        cantidad := FieldByName('cantidad').AsString;
        cantidad := decimal_correcto(cantidad);
        Punitario := FieldByName('Punitario').AsString;
        Punitario := decimal_correcto(Punitario);
        total := FieldByName('Ptotal').AsString;
        total := decimal_correcto(total);
        creaLineaPresupuesto(xls, ArowInsercion, nitem, codItem, descripcion,
          unidad, cantidad, Punitario, total);
        Next;
      end;
      borraLineaPlantilla(xls, '#item');
    end;
  finally
    qry.free;
  end;
end;

function TfrmReportesPresupuestos.recibeDatosPresupuestos(codPresupuesto: string):
  dat_datosPresupuesto;
var
  qry: TUniQuery;
  fechaPresupuesto: Tdate;
  valTmp1, valTmp2: double;
begin
  qry := TUniQuery.Create(nil);
  try
    with qry do
    begin
      Connection := DModule_1.con2;
      close;
      sql.Clear;
      sql.Add('select * from Presupuestos_datosGenerales where codPresupuesto=:codPresupuesto and codBase='
        + QuotedStr(base_activa.codBase));
      ParamByName('codPresupuesto').AsString := codPresupuesto;
      Prepare;
      ExecSQL;
      First;
      Result.codigo := codPresupuesto;
      Result.Titulo := FieldByName('descripcion').AsString;
      fechaPresupuesto := FieldByName('fechaCreacion').Asfloat;
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
      SQL.Add('select * from presupuestos_DatosProyecto where codPresupuesto=:codPresupuesto and codBase='
        + QuotedStr(base_activa.codBase));
      ParamByName('codPresupuesto').AsString := codPresupuesto;
      Prepare;
      ExecSQL;
      if FieldByName('direccion').AsString <> '' then
        Result.Ubicacion := FieldByName('direccion').AsString + ' - ' +
          FieldByName('ciudad').AsString + ' - ' + FieldByName('Provincia').AsString
      else
        Result.Ubicacion := FieldByName('ciudad').AsString + ' - ' + FieldByName
          ('Provincia').AsString;
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

procedure TfrmReportesPresupuestos.GetPassword(const e: TOnPasswordEventArgs);
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

procedure TfrmReportesPresupuestos.lbSheetsChange(Sender: TObject);
begin
  if (lbSheets.Items.Count > xls.SheetCount) or (lbSheets.ItemIndex < 0) then
    exit;
  xls.ActiveSheet := lbSheets.ItemIndex + 1;
  MainPreview.InvalidatePreview();
end;

procedure TfrmReportesPresupuestos.LoadFile(const FileName: string);
var
  i: Integer;
begin
  PanelPdfOk.Visible := false;
  PanelPdfError.Visible := false;
  PanelPdf.Visible := false;
  PanelPrintingOk.Visible := false;
  PanelPrintingError.Visible := false;
  PanelPrinting.Visible := false;

  OpenDialog.FileName := FileName;
  lbSheets.Items.Clear;

  try
    xls.Open(FileName);
  except
    on ex: Exception do
    begin
      EnableCommonActions(false);
      ActionPrint.Enabled := false;
      ActionPdf.Enabled := false;
      ActionZoom.Enabled := false;
      ActionAutofit.Enabled := false;
      ActionOpen.Enabled := true;
      PanelSelectPage.Visible := false;
      xls.NewFile(1, TExcelFileFormat.v2019);
      Caption := 'Custom Preview';
      ShowMessage('Error opening file: ' + ex.Message);
      MainPreview.InvalidatePreview;
      exit;
    end;
  end;

  for i := 1 to xls.SheetCount do
  begin
    lbSheets.Items.Add(xls.GetSheetName(i));
  end;
  lbSheets.ItemIndex := xls.ActiveSheet - 1;

  EnableCommonActions(true);
  ActionPrint.Enabled := true;
  ActionPdf.Enabled := true;
  ActionZoom.Enabled := true;
  ActionAutofit.Enabled := true;
  Caption := 'Custom Preview: ' + OpenDialog.FileName;
  PanelSelectPage.Visible := true;
  MainPreview.InvalidatePreview;

end;

procedure TfrmReportesPresupuestos.MainPreviewStartPageChanged(Sender: TObject);
begin
  UpdatePages;
end;

procedure TfrmReportesPresupuestos.MainPreviewZoomChanged(Sender: TObject);
begin
  UpdateZoom;
end;

procedure TfrmReportesPresupuestos.NoAutofit1Click(Sender: TObject);
begin
  MainPreview.AutofitPreview := TAutofitPreview.None;
  UpdateAutofitText;
end;

procedure TfrmReportesPresupuestos.PanelZoomExit(Sender: TObject);
begin
  PanelZoom.Visible := false;
end;

procedure TfrmReportesPresupuestos.PanelZoomMouseLeave(Sender: TObject);
begin
  PanelZoom.Visible := false;
end;

procedure TfrmReportesPresupuestos.rect___1MouseDown(Sender: TObject; Button:
  TMouseButton; Shift: TShiftState; X, Y: Single);
begin
  Self.StartWindowDrag;
end;

procedure TfrmReportesPresupuestos.rect_AceptarClick(Sender: TObject);
begin
  ModalResult := mrOk;
end;

procedure TfrmReportesPresupuestos.TrackBarZoomChange(Sender: TObject);
begin
  if (ChangingZoom) then
    exit;
  MainPreview.Zoom := TrackBarZoom.Value / 100.0;
end;

procedure TfrmReportesPresupuestos.UpdateAutofitText;
begin
  case MainPreview.AutofitPreview of
    TAutofitPreview.None:
      ActionAutofit.Text := 'Sin Autoajuste';
    TAutofitPreview.Width:
      ActionAutofit.Text := 'Ajuste ancho';
    TAutofitPreview.Height:
      ActionAutofit.Text := 'Ajuste alto';
    TAutofitPreview.Full:
      ActionAutofit.Text := 'Ajuste a la página';
  end;
end;

procedure TfrmReportesPresupuestos.UpdatePages;
begin
  edPage.Text := IntToStr(MainPreview.StartPage);
  lblTotalPages.Text := 'de ' + IntToStr(MainPreview.TotalPages);
end;

procedure TfrmReportesPresupuestos.UpdateZoom;
begin
  ActionZoom.Text := IntToStr(Round(MainPreview.Zoom * 100)) + '%';
  if MainPreview.AutofitPreview = TAutofitPreview.None then
    UpdateAutofitText;
  ChangingZoom := true;
  try
    TrackBarZoom.Value := Round(MainPreview.Zoom * 100);
  finally
    ChangingZoom := false;
  end;
end;

end.

