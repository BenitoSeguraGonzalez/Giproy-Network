unit fNotaRevision;

interface

uses
        System.SysUtils, System.Types, System.UITypes, System.Classes,
        System.Variants,
        FMX.Types, FMX.Graphics, FMX.Controls, FMX.Forms, FMX.Dialogs,
        FMX.StdCtrls,
        FMX.Memo.Types, FMX.ScrollBox, FMX.Memo, FMX.Controls.Presentation,
        FMX.Objects;

type
        Tframe_NotasRevision = class(TFrame)
                rect_2: TRectangle;
                lbl_Fecha: TLabel;
                mmoNotas: TMemo;
                lbl_Seccion: TLabel;
        private
                { Private declarations }
        public
                { Public declarations }

        end;

implementation

{$R *.fmx}

end.
