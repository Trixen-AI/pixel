import type { Regime, RoundResult } from '../game/types'
import { SECTOR_NAMES } from '../game/engine'

interface Props {
  round: number
  secondsLeft: number
  roundLength: number
  lastResult: RoundResult | null
  tilesHeld: number
  regime: Regime
  nextRegime: Regime
  onSettle: () => void
}

function fmt(n: number): string {
  return n.toFixed(6)
}

export function RoundPanel({
  round,
  secondsLeft,
  roundLength,
  lastResult,
  tilesHeld,
  regime,
  nextRegime,
  onSettle,
}: Props) {
  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, '0')
  const ss = String(secondsLeft % 60).padStart(2, '0')
  const pct = Math.max(0, Math.min(100, (secondsLeft / roundLength) * 100))

  const earnedEntries = lastResult
    ? Object.entries(lastResult.earned).sort((a, b) => b[1] - a[1])
    : []

  return (
    <section className="panel">
      <div className="panel-head">
        <h2>Round {round}</h2>
        <span className="aside">
          {tilesHeld} tile{tilesHeld === 1 ? '' : 's'} in play
        </span>
      </div>

      {/* The regime is announced before the round settles on purpose: the game
          is the conviction trade-off, not guessing what is coming. */}
      <div className="regime">
        <span className="regime-label">Regime in force</span>
        <b className="regime-name">{regime.name}</b>
        <span className="regime-note">{regime.note}</span>
        <div className="regime-legs">
          <span className="leg up">▲ {SECTOR_NAMES[regime.boost]}</span>
          <span className="leg down">▼ {SECTOR_NAMES[regime.drag]}</span>
        </div>
      </div>

      <div className="round">
        <div className="clock">
          {mm}:{ss}
          <small>until settlement</small>
        </div>
        <button type="button" className="btn" onClick={onSettle} disabled={tilesHeld === 0}>
          Settle now
        </button>
      </div>
      <div className="meter" aria-hidden="true">
        <div style={{ width: `${pct}%` }} />
      </div>

      <div className="forecast">
        <span>Next round</span>
        <b>{nextRegime.name}</b>
        <span className="legs">
          ▲ {SECTOR_NAMES[nextRegime.boost]} · ▼ {SECTOR_NAMES[nextRegime.drag]}
        </span>
      </div>

      {lastResult && (
        <div className="result">
          <div className="line">
            <span>Round {lastResult.round} · {lastResult.regime.name}</span>
          </div>
          <div className="line">
            <span>Best</span>
            <b>
              {lastResult.best} {lastResult.performance[lastResult.best]?.toFixed(2)}%
            </b>
          </div>
          <div className="line">
            <span>Worst</span>
            <b>
              {lastResult.worst} {lastResult.performance[lastResult.worst]?.toFixed(2)}%
            </b>
          </div>
          {lastResult.spread > 0 && (
            <div className="line">
              <span>Ground taken</span>
              <b>+{lastResult.spread} by spread</b>
            </div>
          )}
          <div className="line" style={{ marginTop: 8 }}>
            <span>You earned</span>
            <span className="earned">
              {earnedEntries.length === 0
                ? 'nothing — no tiles held'
                : earnedEntries.map(([t, v]) => `${fmt(v)} ${t}`).join(' · ')}
            </span>
          </div>
        </div>
      )}
    </section>
  )
}
