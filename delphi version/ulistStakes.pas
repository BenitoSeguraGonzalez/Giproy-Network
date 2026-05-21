unit ulistStakes;

interface

uses
  System.SysUtils, System.Types, System.UITypes, System.Classes, System.Variants, FMX.Types,
  FMX.Controls, FMX.Forms, FMX.Graphics, FMX.Dialogs, FMX.TMSFNCTypes, FMX.TMSFNCUtils,
  FMX.TMSFNCGraphics, FMX.TMSFNCGraphicsTypes, FMX.TMSFNCGridCell, FMX.TMSFNCGridOptions,
  FMX.Effects, FMX.TMSFNCCustomControl, FMX.TMSFNCCustomScrollControl, FMX.TMSFNCGridData,
  FMX.TMSFNCCustomGrid, FMX.TMSFNCGrid, FMX.Objects, FMX.Controls.Presentation, FMX.StdCtrls,
  FMX.Layouts, FMX.Menus;

type
  TfrmListStakes = class(TForm)
    lyt_background: TLayout;
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
    grid_Bases: TTMSFNCGrid;
    lyt_7: TLayout;
    lbl_2: TLabel;
    lyt_footer: TLayout;
    rect_Cancelar: TRectangle;
    iGlow_Cancelar: TInnerGlowEffect;
    rect_Aceptar: TRectangle;
    iGlow_Aceptar: TInnerGlowEffect;
    lbl_modo: TLabel;
    lyt_header: TLayout;
    rect_1: TRectangle;
    lbl_1: TLabel;
    Layout1: TLayout;
    rect_5: TRectangle;
    rect_6: TRectangle;
    pm1: TPopupMenu;
    MenuItem1: TMenuItem;
    MenuItem2: TMenuItem;
    procedure rect_5MouseUp(Sender: TObject; Button: TMouseButton; Shift: TShiftState; X, Y: Single);
    procedure rect_AceptarMouseEnter(Sender: TObject);
    procedure rect_AceptarMouseLeave(Sender: TObject);
    procedure rect_AceptarMouseUp(Sender: TObject; Button: TMouseButton; Shift: TShiftState; X, Y: Single);
    procedure rect_CancelarMouseUp(Sender: TObject; Button: TMouseButton; Shift: TShiftState; X, Y: Single);
    procedure rect_CancelarMouseLeave(Sender: TObject);
    procedure rect_CancelarMouseEnter(Sender: TObject);
  private
                { Private declarations }
  public
                { Public declarations }
  end;

var
  frmListStakes: TfrmListStakes;

implementation

{$R *.fmx}

uses
  DM1, uStakes;

procedure TfrmListStakes.rect_5MouseUp(Sender: TObject; Button: TMouseButton; Shift: TShiftState; X,
  Y: Single);
var
  LForm: TfrmStakes;
begin
  LForm := TfrmStakes.Create(Application);
  try
    LForm.showmodal;
  finally
    LForm.Free;
  end;
end;

procedure TfrmListStakes.rect_AceptarMouseEnter(Sender: TObject);
begin
  iGlow_Aceptar.Enabled := true;
end;

procedure TfrmListStakes.rect_AceptarMouseLeave(Sender: TObject);
begin
  iGlow_Aceptar.Enabled := false;
end;

procedure TfrmListStakes.rect_AceptarMouseUp(Sender: TObject; Button: TMouseButton; Shift:
  TShiftState; X, Y: Single);
begin
  iGlow_Aceptar.Enabled := false;
  ModalResult := mrOk;
end;

procedure TfrmListStakes.rect_CancelarMouseEnter(Sender: TObject);
begin
  iGlow_Aceptar.Enabled := true;
end;

procedure TfrmListStakes.rect_CancelarMouseLeave(Sender: TObject);
begin
  iGlow_Cancelar.Enabled := false;
end;

procedure TfrmListStakes.rect_CancelarMouseUp(Sender: TObject; Button: TMouseButton; Shift:
  TShiftState; X, Y: Single);
begin
  iGlow_Cancelar.Enabled := false;
  ModalResult := mrOk;
end;

end.

