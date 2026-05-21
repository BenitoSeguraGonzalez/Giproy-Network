unit FormUtils;

interface

uses
  System.SysUtils, System.Types, System.UITypes, System.Classes,
  System.Math,
  FMX.Forms, FMX.Controls, FMX.Types;

type
  // Helper para formularios
  TFormHelper = class helper for TForm
  public
    procedure CentrarSobre(AControl: TControl); overload;
    procedure CentrarSobre(AForm: TForm); overload;
    procedure CentrarEnPantalla;
    procedure CentrarInteligente;
  end;

implementation

{ TFormHelper }

procedure TFormHelper.CentrarSobre(AControl: TControl);
var
  CenterPoint: TPointF;
  ScreenCenter: TPointF;
begin
  if AControl = nil then
  begin
    CentrarEnPantalla;
    Exit;
  end;

  // Calcular centro del control
  CenterPoint.X := AControl.Width / 2;
  CenterPoint.Y := AControl.Height / 2;

  // Convertir a coordenadas de pantalla
  ScreenCenter := AControl.LocalToScreen(CenterPoint);

  // Centrar este formulario
  Self.Left := Trunc(ScreenCenter.X - (Self.Width / 2));
  Self.Top := Trunc(ScreenCenter.Y - (Self.Height / 2));

  // Asegurar que esté visible
  Self.Left := Max(0, Min(Self.Left, Trunc(Screen.Width - Self.Width)));
  Self.Top := Max(0, Min(Self.Top, Trunc(Screen.Height - Self.Height)));
end;

procedure TFormHelper.CentrarSobre(AForm: TForm);
begin
  if AForm = nil then
  begin
    CentrarEnPantalla;
    Exit;
  end;

  Self.Left :=Trunc( AForm.Left + (AForm.Width - Self.Width) / 2);
  Self.Top :=Trunc( AForm.Top + (AForm.Height - Self.Height) / 2);

  // Asegurar que esté visible
  Self.Left := Max(0, Min(Self.Left, Trunc(Screen.Width - Self.Width)));
  Self.Top := Max(0, Min(Self.Top, Trunc(Screen.Height - Self.Height)));
end;

procedure TFormHelper.CentrarEnPantalla;
begin
  Self.Left :=Trunc( (Screen.Width - Self.Width) / 2);
  Self.Top :=Trunc( (Screen.Height - Self.Height) / 2);
end;

procedure TFormHelper.CentrarInteligente;
var
  MainForm: TForm;
begin
  // Intentar obtener el formulario principal
  if (Application.MainForm <> nil) and (Application.MainForm is TForm) then
    MainForm := TForm(Application.MainForm)
  else
    MainForm := nil;

  if MainForm <> nil then
    CentrarSobre(MainForm)
  else
    CentrarEnPantalla;
end;

end.
