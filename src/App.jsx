import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, Float, MeshDistortMaterial, Environment } from '@react-three/drei'
import { useRef, useState, useEffect } from 'react'
import * as THREE from 'three'

// تنظیمات رفتار (رنگ، سرعت، حساسیت‌ها)
const CONFIG = {
  color: "#a0a0a0",
  distort: 0.5,
  speed: 3,
  repulsionRadius: 5,
  repulsionForce: 0.8,
  
  // --- تنظیمات اختصاصی موبایل ---
  gyroSensitivity: 0.05,  // حساسیت ژیروسکوپ
  touchSensitivity: 1.5,  // حساسیت تاچ
  maxMobileMove: 3.5,     // دامنه حرکت مجاز در موبایل
}

// تنظیمات مکانی (کاملاً تفکیک شده)
const TRANSFORM = {
  desktop: {
    position: [0, 0, -57],
    rotation: [0, 0, 2.5],
    scale: 20
  },
  mobile: {
    position: [0, 0, 0 ], // پوزیشن مشابه ویندوز (قابل تغییر مستقل)
    rotation: [0, 0, 45], // روتیشن مشابه ویندوز
    scale: 1              // اسکیل متفاوت برای موبایل
  }
}

function InteractiveShape({ isMobile, gyroData }) {
  const meshRef = useRef()
  const lightRef = useRef()
  const { viewport } = useThree()
  
  // انتخاب کانفیگ صحیح بر اساس نوع دستگاه
  const currentTransform = isMobile ? TRANSFORM.mobile : TRANSFORM.desktop

  useFrame((state) => {
    if (!meshRef.current || !lightRef.current) return

    let targetPos = new THREE.Vector3(0, 0, 0)

    // ==========================================
    // حالت موبایل (ژیروسکوپ + تاچ + محدودیت حرکت)
    // ==========================================
    if (isMobile) {
      let finalX = 0
      let finalY = 0

      // 1. اثر ژیروسکوپ
      if (gyroData.current) {
        finalX += gyroData.current.gamma * CONFIG.gyroSensitivity
        finalY += (gyroData.current.beta - 45) * CONFIG.gyroSensitivity
      }

      // 2. اثر تاچ (انگشت)
      finalX += state.pointer.x * CONFIG.touchSensitivity
      finalY += state.pointer.y * CONFIG.touchSensitivity

      // 3. محدود کردن حرکت (Clamp)
      finalX = THREE.MathUtils.clamp(finalX, -CONFIG.maxMobileMove, CONFIG.maxMobileMove)
      finalY = THREE.MathUtils.clamp(finalY, -CONFIG.maxMobileMove, CONFIG.maxMobileMove)

      targetPos.set(finalX, finalY, 0)
      
      // حرکت نور ترکیبی
      lightRef.current.position.lerp(new THREE.Vector3(finalX * 3, finalY * 3, 5), 0.1)
      
      // حرکت نرم جسم
      meshRef.current.position.lerp(targetPos, 0.03)
    } 
    // ==========================================
    // حالت دسکتاپ (موس و دافعه)
    // ==========================================
    else {
      const { mouse } = state
      const x = (mouse.x * viewport.width) / 2
      const y = (mouse.y * viewport.height) / 2
      
      lightRef.current.position.set(x, y, 2)

      // محاسبه فاصله نسبت به پوزیشن دسکتاپ
      const relativeMouseX = x - currentTransform.position[0]
      const relativeMouseY = y - currentTransform.position[1]
      const distance = Math.sqrt(relativeMouseX**2 + relativeMouseY**2)
      
      if (distance < CONFIG.repulsionRadius) {
        const dirX = -relativeMouseX
        const dirY = -relativeMouseY
        const length = Math.sqrt(dirX**2 + dirY**2)

        if (length > 0) {
            const intensity = (4 - distance / CONFIG.repulsionRadius) * CONFIG.repulsionForce
            targetPos.set(
                (dirX / length) * intensity, 
                (dirY / length) * intensity, 
                0
            )
        }
      }
      meshRef.current.position.lerp(targetPos, 0.05)
    }

    // انیمیشن چرخش همیشگی
    meshRef.current.rotation.x += 0.004
    meshRef.current.rotation.y += 0.005
  })

  return (
    <group 
      position={currentTransform.position} 
      rotation={currentTransform.rotation} 
      scale={currentTransform.scale} 
    >
      <pointLight 
        ref={lightRef} 
        distance={10} 
        decay={2} 
        intensity={6} 
        color="#ffffff" 
      />

      <group ref={meshRef}>
        <mesh>
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
  const [isMobile, setIsMobile] = useState(false)
  const [permissionGranted, setPermissionGranted] = useState(false)
  const gyroData = useRef({ gamma: 0, beta: 0 })

  useEffect(() => {
    // تشخیص موبایل
    const checkMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
    setIsMobile(checkMobile)

    const handleOrientation = (event) => {
      gyroData.current = {
        gamma: event.gamma || 0,
        beta: event.beta || 0
      }
    }

    if (checkMobile && permissionGranted) {
      window.addEventListener('deviceorientation', handleOrientation)
    }

    return () => {
      window.removeEventListener('deviceorientation', handleOrientation)
    }
  }, [permissionGranted])

  const requestAccess = () => {
    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
      DeviceOrientationEvent.requestPermission()
        .then((response) => {
          if (response === 'granted') setPermissionGranted(true)
        })
        .catch(console.error)
    } else {
      setPermissionGranted(true)
    }
  }

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#d8d7d7', position: 'relative', overflow: 'hidden' }}>
      
      {/* دکمه ورود مخصوص موبایل */}
      {isMobile && !permissionGranted && (
        <div style={{
          position: 'absolute', zIndex: 10, top: 0, left: 0, width: '100%', height: '100%',
          background: 'rgba(216, 215, 215, 0.95)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
        }}>
           <h2 style={{color: '#333', fontSize: '1rem', marginBottom: '20px', letterSpacing: '2px'}}>IMMERSIVE EXPERIENCE</h2>
          <button 
            onClick={requestAccess}
            style={{
              padding: '15px 40px', background: '#222', color: '#fff', border: 'none',
              fontSize: '0.9rem', letterSpacing: '3px', cursor: 'pointer', borderRadius: '0px'
            }}
          >
            ENTER
          </button>
        </div>
      )}

      {/* متن‌ها */}
      <div style={{
        position: 'absolute', top: '80%', left: '50%', transform: 'translate(-50%, -50%)',
        textAlign: 'center', zIndex: 1, pointerEvents: 'none', width: '100%'
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
          <InteractiveShape isMobile={isMobile} gyroData={gyroData} />
        </Float>

        <OrbitControls enabled={false} />
      </Canvas>
    </div>
  )
}

export default App