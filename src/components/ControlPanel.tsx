import type { Condition, RoutePoint, RouteSegment } from '../types'
import { generateGuidance, getConditionMeta } from '../utils/messages'
import ElevationChart from './ElevationChart'

interface Props {
  routeName: string
  condition: Condition
  onConditionChange: (c: Condition) => void
  points: RoutePoint[]
  segments: RouteSegment[]
  hoveredIndex: number | null
  onHoverIndex: (index: number | null) => void
}

const CONDITIONS: Condition[] = ['normal', 'stroller', 'heavy-bag']

export default function ControlPanel({
  routeName,
  condition,
  onConditionChange,
  points,
  segments,
  hoveredIndex,
  onHoverIndex,
}: Props) {
  return (
    <aside className="w-full md:w-[380px] shrink-0 bg-orange-50 border-r border-orange-100 flex flex-col gap-5 p-5 overflow-y-auto">
      {/* ヘッダー */}
      <header className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-2xl bg-orange-400 flex items-center justify-center text-2xl shadow-sm">
          🧡
        </div>
        <div>
          <h1 className="text-lg font-bold text-stone-800 leading-tight">ポシェット・ルート</h1>
          <p className="text-xs text-stone-500">Pochette Route</p>
        </div>
      </header>

      {/* コンディション選択 */}
      <section>
        <h2 className="text-sm font-bold text-stone-600 mb-2">今日のあなたは？</h2>
        <div className="flex flex-col gap-2">
          {CONDITIONS.map((c) => {
            const meta = getConditionMeta(c)
            const active = c === condition
            return (
              <button
                key={c}
                onClick={() => onConditionChange(c)}
                className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-bold transition-all border ${
                  active
                    ? 'bg-orange-400 text-white border-orange-400 shadow-md scale-[1.02]'
                    : 'bg-white text-stone-600 border-orange-100 hover:border-orange-300'
                }`}
              >
                <span className="text-xl">{meta.icon}</span>
                <span>{meta.title}</span>
              </button>
            )
          })}
        </div>
      </section>

      {/* ルート詳細カード */}
      <section className="bg-white rounded-2xl p-4 shadow-sm border border-orange-100">
        <h2 className="text-sm font-bold text-stone-600 mb-1">{routeName}</h2>
        <p className="text-sm text-stone-600 leading-relaxed">
          {generateGuidance(condition, segments)}
        </p>
      </section>

      {/* 高低差グラフ */}
      <section className="bg-white rounded-2xl p-4 shadow-sm border border-orange-100">
        <h2 className="text-sm font-bold text-stone-600 mb-2">高低差プロフィール</h2>
        <ElevationChart
          points={points}
          segments={segments}
          hoveredIndex={hoveredIndex}
          onHoverIndex={onHoverIndex}
        />
        <div className="flex items-center justify-center gap-4 mt-2 text-xs text-stone-500">
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full inline-block" style={{ background: '#FFD9A8' }} />
            安全（0〜3%）
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full inline-block" style={{ background: '#FB923C' }} />
            注意（3〜8%）
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full inline-block" style={{ background: '#EF4444' }} />
            警戒（8%以上）
          </span>
        </div>
      </section>
    </aside>
  )
}
