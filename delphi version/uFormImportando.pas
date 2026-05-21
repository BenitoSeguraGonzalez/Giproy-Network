unit uFormImportando;

interface

uses
  System.SysUtils, System.Types, System.UITypes, System.Classes, System.Variants, FMX.Types,
  FMX.Controls, FMX.Forms, FMX.Graphics, FMX.Dialogs, FMX.Objects, FMX.Ani, FMX.StdCtrls,
  FMX.Controls.Presentation, System.Skia, FMX.Skia, FMX.Layouts;

type
  TFormImportando = class(TForm)
    img1: TSkAnimatedImage;
    rect_1: TRectangle;
    lyt1: TLayout;
    lblTextoAccion: TLabel;
    procedure FormCreate(Sender: TObject);
  private
                { Private declarations }
  public
                { Public declarations }
    procedure IniciarAnimacion;
    procedure DetenerAnimacion;
  end;

var
  FormImportando: TFormImportando;

implementation

{$R *.fmx}
{ TFormImportando }

procedure TFormImportando.DetenerAnimacion;
begin
  img1.Animation.Enabled := False;
  Close;
end;

procedure TFormImportando.FormCreate(Sender: TObject);
begin
  img1.Animation.Loop := True;
  img1.Animation.Enabled := True;
end;

procedure TFormImportando.IniciarAnimacion;
begin
  img1.Animation.Enabled := True;
end;

end.

