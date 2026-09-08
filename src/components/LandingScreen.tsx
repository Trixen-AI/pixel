import { AttractBackground } from './AttractBackground'
import { XLink } from './XLink'
import { robinhoodChain } from '../config/chain'
import { FLOOR_TICKER } from '../game/engine'
import type { MultipliersResult } from '../chain/useMultipliers'

interface Props {
  multipliers: MultipliersResult
  onPlay: () => void
}

const MECHANICS = [
  {
    name: 'Territory',
    line: 'Tiles staked to the same ticker and touching side by side pay a bonus together, whoever owns them.',
  },
  {
    name: 'Conviction',
    line: 'Hold a tile on one ticker and it compounds to 2.00×. Re-stake and it drops to nothing.',
  },
  {
    name: 'Contagion',
    line: 'A block of four or more spreads into open ground every round. The board fills. Land runs out.',
  },
]

export function LandingScreen({ multipliers, onPlay }: Props) {
  const floor = multipliers.byTicker[FLOOR_TICKER]
  const chainReadable = !multipliers.isError && floor?.multiplier != null

  return (
    <div className="landing">
      <AttractBackground />
      <div className="landing-scrim" aria-hidden="true" />

      <main className="landing-inner">
        <p className="landing-eyebrow">Robinhood Chain · 32 × 32 · 1,024 tiles</p>

        <h1 className="landing-title">
          PIXEL
          <br />
          DIVIDEND
        </h1>

        <p className="landing-lede">
          Every tile is staked to a real tokenized stock. Hold ground, pick the regime, and the
          board pays out what the treasury earns.
        </p>

        <button type="button" className="play" onClick={onPlay} autoFocus>
          ▶ PLAY
        </button>

        <dl className="landing-live">
          <div>
            <dt>Chain</dt>
            <dd>{robinhoodChain.id}</dd>
          </div>
          <div>
            <dt>Block</dt>
            <dd>{multipliers.blockNumber ? multipliers.blockNumber.toString() : '—'}</dd>
          </div>
          <div>
            <dt>{FLOOR_TICKER} multiplier</dt>
            <dd>
              {floor?.multiplier != null
                ? floor.multiplier.toFixed(6)
                : multipliers.isLoading
                  ? 'reading…'
                  : 'no read'}
            </dd>
          </div>
          <div>
            <dt>Source</dt>
            <dd className={chainReadable ? 'ok' : ''}>
              {chainReadable ? 'live on-chain' : multipliers.isLoading ? 'connecting' : 'unreachable'}
            </dd>
          </div>
        </dl>

        <ul className="landing-mechanics">
          {MECHANICS.map((mechanic) => (
            <li key={mechanic.name}>
              <b>{mechanic.name}</b>
              <span>{mechanic.line}</span>
            </li>
          ))}
        </ul>

        <div className="landing-social">
          <XLink />
        </div>
      </main>
    </div>
  )
}
