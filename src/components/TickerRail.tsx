import { PHASE_1_TICKERS } from '../config/tokens'
import { FLOOR_TICKER, SECTOR_OF } from '../game/engine'
import type { Regime } from '../game/types'
import type { MultipliersResult } from '../chain/useMultipliers'

interface Props {
  active: string
  onPick: (ticker: string) => void
  held: Record<string, number>
  multipliers: MultipliersResult
  regime: Regime
}

export function TickerRail({ active, onPick, held, multipliers, regime }: Props) {
  return (
    <section className="panel">
      <div className="panel-head">
        <h2>Stake to</h2>
        <span className="aside">
          {multipliers.isLoading
            ? 'reading chain…'
            : multipliers.isError
              ? 'chain read failed — retrying'
              : `uiMultiplier() live${multipliers.blockNumber ? ` · block ${multipliers.blockNumber.toString()}` : ''}`}
        </span>
      </div>
      <div className="rail" role="radiogroup" aria-label="Ticker">
        {PHASE_1_TICKERS.map((ticker) => {
          const reading = multipliers.byTicker[ticker]
          const value = reading?.multiplier ?? null
          const up = value !== null && value > 1
          const label = value !== null ? value.toFixed(6) : multipliers.isLoading ? '…' : 'no read'

          const sector = SECTOR_OF[ticker]
          const boosted = sector === regime.boost && ticker !== FLOOR_TICKER
          const dragged = sector === regime.drag && ticker !== FLOOR_TICKER
          const tilt = boosted ? '▲' : dragged ? '▼' : ''
          const tiltLabel = boosted
            ? `favoured by ${regime.name}`
            : dragged
              ? `held back by ${regime.name}`
              : ''

          return (
            <button
              key={ticker}
              type="button"
              role="radio"
              aria-checked={active === ticker}
              aria-pressed={active === ticker}
              aria-label={`${ticker}${tiltLabel ? `, ${tiltLabel}` : ''}`}
              className={`chip${ticker === FLOOR_TICKER ? ' floor' : ''}${boosted ? ' boosted' : ''}${dragged ? ' dragged' : ''}`}
              onClick={() => onPick(ticker)}
            >
              <span className="sym">
                {ticker}
                {tilt && (
                  <i className="tilt" aria-hidden="true">
                    {tilt}
                  </i>
                )}
              </span>
              <span className={`mult${up ? ' up' : ''}`}>
                {label}
                {reading?.paused ? ' PAUSED' : ''}
              </span>
              <span className="held">{held[ticker] ? `${held[ticker]} on board` : 'unstaked'}</span>
            </button>
          )
        })}
      </div>
    </section>
  )
}
