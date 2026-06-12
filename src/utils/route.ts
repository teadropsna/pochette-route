import type { RoutePoint, RouteSegment, SlopeCategory } from '../types'

export const SLOPE_COLORS: Record<SlopeCategory, string> = {
  safe: '#FFD9A8',
  caution: '#FB923C',
  danger: '#EF4444',
}

export const SLOPE_LABELS: Record<SlopeCategory, string> = {
  safe: 'ほぼ平坦',
  caution: 'やや坂道',
  danger: '急な坂',
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180
}

// 2点間の距離をメートルで算出（ハーバーサイン公式）
export function haversineDistance(a: RoutePoint, b: RoutePoint): number {
  const R = 6371000
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2

  return 2 * R * Math.asin(Math.sqrt(h))
}

function categorize(slopePercent: number): SlopeCategory {
  const abs = Math.abs(slopePercent)
  if (abs >= 8) return 'danger'
  if (abs >= 3) return 'caution'
  return 'safe'
}

// 各区間の距離・標高差・傾斜度（%）を計算する
export function buildSegments(points: RoutePoint[]): RouteSegment[] {
  let cumulative = 0

  return points.slice(0, -1).map((from, i) => {
    const to = points[i + 1]
    const distanceM = haversineDistance(from, to)
    const elevationDiffM = to.elevation - from.elevation
    const slopePercent = distanceM === 0 ? 0 : (elevationDiffM / distanceM) * 100
    const category = categorize(slopePercent)
    cumulative += distanceM

    return {
      from,
      to,
      fromIndex: i,
      toIndex: i + 1,
      distanceM,
      elevationDiffM,
      slopePercent,
      category,
      color: SLOPE_COLORS[category],
      cumulativeDistanceM: cumulative,
    }
  })
}
