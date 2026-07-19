import { useEffect, useRef } from 'react'

/**
 * Celebration: a burst of trencadís shards (canvas 2D, no deps).
 * Fires once per `trigger` change.
 */

const COLORS = ['#e4572e', '#f4b942', '#2a7f9e', '#7c873b', '#d95f87', '#fff3dd']

interface P {
  x: number
  y: number
  vx: number
  vy: number
  rot: number
  vr: number
  size: number
  color: string
  shape: number[]
  life: number
}

export function ShardBurst({ trigger, origin = 0.42 }: { trigger: number; origin?: number }) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (trigger <= 0) return
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const dpr = Math.min(devicePixelRatio || 1, 2)
    const w = (canvas.width = canvas.offsetWidth * dpr)
    const h = (canvas.height = canvas.offsetHeight * dpr)

    const parts: P[] = Array.from({ length: 64 }, () => {
      const angle = Math.random() * Math.PI * 2
      const speed = (3 + Math.random() * 9) * dpr
      return {
        x: w / 2,
        y: h * origin,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 4 * dpr,
        rot: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 0.3,
        size: (5 + Math.random() * 9) * dpr,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        shape: [Math.random() * 0.8 + 0.4, Math.random() * 0.8 + 0.4, Math.random() * 0.7 + 0.3],
        life: 1,
      }
    })

    let raf = 0
    let alive = true
    const step = () => {
      if (!alive) return
      ctx.clearRect(0, 0, w, h)
      let any = false
      for (const p of parts) {
        p.vy += 0.32 * dpr
        p.x += p.vx
        p.y += p.vy
        p.vx *= 0.985
        p.rot += p.vr
        p.life -= 0.011
        if (p.life <= 0 || p.y > h + 40) continue
        any = true
        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.rotate(p.rot)
        ctx.globalAlpha = Math.min(1, p.life * 1.6)
        ctx.fillStyle = p.color
        ctx.beginPath()
        ctx.moveTo(-p.size * p.shape[0], p.size * p.shape[2])
        ctx.lineTo(0, -p.size * p.shape[1])
        ctx.lineTo(p.size * p.shape[0], p.size * p.shape[2] * 0.7)
        ctx.closePath()
        ctx.fill()
        ctx.restore()
      }
      if (any) raf = requestAnimationFrame(step)
      else ctx.clearRect(0, 0, w, h)
    }
    raf = requestAnimationFrame(step)
    return () => {
      alive = false
      cancelAnimationFrame(raf)
    }
  }, [trigger, origin])

  return (
    <canvas
      ref={ref}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 60 }}
    />
  )
}
