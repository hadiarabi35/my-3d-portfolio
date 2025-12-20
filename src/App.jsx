import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, Float, MeshDistortMaterial, Environment } from '@react-three/drei'
import { useRef, useState, useEffect } from 'react'
import * as THREE from 'three'

// تنظیمات
const CONFIG = {
  color: "#a0a0a0",
  distort: 0.5,
  speed: 3,
  repulsionRadius: 5,
  repulsionForce: 0.8,
  gyroSensitivity: 0.15, // حساسیت سنسور گوشی (هر چی کمتر، حرکت کمتر)
}

const TRANSFORM = {
  position: [0, 0, -57],
  rotation: [0, 0, 2.5],
  scale: 20
}

function InteractiveShape({ isMobile, gyroData }) {
  const meshRef = useRef()
  const lightRef = useRef()
  const { viewport } = useThree()
  
  // برای موبایل: ذخیره پوزیشن اولیه برای محاسبه انحراف
  const initialMobilePos = useRef(new THREE.Vector3(0, 0, 0))

  useFrame((state) => {
    // اگر رفرنس‌ها لود نشده بودند، کاری نکن
    if (!meshRef.current || !lightRef.current) return

    let targetPos = new THREE.Vector3(0, 0, 0)

    // ==========================================
    // سناریوی ۱: موبایل (استفاده از ژیروسکوپ)
    // ==========================================
    if (isMobile) {
      // استفاده از داده‌های سنسور که از پرپس (props) میاد
      // gamma: چپ و راست (-90 تا 90)
      // beta: بالا و پایین (-180 تا 180)
      
      if (gyroData.current) {
        // محاسبه حرکت بر اساس تکان دادن گوشی
        const xMove = gyroData.current.gamma * CONFIG.gyroSensitivity
        const yMove = (gyroData.current.beta - 45) * CONFIG.gyroSensitivity // -45 یعنی گوشی معمولا ۴۵ درجه تو دست گرفته میشه

        targetPos.set(xMove, yMove, 0)
        
        // نور هم با گوشی کمی جابجا شود
        lightRef.current.position.lerp(new THREE.Vector3(xMove * 2, yMove * 2, 5), 0.1)
      }
      
      // سرعت حرکت نرم‌تر برای موبایل
      meshRef.current.position.lerp(targetPos, 0.05)

    } 
    // ==========================================
    // سناریوی ۲: دسکتاپ (موس و دافعه)
    // ==========================================
    else {
      const { mouse } = state
      const x = (mouse.x * viewport.width) / 2
      const y = (mouse.y * viewport.height) / 2
      
      // نور دنبال موس
      lightRef.current.position.set(x, y, 2)

      // محاسبه دافعه
      const relativeMouseX = x - TRANSFORM.position[0]
      const relativeMouseY = y - TRANSFORM.position[1]
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
      // اعمال حرکت
      meshRef.current.position.lerp(targetPos, 0.05)
    }

    // چرخش همیشگی (مشترک بین موبایل و دسکتاپ)
    meshRef.current.rotation.x += 0.004
    meshRef.current.rotation.y += 0.005
  })

  return (
    <group 
      position={TRANSFORM.position} 
      rotation={TRANSFORM.rotation} 
      scale={TRANSFORM.scale}
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
    // تشخیص اولیه موبایل
    const checkMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
    setIsMobile(checkMobile)

    // تابع ذخیره ایونت‌ها
    const handleOrientation = (event) => {
      gyroData.current = {
        gamma: event.gamma || 0, // چپ/راست
        beta: event.beta || 0    // بالا/پایین
      }
    }

    if (checkMobile && permissionGranted) {
      window.addEventListener('deviceorientation', handleOrientation)
    }

    return () => {
      window.removeEventListener('deviceorientation', handleOrientation)
    }
  }, [permissionGranted])

  // تابع درخواست مجوز (مخصوص iOS 13+)
  const requestAccess = () => {
    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
      DeviceOrientationEvent.requestPermission()
        .then((response) => {
          if (response === 'granted') {
            setPermissionGranted(true)
          }
        })
        .catch(console.error)
    } else {
      // برای اندروید و iOS های قدیمی
      setPermissionGranted(true)
    }
  }

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#d8d7d7', position: 'relative', overflow: 'hidden' }}>
      
      {/* دکمه شروع (فقط برای موبایل نمایش داده می‌شود) */}
      {isMobile && !permissionGranted && (
        <div style={{
          position: 'absolute', zIndex: 10, top: 0, left: 0, width: '100%', height: '100%',
          background: 'rgba(216, 215, 215, 0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <button 
            onClick={requestAccess}
            style={{
              padding: '15px 30px', background: '#333', color: '#fff', border: 'none',
              fontSize: '1rem', letterSpacing: '2px', cursor: 'pointer', borderRadius: '5px'
            }}
          >
            ENTER EXPERIENCE
          </button>
        </div>
      )}

      {/* متن */}
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
          {/* ارسال وضعیت موبایل و داده‌های سنسور به کامپوننت سه بعدی */}
          <InteractiveShape isMobile={isMobile} gyroData={gyroData} />
        </Float>

        {/* غیرفعال کردن کامل کنترل‌های لمسی */}
        <OrbitControls enabled={false} />
      </Canvas>
    </div>
  )
}

export default App