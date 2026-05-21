unit uReporteDatosProyecto;

interface

uses
  System.SysUtils, System.Types, System.UITypes, System.Classes,
  System.Variants,
  FMX.Types, FMX.Controls, FMX.Forms, FMX.Graphics, FMX.Dialogs,
  FMX.Controls.Presentation, FMX.StdCtrls, FMX.Objects, FMX.Layouts,
  FMX.Effects,
  FMX.MultiView, FMX.Menus;

type
  TfrmReporteDatosProyecto = class(TForm)
    lyt_header: TLayout;
    rct__1: TRectangle;
    lbl_banner1: TLabel;
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
    lyt_footer: TLayout;
    rct__Cancelar: TRectangle;
    iGlow_Cancelar: TInnerGlowEffect;
    rct__Aceptar: TRectangle;
    iGlow_Aceptar: TInnerGlowEffect;
    lbl_adicional: TLabel;
    lbl_paquete: TLabel;
    lyt1: TLayout;
    rct_Print: TRectangle;
    rct_Export: TRectangle;
    pm_ReporteDatosImprimir: TPopupMenu;
    MenuItem1: TMenuItem;
    MenuItem2: TMenuItem;
    MenuItem3: TMenuItem;
    procedure rct__AceptarMouseUp(Sender: TObject; Button: TMouseButton;
      Shift: TShiftState; X, Y: Single);
    procedure rct_ExportClick(Sender: TObject);
  private
    { Private declarations }
  public
    { Public declarations }
  end;

var
  frmReporteDatosProyecto: TfrmReporteDatosProyecto;

implementation

{$R *.fmx}

uses
  DM1, uMain;

procedure TfrmReporteDatosProyecto.rct_ExportClick(Sender: TObject);
var
  h: Single;
  pt: TPointF;
begin
  h := rct_Export.Height;
  pt := rct_Export.LocalToAbsolute(PointF(0, h));
  pt := Self.ClientToScreen(pt);
  rct_Export.PopupMenu.Popup(pt.X, pt.Y);
end;

procedure TfrmReporteDatosProyecto.rct__AceptarMouseUp(Sender: TObject;
  Button: TMouseButton; Shift: TShiftState; X, Y: Single);
begin
  modalresult := mrok;
end;

end.
