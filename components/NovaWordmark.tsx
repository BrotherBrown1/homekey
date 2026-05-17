// NOVA wordmark — sharp, condensed, geometric. Custom SVG glyphs designed
// for Nova: thin even strokes, square terminals, miter joins, no curves
// except where mathematically necessary. Renders identical on every device.

import * as React from "react";

type Props = React.SVGProps<SVGSVGElement> & { height?: number };

export function NovaWordmark({ height = 18, className, ...rest }: Props) {
  // Geometry: each letter occupies an 80×120 cell. Generous gap between
  // letters for an open, refined feel. Thinner stroke for elegance.
  const cell = { w: 80, h: 120 };
  const gap = 40;
  const stroke = 7;
  const totalW = 4 * cell.w + 3 * gap;
  const x = (i: number) => i * (cell.w + gap);

  // Half-stroke inset so square line endcaps still fall inside the cell.
  const inset = stroke / 2;
  const W = cell.w;
  const H = cell.h;

  return (
    <svg
      role="img"
      aria-label="NOVA"
      viewBox={`0 0 ${totalW} ${H}`}
      height={height}
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={stroke}
      strokeLinecap="square"
      strokeLinejoin="miter"
      {...rest}
    >
      {/* N — verticals connected by a single diagonal */}
      <g transform={`translate(${x(0)} 0)`}>
        <line x1={inset} y1={0} x2={inset} y2={H} />
        <line x1={W - inset} y1={0} x2={W - inset} y2={H} />
        <line x1={inset} y1={inset} x2={W - inset} y2={H - inset} />
      </g>

      {/* O — chamfered hexagon (sharp angles instead of a soft ellipse) */}
      <g transform={`translate(${x(1)} 0)`}>
        <polygon
          points={[
            `${W * 0.25},${inset}`,
            `${W - W * 0.25},${inset}`,
            `${W - inset},${H * 0.3}`,
            `${W - inset},${H - H * 0.3}`,
            `${W - W * 0.25},${H - inset}`,
            `${W * 0.25},${H - inset}`,
            `${inset},${H - H * 0.3}`,
            `${inset},${H * 0.3}`,
          ].join(" ")}
        />
      </g>

      {/* V — two diagonals to a sharp bottom point */}
      <g transform={`translate(${x(2)} 0)`}>
        <line x1={inset} y1={0} x2={W / 2} y2={H - inset / 2} />
        <line x1={W - inset} y1={0} x2={W / 2} y2={H - inset / 2} />
      </g>

      {/* A — two diagonals to a sharp top point + offset crossbar (Nova's mark) */}
      <g transform={`translate(${x(3)} 0)`}>
        <line x1={inset} y1={H} x2={W / 2} y2={inset / 2} />
        <line x1={W - inset} y1={H} x2={W / 2} y2={inset / 2} />
        <line x1={W * 0.27} y1={H * 0.62} x2={W * 0.73} y2={H * 0.62} />
      </g>
    </svg>
  );
}
