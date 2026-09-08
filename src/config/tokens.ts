import type { Address } from 'viem'

/**
 * Robinhood Chain stock tokens - VERIFIED REGISTRY
 * ------------------------------------------------
 * Every entry below was checked directly against the chain (not copied from a
 * blog post or a token list) on 2026-09-07 at block ~0x35e6ed7:
 *
 *   1. eth_getCode       -> 283-byte ERC-1967 beacon proxy, byte-identical across all entries
 *   2. eth_getStorageAt  -> beacon slot == 0xe10b6f6b275de231345c20d14ab812db62151b00, the one
 *                           official Robinhood beacon. This is the check that actually matters.
 *   3. symbol()/decimals() -> matches the ticker, 18 decimals
 *
 * DO NOT verify by name or by explorer label. SKHY is genuine but is named "... American Depositary
 * Shares" instead of "... Robinhood Token", and Blockscout even labels it "SKYHY"
 * while the contract itself returns "SKHY". Any impostor can copy a name.
 * The beacon is the discriminator: TheGreenHood (0xDAA8f3f5..., symbol "HOOD")
 * passes a name check and fails the beacon check.
 *
 * Beacon implementation: 0xb35490d6f9163de4f80d88dc75c3516eb64c5ae2
 * OpenZeppelin 5.x upgradeable ERC-20 + Pausable + AccessControl + ERC-2612 permit,
 * plus Robinhood's own uiMultiplier(), updateMultiplier(), pauseOracle(), adminBurn().
 *
 * Re-run scripts/verify-tokens.mjs before every release; the beacon is upgradeable.
 */
export interface StockToken {
  ticker: string
  address: Address
  /** Issuer's name for the underlying instrument, suffix stripped. */
  name: string
  /** Holder count at time of verification - a rough popularity signal, not live data. */
  holders: number
}

/** All 18-decimal. Sorted by holder count descending. 50 instruments. */
export const STOCK_TOKENS: readonly StockToken[] = [
  { ticker: 'NVDA', address: '0xd0601CE157Db5bdC3162BbaC2a2C8aF5320D9EEC', name: 'NVIDIA', holders: 119221 },
  { ticker: 'SPCX', address: '0x4a0E65A3EcceC6dBe60AE065F2e7bb85Fae35eEa', name: 'Space Exploration Technologies Corp. Class A Common Stock', holders: 84597 },
  { ticker: 'AAPL', address: '0xaF3D76f1834A1d425780943C99Ea8A608f8a93f9', name: 'Apple', holders: 67798 },
  { ticker: 'SPY', address: '0x117cc2133c37B721F49dE2A7a74833232B3B4C0C', name: 'SPDR S&P 500 ETF Trust', holders: 61872 },
  { ticker: 'TSLA', address: '0x322F0929c4625eD5bAd873c95208D54E1c003b2d', name: 'Tesla', holders: 56342 },
  { ticker: 'GOOGL', address: '0x2e0847E8910a9732eB3fb1bb4b70a580ADAD4FE3', name: 'Alphabet Class A', holders: 52233 },
  { ticker: 'MSFT', address: '0xe93237C50D904957Cf27E7B1133b510C669c2e74', name: 'Microsoft', holders: 48908 },
  { ticker: 'GME', address: '0x1b0E319c6A659F002271B69dB8A7df2F911c153E', name: 'GameStop', holders: 43776 },
  { ticker: 'AMZN', address: '0x12f190a9F9d7D37a250758b26824B97CE941bF54', name: 'Amazon', holders: 42087 },
  { ticker: 'AMD', address: '0x86923f96303D656E4aa86D9d42D1e57ad2023fdC', name: 'AMD', holders: 37424 },
  { ticker: 'PLTR', address: '0x894E1EC2D74FFE5AEF8Dc8A9e84686acCB964F2A', name: 'Palantir Technologies', holders: 36696 },
  { ticker: 'META', address: '0xc0D6457C16Cc70d6790Dd43521C899C87ce02f35', name: 'Meta Platforms', holders: 33482 },
  { ticker: 'MU', address: '0xfF080c8ce2E5feadaCa0Da81314Ae59D232d4afD', name: 'Micron Technology', holders: 33098 },
  { ticker: 'COIN', address: '0x6330D8C3178a418788dF01a47479c0ce7CCF450b', name: 'Coinbase', holders: 27558 },
  { ticker: 'DJT', address: '0x1D11f0496982706C5e14A514D4E79F2e6BdE4516', name: 'Trump Media & Technology Group', holders: 26506 },
  { ticker: 'INTC', address: '0xc72b96e0E48ecd4DC75E1e45396e26300BC39681', name: 'Intel', holders: 25728 },
  { ticker: 'SNDK', address: '0xB90A19fF0Af67f7779afF50A882A9CfF42446400', name: 'Sandisk Corporation', holders: 24749 },
  { ticker: 'GLD', address: '0xC9a981FEE1F9DEc688bb123ccDeCc63D0deBFC4e', name: 'SPDR Gold Trust', holders: 22314 },
  { ticker: 'CRWV', address: '0x5f10A1C971B69e47e059e1dC91901B59b3fB49C3', name: 'CoreWeave', holders: 19438 },
  { ticker: 'ORCL', address: '0xb0992820E760d836549ba69BC7598b4af75dEE03', name: 'Oracle', holders: 19421 },
  { ticker: 'RDDT', address: '0x05b37Fb53A299a1b874A619e1c4C404D52C36F4C', name: 'Reddit', holders: 18889 },
  { ticker: 'USAR', address: '0xd917B029C761D264c6A312BBbcDA868658eF86a6', name: 'USA Rare Earth', holders: 18660 },
  { ticker: 'QQQ', address: '0xD5f3879160bc7c32ebb4dC785F8a4F505888de68', name: 'Invesco QQQ', holders: 18449 },
  { ticker: 'BE', address: '0x822CC93fFD030293E9842c30BBD678F530701867', name: 'Bloom Energy', holders: 16735 },
  { ticker: 'COST', address: '0x4EA005168D7F09a7A0Ba9D1DEf21a479950E44C2', name: 'Costco', holders: 14479 },
  { ticker: 'NFLX', address: '0xE0444EF8BF4eD74f74FD73686e2ddF4C1c5591E8', name: 'Netflix', holders: 13905 },
  { ticker: 'CRCL', address: '0xdF0992E440dD0be65BD8439b609d6D4366bf1CB5', name: 'Circle Internet Group', holders: 9956 },
  { ticker: 'TTWO', address: '0x5e81213613b6B86EaB4c6c50d718d34359459786', name: 'Take-Two Interactive Software', holders: 9412 },
  { ticker: 'AMC', address: '0x05a3d1Cd21d0C88145E82600E62e7E496e0F222B', name: 'AMC Entertainment', holders: 8986 },
  { ticker: 'MSTR', address: '0xec262a75e413fAfD0dF80480274532C79D42da09', name: 'Strategy Inc.', holders: 8777 },
  { ticker: 'HIMS', address: '0xCceE82fE024c36fA15E1005edE3E9e4787e23D09', name: 'Hims & Hers Health', holders: 7761 },
  { ticker: 'TSM', address: '0x58FfE4a942d3885bAa22D7520691F611EF09e7AA', name: 'Taiwan Semiconductor Manufacturing', holders: 7648 },
  { ticker: 'RBLX', address: '0xF0C4BF4C582cb3836e98394b1d4e7B7281101bE8', name: 'Roblox', holders: 6934 },
  { ticker: 'USO', address: '0xa30FA36Db767ad9eD3f7a60fC79526fB4d56D344', name: 'United States Oil Fund', holders: 6830 },
  { ticker: 'SLV', address: '0x411eFb0E7f985935DAec3D4C3ebaEa0d0AD7D89f', name: 'iShares Silver Trust', holders: 5628 },
  { ticker: 'LULU', address: '0x4e62068525Ab11FE768e29dfD00ef909B9803016', name: 'Lululemon', holders: 4706 },
  { ticker: 'DELL', address: '0x941AE714EC6D8130c7B75d67160Ca08f1e7d11Dd', name: 'Dell', holders: 4607 },
  { ticker: 'BB', address: '0x48E39E56aCdbA37b09020C0b734A613C9a2f100A', name: 'Blackberry', holders: 4132 },
  { ticker: 'LLY', address: '0x8005d266423c7ea827372c9c864491e5786600ea', name: 'Eli Lilly', holders: 3914 },
  { ticker: 'SGOV', address: '0x92FD66527192E3e61d4DDd13322Aa222DE86F9B5', name: 'iShares 0-3 Month Treasury Bond', holders: 3418 },
  { ticker: 'JNJ', address: '0x03DfbBE0AC4E7bCDaFd08eD41A400326B77D8c80', name: 'Johnson & Johnson', holders: 2370 },
  { ticker: 'BABA', address: '0xad25Ac6C84D497db898fa1E8387bf6Af3532a1c4', name: 'Alibaba', holders: 2064 },
  { ticker: 'QUBT', address: '0x59818904ab4cE163b3cE4FfB64f2D6Ca02c434B4', name: 'Quantum Computing', holders: 1803 },
  { ticker: 'SNAP', address: '0xF6589F11Bc40b669e584073F428B05562F568733', name: 'Snap', holders: 1617 },
  { ticker: 'IBM', address: '0x980dcf6766FA79f5Cf0c4AAdb3ab477ff15a9619', name: 'IBM', holders: 1518 },
  { ticker: 'MRNA', address: '0x43B07D15cE533bEc5476d70C22a78a1B2B662155', name: 'Moderna', holders: 1366 },
  { ticker: 'SKHY', address: '0x84CAb63bc87912E71ad199ff14A0bA45de68FeF8', name: 'SK hynix Inc. American Depositary Shares', holders: 1316 },
  { ticker: 'RIVN', address: '0xB1BF26c1D20ff267A4f93550d1E0d06ac40a114B', name: 'Rivian Automotive', holders: 1077 },
  { ticker: 'FIG', address: '0x41F4267525a8AFf329540eF24fD83d9044758B33', name: 'Figma', holders: 1049 },
  { ticker: 'EWY', address: '0x7f0aBeF0C07280F82c6a08ead09dEd6BAE2C13Fc', name: 'iShares MSCI South Korea fund', holders: 204 },
] as const

export const STOCK_TOKEN_DECIMALS = 18

/** The official beacon every genuine stock token proxies to. */
export const OFFICIAL_TOKEN_BEACON = '0xe10b6f6b275de231345c20d14ab812db62151b00' as const

export const byTicker = (t: string): StockToken | undefined =>
  STOCK_TOKENS.find((s) => s.ticker === t)

/**
 * Phase 1 reward basket - the tickers a player can stake a tile on at launch.
 * Chosen for name recognition and on-chain depth (holder count), with SGOV as
 * the yield floor: it is the only instrument here whose uiMultiplier() has been
 * climbing steadily (1.00510 on 2026-09-07, ~10 weeks after mainnet).
 */
export const PHASE_1_TICKERS = [
  'NVDA', 'AAPL', 'TSLA', 'GOOGL', 'MSFT', 'AMZN', 'META',
  'SPY', 'QQQ', 'GLD', 'SGOV',
  'GME', 'COIN', 'PLTR', 'AMD', 'SPCX',
] as const
export type Phase1Ticker = (typeof PHASE_1_TICKERS)[number]
