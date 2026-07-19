import { useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

/**
 * "El teu mosaic" — a trencadís sphere that gets tiled in, lesson
 * after lesson, like a little Gaudí artwork you rebuild by learning.
 */

const PALETTE = ['#e4572e', '#f4b942', '#2a7f9e', '#7c873b', '#d95f87', '#fff3dd', '#e4572e', '#f4b942']

function mulberry32(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

interface Face {
  verts: [THREE.Vector3, THREE.Vector3, THREE.Vector3]
  centroid: THREE.Vector3
  color: THREE.Color
}

function buildFaces(): Face[] {
  const geo = new THREE.IcosahedronGeometry(1, 2).toNonIndexed()
  const pos = geo.getAttribute('position')
  const rnd = mulberry32(42)
  const faces: Face[] = []
  for (let i = 0; i < pos.count; i += 3) {
    const a = new THREE.Vector3().fromBufferAttribute(pos, i)
    const b = new THREE.Vector3().fromBufferAttribute(pos, i + 1)
    const c = new THREE.Vector3().fromBufferAttribute(pos, i + 2)
    const centroid = new THREE.Vector3().add(a).add(b).add(c).divideScalar(3)
    const color = new THREE.Color(PALETTE[Math.floor(rnd() * PALETTE.length)])
    // shrink towards centroid: grout gap between tiles
    const gap = 0.86 + rnd() * 0.06
    const verts: Face['verts'] = [a, b, c].map((v) =>
      v.clone().sub(centroid).multiplyScalar(gap).add(centroid),
    ) as Face['verts']
    faces.push({ verts, centroid, color })
  }
  // Tile from the top down, with a slight swirl for organic growth
  faces.sort((f1, f2) => {
    const a1 = Math.atan2(f1.centroid.x, f1.centroid.z)
    const a2 = Math.atan2(f2.centroid.x, f2.centroid.z)
    return f2.centroid.y + a1 * 0.06 - (f1.centroid.y + a2 * 0.06)
  })
  geo.dispose()
  return faces
}

function facesToGeometry(faces: Face[], colored: boolean): THREE.BufferGeometry {
  const positions = new Float32Array(faces.length * 9)
  const colors = new Float32Array(faces.length * 9)
  faces.forEach((f, i) => {
    f.verts.forEach((v, j) => {
      positions.set([v.x, v.y, v.z], i * 9 + j * 3)
      if (colored) colors.set([f.color.r, f.color.g, f.color.b], i * 9 + j * 3)
    })
  })
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  if (colored) geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  geo.computeVertexNormals()
  return geo
}

function Sphere({ placed }: { placed: number }) {
  const group = useRef<THREE.Group>(null)
  const drag = useRef({ vx: 0.0, down: false, lastX: 0 })
  const faces = useMemo(buildFaces, [])

  const placedGeo = useMemo(() => facesToGeometry(faces.slice(0, placed), true), [faces, placed])
  const ghostGeo = useMemo(() => facesToGeometry(faces.slice(placed), false), [faces, placed])

  useFrame((state, dt) => {
    const g = group.current
    if (!g) return
    const t = state.clock.elapsedTime
    if (!drag.current.down) {
      drag.current.vx *= 0.95
      g.rotation.y += (0.22 + drag.current.vx) * dt
    }
    g.rotation.x = 0.28 + Math.sin(t * 0.5) * 0.04
    g.position.y = Math.sin(t * 0.8) * 0.045
  })

  return (
    <group
      ref={group}
      rotation={[0.28, 0, 0]}
      onPointerDown={(e) => {
        drag.current.down = true
        drag.current.lastX = e.clientX
      }}
      onPointerUp={() => (drag.current.down = false)}
      onPointerLeave={() => (drag.current.down = false)}
      onPointerMove={(e) => {
        if (!drag.current.down || !group.current) return
        const dx = e.clientX - drag.current.lastX
        drag.current.lastX = e.clientX
        group.current.rotation.y += dx * 0.008
        drag.current.vx = dx * 0.15
      }}
    >
      {placed > 0 && (
        <mesh geometry={placedGeo}>
          <meshStandardMaterial vertexColors flatShading roughness={0.5} metalness={0.05} />
        </mesh>
      )}
      {/* empty sockets: pale plaster tiles waiting for color */}
      <mesh geometry={ghostGeo}>
        <meshStandardMaterial color="#f6e7c8" transparent opacity={0.55} flatShading roughness={0.95} />
      </mesh>
      {/* inner core so gaps read as grout, not holes */}
      <mesh>
        <icosahedronGeometry args={[0.955, 1]} />
        <meshStandardMaterial color="#c99d6d" roughness={1} />
      </mesh>
    </group>
  )
}

function Orbiters() {
  const group = useRef<THREE.Group>(null)
  const shards = useMemo(() => {
    const rnd = mulberry32(7)
    return Array.from({ length: 9 }, (_, i) => ({
      radius: 1.55 + rnd() * 0.5,
      speed: 0.12 + rnd() * 0.2,
      phase: rnd() * Math.PI * 2,
      y: (rnd() - 0.5) * 1.1,
      size: 0.035 + rnd() * 0.05,
      color: PALETTE[i % 5],
    }))
  }, [])
  useFrame((state) => {
    const g = group.current
    if (!g) return
    const t = state.clock.elapsedTime
    g.children.forEach((child, i) => {
      const s = shards[i]
      const a = s.phase + t * s.speed
      child.position.set(Math.cos(a) * s.radius, s.y + Math.sin(t * 0.7 + s.phase) * 0.08, Math.sin(a) * s.radius)
      child.rotation.x = t * 0.6 + s.phase
      child.rotation.y = t * 0.4
    })
  })
  return (
    <group ref={group}>
      {shards.map((s, i) => (
        <mesh key={i}>
          <tetrahedronGeometry args={[s.size, 0]} />
          <meshStandardMaterial color={s.color} flatShading roughness={0.6} />
        </mesh>
      ))}
    </group>
  )
}

let webglOk: boolean | null = null
function hasWebgl(): boolean {
  if (webglOk != null) return webglOk
  try {
    const c = document.createElement('canvas')
    webglOk = !!(c.getContext('webgl2') || c.getContext('webgl'))
  } catch {
    webglOk = false
  }
  return webglOk
}

export function MosaicSphere({ placed, total, height = 230 }: { placed: number; total: number; height?: number }) {
  if (!hasWebgl()) {
    // graceful 2D fallback
    const pct = Math.round((placed / total) * 100)
    return (
      <div style={{ height, display: 'grid', placeItems: 'center' }}>
        <div
          style={{
            width: 150,
            height: 150,
            borderRadius: '50%',
            background: `conic-gradient(var(--terra) 0 ${pct}%, var(--crema-3) ${pct}% 100%)`,
          }}
        />
      </div>
    )
  }
  return (
    <div style={{ height, touchAction: 'pan-y' }}>
      <Canvas dpr={[1, 2]} camera={{ position: [0, 0, 3.05], fov: 42 }} gl={{ antialias: true, alpha: true }}>
        <ambientLight intensity={1.15} color="#fff2dd" />
        <directionalLight position={[2.5, 3, 2]} intensity={1.6} color="#ffe9c4" />
        <directionalLight position={[-3, -1, -2]} intensity={0.5} color="#9fd4e8" />
        <Sphere placed={placed} />
        <Orbiters />
      </Canvas>
    </div>
  )
}
