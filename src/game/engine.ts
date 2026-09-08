import {
  BOARD_SIZE,
  TILE_COUNT,
  type GameState,
  type Regime,
  type RoundResult,
  type SectorId,
  type Tile,
} from './types'
import { PHASE_1_TICKERS } from '../config/tokens'

/* ------------------------------------------------------------------ *
 * Tuning. Every number a designer might want to argue about lives here.
 * ------------------------------------------------------------------ */
export const RULES = {
  /** Seconds before a round settles on its own. */
  roundSeconds: 90,
  /** Tiles the player may claim across the whole demo. */
  claimBudget: 24,
  /** Extra claims granted each time a round settles. */
  claimsPerRound: 3,
  /** Token units paid out per round, split across every claimed tile. */
  poolPerRound: 0.5,
  /**
   * Share of the pool paid as the SGOV floor - flat across every claimed tile,
   * regardless of how its ticker performed. A bad call costs upside, not principal.
   */
  floorShare: 0.3,
  /** Territory bonus: 1 + min(size - 1, cap) * step. */
  territoryStep: 0.12,
  territoryCap: 12,
  /** Conviction: 1 + min(roundsHeld, cap) * step. Reset by re-staking. */
  convictionStep: 0.25,
  convictionCap: 4,
  /** A territory this big or bigger spreads into neighbouring empty ground. */
  spreadMinSize: 4,
  /** Per-tile chance of absorption, scaled by how far past the minimum it is. */
  spreadStep: 0.06,
  spreadMaxChance: 0.5,
  /** Roughly how much of the board the rivals hold at the start. */
  rivalFill: 0.28,
  rivalCount: 5,
} as const

export const FLOOR_TICKER = 'SGOV'

/* ------------------------------------------------------------------ *
 * Sectors. The regime moves a whole sector at once, which is what makes
 * choosing a ticker a decision rather than a coin flip.
 * ------------------------------------------------------------------ */
export const SECTOR_NAMES: Record<SectorId, string> = {
  AI: 'AI & Semis',
  TECH: 'Megacap Tech',
  BETA: 'High Beta',
  INDEX: 'Index',
  SAFE: 'Safe Haven',
}

export const SECTOR_OF: Record<string, SectorId> = {
  NVDA: 'AI',
  AMD: 'AI',
  PLTR: 'AI',
  AAPL: 'TECH',
  MSFT: 'TECH',
  GOOGL: 'TECH',
  AMZN: 'TECH',
  META: 'TECH',
  TSLA: 'BETA',
  GME: 'BETA',
  COIN: 'BETA',
  SPCX: 'BETA',
  SPY: 'INDEX',
  QQQ: 'INDEX',
  GLD: 'SAFE',
  SGOV: 'SAFE',
}

export const REGIMES: Regime[] = [
  { id: 'ai', name: 'AI MELT-UP', boost: 'AI', drag: 'SAFE', note: 'Semis bid. Nobody wants bills.' },
  { id: 'risk', name: 'RISK-ON', boost: 'BETA', drag: 'SAFE', note: 'The speculative names lead.' },
  { id: 'mega', name: 'MEGACAP BID', boost: 'TECH', drag: 'BETA', note: 'Money hides inside size.' },
  { id: 'safe', name: 'FLIGHT TO SAFETY', boost: 'SAFE', drag: 'BETA', note: 'Gold catches the flow.' },
  { id: 'broad', name: 'BROAD RALLY', boost: 'INDEX', drag: 'AI', note: 'Breadth widens, leaders lag.' },
]

/**
 * The regime for a round is a pure function of seed and round, so it can be
 * shown for the round in progress AND previewed for the next one. Announcing it
 * in advance is deliberate: the game is the conviction trade-off, not guessing.
 */
export function regimeForRound(seed: number, round: number): Regime {
  const rnd = mulberry32((seed ^ Math.imul(round, 0x9e3779b1)) >>> 0)
  return REGIMES[Math.floor(rnd() * REGIMES.length)] as Regime
}

/* ------------------------------------------------------------------ *
 * Deterministic PRNG, so a given seed always produces the same board.
 * ------------------------------------------------------------------ */
export function mulberry32(a: number): () => number {
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/* ------------------------------------------------------------------ *
 * Board setup
 * ------------------------------------------------------------------ */
export function createBoard(seed: number): Tile[] {
  const rnd = mulberry32(seed)
  const tiles: Tile[] = Array.from({ length: TILE_COUNT }, () => ({
    owner: null,
    rivalId: 0,
    ticker: null,
    stakedSince: 1,
  }))

  // Rivals occupy clustered territories rather than scattered dust, so the
  // adjacency rule is legible the moment the board loads.
  const clusters = RULES.rivalCount * 4
  for (let c = 0; c < clusters; c++) {
    const rivalId = c % RULES.rivalCount
    const ticker = PHASE_1_TICKERS[Math.floor(rnd() * PHASE_1_TICKERS.length)] as string
    let x = Math.floor(rnd() * BOARD_SIZE)
    let y = Math.floor(rnd() * BOARD_SIZE)
    const target = Math.floor((TILE_COUNT * RULES.rivalFill) / clusters)

    // Walk until the cluster has TAKEN `target` tiles, not until it has taken
    // `target * 6` STEPS - a walk revisits its own tiles constantly, so
    // counting steps overshot rivalFill by more than double.
    let claimed = 0
    for (let step = 0; step < target * 40 && claimed < target; step++) {
      const index = y * BOARD_SIZE + x
      const tile = tiles[index]
      if (tile && tile.owner === null) {
        tile.owner = 'rival'
        tile.rivalId = rivalId
        tile.ticker = ticker
        tile.stakedSince = 1
        claimed++
      }
      // random walk keeps the blob organic instead of a rectangle
      const dir = Math.floor(rnd() * 4)
      if (dir === 0) x = Math.min(BOARD_SIZE - 1, x + 1)
      else if (dir === 1) x = Math.max(0, x - 1)
      else if (dir === 2) y = Math.min(BOARD_SIZE - 1, y + 1)
      else y = Math.max(0, y - 1)
    }
  }

  return tiles
}

export function createGame(seed = Math.floor(Math.random() * 1e9)): GameState {
  return {
    round: 1,
    tiles: createBoard(seed),
    ledger: {},
    claimsLeft: RULES.claimBudget,
    roundEndsAt: Date.now() + RULES.roundSeconds * 1000,
    history: [],
    seed,
  }
}

/* ------------------------------------------------------------------ *
 * Territories - orthogonally adjacent tiles staked to the same ticker,
 * regardless of who owns them. That is the point: agreeing with your
 * neighbour pays better than optimising alone.
 * ------------------------------------------------------------------ */
export interface Territories {
  /** Component id per tile, -1 for unowned. */
  componentOf: Int32Array
  /** Tile count of the component each tile belongs to, 0 for unowned. */
  sizeOf: Int32Array
}

export function computeTerritories(tiles: Tile[]): Territories {
  const componentOf = new Int32Array(TILE_COUNT).fill(-1)
  const sizeOf = new Int32Array(TILE_COUNT)
  const stack: number[] = []
  let component = 0

  for (let start = 0; start < TILE_COUNT; start++) {
    if (componentOf[start] !== -1) continue
    const startTile = tiles[start]
    if (!startTile?.ticker) continue

    const ticker = startTile.ticker
    const members: number[] = []
    stack.push(start)
    componentOf[start] = component

    while (stack.length) {
      const index = stack.pop() as number
      members.push(index)
      const x = index % BOARD_SIZE
      const y = (index / BOARD_SIZE) | 0

      const neighbours = [
        x > 0 ? index - 1 : -1,
        x < BOARD_SIZE - 1 ? index + 1 : -1,
        y > 0 ? index - BOARD_SIZE : -1,
        y < BOARD_SIZE - 1 ? index + BOARD_SIZE : -1,
      ]
      for (const n of neighbours) {
        if (n < 0 || componentOf[n] !== -1) continue
        if (tiles[n]?.ticker !== ticker) continue
        componentOf[n] = component
        stack.push(n)
      }
    }

    for (const index of members) sizeOf[index] = members.length
    component++
  }

  return { componentOf, sizeOf }
}

export function territoryBonus(size: number): number {
  if (size <= 0) return 0
  return 1 + Math.min(size - 1, RULES.territoryCap) * RULES.territoryStep
}

/** Rounds a tile has held its current ticker. */
export function roundsHeld(tile: Tile, round: number): number {
  if (!tile.ticker) return 0
  return Math.max(0, round - tile.stakedSince)
}

/** 1.00x on the round you stake, rising to 2.00x after four rounds of holding. */
export function convictionBonus(tile: Tile, round: number): number {
  if (!tile.ticker) return 0
  return 1 + Math.min(roundsHeld(tile, round), RULES.convictionCap) * RULES.convictionStep
}

/* ------------------------------------------------------------------ *
 * Round performance.
 *
 * DEMO DATA. A real deployment reads Chainlink's AggregatorV3 proxy per
 * ticker. This produces plausible moves - mostly small, occasionally not -
 * then tilts them by the round's regime so sector choice matters.
 * ------------------------------------------------------------------ */
export function rollPerformance(seed: number, round: number): Record<string, number> {
  const regime = regimeForRound(seed, round)
  const performance: Record<string, number> = {}

  for (const ticker of PHASE_1_TICKERS) {
    // SGOV is a T-bill ETF. It does not swing, and no regime changes that -
    // it is the floor, which is exactly why the treasury leans on it.
    if (ticker === FLOOR_TICKER) {
      performance[ticker] = Number((0.01 + mulberry32(seed + round)() * 0.02).toFixed(3))
      continue
    }

    let hash = Math.imul(round, 2654435761)
    for (let i = 0; i < ticker.length; i++) hash = Math.imul(hash ^ ticker.charCodeAt(i), 16777619)
    const rnd = mulberry32((seed ^ hash) >>> 0)

    // sum of three uniforms approximates a normal, then widen the tails
    const normal = rnd() + rnd() + rnd() - 1.5
    const magnitude = Math.abs(normal) > 1.1 ? 2.4 : 1
    let move = normal * 2.1 * magnitude

    const sector = SECTOR_OF[ticker]
    if (sector === regime.boost) move += 1.8 + rnd() * 1.6
    else if (sector === regime.drag) move -= 1.6 + rnd() * 1.4

    performance[ticker] = Number(move.toFixed(2))
  }

  return performance
}

/* ------------------------------------------------------------------ *
 * Settlement
 * ------------------------------------------------------------------ */
export interface SettleOutcome {
  state: GameState
  result: RoundResult
}

export function settleRound(state: GameState, performance: Record<string, number>): SettleOutcome {
  const { sizeOf } = computeTerritories(state.tiles)
  const regime = regimeForRound(state.seed, state.round)

  // Weight is performance times territory bonus times conviction. A negative
  // move floors the weight at zero: you lose the upside, never the floor.
  let totalWeight = 0
  let claimedTiles = 0
  const weights = new Float64Array(TILE_COUNT)

  for (let i = 0; i < TILE_COUNT; i++) {
    const tile = state.tiles[i]
    if (!tile?.owner || !tile.ticker) continue
    claimedTiles++
    const move = performance[tile.ticker] ?? 0
    const weight =
      Math.max(0, move) * territoryBonus(sizeOf[i] ?? 0) * convictionBonus(tile, state.round)
    weights[i] = weight
    totalWeight += weight
  }

  const floorPool = RULES.poolPerRound * RULES.floorShare
  const performancePool = RULES.poolPerRound - floorPool
  const perTileFloor = claimedTiles > 0 ? floorPool / claimedTiles : 0

  const earned: Record<string, number> = {}
  let tilesHeld = 0

  for (let i = 0; i < TILE_COUNT; i++) {
    const tile = state.tiles[i]
    if (tile?.owner !== 'you' || !tile.ticker) continue
    tilesHeld++

    // The floor is always paid in SGOV - it is the treasury's actual yield.
    earned[FLOOR_TICKER] = (earned[FLOOR_TICKER] ?? 0) + perTileFloor

    if (totalWeight > 0 && (weights[i] ?? 0) > 0) {
      const share = ((weights[i] ?? 0) / totalWeight) * performancePool
      earned[tile.ticker] = (earned[tile.ticker] ?? 0) + share
    }
  }

  const entries = Object.entries(performance).filter(([t]) => t !== FLOOR_TICKER)
  entries.sort((a, b) => b[1] - a[1])

  const nextRound = state.round + 1
  const spreadTiles = spreadTerritories(state.tiles, sizeOf, state.seed + state.round, nextRound)
  const tiles = advanceRivals(spreadTiles.tiles, state.seed + state.round, state.seed, nextRound)

  const result: RoundResult = {
    round: state.round,
    performance,
    earned,
    regime,
    best: entries[0]?.[0] ?? FLOOR_TICKER,
    worst: entries[entries.length - 1]?.[0] ?? FLOOR_TICKER,
    tilesHeld,
    spread: spreadTiles.gainedByYou,
  }

  const ledger = { ...state.ledger }
  for (const [ticker, amount] of Object.entries(earned)) {
    ledger[ticker] = (ledger[ticker] ?? 0) + amount
  }

  return {
    state: {
      ...state,
      round: nextRound,
      tiles,
      ledger,
      claimsLeft: Math.min(RULES.claimBudget, state.claimsLeft + RULES.claimsPerRound),
      roundEndsAt: Date.now() + RULES.roundSeconds * 1000,
      history: [result, ...state.history].slice(0, 12),
    },
    result,
  }
}

/**
 * Territory spread. A block of four or more pushes into the empty ground beside
 * it, carrying its owner and ticker. Big territories therefore compound: they
 * pay more per tile AND take more tiles. It is also what makes open ground
 * scarce, so claiming early beats hoarding claims.
 */
function spreadTerritories(
  tiles: Tile[],
  sizeOf: Int32Array,
  seed: number,
  nextRound: number,
): { tiles: Tile[]; gainedByYou: number } {
  const rnd = mulberry32(seed)
  const next = tiles.map((tile) => ({ ...tile }))
  let gainedByYou = 0

  // Decide from the ORIGINAL board so a tile absorbed this round cannot
  // immediately seed another absorption in the same pass.
  for (let i = 0; i < TILE_COUNT; i++) {
    if (tiles[i]?.owner !== null) continue

    const x = i % BOARD_SIZE
    const y = (i / BOARD_SIZE) | 0
    const neighbours = [
      x > 0 ? i - 1 : -1,
      x < BOARD_SIZE - 1 ? i + 1 : -1,
      y > 0 ? i - BOARD_SIZE : -1,
      y < BOARD_SIZE - 1 ? i + BOARD_SIZE : -1,
    ]

    // The largest qualifying neighbour territory takes the ground.
    let bestIndex = -1
    let bestSize = 0
    for (const n of neighbours) {
      if (n < 0) continue
      const neighbour = tiles[n]
      if (!neighbour?.owner || !neighbour.ticker) continue
      const size = sizeOf[n] ?? 0
      if (size >= RULES.spreadMinSize && size > bestSize) {
        bestSize = size
        bestIndex = n
      }
    }
    if (bestIndex < 0) continue

    const chance = Math.min(
      RULES.spreadMaxChance,
      (bestSize - RULES.spreadMinSize + 1) * RULES.spreadStep,
    )
    if (rnd() >= chance) continue

    const source = tiles[bestIndex] as Tile
    const target = next[i] as Tile
    target.owner = source.owner
    target.rivalId = source.rivalId
    target.ticker = source.ticker
    // Ground taken this round starts its conviction from scratch.
    target.stakedSince = nextRound
    if (source.owner === 'you') gainedByYou++
  }

  return { tiles: next, gainedByYou }
}

/**
 * Rivals read the regime that is coming and rotate part of their board into the
 * sector it favours. They are not trying to win; they are there to make the
 * board move and to compete for open ground.
 */
function advanceRivals(tiles: Tile[], seed: number, gameSeed: number, nextRound: number): Tile[] {
  const rnd = mulberry32(seed)
  const next = tiles.map((tile) => ({ ...tile }))

  const coming = regimeForRound(gameSeed, nextRound)
  const favoured = PHASE_1_TICKERS.filter(
    (ticker) => SECTOR_OF[ticker] === coming.boost && ticker !== FLOOR_TICKER,
  )

  for (let i = 0; i < TILE_COUNT; i++) {
    const tile = next[i]
    if (!tile || tile.owner !== 'rival') continue
    if (rnd() >= 0.06) continue

    const pick =
      favoured.length > 0 && rnd() < 0.6
        ? (favoured[Math.floor(rnd() * favoured.length)] as string)
        : (PHASE_1_TICKERS[Math.floor(rnd() * PHASE_1_TICKERS.length)] as string)

    if (pick !== tile.ticker) {
      tile.ticker = pick
      tile.stakedSince = nextRound
    }
  }

  return next
}

/* ------------------------------------------------------------------ *
 * Player moves
 * ------------------------------------------------------------------ */
export function claimTile(state: GameState, index: number, ticker: string): GameState {
  if (state.claimsLeft <= 0) return state
  const tile = state.tiles[index]
  if (!tile || tile.owner !== null) return state

  const tiles = state.tiles.slice()
  tiles[index] = { owner: 'you', rivalId: 0, ticker, stakedSince: state.round }
  return { ...state, tiles, claimsLeft: state.claimsLeft - 1 }
}

export function stakeTile(state: GameState, index: number, ticker: string): GameState {
  const tile = state.tiles[index]
  if (!tile || tile.owner !== 'you' || tile.ticker === ticker) return state

  const tiles = state.tiles.slice()
  // Re-staking resets conviction. That is the cost of chasing the regime.
  tiles[index] = { ...tile, ticker, stakedSince: state.round }
  return { ...state, tiles }
}

/* ------------------------------------------------------------------ *
 * Derived stats for the UI
 * ------------------------------------------------------------------ */
export interface BoardStats {
  yours: number
  rivals: number
  unclaimed: number
  byTicker: Record<string, number>
  /** Your largest contiguous run of one ticker. */
  bestTerritory: { ticker: string; size: number } | null
  /** Your highest conviction multiplier currently in play. */
  topConviction: number
}

export function boardStats(tiles: Tile[], territories: Territories, round: number): BoardStats {
  let yours = 0
  let rivals = 0
  let unclaimed = 0
  const byTicker: Record<string, number> = {}
  let bestTerritory: { ticker: string; size: number } | null = null
  let topConviction = 1

  for (let i = 0; i < TILE_COUNT; i++) {
    const tile = tiles[i]
    if (!tile) continue
    if (tile.owner === 'you') {
      yours++
      const size = territories.sizeOf[i] ?? 0
      if (tile.ticker && (!bestTerritory || size > bestTerritory.size)) {
        bestTerritory = { ticker: tile.ticker, size }
      }
      const conviction = convictionBonus(tile, round)
      if (conviction > topConviction) topConviction = conviction
    } else if (tile.owner === 'rival') rivals++
    else unclaimed++

    if (tile.ticker) byTicker[tile.ticker] = (byTicker[tile.ticker] ?? 0) + 1
  }

  return { yours, rivals, unclaimed, byTicker, bestTerritory, topConviction }
}
