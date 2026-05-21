unit uInputMemo;

interface

uses
        System.SysUtils, System.Types, System.UITypes, System.Classes,
        System.Variants,
        FMX.Types, FMX.Controls, FMX.Forms, FMX.Graphics, FMX.Dialogs,
        FMX.Effects,
        FMX.Controls.Presentation, FMX.StdCtrls, FMX.Objects, FMX.Layouts,
        FMX.Memo.Types, FMX.ScrollBox, FMX.Memo, FMX.TMSFNCTypes,
        FMX.TMSFNCUtils,
        FMX.TMSFNCGraphics, FMX.TMSFNCGraphicsTypes, FMX.TMSFNCCustomControl,
        FMX.TMSFNCTreeViewBase, FMX.TMSFNCTreeViewData,
        FMX.TMSFNCCustomTreeView,
        FMX.TMSFNCTreeView;

type
        TfrmImputMemo = class(TForm)
                lyt_1: TLayout;
                rect_2: TRectangle;
                lbl_Fecha: TLabel;
                Shadow_1: TShadowEffect;
                rect_11: TRectangle;
                mmo11: TMemo;
                rect_Aceptar: TRectangle;
                iGlow_Aceptar: TInnerGlowEffect;
                rect_Cancelar: TRectangle;
                iGlow_Cancelar: TInnerGlowEffect;
                lbl_TextoReferencia: TLabel;
                lbl_modo: TLabel;
                procedure rect_AceptarMouseUp(Sender: TObject;
                  Button: TMouseButton; Shift: TShiftState; X, Y: Single);
                procedure rect_AceptarMouseEnter(Sender: TObject);
                procedure rect_AceptarMouseLeave(Sender: TObject);
                procedure rect_CancelarMouseLeave(Sender: TObject);
                procedure rect_CancelarMouseUp(Sender: TObject;
                  Button: TMouseButton; Shift: TShiftState; X, Y: Single);
                procedure rect_CancelarMouseEnter(Sender: TObject);
                procedure mmo11KeyUp(Sender: TObject; var Key: Word;
                  var KeyChar: Char; Shift: TShiftState);
                procedure FormShow(Sender: TObject);
        private
                { Private declarations }
        public
                { Public declarations }
                nodoSeleccionado: TTmsFncTreeViewNode;
        end;

var
        frmImputMemo: TfrmImputMemo;

implementation

{$R *.fmx}

uses
        DM1, uNotaPresupuesto;

procedure TfrmImputMemo.FormShow(Sender: TObject);
begin
        mmo11.SetFocus;
end;

procedure TfrmImputMemo.mmo11KeyUp(Sender: TObject; var Key: Word;
  var KeyChar: Char; Shift: TShiftState);
begin
        if Key = vkEscape then
        begin
                iGlow_Cancelar.Enabled := False;
                ModalResult := mrOk;
        end;
end;

procedure TfrmImputMemo.rect_AceptarMouseEnter(Sender: TObject);
begin
        iGlow_Aceptar.Enabled := True;
end;

procedure TfrmImputMemo.rect_AceptarMouseLeave(Sender: TObject);
begin
        iGlow_Aceptar.Enabled := False;
end;

procedure TfrmImputMemo.rect_AceptarMouseUp(Sender: TObject;
  Button: TMouseButton; Shift: TShiftState; X, Y: Single);
var
        textoNotaReferencia, textonota: string;
begin
        iGlow_Aceptar.Enabled := False;
        textoNotaReferencia := lbl_TextoReferencia.text;
        textonota := mmo11.text;
        textonota := Trim(textonota);
        if lbl_modo.text = '1' then
        begin
                textoNotaReferencia := lbl_TextoReferencia.text;
                textonota := mmo11.text;
                textonota := Trim(textonota);
                if Length(textonota) > 0 then
                begin
                        frmNotaPresupuesto.RespondeNota(textonota,
                          textoNotaReferencia);
                        frmNotaPresupuesto.cargaNota;
                        ModalResult := mrOk;
                end
                else
                begin

                        frmNotaPresupuesto.TWToast_1.MakeText
                          ('No ha añadido Anotación.');

                end;
        end;
        if lbl_modo.text = '2' then
        begin
                if Length(textonota) > 0 then
                begin
                        nodoSeleccionado.text[3] := textonota;
                        ModalResult := mrOk;
                end;
        end;
end;

procedure TfrmImputMemo.rect_CancelarMouseEnter(Sender: TObject);
begin
        iGlow_Cancelar.Enabled := True;
end;

procedure TfrmImputMemo.rect_CancelarMouseLeave(Sender: TObject);
begin
        iGlow_Cancelar.Enabled := False;
end;

procedure TfrmImputMemo.rect_CancelarMouseUp(Sender: TObject;
  Button: TMouseButton; Shift: TShiftState; X, Y: Single);
begin
        iGlow_Cancelar.Enabled := False;
        ModalResult := mrOk;
end;

end.
