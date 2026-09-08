import { useEffect } from 'react'
import { useAccount } from 'wagmi'
import { useAppKit } from '@reown/appkit/react'
import { AttractBackground } from './AttractBackground'
import { walletEnabled } from '../config/wallet'

interface Props {
  onEnter: () => void
  onBack: () => void
}

function short(address: string): string {
  return `${address.slice(0, 6)}…${address.slice(-4)}`
}

/** Only mounted when AppKit was initialised, so the hook is safe to call. */
function WalletChoice({ onEnter }: { onEnter: () => void }) {
  const { open } = useAppKit()
  const { address, isConnected } = useAccount()

  // Walk straight into the game the moment a wallet connects, so connecting
  // does not dead-end on a screen the player has to dismiss themselves.
  useEffect(() => {
    if (isConnected) onEnter()
  }, [isConnected, onEnter])

  return (
    <>
      <button type="button" className="play" onClick={() => open()} autoFocus>
        {isConnected && address ? short(address) : 'Connect wallet'}
      </button>
      <button type="button" className="btn quiet wide" onClick={onEnter}>
        Play without a wallet
      </button>
    </>
  )
}

export function ConnectGate({ onEnter, onBack }: Props) {
  return (
    <div className="landing">
      <AttractBackground />
      <div className="landing-scrim" aria-hidden="true" />

      <main className="landing-inner gate">
        <p className="landing-eyebrow">Step 2 of 2</p>
        <h2 className="gate-title">Connect a wallet</h2>

        <p className="landing-lede">
          A wallet is how a tile becomes an NFT you actually own. Nothing is minted in this build
          and no transaction is ever requested — connecting only names the player.
        </p>

        <div className="gate-actions">
          {walletEnabled ? (
            <WalletChoice onEnter={onEnter} />
          ) : (
            <>
              <p className="gate-note">
                Wallet connect is switched off because <code>VITE_REOWN_PROJECT_ID</code> is not set
                in <code>.env</code>. Add a project id from dashboard.reown.com to turn it on.
              </p>
              <button type="button" className="play" onClick={onEnter} autoFocus>
                ▶ Enter the board
              </button>
            </>
          )}
        </div>

        <button type="button" className="gate-back" onClick={onBack}>
          ← Back
        </button>

        <p className="landing-foot">
          Your board is saved to this browser only. Clearing site data clears the game.
        </p>
      </main>
    </div>
  )
}
