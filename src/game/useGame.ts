import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  RULES,
  boardStats,
  claimTile,
  computeTerritories,
  createGame,
  regimeForRound,
  rollPerformance,
  settleRound,
  stakeTile,
} from './engine'
import type { GameState, RoundResult } from './types'

/** v2 added Tile.stakedSince (conviction). v1 saves are dropped, not migrated. */
const STORAGE_KEY = 'pixel-dividend:v2'

function load(): GameState | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as GameState
    if (!Array.isArray(parsed.tiles) || parsed.tiles.length !== 1024) return null
    if (typeof parsed.round !== 'number' || typeof parsed.seed !== 'number') return null
    // A save written before conviction existed would silently score wrong.
    if (typeof parsed.tiles[0]?.stakedSince !== 'number') return null
    return parsed
  } catch {
    // Private windows and blocked site data both land here. Start fresh.
    return null
  }
}

function save(state: GameState) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // Non-fatal: the game just will not survive a reload.
  }
}

export type Mode = 'claim' | 'stake'

export function useGame() {
  const [state, setState] = useState<GameState>(() => load() ?? createGame())
  const [mode, setMode] = useState<Mode>('claim')
  const [activeTicker, setActiveTicker] = useState<string>('NVDA')
  const [selected, setSelected] = useState<number | null>(null)
  const [lastResult, setLastResult] = useState<RoundResult | null>(null)
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => save(state), [state])

  /* One second tick drives the round clock. */
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [])

  const settle = useCallback(() => {
    setState((current) => {
      const performance = rollPerformance(current.seed, current.round)
      const { state: next, result } = settleRound(current, performance)
      // Queued rather than called inside the updater: React invokes updaters
      // twice in StrictMode, and a setState there would run twice too.
      queueMicrotask(() => setLastResult(result))
      return next
    })
  }, [])

  /* Auto-settle when the clock runs out. A ref keeps the effect from firing
     twice for the same round while React re-renders. */
  const settlingFor = useRef(-1)
  useEffect(() => {
    if (now < state.roundEndsAt) return
    if (settlingFor.current === state.round) return
    settlingFor.current = state.round
    settle()
  }, [now, state.roundEndsAt, state.round, settle])

  const secondsLeft = Math.max(0, Math.ceil((state.roundEndsAt - now) / 1000))

  const territories = useMemo(() => computeTerritories(state.tiles), [state.tiles])
  const stats = useMemo(
    () => boardStats(state.tiles, territories, state.round),
    [state.tiles, territories, state.round],
  )

  const regime = useMemo(() => regimeForRound(state.seed, state.round), [state.seed, state.round])
  const nextRegime = useMemo(
    () => regimeForRound(state.seed, state.round + 1),
    [state.seed, state.round],
  )

  const applyToTile = useCallback(
    (index: number) => {
      setSelected(index)
      setState((current) => {
        const tile = current.tiles[index]
        if (!tile) return current
        if (mode === 'claim' && tile.owner === null) return claimTile(current, index, activeTicker)
        if (mode === 'stake' && tile.owner === 'you') return stakeTile(current, index, activeTicker)
        return current
      })
    },
    [mode, activeTicker],
  )

  const reset = useCallback(() => {
    const fresh = createGame()
    setState(fresh)
    setLastResult(null)
    setSelected(null)
    settlingFor.current = -1
  }, [])

  const totalEarned = useMemo(
    () => Object.values(state.ledger).reduce((sum, value) => sum + value, 0),
    [state.ledger],
  )

  return {
    state,
    territories,
    stats,
    regime,
    nextRegime,
    mode,
    setMode,
    activeTicker,
    setActiveTicker,
    selected,
    setSelected,
    applyToTile,
    settle,
    reset,
    secondsLeft,
    roundLength: RULES.roundSeconds,
    lastResult,
    totalEarned,
  }
}
