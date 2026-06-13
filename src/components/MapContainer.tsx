import { useEffect, useRef } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import type { RoutePoint, RouteSegment } from '../types'

interface Props {
  points: RoutePoint[]
  segments: RouteSegment[]
  hoveredIndex: number | null
}

const ROUTE_SOURCE = 'route'
const ROUTE_LAYER = 'route-line'
const HOVER_SOURCE = 'hover-point'
const HOVER_LAYER = 'hover-circle'

const style: maplibregl.StyleSpecification = {
  version: 8,
  sources: {
    osm: {
      type: 'raster',
      tiles: [
        'https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
        'https://b.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
        'https://c.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
        'https://d.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
      ],
      tileSize: 256,
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
    },
  },
  layers: [{ id: 'osm', type: 'raster', source: 'osm' }],
}

export default function MapContainer({ points, segments, hoveredIndex }: Props) {
  const mapDivRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)

  useEffect(() => {
    if (!mapDivRef.current) return

    const coords = points.map((p) => [p.lng, p.lat] as [number, number])
    const totalDistance = segments[segments.length - 1].cumulativeDistanceM
    const cumulative = [0, ...segments.map((s) => s.cumulativeDistanceM)]

    const bounds = coords.reduce(
      (b, c) => b.extend(c),
      new maplibregl.LngLatBounds(coords[0], coords[0])
    )

    const map = new maplibregl.Map({
      container: mapDivRef.current,
      style,
      bounds,
      fitBoundsOptions: { padding: 60 },
      canvasContextAttributes: { preserveDrawingBuffer: true },
    })
    mapRef.current = map

    map.on('error', (e) => {
      console.error('[Pochette] MapLibre error:', e.error)
    })

    // コンテナのサイズ変化（flexレイアウト確定など）に追従してリサイズ
    const resizeObserver = new ResizeObserver(() => map.resize())
    resizeObserver.observe(mapDivRef.current)

    map.on('load', () => {
      // ルート全体（lineMetrics有効）をソースとして追加し、傾斜に応じたグラデーションで描画
      map.addSource(ROUTE_SOURCE, {
        type: 'geojson',
        lineMetrics: true,
        data: {
          type: 'Feature',
          properties: {},
          geometry: { type: 'LineString', coordinates: [coords[0], coords[0]] },
        },
      })

      const gradientStops: unknown[] = ['interpolate', ['linear'], ['line-progress']]
      points.forEach((_, i) => {
        const fraction = cumulative[i] / totalDistance
        const color = segments[Math.min(i, segments.length - 1)].color
        gradientStops.push(Math.min(1, Math.max(0, fraction)), color)
      })

      map.addLayer({
        id: ROUTE_LAYER,
        type: 'line',
        source: ROUTE_SOURCE,
        paint: {
          'line-width': 6,
          'line-gradient': gradientStops as never,
        },
        layout: { 'line-cap': 'round', 'line-join': 'round' },
      })

      // 開始・終了地点のマーカー
      points.forEach((p, i) => {
        if (!p.label) return
        const el = document.createElement('div')
        el.style.width = '14px'
        el.style.height = '14px'
        el.style.borderRadius = '50%'
        el.style.background = i === 0 ? '#EA580C' : i === points.length - 1 ? '#9A3412' : '#FB923C'
        el.style.border = '2px solid white'
        el.style.boxShadow = '0 1px 3px rgba(0,0,0,0.3)'

        new maplibregl.Marker({ element: el })
          .setLngLat([p.lng, p.lat])
          .setPopup(new maplibregl.Popup({ offset: 12 }).setText(p.label))
          .addTo(map)
      })

      // ホバー連動マーカー用のソース
      map.addSource(HOVER_SOURCE, {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      })
      map.addLayer({
        id: HOVER_LAYER,
        type: 'circle',
        source: HOVER_SOURCE,
        paint: {
          'circle-radius': 8,
          'circle-color': '#fff',
          'circle-stroke-color': '#EA580C',
          'circle-stroke-width': 3,
        },
      })

      // ルートラインを少しずつ描画するアニメーション
      const duration = 1800
      const start = performance.now()

      function animate(now: number) {
        const t = Math.min(1, (now - start) / duration)
        const targetDistance = t * totalDistance

        const animatedCoords: [number, number][] = [coords[0]]
        for (let i = 1; i < coords.length; i++) {
          const segStart = cumulative[i - 1]
          const segEnd = cumulative[i]
          if (targetDistance >= segEnd) {
            animatedCoords.push(coords[i])
          } else if (targetDistance > segStart) {
            const ratio = (targetDistance - segStart) / (segEnd - segStart)
            const a = coords[i - 1]
            const b = coords[i]
            animatedCoords.push([a[0] + (b[0] - a[0]) * ratio, a[1] + (b[1] - a[1]) * ratio])
            break
          } else {
            break
          }
        }

        if (animatedCoords.length < 2) animatedCoords.push(coords[0])

        const source = map.getSource(ROUTE_SOURCE) as maplibregl.GeoJSONSource | undefined
        source?.setData({
          type: 'Feature',
          properties: {},
          geometry: { type: 'LineString', coordinates: animatedCoords },
        })

        if (t < 1) requestAnimationFrame(animate)
      }
      requestAnimationFrame(animate)
    })

    return () => {
      resizeObserver.disconnect()
      map.remove()
      mapRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ホバー中の地点をマップ上にハイライト
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    const update = () => {
      const source = map.getSource(HOVER_SOURCE) as maplibregl.GeoJSONSource | undefined
      if (!source) return
      if (hoveredIndex == null) {
        source.setData({ type: 'FeatureCollection', features: [] })
        return
      }
      const p = points[hoveredIndex]
      source.setData({
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            properties: {},
            geometry: { type: 'Point', coordinates: [p.lng, p.lat] },
          },
        ],
      })
    }

    if (map.isStyleLoaded()) update()
    else map.once('load', update)
  }, [hoveredIndex, points])

  return (
    <div
      ref={mapDivRef}
      className="absolute inset-0"
      style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }}
    />
  )
}
