import { createConfig, http } from 'wagmi'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { createAppKit } from '@reown/appkit/react'
import { defineChain as defineAppKitChain } from '@reown/appkit/networks'
import { robinhoodChain } from './chain'

const projectId = (import.meta.env.VITE_REOWN_PROJECT_ID ?? '').trim()
const rpcUrl = (import.meta.env.VITE_RPC_URL ?? '').trim() || robinhoodChain.rpcUrls.default.http[0]

/**
 * Reown AppKit is the ONLY wallet layer in this app. There is no second
 * connector list, no bespoke "detect MetaMask" branch, and no email or social
 * sign-in - every one of those is switched off below so the connect button
 * leads to wallets and nothing else.
 *
 * Wallet connect stays optional: without a project id the board still loads,
 * the game is still playable, and live multipliers still read from the chain.
 * Nobody should hit a dead page because an env var is missing.
 */
export const walletEnabled = projectId.length > 0

/** Reown needs its own network shape (caipNetworkId, chainNamespace). */
const robinhoodNetwork = defineAppKitChain({
  id: robinhoodChain.id,
  caipNetworkId: `eip155:${robinhoodChain.id}`,
  chainNamespace: 'eip155',
  name: robinhoodChain.name,
  nativeCurrency: robinhoodChain.nativeCurrency,
  rpcUrls: { default: { http: [rpcUrl] } },
  blockExplorers: robinhoodChain.blockExplorers,
})

const adapter = walletEnabled
  ? new WagmiAdapter({ networks: [robinhoodNetwork], projectId, ssr: false })
  : null

if (adapter) {
  createAppKit({
    adapters: [adapter],
    networks: [robinhoodNetwork],
    defaultNetwork: robinhoodNetwork,
    projectId,
    metadata: {
      name: 'Pixel Dividend',
      description: 'A 32x32 board game on Robinhood Chain.',
      url: window.location.origin,
      icons: [`${window.location.origin}/favicon.svg`],
    },
    themeMode: 'dark',
    themeVariables: {
      '--w3m-accent': '#FFFFFF',
      '--w3m-color-mix': '#000000',
      '--w3m-color-mix-strength': 20,
      '--w3m-border-radius-master': '0px',
      '--w3m-font-family': "'JetBrains Mono', ui-monospace, monospace",
    },
    // Wallets only. No email, no socials, no onramp, no swaps, no history.
    features: {
      analytics: false,
      email: false,
      socials: false,
      emailShowWallets: true,
      onramp: false,
      swaps: false,
      send: false,
      history: false,
    },
    // Browser-extension wallets announce themselves over EIP-6963, which is
    // what makes an installed wallet appear in the modal by its own name
    // instead of a generic "Injected" row.
    enableEIP6963: true,
    enableInjected: true,
    enableWalletConnect: true,
    enableCoinbase: false,
    // Detected wallets first, then the full WalletConnect list.
    enableWalletGuide: false,
    allWallets: 'SHOW',
  })
}

/**
 * Read-only fallback config. Same chain, same transport, no connectors, so the
 * multiplier reads behave identically whether or not a wallet is configured.
 */
export const wagmiConfig =
  adapter?.wagmiConfig ??
  createConfig({
    chains: [robinhoodChain],
    transports: { [robinhoodChain.id]: http(rpcUrl, { retryCount: 3, retryDelay: 400 }) },
  })
