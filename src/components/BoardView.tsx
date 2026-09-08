import { useCallback, useEffect, useRef, useState } from 'react'
import { BOARD_PX, CELL, paintBoard, tileIndexFromEvent } from '../render/board'
import { BOARD_SIZE, type Tile } from '../game/types'
import type { Territories } from '../game/engine'
import type { Mode } from '../game/useGame'

interface Props {
  tiles: Tile[]
  territories: Territories
  selected: number | null
  mode: Mode
  activeTicker: string
  claimsLeft: number
  onSelect: (index: number) => void
  onApply: (index: number) => void
  onMode: (mode: Mode) => void
}

export function BoardView({
  tiles,
  territories,
  selected,
  mode,
  activeTicker,
  claimsLeft,
  onSelect,
  onApply,
  onMode,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const baseRef = useRef<HTMLCanvasElement | null>(null)
  const [hover, setHover] = useState<number | null>(null)
  const painting = useRef(false)

  /* Repaint the base layer only when the board actually changes. */
  useEffect(() => {
    if (!baseRef.current) {
      baseRef.current = document.createElement('canvas')
      baseRef.current.width = BOARD_PX
      baseRef.current.height = BOARD_PX
    }
    const ctx = baseRef.current.getContext('2d')
    if (!ctx) return
    const image = ctx.createImageData(BOARD_PX, BOARD_PX)
    paintBoard(image, tiles, territories)
    ctx.putImageData(image, 0, 0)
    draw()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tiles, territories])

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    const base = baseRef.current
    if (!canvas || !base) return
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    if (canvas.width !== BOARD_PX * dpr) {
      canvas.width = BOARD_PX * dpr
      canvas.height = BOARD_PX * dpr
    }
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.imageSmoothingEnabled = false
    ctx.drawImage(base, 0, 0)

    // Overlays are inversion, never colour.
    ctx.globalCompositeOperation = 'difference'
    ctx.fillStyle = '#FFFFFF'
    if (hover !== null && hover !== selected) {
      const x = (hover % BOARD_SIZE) * CELL
      const y = Math.floor(hover / BOARD_SIZE) * CELL
      ctx.fillRect(x, y, CELL, CELL)
    }
    if (selected !== null) {
      const x = (selected % BOARD_SIZE) * CELL
      const y = Math.floor(selected / BOARD_SIZE) * CELL
      ctx.fillRect(x, y, CELL, CELL)
      ctx.globalCompositeOperation = 'source-over'
      ctx.strokeStyle = '#FFFFFF'
      ctx.lineWidth = 2
      ctx.strokeRect(x - 1, y - 1, CELL + 2, CELL + 2)
    }
    ctx.globalCompositeOperation = 'source-over'
  }, [hover, selected])

  useEffect(() => {
    draw()
  }, [draw])

  const handlePointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.setPointerCapture(event.pointerId)
    painting.current = true
    const index = tileIndexFromEvent(canvas, event.clientX, event.clientY)
    if (index === null) return
    onApply(index)
  }

  const handlePointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const index = tileIndexFromEvent(canvas, event.clientX, event.clientY)
    setHover(index)
    if (painting.current && index !== null) onApply(index)
  }

  const handlePointerUp = (event: React.PointerEvent<HTMLCanvasElement>) => {
    painting.current = false
    canvasRef.current?.releasePointerCapture(event.pointerId)
  }

  const handleKey = (event: React.KeyboardEvent<HTMLCanvasElement>) => {
    const current = selected ?? 0
    const x = current % BOARD_SIZE
    const y = Math.floor(current / BOARD_SIZE)
    let next: number | null = null
    if (event.key === 'ArrowLeft') next = y * BOARD_SIZE + Math.max(0, x - 1)
    else if (event.key === 'ArrowRight') next = y * BOARD_SIZE + Math.min(BOARD_SIZE - 1, x + 1)
    else if (event.key === 'ArrowUp') next = Math.max(0, y - 1) * BOARD_SIZE + x
    else if (event.key === 'ArrowDown') next = Math.min(BOARD_SIZE - 1, y + 1) * BOARD_SIZE + x
    else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      if (selected !== null) onApply(selected)
      return
    }
    if (next === null) return
    event.preventDefault()
    onSelect(next)
  }

  return (
    <div className="board-frame">
      <div className="board-tools" role="group" aria-label="Board mode">
        <button
          type="button"
          className="seg"
          aria-pressed={mode === 'claim'}
          onClick={() => onMode('claim')}
        >
          Claim
          <b>{claimsLeft} tile{claimsLeft === 1 ? '' : 's'} left</b>
        </button>
        <button
          type="button"
          className="seg"
          aria-pressed={mode === 'stake'}
          onClick={() => onMode('stake')}
        >
          Stake
          <b>to {activeTicker}</b>
        </button>
      </div>

      <canvas
        ref={canvasRef}
        className="board"
        width={BOARD_PX}
        height={BOARD_PX}
        tabIndex={0}
        role="application"
        aria-label={`32 by 32 board. Mode: ${mode}. Arrow keys move, Enter applies.`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onPointerLeave={() => setHover(null)}
        onKeyDown={handleKey}
      />

      <p className="board-hint">
        {mode === 'claim' ? (
          <>
            Click or drag across <b>empty tiles</b> to claim them for <b>{activeTicker}</b>. Bright
            tiles are yours; grey outlines are rivals.
          </>
        ) : (
          <>
            Click or drag across <b>your tiles</b> to re-stake them to <b>{activeTicker}</b>.
            Touching tiles on the same ticker form a territory and earn more.
          </>
        )}
      </p>
    </div>
  )
}
