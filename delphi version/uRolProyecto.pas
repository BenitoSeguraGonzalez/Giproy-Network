unit uRolProyecto;

interface

uses
  System.SysUtils, System.Types, System.UITypes, System.Classes, System.Variants, FMX.Types,
  FMX.Controls, FMX.Forms, FMX.Graphics, FMX.Dialogs, FMX.Effects, Uni, FMX.DialogService, FMX.Edit,
  FMX.Objects, FMX.Controls.Presentation, FMX.TMSTreeView, FMX.StdCtrls, FMX.Layouts, FMX.ListBox,
  FMX.TMSFNCTypes, FMX.TMSFNCUtils, FMX.TMSFNCGraphics, FMX.TMSFNCGraphicsTypes,
  FMX.TMSFNCCustomControl, FMX.TMSFNCTreeViewBase, FMX.TMSFNCTreeViewData, FMX.TMSFNCCustomTreeView,
  FMX.TMSFNCTreeView, FMX.Menus, uRectFillBitmapColoriz;

type
  TfrmRolProyecto = class(TForm)
    lyt_Background: TLayout;
    lyt_Body: TLayout;
    rect_2: TRectangle;
    lyt_3: TLayout;
    rect_3: TRectangle;
    lyt_6: TLayout;
    rect_4: TRectangle;
    lyt_DatosGenerales: TLayout;
    lyt_9: TLayout;
    lyt_7: TLayout;
    lbl_banner2: TLabel;
    lyt_footer: TLayout;
    rect_Aceptar: TRectangle;
    iGlow_Aceptar: TInnerGlowEffect;
    lbl_adicional: TLabel;
    lbl_Modo: TLabel;
    lyt_header: TLayout;
    rect_1: TRectangle;
    lbl_banner1: TLabel;
    lyt_1: TLayout;
    rect_12: TRectangle;
    Shadow_1: TShadowEffect;
    cbb_RolesStakes: TComboBox;
    rct_1: TRectangle;
    rct_2: TRectangle;
    rect_5: TRectangle;
    procedure rect_AceptarMouseLeave(Sender: TObject);
    procedure rect_AceptarMouseEnter(Sender: TObject);
    procedure rct_1Click(Sender: TObject);
    procedure rct_2Click(Sender: TObject);
    procedure rect_5Click(Sender: TObject);
    procedure rect_AceptarClick(Sender: TObject);
    procedure rct_1MouseEnter(Sender: TObject);
    procedure rct_1MouseLeave(Sender: TObject);
    procedure rect_5MouseLeave(Sender: TObject);
    procedure rect_5MouseEnter(Sender: TObject);
    procedure rct_2MouseEnter(Sender: TObject);
    procedure rct_2MouseLeave(Sender: TObject);
  private
    { Private declarations }
    procedure editarolesStake(const descripcionAntigua, DescripcionNueva: string);
  public
    { Public declarations }
    nodoSeleccionado: TTMSFNCTreeViewNode;
    procedure BorrarRol(const valor: string);
    procedure adicionaRol(const RolAdicionar: string);
  end;

var
  frmRolProyecto: TfrmRolProyecto;

implementation

{$R *.fmx}

uses
  uMain, DM1;

procedure TfrmRolProyecto.BorrarRol(const Valor: string);
var
  qry: TUniQuery;
begin
  // No permitir borrar "Sin Asignar"
  if SameText(Trim(Valor), 'Sin Asignar') then
    Exit;

  qry := TUniQuery.Create(nil);
  try
    qry.Connection := DModule_1.con2;

    qry.SQL.Text :=
      'DELETE FROM RolesStakes ' +
      'WHERE descripcion = :descripcion ' +
      '  AND id <> 1';

    qry.ParamByName('descripcion').AsString := Trim(Valor);
    qry.ExecSQL;

  finally
    qry.Free;
    populaRolStake(Self);
    cbb_RolesStakes.ItemIndex := 0;
  end;
end;

procedure TfrmRolProyecto.rct_1Click(Sender: TObject);
var
  Avalue: string;
begin
  AValue := hacerPregunta('¿Rol para adicionar?', 'Nuevo Rol', '1', '', nil);
  if Avalue = '' then
    exit;
  adicionaRol(AValue);
  populaRolStake(Self);
end;

procedure TfrmRolProyecto.rct_1MouseEnter(Sender: TObject);
begin
  TRectFillBitmapColorizer.Apply(rct_1, $FFF39200);
end;

procedure TfrmRolProyecto.rct_1MouseLeave(Sender: TObject);
begin
  TRectFillBitmapColorizer.Restore(rct_1);
end;

procedure TfrmRolProyecto.rct_2Click(Sender: TObject);
var
  rol: string;
  valor: string;
begin
  rol := cbb_RolesStakes.Items[cbb_RolesStakes.ItemIndex];
  rol := LowerCase(rol);
  if (rol <> 'contratante') and (rol <> 'contratista') and (rol <> 'fiscalizador') and (rol <>
    'administrador') then
  begin
    if realizarPreguntaSiNo('¿Borrar Rol?') <> mrOK then
      Exit;

    valor := cbb_RolesStakes.Items[cbb_RolesStakes.ItemIndex];
    BorrarRol(valor);
  end
  else
  begin
    MuestraMensajeGiproy('Advertencia', 'Cargo requerido, no es posible eliminar.');
  end;
end;

procedure TfrmRolProyecto.rct_2MouseEnter(Sender: TObject);
begin
  TRectFillBitmapColorizer.Apply(rct_2, $FFF39200);
end;

procedure TfrmRolProyecto.rct_2MouseLeave(Sender: TObject);
begin
  TRectFillBitmapColorizer.Restore(rct_2);
end;

procedure TfrmRolProyecto.adicionaRol(const RolAdicionar: string);
var
  qry: TUniQuery;
begin
  qry := TUniQuery.Create(nil);
  try
    qry.Connection := DModule_1.con2;

    // 1. Garantizar el rol base
    qry.SQL.Text :=
      'INSERT IGNORE INTO RolesStakes (id, descripcion) ' +
      'VALUES (1, ''Sin Asignar'')';
    qry.ExecSQL;

    // 2. Insertar el rol solicitado (si no existe)
    if Trim(RolAdicionar) <> '' then
    begin
      qry.SQL.Text :=
        'INSERT IGNORE INTO RolesStakes (descripcion) ' +
        'VALUES (:descripcion)';
      qry.ParamByName('descripcion').AsString := RolAdicionar;
      qry.ExecSQL;
    end;

  finally
    qry.Free;
  end;
end;

procedure TfrmRolProyecto.rect_5Click(Sender: TObject);
var
  descripcionAntigua: string;
begin
  descripcionAntigua := cbb_RolesStakes.Items[cbb_RolesStakes.ItemIndex];
  InputBox('Editar Rol', 'Rol: ', descripcionAntigua,
    procedure(const AResult: TModalResult; const AValue: string)
    var
      descripcionAntigua: string;
    begin
      if AValue <> '' then
      begin
        descripcionAntigua := cbb_RolesStakes.Items[cbb_RolesStakes.ItemIndex];
        editarolesStake(descripcionAntigua, AValue);
        populaRolStake(Self);
      end;
    end);
end;

procedure TfrmRolProyecto.rect_5MouseEnter(Sender: TObject);
begin
  TRectFillBitmapColorizer.Apply(rect_5, $FFF39200);
end;

procedure TfrmRolProyecto.rect_5MouseLeave(Sender: TObject);
begin
  TRectFillBitmapColorizer.Restore(rect_5);
end;

procedure TfrmRolProyecto.editarolesStake(const DescripcionAntigua, DescripcionNueva: string);
var
  qry: TUniQuery;
begin
  // No permitir valores vacíos
  if Trim(DescripcionNueva) = '' then
    Exit;

  // No permitir modificar "Sin Asignar"
  if SameText(Trim(DescripcionAntigua), 'Sin Asignar') then
    Exit;

  qry := TUniQuery.Create(nil);
  try
    qry.Connection := DModule_1.con2;

    qry.SQL.Text :=
      'UPDATE RolesStakes ' +
      'SET descripcion = :NuevaDescripcion ' +
      'WHERE descripcion = :OldDescripcion ' +
      '  AND id <> 1';

    qry.ParamByName('NuevaDescripcion').AsString := Trim(DescripcionNueva);
    qry.ParamByName('OldDescripcion').AsString := Trim(DescripcionAntigua);

    qry.ExecSQL;

  finally
    qry.Free;
  end;
end;

procedure TfrmRolProyecto.rect_AceptarClick(Sender: TObject);
begin
  DaSeleccionRolesStake();
  ModalResult := mrOk;
end;

procedure TfrmRolProyecto.rect_AceptarMouseEnter(Sender: TObject);
begin
  iGlow_Aceptar.Enabled := True;
end;

procedure TfrmRolProyecto.rect_AceptarMouseLeave(Sender: TObject);
begin
  iGlow_Aceptar.Enabled := False;
end;

end.

