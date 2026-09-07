import { lazy, Suspense } from 'react'
import { artworkFor } from './artworks'

const Inner = lazy(() => import('./MosaicSphere').then((m) => ({ default: m.MosaicSphere })))

/**
 * Lazy wrapper so three.js lands in its own async chunk.
 * Picks the artwork currently being tiled from the global shard count.
 */
export function Mosaic3D({ shards, height }: { shards: number; height?: number }) {
  const artwork = artworkFor(shards)
  return (
    <Suspense fallback={<div style={{ height: height ?? 230 }} />}>
      <Inner kind={artwork.kind} placed={artwork.placed} total={artwork.faces} height={height} />
    </Suspense>
  )
}
