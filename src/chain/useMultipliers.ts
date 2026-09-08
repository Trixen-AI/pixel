import { useMemo } from 'react'
import { useBlockNumber, useReadContracts } from 'wagmi'
import { formatUnits } from 'viem'
import { stockTokenAbi } from './abi'
import { PHASE_1_TICKERS, byTicker } from '../config/tokens'
import { robinhoodChain } from '../config/chain'

export interface MultiplierReading {
  ticker: string
  /**
   * uiMultiplier() as a plain number. 1.0 means nothing has accrued yet.
   * Null means the read failed - never substitute 1.0 for a failed read, or
   * the UI would present a network error as "this token has paid nothing".
   */
  multiplier: number | null
  /** Percentage accrued since the token launched at 1.0. Null when unread. */
  accruedPct: number | null
  paused: boolean
}

export interface MultipliersResult {
  readings: MultiplierReading[]
  byTicker: Record<string, MultiplierReading>
  isLoading: boolean
  isError: boolean
  blockNumber?: bigint
}

/**
 * Live read of uiMultiplier() for the Phase 1 basket, batched through
 * Multicall3. This is the one number on screen that is genuinely on-chain, so
 * the UI labels it LIVE and everything else DEMO.
 */
export function useMultipliers(): MultipliersResult {
  const { data: blockNumber } = useBlockNumber({
    chainId: robinhoodChain.id,
    watch: false,
    query: { refetchInterval: 30_000 },
  })

  const contracts = useMemo(
    () =>
      PHASE_1_TICKERS.flatMap((ticker) => {
        const token = byTicker(ticker)
        if (!token) return []
        return [
          {
            address: token.address,
            abi: stockTokenAbi,
            functionName: 'uiMultiplier',
            chainId: robinhoodChain.id,
          } as const,
          {
            address: token.address,
            abi: stockTokenAbi,
            functionName: 'tokenPaused',
            chainId: robinhoodChain.id,
          } as const,
        ]
      }),
    [],
  )

  const { data, isLoading, isError } = useReadContracts({
    contracts,
    query: { refetchInterval: 60_000, staleTime: 30_000 },
  })

  return useMemo(() => {
    const readings: MultiplierReading[] = PHASE_1_TICKERS.map((ticker, index) => {
      const multiplierResult = data?.[index * 2]
      const pausedResult = data?.[index * 2 + 1]

      const raw =
        multiplierResult?.status === 'success' ? (multiplierResult.result as bigint) : undefined
      const multiplier = raw !== undefined ? Number(formatUnits(raw, 18)) : null

      return {
        ticker,
        multiplier,
        accruedPct: multiplier !== null ? (multiplier - 1) * 100 : null,
        paused: pausedResult?.status === 'success' ? Boolean(pausedResult.result) : false,
      }
    })

    const map: Record<string, MultiplierReading> = {}
    for (const reading of readings) map[reading.ticker] = reading

    return { readings, byTicker: map, isLoading, isError, blockNumber }
  }, [data, isLoading, isError, blockNumber])
}
