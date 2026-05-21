unit uConfigGridStakes;

interface

uses
  System.SysUtils, System.Types, System.UITypes, System.Classes, System.Variants, FMX.Types,
  FMX.Controls, FMX.Forms, FMX.Graphics, FMX.Dialogs, FMX.StdCtrls, FMX.Effects, FMX.Objects,
  FMX.Controls.Presentation, FMX.Layouts;

type
  TfrmConfigGridStakes = class(TForm)
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
    chk03: TCheckBox;
    chk02: TCheckBox;
    chk05: TCheckBox;
    chk04: TCheckBox;
    chk01: TCheckBox;
    chk06: TCheckBox;
    procedure rect_CancelarMouseUp(Sender: TObject; Button: TMouseButton; Shift: TShiftState; X, Y: Single);
    procedure rect_CancelarMouseLeave(Sender: TObject);
    procedure rect_CancelarMouseEnter(Sender: TObject);
    procedure rect_AceptarMouseEnter(Sender: TObject);
    procedure rect_AceptarMouseLeave(Sender: TObject);
    procedure rect_AceptarMouseUp(Sender: TObject; Button: TMouseButton; Shift: TShiftState; X, Y: Single);
  private
    { Private declarations }
    procedure ActualizarColumnas();
  public
    { Public declarations }
    procedure columnasVisibles();
  end;

var
  frmConfigGridStakes: TfrmConfigGridStakes;

implementation

{$R *.fmx}

uses
  DM1, uMain;

{ TfrmConfigGridStakes }
procedure TfrmConfigGridStakes.ActualizarColumnas;
begin
  // Ciudad//
  if chk01.IsChecked then
  begin
    frmMain.grid_stakesAsignados.Columns[5].Width := 100;
    frmMain.grid_stakesAsignados.AutoSizeColumn(5);
  end
  else
  begin
    frmMain.grid_stakesAsignados.Columns[5].Width := 0;
    frmMain.grid_stakesDisponibles.Columns[6].Width := 0;
  end;
  // Provincia//
  if chk02.IsChecked then
  begin
    frmMain.grid_stakesAsignados.Columns[6].Width := 100;
    frmMain.grid_stakesAsignados.AutoSizeColumn(6);
    frmMain.grid_stakesDisponibles.Columns[7].Width := 100;
    frmMain.grid_stakesDisponibles.AutoSizeColumn(7);
  end
  else
  begin
    frmMain.grid_stakesAsignados.Columns[6].Width := 0;
    frmMain.grid_stakesDisponibles.Columns[7].Width := 0;
  end;
  // Pais //
  if chk03.IsChecked then
  begin
    frmMain.grid_stakesAsignados.Columns[7].Width := 100;
    frmMain.grid_stakesAsignados.AutoSizeColumn(7);
    frmMain.grid_stakesDisponibles.Columns[8].Width := 100;
    frmMain.grid_stakesDisponibles.AutoSizeColumn(8);
  end
  else
  begin
    frmMain.grid_stakesAsignados.Columns[7].Width := 0;
    frmMain.grid_stakesDisponibles.Columns[8].Width := 0;
  end;
  // Movil //
  if chk04.IsChecked then
  begin
    frmMain.grid_stakesAsignados.Columns[8].Width := 100;
    frmMain.grid_stakesAsignados.AutoSizeColumn(8);
    frmMain.grid_stakesDisponibles.Columns[9].Width := 100;
    frmMain.grid_stakesDisponibles.AutoSizeColumn(9);
  end
  else
  begin
    frmMain.grid_stakesAsignados.Columns[8].Width := 0;
    frmMain.grid_stakesDisponibles.Columns[9].Width := 0;
  end;
  // Institución //
  if chk05.IsChecked then
  begin
    frmMain.grid_stakesAsignados.Columns[9].Width := 100;
    frmMain.grid_stakesAsignados.AutoSizeColumn(9);
    frmMain.grid_stakesDisponibles.Columns[10].Width := 100;
    frmMain.grid_stakesDisponibles.AutoSizeColumn(10);
  end
  else
  begin
    frmMain.grid_stakesAsignados.Columns[9].Width := 0;
    frmMain.grid_stakesDisponibles.Columns[10].Width := 0;
  end;
  // Cargo
  if chk06.IsChecked then
  begin
    frmMain.grid_stakesAsignados.Columns[10].Width := 100;
    frmMain.grid_stakesAsignados.AutoSizeColumn(10);
    frmMain.grid_stakesDisponibles.Columns[11].Width := 100;
    frmMain.grid_stakesDisponibles.AutoSizeColumn(11);
  end
  else
  begin
    frmMain.grid_stakesAsignados.Columns[10].Width := 0;
    frmMain.grid_stakesDisponibles.Columns[11].Width := 0;
  end;
end;

procedure TfrmConfigGridStakes.columnasVisibles;
begin
  if frmMain.grid_stakesAsignados.Columns[6].Width > 0 then
    chk01.IsChecked := True
  else
    chk01.IsChecked := False;
  if frmMain.grid_stakesAsignados.Columns[7].Width > 0 then
    chk02.IsChecked := True
  else
    chk02.IsChecked := False;
  if frmMain.grid_stakesAsignados.Columns[8].Width > 0 then
    chk03.IsChecked := True
  else
    chk03.IsChecked := False;
  if frmMain.grid_stakesAsignados.Columns[9].Width > 0 then
    chk04.IsChecked := True
  else
    chk04.IsChecked := False;
  if frmMain.grid_stakesAsignados.Columns[10].Width > 0 then
    chk05.IsChecked := True
  else
    chk05.IsChecked := False;
  if frmMain.grid_stakesAsignados.Columns[11].Width > 0 then
    chk06.IsChecked := True
  else
    chk06.IsChecked := False;

end;

procedure TfrmConfigGridStakes.rect_AceptarMouseEnter(Sender: TObject);
begin
  iGlow_Aceptar.Enabled := True;
end;

procedure TfrmConfigGridStakes.rect_AceptarMouseLeave(Sender: TObject);
begin
  iGlow_Aceptar.Enabled := False;
end;

procedure TfrmConfigGridStakes.rect_AceptarMouseUp(Sender: TObject; Button: TMouseButton; Shift: TShiftState; X, Y: Single);
begin
  iGlow_Aceptar.Enabled := False;
  ActualizarColumnas;
  ModalResult := mrOk;
end;

procedure TfrmConfigGridStakes.rect_CancelarMouseEnter(Sender: TObject);
begin
  iGlow_Cancelar.Enabled := True;
end;

procedure TfrmConfigGridStakes.rect_CancelarMouseLeave(Sender: TObject);
begin
  iGlow_Cancelar.Enabled := False;
end;

procedure TfrmConfigGridStakes.rect_CancelarMouseUp(Sender: TObject; Button: TMouseButton; Shift: TShiftState; X, Y: Single);
begin
  iGlow_Cancelar.Enabled := False;
  ModalResult := mrOk;
end;

end.

