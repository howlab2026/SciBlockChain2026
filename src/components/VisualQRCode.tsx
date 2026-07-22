// Custom QR Code visual component using SVG
export function VisualQRCode({ value, size = 160 }: { value: string; size?: number }) {
  let seed = 0;
  for (let i = 0; i < value.length; i++) {
    seed = (seed << 5) - seed + value.charCodeAt(i);
    seed |= 0;
  }
  const random = () => {
    const x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
  };

  const gridSize = 19;
  const grid = Array.from({ length: gridSize }, () => Array(gridSize).fill(0));

  // Top-left finder pattern
  for (let r = 0; r < 6; r++) {
    for (let c = 0; c < 6; c++) {
      if (r === 0 || r === 5 || c === 0 || c === 5 || (r >= 2 && r <= 3 && c >= 2 && c <= 3)) {
        grid[r][c] = 1;
      }
    }
  }
  // Top-right finder pattern
  for (let r = 0; r < 6; r++) {
    for (let c = gridSize - 6; c < gridSize; c++) {
      const relC = c - (gridSize - 6);
      if (r === 0 || r === 5 || relC === 0 || relC === 5 || (r >= 2 && r <= 3 && relC >= 2 && relC <= 3)) {
        grid[r][c] = 1;
      }
    }
  }
  // Bottom-left finder pattern
  for (let r = gridSize - 6; r < gridSize; r++) {
    for (let c = 0; c < 6; c++) {
      const relR = r - (gridSize - 6);
      if (relR === 0 || relR === 5 || c === 0 || c === 5 || (relR >= 2 && relR <= 3 && c >= 2 && c <= 3)) {
        grid[r][c] = 1;
      }
    }
  }

  // Random modules with seed
  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      if (r < 7 && c < 7) continue;
      if (r < 7 && c >= gridSize - 7) continue;
      if (r >= gridSize - 7 && c < 7) continue;
      if (
        r >= Math.floor(gridSize / 2) - 2 &&
        r <= Math.floor(gridSize / 2) + 2 &&
        c >= Math.floor(gridSize / 2) - 2 &&
        c <= Math.floor(gridSize / 2) + 2
      ) continue;
      grid[r][c] = random() > 0.4 ? 1 : 0;
    }
  }

  const cellSize = size / gridSize;

  return (
    <div style={{
      position: 'relative',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '12px',
      backgroundColor: 'white',
      borderRadius: '12px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
      border: '1px solid rgba(255,255,255,0.1)'
    }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {grid.map((row, r) =>
          row.map((cell, c) => {
            if (!cell) return null;
            return (
              <rect
                key={`${r}-${c}`}
                x={c * cellSize}
                y={r * cellSize}
                width={cellSize - 0.4}
                height={cellSize - 0.4}
                fill="#0b0f19"
                rx={1}
              />
            );
          })
        )}
      </svg>
      <div style={{
        position: 'absolute',
        width: '34px',
        height: '34px',
        borderRadius: '50%',
        backgroundColor: '#3b82f6',
        border: '3px solid white',
        boxShadow: '0 2px 8px rgba(59, 130, 246, 0.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontWeight: 'bold',
        fontSize: '11px',
        fontFamily: 'Outfit, sans-serif'
      }}>
        Sci
      </div>
    </div>
  );
}
