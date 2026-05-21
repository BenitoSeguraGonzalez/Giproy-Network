unit uNotaPresupuesto;

interface

uses
  System.SysUtils, System.Types, System.UITypes, System.Classes,
  System.Variants,
  FMX.Types, FMX.Controls, FMX.Forms, FMX.Graphics, FMX.Dialogs,
  FMX.Effects,
  Uni, FMX.Edit, FMX.Objects, FMX.Controls.Presentation, FMX.StdCtrls,
  System.Math, System.StrUtils, FMX.Layouts, FMX.Memo.Types,
  FMX.ScrollBox,
  FMX.Memo, FMX.ListBox, FMX.Toast.Windows;

type
  TfrmNotaPresupuesto = class(TForm)
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
    lyt_EntradaDatos: TLayout;
    lstConversacionNotas: TListBox;
    rect_5: TRectangle;
    mmo1: TMemo;
    lyt_4: TLayout;
    lyt_5: TLayout;
    lbl_contador: TLabel;
    lbl_descripcionCompleta: TLabel;
    lbl_codEDT: TLabel;
    TWToast_1: TWindowsToastDialog;
    lbl_modo: TLabel;
    rect_11: TRectangle;
    iGlow_Aceptar: TInnerGlowEffect;
    procedure rect_AceptarMouseEnter(Sender: TObject);
    procedure rect_CancelarMouseEnter(Sender: TObject);
    procedure rect_CancelarMouseLeave(Sender: TObject);
    procedure rect_CancelarMouseUp(Sender: TObject;
      Button: TMouseButton; Shift: TShiftState; X, Y: Single);
    procedure mmo1ChangeTracking(Sender: TObject);
    procedure rect_11MouseLeave(Sender: TObject);
    procedure lstConversacionNotasViewportPositionChange(Sender: TObject;
      const OldViewportPosition, NewViewportPosition: TPointF;
      const ContentSizeChanged: Boolean);
    procedure rect_11Click(Sender: TObject);
    procedure rect_5Click(Sender: TObject);
    procedure FormDestroy(Sender: TObject);
    procedure FormCreate(Sender: TObject);
    procedure FormShow(Sender: TObject);
  private
    { Private declarations }
    FOffset: Integer;
    FPageSize: Integer;
    FIdItemActual: string;
    FHayMasDatos: Boolean;
    FCargando: Boolean;
    FQryNotas: TUniQuery;

    procedure InicializarNotas;
    procedure CargarPagina;
    procedure AgregarNotaUI(const textoNota: string);
    procedure creaNota(textoNota: string);
    procedure InicializarQuery;
    procedure CrearItemNota(const Autor, Texto, Fecha: string);
  public
    { Public declarations }
    procedure cargaNota();
    procedure RespondeNota(textoNota, textoNotaReferencia: string);

  end;

var
  frmNotaPresupuesto: TfrmNotaPresupuesto;

implementation

{$R *.fmx}

uses
  DM1, uMain, fConversacionNota, fConversacionNota2, uInputMemo,
  dm_presupuestos;

function MeasureTextHeight(const AText: string; const AWidth: Single; const
  AFont: TFont): Single;
var
  Bmp: TBitmap;
  R: TRectF;
begin
  if AWidth <= 1 then
    Exit(0);

  Bmp := TBitmap.Create(2, 2);
  try
    Bmp.Canvas.BeginScene;
    try
      Bmp.Canvas.Font.Assign(AFont);
      R := RectF(0, 0, AWidth, 10000);
      Bmp.Canvas.MeasureText(R, AText, False, [], TTextAlign.Leading,
        TTextAlign.Leading);
      Result := R.Height;
    finally
      Bmp.Canvas.EndScene;
    end;
  finally
    Bmp.Free;
  end;
end;

procedure TfrmNotaPresupuesto.CrearItemNota(
  const Autor, Texto, Fecha: string);
var
  frame: Tframe_ConversacionNota;
  item: TListBoxItem;
  alturaTexto: Single;
  textoCompleto: string;
begin
  textoCompleto := Autor + ': ' + Texto;

  item := TListBoxItem.Create(lstConversacionNotas);
  item.Stored := False;
  item.Parent := lstConversacionNotas;

  frame := Tframe_ConversacionNota.Create(nil); // <- evita conflictos owner
  frame.Parent := item;
  frame.Align := TAlignLayout.Client;

  frame.lbl_Fecha.Text := Fecha;

  frame.mmo1.Text := textoCompleto;
  frame.mmo1.ReadOnly := True;
  frame.mmo1.WordWrap := True;
  frame.mmo1.ShowScrollBars := False;
  frame.mmo1.HitTest := False;

  { cálculo real de altura }
  frame.txt1.WordWrap := True;
  frame.txt1.Width := lstConversacionNotas.Width - 60;
  frame.txt1.Text := textoCompleto;

  frame.txt1.Height := 0;
  frame.txt1.RecalcSize;

  alturaTexto := frame.txt1.Height;

  frame.mmo1.Height := alturaTexto + 10;

  item.Height := frame.mmo1.Height + 35;
end;

procedure TfrmNotaPresupuesto.InicializarQuery;
begin
  if Assigned(FQryNotas) then
    Exit;

  FQryNotas := TUniQuery.Create(Self);
  FQryNotas.Connection := DModule_1.con2;

  FQryNotas.SQL.Text :=
    'SELECT idItem, fecha, codEdt, paquete, descripcion, nota, autor, tipoNota, notaReferencia ' +
    'FROM presupuestos_anotaciones ' +
    'WHERE codBase = :codBase ' +
    'AND codPresupuesto = :codPresupuesto ' +
    'AND revision = :revision ' +
    'AND idItem = :idItem ' +
    'ORDER BY fecha ASC ' +
    'LIMIT :limit OFFSET :offset';
end;

procedure TfrmNotaPresupuesto.AgregarNotaUI(const textoNota: string);
begin
  lstConversacionNotas.BeginUpdate;
  try
    CrearItemNota(
      'Yo',
      textoNota,
      FormatDateTime('dd/mm/yyyy hh:nn:ss', Now)
      );
  finally
    lstConversacionNotas.EndUpdate;
  end;

  lstConversacionNotas.ScrollBy(0, 10000);
end;

procedure TfrmNotaPresupuesto.CargarPagina;
var
  fechaHora: TDateTime;
  textoNota, autor: string;
  nombreUsuarioNota: string;
  RegistrosCargados: Integer;
begin
  if FCargando then
    Exit;
  if not FHayMasDatos then
    Exit;

  FCargando := True;
  RegistrosCargados := 0;

  InicializarQuery;

  FQryNotas.Close;

  FQryNotas.ParamByName('codBase').AsString := base_activa.codBase;
  FQryNotas.ParamByName('codPresupuesto').AsString := codProyecto;
  FQryNotas.ParamByName('revision').AsString := revision;
  FQryNotas.ParamByName('idItem').AsString := FIdItemActual;

  FQryNotas.ParamByName('limit').AsInteger := FPageSize;
  FQryNotas.ParamByName('offset').AsInteger := FOffset;

  FQryNotas.Open;

  nombreUsuarioNota :=
    UpperCase(LeftStr(Nombre_usuario, 1)) + '. ' + Apellidos_usuario;

  lstConversacionNotas.BeginUpdate;
  try
    while not FQryNotas.Eof do
    begin
      Inc(RegistrosCargados);

      if not FQryNotas.FieldByName('fecha').IsNull then
        fechaHora := FQryNotas.FieldByName('fecha').AsDateTime
      else
        fechaHora := Now;

      textoNota := FQryNotas.FieldByName('nota').AsString;
      autor := FQryNotas.FieldByName('autor').AsString;

      if autor = nombreUsuarioNota then
        autor := 'Yo';

      CrearItemNota(
        autor,
        textoNota,
        FormatDateTime('dd/mm/yyyy hh:nn:ss', fechaHora)
        );

      FQryNotas.Next;
    end;
  finally
    lstConversacionNotas.EndUpdate;
  end;

  Inc(FOffset, RegistrosCargados);

  if RegistrosCargados < FPageSize then
    FHayMasDatos := False;

  FCargando := False;
end;

procedure TfrmNotaPresupuesto.InicializarNotas;
begin
  FPageSize := 30;
  FOffset := 0;
  FHayMasDatos := True;
  FCargando := False;

  if Trim(lbl_adicional.Text) <> '' then
    FIdItemActual := Trim(lbl_adicional.Text)
  else
    FIdItemActual := '0';

  lstConversacionNotas.Clear;

  CargarPagina;
end;

procedure TfrmNotaPresupuesto.lstConversacionNotasViewportPositionChange(
  Sender: TObject; const OldViewportPosition,
  NewViewportPosition: TPointF; const ContentSizeChanged: Boolean);
begin
  if FCargando then
    Exit;
  if not FHayMasDatos then
    Exit;

  if (lstConversacionNotas.ViewportPosition.Y +
    lstConversacionNotas.Height) >=
    (lstConversacionNotas.ContentBounds.Height - 50) then
  begin
    CargarPagina;
  end;
end;

procedure TfrmNotaPresupuesto.cargaNota;
var
  idItem: string;
  X: Integer;
  longText, offsetConv: Integer;
  fframe: Tframe_ConversacionNota;
  fframe2: Tframe_ConversacionNota2;
  item: TListBoxItem;
  fechaHora: TDateTime;
  textoNota, textoNotaReferencia: string;
  tipoNota: string;
  nombreUsuarioNota: string;
  Ausuario: string;
  qry: TUniQuery;
begin
  lstConversacionNotas.Clear;

  if lbl_modo.Text = '1' then
    idItem := lbl_adicional.Text
  else
    idItem := '0';

  qry := TUniQuery.Create(nil);
  offsetConv := 40;

  try
    qry.Connection := DModule_1.con2;
    qry.SQL.Text :=
      'SELECT * FROM TAnotaciones WHERE idItem = :idItem ORDER BY fecha ASC';

    qry.ParamByName('idItem').AsString := idItem;
    qry.Open; // <- CORRECTO PARA SELECT

    nombreUsuarioNota := UpperCase(LeftStr(Nombre_usuario, 1)) +
      '. ' + Apellidos_usuario;

    while not qry.Eof do
    begin
      // ---------- FECHA SEGURA ----------
      if not qry.FieldByName('fecha').IsNull then
        fechaHora := qry.FieldByName('fecha').AsDateTime
      else
        fechaHora := Now; // valor por defecto

      textoNota := qry.FieldByName('nota').AsString;
      textoNotaReferencia := qry.FieldByName('notaReferencia').AsString;
      Ausuario := qry.FieldByName('autor').AsString;
      tipoNota := qry.FieldByName('tipoNota').AsString;

      X := lstConversacionNotas.Count;

      lstConversacionNotas.BeginUpdate;

      if tipoNota = '1' then
      begin
        fframe := Tframe_ConversacionNota.Create(Self);
        item := TListBoxItem.Create(lstConversacionNotas);

        fframe.Name := 'conversacion_' + IntToStr(X);
        fframe.lbl_Fecha.Text :=
          FormatDateTime('dd/mm/yyyy hh:nn:ss', fechaHora);

        if nombreUsuarioNota = Ausuario then
          fframe.mmo1.Text := 'Yo: ' + textoNota
        else
          fframe.mmo1.Text := Ausuario + ': ' + textoNota;

        fframe.txt1.Height := 0;
        fframe.txt1.Text := fframe.mmo1.Text;
        fframe.txt1.RecalcSize;

        longText := Trunc(fframe.txt1.Height + 19);

        fframe.Parent := item;
        fframe.Align := TAlignLayout.Client;
        fframe.Margins.Bottom := 5;

        item.Parent := lstConversacionNotas;
        item.Height := longText + offsetConv;
      end
      else if tipoNota = '2' then
      begin
        fframe2 := Tframe_ConversacionNota2.Create(Self);
        item := TListBoxItem.Create(lstConversacionNotas);

        fframe2.Name := 'conversacion_' + IntToStr(X);
        fframe2.lbl_Fecha.Text :=
          FormatDateTime('dd/mm/yyyy hh:nn:ss', fechaHora);

        fframe2.mmo1.Text := textoNotaReferencia;

        if nombreUsuarioNota = Ausuario then
          fframe2.mmo11.Text := 'Yo: ' + textoNota
        else
          fframe2.mmo11.Text := Ausuario + ': ' + textoNota;

        longText :=
          Trunc(fframe2.mmo1.ContentBounds.Height + 5) +
          Trunc(fframe2.mmo11.ContentBounds.Height + 5);

        fframe2.Parent := item;
        fframe2.Align := TAlignLayout.Client;
        fframe2.Margins.Bottom := 5;

        item.Parent := lstConversacionNotas;
        item.Height := longText + offsetConv;
      end;

      lstConversacionNotas.EndUpdate;
      qry.Next;
    end;

  finally
    qry.Free;
  end;
end;

procedure TfrmNotaPresupuesto.creaNota(textoNota: string);
var
  codItem: string;
  qry: TUniQuery;
  nombreUsuarioNota: string;
begin
  if lbl_modo.Text = '1' then
    codItem := lbl_adicional.Text
  else
    codItem := '0';

  nombreUsuarioNota :=
    UpperCase(LeftStr(Nombre_usuario, 1)) + '. ' + Apellidos_usuario;

  qry := TUniQuery.Create(nil);
  try
    qry.Connection := DModule_1.con2;

    qry.SQL.Text :=
      'INSERT INTO presupuestos_anotaciones ' +
      '(codBase,codPresupuesto,revision,idItem,fecha,codEdt,paquete,descripcion,nota,autor,tipoNota) ' +
      'VALUES ' +
      '(:codBase,:codPresupuesto,:revision,:idItem,:fecha,:codEdt,:paquete,:descripcion,:nota,:autor,:tipoNota)';

    qry.ParamByName('codBase').AsString := base_activa.codBase;
    qry.ParamByName('codPresupuesto').AsString := codProyecto;
    qry.ParamByName('revision').AsString := revision;

    qry.ParamByName('idItem').AsString := codItem;
    qry.ParamByName('fecha').AsDateTime := Now;

    qry.ParamByName('codEdt').AsString := Trim(lbl_codEDT.Text);
    qry.ParamByName('paquete').AsString := lbl_paquete.Text;
    qry.ParamByName('descripcion').AsString := lbl_descripcionCompleta.Text;

    qry.ParamByName('nota').AsString := textoNota;
    qry.ParamByName('autor').AsString := nombreUsuarioNota;
    qry.ParamByName('tipoNota').AsString := '1';

    qry.ExecSQL;

  finally
    qry.Free;
  end;
end;

procedure TfrmNotaPresupuesto.FormCreate(Sender: TObject);
begin
  InicializarNotas;
end;

procedure TfrmNotaPresupuesto.FormDestroy(Sender: TObject);
begin
  FreeAndNil(FQryNotas);
end;

procedure TfrmNotaPresupuesto.FormShow(Sender: TObject);
begin
  lstConversacionNotas.RealignContent;
  InicializarNotas;
end;

procedure TfrmNotaPresupuesto.mmo1ChangeTracking(Sender: TObject);
var
  texto: string;
begin
  texto := Trim(mmo1.Text);

  if Length(texto) > 240 then
  begin
    texto := Copy(texto, 1, 240);
    mmo1.Text := texto;
  end;

  lbl_contador.Text := IntToStr(Length(mmo1.Text)) + '/240';
end;

procedure TfrmNotaPresupuesto.rect_11Click(Sender: TObject);
begin
  iGlow_Aceptar.enabled := False;
  modalresult := mrOK;
end;

procedure TfrmNotaPresupuesto.rect_11MouseLeave(Sender: TObject);
begin
  iGlow_Aceptar.enabled := False;
end;

procedure TfrmNotaPresupuesto.rect_5Click(Sender: TObject);
var
  textoNota: string;
begin
  textoNota := Trim(mmo1.Text);

  if textoNota = '' then
    Exit;

  creaNota(textoNota);

  AgregarNotaUI(textoNota);

  mmo1.Text := '';
  lbl_contador.Text := '0/240';
end;

procedure TfrmNotaPresupuesto.rect_AceptarMouseEnter(Sender: TObject);
begin
  iGlow_Aceptar.enabled := True;
end;

procedure TfrmNotaPresupuesto.rect_CancelarMouseEnter(Sender: TObject);
begin
  iGlow_Cancelar.enabled := True;
end;

procedure TfrmNotaPresupuesto.rect_CancelarMouseLeave(Sender: TObject);
begin
  iGlow_Cancelar.enabled := False;
end;

procedure TfrmNotaPresupuesto.rect_CancelarMouseUp(Sender: TObject;
  Button: TMouseButton; Shift: TShiftState; X, Y: Single);
begin
  iGlow_Cancelar.enabled := False;
  modalresult := mrOK;
end;

procedure TfrmNotaPresupuesto.RespondeNota(textoNota, textoNotaReferencia:
  string);
var
  codItem: string;
  qry: TUniQuery;
  nombreUsuarioNota: string;
begin
  if lbl_modo.Text = '1' then
    codItem := lbl_adicional.Text
  else
    codItem := '0';

  nombreUsuarioNota :=
    UpperCase(LeftStr(Nombre_usuario, 1)) + '. ' + Apellidos_usuario;

  qry := TUniQuery.Create(nil);
  try
    qry.Connection := DModule_1.con2;

    qry.SQL.Text :=
      'INSERT INTO presupuestos_anotaciones ' +
      '(codBase, codPresupuesto, revision, idItem, fecha, codEdt, paquete, descripcion, nota, autor, tipoNota, notaReferencia) ' +
      'VALUES ' +
      '(:codBase, :codPresupuesto, :revision, :idItem, :fecha, :codEdt, :paquete, :descripcion, :nota, :autor, :tipoNota, :notaReferencia)';

    qry.ParamByName('codBase').AsString := base_activa.codBase;
    qry.ParamByName('codPresupuesto').AsString := codProyecto;
    qry.ParamByName('revision').AsString := revision;

    qry.ParamByName('idItem').AsString := codItem;
    qry.ParamByName('fecha').AsDateTime := Now;

    qry.ParamByName('codEdt').AsString := Trim(lbl_codEDT.Text);
    qry.ParamByName('paquete').AsString := lbl_paquete.Text;
    qry.ParamByName('descripcion').AsString := lbl_descripcionCompleta.Text;

    qry.ParamByName('nota').AsString := textoNota;
    qry.ParamByName('notaReferencia').AsString := textoNotaReferencia;
    qry.ParamByName('autor').AsString := nombreUsuarioNota;
    qry.ParamByName('tipoNota').AsString := '2';

    qry.ExecSQL;

  finally
    qry.Free;
  end;
end;

end.

