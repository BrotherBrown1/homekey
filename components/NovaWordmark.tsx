// Hand-drawn NOVA wordmark, modeled on Tesla's logotype:
// - Even, thin strokes
// - Sharp corners, no rounded terminals
// - "A" with no horizontal crossbar (triangle apex)
// - Wide, equal letter spacing
//
// Pure SVG so it renders identically on every device and never depends on a
// webfont. Color inherits from the parent via currentColor.

import * as React from "react";

type Props = React.SVGProps<SVGSVGElement> & { height?: number };

export function NovaWordmark({
  height = 18,
  className,
  ...rest
}: Props) {
  // Each letter is drawn inside a 60×100 grid, total 4 letters + 3 gaps.
  // Letter width 60, gap 36 → total width 4*60 + 3*36 = 348.
  const letterW = 60;
  const gap = 36;
  const stroke = 8;
  const w = 4 * letterW + 3 * gap;
  const h = 100;

  const x = (i: number) => i * (letterW + gap);

  return (
    <svg
      role="img"
      aria-label="NOVA"
      viewBox={`0 0 ${w} ${h}`}
      height={height}
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={stroke}
      strokeLinecap="square"
      strokeLinejoin="miter"
      {...rest}
    >
      {/* N — two verticals + diagonal */}
      <g transform={`translate(${x(0)} 0)`}>
        <line x1={stroke / 2} y1={0} x2={stroke / 2} y2={h} />
        <line x1={letterW - stroke / 2} y1={0} x2={letterW - stroke / 2} y2={h} />
        <line x1={stroke / 2} y1={0} x2={letterW - stroke / 2} y2={h} />
      </g>

      {/* O — a perfect ellipse (Tesla letterforms favor pure geometric primitives) */}
      <g transform={`translate(${x(1)} 0)`}>
        <ellipse
          cx={letterW / 2}
          cy={h / 2}
          rx={letterW / 2 - stroke / 2}
          ry={h / 2 - stroke / 2}
        />
      </g>

      {/* V — two diagonals meeting at bottom point */}
      <g transform={`translate(${x(2)} 0)`}>
        <line x1={stroke / 2} y1={0} x2={letterW / 2} y2={h} />
        <line x1={letterW - stroke / 2} y1={0} x2={letterW / 2} y2={h} />
      </g>

      {/* A — two diagonals meeting at top point, NO crossbar (Tesla A) */}
      <g transform={`translate(${x(3)} 0)`}>
        <line x1={stroke / 2} y1={h} x2={letterW / 2} y2={0} />
        <line x1={letterW - stroke / 2} y1={h} x2={letterW / 2} y2={0} />
      </g>
    </svg>
  );
}
