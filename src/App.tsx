import { useMemo, useState } from 'react'
import ControlPanel from './components/ControlPanel'
import MapContainer from './components/MapContainer'
import routeData from './data/shibuyaRoute.json'
import { buildSegments } from './utils/route'
import type { Condition, RouteData } from './types'

const data = routeData as RouteData

export default function App() {
  const [condition, setCondition] = useState<Condition>('normal')
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  const segments = useMemo(() => buildSegments(data.points), [])

  return (
    <div className="flex flex-col md:flex-row h-screen w-screen overflow-hidden">
      <ControlPanel
        routeName={data.routeName}
        condition={condition}
        onConditionChange={setCondition}
        points={data.points}
        segments={segments}
        hoveredIndex={hoveredIndex}
        onHoverIndex={setHoveredIndex}
      />
      <main className="relative flex-1 min-h-[50vh] md:min-h-0">
        <MapContainer points={data.points} segments={segments} hoveredIndex={hoveredIndex} />
      </main>
    </div>
  )
}
