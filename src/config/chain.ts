import { defineChain } from 'viem'

/**
 * Robinhood Chain — Arbitrum Orbit (Nitro) L2 settling to Ethereum.
 * Mainnet went live 1 July 2026. Gas is paid in ETH; there is no native gas token.
 *
 * Verified live on 2026-09-07: eth_chainId returned 0x1237 (4663).
 */
export const robinhoodChain = defineChain({
  id: 4663,
  name: 'Robinhood Chain',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc.mainnet.chain.robinhood.com'] },
  },
  blockExplorers: {
    default: { name: 'Blockscout', url: 'https://robinhoodchain.blockscout.com' },
  },
  contracts: {
    multicall3: { address: '0xcA11bde05977b3631167028862bE2a173976CA11' },
  },
})

export const robinhoodChainTestnet = defineChain({
  id: 46630,
  name: 'Robinhood Chain Testnet',
  testnet: true,
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc.testnet.chain.robinhood.com'] },
  },
  blockExplorers: {
    default: { name: 'Blockscout', url: 'https://explorer.testnet.chain.robinhood.com' },
  },
})

/** Settlement + wrapped-gas assets. Both re-verified on-chain, see tokens.ts header. */
export const USDG = {
  address: '0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168',
  symbol: 'USDG',
  name: 'Global Dollar',
  decimals: 6, // NOTE: 6, not 18. Every USDG impostor on this chain uses 18.
} as const

export const WETH = {
  address: '0x0Bd7D308f8E1639FAb988df18A8011f41EAcAD73',
  symbol: 'WETH',
  decimals: 18,
} as const
