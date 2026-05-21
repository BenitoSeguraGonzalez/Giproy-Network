unit fConversacionNota;

interface

uses
  System.SysUtils, System.Types, System.UITypes, System.Classes, System.Variants, FMX.Types,
  FMX.Graphics, FMX.Controls, FMX.Forms, FMX.Dialogs, FMX.StdCtrls, FMX.Controls.Presentation,
  FMX.Objects, FMX.Memo.Types, FMX.Effects, FMX.Platform, FMX.ScrollBox, FMX.Memo, FMX.Layouts,
  FMX.Menus, FMX.Toast.Windows;

type
  Tframe_ConversacionNota = class(TFrame)
    rect_2: TRectangle;
    lbl_Fecha: TLabel;
    mmo1: TMemo;
    Shadow_1: TShadowEffect;
    lyt_1: TLayout;
    rect_1: TRectangle;
    pm1: TPopupMenu;
    MenuItem1: TMenuItem;
    MenuItem2: TMenuItem;
    txt1: TText;
    procedure MenuItem2Click(Sender: TObject);
    procedure MenuItem1Click(Sender: TObject);
  private
                { Private declarations }
  public
                { Public declarations }
  end;

implementation

{$R *.fmx}

uses
  DM1, uNotaPresupuesto, uInputMemo;

procedure Tframe_ConversacionNota.MenuItem1Click(Sender: TObject);
var
  LForm: TfrmImputMemo;
begin
  LForm := TfrmImputMemo.Create(Application);
  try
    LForm.lbl_Fecha.Text := 'Nuevos Comentarios';
    LForm.mmo11.Text := '';
    LForm.lbl_modo.Text := '1';
    LForm.lbl_TextoReferencia.Text := Self.mmo1.Text;
    LForm.Height := 120;
    LForm.ShowModal;
  finally
    LForm.Free;
  end;
end;

procedure Tframe_ConversacionNota.MenuItem2Click(Sender: TObject);
var
  uClipBoard: IFMXClipboardService;
  AValue: string;
begin

  // MakeText(Text; Duration; BackgroundColor; TextColor);
  // WindowsToastDialog1.MakeText("Testing Windows Toast");
  // or
  // WindowsToastDialog1.MakeText('Toast on Windows Application', ToastDurationLengthShort, $FF009688, $FFFFFFFF);
  AValue := Self.mmo1.Text;
  if TPlatformServices.Current.SupportsPlatformService(IFMXClipboardService, uClipBoard) then
    uClipBoard.SetClipboard(AValue);
  frmNotaPresupuesto.TWToast_1.MakeText('Contenido Copiado al portapapeles');
end;

end.

