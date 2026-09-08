import { useAccount } from 'wagmi'
import { useAppKit } from '@reown/appkit/react'
import { walletEnabled } from '../config/wallet'

function short(address: string): string {
  return `${address.slice(0, 6)}…${address.slice(-4)}`
}

/** Only rendered when AppKit was initialised, so the hook is safe to call. */
function ConnectedButton() {
  const { open } = useAppKit()
  const { address, isConnected } = useAccount()
  return (
    <button
      type="button"
      className={`wallet${isConnected ? ' connected' : ''}`}
      onClick={() => open()}
    >
      {isConnected && address ? short(address) : 'Connect wallet'}
    </button>
  )
}

export function WalletButton() {
  if (!walletEnabled) {
    return (
      <button
        type="button"
        className="wallet off"
        title="Set VITE_REOWN_PROJECT_ID in .env to enable wallet connect. The game plays without it."
      >
        Wallet off
      </button>
    )
  }
  return <ConnectedButton />
}
