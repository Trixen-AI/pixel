/**
 * Attract mode: the board plays itself behind the landing screen.
 *
 * This is not decoration bolted on - it is the same game rendered with the same
 * 1-bit vocabulary, running unattended, the way an arcade cabinet demos itself
 * when nobody is holding the stick. Territories grow into open ground, rotate
 * when the regime turns, and occasionally get cut back so the field never
 * saturates into a flat grey.
 *
 * It is deliberately cheap: the simulation runs on a coarse grid and paints a
 * low-resolution ImageData that CSS scales up with pixelated rendering, so a
 * full-viewport animation costs well under a hundred thousand pixels a frame.
 */

/** Logical pixels per simulation cell. Each cell carries its own dither block. */
export const CELL = 5

/** Bayer 4x4, same matrix the real board uses. */
const BAYER = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
] as const

const EMPTY = -1

/** Distinct dither levels per band, spread so neighbouring bands stay legible. */
const BAND_LEVEL = [3, 6, 9, 12, 15, 5, 8, 11] as const
const BANDS = BAND_LEVEL.length

function mulberry32(a: number): () => number {
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export class AttractSim {
  cols = 0
  rows = 0
  /** Band index per cell, or EMPTY. */
  private cells = new Int8Array(0)
  private scratch = new Int8Array(0)
  private rnd = mulberry32(0x5eed)
  /** Sweep position, in cells, for the rotation wave. */
  private sweep = 0

  resize(cols: number, rows: number) {
    if (cols === this.cols && rows === this.rows) return
    this.cols = cols
    this.rows = rows
    this.cells = new Int8Array(cols * rows).fill(EMPTY)
    this.scratch = new Int8Array(cols * rows)
    this.seed()
  }

  private seed() {
    const { cols, rows, cells } = this
    // A handful of starting claims, spread out, so growth reads as several
    // players rather than one spill.
    const seeds = Math.max(6, Math.round((cols * rows) / 420))
    for (let i = 0; i < seeds; i++) {
      const x = Math.floor(this.rnd() * cols)
      const y = Math.floor(this.rnd() * rows)
      cells[y * cols + x] = Math.floor(this.rnd() * BANDS)
    }
  }

  /** One simulation step: grow, rotate along the sweep, cut back. */
  step() {
    const { cols, rows, cells, scratch } = this
    if (!cols || !rows) return
    scratch.set(cells)

    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const i = y * cols + x
        const value = cells[i] as number

        if (value === EMPTY) {
          // Grow into open ground from whichever neighbour gets there first.
          if (this.rnd() < 0.16) {
            const n = this.neighbourBand(x, y)
            if (n !== EMPTY) scratch[i] = n
          }
          continue
        }

        // The sweep is the regime turning: a band of the field rotates to a
        // neighbouring ticker as the wave passes over it.
        const distance = Math.abs(x - this.sweep)
        if (distance < 2 && this.rnd() < 0.35) {
          scratch[i] = (value + 1) % BANDS
          continue
        }

        // Occasional cutback keeps open ground in the picture.
        if (this.rnd() < 0.004) scratch[i] = EMPTY
      }
    }

    cells.set(scratch)
    this.sweep = (this.sweep + 1) % (cols + 24)
  }

  private neighbourBand(x: number, y: number): number {
    const { cols, rows, cells } = this
    // Sample in a rotating order so growth is not biased to one direction.
    const order = Math.floor(this.rnd() * 4)
    for (let k = 0; k < 4; k++) {
      const d = (order + k) % 4
      const nx = d === 0 ? x - 1 : d === 1 ? x + 1 : x
      const ny = d === 2 ? y - 1 : d === 3 ? y + 1 : y
      if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) continue
      const v = cells[ny * cols + nx] as number
      if (v !== EMPTY) return v
    }
    return EMPTY
  }

  /**
   * Paint into an ImageData sized width x height logical pixels.
   * `glow` (0..1) brightens a moving vertical band so the field breathes even
   * between simulation steps.
   */
  paint(image: ImageData, width: number, height: number, glowX: number) {
    const { cols, cells } = this
    const data = image.data

    for (let py = 0; py < height; py++) {
      const cy = (py / CELL) | 0
      const inY = py % CELL
      const rowBase = cy * cols

      for (let px = 0; px < width; px++) {
        const cx = (px / CELL) | 0
        const inX = px % CELL
        const band = cells[rowBase + cx] as number
        const offset = (py * width + px) * 4

        let value: number

        if (band === EMPTY || band === undefined) {
          // Open ground keeps only the grid hairline, so the field still reads
          // as a board rather than a void.
          value = inX === 0 || inY === 0 ? 0x14 : 0x00
        } else {
          const left = cx > 0 ? (cells[rowBase + cx - 1] as number) : EMPTY
          const up = cy > 0 ? (cells[rowBase - cols + cx] as number) : EMPTY
          const edge = (inX === 0 && left !== band) || (inY === 0 && up !== band)

          if (edge) {
            value = 0x6a
          } else {
            const level = BAND_LEVEL[band] ?? 8
            value = (BAYER[py & 3]?.[px & 3] ?? 0) < level ? 0x4e : 0x00
          }
        }

        // Moving highlight. Cheap distance falloff, no per-pixel maths beyond
        // an absolute difference.
        const distance = Math.abs(px - glowX)
        if (distance < 90 && value > 0) {
          value = Math.min(255, value + Math.round((1 - distance / 90) * 74))
        }

        data[offset] = value
        data[offset + 1] = value
        data[offset + 2] = value
        data[offset + 3] = 255
      }
    }
  }
}
