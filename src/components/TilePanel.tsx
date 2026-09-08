import { tileLabel, type Tile } from '../game/types'
import {
  RULES,
  SECTOR_NAMES,
  SECTOR_OF,
  convictionBonus,
  roundsHeld,
  territoryBonus,
  type Territories,
} from '../game/engine'
import { byTicker } from '../config/tokens'
import type { MultiplierReading } from '../chain/useMultipliers'

interface Props {
  index: number | null
  tile: Tile | null
  territories: Territories
  reading?: MultiplierReading
  round: number
}

export function TilePanel({ index, tile, territories, reading, round }: Props) {
  if (index === null || !tile) {
    return (
      <section className="panel" aria-live="polite">
        <div className="panel-head">
          <h2>Tile</h2>
        </div>
        <p style={{ margin: 0, color: 'var(--dim)' }}>Hover or select a tile to inspect it.</p>
      </section>
    )
  }

  const size = territories.sizeOf[index] ?? 0
  const token = tile.ticker ? byTicker(tile.ticker) : undefined
  const owner =
    tile.owner === 'you' ? 'You' : tile.owner === 'rival' ? `Rival ${tile.rivalId + 1}` : 'Nobody'

  const held = roundsHeld(tile, round)
  const conviction = convictionBonus(tile, round)
  const sector = tile.ticker ? SECTOR_OF[tile.ticker] : undefined
  const combined = tile.ticker ? territoryBonus(size) * conviction : 0
  const spreads = tile.ticker != null && size >= RULES.spreadMinSize

  return (
    <section className="panel" aria-live="polite">
      <div className="tile-id">
        {tileLabel(index)}
        <small>#{index + 1} of 1024</small>
      </div>
      <div className="kv">
        <div className="row">
          <span className="k">Held by</span>
          <span className="v">{owner}</span>
        </div>
        <div className="row">
          <span className="k">Staked to</span>
          <span className="v">{tile.ticker ?? '—'}</span>
        </div>
        {sector && (
          <div className="row">
            <span className="k">Sector</span>
            <span className="v">{SECTOR_NAMES[sector]}</span>
          </div>
        )}
        {token && (
          <div className="row">
            <span className="k">Instrument</span>
            <span className="v">
              {token.name.length > 24 ? `${token.name.slice(0, 22)}…` : token.name}
            </span>
          </div>
        )}
        <div className="row">
          <span className="k">Territory</span>
          <span className="v">{tile.ticker ? `${size} tile${size === 1 ? '' : 's'}` : '—'}</span>
        </div>
        <div className="row">
          <span className="k">Territory bonus</span>
          <span className="v">{tile.ticker ? `${territoryBonus(size).toFixed(2)}×` : '—'}</span>
        </div>
        <div className="row">
          <span className="k">
            Conviction{tile.ticker ? ` · ${held} rd${held === 1 ? '' : 's'}` : ''}
          </span>
          <span className="v">{tile.ticker ? `${conviction.toFixed(2)}×` : '—'}</span>
        </div>
        <div className="row total">
          <span className="k">Combined</span>
          <span className="v">{tile.ticker ? `${combined.toFixed(2)}×` : '—'}</span>
        </div>
        {spreads && (
          <div className="row">
            <span className="k">Spread</span>
            <span className="v">takes open ground</span>
          </div>
        )}
        {reading?.multiplier != null && (
          <div className="row">
            <span className="k">Live multiplier</span>
            <span className="v">{reading.multiplier.toFixed(8)}</span>
          </div>
        )}
        {token && (
          <>
            <div className="row" style={{ marginTop: 8 }}>
              <span className="k">Contract</span>
            </div>
            <div className="v addr">{token.address}</div>
          </>
        )}
      </div>
    </section>
  )
}
