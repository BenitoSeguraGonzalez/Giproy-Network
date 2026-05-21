unit uPDFViewer;

interface

uses
{$IFDEF MSWINDOWS}
  Winapi.ShellAPI, Winapi.Windows,
{$ENDIF MSWINDOWS}
{$IFDEF POSIX}
  Posix.Stdlib,
{$ENDIF POSIX}
  System.SysUtils, System.Types, System.UITypes, System.Classes, System.Variants, FMX.Types,
  FMX.Controls, FMX.Forms, FMX.Graphics, FMX.Dialogs, FMX.Menus, FMX.Effects,
  FMX.Controls.Presentation, FMX.StdCtrls, FMX.Objects, FMX.Layouts, FMX.TreeView, FMX.Edit,
  FMX.ListBox, Winsoft.FireMonkey.PDFium, FMX.Printer, FMX.Platform, FMX.BehaviorManager;

type
  TfrmPDFViewer = class(TForm)
    lyt_Body: TLayout;
    rct__2: TRectangle;
    lyt_3: TLayout;
    rct__3: TRectangle;
    lyt_6: TLayout;
    rct__4: TRectangle;
    lyt_DatosGenerales: TLayout;
    lyt_13: TLayout;
    lyt_7: TLayout;
    lbl_descripcion: TLabel;
    lyt1: TLayout;
    lyt_footer: TLayout;
    rct__Cancelar: TRectangle;
    iGlow_Cancelar: TInnerGlowEffect;
    rct__Aceptar: TRectangle;
    iGlow_Aceptar: TInnerGlowEffect;
    lbl_adicional: TLabel;
    lbl_paquete: TLabel;
    lyt_header: TLayout;
    rct__1: TRectangle;
    lbl_banner1: TLabel;
    pm_ReporteDatosImprimir: TPopupMenu;
    MenuItem1: TMenuItem;
    MenuItem2: TMenuItem;
    MenuItem3: TMenuItem;
    FPdf: TFPdf;
    OpenDialog: TOpenDialog;
    PrintDialog: TPrintDialog;
    SaveDialog: TSaveDialog;
    dlgSaveSavePictureDialog: TSaveDialog;
    ScrollBox: TScrollBox;
    FPdfView: TFPdfView;
    Splitter: TSplitter;
    ToolBar: TToolBar;
    ToolBarButtons: TToolBar;
    SpeedButtonPrint: TSpeedButton;
    imgPrint: TImage;
    ln1: TLine;
    SpeedButtonLastPage: TSpeedButton;
    imgLastPage: TImage;
    SpeedButtonNextPage: TSpeedButton;
    imgNextPage: TImage;
    SpeedButtonFirstPage: TSpeedButton;
    imgFirstPage: TImage;
    SpeedButtonPreviousPage: TSpeedButton;
    imgPreviousPage: TImage;
    SpeedButtonPageNumber: TSpeedButton;
    ln2: TLine;
    SpeedButtonZoomOut: TSpeedButton;
    imgZoomOut: TImage;
    SpeedButtonZoomIn: TSpeedButton;
    imgZoomIn: TImage;
    ComboBoxZoom: TComboBox;
    ln3: TLine;
    ToolBarCancel: TToolBar;
    ProgressBar: TProgressBar;
    ButtonCancel: TButton;
    TreeViewBookmarks: TTreeView;
    procedure SpeedButtonPrintClick(Sender: TObject);
    procedure SpeedButtonFirstPageClick(Sender: TObject);
    procedure SpeedButtonPreviousPageClick(Sender: TObject);
    procedure SpeedButtonPageNumberClick(Sender: TObject);
    procedure SpeedButtonNextPageClick(Sender: TObject);
    procedure SpeedButtonLastPageClick(Sender: TObject);
    procedure SpeedButtonZoomOutClick(Sender: TObject);
    procedure SpeedButtonZoomInClick(Sender: TObject);
    procedure ComboBoxZoomChange(Sender: TObject);
    procedure FormCreate(Sender: TObject);
    procedure FPdfViewMouseDown(Sender: TObject; Button: TMouseButton; Shift: TShiftState; X, Y: Single);
    procedure FPdfViewMouseMove(Sender: TObject; Shift: TShiftState; X, Y: Single);
    procedure FPdfViewMouseUp(Sender: TObject; Button: TMouseButton; Shift: TShiftState; X, Y: Single);
    procedure FPdfViewPageChange(Sender: TObject);
    procedure rct__AceptarClick(Sender: TObject);
    procedure lbl_banner1MouseDown(Sender: TObject; Button: TMouseButton; Shift: TShiftState; X, Y: Single);
    procedure FormActivate(Sender: TObject);
  private
                { Private declarations }
    Selecting: Boolean;
    SelectionStart: Integer;
    SelectionEnd: Integer;
    Cancel: Boolean;
    DisableBookmarks: Boolean;
    SearchStart: Integer;
    SearchEnd: Integer;
    PixelsPerInch: Double;
    procedure AddChildBookmarks(BookmarkNode: TTreeViewItem; const Bookmark: TBookmark);
    procedure Zoom;
  public
                { Public declarations }
    modo: string;
    procedure abrirDocumento(archivo: string);
  end;

var
  frmPDFViewer: TfrmPDFViewer;

implementation

{$R *.fmx}
{ TfrmPDFViewer }

uses
  DM1;

procedure TfrmPDFViewer.abrirDocumento(archivo: string);
var
  Bookmarks: TBookmarks;
  I: Integer;
  Node: TTreeViewItem;
  Password: string;
begin
  Bookmarks := nil;
  if FileExists(archivo) then
  begin
    Selecting := False;
    SelectionStart := -1;
    SelectionEnd := -1;

    SpeedButtonPrint.Enabled := False;
    SpeedButtonFirstPage.Enabled := False;
    SpeedButtonPreviousPage.Enabled := False;
    SpeedButtonPageNumber.Enabled := False;
    SpeedButtonPageNumber.Text := '';
    SpeedButtonNextPage.Enabled := False;
    SpeedButtonLastPage.Enabled := False;
    SpeedButtonZoomOut.Enabled := False;
    SpeedButtonZoomIn.Enabled := False;
    ComboBoxZoom.Enabled := False;

    TreeViewBookmarks.Visible := False;
    Splitter.Visible := False;
    FPdfView.Enabled := False;
    FPdf.Active := False;
    FPdf.FileName := archivo;
    FPdf.Password := '';
    FPdf.PageNumber := 0;
    FPdfView.PageNumber := 1;
    FPdf.Active := True;
    try
      FPdfView.Active := True;
      FPdfView.Enabled := True;
    except
      on Error: EPdfError do
        if Error.Message = 'Password required or incorrect password' then
        begin
          if not InputQuery('Enter Password', 'Password: ', Password) then
            raise;
          FPdf.Password := Password;
          FPdfView.Active := True;
          FPdfView.Enabled := True;
        end
        else
          raise;
    end;

    Bookmarks := FPdf.Bookmarks;
    TreeViewBookmarks.BeginUpdate;
    try
      TreeViewBookmarks.Clear;
      for I := 0 to Length(Bookmarks) - 1 do
      begin
        Node := TTreeViewItem.Create(TreeViewBookmarks);
        Node.Text := Bookmarks[I].Title;
        Node.Tag := Bookmarks[I].PageNumber;
        TreeViewBookmarks.AddObject(Node);
        AddChildBookmarks(Node, Bookmarks[I]);
      end;

      if TreeViewBookmarks.Count > 0 then
      begin
        Splitter.Visible := True;
        TreeViewBookmarks.Visible := True;
      end;
    finally
      TreeViewBookmarks.EndUpdate;
    end;

    ScrollBox.ScrollBy(MaxInt, MaxInt);
  end
  else
  begin
    ModalResult := mrOk;
  end;

end;

procedure TfrmPDFViewer.AddChildBookmarks(BookmarkNode: TTreeViewItem; const Bookmark: TBookmark);
var
  Bookmarks: TBookmarks;
  I: Integer;
  Node: TTreeViewItem;
begin
  Bookmarks := FPdf.BookmarkChildren[Bookmark];
  for I := 0 to Length(Bookmarks) - 1 do
  begin
    Node := TTreeViewItem.Create(BookmarkNode);
    Node.Text := Bookmarks[I].Title;
    Node.Tag := Bookmarks[I].PageNumber;
    BookmarkNode.AddObject(Node);
    AddChildBookmarks(Node, Bookmarks[I]);
  end;
end;

procedure TfrmPDFViewer.ComboBoxZoomChange(Sender: TObject);
begin
  Zoom;
  ScrollBox.ScrollBy(MaxInt, MaxInt);
end;

procedure TfrmPDFViewer.FormActivate(Sender: TObject);
var
  documento: string;
begin
  if modo = 'TerminoyCondiciones' then
  begin
    documento := rutaApp + 'Plantillas\Terminos y Condiciones\TerminoyCondiciones.pdf';
    abrirDocumento(documento);
  end;
end;

procedure TfrmPDFViewer.FormCreate(Sender: TObject);
var
  DeviceBehavior: IDeviceBehavior;
begin
  PixelsPerInch := 96;
  if TBehaviorServices.Current.SupportsBehaviorService(IDeviceBehavior, DeviceBehavior, Self) then
    PixelsPerInch := DeviceBehavior.GetDisplayMetrics(Self).PixelsPerInch;

  TreeViewBookmarks.Visible := False;
  Splitter.Visible := False;

end;

procedure TfrmPDFViewer.FPdfViewMouseDown(Sender: TObject; Button: TMouseButton; Shift: TShiftState;
  X, Y: Single);
const
  Tolerance = 2.0;
var
  LinkIndex: Integer;
begin
  LinkIndex := FPdfView.WebLinkAtPos(Round(X), Round(Y));
  if LinkIndex <> -1 then
  begin
    OSExecute(FPdfView.WebLink[LinkIndex].Url);
    Exit;
  end;

  LinkIndex := FPdfView.LinkAnnotationAtPos(Round(X), Round(Y));
  if LinkIndex <> -1 then
  begin
    with FPdfView.LinkAnnotation[LinkIndex] do
      case Action of
        acGotoRemote, acLaunch, acUri:
          OSExecute(ActionPath);
      else
        if (PageNumber >= 1) and (PageNumber <= FPdfView.PageCount) then
          FPdfView.PageNumber := PageNumber;
      end;

    Exit;
  end;

  if ssDouble in Shift then
  begin
                // select current word
    SelectionStart := FPdfView.CharacterIndexAtPos(Round(X), Round(Y), Tolerance, Tolerance);
    SelectionEnd := SelectionStart;
    if SelectionStart >= 0 then
    begin
      while (SelectionStart > 0) and IsAlphaNumeric(FPdfView.Character[SelectionStart - 1]) do
        Dec(SelectionStart);

      while (SelectionEnd < FPdfView.CharacterCount - 1) and IsAlphaNumeric(FPdfView.Character[SelectionEnd
        + 1]) do
        Inc(SelectionEnd);

      FPdfView.Repaint;
    end;
  end
  else
  begin
    Selecting := True;
    SelectionStart := -1;
    SelectionEnd := -1;
  end;

end;

procedure TfrmPDFViewer.FPdfViewMouseMove(Sender: TObject; Shift: TShiftState; X, Y: Single);
const
  Tolerance = 2.0;
var
  SelectedIndex: Integer;
  NeedRepaint: Boolean;
begin
  SelectedIndex := FPdfView.CharacterIndexAtPos(Round(X), Round(Y), Tolerance, Tolerance);
  if (not Selecting) and (FPdfView.WebLinkAtPos(Round(X), Round(Y)) <> -1) then
    FPdfView.Cursor := crHandPoint
  else if (not Selecting) and (FPdfView.LinkAnnotationAtPos(Round(X), Round(Y)) <> -1) then
    FPdfView.Cursor := crHandPoint
  else if SelectedIndex >= 0 then
    FPdfView.Cursor := crIBeam
  else
    FPdfView.Cursor := crDefault;

  if Selecting then
    if SelectedIndex >= 0 then
    begin
      NeedRepaint := False;

      if SelectionStart = -1 then
      begin
        SelectionStart := SelectedIndex;
        NeedRepaint := True;
      end;

      if SelectionEnd <> SelectedIndex then
      begin
        SelectionEnd := SelectedIndex;
        NeedRepaint := True;
      end;

      if NeedRepaint then
        FPdfView.Repaint;
    end;
end;

procedure TfrmPDFViewer.FPdfViewMouseUp(Sender: TObject; Button: TMouseButton; Shift: TShiftState; X,
  Y: Single);
var
  Text: string;
  Clipboard: IFMXClipboardService;
begin
  if Selecting then
  begin
    Selecting := False;
    if (SelectionStart >= 0) and (SelectionEnd >= 0) then
    begin
      if SelectionEnd < SelectionStart then
        Text := FPdfView.Text(SelectionEnd, SelectionStart - SelectionEnd + 1)
      else
        Text := FPdfView.Text(SelectionStart, SelectionEnd - SelectionStart + 1);

      if TPlatformServices.Current.SupportsPlatformService(IFMXClipboardService, IInterface(Clipboard)) then
        Clipboard.SetClipboard(Text);
    end;
  end;
end;

function FindBookmark(Item: TTreeViewItem; PageNumber: Integer): TTreeViewItem; overload;
var
  I: Integer;
begin
  Result := nil;
  if Item.Tag >= PageNumber then
    Result := Item
  else
    for I := 0 to Item.Count - 1 do
    begin
      Result := FindBookmark(Item.Items[I], PageNumber);
      if Result <> nil then
        Exit;
    end;
end;

function PreviousItem(ParentItem: TTreeViewItem; Item: TTreeViewItem): TTreeViewItem; overload;
var
  I: Integer;
begin
  Result := Item;
  for I := 0 to ParentItem.Count - 1 do
    if ParentItem.Items[I] = Item then
    begin
      if I = 0 then
        Result := ParentItem
      else
      begin
        Result := ParentItem.Items[I - 1];
        while Result.Count > 0 do
          Result := Result.Items[Result.Count - 1];
      end;
      Break;
    end;
end;

function PreviousItem(Parent: TTreeView; Item: TTreeViewItem): TTreeViewItem; overload;
var
  I: Integer;
begin
  Result := Item;
  for I := 0 to Parent.Count - 1 do
    if Parent.Items[I] = Item then
    begin
      if I > 0 then
      begin
        Result := Parent.Items[I - 1];
        while Result.Count > 0 do
          Result := Result.Items[Result.Count - 1];
      end;
      Break;
    end;
end;

function FindBookmark(TreeView: TTreeView; PageNumber: Integer): TTreeViewItem; overload;
var
  I: Integer;
begin
  Result := nil;
  for I := 0 to TreeView.Count - 1 do
  begin
    Result := FindBookmark(TreeView.Items[I], PageNumber);
    if Result <> nil then
      Break;
  end;

  if Result <> nil then
    if Result.Tag > PageNumber then
      if Result.ParentItem <> nil then
        Result := PreviousItem(Result.ParentItem, Result)
      else
        Result := PreviousItem(TreeView, Result);
end;

procedure TfrmPDFViewer.FPdfViewPageChange(Sender: TObject);
var
  Node: TTreeViewItem;
begin
  if FPdfView.Active then
  begin
    SpeedButtonPrint.Enabled := True;
    SpeedButtonFirstPage.Enabled := FPdfView.PageNumber > 1;
    SpeedButtonPreviousPage.Enabled := FPdfView.PageNumber > 1;
    SpeedButtonPageNumber.Enabled := FPdfView.PageCount > 1;
    SpeedButtonPageNumber.Text := IntToStr(FPdfView.PageNumber) + ' of ' + IntToStr(FPdfView.PageCount);
    SpeedButtonNextPage.Enabled := FPdfView.PageNumber < FPdfView.PageCount;
    SpeedButtonLastPage.Enabled := FPdfView.PageNumber < FPdfView.PageCount;
    SpeedButtonZoomOut.Enabled := True;
    SpeedButtonZoomIn.Enabled := True;
    ComboBoxZoom.Enabled := True;
  end
  else
  begin
    SpeedButtonPrint.Enabled := False;
    SpeedButtonFirstPage.Enabled := False;
    SpeedButtonPreviousPage.Enabled := False;
    SpeedButtonPageNumber.Enabled := False;
    SpeedButtonPageNumber.Text := '';
    SpeedButtonNextPage.Enabled := False;
    SpeedButtonLastPage.Enabled := False;
    SpeedButtonZoomOut.Enabled := False;
    SpeedButtonZoomIn.Enabled := False;
    ComboBoxZoom.Enabled := False;
  end;

  Selecting := False;
  SelectionStart := -1;
  SelectionEnd := -1;

  SearchStart := -1;
  SearchEnd := -1;

  Zoom;
  FPdfView.Repaint;

        // update bookmark
  if not DisableBookmarks then
  begin
    Node := FindBookmark(TreeViewBookmarks, FPdfView.PageNumber);
    if Node <> nil then
      TreeViewBookmarks.Selected := Node
    else
      TreeViewBookmarks.Selected := nil;
  end;

end;

procedure TfrmPDFViewer.lbl_banner1MouseDown(Sender: TObject; Button: TMouseButton; Shift:
  TShiftState; X, Y: Single);
begin
  Self.StartWindowDrag;
end;

procedure TfrmPDFViewer.rct__AceptarClick(Sender: TObject);
begin
  ModalResult := mrOk;
end;

procedure TfrmPDFViewer.SpeedButtonFirstPageClick(Sender: TObject);
begin
  FPdfView.PageNumber := 1;
end;

procedure TfrmPDFViewer.SpeedButtonLastPageClick(Sender: TObject);
begin
  FPdfView.PageNumber := FPdfView.PageCount;
end;

procedure TfrmPDFViewer.SpeedButtonNextPageClick(Sender: TObject);
begin
  FPdfView.PageNumber := FPdfView.PageNumber + 1;
end;

procedure TfrmPDFViewer.SpeedButtonPageNumberClick(Sender: TObject);
var
  PageNumber: string;
  NewPageNumber: Integer;
begin
  PageNumber := IntToStr(FPdfView.PageNumber);
  if InputQuery('Seleciona Página', 'Numero de Página: ', PageNumber) then
  begin
    NewPageNumber := StrToIntDef(PageNumber, FPdfView.PageNumber);
    if (NewPageNumber >= 1) and (NewPageNumber <= FPdfView.PageCount) then
      FPdfView.PageNumber := NewPageNumber;
  end;
end;

procedure TfrmPDFViewer.SpeedButtonPreviousPageClick(Sender: TObject);
begin
  FPdfView.PageNumber := FPdfView.PageNumber - 1;
end;

procedure TfrmPDFViewer.SpeedButtonPrintClick(Sender: TObject);
var
  FromPage, ToPage, Page, Copy, CopyCount, CollateCopy, CollateCopyCount: Integer;
  FirstPage: Boolean;
  Bitmap: TBitmap;
  R: TRectF;
begin
  if FPdfView.Rotation in [ro0, ro180] then
    Printer.Orientation := TPrinterOrientation.poPortrait
  else
    Printer.Orientation := TPrinterOrientation.poLandscape;

  PrintDialog.MinPage := 1;
  PrintDialog.MaxPage := FPdf.PageCount;
  PrintDialog.Options := [TPrintDialogOption.poPageNums];
  PrintDialog.FromPage := FPdfView.PageNumber;
  PrintDialog.ToPage := FPdfView.PageNumber;
  PrintDialog.PrintRange := TPrintRange.prPageNums;
  PrintDialog.Copies := 1;

  if PrintDialog.Execute then
  begin
    if PrintDialog.PrintRange = TPrintRange.prPageNums then
    begin
      FromPage := PrintDialog.FromPage;
      ToPage := PrintDialog.ToPage;
    end
    else
    begin
      FromPage := 1;
      ToPage := FPdf.PageCount;
    end;

    if PrintDialog.Collate then
    begin
      CollateCopyCount := PrintDialog.Copies;
      CopyCount := 1;
    end
    else
    begin
      CollateCopyCount := 1;
      CopyCount := PrintDialog.Copies;
    end;

    if FPdf.Title <> '' then
      Printer.Title := FPdf.Title
    else
      Printer.Title := Caption;

    FirstPage := True;
    Printer.BeginDoc;
    try
      Cancel := False;
      ProgressBar.Max := (ToPage - FromPage + 1) * PrintDialog.Copies;
      ProgressBar.Value := 0;
      ToolBarButtons.Visible := False;
      ToolBarCancel.Visible := True;

      for CollateCopy := 1 to CollateCopyCount do
        for Page := FromPage to ToPage do
          for Copy := 1 to CopyCount do
          begin
            if FirstPage then
              FirstPage := False
            else
              Printer.NewPage;

            ProgressBar.Value := ProgressBar.Value + 1;

            FPdf.PageNumber := Page;

            Bitmap := FPdfView.RenderPage(0, 0, Printer.PageWidth, Printer.PageHeight, FPdfView.Rotation,
              [rePrinting]);
            try
              R := TRectF.Create(0, 0, Printer.PageWidth, Printer.PageHeight);
              Printer.Canvas.BeginScene;
              try
                Printer.Canvas.DrawBitmap(Bitmap, R, R, 1.0, True);
              finally
                Printer.Canvas.EndScene;
              end;
            finally
              Bitmap.Free;
            end;

            Application.ProcessMessages;
            if Cancel then
            begin
              CollateCopyCount := 0;
              ToPage := 0;
              CopyCount := 0;
            end;
          end;
    finally
      ToolBarCancel.Visible := False;
      ToolBarButtons.Visible := True;
      Printer.EndDoc;
    end;
  end;

end;

procedure TfrmPDFViewer.SpeedButtonZoomInClick(Sender: TObject);
begin
  ComboBoxZoom.ItemIndex := ComboBoxZoom.ItemIndex + 1;
  Zoom;
end;

procedure TfrmPDFViewer.SpeedButtonZoomOutClick(Sender: TObject);
begin
  ComboBoxZoom.ItemIndex := ComboBoxZoom.ItemIndex - 1;
  Zoom;
end;

procedure TfrmPDFViewer.Zoom;
var
  PdfPageWidth, PdfPageHeight: Double;
  Zoom: Double;
begin
  if FPdfView.Active then
  begin
    if FPdfView.Rotation in [ro0, ro180] then
    begin
      PdfPageWidth := FPdfView.PageWidth;
      PdfPageHeight := FPdfView.PageHeight;
    end
    else
    begin
      PdfPageWidth := FPdfView.PageHeight;
      PdfPageHeight := FPdfView.PageWidth;
    end;

    case ComboBoxZoom.ItemIndex of
      0:
        Zoom := 0.1;
      1:
        Zoom := 0.25;
      2:
        Zoom := 0.5;
      3:
        Zoom := 0.75;
      5:
        Zoom := 1.25;
      6:
        Zoom := 1.5;
      7:
        Zoom := 2.0;
      8:
        Zoom := 4.0;
      10: // Zoom to page
        if ScrollBox.Width / PdfPageWidth > ScrollBox.Height / PdfPageHeight then
          Zoom := ScrollBox.Height / PointsToPixels(PdfPageHeight, PixelsPerInch) // zoom to height
        else
          Zoom := ScrollBox.Width / PointsToPixels(PdfPageWidth, PixelsPerInch);
                        // zoom to width

      11:
        Zoom := (ScrollBox.Width - 24) / PointsToPixels(PdfPageWidth, PixelsPerInch);
                                // page width
    else
      Zoom := 1.0;
    end;

                // set size
    FPdfView.Size.Size := TSizeF.Create(PointsToPixels(Zoom * PdfPageWidth, PixelsPerInch),
      PointsToPixels(Zoom * PdfPageHeight, PixelsPerInch));

                // update zoom buttons visibility
    SpeedButtonZoomOut.Enabled := (ComboBoxZoom.ItemIndex > 0) and (ComboBoxZoom.ItemIndex < 9);
    SpeedButtonZoomIn.Enabled := ComboBoxZoom.ItemIndex < 8;
  end;
end;

end.

