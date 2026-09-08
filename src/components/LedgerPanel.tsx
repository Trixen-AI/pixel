import type { BoardStats } from '../game/engine'

interface Props {
  ledger: Record<string, number>
  stats: BoardStats
  onReset: () => void
}

export function LedgerPanel({ ledger, stats, onReset }: Props) {
  const entries = Object.entries(ledger).sort((a, b) => b[1] - a[1])
  const max = entries[0]?.[1] ?? 0

  return (
    <section className="panel">
      <div className="panel-head">
        <h2>Ledger</h2>
        <button type="button" className="btn quiet" onClick={onReset} style={{ padding: '6px 10px' }}>
          New board
        </button>
      </div>

      <dl className="stat-strip">
        <div>
          <dt>Yours</dt>
          <dd>{stats.yours}</dd>
        </div>
        <div>
          <dt>Rivals</dt>
          <dd>{stats.rivals}</dd>
        </div>
        <div>
          <dt>Open</dt>
          <dd>{stats.unclaimed}</dd>
        </div>
      </dl>

      {stats.bestTerritory && (
        <div className="kv" style={{ marginBottom: 12 }}>
          <div className="row">
            <span className="k">Your best territory</span>
            <span className="v">
              {stats.bestTerritory.size} × {stats.bestTerritory.ticker}
            </span>
          </div>
        </div>
      )}

      <div className="ledger">
        {entries.length === 0 ? (
          <p className="empty" style={{ margin: 0 }}>
            Nothing earned yet. Claim tiles, then settle a round.
          </p>
        ) : (
          entries.map(([ticker, amount]) => (
            <div className="row" key={ticker}>
              <span className="sym">{ticker}</span>
              <div className="bar" aria-hidden="true">
                <div style={{ width: `${max > 0 ? (amount / max) * 100 : 0}%` }} />
              </div>
              <span className="amt">{amount.toFixed(6)}</span>
            </div>
          ))
        )}
      </div>
    </section>
  )
}
