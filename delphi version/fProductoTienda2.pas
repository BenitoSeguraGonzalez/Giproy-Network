unit fProductoTienda2;

interface

uses
        System.SysUtils, System.Types, System.UITypes, System.Classes,
        System.Variants,
        FMX.Types, FMX.Graphics, FMX.Controls, FMX.Forms, FMX.Dialogs,
        FMX.StdCtrls,
        FMX.Controls.Presentation, FMX.Objects, FMX.Layouts;

type
        TfrmProductoTienda2 = class(TFrame)
                lyt1: TLayout;
                rectBackground: TRectangle;
                imgProducto: TImage;
                lblPrecio: TLabel;
                lyt2: TLayout;
                lblProducto: TLabel;
                lblLink: TLabel;
                procedure lyt2Click(Sender: TObject);
        private
                { Private declarations }
        public
                { Public declarations }
        end;

implementation

{$R *.fmx}

uses
        DM1;

procedure TfrmProductoTienda2.lyt2Click(Sender: TObject);
var
        urlLink: string;
begin
        urlLink := Self.lblLink.Text;
        if urlLink <> '' then
        begin
                AbrirEnlace(urlLink);
        end;
end;

end.
