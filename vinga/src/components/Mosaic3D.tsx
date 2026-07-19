import { lazy, Suspense } from 'react'

const Inner = lazy(() => import('./MosaicSphere').then((m) => ({ default: m.MosaicSphere })))

/** Lazy wrapper so three.js lands in its own async chunk */
export function Mosaic3D(props: { placed: number; total: number; height?: number }) {
  return (
    <Suspense fallback={<div style={{ height: props.height ?? 230 }} />}>
      <Inner {...props} />
    </Suspense>
  )
}
