unit uPreguntaSiNo;

interface

uses
  System.SysUtils, System.Types, System.UITypes, System.Classes, System.Variants, FMX.Types,
  FMX.Controls, FMX.Forms, FMX.Graphics, FMX.Dialogs, FMX.StdCtrls, FMX.Controls.Presentation,
  FMX.Objects, FMX.Layouts;

type
  TfrmPreguntaSiNo = class(TForm)
    lyt_Background: TLayout;
    lyt_Body: TLayout;
    rect_2: TRectangle;
    lyt_header: TLayout;
    rect_1: TRectangle;
    lbl_banner1: TLabel;
    lyt1: TLayout;
    rect_RespuestaNO: TRectangle;
    lyt2: TLayout;
    lbl1: TLabel;
    Layout1: TLayout;
    rect_RespuestaSI: TRectangle;
    Label1: TLabel;
    lbl_TextoPregunta: TLabel;
    lyt3: TLayout;
    rect3: TRectangle;
    procedure rect_RespuestaSIClick(Sender: TObject);
    procedure rect_RespuestaNOClick(Sender: TObject);
  private
  { Private declarations }
  public
  { Public declarations }
  end;

var
  frmPreguntaSiNo: TfrmPreguntaSiNo;

implementation

{$R *.fmx}

procedure TfrmPreguntaSiNo.rect_RespuestaNOClick(Sender: TObject);
begin
  ModalResult := mrCancel;
end;

procedure TfrmPreguntaSiNo.rect_RespuestaSIClick(Sender: TObject);
begin
  ModalResult := mrOk;
end;

end.

