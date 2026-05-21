unit uIndirectosUsuarios;

interface

uses
  System.SysUtils, System.Types, System.UITypes, System.Classes,
  System.Variants,
  FMX.Types, FMX.Controls, FMX.Forms, FMX.Graphics, FMX.Dialogs,
  FMX.TMSFNCTypes,
  FMX.TMSFNCUtils, FMX.TMSFNCGraphics, FMX.TMSFNCGraphicsTypes,
  FMX.DialogService, Uni, FMX.TMSFNCGridCell, FMX.TMSFNCGridOptions,
  FMX.Effects,
  FMX.TMSFNCCustomControl, FMX.TMSFNCCustomScrollControl,
  FMX.TMSFNCGridData,
  FMX.TMSFNCCustomGrid, FMX.TMSFNCGrid, FMX.ListBox, FMX.Layouts,
  FMX.Objects,
  FMX.Controls.Presentation, FMX.StdCtrls, FMX.Edit;

type
  TfrmIndirectosUsuarios = class(TForm)
    lyt_background: TLayout;
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
    lyt_194: TLayout;
    lyt_1: TLayout;
    rect_btnAdicionarConcepto: TRectangle;
    bevel_btnAdicionarConcepto: TBevelEffect;
    rect_btnBorrarConcepto: TRectangle;
    bevel_1: TBevelEffect;
    lbl_4: TLabel;
    rect_12: TRectangle;
    bevel_12: TBevelEffect;
    grid_CostosIndirectosUsuarios: TTMSFNCGrid;
    lyt_7: TLayout;
    lbl_2: TLabel;
    lyt_footer: TLayout;
    rect_Cancelar: TRectangle;
    iGlow_Cancelar: TInnerGlowEffect;
    rect_Aceptar: TRectangle;
    iGlow_Aceptar: TInnerGlowEffect;
    lbl_modo: TLabel;
    lyt_header: TLayout;
    rect_1: TRectangle;
    lbl_1: TLabel;
    edt_Filtro: TEdit;
    rect_btnEditarConcepto: TRectangle;
    bevel_11: TBevelEffect;
    lbl_5: TLabel;
    procedure rect_btnAdicionarConceptoMouseUp(Sender: TObject;
      Button: TMouseButton; Shift: TShiftState; X, Y: Single);
    procedure rect_btnBorrarConceptoMouseUp(Sender: TObject;
      Button: TMouseButton; Shift: TShiftState; X, Y: Single);
    procedure edt_FiltroChangeTracking(Sender: TObject);
    procedure rect_AceptarMouseUp(Sender: TObject;
      Button: TMouseButton; Shift: TShiftState; X, Y: Single);
    procedure grid_CostosIndirectosUsuariosDblClick
      (Sender: TObject);
    procedure rect_btnEditarConceptoMouseUp(Sender: TObject;
      Button: TMouseButton; Shift: TShiftState; X, Y: Single);
  private
    { Private declarations }
  public
    { Public declarations }
    procedure PopulaIndirectosUsuario();
    procedure adicionaConceptoIndirectos(concepto: string);
    procedure borrarCuentaIndirectos(concepto: string);
  end;

var
  frmIndirectosUsuarios: TfrmIndirectosUsuarios;

implementation

{$R *.fmx}

uses
  DM1, uPorcentajesIndirectos;

procedure TfrmIndirectosUsuarios.borrarCuentaIndirectos(concepto: string);
var
  qry: TUniQuery;
  tmpstr: string;
  id: string;
  X: integer;
begin
  qry := TUniQuery.Create(nil);
  try
    with qry do
    begin
      Connection := DModule_1.con2;
      close;
      sql.Clear;
      sql.Add('select * from conceptosIndirectos where CodigoCuenta='
        + QuotedStr(concepto) +
        ' and usuario=True and codPadre=' + QuotedStr('7.1'));
      Prepare;
      ExecSQL;
      tmpstr := FieldByName('CodigoCuenta').AsString;
      id := FieldByName('id').AsString;
      if tmpstr <> '' then
      begin
        close;
        sql.Clear;
        sql.Add('delete from conceptosIndirectos where CodigoCuenta='
          + QuotedStr(concepto) +
          ' and usuario=True and codPadre=' +
          QuotedStr('7.1'));
        Prepare;
        ExecSQL;
        for X := 1 to frmPorcentajesIndirectos.
          grid_CostosIndirectosPresupuesto.
          RowCount - 1 do
        begin
          if frmPorcentajesIndirectos.
            grid_CostosIndirectosPresupuesto.Cells
            [4, X] = id then
          begin
            frmPorcentajesIndirectos.
              grid_CostosIndirectosPresupuesto.
              DeleteRow(X);
          end;
        end;
        frmPorcentajesIndirectos.renumeraGrid();
        ShowMessage('Cuenta Eliminada')
      end
      else
      begin
        ShowMessage
          ('Cuenta Maestra no permitada su eliminación');
      end;
    end;
  finally
    qry.Free;
  end;
end;

procedure TfrmIndirectosUsuarios.edt_FiltroChangeTracking(Sender: TObject);
var
  fltr: TTMSFNCGridFilterData;
begin
  grid_CostosIndirectosUsuarios.UnHideRowsAll;
  grid_CostosIndirectosUsuarios.RemoveFilters;
  fltr := grid_CostosIndirectosUsuarios.Filter.Add;
  fltr.Column := 1;
  fltr.CaseSensitive := false;
  fltr.Condition := '*' + edt_Filtro.Text + '*';
  grid_CostosIndirectosUsuarios.ApplyFilter;
end;

procedure TfrmIndirectosUsuarios.grid_CostosIndirectosUsuariosDblClick
  (Sender: TObject);
var
  posItem: integer;
  cuentaAdicionar: string;
begin
  posItem := grid_CostosIndirectosUsuarios.Selection.StartRow;
  if posItem > 0 then
  begin
    cuentaAdicionar := grid_CostosIndirectosUsuarios.Cells
      [1, posItem];
    frmPorcentajesIndirectos.AdicionaCuentaIndirectos
      (cuentaAdicionar);
  end;
end;

procedure TfrmIndirectosUsuarios.PopulaIndirectosUsuario;
var
  qry: TUniQuery;
  X: integer;
begin
  qry := TUniQuery.Create(nil);
  grid_CostosIndirectosUsuarios.ClearNormalCells;
  grid_CostosIndirectosUsuarios.Cells[0, 0] := '#';
  grid_CostosIndirectosUsuarios.Cells[1, 0] := 'Codigo Cuenta';
  grid_CostosIndirectosUsuarios.RowCount := 1;
  try
    with qry do
    begin
      Connection := DModule_1.con2;
      close;
      sql.Clear;
      sql.Add('select * from conceptosIndirectos where codPadre='
        + QuotedStr('7.1'));
      Prepare();
      ExecSQL;
      X := 1;
      while not Eof do
      begin
        SetLength(listaPorcentajeUsado, X);
        grid_CostosIndirectosUsuarios.RowCount := X + 1;
        grid_CostosIndirectosUsuarios.Cells[0, X] :=
          IntToStr(X);
        grid_CostosIndirectosUsuarios.Cells[1, X] :=
          FieldByName('CodigoCuenta').AsString;
        grid_CostosIndirectosUsuarios.Cells[2, X] :=
          FieldByName('id').AsString;
        listaPorcentajeUsado[X - 1].descripcion :=
          FieldByName('CodigoCuenta').AsString;
        listaPorcentajeUsado[X - 1].id :=
          FieldByName('id').AsString;
        inc(X);
        Next;
      end;
    end;
  finally
    qry.Free;
  end;
end;

procedure TfrmIndirectosUsuarios.adicionaConceptoIndirectos(concepto: string);
var
  qry: TUniQuery;
  tmpstr: string;
  X: integer;
begin
  qry := TUniQuery.Create(nil);
  try
    with qry do
    begin
      Connection := DModule_1.con2;
      close;
      sql.Clear;
      sql.Add('select * from conceptosIndirectos where CodigoCuenta='
        + QuotedStr(concepto));
      Prepare;
      ExecSQL;
      tmpstr := FieldByName('CodigoCuenta').AsString;
      if tmpstr = '' then
      begin
        close;
        sql.Clear;
        sql.Add('insert into conceptosIndirectos (codigoCuenta, codPadre, fijo, usuario) VALUES (:codigoCuenta, :codPadre, :fijo, :usuario)');
        Prepare;
        ParamByName('codigoCuenta').AsString :=
          concepto;
        ParamByName('codPadre').AsString := '7.1';
        ParamByName('fijo').AsBoolean := false;
        ParamByName('usuario').AsBoolean := True;
        ExecSQL;
        ShowMessage
          ('Cuenta adicionadad a Indirectos Personalizados por Usuario');
      end
      else
      begin
        ShowMessage('Cuenta ya existente.');
      end;
    end;

  finally
    qry.Free;
  end;

end;

procedure TfrmIndirectosUsuarios.rect_AceptarMouseUp(Sender: TObject;
  Button: TMouseButton; Shift: TShiftState; X, Y: Single);
begin
  iGlow_Aceptar.Enabled := false;
  ModalResult := mrOk;
end;

procedure TfrmIndirectosUsuarios.rect_btnAdicionarConceptoMouseUp
  (Sender: TObject; Button: TMouseButton; Shift: TShiftState; X, Y: Single);
begin
  bevel_btnAdicionarConcepto.Enabled := True;
  TDialogService.PreferredMode := TDialogService.TPreferredMode.platform;
  InputBox('Adicionar Cuenta Indirectos', 'Cuenta:', '',
    procedure(const AResult: TModalResult; const AValue: string)
    begin
      if AValue <> '' then
      begin
        adicionaConceptoIndirectos(AValue);
        PopulaIndirectosUsuario;
      end;
    end);
end;

procedure TfrmIndirectosUsuarios.rect_btnBorrarConceptoMouseUp(Sender: TObject;
  Button: TMouseButton; Shift: TShiftState; X, Y: Single);
var
  posItem: integer;
  tmpstr: string;

begin
  posItem := grid_CostosIndirectosUsuarios.Selection.StartRow;
  tmpstr := grid_CostosIndirectosUsuarios.Cells[1, posItem];
  if realizarPreguntaSiNo('¿Desea borrar la cuenta ' + UpperCase(tmpstr) +
    ' de la Base de Indirectos?') <> mrOK then
    Exit;
  posItem := grid_CostosIndirectosUsuarios.Selection.StartRow;
  tmpstr := grid_CostosIndirectosUsuarios.Cells[1, posItem];
  borrarCuentaIndirectos(tmpstr);
  grid_CostosIndirectosUsuarios.DeleteRow(posItem);
end;

procedure TfrmIndirectosUsuarios.rect_btnEditarConceptoMouseUp(Sender: TObject;
  Button: TMouseButton; Shift: TShiftState; X, Y: Single);
var
  posItem: integer;
  valor: string;
begin
  posItem := grid_CostosIndirectosUsuarios.Selection.StartRow;
  if posItem > 0 then
  begin
    valor := grid_CostosIndirectosUsuarios.Cells[1, posItem];
    TDialogService.PreferredMode :=
      TDialogService.TPreferredMode.platform;
    InputBox('Cuenta/Paquete', 'Descripción:', valor,
      procedure(const AResult: TModalResult;
        const AValue: string)
      var
        qry: TUniQuery;
        posItem: integer;
        id: string;
        i: integer;
        tmpstr: string;
        ARow: integer;
      begin
        if AValue <> '' then
        begin
          qry := TUniQuery.Create(nil);
          ARow := grid_CostosIndirectosUsuarios.
            Selection.StartRow;
          try
            with qry do
            begin
              id := grid_CostosIndirectosUsuarios.
                Cells[2, ARow];
              if id <> '' then
              begin
                Connection := DModule_1.con2;
                close;
                sql.Clear;
                sql.Add('update conceptosindirectos set codigoCuenta=:codigoCuenta where id='
                  + QuotedStr(id));
                Prepare;
                ParamByName('codigoCuenta').AsString
                  := AValue;
                ExecSQL;
                for i := 1 to frmPorcentajesIndirectos.
                  grid_CostosIndirectosPresupuesto.
                  RowCount do
                begin
                  tmpstr := frmPorcentajesIndirectos.
                    grid_CostosIndirectosPresupuesto.
                    Cells[4, i];
                  if tmpstr = id then
                  begin
                    frmPorcentajesIndirectos.
                      grid_CostosIndirectosPresupuesto.Cells
                      [1, i] := AValue;
                  end;
                end;
              end;
            end;
          finally
            qry.Free;
            PopulaIndirectosUsuario;
          end;
        end;

      end);
  end;
end;

end.

