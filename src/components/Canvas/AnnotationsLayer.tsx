import { Annotation } from '../../types';

interface Props {
  annotations: Annotation[];
  // 坐标转换：annotation 的 x/y 是「柱子索引/高度值」语义，需转成 SVG 像素
  toY: (heightValue: number) => number;
  barCenterX: (barIndex: number) => number;
}

export function AnnotationsLayer({ annotations, toY, barCenterX }: Props) {
  return (
    <>
      {annotations.map(a => {
        if (a.type === 'text') {
          return (
            <text key={a.id} x={barCenterX(a.x)} y={toY(a.y)} textAnchor="middle" fontSize={11} fill={a.color || '#666'} fontWeight="bold">
              {a.text}
            </text>
          );
        }
        if (a.type === 'arrow' && a.fromX !== undefined && a.toX !== undefined && a.fromY !== undefined && a.toY !== undefined) {
          const x1 = barCenterX(a.fromX);
          const x2 = barCenterX(a.toX);
          const y = toY(a.fromY) - 18; // 箭头画在柱顶上方
          const midX = (x1 + x2) / 2;
          return (
            <g key={a.id}>
              <line x1={x1} y1={y} x2={x2} y2={y} stroke={a.color || '#666'} strokeWidth={2} markerEnd="url(#arrowhead)" />
              {a.text && (
                <text x={midX} y={y - 6} textAnchor="middle" fontSize={10} fill={a.color || '#666'} fontWeight="600">
                  {a.text}
                </text>
              )}
            </g>
          );
        }
        return null;
      })}
    </>
  );
}
