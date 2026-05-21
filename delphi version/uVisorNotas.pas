unit uVisorNotas;

interface

uses
  System.SysUtils, System.Types, System.UITypes, System.Classes,
  System.Variants,
  FMX.Types, FMX.Controls, FMX.Forms, FMX.Graphics, FMX.Memo.Types,
  FMX.Dialogs,
  FMX.Effects, FMX.ScrollBox, FMX.Memo, FMX.Objects, FMX.DialogService,
  Uni,
  FMX.Controls.Presentation, FMX.StdCtrls, FMX.Layouts, FMX.ListBox,
  FMX.Edit,
  FMX.TMSFNCTypes, FMX.TMSFNCUtils, FMX.TMSFNCGraphics,
  FMX.TMSFNCGraphicsTypes,
  FMX.TMSFNCGridCell, FMX.TMSFNCGridOptions, FMX.TMSFNCCustomControl,
  System.StrUtils, FMX.TMSFNCCustomScrollControl, FMX.TMSFNCGridData,
  FMX.TMSFNCCustomGrid, FMX.TMSFNCGrid, FMX.TMSFNCTreeViewBase,
  FMX.TMSFNCTreeViewData, FMX.TMSFNCCustomTreeView, FMX.TMSFNCTreeView;

type
  TfrmVisorNotas = class(TForm)
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
    lyt_13: TLayout;
    lyt_7: TLayout;
    lbl_descripcion: TLabel;
    lyt_footer: TLayout;
    rect_Cancelar: TRectangle;
    iGlow_Cancelar: TInnerGlowEffect;
    lbl_adicional: TLabel;
    lbl_paquete: TLabel;
    lyt_header: TLayout;
    rect_1: TRectangle;
    lbl_banner1: TLabel;
    lyt_1: TLayout;
    edt_1: TEdit;
    rect_5: TRectangle;
    Trvw_VisorAnotaciones: TTMSFNCTreeView;
    rct_1: TRectangle;
    rct_2: TRectangle;
    rect_11: TRectangle;
    iGlow_Aceptar: TInnerGlowEffect;
    procedure FormClose(Sender: TObject; var Action: TCloseAction);
    procedure edt_1ChangeTracking(Sender: TObject);
    procedure rect_5Click(Sender: TObject);
    procedure rect_11MouseEnter(Sender: TObject);
    procedure rect_11MouseLeave(Sender: TObject);
    procedure rect_11Click(Sender: TObject);
  private
    FHayCambios: Boolean;
    procedure addnodoVisor(codEDT, CuentaEDT, descripcion, autor,
      fecha, anotacion: string);
    procedure guardarAnotaciones;
  public
    procedure mostrarNotasExt;
  end;

var
  frmVisorNotas: TfrmVisorNotas;

implementation

{$R *.fmx}

uses
  DM1, uMain;

{ --------------------------------------------------------------- }
procedure TfrmVisorNotas.addnodoVisor(
  codEDT, CuentaEDT, descripcion, autor,
  fecha, anotacion: string);
var
  nodoEDT, nodoDesc, nodoNota: TTMSFNCTreeViewNode;
begin
  nodoEDT := Trvw_VisorAnotaciones.AddNode;
  nodoEDT.Text[0] := codEDT;
  nodoEDT.Text[1] := CuentaEDT;

  nodoDesc := Trvw_VisorAnotaciones.AddNode(nodoEDT);
  nodoDesc.Text[0] := descripcion;

  nodoNota := Trvw_VisorAnotaciones.AddNode(nodoDesc);
  nodoNota.Text[1] := fecha;
  nodoNota.Text[2] := autor;
  nodoNota.Text[3] := anotacion;
end;

{ --------------------------------------------------------------- }
procedure TfrmVisorNotas.guardarAnotaciones;
var
  qry: TUniQuery;
begin
  qry := TUniQuery.Create(nil);
  try
    qry.Connection := DModule_1.con2;

    if not DModule_1.con2.InTransaction then
      DModule_1.con2.StartTransaction;

    try
      qry.SQL.Text :=
        'insert into Presupuestos_AnotacionesP2 ' +
        '(codBase, codPresupuesto, revision, DatosAnotaciones) ' +
        'values (:codBase, :codPresupuesto, :revision, :DatosAnotaciones)';

      qry.ParamByName('codBase').AsString := base_Activa.codBase;
      qry.ParamByName('codPresupuesto').AsString := codProyecto;
      qry.ParamByName('revision').AsString := revision;
      qry.ParamByName('DatosAnotaciones').AsString := 'CAMBIOS';

      qry.ExecSQL;
      DModule_1.con2.Commit;

      FHayCambios := False;

    except
      on E: Exception do
      begin
        DModule_1.con2.Rollback;
        raise;
      end;
    end;

  finally
    qry.Free;
  end;
end;

{ --------------------------------------------------------------- }
procedure TfrmVisorNotas.mostrarNotasExt;
var
  qry: TUniQuery;
begin
  FHayCambios := False;
  Trvw_VisorAnotaciones.ClearNodes;

  qry := TUniQuery.Create(nil);
  try
    qry.Connection := DModule_1.con2;
    qry.SQL.Text :=
      'select * from TAnotaciones order by codEDT, descripcion, fecha';
    qry.Open;

    while not qry.Eof do
    begin
      addnodoVisor(
        qry.FieldByName('codEDT').AsString,
        qry.FieldByName('paquete').AsString,
        qry.FieldByName('descripcion').AsString,
        qry.FieldByName('autor').AsString,
        FormatDateTime('dd/mm/yyyy hh:nn:ss',
          qry.FieldByName('fecha').AsDateTime),
        qry.FieldByName('nota').AsString
      );
      qry.Next;
    end;

  finally
    qry.Free;
  end;
end;

{ --------------------------------------------------------------- }
procedure TfrmVisorNotas.rect_11Click(Sender: TObject);
begin
  if FHayCambios then
    guardarAnotaciones;

  ModalResult := mrOk;
end;

procedure TfrmVisorNotas.rect_11MouseEnter(Sender: TObject);
begin
  iGlow_Aceptar.Enabled := True;
end;

procedure TfrmVisorNotas.rect_11MouseLeave(Sender: TObject);
begin
  iGlow_Aceptar.Enabled := False;
end;

{ --------------------------------------------------------------- }
procedure TfrmVisorNotas.FormClose(Sender: TObject;
  var Action: TCloseAction);
begin
  frmMain.iGlow_NotasGenerales.Enabled := False;
end;

{ --------------------------------------------------------------- }
procedure TfrmVisorNotas.edt_1ChangeTracking(Sender: TObject);
begin
  // búsqueda simple
end;

procedure TfrmVisorNotas.rect_5Click(Sender: TObject);
begin
  edt_1ChangeTracking(Sender);
end;

end.
