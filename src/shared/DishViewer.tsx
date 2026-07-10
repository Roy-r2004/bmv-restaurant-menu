import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { Center, Environment, OrbitControls, useGLTF } from '@react-three/drei'

function Model({ url }: { url: string }) {
  const { scene } = useGLTF(url)
  return (
    <Center>
      <primitive object={scene} scale={1.2} />
    </Center>
  )
}

export function DishViewer({
  modelUrl,
  className = '',
}: {
  modelUrl: string | null
  className?: string
}) {
  if (!modelUrl) {
    return (
      <div
        className={`flex items-center justify-center rounded-full border border-bone/15 bg-plate/80 text-bone-dim ${className}`}
      >
        <p className="max-w-[12rem] text-center text-sm tracking-wide">
          No 3D plate yet — upload a .glb in the kitchen.
        </p>
      </div>
    )
  }

  return (
    <div className={`overflow-hidden rounded-full border border-copper/30 bg-ink-soft ${className}`}>
      <Canvas camera={{ position: [0, 0.4, 2.4], fov: 35 }} dpr={[1, 1.75]}>
        <color attach="background" args={['#161412']} />
        <ambientLight intensity={0.55} />
        <directionalLight position={[3, 4, 2]} intensity={1.2} color="#ffd2a8" />
        <Suspense fallback={null}>
          <Model url={modelUrl} />
          <Environment preset="warehouse" />
        </Suspense>
        <OrbitControls enablePan={false} minDistance={1.4} maxDistance={4} autoRotate autoRotateSpeed={0.6} />
      </Canvas>
    </div>
  )
}
