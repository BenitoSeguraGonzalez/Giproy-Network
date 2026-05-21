unit uStakes;

interface

uses
  System.SysUtils, System.Types, System.UITypes, System.Classes, System.Variants, FMX.Types,
  FMX.Controls, FMX.Forms, FMX.Graphics, FMX.Dialogs, Uni, System.StrUtils, FMX.TMSFNCTypes,
  FMX.TMSFNCUtils, FMX.TMSFNCGraphics, FMX.TMSFNCGraphicsTypes, FMX.TMSFNCGridCell,
  FMX.TMSFNCGridOptions, FMX.Effects, FMX.TMSFNCCustomControl, FMX.TMSFNCCustomScrollControl,
  FMX.TMSFNCGridData, FMX.TMSFNCCustomGrid, FMX.TMSFNCGrid, FMX.Objects, FMX.Controls.Presentation,
  FMX.StdCtrls, FMX.Layouts, FMX.Edit, FMX.ListBox, FMX.Platform;

type
  TfrmStakes = class(TForm)
    lyt_background: TLayout;
    lyt_Body: TLayout;
    rect_2: TRectangle;
    lyt_3: TLayout;
    rect_3: TRectangle;
    lyt_6: TLayout;
    rect_4: TRectangle;
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
    lyt_2: TLayout;
    GridPanelLayout1: TGridPanelLayout;
    lyt_13: TLayout;
    lbl_13: TLabel;
    edt_Nombre: TEdit;
    lyt_Apellidos: TLayout;
    lbl_14: TLabel;
    edt_Apellidos: TEdit;
    lyt_15: TLayout;
    lbl_15: TLabel;
    edt_direccion: TEdit;
    lyt_18: TLayout;
    lbl_17: TLabel;
    edt_localidad: TEdit;
    lyt_114: TLayout;
    lbl_112: TLabel;
    edt_provincia: TEdit;
    lyt_19: TLayout;
    lbl_18: TLabel;
    cbb_pais: TComboBox;
    lyt_115: TLayout;
    lbl_113: TLabel;
    edt_email: TEdit;
    lyt_113: TLayout;
    lbl_111: TLabel;
    edt_tfno: TEdit;
    lyt_110: TLayout;
    lbl_19: TLabel;
    edt_Titulacion: TEdit;
    lyt_116: TLayout;
    lbl_16: TLabel;
    edt_institucion: TEdit;
    procedure rect_CancelarClick(Sender: TObject);
    procedure rect_AceptarMouseEnter(Sender: TObject);
    procedure rect_AceptarMouseLeave(Sender: TObject);
    procedure rect_CancelarMouseLeave(Sender: TObject);
    procedure rect_CancelarMouseEnter(Sender: TObject);
    procedure rect_1MouseDown(Sender: TObject; Button: TMouseButton; Shift: TShiftState; X, Y: Single);
    procedure rect_AceptarClick(Sender: TObject);
    procedure FormCreate(Sender: TObject);
    procedure edt_tfnoExit(Sender: TObject);
    procedure edt_NombreKeyDown(Sender: TObject; var Key: Word;
      var KeyChar: WideChar; Shift: TShiftState);
    procedure edt_ApellidosKeyDown(Sender: TObject; var Key: Word;
      var KeyChar: WideChar; Shift: TShiftState);
    procedure edt_direccionKeyDown(Sender: TObject; var Key: Word;
      var KeyChar: WideChar; Shift: TShiftState);
    procedure edt_localidadKeyDown(Sender: TObject; var Key: Word;
      var KeyChar: WideChar; Shift: TShiftState);
    procedure cbb_paisKeyDown(Sender: TObject; var Key: Word;
      var KeyChar: WideChar; Shift: TShiftState);
    procedure edt_emailKeyDown(Sender: TObject; var Key: Word;
      var KeyChar: WideChar; Shift: TShiftState);
    procedure edt_tfnoKeyDown(Sender: TObject; var Key: Word;
      var KeyChar: WideChar; Shift: TShiftState);
    procedure edt_provinciaKeyDown(Sender: TObject; var Key: Word;
      var KeyChar: WideChar; Shift: TShiftState);
    procedure edt_TitulacionKeyDown(Sender: TObject; var Key: Word;
      var KeyChar: WideChar; Shift: TShiftState);
    procedure edt_institucionKeyDown(Sender: TObject; var Key: Word;
      var KeyChar: WideChar; Shift: TShiftState);
    procedure FormKeyDown(Sender: TObject; var Key: Word; var KeyChar: WideChar;
      Shift: TShiftState);
  private
    { Private declarations }
  private

    procedure guardaStake();
    procedure actualizaStake();
    procedure actualizaStakeAsignado();
    function compruebaDatosStake(): Boolean;
  public
    { Public declarations }
    IdFiscal: string;
    procedure limpiaNuevoStake();
    procedure cargaStake(idFiscalStake: string);
    function CrearIDStake(): string;
  end;

var
  frmStakes: TfrmStakes;

implementation

{$R *.fmx}

uses
  DM1, uMain;

function TfrmStakes.compruebaDatosStake: Boolean;
begin
  result := True;
  if edt_Titulacion.Text = '' then
    result := False;
  if edt_Nombre.Text = '' then
    result := False;
  if edt_Apellidos.Text = '' then
    result := False;
  if edt_email.Text = '' then
    result := False;
end;

function TfrmStakes.CrearIDStake: string;
var
  qry: TUniQuery;
  ultStake: string;
  valor: Integer;
begin
  qry := TUniQuery.Create(nil);
  try
    with qry do
    begin
      Connection := DModule_1.con2;
      Close;
      sql.Clear;
      sql.Add('select * from Stakeholders order by idFiscal');
      Prepare;
      ExecSQL;
      Last;
      ultStake := FieldByName('idFiscal').AsString;
      if ultStake = '' then
        ultStake := 'STK0000001'
      else
      begin
        ultStake := AnsiReplaceStr(ultStake, 'STK', '');
        valor := StrToIntDef(ultStake, 0);
        Inc(valor);
        ultStake := IntToStr(valor);
        ultStake := ponerCerosInicio(ultStake, 6);
        ultStake := 'STK' + ultStake;
      end;
    end;
  finally
    qry.Free;
    result := ultStake;
  end;
end;

procedure TfrmStakes.edt_ApellidosKeyDown(Sender: TObject; var Key: Word;
  var KeyChar: WideChar; Shift: TShiftState);
begin
  if ((key = vkReturn) or (key = vkTab)) and (edt_apellidos.Text.trim <> '') then
  begin
    Key := 0;
    KeyChar := #0;
    edt_direccion.SetFocus;
  end;
end;

procedure TfrmStakes.edt_direccionKeyDown(Sender: TObject; var Key: Word;
  var KeyChar: WideChar; Shift: TShiftState);
begin
  if ((key = vkReturn) or (key = vkTab)) and (edt_direccion.Text.trim <> '') then
  begin
    Key := 0;
    KeyChar := #0;
    edt_localidad.SetFocus;
  end;
end;

procedure TfrmStakes.edt_emailKeyDown(Sender: TObject; var Key: Word;
  var KeyChar: WideChar; Shift: TShiftState);
begin
  if ((key = vkReturn) or (key = vkTab)) and (edt_email.Text.trim <> '') then
  begin
    Key := 0;
    KeyChar := #0;
    edt_tfno.SetFocus;
  end;
end;

procedure TfrmStakes.edt_institucionKeyDown(Sender: TObject; var Key: Word;
  var KeyChar: WideChar; Shift: TShiftState);
begin
  if ((key = vkReturn) or (key = vkTab)) and (edt_institucion.Text.trim <> '') then
  begin
    Key := 0;
    KeyChar := #0;
    edt_nombre.SetFocus;
  end;
end;

procedure TfrmStakes.edt_localidadKeyDown(Sender: TObject; var Key: Word;
  var KeyChar: WideChar; Shift: TShiftState);
begin
  if ((key = vkReturn) or (key = vkTab)) and (edt_localidad.Text.trim <> '') then
  begin
    Key := 0;
    KeyChar := #0;
    edt_provincia.SetFocus;
  end;
end;

procedure TfrmStakes.edt_NombreKeyDown(Sender: TObject; var Key: Word;
  var KeyChar: WideChar; Shift: TShiftState);
begin
  if ((key = vkReturn) or (key = vkTab)) and (edt_nombre.Text.trim <> '') then
  begin
    Key := 0;
    KeyChar := #0;
    edt_apellidos.SetFocus;
  end;
end;

procedure TfrmStakes.edt_provinciaKeyDown(Sender: TObject; var Key: Word;
  var KeyChar: WideChar; Shift: TShiftState);
begin
  if ((key = vkReturn) or (key = vkTab)) and (edt_provincia.Text.trim <> '') then
  begin
    Key := 0;
    KeyChar := #0;
    cbb_pais.SetFocus;
  end;
end;

procedure TfrmStakes.edt_tfnoExit(Sender: TObject);
begin
  if edt_tfno.Text.Trim <> '' then
    NormalizarTelefono(edt_tfno.Text.Trim);
end;

procedure TfrmStakes.edt_tfnoKeyDown(Sender: TObject; var Key: Word;
  var KeyChar: WideChar; Shift: TShiftState);
begin
  if ((key = vkReturn) or (key = vkTab)) and (edt_tfno.Text.trim <> '') then
  begin
    Key := 0;
    KeyChar := #0;
    edt_titulacion.SetFocus;
  end;
end;

procedure TfrmStakes.edt_TitulacionKeyDown(Sender: TObject; var Key: Word;
  var KeyChar: WideChar; Shift: TShiftState);
begin
  if ((key = vkReturn) or (key = vkTab)) and (edt_titulacion.Text.trim <> '') then
  begin
    Key := 0;
    KeyChar := #0;
    edt_institucion.SetFocus;
  end;
end;

procedure TfrmStakes.FormCreate(Sender: TObject);
begin
  cbb_pais.Items.Text := listadoPaises.Text;
  cbb_pais.itemindex := posicionEcuador;
end;

procedure TfrmStakes.FormKeyDown(Sender: TObject; var Key: Word;
  var KeyChar: WideChar; Shift: TShiftState);
begin
  if Key = vkTab then
  begin
    Key := 0;
    KeyChar := #0;
  end;
end;

procedure TfrmStakes.actualizaStake;
var
  qry: TUniQuery;
  tmpstr: string;
begin
  qry := TUniQuery.Create(nil);
  try
    with qry do
    begin
      Connection := DModule_1.con2;
      Close;
      sql.Clear;
      sql.Add('update Stakeholders set nombre=:nombre, apellidos=:apellidos, direccion=:direccion, localidad=:localidad, provincia=:provincia, ');
      sql.Add('pais=:pais, telefono=:telefono, email=:email, titulacion=:titulacion, institucion=:institucion where idfiscal='
        + QuotedStr(IdFiscal));
      Prepare;
      ParamByName('nombre').AsString := edt_Nombre.Text;
      ParamByName('apellidos').AsString := edt_Apellidos.Text;
      ParamByName('direccion').AsString := edt_direccion.Text;
      ParamByName('localidad').AsString := edt_localidad.Text;
      ParamByName('provincia').AsString := edt_provincia.Text;
      ParamByName('pais').AsString := cbb_pais.Items[cbb_pais.ItemIndex];
      ParamByName('telefono').AsString := NormalizarTelefono(
        edt_tfno.Text.Trim);
      ParamByName('email').AsString := edt_email.Text;
      ParamByName('titulacion').AsString := edt_Titulacion.Text;
      ParamByName('institucion').AsString := edt_institucion.Text;
      ExecSQL;
    end;
  finally
    qry.Free;
  end;
end;

procedure TfrmStakes.actualizaStakeAsignado;
var
  posgrid: Integer;
  X: Integer;
  salir: Boolean;
  idFiscalStake: string;
begin
  X := 0;
  salir := False;
  posgrid := -1;
  idFiscalStake := IdFiscal;
  while (X < frmMain.grid_stakesAsignados.RowCount - 1) and (not salir) do
  begin
    if idFiscalStake = trimExp(frmMain.grid_stakesAsignados.Cells[1, X]) then
    begin
      salir := True;
      frmMain.grid_stakesAsignados.Cells[3, X] := edt_Titulacion.Text;
      frmMain.grid_stakesAsignados.Cells[4, X] := edt_Apellidos.Text;
      frmMain.grid_stakesAsignados.Cells[5, X] := edt_Nombre.Text;

      frmMain.grid_stakesAsignados.Cells[9, X] := edt_tfno.Text;
      frmMain.grid_stakesAsignados.Cells[10, X] := edt_institucion.Text;
    end;
    Inc(X);
  end;
end;

procedure TfrmStakes.cargaStake(idFiscalStake: string);
var
  qry: TUniQuery;
  tmpstr: string;
begin
  qry := TUniQuery.Create(nil);
  try
    with qry do
    begin
      Connection := DModule_1.con2;
      Close;
      sql.Clear;
      sql.Add('select * from Stakeholders where idFiscal=' + QuotedStr(idFiscalStake));
      Prepare;
      ExecSQL;
      tmpstr := FieldByName('idFiscal').AsString;
      if tmpstr <> '' then
      begin
        IdFiscal := tmpstr;
        edt_Titulacion.Text := FieldByName('titulacion').AsString;
        edt_Nombre.Text := FieldByName('nombre').AsString;
        edt_Apellidos.Text := FieldByName('apellidos').AsString;
        edt_direccion.Text := FieldByName('direccion').AsString;
        edt_localidad.Text := FieldByName('localidad').AsString;
        edt_provincia.Text := FieldByName('provincia').AsString;
        tmpstr := FieldByName('pais').AsString;
        posicionaCombo(cbb_pais, tmpstr);
        edt_tfno.Text := FieldByName('telefono').AsString;
        edt_email.Text := FieldByName('email').AsString;
        edt_institucion.Text := FieldByName('institucion').AsString;
      end;
    end;
  finally
    qry.Free;
  end;
end;

procedure TfrmStakes.cbb_paisKeyDown(Sender: TObject; var Key: Word;
  var KeyChar: WideChar; Shift: TShiftState);
begin
  if ((key = vkReturn) or (key = vkTab)) and (cbb_pais.ItemIndex > 0) then
  begin
    Key := 0;
    KeyChar := #0;
    edt_email.SetFocus;
  end;
end;

procedure TfrmStakes.guardaStake;
var
  qry: TUniQuery;
  tmpstr: string;
begin
  qry := TUniQuery.Create(nil);
  try
    with qry do
    begin
      Connection := DModule_1.con2;
      Close;
      sql.Clear;
      sql.Add('select * from Stakeholders where idFiscal=' + QuotedStr(IdFiscal));
      Prepare;
      ExecSQL;
      tmpstr := FieldByName('idFiscal').AsString;
      if tmpstr = '' then
      begin
        Close;
        sql.Clear;
        sql.Add('insert into Stakeholders (idFiscal, Nombre, Apellidos, direccion, localidad, provincia, pais, telefono, email, titulacion, institucion) ');
        sql.Add('VALUES (:idFiscal, :Nombre, :Apellidos, :direccion, :localidad, :provincia, :pais, :telefono, :email, :titulacion, :institucion)');
        Prepare;
        ParamByName('idFiscal').AsString := IdFiscal;
        ParamByName('nombre').AsString := edt_Nombre.Text;
        ParamByName('apellidos').AsString := edt_Apellidos.Text;
        ParamByName('direccion').AsString := edt_direccion.Text;
        ParamByName('localidad').AsString := edt_localidad.Text;
        ParamByName('provincia').AsString := edt_provincia.Text;
        ParamByName('pais').AsString := cbb_pais.Items[cbb_pais.ItemIndex];
        ParamByName('telefono').AsString := NormalizarTelefono(edt_tfno.Text);
        ParamByName('email').AsString := edt_email.Text;
        ParamByName('titulacion').AsString := edt_Titulacion.Text;
        ParamByName('institucion').AsString := edt_institucion.Text;
        ExecSQL;
        limpiaNuevoStake;
        populaStakesDisponibles('');
        MuestraMensajeGiproy('Información', 'Stakeholder añadido. Gracias');
        ModalResult := mrOk;
      end
      else
      begin
        MuestraMensajeGiproy('Información', 'Stakeholder ya creado, por favor revise el listado');
      end;
    end;
  finally
    qry.Free;
  end;
end;

procedure TfrmStakes.limpiaNuevoStake;
begin
  edt_Nombre.Text := '';
  edt_Apellidos.Text := '';

  edt_direccion.Text := '';
  edt_localidad.Text := '';
  edt_provincia.Text := '';
  edt_tfno.Text := '';
  edt_email.Text := '';
  edt_Titulacion.Text := '';
  edt_institucion.Text := '';
  cbb_pais.ItemIndex := posicionEcuador;
end;

procedure TfrmStakes.rect_1MouseDown(Sender: TObject; Button: TMouseButton; Shift: TShiftState; X, Y:
  Single);
begin
  Self.StartWindowDrag;
end;

procedure TfrmStakes.rect_AceptarClick(Sender: TObject);
begin
  if compruebaDatosStake then
  begin
    if lbl_modo.Text = '1' then
    begin
      guardaStake();
    end;
    if lbl_modo.Text = '2' then
    begin
      actualizaStake();
      populaStakesDisponibles('');
      actualizaStakeAsignado;
      ShowMessage('Stakeholder Actualizado');
      ModalResult := mrOk;
    end;
  end
  else
  begin
    ShowMessage('Por favor, rellene todos los campos. Gracias.');
  end;
end;

procedure TfrmStakes.rect_AceptarMouseEnter(Sender: TObject);
begin
  iGlow_Aceptar.Enabled := True;
end;

procedure TfrmStakes.rect_AceptarMouseLeave(Sender: TObject);
begin
  iGlow_Aceptar.Enabled := False;
end;

procedure TfrmStakes.rect_CancelarClick(Sender: TObject);
begin
  ModalResult := mrOk;
end;

procedure TfrmStakes.rect_CancelarMouseEnter(Sender: TObject);
begin
  iGlow_Cancelar.Enabled := True;
end;

procedure TfrmStakes.rect_CancelarMouseLeave(Sender: TObject);
begin
  iGlow_Cancelar.Enabled := False;
end;

end.

