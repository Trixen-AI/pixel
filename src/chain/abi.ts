/**
 * The slice of the Robinhood stock token ABI this app actually calls.
 *
 * Selectors were recovered from the deployed implementation
 * (0xb35490d6f9163de4f80d88dc75c3516eb64c5ae2) rather than from a published
 * ABI file, and each was confirmed against the chain:
 *
 *   uiMultiplier()  0xa60bf13d   total-return multiplier, 18 decimals
 *   tokenPaused()   0x86c75e74
 *   oraclePaused()  0x7706ba52
 *
 * uiMultiplier is the one that matters here: token value is
 * underlying price x multiplier, so dividends accrue inside the token and a
 * treasury that merely holds it captures them.
 */
export const stockTokenAbi = [
  {
    type: 'function',
    name: 'uiMultiplier',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'tokenPaused',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'bool' }],
  },
  {
    type: 'function',
    name: 'symbol',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'string' }],
  },
  {
    type: 'function',
    name: 'balanceOf',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ type: 'uint256' }],
  },
] as const

/** Chainlink AggregatorV3, for when real feed addresses are wired in. */
export const aggregatorV3Abi = [
  {
    type: 'function',
    name: 'latestRoundData',
    stateMutability: 'view',
    inputs: [],
    outputs: [
      { name: 'roundId', type: 'uint80' },
      { name: 'answer', type: 'int256' },
      { name: 'startedAt', type: 'uint256' },
      { name: 'updatedAt', type: 'uint256' },
      { name: 'answeredInRound', type: 'uint80' },
    ],
  },
  {
    type: 'function',
    name: 'decimals',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint8' }],
  },
  {
    type: 'function',
    name: 'description',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'string' }],
  },
] as const
