unit uIndicesFPolinomica;

interface

uses
  System.SysUtils, System.Types, System.UITypes, System.Classes,
  System.Variants,
  FMX.Types, FMX.Controls, FMX.Forms, FMX.Graphics, FMX.Dialogs,
  FMX.Effects,
  FMX.Controls.Presentation, FMX.StdCtrls, FMX.Objects, FMX.Layouts, Uni,
  FMX.TMSFNCTypes, FMX.TMSFNCUtils, FMX.TMSFNCGraphics,
  FMX.TMSFNCGraphicsTypes,
  FMX.TMSFNCGridCell, FMX.TMSFNCGridOptions, FMX.TMSFNCCustomControl,
  FMX.TMSFNCCustomScrollControl, FMX.TMSFNCGridData, FMX.TMSFNCCustomGrid,
  FMX.TMSFNCGrid, FMX.TMSFNCCustomComponent,
  FMX.TMSFNCGridDatabaseAdapter,
  FMX.Edit;

type
  TfrmIndicesFPolinomica = class(TForm)
    lyt_Background: TLayout;
    lyt_Body: TLayout;
    rect_2: TRectangle;
    lyt_3: TLayout;
    rect_3: TRectangle;
    lyt_6: TLayout;
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
    rect_4: TRectangle;
    lyt_1: TLayout;
    lyt_2: TLayout;
    grid_IndicesPrecios: TTMSFNCGrid;
    dbGridConnect_1: TTMSFNCGridDatabaseAdapter;
    lyt_4: TLayout;
    rect_5: TRectangle;
    Shadow_Filter: TShadowEffect;
    edt_filter: TEdit;
    rect_6: TRectangle;
    grp1: TGroupBox;
    edt_descripcion: TEdit;
    rect_7: TRectangle;
    Shadow_descripcion: TShadowEffect;
    lyt_5: TLayout;
    chkManoObra: TCheckBox;
    lbl_CodIndice: TLabel;
    lyt_8: TLayout;
    rect_8: TRectangle;
    rect_9: TRectangle;
    rect_10: TRectangle;
    lbl_nuevo: TLabel;
    procedure rect_AceptarClick(Sender: TObject);
    procedure edt_filterEnter(Sender: TObject);
    procedure edt_filterExit(Sender: TObject);
    procedure edt_filterChangeTracking(Sender: TObject);
    procedure FormShow(Sender: TObject);
    procedure lbl_banner1MouseDown(Sender: TObject;
      Button: TMouseButton; Shift: TShiftState; X, Y: Single);
    procedure grid_IndicesPreciosCellClick(Sender: TObject;
      ACol, ARow: Integer);
    procedure edt_descripcionEnter(Sender: TObject);
    procedure edt_descripcionExit(Sender: TObject);
    procedure rect_8Click(Sender: TObject);
    procedure rect_9Click(Sender: TObject);
    procedure rect_10Click(Sender: TObject);
    procedure FormClose(Sender: TObject; var Action: TCloseAction);
  private
    { Private declarations }
    procedure crearIndice();
    procedure EditarIndice();
    procedure BorrarIndice();
  public
    { Public declarations }
    procedure limpiaDatosEntrada;
  end;

var
  frmIndicesFPolinomica: TfrmIndicesFPolinomica;

implementation

{$R *.fmx}

uses
  DM1, uMain;

procedure TfrmIndicesFPolinomica.limpiaDatosEntrada;
begin
  edt_descripcion.Text := '';
  chkManoObra.IsChecked := False;
  lbl_CodIndice.Text := '';
  lbl_nuevo.Text := '';
end;

procedure TfrmIndicesFPolinomica.crearIndice;
var
  ultValorIndice: Integer;
  qry: TUniQuery;
  descripcion: string;
begin
  qry := TUniQuery.Create(nil);
  descripcion := edt_descripcion.Text;
  try
    with qry do
    begin
      Connection := DModule_1.con2;
      close;
      sql.Clear;
      sql.Add('select * from IndicesPrecios');
      Prepare;
      ExecSQL;
      Last;
      ultValorIndice := FieldByName('CodIndice').AsInteger;
      Inc(ultValorIndice);
      close;
      sql.Clear;
      sql.Add('select * from IndicesPrecios where descripcion='
        + QuotedStr(descripcion));
      Prepare;
      ExecSQL;
      descripcion := FieldByName('descripcion').AsString;
      if descripcion = '' then
      begin
        descripcion := edt_descripcion.Text;
        close;
        sql.Clear;
        sql.Add('insert into IndicesPrecios (codIndice, descripcion, categoria) Values (:codIndice, :descripcion, :categoria) ');
        Prepare;
        ParamByName('codIndice').AsInteger :=
          ultValorIndice;
        ParamByName('descripcion').AsString :=
          descripcion;
        if chkManoObra.IsChecked then
        begin
          ParamByName('categoria').AsInteger := 2;
        end
        else
        begin
          ParamByName('categoria').AsInteger := 1;
        end;
        ExecSQL;
      end;
    end;
  finally
    qry.Free;
    DModule_1.untbl5.Refresh;
    limpiaDatosEntrada;
  end;
end;

procedure TfrmIndicesFPolinomica.BorrarIndice;
var
  qry: TUniQuery;
begin
  qry := TUniQuery.Create(nil);
  try
    with qry do
    begin
      Connection := DModule_1.con2;
      close;
      sql.Clear;
      sql.Add('delete from indicesPrecios where codIndice=:codIndice');
      Prepare;
      ParamByName('codIndice').AsString := lbl_CodIndice.Text;
      ExecSQL;
    end;
  finally
    qry.Free;
    DModule_1.untbl5.Refresh;
    limpiaDatosEntrada;
  end;
end;

procedure TfrmIndicesFPolinomica.EditarIndice;
var
  qry: TUniQuery;
begin
  qry := TUniQuery.Create(nil);
  try
    with qry do
    begin
      Connection := DModule_1.con2;
      close;
      sql.Clear;
      sql.Add('update IndicesPrecios set descripcion=:descripcion, categoria=:categoria where codIndice='
        + QuotedStr(lbl_CodIndice.Text));
      Prepare;
      ParamByName('descripcion').AsString :=
        edt_descripcion.Text;
      if chkManoObra.IsChecked then
        ParamByName('categoria').AsInteger := 2
      else
        ParamByName('categoria').AsInteger := 1;
      ExecSQL;
    end;
  finally
    qry.Free;
    DModule_1.untbl5.Refresh;
    limpiaDatosEntrada;
  end;
end;

procedure TfrmIndicesFPolinomica.edt_descripcionEnter(Sender: TObject);
begin
  Shadow_descripcion.Enabled := true;
end;

procedure TfrmIndicesFPolinomica.edt_descripcionExit(Sender: TObject);
begin
  Shadow_descripcion.Enabled := False;
end;

procedure TfrmIndicesFPolinomica.edt_filterChangeTracking(Sender: TObject);
var
  filtro: string;
begin
  filtro := edt_filter.Text;
  if filtro <> '' then
  begin
    DModule_1.untbl5.Filtered := False;

    DModule_1.untbl5.filter := 'descripcion' + ' LIKE ' +
      QuotedStr('*' + filtro + '*');
    DModule_1.untbl5.Filtered := true;
  end
  else
  begin
    DModule_1.untbl5.Filtered := False;
  end;
end;

procedure TfrmIndicesFPolinomica.edt_filterEnter(Sender: TObject);
begin
  Shadow_Filter.Enabled := true;
end;

procedure TfrmIndicesFPolinomica.edt_filterExit(Sender: TObject);
begin
  Shadow_Filter.Enabled := False;
end;

procedure TfrmIndicesFPolinomica.FormClose(Sender: TObject;
  var Action: TCloseAction);
begin
  actualizaComboIndices();
end;

procedure TfrmIndicesFPolinomica.FormShow(Sender: TObject);
begin
  edt_filter.Text := '';
  edt_filter.SetFocus;
  limpiaDatosEntrada;
end;

procedure TfrmIndicesFPolinomica.grid_IndicesPreciosCellClick(Sender: TObject;
  ACol, ARow: Integer);
var
  idUnicoIndice, descripcion: string;
  manoObra: Integer;
begin
  if ARow > -1 then
  begin
    lbl_nuevo.Text := '';
    DModule_1.untbl5.DisableControls;
    DModule_1.untbl5.First;
    DModule_1.untbl5.MoveBy(ARow - 1);
    idUnicoIndice := DModule_1.untbl5.FieldByName
      ('codIndice').AsString;
    descripcion := DModule_1.untbl5.FieldByName
      ('descripcion').AsString;
    manoObra := DModule_1.untbl5.FieldByName('categoria').AsInteger;
    DModule_1.untbl5.EnableControls;
    edt_descripcion.Text := descripcion;
    if manoObra = 1 then
      chkManoObra.IsChecked := False
    else
      chkManoObra.IsChecked := true;
    lbl_CodIndice.Text := idUnicoIndice;
  end;
end;

procedure TfrmIndicesFPolinomica.lbl_banner1MouseDown(Sender: TObject;
  Button: TMouseButton; Shift: TShiftState; X, Y: Single);
begin
  Self.StartWindowDrag;
end;

procedure TfrmIndicesFPolinomica.rect_10Click(Sender: TObject);
begin
  if realizarPreguntaSiNo('¿Borrar Indice?') <> mrOk then
    Exit;
  BorrarIndice;
end;

procedure TfrmIndicesFPolinomica.rect_8Click(Sender: TObject);
begin
  edt_descripcion.Text := '';
  edt_descripcion.SetFocus;
  chkManoObra.IsChecked := False;
  lbl_nuevo.Text := 'SI';
end;

procedure TfrmIndicesFPolinomica.rect_9Click(Sender: TObject);
begin
  if edt_descripcion.Text <> '' then
  begin
    if lbl_nuevo.Text = 'SI' then
    begin
      if realizarPreguntaSiNo('¿Crear Indice Nuevo?') <> mrOK then
        Exit;
      crearIndice;
    end
    else
    begin
      if realizarPreguntaSiNo('¿Actualizar Datos del Indice?') <> mrOK then
        exit;
      EditarIndice;
    end;
  end;
end;

procedure TfrmIndicesFPolinomica.rect_AceptarClick(Sender: TObject);
begin
  ModalResult := mrOk;
end;

end.

