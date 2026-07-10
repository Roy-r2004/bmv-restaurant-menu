import { Suspense, useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Center, Environment, OrbitControls, useGLTF, useTexture } from '@react-three/drei'
import type { Group, Mesh } from 'three'
import * as THREE from 'three'

function GlbModel({ url }: { url: string }) {
  const { scene } = useGLTF(url)
  return (
    <Center>
      <primitive object={scene.clone()} scale={1.15} />
    </Center>
  )
}

/** Always-on 3D plate: dish photo mapped onto a floating ceramic plate. */
function PhotoPlate({ imageUrl }: { imageUrl: string }) {
  const group = useRef<Group>(null)
  const texture = useTexture(imageUrl)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.wrapS = texture.wrapT = THREE.ClampToEdgeWrapping

  useFrame((state) => {
    if (!group.current) return
    const t = state.clock.elapsedTime
    group.current.rotation.y = t * 0.45
    group.current.position.y = Math.sin(t * 1.1) * 0.06
    group.current.rotation.x = -0.35 + Math.sin(t * 0.7) * 0.04
  })

  return (
    <group ref={group}>
      {/* Rim / ceramic plate */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.04, 0]} receiveShadow>
        <cylinderGeometry args={[1.15, 1.2, 0.08, 64]} />
        <meshStandardMaterial color="#d8cfc3" metalness={0.15} roughness={0.35} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <circleGeometry args={[1.02, 64]} />
        <meshStandardMaterial color="#f3ebe1" metalness={0.05} roughness={0.55} />
      </mesh>
      {/* Food surface */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.035, 0]}>
        <circleGeometry args={[0.92, 64]} />
        <meshStandardMaterial map={texture} roughness={0.7} metalness={0.05} />
      </mesh>
      {/* Soft shadow disc */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.12, 0]}>
        <circleGeometry args={[0.95, 32]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.28} />
      </mesh>
    </group>
  )
}

function FallbackOrb() {
  const mesh = useRef<Mesh>(null)
  useFrame((state) => {
    if (!mesh.current) return
    mesh.current.rotation.y = state.clock.elapsedTime * 0.8
    mesh.current.rotation.x = Math.sin(state.clock.elapsedTime) * 0.2
  })
  return (
    <mesh ref={mesh}>
      <torusKnotGeometry args={[0.45, 0.14, 128, 16]} />
      <meshStandardMaterial color="#c45c26" metalness={0.4} roughness={0.3} />
    </mesh>
  )
}

function Scene({ modelUrl, imageUrl }: { modelUrl: string | null; imageUrl: string | null }) {
  if (modelUrl) return <GlbModel url={modelUrl} />
  if (imageUrl) return <PhotoPlate imageUrl={imageUrl} />
  return <FallbackOrb />
}

export function DishViewer({
  modelUrl,
  imageUrl,
  className = '',
  interactive = true,
}: {
  modelUrl: string | null
  imageUrl?: string | null
  className?: string
  /** Touch-drag orbit on phones; keep true for the hero stage. */
  interactive?: boolean
}) {
  const key = useMemo(() => `${modelUrl || ''}|${imageUrl || ''}`, [modelUrl, imageUrl])

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
        <directionalLight position={[3, 5, 2]} intensity={1.35} color="#ffd2a8" castShadow />
        <spotLight position={[-2, 4, 1]} intensity={0.5} color="#c45c26" />
        <Suspense fallback={null}>
          <Scene modelUrl={modelUrl} imageUrl={imageUrl || null} />
          <Environment preset="warehouse" />
        </Suspense>
        <OrbitControls
          enabled={interactive}
          enablePan={false}
          enableZoom={interactive}
          minDistance={1.6}
          maxDistance={4}
          autoRotate
          autoRotateSpeed={interactive ? 0.55 : 0.9}
        />
      </Canvas>
      <p className="pointer-events-none absolute bottom-3 left-0 right-0 text-center text-[10px] uppercase tracking-[0.25em] text-bone/50">
        Drag to spin
      </p>
    </div>
  )
}

/** Lightweight CSS 3D card for list rows — every item animates without extra WebGL. */
export function DishThumb3D({
  imageUrl,
  active,
}: {
  imageUrl: string | null
  active?: boolean
}) {
  return (
    <div className="perspective-[600px] h-16 w-16 shrink-0">
      <div
        className={`preserve-3d relative h-full w-full rounded-xl transition-transform duration-500 ${
          active ? 'animate-spin-y-slow' : 'group-active:rotate-y-12 group-hover:rotate-y-8'
        }`}
        style={{ transformStyle: 'preserve-3d' }}
      >
        <div className="absolute inset-0 overflow-hidden rounded-xl border border-bone/10 bg-ink-soft backface-hidden">
          {imageUrl ? (
            <img src={imageUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-bone-dim">—</div>
          )}
        </div>
      </div>
    </div>
  )
}
