import { BOARD_SIZE, TILE_COUNT, type Tile } from '../game/types'
import type { Territories } from '../game/engine'
import { territoryBonus } from '../game/engine'

export const CELL = 18
export const BOARD_PX = BOARD_SIZE * CELL // 576

/**
 * Bayer 4x4 ordered dither. The board has no colour, so quantity has to be
 * carried by how densely a cell is lit.
 */
const BAYER = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
] as const

/**
 * Encoding, in one place so it stays honest:
 *   density  - territory bonus (how much the tile earns)
 *   outline  - a neighbour is staked to a different ticker (territory border)
 *   your tiles are drawn lit; rival tiles are drawn as outline only, so the
 *   board reads as "mine vs theirs" before you read a single label.
 */
export function paintBoard(
  target: ImageData,
  tiles: Tile[],
  territories: Territories,
): void {
  const data = target.data

  // Precompute per-tile dither level once rather than per pixel.
  const level = new Uint8Array(TILE_COUNT)
  for (let i = 0; i < TILE_COUNT; i++) {
    const tile = tiles[i]
    if (!tile?.owner || !tile.ticker) continue
    const bonus = territoryBonus(territories.sizeOf[i] ?? 0) // 1.00 .. 2.44
    const normalised = Math.min(1, (bonus - 1) / 1.44)
    level[i] = tile.owner === 'you' ? 5 + Math.round(normalised * 11) : 2 + Math.round(normalised * 4)
  }

  for (let py = 0; py < BOARD_PX; py++) {
    const cy = (py / CELL) | 0
    const inY = py % CELL
    for (let px = 0; px < BOARD_PX; px++) {
      const cx = (px / CELL) | 0
      const inX = px % CELL
      const index = cy * BOARD_SIZE + cx
      const tile = tiles[index]
      const offset = (py * BOARD_PX + px) * 4

      let value = 0

      if (!tile || tile.owner === null) {
        // Unclaimed: grid hairline only, so empty board still reads as a board.
        value = inX === 0 || inY === 0 ? 0x22 : 0x00
      } else {
        const ticker = tile.ticker
        const left = cx > 0 ? tiles[index - 1] : undefined
        const up = cy > 0 ? tiles[index - BOARD_SIZE] : undefined
        const right = cx < BOARD_SIZE - 1 ? tiles[index + 1] : undefined
        const down = cy < BOARD_SIZE - 1 ? tiles[index + BOARD_SIZE] : undefined

        const edge =
          (inX === 0 && left?.ticker !== ticker) ||
          (inY === 0 && up?.ticker !== ticker) ||
          (inX === CELL - 1 && right?.ticker !== ticker) ||
          (inY === CELL - 1 && down?.ticker !== ticker)

        if (edge) {
          value = tile.owner === 'you' ? 0xff : 0x6e
        } else {
          const lit = (BAYER[py & 3]?.[px & 3] ?? 0) < (level[index] ?? 0)
          value = lit ? (tile.owner === 'you' ? 0xff : 0x8a) : 0x00
        }
      }

      data[offset] = value
      data[offset + 1] = value
      data[offset + 2] = value
      data[offset + 3] = 255
    }
  }
}

export function tileIndexFromEvent(
  canvas: HTMLCanvasElement,
  clientX: number,
  clientY: number,
): number | null {
  const rect = canvas.getBoundingClientRect()
  const x = Math.floor(((clientX - rect.left) / rect.width) * BOARD_SIZE)
  const y = Math.floor(((clientY - rect.top) / rect.height) * BOARD_SIZE)
  if (x < 0 || y < 0 || x >= BOARD_SIZE || y >= BOARD_SIZE) return null
  return y * BOARD_SIZE + x
}
