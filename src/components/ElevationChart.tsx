import type { RoutePoint, RouteSegment } from '../types'
import { SLOPE_LABELS } from '../utils/route'

interface Props {
  points: RoutePoint[]
  segments: RouteSegment[]
  hoveredIndex: number | null
  onHoverIndex: (index: number | null) => void
}

const WIDTH = 320
const HEIGHT = 140
const PAD_X = 12
const PAD_TOP = 16
const PAD_BOTTOM = 28

export default function ElevationChart({ points, segments, hoveredIndex, onHoverIndex }: Props) {
  const totalDistance = segments[segments.length - 1].cumulativeDistanceM
  const elevations = points.map((p) => p.elevation)
  const minElev = Math.min(...elevations)
  const maxElev = Math.max(...elevations)
  const elevRange = Math.max(1, maxElev - minElev)

  const innerW = WIDTH - PAD_X * 2
  const innerH = HEIGHT - PAD_TOP - PAD_BOTTOM

  const cumulative = [0, ...segments.map((s) => s.cumulativeDistanceM)]

  const coords = points.map(({ elevation }, i) => {
    const x = PAD_X + (cumulative[i] / totalDistance) * innerW
    const y = PAD_TOP + (1 - (elevation - minElev) / elevRange) * innerH
    return { x, y }
  })

  // 滑らかな波型のパスを生成（隣接点間をベジェ曲線で補間）
  let pathD = `M ${coords[0].x} ${coords[0].y}`
  for (let i = 0; i < coords.length - 1; i++) {
    const c0 = coords[i]
    const c1 = coords[i + 1]
    const midX = (c0.x + c1.x) / 2
    pathD += ` C ${midX} ${c0.y}, ${midX} ${c1.y}, ${c1.x} ${c1.y}`
  }

  const areaD = `${pathD} L ${coords[coords.length - 1].x} ${HEIGHT - PAD_BOTTOM} L ${coords[0].x} ${HEIGHT - PAD_BOTTOM} Z`

  const gradientStops = points.map((_, i) => {
    const offset = (cumulative[i] / totalDistance) * 100
    const color = segments[Math.min(i, segments.length - 1)].color
    return { offset, color }
  })

  const hovered = hoveredIndex != null ? coords[hoveredIndex] : null
  const hoveredPoint = hoveredIndex != null ? points[hoveredIndex] : null
  const hoveredSegment =
    hoveredIndex != null ? segments[Math.min(hoveredIndex, segments.length - 1)] : null

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full h-auto">
        <defs>
          <linearGradient id="elevationLine" x1="0" y1="0" x2="1" y2="0">
            {gradientStops.map((s, i) => (
              <stop key={i} offset={`${s.offset}%`} stopColor={s.color} />
            ))}
          </linearGradient>
          <linearGradient id="elevationFill" x1="0" y1="0" x2="1" y2="0">
            {gradientStops.map((s, i) => (
              <stop key={i} offset={`${s.offset}%`} stopColor={s.color} stopOpacity={0.18} />
            ))}
          </linearGradient>
        </defs>

        <path d={areaD} fill="url(#elevationFill)" stroke="none" />
        <path d={pathD} fill="none" stroke="url(#elevationLine)" strokeWidth={3} strokeLinecap="round" />

        {/* ホバー用の透明な領域 */}
        {points.map((_, i) => {
          const x0 = i === 0 ? coords[0].x : (coords[i - 1].x + coords[i].x) / 2
          const x1 =
            i === points.length - 1 ? coords[i].x : (coords[i].x + coords[i + 1].x) / 2
          return (
            <rect
              key={i}
              x={x0}
              y={0}
              width={Math.max(0, x1 - x0)}
              height={HEIGHT}
              fill="transparent"
              onMouseEnter={() => onHoverIndex(i)}
              onMouseLeave={() => onHoverIndex(null)}
              className="cursor-pointer"
            />
          )
        })}

        {hovered && (
          <>
            <line
              x1={hovered.x}
              y1={PAD_TOP}
              x2={hovered.x}
              y2={HEIGHT - PAD_BOTTOM}
              stroke="#9A3412"
              strokeWidth={1}
              strokeDasharray="3 3"
              opacity={0.5}
            />
            <circle cx={hovered.x} cy={hovered.y} r={5} fill="#fff" stroke="#EA580C" strokeWidth={2} />
          </>
        )}

        {/* 標高ラベル */}
        <text x={PAD_X} y={HEIGHT - 8} fontSize={10} fill="#9A8C82">
          {minElev}m
        </text>
        <text x={WIDTH - PAD_X} y={HEIGHT - 8} fontSize={10} fill="#9A8C82" textAnchor="end">
          {maxElev}m
        </text>
      </svg>

      {hoveredPoint && hoveredSegment && (
        <div className="absolute top-1 left-1 bg-white/95 rounded-lg shadow px-2 py-1 text-xs text-stone-700 pointer-events-none">
          <div className="font-bold">{hoveredPoint.label ?? `${hoveredIndex! + 1}地点目`}</div>
          <div>標高 {hoveredPoint.elevation}m</div>
          <div>
            傾斜 {Math.abs(hoveredSegment.slopePercent).toFixed(1)}%（{SLOPE_LABELS[hoveredSegment.category]}）
          </div>
        </div>
      )}
    </div>
  )
}
