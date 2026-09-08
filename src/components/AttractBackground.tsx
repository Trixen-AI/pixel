import { useEffect, useRef } from 'react'
import { AttractSim, CELL } from '../attract/attractSim'

/** CSS upscale factor. The canvas is painted small and blown up, pixelated. */
const SCALE = 4
/** Simulation step interval. Slow enough to read as deliberate, not noise. */
const STEP_MS = 420

/**
 * Full-bleed living background. Renders the attract simulation and stops
 * entirely when the tab is hidden or the viewer asked for reduced motion -
 * a landing page has no business burning a laptop battery in the background.
 */
export function AttractBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d', { alpha: false })
    if (!ctx) return

    const sim = new AttractSim()
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)')

    let image: ImageData | null = null
    let width = 0
    let height = 0
    let frame = 0
    let lastStep = 0
    let glow = 0
    let running = true

    const resize = () => {
      width = Math.max(1, Math.ceil(window.innerWidth / SCALE))
      height = Math.max(1, Math.ceil(window.innerHeight / SCALE))
      canvas.width = width
      canvas.height = height
      image = ctx.createImageData(width, height)
      sim.resize(Math.ceil(width / CELL), Math.ceil(height / CELL))
      draw(performance.now(), true)
    }

    const draw = (time: number, force = false) => {
      if (!image) return
      if (!force && !running) return
      sim.paint(image, width, height, glow)
      ctx.putImageData(image, 0, 0)
      if (force) lastStep = time
    }

    const loop = (time: number) => {
      frame = requestAnimationFrame(loop)
      if (document.hidden) return

      if (time - lastStep >= STEP_MS) {
        sim.step()
        lastStep = time
      }
      // Glow sweeps a little faster than the simulation so the field never
      // looks frozen between steps.
      glow = ((time / 26) % (width + 220)) - 110
      draw(time)
    }

    const start = () => {
      if (reduced.matches) {
        // One settled frame, no animation.
        running = false
        for (let i = 0; i < 40; i++) sim.step()
        glow = width * 0.5
        draw(performance.now(), true)
        return
      }
      running = true
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(loop)
    }

    resize()
    start()

    window.addEventListener('resize', resize)
    reduced.addEventListener('change', start)

    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('resize', resize)
      reduced.removeEventListener('change', start)
    }
  }, [])

  return <canvas ref={canvasRef} className="attract-bg" aria-hidden="true" />
}
