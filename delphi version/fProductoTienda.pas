unit fProductoTienda;

interface

uses
        System.SysUtils, System.Types, System.UITypes, System.Classes,
        System.Variants,
        FMX.Types, FMX.Graphics, FMX.Controls, FMX.Forms, FMX.Dialogs,
        FMX.StdCtrls,
        FMX.Objects, FMX.Controls.Presentation, FMX.Layouts, FMX.Memo.Types,
        FMX.ScrollBox, FMX.Memo;

type
        TfrmProductoTienda = class(TFrame)
                img1: TImage;
                lyt1: TLayout;
                lyt2: TLayout;
                lbl_Producto: TLabel;
                mmo_descripcion: TMemo;
                lyt3: TLayout;
                rectLink: TRectangle;
                lblPrecio: TLabel;
                lbl_link: TLabel;
                rectBackGround: TRectangle;
                rect1: TRectangle;
                rect2: TRectangle;
                procedure rectLinkClick(Sender: TObject);
        private
                { Private declarations }
        public
                { Public declarations }
        end;

implementation

{$R *.fmx}

uses
        DM1;

procedure TfrmProductoTienda.rectLinkClick(Sender: TObject);
var
        url: string;
begin
        url := Self.lbl_link.text;
        if url <> '' then
                AbrirEnlace(url);
end;

end.
