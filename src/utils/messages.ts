import type { Condition, RouteSegment } from '../types'

type RouteSegmentT = RouteSegment

function totalDistance(segments: RouteSegmentT[]): number {
  return segments.reduce((sum, s) => sum + s.distanceM, 0)
}

function totalAscent(segments: RouteSegmentT[]): number {
  return segments.reduce((sum, s) => sum + Math.max(0, s.elevationDiffM), 0)
}

function steepestSegment(segments: RouteSegmentT[]): RouteSegmentT {
  return segments.reduce((max, s) =>
    Math.abs(s.slopePercent) > Math.abs(max.slopePercent) ? s : max
  )
}

// 区間の方向（上り/下り）に応じて自然な言い回しになる目印を返す
function segmentLandmark(segment: RouteSegmentT): string {
  if (segment.elevationDiffM >= 0) {
    return segment.from.label
      ? `「${segment.from.label}」の先`
      : `${segment.fromIndex + 1}点目の地点の先`
  }
  return segment.to.label
    ? `「${segment.to.label}」の手前`
    : `${segment.toIndex + 1}点目の地点の手前`
}

const CONDITION_META: Record<Condition, { title: string; icon: string }> = {
  normal: { title: '今日は元気（通常）', icon: '🏃‍♂️' },
  stroller: { title: 'ベビーカー・車椅子', icon: '👶' },
  'heavy-bag': { title: '重い荷物あり', icon: '🧳' },
}

export function getConditionMeta(condition: Condition) {
  return CONDITION_META[condition]
}

// 選択中のコンディションに応じて、ルートの「優しさ」を解説する文章を生成する
export function generateGuidance(condition: Condition, segments: RouteSegmentT[]): string {
  const dist = Math.round(totalDistance(segments))
  const ascent = Math.round(totalAscent(segments))
  const steep = steepestSegment(segments)

  if (condition === 'stroller') {
    const dangerSegments = segments.filter((s) => s.category === 'danger')
    if (dangerSegments.length === 0) {
      return `このルートに急な坂はありません。全長${dist}mを、ベビーカーでもゆったり進めます。焦らず、景色を楽しみながら歩いてみてくださいね。`
    }
    const worst = steep
    const place = segmentLandmark(worst)
    const len = Math.round(worst.distanceM)
    return `${place}に、斜度${Math.abs(worst.slopePercent).toFixed(1)}%の急な坂が${len}mほど続きます。焦らず、ゆっくり深呼吸して進みましょう。その先には平坦な道が広がっていますよ。`
  }

  if (condition === 'heavy-bag') {
    const cautionOrWorse = segments.filter((s) => s.category !== 'safe')
    if (cautionOrWorse.length === 0) {
      return `全長${dist}m、高低差${ascent}mのゆるやかなルートです。重い荷物があっても、休憩なしで歩き切れそうです。`
    }
    const place = segmentLandmark(steep)
    return `${place}にやや勾配のある区間があります（最大斜度${Math.abs(steep.slopePercent).toFixed(1)}%）。重い荷物があるときは、無理せず一度荷物を下ろして一呼吸入れるのもおすすめです。`
  }

  // normal
  return `全長${dist}m、累積の上り${ascent}mのルートです。最大斜度は${Math.abs(steep.slopePercent).toFixed(1)}%（${segmentLandmark(steep)}）。渋谷ならではのすり鉢地形を、坂道散策として楽しんでみましょう。`
}
