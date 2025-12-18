import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Float, MeshDistortMaterial, Environment } from '@react-three/drei'
import { useRef } from 'react'

// تنظیمات ظاهری و حرکتی
const CONFIG = {
  color: "#ffffffff",    // خاکستری تیره ست شده با متن شما
  speed: 2.5,           // سرعت تغییر شکل (زنده بودن)
  distort: 0.5,         // شدت دفرمه شدن فراکتالی
  wireframeOpacity: 0.4 // میزان کمرنگ بودن خطوط برای مینیمال‌تر شدن
}

function LivingWireframe() {
  const meshRef = useRef()

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    if (meshRef.current) {
      // چرخش بسیار آرام برای نمایش بهتر ابعاد وایرفریم
      meshRef.current.rotation.y = t * 0.15
    }
  })

  return (
    <mesh ref={meshRef}>
      {/* استفاده از Icosahedron با جزئیات بالا (Detail 15) 
        باعث می‌شود خطوط مثلثی بسیار ظریف و متراکمی داشته باشیم
      */}
      <icosahedronGeometry args={[1.6, 15]} />
      
      <MeshDistortMaterial
        color={CONFIG.color}
        wireframe={true}           // تبدیل حجم به خطوط وایرفریم
        transparent={true}
        opacity={CONFIG.wireframeOpacity}
        speed={CONFIG.speed}
        distort={CONFIG.distort}
        radius={1}
      />
    </mesh>
  )
}

function App() {
  return (
    <div style={{ width: '100vw', height: '100vh', background: '#d8d7d7ff', position: 'relative' }}>
      
      {/* بخش متن با مشخصات دقیق شما */}
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

      {/* بخش سه‌بعدی */}
      <Canvas camera={{ position: [0, -0, 5], fov: 45 }}>
        <ambientLight intensity={1.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        
        {/* Environment باعث ایجاد انعکاس‌های جزیی روی خطوط می‌شود */}
        <Environment preset="city" />

        <Float speed={2} rotationIntensity={2} floatIntensity={5}>
          <LivingWireframe />
        </Float>

        <OrbitControls 
          enableZoom={true} 
          autoRotate={true} 
          autoRotateSpeed={4} 
          enableDamping={true}
        />
      </Canvas>
    </div>
  )
}

export default App