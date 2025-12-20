import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, Float, MeshDistortMaterial, Environment, Sphere } from '@react-three/drei'
import { useRef, useState } from 'react'
import * as THREE from 'three'

// تنظیمات
const CONFIG = {
  color: "#a0a0a0",
  distort: 0.5,
  speed: 3,
  repulsionRadius: 5, // فاصله‌ای که از اونجا دافعه شروع میشه
  repulsionForce: 0.8,  // قدرت پرت شدن به عقب
}

function InteractiveShape() {
  const meshRef = useRef()
  const solidRef = useRef()
  const lightRef = useRef()
  
  // دسترسی به اطلاعات سایز صفحه برای تبدیل مختصات موس
  const { viewport } = useThree()
  const [hovered, setHover] = useState(false)

  useFrame((state) => {
    const { mouse } = state;
    
    // =============================================
    // 1. محاسبات مربوط به نورِ دنبال‌کننده (Spot Effect)
    // =============================================
    // تبدیل مختصات 2 بعدی موس به مختصات 3 بعدی جهان
    const x = (mouse.x * viewport.width) / 2
    const y = (mouse.y * viewport.height) / 2
    
    if (lightRef.current) {
      // نور دقیقا روی موس حرکت می‌کند اما کمی جلوتر (z=2) تا روی سطح بتابد
      lightRef.current.position.set(x, y, 2)
    }

    // =============================================
    // 2. محاسبات مربوط به دافعه (Repulsion)
    // =============================================
    if (meshRef.current) {
      // موقعیت فعلی موس در فضای سه بعدی
      const mousePos = new THREE.Vector3(x, y, 0)
      // موقعیت فعلی آبجکت (بدون در نظر گرفتن جابجایی دافعه قبلی برای محاسبه دقیق‌تر)
      const objectPos = new THREE.Vector3(0, 0, 0) 
      
      // محاسبه فاصله موس تا مرکز آبجکت
      const distance = mousePos.distanceTo(objectPos)
      
      // بردار هدف برای جابجایی
      let targetPos = new THREE.Vector3(0, 0, 0)

      // اگر موس خیلی نزدیک شد (وارد شعاع خطر شد)
      if (distance < CONFIG.repulsionRadius) {
        // جهت بردار: از موس به سمت آبجکت (یعنی هل دادن به مخالف)
        const direction = objectPos.sub(mousePos).normalize()
        // شدت دافعه بر اساس نزدیکی (هرچی نزدیک‌تر، شدت بیشتر)
        const intensity = (5 - distance / CONFIG.repulsionRadius) * CONFIG.repulsionForce
        
        targetPos = direction.multiplyScalar(intensity)
      }

      // اعمال حرکت نرم (Lerp) برای اینکه پرش ناگهانی نداشته باشد
      meshRef.current.position.lerp(targetPos, 0.05)
      
      // چرخش آرام همیشگی
      meshRef.current.rotation.x += 0.004
      meshRef.current.rotation.y += 0.005
    }
  })

  return (
    <group ref={meshRef}>
      {/* نور نقطه‌ای که فقط اطراف موس را روشن می‌کند */}
      <pointLight 
        ref={lightRef} 
        distance={5} // شعاع نور کم است تا فقط یک نقطه روشن شود
        decay={4} 
        intensity={6} 
        color="#ffffff" 
      />

      {/* لایه دوم: وایرفریم بیرونی */}
      <mesh 
        onPointerOver={() => setHover(true)}
        onPointerOut={() => setHover(false)}
      >
        <icosahedronGeometry args={[1.6, 15]} />
        <MeshDistortMaterial
          color={CONFIG.color}
          wireframe={true}
          transparent={true}
          opacity={0.3} // کمی شفاف‌تر برای دیدن سطح زیرین
          speed={CONFIG.speed}
          distort={CONFIG.distort}
          radius={1}
        />
      </mesh>
    </group>
  )
}

function App() {
  return (
    <div style={{ width: '100vw', height: '100vh', background: '#d8d7d7', position: 'relative', cursor: 'crosshair' }}>
      
      {/* متن */}
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
        {/* نور محیطی کم برای اینکه سایه‌ها عمیق باشند */}
        <ambientLight intensity={0.5} />
        
        {/* این Environment برای انعکاس روی وایرفریم‌ها عالی است */}
        <Environment preset="warehouse" />

        <Float speed={1.5} rotationIntensity={0.2} floatIntensity={1}>
          <InteractiveShape />
        </Float>

        {/* غیرفعال کردن زوم و پن برای تمرکز روی افکت موس */}
        <OrbitControls enableZoom={false} enablePan={false} enableRotate={false} />
      </Canvas>
    </div>
  )
}

export default App