unit uAddEDO;

interface

uses
        System.SysUtils, System.Types, System.UITypes, System.Classes,
        System.Variants, FMX.Types,
        FMX.Controls, FMX.Forms, FMX.Graphics, FMX.Dialogs, Uni, FMX.Effects,
        FMX.DialogService,
        FMX.Controls.Presentation, FMX.StdCtrls, FMX.Objects, FMX.Layouts,
        FMX.Memo.Types, FMX.ScrollBox,
        FMX.Memo, FMX.ListBox, FMX.Ani, FMX.Edit, FMX.TMSFNCTypes,
        FMX.TMSFNCUtils,
        FMX.TMSFNCGraphics,
        FMX.TMSFNCCustomControl, FMX.TMSFNCTreeViewBase, FMX.TMSFNCTreeViewData,
        FMX.TMSFNCCustomTreeView,
        FMX.TMSFNCTreeView, FMX.TMSFNCGraphicsTypes, FMX.TMSFNCCustomPicker,
        FMX.TMSFNCComboBox,
        FMX.TMSFNCWebBrowser, FMX.TMSFNCCustomWEBControl, FMX.TMSFNCMemo,
        FMX.TMSBaseControl, FMX.TMSMemo;

type
        TfrmAddEDO = class(TForm)
                lyt_header: TLayout;
                rct__1: TRectangle;
                lbl_1: TLabel;
                lyt_Body: TLayout;
                rct__2: TRectangle;
                lyt_3: TLayout;
                rct__3: TRectangle;
                lyt_6: TLayout;
                rct__4: TRectangle;
                lyt_7: TLayout;
                lbl_2: TLabel;
                lyt_footer: TLayout;
                rct_Cancelar: TRectangle;
                iGlow_Cancelar: TInnerGlowEffect;
                rct_Aceptar: TRectangle;
                iGlow_Aceptar: TInnerGlowEffect;
                lbl_modo: TLabel;
                lyt3: TLayout;
                lyt_91: TLayout;
                lbl_11: TLabel;
                ln_ln11: TLine;
                mmo_ActividadesClaves: TMemo;
                procedure rct_AceptarClick(Sender: TObject);
                procedure rct_CancelarClick(Sender: TObject);
                procedure FormShow(Sender: TObject);

        private
                { Private declarations }
        public
                { Public declarations }
                nodoSeleccionado: TTMSFNCTreeViewNode;
        end;

var
        frmAddEDO: TfrmAddEDO;

implementation

{$R *.fmx}

uses
        uMain, uRolProyecto, DM1;

{ TfrmAddEDO }

procedure TfrmAddEDO.FormShow(Sender: TObject);
begin
        mmo_ActividadesClaves.Lines.Clear;
        mmo_ActividadesClaves.Text := nodoSeleccionado.Text[4];
        lbl_2.Text := 'EDO Seleccionado: ' + nodoSeleccionado.Text[3];
end;

procedure TfrmAddEDO.rct_AceptarClick(Sender: TObject);
begin
        nodoSeleccionado.Text[4] := mmo_ActividadesClaves.Text;
        ModalResult := mrOk;
end;

procedure TfrmAddEDO.rct_CancelarClick(Sender: TObject);
begin
        ModalResult := mrCancel;
end;

end.
