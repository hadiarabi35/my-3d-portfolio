import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, Float, MeshDistortMaterial, Environment } from '@react-three/drei'
import { useRef, useState } from 'react'
import * as THREE from 'three'

// تنظیمات فیزیک و ظاهر (رنگ و رفتار)
const CONFIG = {
  color: "#a0a0a0",
  distort: 0.5,
  speed: 3,
  repulsionRadius: 5,
  repulsionForce: 0.8,
}

// تنظیمات نهایی موقعیت، چرخش و سایز (طبق عکس ارسالی شما)
const TRANSFORM = {
  position: [0, 0, -57],
  rotation: [0, 0, 2.5],
  scale: 20
}

function InteractiveShape() {
  const meshRef = useRef()
  const lightRef = useRef()
  const { viewport } = useThree()
  const [hovered, setHover] = useState(false)

  useFrame((state) => {
    const { mouse } = state;
    
    // --- نور ---
    const x = (mouse.x * viewport.width) / 2
    const y = (mouse.y * viewport.height) / 2
    
    if (lightRef.current) {
      // نور دقیقا روی موس حرکت می‌کند
      lightRef.current.position.set(x, y, 2)
    }

    // --- دافعه ---
    if (meshRef.current) {
      // محاسبه موقعیت نسبی موس نسبت به موقعیت ثابت آبجکت
      // چون x و y آبجکت شما 0 است، فرمول ساده می‌شود اما برای اطمینان کامل می‌نویسیم:
      const relativeMouseX = x - TRANSFORM.position[0]
      const relativeMouseY = y - TRANSFORM.position[1]
      const distance = Math.sqrt(relativeMouseX**2 + relativeMouseY**2)
      
      let targetPos = new THREE.Vector3(0, 0, 0)

      if (distance < CONFIG.repulsionRadius) {
        const dirX = -relativeMouseX
        const dirY = -relativeMouseY
        const length = Math.sqrt(dirX**2 + dirY**2)

        if (length > 0) {
            // فرمول شدت دافعه طبق کد شما
            const intensity = (4 - distance / CONFIG.repulsionRadius) * CONFIG.repulsionForce
            targetPos.set(
                (dirX / length) * intensity, 
                (dirY / length) * intensity, 
                0
            )
        }
      }

      // حرکت نرم برای دافعه
      meshRef.current.position.lerp(targetPos, 0.05)
      
      // چرخش آرام و همیشگی انیمیشن
      meshRef.current.rotation.x += 0.004
      meshRef.current.rotation.y += 0.005
    }
  })

  return (
    // اعمال مقادیر فیکس شده به گروه اصلی
    <group 
      position={TRANSFORM.position} 
      rotation={TRANSFORM.rotation} 
      scale={TRANSFORM.scale}
    >
      
      <pointLight 
        ref={lightRef} 
        distance={5} 
        decay={4} 
        intensity={6} 
        color="#ffffff" 
      />

      <group ref={meshRef}>
        <mesh 
          onPointerOver={() => setHover(true)}
          onPointerOut={() => setHover(false)}
        >
          <icosahedronGeometry args={[1.6, 15]} />
          <MeshDistortMaterial
            color={CONFIG.color}
            wireframe={true}
            transparent={true}
            opacity={0.3}
            speed={CONFIG.speed}
            distort={CONFIG.distort}
            radius={1}
          />
        </mesh>
      </group>
    </group>
  )
}

function App() {
  return (
    <div style={{ width: '100vw', height: '100vh', background: '#d8d7d7', position: 'relative', cursor: 'crosshair' }}>
      
      {/* بخش متن */}
      <div style={{
        position: 'absolute',
        top: '80%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        textAlign: 'center',
        zIndex: 1,
        pointerEvents: 'none',
        width: '100%'
      }}>
        <h1 style={{ color: '#535353ff', fontSize: '0.8rem', letterSpacing: '5px', margin: 0, fontWeight: '500' }}>
          CRAFTING THE EXPERIENCE
        </h1>
        <p style={{ color: '#535353ff', fontSize: '0.55rem', letterSpacing: '3.3px', marginTop: '10px' }}>
          A NEW DIGITAL SPACE IS UNDER DESIGN
        </p>
      </div>

      <Canvas camera={{ position: [0, 0, 6], fov: 45 }}>
        <ambientLight intensity={0.5} />
        <Environment preset="warehouse" />

        <Float speed={1.5} rotationIntensity={0.2} floatIntensity={1}>
          <InteractiveShape />
        </Float>

        <OrbitControls enableZoom={false} enablePan={false} enableRotate={false} />
      </Canvas>
    </div>
  )
}

export default App