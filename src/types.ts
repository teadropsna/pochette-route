export type Condition = 'normal' | 'stroller' | 'heavy-bag'

export interface RoutePoint {
  lng: number
  lat: number
  elevation: number
  label?: string
}

export type SlopeCategory = 'safe' | 'caution' | 'danger'

export interface RouteSegment {
  from: RoutePoint
  to: RoutePoint
  fromIndex: number
  toIndex: number
  distanceM: number
  elevationDiffM: number
  slopePercent: number
  category: SlopeCategory
  color: string
  cumulativeDistanceM: number
}

export interface RouteData {
  routeName: string
  points: RoutePoint[]
}
