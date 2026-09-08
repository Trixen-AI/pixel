import { RULES } from '../game/engine'

const STEPS: Array<{ title: string; body: string }> = [
  {
    title: 'Claim ground',
    body: `In Claim mode, click or drag across empty tiles to take them. You start with ${RULES.claimBudget} claims and get ${RULES.claimsPerRound} more each round. Claimed tiles are staked to whichever ticker is selected in the rail.`,
  },
  {
    title: 'Read the regime',
    body: 'Each round runs under a market regime that lifts one sector and holds another back. It is shown before settlement, and the next one is shown too — so positioning is a decision, not a guess.',
  },
  {
    title: 'Build territory',
    body: `Tiles staked to the same ticker and touching side by side form a territory, counting every owner's tiles, not just yours. Bigger territory, bigger multiplier, up to ${(1 + RULES.territoryCap * RULES.territoryStep).toFixed(2)}×.`,
  },
  {
    title: 'Bank conviction',
    body: `A tile that keeps the same ticker compounds ${RULES.convictionStep.toFixed(2)}× per round to a ceiling of ${(1 + RULES.convictionCap * RULES.convictionStep).toFixed(2)}×. Re-staking to chase a regime resets it to 1.00×. That trade is the game.`,
  },
  {
    title: 'Spread',
    body: `Any territory of ${RULES.spreadMinSize} tiles or more pushes into neighbouring empty ground each round — yours and your rivals'. Open ground disappears, so claiming early beats hoarding claims.`,
  },
  {
    title: 'Settle',
    body: `${(RULES.floorShare * 100).toFixed(0)}% of the round's pool is paid flat as SGOV across every claimed tile on the board — the floor, which a bad call cannot take from you. The rest is split by performance × territory × conviction.`,
  },
]

export function HowToPlay() {
  return (
    <details className="howto">
      <summary>How to play</summary>
      <ol>
        {STEPS.map((step) => (
          <li key={step.title}>
            <b>{step.title}</b> — {step.body}
          </li>
        ))}
      </ol>
    </details>
  )
}
