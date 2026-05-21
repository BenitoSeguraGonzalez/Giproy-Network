unit uEditorUnidades;

interface

uses
  System.SysUtils, System.Types, System.UITypes, System.Classes, System.Variants, FMX.Types,
  FMX.Controls, FMX.Forms, FMX.Graphics, FMX.Dialogs, FMX.Edit, FMX.Controls.Presentation,
  System.StrUtils, FMX.StdCtrls, FMX.Objects, FMX.Layouts, Uni;

type
  Tfrm_editorUnidades = class(TForm)
    lyt_Background: TLayout;
    lyt_Body: TLayout;
    rect_2: TRectangle;
    lyt1: TLayout;
    lyt2: TLayout;
    rect_Aceptar: TRectangle;
    lbl1: TLabel;
    lyt: TLayout;
    rect_Cancelar: TRectangle;
    lbl2: TLabel;
    lyt3: TLayout;
    lyt7: TLayout;
    rect_Icono: TRectangle;
    lyt4: TLayout;
    lyt5: TLayout;
    lbl_Pregunta: TLabel;
    lyt6: TLayout;
    edt_Nombre: TEdit;
    lyt_header: TLayout;
    rect_1: TRectangle;
    lbl_banner1: TLabel;
    lyt8: TLayout;
    edt_Unidad: TEdit;
    lbl_Pregunta1: TLabel;
    procedure rect_CancelarClick(Sender: TObject);
    procedure rect_AceptarClick(Sender: TObject);
  private
    { Private declarations }
    procedure UpdataUnidadMedida();
    procedure insertaUnidadMedida();
  public
    { Public declarations }
    old_descripcion: string;
    old_descripcion_completa: string;
    subcategoria: string;
    modoTrabajo: integer;
  end;

var
  frm_editorUnidades: Tfrm_editorUnidades;

implementation

{$R *.fmx}

uses
  DM1;

procedure Tfrm_editorUnidades.insertaUnidadMedida;
var
  qry: TUniQuery;
  vDesc, vDescComp: string;
  vSubCat: Integer;
begin
  vDesc := Trim(edt_Unidad.Text);
  vDescComp := Trim(edt_Nombre.Text);

  if vDesc = '' then
    raise Exception.Create('La unidad no puede estar vacía');

  if not TryStrToInt(Trim(subcategoria), vSubCat) then
    raise Exception.Create('Subcategoría inválida');

  qry := TUniQuery.Create(nil);
  try
    qry.Connection := DModule_1.con2;

    // --- INICIO TRANSACCIÓN ---
    if not qry.Connection.InTransaction then
      qry.Connection.StartTransaction;
    try

      // 1) Verificar existencia
      qry.Close;
      qry.SQL.Text :=
        'SELECT 1 ' +
        'FROM unidades ' +
        'WHERE LOWER(descripcion) = :descripcion ' +
        '  AND subcategoria = :subcategoria ' +
        'LIMIT 1';

      qry.ParamByName('descripcion').AsString := LowerCase(vDesc);
      qry.ParamByName('subcategoria').AsInteger := vSubCat;
      qry.Open;

      if not qry.IsEmpty then
      begin
        MuestraMensajeGiproy('Advertencia', 'Ya existe la unidad de medida');
        exit;
      end;

      // 2) Insertar
      qry.Close;
      qry.SQL.Text :=
        'INSERT INTO unidades ' +
        '(descripcion, descripcion_completa, subcategoria, fechaHora) ' +
        'VALUES ' +
        '(:descripcion, :descripcion_completa, :subcategoria, :fechaHora)';

      qry.ParamByName('descripcion').AsString := LowerCase(vDesc);
      qry.ParamByName('descripcion_completa').AsString := vDescComp;
      qry.ParamByName('subcategoria').AsInteger := vSubCat;
      qry.ParamByName('fechaHora').AsDateTime := Now;

      qry.ExecSQL;

      // --- TODO OK ---
      qry.Connection.Commit;
      ModalResult := mrOk;

    except
      on E: Exception do
      begin
        // --- CUALQUIER ERROR = ROLLBACK ---
        if qry.Connection.InTransaction then
          qry.Connection.Rollback;

        MuestraMensajeGiproy('Error', E.Message);
      end;
    end;

  finally
    qry.Free;
  end;
end;

procedure Tfrm_editorUnidades.UpdataUnidadMedida;
var
  qry: TUniQuery;
  vNewDesc, vNewDescComp: string;
  vOldDesc: string;
  vSubCat: Integer;
  vNewDescNorm: string;
begin
  vNewDesc := Trim(edt_Unidad.Text);
  vNewDescComp := Trim(edt_Nombre.Text);
  vOldDesc := LowerCase(Trim(old_descripcion)); // asegúrate que old_descripcion venga correcto

  if vNewDesc = '' then
  begin
    MuestraMensajeGiproy('Error', 'La unidad no puede estar vacía.');
    Exit;
  end;

  if not TryStrToInt(Trim(subcategoria), vSubCat) then
  begin
    MuestraMensajeGiproy('Error', 'Subcategoría inválida.');
    Exit;
  end;

  vNewDescNorm := LowerCase(vNewDesc);

  qry := TUniQuery.Create(nil);
  try
    qry.Connection := DModule_1.con2;

    // -------- TRANSACCIÓN: todo o nada --------
    if not qry.Connection.InTransaction then
      qry.Connection.StartTransaction;
    try
      // 1) Verificar que EXISTE la fila a editar (bloquea fila para evitar carreras)
      qry.Close;
      qry.SQL.Text :=
        'SELECT 1 ' +
        'FROM unidades ' +
        'WHERE LOWER(descripcion) = :descripcion_old ' +
        '  AND subcategoria = :subcategoria ' +
        'LIMIT 1 ' +
        'FOR UPDATE';

      qry.ParamByName('descripcion_old').AsString := vOldDesc;
      qry.ParamByName('subcategoria').AsInteger := vSubCat;
      qry.Open;

      if qry.IsEmpty then
      begin
        MuestraMensajeGiproy('Advertencia', 'No existe la unidad de medida.');
        exit;
      end;

      // 2) Si cambias el código/descripcion, validar que no choque con otra existente
      if vOldDesc <> vNewDescNorm then
      begin
        qry.Close;
        qry.SQL.Text :=
          'SELECT 1 ' +
          'FROM unidades ' +
          'WHERE LOWER(descripcion) = :descripcion_new ' +
          '  AND subcategoria = :subcategoria ' +
          'LIMIT 1';

        qry.ParamByName('descripcion_new').AsString := vNewDescNorm;
        qry.ParamByName('subcategoria').AsInteger := vSubCat;
        qry.Open;

        if not qry.IsEmpty then
        begin
          MuestraMensajeGiproy('Advertencia', 'Ya existe otra unidad con esa descripción.');
          exit;
        end;
      end;

      // 3) UPDATE (SQL correcto: comas y espacios)
      qry.Close;
      qry.SQL.Text :=
        'UPDATE unidades ' +
        'SET ' +
        '  descripcion = :descripcion, ' +
        '  descripcion_completa = :descripcion_completa, ' +
        '  fechaHora = :fechaHora ' +
        'WHERE ' +
        '  LOWER(descripcion) = :descripcion_old ' +
        '  AND subcategoria = :subcategoria';

      qry.ParamByName('descripcion').AsString := vNewDescNorm;
      qry.ParamByName('descripcion_completa').AsString := vNewDescComp;
      qry.ParamByName('fechaHora').AsDateTime := Now;
      qry.ParamByName('descripcion_old').AsString := vOldDesc;
      qry.ParamByName('subcategoria').AsInteger := vSubCat;

      qry.ExecSQL;

      // Si por alguna razón no afectó filas, lo tratas como error (consistencia)
      if qry.RowsAffected <> 1 then
      begin
        MuestraMensajeGiproy('Error', 'No se pudo actualizar (filas afectadas: ' + qry.RowsAffected.ToString
          +
          ').');
        exit;
      end;

      qry.Connection.Commit;
      ModalResult := mrOk;

    except
      on E: Exception do
      begin
        if qry.Connection.InTransaction then
          qry.Connection.Rollback;

        MuestraMensajeGiproy('Error', E.Message);
      end;
    end;

  finally
    qry.Free;
  end;
end;

procedure Tfrm_editorUnidades.rect_AceptarClick(Sender: TObject);
begin
  case modoTrabajo of
    1:
      begin
        insertaUnidadMedida;
      end;
    2:
      begin
        UpdataUnidadMedida;
      end;
  end;

end;

procedure Tfrm_editorUnidades.rect_CancelarClick(Sender: TObject);
begin
  ModalResult := mrCancel;
end;

end.

