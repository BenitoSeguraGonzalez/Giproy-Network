unit uNotasAPUEDT;

interface

uses
  System.SysUtils, System.Types, System.UITypes, System.Classes,
  System.Variants, FMX.Types,
  FMX.Controls, FMX.Forms, FMX.Graphics, FMX.Dialogs, Uni, FMX.TMSBaseControl,
  FMX.TMSMemo,
  FMX.Layouts, FMX.Controls.Presentation, FMX.StdCtrls, FMX.Objects,
  FMX.TMSFNCTypes,
  FMX.TMSFNCUtils, FMX.TMSFNCGraphics, FMX.TMSFNCGraphicsTypes,
  FMX.TMSFNCCustomControl,
  FMX.TMSFNCWebBrowser, FMX.TMSFNCCustomWEBControl, FMX.TMSFNCMemo;

type
  dat_Base_nota = record
    codUnicoNota: string;
    codAPU: string;
    nuevo: Boolean;
  end;

type
  TfrmNotasAPUEDT = class(TForm)
    rect_2: TRectangle;
    lbl_Fecha: TLabel;
    lbl_Seccion: TLabel;
    lyt_1: TLayout;
    rect_Guardar: TRectangle;
    lbl_GuardarNota: TLabel;
    rect_Salir: TRectangle;
    lbl_Salir: TLabel;
    TextoNota: TTMSFNCMemo;
    rect_CopiaraTodasAPUS: TRectangle;
    lbl_CopiarTodasAPUS: TLabel;
    rect_BorrarNota: TRectangle;
    lbl_BorrarNota: TLabel;
    rect_background: TRectangle;
    procedure lbl_SalirClick(Sender: TObject);
    procedure FormCreate(Sender: TObject);
    procedure lbl_GuardarNotaClick(Sender: TObject);
    procedure lbl_CopiarTodasAPUSClick(Sender: TObject);
    procedure lbl_BorrarNotaClick(Sender: TObject);
    procedure lbl_FechaMouseDown(Sender: TObject; Button: TMouseButton; Shift:
      TShiftState; X, Y: Single);
  private
    { Private declarations }
    SQLInsertar: string;
    SQLUpdatar: string;
    SQLBorrar: string;
    procedure EjecutarSQL(const ASQL: string; AParams: array of const);
  public
    { Public declarations }
    datosNota: dat_Base_nota;
    procedure cargaNotaIni(codUnicoItems, codAPU: string);
  end;

var
  frmNotasAPUEDT: TfrmNotasAPUEDT;

implementation

{$R *.fmx}

uses
  DM_Presupuestos, DM1;

procedure TfrmNotasAPUEDT.EjecutarSQL(const ASQL: string; AParams: array of
  const);
var
  qry: TUniQuery;
  i: Integer;
begin
  qry := TUniQuery.Create(nil);
  try
    qry.Connection := DModule_1.con2;
    qry.SQL.Text := ASQL;

    for i := 0 to High(AParams) div 2 do
      qry.ParamByName(string(AParams[i * 2].VAnsiString)).Value :=
        Variant(AParams[i * 2 + 1].VVariant^);

    if not DModule_1.con2.InTransaction then
      DModule_1.con2.StartTransaction;

    try
      qry.ExecSQL;
      DModule_1.con2.Commit;
    except
      DModule_1.con2.Rollback;
      raise;
    end;

  finally
    qry.Free;
  end;
end;

procedure TfrmNotasAPUEDT.cargaNotaINI(codUnicoItems, codAPU: string);
begin
  with DMPresupuesto.unqryNotas do
  begin
    close;
    ParamByName('codBase').AsString := base_activa.codBase;
    ParamByName('codPresupuesto').AsString := codProyecto;
    ParamByName('revision').AsString := revision;
    ParamByName('codUnicoItems').AsString := codUnicoItems;
    ParamByName('codAPU').AsString := codAPU;
    Open;
    if not FieldByName('notas').IsNull then
      TextoNota.Text := FieldByName('notas').AsString
    else
      TextoNota.Text := '';
  end;
end;

procedure TfrmNotasAPUEDT.FormCreate(Sender: TObject);
begin
  SQLInsertar :=
    'INSERT INTO presupuestos_notas ' +
    'SET ' +
    '  codBase = :codBase, ' +
    '  codPresupuesto = :codPresupuesto, ' +
    '  Revision = :Revision, ' +
    '  codAPU = :codAPU, ' +
    '  codUnicoItems = :codUnicoItems, ' +
    '  fechahora = :fechaHora, ' +
    '  notas = :notas';
  SQLUpdatar :=
    'UPDATE presupuestos_notas  ' +
    'SET ' +
    '  fechahora = :fechaHora, ' +
    '  notas = :notas  ' +
    'WHERE  ' +
    '  codBase = :codBase ' +
    '  AND codPresupuesto = :codPresupuesto ' +
    '  AND Revision = :Revision ' +
    '  AND codAPU = :codAPU ' +
    '  AND codUnicoItems = :codUnicoItems';
  SQLBorrar :=
    'DELETE FROM presupuestos_notas ' +
    'WHERE ' +
    '  codBase = :codBase ' +
    '  AND codPresupuesto = :codPresupuesto ' +
    '  AND Revision = :Revision ' +
    '  AND codAPU = :codAPU ' +
    '  AND codUnicoItems = :codUnicoItems';
end;

procedure TfrmNotasAPUEDT.lbl_SalirClick(Sender: TObject);
begin
  modalresult := mrOK;
end;

procedure TfrmNotasAPUEDT.lbl_BorrarNotaClick(Sender: TObject);
begin

  EjecutarSQL(
    SQLBorrar,
    [
      'codbase', base_activa.codBase,
      'codPresupuesto', codProyecto,
      'revision', revision,
      'codAPU', datosNota.codAPU,
      'codUnicoItems', datosNota.codUnicoNota
      ]
    );

  ModalResult := mrOK;

end;

procedure TfrmNotasAPUEDT.lbl_CopiarTodasAPUSClick(Sender: TObject);
begin
  if not DModule_1.con2.InTransaction then
    DModule_1.con2.StartTransaction;
  try

    with DMPresupuesto.StoreProc_NotaenAPUS do
    begin
      Close;
      ParamByName('codbase').AsString := base_activa.codBase;
      ParamByName('codPresupuesto').AsString := codProyecto;
      ParamByName('revision').AsString := revision;
      ParamByName('codAPU').AsString := datosNota.codAPU;
      ParamByName('inotas').AsString := TextoNota.Text;
      Execute;
    end;

    DModule_1.con2.Commit;

  except
    DModule_1.con2.Rollback;
    raise;
  end;
end;

procedure TfrmNotasAPUEDT.lbl_FechaMouseDown(Sender: TObject; Button:
  TMouseButton; Shift:
  TShiftState; X, Y: Single);
begin
  Self.StartWindowDrag;
end;

procedure TfrmNotasAPUEDT.lbl_GuardarNotaClick(Sender: TObject);
var
  sqlText: string;
begin

  { Si la nota está vacía }
  if Trim(TextoNota.Text) = '' then
  begin
    if not datosNota.nuevo then
      lbl_BorrarNotaClick(nil);
    Exit;
  end;

  { Determinar si es INSERT o UPDATE }
  if datosNota.nuevo then
    sqlText := SQLInsertar
  else
    sqlText := SQLUpdatar;

  EjecutarSQL(
    sqlText,
    [
      'codbase', base_activa.codBase,
      'codPresupuesto', codProyecto,
      'revision', revision,
      'codAPU', datosNota.codAPU,
      'codUnicoItems', datosNota.codUnicoNota,
      'notas', TextoNota.Text,
      'fechaHora', Now
      ]
    );

  ModalResult := mrOK;

end;

end.

