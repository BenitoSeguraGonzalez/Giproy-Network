{
Ejemplos:
 TRectFillBitmapColorizer.Apply(rect_Config, $FFF39200); -> Activar el coloreado
 TRectFillBitmapColorizer.Restore(rect_Config);          -> Volver posicion Normal
}

unit uRectFillBitmapColoriz;

interface

uses
  System.SysUtils,
  System.UITypes,
  System.Generics.Collections,
  FMX.Types,
  FMX.Objects,
  FMX.Graphics;

type
  // Definición segura para acceder a scanlines
  PAlphaColorArray = ^TAlphaColorArray;
  TAlphaColorArray = array[0..MaxInt div SizeOf(TAlphaColor) - 1] of TAlphaColor;

type
  /// <summary>
  /// Recolorea el bitmap que está en Rectangle.Fill.Bitmap.Bitmap usando el ALPHA original:
  /// todos los píxeles visibles pasan al color indicado, conservando transparencia.
  /// </summary>
  TRectFillBitmapColorizer = class sealed
  strict private
    class var FOriginals: TObjectDictionary<TRectangle, TBitmap>;
    class procedure EnsureDict;
    class function CloneBitmap(const Src: TBitmap): TBitmap; static;

    class function MakeColorARGB(const A, R, G, B: Byte): TAlphaColor; static;
    class procedure RecolorBitmapKeepAlpha(ABmp: TBitmap; const AColor: TAlphaColor); static;
  public
    class procedure Apply(const R: TRectangle; const AColor: TAlphaColor);
    class procedure Restore(const R: TRectangle);
    class procedure Clear;
  end;

implementation

class procedure TRectFillBitmapColorizer.EnsureDict;
begin
  if FOriginals = nil then
    FOriginals := TObjectDictionary<TRectangle, TBitmap>.Create([doOwnsValues]);
end;

class function TRectFillBitmapColorizer.CloneBitmap(const Src: TBitmap): TBitmap;
begin
  Result := TBitmap.Create;
  Result.Assign(Src);
end;

class function TRectFillBitmapColorizer.MakeColorARGB(const A, R, G, B: Byte): TAlphaColor;
begin
  // TAlphaColor es $AARRGGBB
  Result :=
    (TAlphaColor(A) shl 24) or
    (TAlphaColor(R) shl 16) or
    (TAlphaColor(G) shl 8) or
    (TAlphaColor(B));
end;

class procedure TRectFillBitmapColorizer.RecolorBitmapKeepAlpha(
  ABmp: TBitmap; const AColor: TAlphaColor);
var
  Data: TBitmapData;
  X, Y: Integer;
  Row: PAlphaColorArray;
  A: Byte;
  RR, GG, BB: Byte;
begin
  if (ABmp = nil) or ABmp.IsEmpty then
    Exit;

  RR := TAlphaColorRec(AColor).R;
  GG := TAlphaColorRec(AColor).G;
  BB := TAlphaColorRec(AColor).B;

  if ABmp.Map(TMapAccess.ReadWrite, Data) then
    try
      for Y := 0 to ABmp.Height - 1 do
      begin
        Row := PAlphaColorArray(Data.GetScanline(Y));
        for X := 0 to ABmp.Width - 1 do
        begin
          A := TAlphaColorRec(Row^[X]).A; // conservar alpha original
          if A = 0 then
            Continue;

          Row^[X] := MakeColorARGB(A, RR, GG, BB);
        end;
      end;
    finally
      ABmp.Unmap(Data);
    end;
end;

class procedure TRectFillBitmapColorizer.Apply(const R: TRectangle; const AColor: TAlphaColor);
var
  B: TBitmap;
begin
  if R = nil then
    Exit;

  B := R.Fill.Bitmap.Bitmap;
  if (B = nil) or B.IsEmpty then
    Exit;

  EnsureDict;

  if not FOriginals.ContainsKey(R) then
    FOriginals.Add(R, CloneBitmap(B));

  RecolorBitmapKeepAlpha(B, AColor);
  R.Repaint;
end;

class procedure TRectFillBitmapColorizer.Restore(const R: TRectangle);
var
  Orig: TBitmap;
  B: TBitmap;
begin
  if (R = nil) or (FOriginals = nil) then
    Exit;

  if not FOriginals.TryGetValue(R, Orig) then
    Exit;

  B := R.Fill.Bitmap.Bitmap;
  if B <> nil then
    B.Assign(Orig);

  FOriginals.Remove(R);
  R.Repaint;
end;

class procedure TRectFillBitmapColorizer.Clear;
begin
  FreeAndNil(FOriginals);
end;

end.

