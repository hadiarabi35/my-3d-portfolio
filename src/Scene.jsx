import { useFrame, useThree } from '@react-three/fiber'
import { Float, MeshDistortMaterial } from '@react-three/drei'
import { useRef, useEffect } from 'react'
import * as THREE from 'three'

// تنظیمات ظاهری (همان تنظیماتی که دوست داشتی)
const CONFIG = {
  defaultColor: "#383838ff",
  normalDistort: 0.6,
  normalSpeed: 3,
  boilDistort: 2.5,
  boilSpeed: 10,
  roughness: 1,
  metalness: 0.1,
  repulsionRadius: 10,
  repulsionForce: 0.8,
  gyroSensitivity: 0.05,
  touchSensitivity: 1.5,
  maxMobileMove: 3.5,
}

const TRANSFORM = {
  desktop: { position: [0, 0, -57], rotation: [0, 0, 2.5], scale: 30 },
  mobile: { position: [0, 0, 0], rotation: [0, 0, 25], scale: 1.5 }
}

export default function Scene({ objectColor, isHolding }) {
  const meshRef = useRef()
  const lightRef = useRef()
  const materialRef = useRef()
  const { viewport, size } = useThree()
  
  const isMobile = size.width < 768
  const currentTransform = isMobile ? TRANSFORM.mobile : TRANSFORM.desktop
  const gyroData = useRef({ gamma: 0, beta: 0 })

  useEffect(() => {
    const handleOrientation = (e) => { gyroData.current = { gamma: e.gamma || 0, beta: e.beta || 0 } }
    if (isMobile) window.addEventListener('deviceorientation', handleOrientation)
    return () => window.removeEventListener('deviceorientation', handleOrientation)
  }, [isMobile])

  useFrame((state, delta) => {
    if (!meshRef.current || !lightRef.current) return

    let targetPos = new THREE.Vector3(0, 0, 0)
    
    if (isMobile) {
      let finalX = 0, finalY = 0
      if (gyroData.current) {
        finalX += gyroData.current.gamma * CONFIG.gyroSensitivity
        finalY += (gyroData.current.beta - 45) * CONFIG.gyroSensitivity
      }
      finalX += state.pointer.x * CONFIG.touchSensitivity
      finalY += state.pointer.y * CONFIG.touchSensitivity
      finalX = THREE.MathUtils.clamp(finalX, -CONFIG.maxMobileMove, CONFIG.maxMobileMove)
      finalY = THREE.MathUtils.clamp(finalY, -CONFIG.maxMobileMove, CONFIG.maxMobileMove)
      targetPos.set(finalX, finalY, 0)
    } else {
      const x = (state.pointer.x * viewport.width) / 2
      const y = (state.pointer.y * viewport.height) / 2
      lightRef.current.position.set(x, y, 2)

      const relativeMouseX = x - currentTransform.position[0]
      const relativeMouseY = y - currentTransform.position[1]
      const distance = Math.sqrt(relativeMouseX**2 + relativeMouseY**2)
      
      if (distance < CONFIG.repulsionRadius) {
        const dirX = -relativeMouseX
        const dirY = -relativeMouseY
        const length = Math.sqrt(dirX**2 + dirY**2)
        if (length > 0) {
            const intensity = (4 - distance / CONFIG.repulsionRadius) * CONFIG.repulsionForce
            targetPos.set((dirX / length) * intensity, (dirY / length) * intensity, 0)
        }
      }
    }
    if (!isNaN(targetPos.x)) meshRef.current.position.lerp(targetPos, 0.02)

    if (materialRef.current) {
        const targetDistort = isHolding ? CONFIG.boilDistort : CONFIG.normalDistort
        const targetSpeed = isHolding ? CONFIG.boilSpeed : CONFIG.normalSpeed
        materialRef.current.distort = THREE.MathUtils.lerp(materialRef.current.distort, targetDistort, delta * 2)
        materialRef.current.speed = THREE.MathUtils.lerp(materialRef.current.speed, targetSpeed, delta * 2)
    }

    const t = state.clock.getElapsedTime()
    const rotSpeed = isHolding ? 0.5 : 0.15
    meshRef.current.rotation.x = (t * rotSpeed) + Math.sin(t * 0.5) * 0.1
    meshRef.current.rotation.y = (t * rotSpeed) + Math.cos(t * 0.3) * 0.1
  })

  // نکته مهم: اینجا دیگر <Canvas> نداریم، فقط <group> برمی‌گردانیم
  return (
    <group position={currentTransform.position} rotation={currentTransform.rotation} scale={currentTransform.scale}>
      <pointLight ref={lightRef} distance={20} decay={2} intensity={8} color="#4b4b4bff" />
      <ambientLight intensity={0.4} />

      <Float speed={2} rotationIntensity={0.2} floatIntensity={0.5}>
        <group ref={meshRef}>
          <mesh>
            <icosahedronGeometry args={[1.5, 12]} /> 
            <MeshDistortMaterial
              ref={materialRef}
              color={objectColor || CONFIG.defaultColor}
              wireframe={true}
              transparent={true}
              opacity={0.1}
              distort={CONFIG.normalDistort}
              speed={CONFIG.normalSpeed}
              roughness={CONFIG.roughness}
              metalness={CONFIG.metalness}
              radius={1}
            />
          </mesh>
        </group>
      </Float>
    </group>
  )
}