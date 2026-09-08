export const BOARD_SIZE = 32
export const TILE_COUNT = BOARD_SIZE * BOARD_SIZE // 1024, the whole NFT supply

/** Null means nobody holds the tile yet. */
export type Owner = 'you' | 'rival' | null

export interface Tile {
  owner: Owner
  /** Which rival, so the board reads as several players rather than one blob. */
  rivalId: number
  /** The ticker this tile is staked to. Null whenever the tile is unowned. */
  ticker: string | null
  /**
   * Round the current ticker was set. Conviction is built from how long a tile
   * has held the same ticker, so re-staking resets this and costs the bonus.
   */
  stakedSince: number
}

export type SectorId = 'AI' | 'TECH' | 'BETA' | 'INDEX' | 'SAFE'

export interface Regime {
  id: string
  name: string
  boost: SectorId
  drag: SectorId
  note: string
}

export interface RoundResult {
  round: number
  /** Percentage move per ticker for the round. Demo data — see rollPerformance. */
  performance: Record<string, number>
  /** Token units the player earned this round, keyed by ticker. */
  earned: Record<string, number>
  /** The regime that was in force for this round. */
  regime: Regime
  /** Best and worst performing ticker of the round. */
  best: string
  worst: string
  /** How many tiles the player held when the round settled. */
  tilesHeld: number
  /** Tiles the player gained from territory spread this round. */
  spread: number
}

export interface GameState {
  round: number
  tiles: Tile[]
  /** Lifetime token units earned, keyed by ticker. */
  ledger: Record<string, number>
  /** Tiles the player may still claim in this demo. */
  claimsLeft: number
  /** Epoch ms when the current round auto-settles. */
  roundEndsAt: number
  history: RoundResult[]
  seed: number
}

/** A tile's coordinate label, A1 through AF32. */
export function tileLabel(index: number): string {
  const x = index % BOARD_SIZE
  const y = Math.floor(index / BOARD_SIZE)
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const col = x < 26 ? letters[x] : `A${letters[x - 26]}`
  return `${col}${y + 1}`
}
