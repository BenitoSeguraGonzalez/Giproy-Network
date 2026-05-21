unit uBuscar;

interface

uses
        System.SysUtils, System.Types, System.UITypes, System.Classes,
        System.Variants,
        FMX.Types, FMX.Controls, FMX.Forms, FMX.Graphics, FMX.Dialogs,
        FMX.Memo.Types,
        FMX.Effects, FMX.ScrollBox, FMX.Memo, FMX.Ani, FMX.Edit, FMX.Layouts,
        FMX.Objects,
        FMX.Controls.Presentation, FMX.StdCtrls;

type
        TfrmBuscar = class(TForm)
                lyt_Background: TLayout;
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
                lyt_11: TLayout;
                rect_5: TRectangle;
                Shadow_filtro: TShadowEffect;
                edt_Filtro: TEdit;
                lyt_7: TLayout;
                lbl_banner2: TLabel;
                lyt_footer: TLayout;
                rect_Cancelar: TRectangle;
                iGlow_Cancelar: TInnerGlowEffect;
                rect_Aceptar: TRectangle;
                iGlow_Aceptar: TInnerGlowEffect;
                lbl_Categoria: TLabel;
                lbl_funcion: TLabel;
                lbl_Codigo: TLabel;
                lyt_header: TLayout;
                rect_1: TRectangle;
                lbl_banner1: TLabel;
                procedure edt_FiltroEnter(Sender: TObject);
                procedure edt_FiltroExit(Sender: TObject);
                procedure rect_CancelarMouseEnter(Sender: TObject);
                procedure rect_CancelarMouseLeave(Sender: TObject);
                procedure rect_CancelarMouseUp(Sender: TObject;
                  Button: TMouseButton; Shift: TShiftState; X, Y: Single);
                procedure rect_AceptarMouseEnter(Sender: TObject);
                procedure rect_AceptarMouseLeave(Sender: TObject);
                procedure rect_1MouseDown(Sender: TObject; Button: TMouseButton;
                  Shift: TShiftState; X, Y: Single);
        private
                { Private declarations }
        public
                { Public declarations }
        end;

var
        frmBuscar: TfrmBuscar;

implementation

{$R *.fmx}

uses
        DM1, uMain;

procedure TfrmBuscar.edt_FiltroEnter(Sender: TObject);
begin
        Shadow_filtro.Enabled := True;
end;

procedure TfrmBuscar.edt_FiltroExit(Sender: TObject);
begin
        Shadow_filtro.Enabled := False;
end;

procedure TfrmBuscar.rect_1MouseDown(Sender: TObject; Button: TMouseButton;
  Shift: TShiftState; X, Y: Single);
begin
        Self.StartWindowDrag;
end;

procedure TfrmBuscar.rect_AceptarMouseEnter(Sender: TObject);
begin
        iGlow_Aceptar.Enabled := True;
end;

procedure TfrmBuscar.rect_AceptarMouseLeave(Sender: TObject);
begin
        iGlow_Aceptar.Enabled := False;
end;

procedure TfrmBuscar.rect_CancelarMouseEnter(Sender: TObject);
begin
        iGlow_Cancelar.Enabled := True;
end;

procedure TfrmBuscar.rect_CancelarMouseLeave(Sender: TObject);
begin
        iGlow_Cancelar.Enabled := False;
end;

procedure TfrmBuscar.rect_CancelarMouseUp(Sender: TObject; Button: TMouseButton;
  Shift: TShiftState; X, Y: Single);
begin
        iGlow_Cancelar.Enabled := False;
        ModalResult := mrOk;
end;

end.
