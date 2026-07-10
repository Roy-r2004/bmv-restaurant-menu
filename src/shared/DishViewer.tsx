import { Suspense, useMemo } from 'react'
import { Canvas } from '@react-three/fiber'
import { Center, Environment, OrbitControls, useGLTF } from '@react-three/drei'

function GlbModel({ url }: { url: string }) {
  const { scene } = useGLTF(url)
  return (
    <Center>
      <primitive object={scene.clone()} scale={1.15} />
    </Center>
  )
}

/**
 * Real GLB viewer only. Photo-on-a-fake-plate was removed — it looked bad.
 * Without a mesh, show the dish photo + a clear “generate real 3D” state.
 */
export function DishViewer({
  modelUrl,
  imageUrl,
  className = '',
  interactive = true,
  onRequestGenerate,
  generating = false,
}: {
  modelUrl: string | null
  imageUrl?: string | null
  className?: string
  interactive?: boolean
  onRequestGenerate?: () => void
  generating?: boolean
}) {
  const key = useMemo(() => modelUrl || 'none', [modelUrl])

  if (!modelUrl) {
    return (
      <div
        className={`relative overflow-hidden rounded-[2rem] border border-copper/25 bg-ink-soft ${className}`}
      >
        {imageUrl ? (
          <img src={imageUrl} alt="" className="h-full w-full object-cover opacity-80" />
        ) : (
          <div className="flex h-full min-h-[16rem] items-center justify-center text-bone-dim">No photo</div>
        )}
        <div className="absolute inset-0 flex flex-col items-center justify-end bg-gradient-to-t from-ink via-ink/50 to-transparent p-5 text-center">
          <p className="font-display text-xl text-bone">Real 3D mesh not ready</p>
          <p className="mt-1 max-w-xs text-xs text-bone-dim">
            Generated with fal.ai TripoSR / Meshy from the dish photo — not a flat image spin.
          </p>
          {onRequestGenerate && (
            <button
              type="button"
              disabled={generating}
              onClick={onRequestGenerate}
              className="mt-3 rounded-full bg-copper px-4 py-2 text-sm font-medium text-ink disabled:opacity-50"
            >
              {generating ? 'Building 3D mesh… (30–90s)' : 'Generate real 3D'}
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div
      className={`relative overflow-hidden rounded-[2rem] border border-copper/25 bg-ink-soft touch-none ${className}`}
      style={{ WebkitTapHighlightColor: 'transparent' }}
    >
      <Canvas
        key={key}
        camera={{ position: [0, 1.1, 2.6], fov: 38 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
      >
        <color attach="background" args={['#161412']} />
        <ambientLight intensity={0.65} />
        <directionalLight position={[3, 5, 2]} intensity={1.35} color="#ffd2a8" />
        <Suspense fallback={null}>
          <GlbModel url={modelUrl} />
          <Environment preset="warehouse" />
        </Suspense>
        <OrbitControls
          enabled={interactive}
          enablePan={false}
          enableZoom={interactive}
          minDistance={1.6}
          maxDistance={4}
          autoRotate
          autoRotateSpeed={0.55}
        />
      </Canvas>
      <p className="pointer-events-none absolute bottom-3 left-0 right-0 text-center text-[10px] uppercase tracking-[0.25em] text-bone/50">
        Drag to spin
      </p>
    </div>
  )
}

/** Lightweight CSS 3D card for list rows. */
export function DishThumb3D({
  imageUrl,
  active,
  hasModel,
}: {
  imageUrl: string | null
  active?: boolean
  hasModel?: boolean
}) {
  return (
    <div className="perspective-[600px] relative h-16 w-16 shrink-0">
      <div
        className={`relative h-full w-full rounded-xl transition-transform duration-500 ${
          active && hasModel ? 'animate-spin-y-slow' : 'group-active:rotate-y-12'
        }`}
        style={{ transformStyle: 'preserve-3d' }}
      >
        <div className="absolute inset-0 overflow-hidden rounded-xl border border-bone/10 bg-ink-soft">
          {imageUrl ? (
            <img src={imageUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-bone-dim">—</div>
          )}
        </div>
      </div>
      {hasModel && (
        <span className="absolute -bottom-1 -right-1 rounded-full bg-copper px-1.5 py-0.5 text-[9px] font-medium text-ink">
          3D
        </span>
      )}
    </div>
  )
}
