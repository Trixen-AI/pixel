import { useCallback, useState } from 'react'
import { useMultipliers } from './chain/useMultipliers'
import { LandingScreen } from './components/LandingScreen'
import { ConnectGate } from './components/ConnectGate'
import { GameScreen } from './components/GameScreen'

type Phase = 'attract' | 'connect' | 'play'

export default function App() {
  const [phase, setPhase] = useState<Phase>('attract')

  // Read once at the top and share it. The landing screen shows the live
  // multiplier as proof the chain is really being read, and the game reuses
  // the same query rather than opening a second one.
  const multipliers = useMultipliers()

  const toConnect = useCallback(() => setPhase('connect'), [])
  const toPlay = useCallback(() => setPhase('play'), [])
  const toAttract = useCallback(() => setPhase('attract'), [])

  if (phase === 'attract') {
    return <LandingScreen multipliers={multipliers} onPlay={toConnect} />
  }
  if (phase === 'connect') {
    return <ConnectGate onEnter={toPlay} onBack={toAttract} />
  }
  // Mounted only now, so the round clock does not tick behind the title screen.
  return <GameScreen multipliers={multipliers} onExit={toAttract} />
}
