unit uMensajes;

interface

uses
  System.SysUtils, System.Types, System.UITypes, System.Classes, System.Variants, FMX.Types,
  FMX.Controls, FMX.Forms, FMX.Graphics, FMX.Dialogs, FMX.Memo.Types, FMX.Effects, FMX.ScrollBox,
  FMX.Memo, FMX.Controls.Presentation, FMX.StdCtrls, FMX.Objects, FMX.Layouts, System.ImageList,
  FMX.ImgList;

type
  TfMensajes = class(TForm)
    lyt_1: TLayout;
    rect_2: TRectangle;
    lbl_Encabezado: TLabel;
    Shadow_1: TShadowEffect;
    rect_Background: TRectangle;
    lyt1: TLayout;
    lyt2: TLayout;
    lyt3: TLayout;
    lyt4: TLayout;
    rect2: TRectangle;
    lbl1: TLabel;
    lbl_mensajes: TLabel;
    rect_Icono: TRectangle;
    il1: TImageList;
    procedure rect2Click(Sender: TObject);
    procedure FormShow(Sender: TObject);
  private
  { Private declarations }
  public
  { Public declarations }
  end;

var
  fMensajes: TfMensajes;

implementation

{$R *.fmx}

procedure TfMensajes.FormShow(Sender: TObject);
var
  icono: TBitmap;
  texto: string;
begin
  icono := TBitmap.Create;
  icono := Self.il1.Source.Items[2].MultiResBitmap[0].Bitmap;
  texto := LowerCase(Self.lbl_Encabezado.Text);
  if Assigned(icono) then
  begin
    if texto = 'error' then
      icono := Self.il1.Source.Items[1].MultiResBitmap[0].Bitmap;
    if texto = 'advertencia' then
      icono := Self.il1.Source.Items[0].MultiResBitmap[0].Bitmap;
  end;
  rect_Icono.fill.Bitmap.Bitmap := icono;
end;

procedure TfMensajes.rect2Click(Sender: TObject);
begin
  ModalResult := mrOk;
end;

end.

