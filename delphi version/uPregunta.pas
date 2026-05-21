unit uPregunta;

interface

uses
  System.SysUtils, System.Types, System.UITypes, System.Classes, System.Variants, FMX.Types,
  FMX.Controls, FMX.Forms, FMX.Graphics, FMX.Dialogs, FMX.Edit, FMX.TMSFNCTreeViewBase,
  FMX.TMSFNCTreeViewData, FMX.TMSFNCCustomTreeView, FMX.Effects, FMX.Objects, System.StrUtils,
  FMX.Controls.Presentation, FMX.StdCtrls, FMX.Layouts, uNuevoRecurso;

type
  TfrmPregunta = class(TForm)
    lyt_Background: TLayout;
    lyt_Body: TLayout;
    rect_2: TRectangle;
    lyt_header: TLayout;
    rect_1: TRectangle;
    lbl_banner1: TLabel;
    lyt1: TLayout;
    rect_Aceptar: TRectangle;
    lbl1: TLabel;
    lyt2: TLayout;
    Layout1: TLayout;
    rect_Cancelar: TRectangle;
    Label1: TLabel;
    lyt3: TLayout;
    Layout2: TLayout;
    rect_Icono: TRectangle;
    lyt4: TLayout;
    lyt5: TLayout;
    lyt6: TLayout;
    lbl_Pregunta: TLabel;
    edt_Pregunta: TEdit;
    procedure FormShow(Sender: TObject);
    procedure rect_AceptarClick(Sender: TObject);
    procedure rect_CancelarClick(Sender: TObject);
  private
    { Private declarations }
    procedure resuelvePregunta();
  public
    { Public declarations }
    modoTrabajo: integer;
    Adicional: string;
    LForm: TfrmNuevoRecurso;
    Respuesta: string;
  end;

var
  frmPregunta: TfrmPregunta;

implementation

{$R *.fmx}

uses
  DM1, uMain;

procedure TfrmPregunta.FormShow(Sender: TObject);
var
  x: integer;
  tmpstr: string;
begin
  Self.edt_Pregunta.Text := '';
  Self.edt_Pregunta.SetFocus;
end;

procedure TfrmPregunta.rect_AceptarClick(Sender: TObject);
begin
  self.resuelvePregunta;
  ModalResult := mrOk;
end;

procedure TfrmPregunta.rect_CancelarClick(Sender: TObject);
begin
  ModalResult := mrCancel;
end;

procedure TfrmPregunta.resuelvePregunta;
begin
  case modoTrabajo of
    1:
      begin
        // Devolver respuesta
        Respuesta := edt_pregunta.Text.Trim;
      end;
    3:
      begin
        // Resetear Password
        Respuesta := '';
        if Self.edt_Pregunta.Text.Trim <> '' then
          frmMain.ResetPassword(Self.edt_Pregunta.Text.Trim);
      end;
  end;
end;

end.

