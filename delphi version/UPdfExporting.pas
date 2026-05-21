unit UPdfExporting;

interface

uses
  UProgressThread, SysUtils, FlexCel.Core, FlexCel.Render, FlexCel.Pdf,
  Classes, IOUtils,UPdfToImageConverter;

type
  TPdfThread = class(TProgressThread)
  private
    FUseWatermarkProtection: Boolean;
    FUserInfo: string;
    procedure ShowProgress(const sender: TObject; const e: TPageEventArgs);
  protected
    procedure Execute; override;
  public
    property UseWatermarkProtection: Boolean read FUseWatermarkProtection write FUseWatermarkProtection;
    property UserInfo: string read FUserInfo write FUserInfo;
  end;

function GetPdfUseWatermark: Boolean;
procedure SetPdfUseWatermark(Value: Boolean);
procedure SetPdfUserInfo(const AUserInfo: string);

implementation

uses
  System.Types; // Para TPointF y otros tipos

var
  UseWatermarkForCurrentJob: Boolean = False;
  CurrentUserInfo: string = '';

function GetPdfUseWatermark: Boolean;
begin
  Result := UseWatermarkForCurrentJob;
end;

procedure SetPdfUseWatermark(Value: Boolean);
begin
  UseWatermarkForCurrentJob := Value;
end;

procedure SetPdfUserInfo(const AUserInfo: string);
begin
  CurrentUserInfo := AUserInfo;
end;

{ TPdfThread }
procedure TPdfThread.Execute;
var
  pdf: TFlexCelPdfExport;
  fs: TFileStream;
  TempPdfPath, FinalPdfPath: string;
  PdfConverter: TPdfToImageConverter;
begin
  // Leer flags globales configurados vía SetPdfUseWatermark / SetPdfUserInfo
  FUseWatermarkProtection := UseWatermarkForCurrentJob;
  FUserInfo                := CurrentUserInfo;

  // --- Caso con protección (PDF -> imágenes -> PDF con marca de agua) ---
  if FUseWatermarkProtection then
  begin
    TempPdfPath := ChangeFileExt(FileName, '_temp.pdf');
    FinalPdfPath := FileName;

    // 1. Generar PDF normal con FlexCel en un archivo temporal
    pdf := TFlexCelPdfExport.Create(Xls, True);
    try
      pdf.AfterGeneratePage := ShowProgress;

      if AllSheets then
      begin
        fs := TFileStream.Create(TempPdfPath, fmCreate);
        try
          pdf.BeginExport(fs);
          pdf.PageLayout := TPageLayout.Outlines;
          pdf.ExportAllVisibleSheets(False,
                                     TPath.GetFileNameWithoutExtension(TempPdfPath));
          pdf.EndExport;
        finally
          fs.Free;
        end;
      end
      else
      begin
        pdf.Export(TempPdfPath);
      end;
    finally
      pdf.Free;
    end;

    // 2. Convertir PDF temporal a PDF de imágenes con marca de agua usando PDFium
    PdfConverter := TPdfToImageConverter.Create;
    try
      PdfConverter.SetWatermarkText('CONFIDENCIAL - ' + FUserInfo);
      PdfConverter.SetUserInfo(FUserInfo);
      PdfConverter.SetWatermarkPositions([wpDiagonal, wpCorners]);

      if Assigned(ProgressFeedback) then
        ProgressFeedback(50, 'Aplicando marcas de agua...');

      if PdfConverter.ConvertPdfToProtectedPdf(TempPdfPath, FinalPdfPath) then
      begin
        // Éxito: borramos el PDF temporal
        if FileExists(TempPdfPath) then
          DeleteFile(TempPdfPath);

        if Assigned(ProgressFeedback) then
          ProgressFeedback(100, 'PDF protegido generado correctamente');
      end
      else
      begin
        // Fallback: dejamos el PDF original sin convertir
        if FileExists(TempPdfPath) then
        begin
          TFile.Copy(TempPdfPath, FinalPdfPath, True);
          DeleteFile(TempPdfPath);
        end;
      end;
    finally
      PdfConverter.Free;
    end;
  end
  else
  begin
    // --- Caso sin protección: FlexCel exporta directamente ---
    pdf := TFlexCelPdfExport.Create(Xls, True);
    try
      pdf.AfterGeneratePage := ShowProgress;

      if AllSheets then
      begin
        fs := TFileStream.Create(FileName, fmCreate);
        try
          pdf.BeginExport(fs);
          pdf.PageLayout := TPageLayout.Outlines;
          pdf.ExportAllVisibleSheets(False,
                                     TPath.GetFileNameWithoutExtension(FileName));
          pdf.EndExport;
        finally
          fs.Free;
        end;
      end
      else
      begin
        pdf.Export(FileName);
      end;
    finally
      pdf.Free;
    end;
  end;
end;


procedure TPdfThread.ShowProgress(const sender: TObject; const e: TPageEventArgs);
var
  Prog: TFlexCelPdfExportProgress;
  Percent: Integer;
  Msg: string;
begin
  Prog := (sender as TFlexCelPdfExport).Progress;
  if (Prog.TotalPage = 0) then
    Percent := 100
  else
    Percent := Round(Prog.Page * 100.0 / Prog.TotalPage);

  Msg := 'Page ' + IntToStr(Prog.Page) + ' of ' + IntToStr(Prog.TotalPage);

  // Usar el callback de progreso
  if Assigned(ProgressFeedback) then
    ProgressFeedback(Percent, Msg);
end;

end.
