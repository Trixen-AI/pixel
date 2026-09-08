import { useGame } from '../game/useGame'
import { robinhoodChain } from '../config/chain'
import { BoardView } from './BoardView'
import { TilePanel } from './TilePanel'
import { TickerRail } from './TickerRail'
import { RoundPanel } from './RoundPanel'
import { LedgerPanel } from './LedgerPanel'
import { WalletButton } from './WalletButton'
import { XLink } from './XLink'
import { HowToPlay } from './HowToPlay'
import type { MultipliersResult } from '../chain/useMultipliers'

interface Props {
  multipliers: MultipliersResult
  onExit: () => void
}

export function GameScreen({ multipliers, onExit }: Props) {
  const game = useGame()

  const selectedTile = game.selected !== null ? (game.state.tiles[game.selected] ?? null) : null
  const selectedReading = selectedTile?.ticker ? multipliers.byTicker[selectedTile.ticker] : undefined

  return (
    <div className="shell">
      <header className="topbar">
        <div className="brand">
          <button type="button" className="brand-btn" onClick={onExit} title="Back to the title screen">
            PIXEL DIVIDEND
          </button>
          <small>32 × 32 · 1,024 tiles · Robinhood Chain</small>
        </div>
        <div className="status">
          <span className="tag live">
            <span className="dot" aria-hidden="true" />
            Live · chain {robinhoodChain.id}
          </span>
          <XLink variant="compact" />
          <WalletButton />
        </div>
      </header>

      <main className="stage">
        <BoardView
          tiles={game.state.tiles}
          territories={game.territories}
          selected={game.selected}
          mode={game.mode}
          activeTicker={game.activeTicker}
          claimsLeft={game.state.claimsLeft}
          onSelect={game.setSelected}
          onApply={game.applyToTile}
          onMode={game.setMode}
        />

        <aside className="side">
          <RoundPanel
            round={game.state.round}
            secondsLeft={game.secondsLeft}
            roundLength={game.roundLength}
            lastResult={game.lastResult}
            tilesHeld={game.stats.yours}
            regime={game.regime}
            nextRegime={game.nextRegime}
            onSettle={game.settle}
          />
          <TickerRail
            active={game.activeTicker}
            onPick={game.setActiveTicker}
            held={game.stats.byTicker}
            multipliers={multipliers}
            regime={game.regime}
          />
          <TilePanel
            index={game.selected}
            tile={selectedTile}
            territories={game.territories}
            reading={selectedReading}
            round={game.state.round}
          />
          <LedgerPanel ledger={game.state.ledger} stats={game.stats} onReset={game.reset} />
        </aside>
      </main>

      <HowToPlay />
    </div>
  )
}
