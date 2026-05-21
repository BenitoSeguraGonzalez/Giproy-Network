unit uReportesAPU;

interface

uses
  System.SysUtils, System.Types, System.UITypes, System.Classes,
  System.Variants,
  FMX.Types, FMX.Controls, FMX.Forms, FMX.Graphics, FMX.Dialogs, FMX.Effects,
  FMX.Controls.Presentation, FMX.StdCtrls, FMX.Objects, FMX.Layouts, uni,
  FMX.TMSFNCTypes,
  FMX.TMSFNCUtils, FMX.TMSFNCGraphics, FMX.TMSFNCGraphicsTypes,
  FMX.TMSFNCGridCell,
  FMX.TMSFNCGridOptions, FMX.TMSFNCCustomControl, FMX.TMSFNCCustomScrollControl,
  IOUtils,
  FMX.TMSFNCGridData, FMX.TMSFNCCustomGrid, FMX.TMSFNCGrid,
  FMX.TMSFNCCustomPicker,
  fmx.DialogService, Winapi.Windows, Winapi.ShellAPI, FlexCel.Core,
  FlexCel.XlsAdapter,
  FlexCel.FMXSupport, FMX.TMSFNCComboBox;

type
  TfrmReportesAPU = class(TForm)
    lyt_Body: TLayout;
    rect___2: TRectangle;
    lyt_3: TLayout;
    rect___3: TRectangle;
    lyt_6: TLayout;
    rect___4: TRectangle;
    lyt_7: TLayout;
    lbl_descripcion: TLabel;
    lyt_footer: TLayout;
    rect___Cancelar: TRectangle;
    iGlow_Cancelar: TInnerGlowEffect;
    rect_Aceptar: TRectangle;
    iGlow_Aceptar: TInnerGlowEffect;
    lbl_adicional: TLabel;
    lbl_paquete: TLabel;
    lyt_header: TLayout;
    rect___1: TRectangle;
    lbl_banner1: TLabel;
    lyt_lyt1: TLayout;
    grid_ReportesAPUS: TTMSFNCGrid;
    lbl_1: TLabel;
    lyt_1: TLayout;
    rect_ExcelExport: TRectangle;
    Shadow_excelexport: TShadowEffect;
    tmr1: TTimer;
    lbl_PlantillaExcelAPU: TLabel;
    procedure FormShow(Sender: TObject);
    procedure rect_ExcelExportClick(Sender: TObject);
    procedure tmr1Timer(Sender: TObject);
    procedure rect___1MouseDown(Sender: TObject; Button: TMouseButton; Shift:
      TShiftState; X, Y: Single);
    procedure rect_AceptarClick(Sender: TObject);
  private
    { Private declarations }
    procedure CrearExcel();
  public
    { Public declarations }
    excelAPUS: TExcelFile;
    procedure cargaPlantillasAPUS();
  end;

var
  frmReportesAPU: TfrmReportesAPU;

implementation

{$R *.fmx}

uses
  DM1, PlantillasExcel, uMain, DMSeguridad, uVisoreReportes;

procedure TfrmReportesAPU.cargaPlantillasAPUS;
var
  nombrePlantilla: string;
begin
  nombrePlantilla :=
    frmMain.cbb_cfgAnalisisPrecios.Items[frmMain.cbb_cfgAnalisisPrecios.ItemIndex];
  if nombrePlantilla <> '' then
    lbl_PlantillaExcelAPU.Text := nombrePlantilla
  else
  begin
    ShowMessage('Seleccione plantilla en configuración.');
  end;
end;

procedure TfrmReportesAPU.CrearExcel;
var
  RutaPlantilla: string;
  FileNames: TArray<string>;
  modelo: Integer;
  x: integer;
  codigoApus: string;
  apusTratar: dat_localRespApus;

  carpetaGuardadoTemporal: string;
  nombreExcelTAPUS: string;
  SaveDialog: TSaveDialog;
begin
  carpetaGuardadoTemporal := rutaApp + FormatDateTime('yyyymmddhhnnss', Now) +
    '\';
  RutaPlantilla := danombrePlantilla(lbl_PlantillaExcelAPU.Text);
  RutaPlantilla := descomprimeArchivoZIP2excel(RutaPlantilla,
    carpetaGuardadoTemporal);
  RutaPlantilla := desencriptafichero(RutaPlantilla);
  if RutaPlantilla <> '' then
  begin
    frmVisorReportes.SSO := false; // Seguridad Industrial no se tiene en cuenta
    frmVisorReportes.listadoApusReporteAnalisis := TStringList.Create;
    for x := 1 to grid_ReportesAPUS.RowCount - 1 do
    begin
      codigoApus := grid_ReportesAPUS.Cells[3, x];
      frmVisorReportes.listadoApusReporteAnalisis.Add(codigoApus);
    end;
    frmVisorReportes.carpetaGuardadoTemporal := carpetaGuardadoTemporal;
    frmVisorReportes.modo := 2;
    frmVisorReportes.XLSPlantilla := RutaPlantilla;
    frmVisorReportes.chk_ConsolidarReporte.IsChecked := true;
    frmVisorReportes.chk_ConsolidarReporte.Enabled := False;
    frmVisorReportes.ShowModal;
    frmVisorReportes.btn_ActionGenerate.OnClick(frmVisorReportes.btn_ActionGenerate);
  end;
end;

procedure TfrmReportesAPU.FormShow(Sender: TObject);
begin
  cargaPlantillasAPUS;
end;

procedure TfrmReportesAPU.rect_ExcelExportClick(Sender: TObject);
begin
  Shadow_excelexport.Enabled := True;
  tmr1.Enabled := true;
end;

procedure TfrmReportesAPU.rect___1MouseDown(Sender: TObject; Button:
  TMouseButton; Shift:
  TShiftState; X, Y: Single);
begin
  Self.StartWindowDrag;
end;

procedure TfrmReportesAPU.rect_AceptarClick(Sender: TObject);
begin
  ModalResult := mrOk;
end;

procedure TfrmReportesAPU.tmr1Timer(Sender: TObject);
begin
  tmr1.Enabled := False;
  Shadow_excelexport.Enabled := false;
  CrearExcel;
end;

end.

