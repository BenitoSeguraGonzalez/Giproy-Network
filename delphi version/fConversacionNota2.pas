unit fConversacionNota2;

interface

uses
        System.SysUtils, System.Types, System.UITypes, System.Classes,
        System.Variants,
        FMX.Types, FMX.Graphics, FMX.Controls, FMX.Forms, FMX.Dialogs,
        FMX.StdCtrls,
        FMX.Platform, FMX.Memo.Types, FMX.ScrollBox, FMX.Memo, FMX.Effects,
        FMX.Controls.Presentation, FMX.Objects, FMX.Layouts, FMX.Menus;

type
        Tframe_ConversacionNota2 = class(TFrame)
                lyt_1: TLayout;
                rect_2: TRectangle;
                lbl_Fecha: TLabel;
                Shadow_1: TShadowEffect;
                rect_1: TRectangle;
                mmo1: TMemo;
                rect_11: TRectangle;
                mmo11: TMemo;
                pm1: TPopupMenu;
                pm2: TPopupMenu;
                MenuItem1: TMenuItem;
                MenuItem2: TMenuItem;
                procedure MenuItem1Click(Sender: TObject);
                procedure MenuItem2Click(Sender: TObject);
        private
                { Private declarations }
        public
                { Public declarations }
        end;

implementation

{$R *.fmx}

uses uNotaPresupuesto;

procedure Tframe_ConversacionNota2.MenuItem1Click(Sender: TObject);
var
        uClipBoard: IFMXClipboardService;
        AValue: string;
begin

        // MakeText(Text; Duration; BackgroundColor; TextColor);
        // WindowsToastDialog1.MakeText("Testing Windows Toast");
        // or
        // WindowsToastDialog1.MakeText('Toast on Windows Application', ToastDurationLengthShort, $FF009688, $FFFFFFFF);
        AValue := Self.mmo1.Text;
        if TPlatformServices.Current.SupportsPlatformService
          (IFMXClipboardService, uClipBoard) then
                uClipBoard.SetClipboard(AValue);
        frmNotaPresupuesto.TWToast_1.MakeText
          ('Contenido Copiado al portapapeles');

end;

procedure Tframe_ConversacionNota2.MenuItem2Click(Sender: TObject);
var
        uClipBoard: IFMXClipboardService;
        AValue: string;
begin
        AValue := Self.mmo11.Text;
        if TPlatformServices.Current.SupportsPlatformService
          (IFMXClipboardService, uClipBoard) then
                uClipBoard.SetClipboard(AValue);
        frmNotaPresupuesto.TWToast_1.MakeText
          ('Contenido Copiado al portapapeles');
end;

end.
