unit uLoginUser;

interface

uses
  System.SysUtils, System.Types, System.UITypes, System.Classes, System.Variants, FMX.Types,
  FMX.Controls, FMX.Forms, FMX.Graphics, FMX.Dialogs, FMX.Objects, FMX.Layouts, FMX.Effects,
  FMX.Edit, FMX.Controls.Presentation, FMX.StdCtrls;

type
  TfrmLoginUser = class(TForm)
    lyt_Background: TLayout;
    rect_fondo: TRectangle;
    rect_marcadeagua: TRectangle;
    lyt_1: TLayout;
    rect_2: TRectangle;
    Shadow_1: TShadowEffect;
    lyt_2: TLayout;
    rect_1: TRectangle;
    edt_UUsuario: TEdit;
    Shadow_UUsuario: TShadowEffect;
    rect_11: TRectangle;
    edt_UPassword: TEdit;
    Shadow_UPassword: TShadowEffect;
    rect_btnLogin: TRectangle;
    Shadow_btnLogin: TShadowEffect;
    lbl_1: TLabel;
    lbl_olvido: TLabel;
    rect_4: TRectangle;
    lbl_3: TLabel;
    rect_Registrarse: TRectangle;
    procedure FormClose(Sender: TObject; var Action: TCloseAction);
    procedure rect_3Click(Sender: TObject);
    procedure edt_UUsuarioEnter(Sender: TObject);
    procedure edt_UUsuarioExit(Sender: TObject);
    procedure edt_UPasswordEnter(Sender: TObject);
    procedure edt_UPasswordExit(Sender: TObject);
    procedure rect_btnLoginMouseDown(Sender: TObject; Button: TMouseButton; Shift: TShiftState; X, Y: Single);
    procedure rect_btnLoginMouseUp(Sender: TObject; Button: TMouseButton; Shift: TShiftState; X, Y: Single);
    procedure rect_btnLoginMouseLeave(Sender: TObject);
    procedure edt_UUsuarioKeyDown(Sender: TObject; var Key: Word; var KeyChar: Char; Shift: TShiftState);
    procedure edt_UPasswordKeyDown(Sender: TObject; var Key: Word; var KeyChar: Char; Shift: TShiftState);
    procedure lbl_olvidoClick(Sender: TObject);
    procedure rect_RegistrarseClick(Sender: TObject);
    procedure edt_UUsuarioKeyUp(Sender: TObject; var Key: Word; var KeyChar: Char; Shift: TShiftState);
  private
                { Private declarations }
    procedure realizaLogin();
  public
                { Public declarations }
    procedure compruebaEscrito();
  end;

var
  frmLoginUser: TfrmLoginUser;

implementation

{$R *.fmx}

uses
  DM1, uMain, uNuevaBase;

procedure TfrmLoginUser.compruebaEscrito;
begin
  if (edt_UUsuario.Text <> '') and (edt_UPassword.Text <> '') then
  begin
    Shadow_btnLogin.Enabled := True;
  end
  else
  begin
    Shadow_btnLogin.Enabled := False;
  end;
end;

procedure TfrmLoginUser.edt_UPasswordEnter(Sender: TObject);
begin
  Shadow_UPassword.Enabled := True;
end;

procedure TfrmLoginUser.edt_UPasswordExit(Sender: TObject);
begin
  Shadow_UPassword.Enabled := False;
end;

procedure TfrmLoginUser.edt_UPasswordKeyDown(Sender: TObject; var Key: Word; var KeyChar: Char;
  Shift: TShiftState);
begin
  if Key = vkTab then
    edt_UUsuario.SetFocus;
  compruebaEscrito;
  if (Key = vkReturn) then
  begin
    realizaLogin;
  end;
end;

procedure TfrmLoginUser.edt_UUsuarioEnter(Sender: TObject);
begin
  Shadow_UUsuario.Enabled := True;
end;

procedure TfrmLoginUser.edt_UUsuarioExit(Sender: TObject);
begin
  Shadow_UUsuario.Enabled := False;
end;

procedure TfrmLoginUser.edt_UUsuarioKeyDown(Sender: TObject; var Key: Word; var KeyChar: Char; Shift:
  TShiftState);
begin
  if (Key = vkReturn) then
  begin
    edt_UPassword.SetFocus;
  end;
  compruebaEscrito;
end;

procedure TfrmLoginUser.edt_UUsuarioKeyUp(Sender: TObject; var Key: Word; var KeyChar: Char; Shift:
  TShiftState);
begin
  if (Key = vkReturn) or (Key = vkTab) then
    edt_UPassword.SetFocus;
end;

procedure TfrmLoginUser.FormClose(Sender: TObject; var Action: TCloseAction);
var
  EcranRect: TRectF;
  px, py: integer;
begin
  if Nombre_usuario = '' then
    frmmain.Close;
  IniciaNuevoProyecto();
end;

procedure TfrmLoginUser.lbl_olvidoClick(Sender: TObject);
begin
  ShowMessage('Recordar Contraseña');
end;

procedure TfrmLoginUser.realizaLogin;
begin
  if (edt_UUsuario.Text <> '') and (edt_UPassword.Text <> '') then
  begin
    if compruebaUsuario(edt_UUsuario.Text, edt_UPassword.Text) then
    begin
      frmLoginUser.Close;
    end
    else
    begin
      edt_UUsuario.Text := '';
      edt_UPassword.Text := '';
      edt_UUsuario.SetFocus;
    end;
  end;
end;

procedure TfrmLoginUser.rect_3Click(Sender: TObject);
begin
  frmLoginUser.Close;
end;

procedure TfrmLoginUser.rect_btnLoginMouseDown(Sender: TObject; Button: TMouseButton; Shift:
  TShiftState; X, Y: Single);
begin
  Shadow_btnLogin.Enabled := False;
end;

procedure TfrmLoginUser.rect_btnLoginMouseLeave(Sender: TObject);
begin
  Shadow_btnLogin.Enabled := True;
end;

procedure TfrmLoginUser.rect_btnLoginMouseUp(Sender: TObject; Button: TMouseButton; Shift:
  TShiftState; X, Y: Single);
begin
  Shadow_btnLogin.Enabled := True;
  realizaLogin;
end;

procedure TfrmLoginUser.rect_RegistrarseClick(Sender: TObject);
begin
  ShowMessage('Registrarse');
end;

end.

