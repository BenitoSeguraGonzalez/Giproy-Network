{
============= Ejemplos de uso =============

Mostrar donde esté el cursor:
FTooltip.ShowAtCursor('Texto dinámico');

Mostrar relativo a control:
FTooltip.ShowAtControl(Button1, 'Texto botón');

Mostrar en coordenadas del Form:
FTooltip.ShowAtPosition(200, 300, 'Coordenadas locales');

Mostrar en coordenadas absolutas de pantalla:
FTooltip.ShowAtScreenPosition(1000, 500, 'Pantalla');
}
unit uFMXTooltip;

interface

uses
  System.SysUtils,
  System.Types,
  System.Classes,
  FMX.Types,
  FMX.Controls,
  FMX.Objects,
  FMX.Layouts,
  FMX.StdCtrls,
  FMX.Forms,
  FMX.Graphics,
  Winapi.Windows;

type
  TFMXTooltip = class
  private
    FLayout: TLayout;
    FBackground: TRectangle;
    FLabel: TLabel;
    FOwnerForm: TCommonCustomForm;
    FTimer: TTimer;
    procedure TimerHide(Sender: TObject);
    procedure AjustarTamano(const AText: string);
  public
    constructor Create(AForm: TCommonCustomForm);
    destructor Destroy; override;

    procedure ShowAtCursor(const AText: string; ADurationMS: Integer = 3000);
    procedure ShowAtControl(AControl: TControl; const AText: string; ADurationMS: Integer = 3000);
    procedure ShowAtPosition(X, Y: Single; const AText: string; ADurationMS: Integer = 3000);
    procedure ShowAtScreenPosition(X, Y: Integer; const AText: string; ADurationMS: Integer = 3000);

    procedure HideTooltip;
  end;

implementation

{ TFMXTooltip }

constructor TFMXTooltip.Create(AForm: TCommonCustomForm);
begin
  FOwnerForm := AForm;

  FLayout := TLayout.Create(AForm);
  FLayout.Parent := AForm;
  FLayout.Visible := False;
  FLayout.HitTest := False;
  FLayout.Stored := False;

  FBackground := TRectangle.Create(FLayout);
  FBackground.Parent := FLayout;
  FBackground.Align := TAlignLayout.Contents;
  FBackground.Fill.Color := $FFFFFFFF;
  FBackground.Stroke.Color := $FF000000;
  FBackground.Stroke.Thickness := 0.5;
  FBackground.XRadius := 6;
  FBackground.YRadius := 6;

  FLabel := TLabel.Create(FLayout);
  FLabel.Parent := FLayout;
  FLabel.Align := TAlignLayout.Contents;
  FLabel.Margins.Rect := RectF(10, 6, 10, 6);
  FLabel.TextSettings.FontColor := $FF000000;
  FLabel.TextSettings.WordWrap := False;
  FLabel.HitTest := False;

  FTimer := TTimer.Create(AForm);
  FTimer.Enabled := False;
  FTimer.OnTimer := TimerHide;
end;

destructor TFMXTooltip.Destroy;
begin
  FTimer.Free;
  FLayout.Free;
  inherited;
end;

procedure TFMXTooltip.AjustarTamano(const AText: string);
var
  TextWidth, TextHeight: Single;
  PaddingX, PaddingY: Single;
begin
  PaddingX := 20;
  PaddingY := 12;

  FLabel.Text := AText;

  TextWidth := FLabel.Canvas.TextWidth(AText);
  TextHeight := FLabel.Canvas.TextHeight(AText);

  FLayout.Width := TextWidth + PaddingX;
  FLayout.Height := TextHeight + PaddingY;

  FLabel.Width := FLayout.Width;
  FLabel.Height := FLayout.Height;
end;

procedure TFMXTooltip.ShowAtCursor(const AText: string; ADurationMS: Integer);
var
  CursorPos: TPoint;
begin
  if AText = '' then Exit;

  AjustarTamano(AText);

  GetCursorPos(CursorPos);

  ShowAtScreenPosition(CursorPos.X + 8, CursorPos.Y + 20, AText, ADurationMS);
end;

procedure TFMXTooltip.ShowAtControl(AControl: TControl; const AText: string; ADurationMS: Integer);
var
  AbsPos: TPointF;
begin
  if (AControl = nil) or (AText = '') then Exit;

  AjustarTamano(AText);

  AbsPos := AControl.LocalToAbsolute(PointF(0, AControl.Height));

  FLayout.Position.X := AbsPos.X;
  FLayout.Position.Y := AbsPos.Y + 4;

  FLayout.BringToFront;
  FLayout.Visible := True;

  if ADurationMS > 0 then
  begin
    FTimer.Interval := ADurationMS;
    FTimer.Enabled := True;
  end;
end;

procedure TFMXTooltip.ShowAtPosition(X, Y: Single; const AText: string; ADurationMS: Integer);
begin
  if AText = '' then Exit;

  AjustarTamano(AText);

  FLayout.Position.X := X;
  FLayout.Position.Y := Y;

  FLayout.BringToFront;
  FLayout.Visible := True;

  if ADurationMS > 0 then
  begin
    FTimer.Interval := ADurationMS;
    FTimer.Enabled := True;
  end;
end;

procedure TFMXTooltip.ShowAtScreenPosition(X, Y: Integer; const AText: string; ADurationMS: Integer);
var
  FormTopLeft: TPoint;
begin
  if AText = '' then Exit;

  AjustarTamano(AText);

  FormTopLeft := Point(Round(FOwnerForm.Left), Round(FOwnerForm.Top));

  FLayout.Position.X := X - FormTopLeft.X;
  FLayout.Position.Y := Y - FormTopLeft.Y;

  FLayout.BringToFront;
  FLayout.Visible := True;

  if ADurationMS > 0 then
  begin
    FTimer.Interval := ADurationMS;
    FTimer.Enabled := True;
  end;
end;

procedure TFMXTooltip.HideTooltip;
begin
  FTimer.Enabled := False;
  FLayout.Visible := False;
end;

procedure TFMXTooltip.TimerHide(Sender: TObject);
begin
  HideTooltip;
end;

end.

