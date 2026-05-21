unit ugeolocalizacion;

interface

uses
  System.SysUtils, System.Types, System.UITypes, System.Classes,
  System.Variants,
  FMX.Types, FMX.Controls, FMX.Forms, FMX.Graphics, FMX.Dialogs,
  FMX.TMSFNCTypes,
  FMX.TMSFNCUtils, FMX.TMSFNCGraphics, FMX.TMSFNCGraphicsTypes, System.StrUtils,
  FMX.Controls.Presentation, FMX.StdCtrls, FMX.TMSFNCCustomControl,
  FMX.TMSFNCGeocoding, FMX.TMSFNCWebBrowser, FMX.TMSFNCMaps,
  FMX.TMSFNCGoogleMaps, FMX.Layouts, FMX.Effects, FMX.Objects,
  FMX.TMSFNCMapsCommonTypes, FMX.Edit, FMX.TMSFNCCustomComponent,
  FMX.TMSFNCCloudBase, FMX.TMSFNCDirections, FMX.Menus, FWebView;

const
  urlBase = 'https://www.google.com/maps/place/';

type
  TfrmGeolocalizacion = class(TForm)
    lyt_Background: TLayout;
    lyt_Body: TLayout;
    rect_2: TRectangle;
    lyt_3: TLayout;
    rect_3: TRectangle;
    lyt_6: TLayout;
    rect_4: TRectangle;
    lyt_1: TLayout;
    lyt_2: TLayout;
    lyt_4: TLayout;
    lbl_3: TLabel;
    lbl_latitud: TLabel;
    lyt_8: TLayout;
    lbl_5: TLabel;
    lbl_Longitud: TLabel;
    lyt_9: TLayout;
    lyt_10: TLayout;
    lbl_4: TLabel;
    edt_1: TEdit;
    btn1: TButton;
    Directions_1: TTMSFNCDirections;
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
    fwb_1: TFWebView;
    gMaps_1: TTMSFNCGoogleMaps;
    procedure gMaps_1MarkerDragEnd(Sender: TObject;
      AEventData: TTMSFNCMapsEventData);
    procedure rect_AceptarClick(Sender: TObject);
    procedure rect_CancelarClick(Sender: TObject);
    procedure fwb_1DomContentLoaded(Sender: TObject; NavigationId: UInt64);
    procedure btn1Click(Sender: TObject);
    procedure rect_AceptarMouseUp(Sender: TObject; Button: TMouseButton;
      Shift: TShiftState; X, Y: Single);
    procedure gMaps_1CaptureScreenShot(Sender: TObject;
      AScreenShot: TTMSFNCBitmap);
    procedure rect_AceptarMouseEnter(Sender: TObject);
    procedure rect_AceptarMouseLeave(Sender: TObject);
    procedure rect_CancelarMouseLeave(Sender: TObject);
    procedure rect_CancelarMouseEnter(Sender: TObject);
    procedure rect_CancelarMouseUp(Sender: TObject; Button: TMouseButton;
      Shift: TShiftState; X, Y: Single);
  private
    { Private declarations }
    urlDireccion: string;
    primeraEntrada: Boolean;
    img: TBitmap;
  public
    { Public declarations }
    procedure direccion2CoordenadasGPS(direccion: string);
  end;

var
  frmGeolocalizacion: TfrmGeolocalizacion;

implementation

{$R *.fmx}

uses
  DM1, uMain;

procedure TfrmGeolocalizacion.btn1Click(Sender: TObject);
var
  lat, long: string;
  flat, flong: double;
begin
  lat := '-2.8920891';
  long := '-79.0111796';

end;

procedure TfrmGeolocalizacion.direccion2CoordenadasGPS(direccion: string);
var
  urlBusqueda: string;
begin
  fwb_1.Active := false;
  urlBusqueda := ReplaceStr(direccion, ' ', '+');
  urlBusqueda := urlBase + urlBusqueda;
  fwb_1.Uri := urlBusqueda;
  fwb_1.Active := True;
  primeraEntrada := True;
end;

procedure TfrmGeolocalizacion.fwb_1DomContentLoaded(Sender: TObject;
  NavigationId: UInt64);
var
  coordenadas: string;
begin
  fwb_1.ExecuteScript('({nombre: document.documentElement.innerHTML})',
    procedure(const JsonResult: string)
    var
      X: integer;
      tmpstr: string;
      lat, long: string;
      m: TTMSFNCGoogleMapsMarker;
      flat, flong: double;
    begin
      X := AnsiPos('staticmap?center=', JsonResult);
      tmpstr := Copy(JsonResult, X + length('staticmap?center='),
        length(JsonResult));
      X := AnsiPos('&amp;', tmpstr);
      tmpstr := Copy(tmpstr, 1, X - 1);
      X := AnsiPos('%2C', tmpstr);
      lat := Copy(tmpstr, 1, X - 1);
      long := Copy(tmpstr, X + length('%2C'), length(tmpstr));
      lbl_latitud.Text := lat;
      lbl_Longitud.Text := long;

      lat := decimal_correcto(lat);
      long := decimal_correcto(long);
      flat := StrToFloat(lat);
      flong := StrToFloat(long);
      gMaps_1.SetCenterCoordinate(flat, flong);
      gMaps_1.SetZoomLevel(17);

      gMaps_1.Markers.Clear;
      m := TTMSFNCGoogleMapsMarker(gMaps_1.AddMarker(StrToFloat(lat),
        StrToFloat(long), 'Obra'));
      // , 'https://ganttcl.com/wp-content/uploads/2022/11/crane_24px_black.png'));
      m.Draggable := True;
    end);

end;

procedure TfrmGeolocalizacion.gMaps_1CaptureScreenShot(Sender: TObject;
AScreenShot: TTMSFNCBitmap);
begin
  img := TBitmap.Create;
  img := AScreenShot;
end;

procedure TfrmGeolocalizacion.gMaps_1MarkerDragEnd(Sender: TObject;
AEventData: TTMSFNCMapsEventData);
begin
  lbl_Longitud.Text := AEventData.Coordinate.Longitude.ToString;
  lbl_latitud.Text := AEventData.Coordinate.Latitude.ToString;
end;

procedure TfrmGeolocalizacion.rect_AceptarClick(Sender: TObject);
begin
  ModalResult := mrOk;
end;

procedure TfrmGeolocalizacion.rect_AceptarMouseEnter(Sender: TObject);
begin
  iGlow_Aceptar.Enabled := True;
end;

procedure TfrmGeolocalizacion.rect_AceptarMouseLeave(Sender: TObject);
begin
  iGlow_Aceptar.Enabled := false;
end;

procedure TfrmGeolocalizacion.rect_AceptarMouseUp(Sender: TObject;
Button: TMouseButton; Shift: TShiftState; X, Y: Single);
begin
  iGlow_Aceptar.Enabled := false;
//  gMaps_1.CaptureScreenShot;
  frmmain.lbl_nProyectoLatitud.Text := 'Lat: ' + lbl_latitud.Text;
  frmmain.lbl_NProyectoLongitud.Text := 'Lon: ' + lbl_Longitud.Text;
  iGlow_Aceptar.Enabled := false;
  ModalResult := mrOk;
end;

procedure TfrmGeolocalizacion.rect_CancelarClick(Sender: TObject);
begin
  ModalResult := mrOk;
end;

procedure TfrmGeolocalizacion.rect_CancelarMouseEnter(Sender: TObject);
begin
  iGlow_Cancelar.Enabled := True;
end;

procedure TfrmGeolocalizacion.rect_CancelarMouseLeave(Sender: TObject);
begin
  iGlow_Cancelar.Enabled := false;
end;

procedure TfrmGeolocalizacion.rect_CancelarMouseUp(Sender: TObject;
Button: TMouseButton; Shift: TShiftState; X, Y: Single);
begin
  iGlow_Cancelar.Enabled := false;
  ModalResult := mrOk;
end;

end.
