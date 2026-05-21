unit uDB_BorrarAPU;

interface

uses
  System.SysUtils,
  Uni, DB;

type
  TBorrarAPUResultado = (barExito, barIntegrado, barError);

function BorrarAPUSiNoUsado(
  const ACodBase, ACodAPU: string;
  out ADetalle: string
): TBorrarAPUResultado;

implementation
uses dm1;

function BorrarAPUSiNoUsado(
  const ACodBase, ACodAPU: string;
  out ADetalle: string
): TBorrarAPUResultado;
var
  Q: TUniQuery;
  ResStr: string;
begin
  Result := barError;
  ADetalle := '';

  if (Dmodule_1.con2 = nil) or (not Dmodule_1.con2.Connected) then
  begin
    ADetalle := 'CONEXION_NO_DISPONIBLE';
    Exit;
  end;

  Q := TUniQuery.Create(nil);
  try
    Q.Connection := Dmodule_1.con2;

    try
      { 1) Ejecuta SP (sin multi-statements) }
      Q.Close;
      Q.SQL.Clear;
      Q.SQL.Text := 'CALL borrar_apu_si_no_usado(:pCodBase, :pCodAPU, @oRes, @oDet)';
      Q.ParamByName('pCodBase').AsString := ACodBase;
      Q.ParamByName('pCodAPU').AsString := ACodAPU;
      Q.ExecSQL;

      { 2) Lee OUT params }
      Q.Close;
      Q.SQL.Clear;
      Q.SQL.Text := 'SELECT @oRes AS oResultado, @oDet AS oDetalle';
      Q.Open;

      ResStr := Trim(UpperCase(Q.FieldByName('oResultado').AsString));
      ADetalle := Q.FieldByName('oDetalle').AsString;

      if ResStr = 'EXITO' then
        Result := barExito
      else if ResStr = 'INTEGRADO' then
        Result := barIntegrado
      else
        Result := barError;

    except
      on E: Exception do
      begin
        // Si existe trigger con SIGNAL 'INTEGRADO: ...' lo traducimos:
        if Pos('INTEGRADO:', UpperCase(E.Message)) > 0 then
        begin
          Result := barIntegrado;
          ADetalle := E.Message;
        end
        else
        begin
          Result := barError;
          ADetalle := E.ClassName + ': ' + E.Message;
        end;
      end;
    end;

  finally
    Q.Free;
  end;
end;

end.

