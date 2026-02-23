import type { FC, CSSProperties } from 'react';

type LogoVariant = 'full' | 'compact' | 'monogram';
type LogoColor = 'institutional' | 'white' | 'dark';

interface LogoProps {
  variant?: LogoVariant;
  color?: LogoColor;
  width?: number;
  className?: string;
  style?: CSSProperties;
}

const COLOR_MAP: Record<LogoColor, { fill: string; text: string }> = {
  institutional: { fill: '#1E9EBC', text: '#1E9EBC' },
  white: { fill: '#FFFFFF', text: '#FFFFFF' },
  dark: { fill: '#1A1A1A', text: '#1A1A1A' },
};

/**
 * SDUI Logo — geometric monogram based on 3x3 modular grid
 * per the Manual de Identidad Corporativa Institucional.
 *
 * Variants:
 *  - full:      monogram + "SDUI" + descriptor
 *  - compact:   monogram + "SDUI"
 *  - monogram:  icon only (favicon, avatars)
 */
export const Logo: FC<LogoProps> = ({
  variant = 'compact',
  color = 'institutional',
  width,
  className,
  style,
}) => {
  const { fill, text } = COLOR_MAP[color];

  // Monogram grid: 3x3 with cells (1,1) and (1,2) empty — forms "C" bracket
  // Each cell is 10x10 with 2px gap
  const cellSize = 10;
  const gap = 2;
  const gridCells = [
    // Row 0
    { row: 0, col: 0 },
    { row: 0, col: 1 },
    { row: 0, col: 2 },
    // Row 1 — only left cell filled
    { row: 1, col: 0 },
    // Row 2
    { row: 2, col: 0 },
    { row: 2, col: 1 },
    { row: 2, col: 2 },
  ];

  const monogramWidth = cellSize * 3 + gap * 2; // 34
  const monogramHeight = cellSize * 3 + gap * 2; // 34

  if (variant === 'monogram') {
    const defaultWidth = width ?? 32;
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox={`0 0 ${monogramWidth} ${monogramHeight}`}
        width={defaultWidth}
        height={defaultWidth}
        className={className}
        style={style}
        role="img"
        aria-label="SDUI"
      >
        {gridCells.map(({ row, col }) => (
          <rect
            key={`${row}-${col}`}
            x={col * (cellSize + gap)}
            y={row * (cellSize + gap)}
            width={cellSize}
            height={cellSize}
            rx={1}
            fill={fill}
          />
        ))}
      </svg>
    );
  }

  // Compact & full: monogram + text
  const textX = monogramWidth + 8;
  const sduiFontSize = 22;
  const descriptorFontSize = 6.5;

  const totalWidth = variant === 'full' ? 160 : 110;
  const totalHeight = variant === 'full' ? monogramHeight : monogramHeight;
  const defaultWidth = width ?? (variant === 'full' ? 200 : 140);

  // Center monogram vertically
  const monogramY = 0;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${totalWidth} ${totalHeight}`}
      width={defaultWidth}
      height={defaultWidth * (totalHeight / totalWidth)}
      className={className}
      style={style}
      role="img"
      aria-label="SDUI — Sistema Digital Urbano Inteligente"
    >
      {/* Monogram grid */}
      <g transform={`translate(0, ${monogramY})`}>
        {gridCells.map(({ row, col }) => (
          <rect
            key={`${row}-${col}`}
            x={col * (cellSize + gap)}
            y={row * (cellSize + gap)}
            width={cellSize}
            height={cellSize}
            rx={1}
            fill={fill}
          />
        ))}
      </g>

      {/* "SDUI" text */}
      <text
        x={textX}
        y={variant === 'full' ? 20 : 23}
        fontFamily="'IBM Plex Sans', sans-serif"
        fontWeight={600}
        fontSize={sduiFontSize}
        fill={text}
        letterSpacing="1"
      >
        SDUI
      </text>

      {/* Descriptor — full variant only */}
      {variant === 'full' && (
        <text
          x={textX}
          y={31}
          fontFamily="'IBM Plex Sans', sans-serif"
          fontWeight={400}
          fontSize={descriptorFontSize}
          fill={text}
          letterSpacing="1.2"
          opacity={0.85}
        >
          SISTEMA DIGITAL URBANO INTELIGENTE
        </text>
      )}
    </svg>
  );
};
