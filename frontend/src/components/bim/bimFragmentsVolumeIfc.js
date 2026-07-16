export const buildBimFragmentsVolumeIfc = ({ wallCount = 25 } = {}) => {
    const normalizedWallCount = Math.max(1, Number(wallCount) || 1);
    const placements = [];
    const walls = [];
    const wallRefs = [];

    for (let index = 0; index < normalizedWallCount; index += 1) {
        const pointId = 1000 + index;
        const axisId = 2000 + index;
        const placementId = 3000 + index;
        const wallId = 4000 + index;
        const x = index * 450;

        placements.push(`#${pointId}=IFCCARTESIANPOINT((${x}.,0.,0.));`);
        placements.push(`#${axisId}=IFCAXIS2PLACEMENT3D(#${pointId},#15,#16);`);
        placements.push(`#${placementId}=IFCLOCALPLACEMENT(#13,#${axisId});`);
        walls.push(
            `#${wallId}=IFCWALL('0p3fMZQGz7KxQ1YkSm${String(index).padStart(4, '0')}',$,'Muro volumen ${index + 1}',$,$,#${placementId},#26,$);`,
        );
        wallRefs.push(`#${wallId}`);
    }

    return `
ISO-10303-21;
HEADER;
FILE_DESCRIPTION(('GiProy BIM fragments volume smoke'),'2;1');
FILE_NAME('giproy-bim-fragments-volume.ifc','2026-07-09T00:00:00',('GiProy'),('GiProy'),'GiProy BIM','GiProy BIM','');
FILE_SCHEMA(('IFC4'));
ENDSEC;
DATA;
#1=IFCPROJECT('0p3fMZQGz7KxQ1YkSm0001',$,'GiProy Fragments Volume',$,$,$,$,$,$);
#2=IFCUNITASSIGNMENT((#3,#4));
#3=IFCSIUNIT(*,.LENGTHUNIT.,.MILLI.,.METRE.);
#4=IFCSIUNIT(*,.AREAUNIT.,$,.SQUARE_METRE.);
#5=IFCGEOMETRICREPRESENTATIONCONTEXT($,'Model',3,1.E-05,#6,$);
#6=IFCAXIS2PLACEMENT3D(#7,$,$);
#7=IFCCARTESIANPOINT((0.,0.,0.));
#8=IFCSITE('0p3fMZQGz7KxQ1YkSm0002',$,'Sitio',$,$,#9,$,$,.ELEMENT.,$,$,$,$,$);
#9=IFCLOCALPLACEMENT($,#6);
#10=IFCBUILDING('0p3fMZQGz7KxQ1YkSm0003',$,'Edificio',$,$,#11,$,$,.ELEMENT.,$,$,$);
#11=IFCLOCALPLACEMENT(#9,#6);
#12=IFCBUILDINGSTOREY('0p3fMZQGz7KxQ1YkSm0004',$,'Nivel volumen',$,$,#13,$,$,.ELEMENT.,0.);
#13=IFCLOCALPLACEMENT(#11,#6);
#14=IFCCARTESIANPOINT((0.,0.,0.));
#15=IFCDIRECTION((0.,0.,1.));
#16=IFCDIRECTION((1.,0.,0.));
#17=IFCAXIS2PLACEMENT3D(#14,#15,#16);
#19=IFCCARTESIANPOINT((0.,0.));
#21=IFCDIRECTION((1.,0.));
#22=IFCAXIS2PLACEMENT2D(#19,#21);
#23=IFCRECTANGLEPROFILEDEF(.AREA.,'GiProyWallProfile',#22,200.,3000.);
#24=IFCEXTRUDEDAREASOLID(#23,#17,#15,3000.);
#25=IFCSHAPEREPRESENTATION(#5,'Body','SweptSolid',(#24));
#26=IFCPRODUCTDEFINITIONSHAPE($,$,(#25));
${placements.join('\n')}
${walls.join('\n')}
#30=IFCRELAGGREGATES('0p3fMZQGz7KxQ1YkSm0030',$,$,$,#1,(#8));
#31=IFCRELAGGREGATES('0p3fMZQGz7KxQ1YkSm0031',$,$,$,#8,(#10));
#32=IFCRELAGGREGATES('0p3fMZQGz7KxQ1YkSm0032',$,$,$,#10,(#12));
#33=IFCRELCONTAINEDINSPATIALSTRUCTURE('0p3fMZQGz7KxQ1YkSm0033',$,$,$,(${wallRefs.join(',')}),#12);
ENDSEC;
END-ISO-10303-21;
`;
};

export default buildBimFragmentsVolumeIfc;
