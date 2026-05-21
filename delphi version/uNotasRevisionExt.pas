unit uNotasRevisionExt;

interface

uses
        System.SysUtils, System.Types, System.UITypes, System.Classes,
        System.Variants,
        FMX.Types, FMX.Graphics, FMX.Controls, FMX.Forms, FMX.Dialogs,
        FMX.StdCtrls,
        FMX.Layouts, FMX.Memo.Types, FMX.Objects, FMX.Controls.Presentation,
        FMX.ScrollBox, FMX.Memo;

type
        TfrmNotasRevisionExt = class(TFrame)
                lyt_2: TLayout;
                mmoNotas: TMemo;
                rect_2: TRectangle;
                lbl_Fecha: TLabel;
                lbl_Seccion: TLabel;
                lbl_idItem: TLabel;
                lyt_1: TLayout;
                rect_1: TRectangle;
                rect_3: TRectangle;
        private
                { Private declarations }
        public
                { Public declarations }
        end;

implementation

{$R *.fmx}

uses
        DM1;

end.
