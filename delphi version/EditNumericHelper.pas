unit EditNumericHelper;

interface

uses
  System.SysUtils, System.Classes, FMX.Edit, System.UITypes;

type
  TEditNumericHelper = class
  public
    class procedure OnlyIntegers(AEdit: TEdit);
    class procedure OnlyDecimals(AEdit: TEdit);
  private
    class procedure KeyDownIntegers(Sender: TObject; var Key: Word; var KeyChar: WideChar; Shift: TShiftState);
    class procedure KeyDownDecimals(Sender: TObject; var Key: Word; var KeyChar: WideChar; Shift: TShiftState);
    class procedure ChangeTrackingIntegers(Sender: TObject);
    class procedure ChangeTrackingDecimals(Sender: TObject);
  end;

implementation

{ ===== ENTEROS ===== }

class procedure TEditNumericHelper.OnlyIntegers(AEdit: TEdit);
begin
  AEdit.OnKeyDown := KeyDownIntegers;
  AEdit.OnChangeTracking := ChangeTrackingIntegers;
end;

class procedure TEditNumericHelper.KeyDownIntegers(Sender: TObject;
  var Key: Word; var KeyChar: WideChar; Shift: TShiftState);
begin
  // Teclas de control permitidas
  if Key in [vkBack, vkDelete, vkLeft, vkRight, vkTab] then Exit;

  // Solo dígitos
  if not (KeyChar in ['0'..'9']) then
    Key := 0;
end;

class procedure TEditNumericHelper.ChangeTrackingIntegers(Sender: TObject);
var
  E: TEdit;
  I: Integer;
  S: string;
begin
  E := Sender as TEdit;
  S := '';

  for I := 1 to Length(E.Text) do
    if E.Text[I] in ['0'..'9'] then
      S := S + E.Text[I];

  if E.Text <> S then
    E.Text := S;
end;

{ ===== DECIMALES ===== }

class procedure TEditNumericHelper.OnlyDecimals(AEdit: TEdit);
begin
  AEdit.OnKeyDown := KeyDownDecimals;
  AEdit.OnChangeTracking := ChangeTrackingDecimals;
end;

class procedure TEditNumericHelper.KeyDownDecimals(Sender: TObject;
  var Key: Word; var KeyChar: WideChar; Shift: TShiftState);
var
  E: TEdit;
  Sep: Char;
begin
  E := Sender as TEdit;
  Sep := FormatSettings.DecimalSeparator;

  if Key in [vkBack, vkDelete, vkLeft, vkRight, vkTab] then Exit;

  if (KeyChar in ['0'..'9']) then Exit;

  // Permitir un solo separador decimal
  if (KeyChar = Sep) and (Pos(Sep, E.Text) = 0) then Exit;

  Key := 0;
end;

class procedure TEditNumericHelper.ChangeTrackingDecimals(Sender: TObject);
var
  E: TEdit;
  I: Integer;
  Sep: Char;
  S: string;
  HasSep: Boolean;
begin
  E := Sender as TEdit;
  Sep := FormatSettings.DecimalSeparator;
  S := '';
  HasSep := False;

  for I := 1 to Length(E.Text) do
  begin
    if E.Text[I] in ['0'..'9'] then
      S := S + E.Text[I]
    else if (E.Text[I] = Sep) and not HasSep then
    begin
      S := S + Sep;
      HasSep := True;
    end;
  end;

  if E.Text <> S then
    E.Text := S;
end;

end.

