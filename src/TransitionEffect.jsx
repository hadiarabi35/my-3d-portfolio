import React, { useRef, useMemo } from 'react'
import { useFrame, useThree, extend } from '@react-three/fiber'
import { shaderMaterial, useTexture } from '@react-three/drei'
import * as THREE from 'three'

const TrailPointMaterial = shaderMaterial(
  {
    uTime: 0,
    uTexture: null,
    uProgress: 0,
    uResolution: new THREE.Vector2(1, 1),
    uMouse: new THREE.Vector2(0.5, 0.5),
    uAlpha: 1.0,
    uRadius: 0.2
  },
  // Vertex Shader
  `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  // Fragment Shader
  `
    uniform float uTime;
    uniform sampler2D uTexture;
    uniform vec2 uMouse;
    uniform float uProgress;
    uniform float uAlpha;
    uniform float uRadius;
    uniform vec2 uResolution;
    varying vec2 vUv;

    float rand(vec2 n) { return fract(sin(dot(n, vec2(12.9898, 4.1414))) * 43758.5453); }
    float noise(vec2 n) {
      const vec2 d = vec2(0.0, 1.0);
      vec2 b = floor(n), f = smoothstep(vec2(0.0), vec2(1.0), fract(n));
      return mix(mix(rand(b), rand(b + d.yx), f.x), mix(rand(b + d.xy), rand(b + d.yy), f.x), f.y);
    }

    void main() {
      // 🎯 اصلاح نسبت تصویر (Object-fit: Cover)
      vec2 s = uResolution;
      vec2 i = vec2(3000.0, 816.0); // ابعاد عکس خود را اینجا تنظیم کنید
      float rs = s.x / s.y;
      float ri = i.x / i.y;
      vec2 newUv = vUv;
      if (rs > ri) {
          newUv.y = vUv.y * (rs / ri) - (rs / ri - 1.0) * 0.5;
      } else {
          newUv.x = vUv.x * (ri / rs) - (ri / rs - 1.0) * 0.5;
      }

      vec2 st = vUv;
      float aspect = uResolution.x / uResolution.y;
      st.x *= aspect;
      vec2 m = uMouse;
      m.x *= aspect;

      float d = distance(st, m);
      float n = noise(st * 10.0 + uTime);
      
      float mask = smoothstep(uRadius + n * 0.1, uRadius * 0.1, d);
      
      vec4 tex = texture2D(uTexture, newUv);
      gl_FragColor = vec4(tex.rgb, mask * uAlpha);
    }
  `
)

extend({ TrailPointMaterial })

export default function TransitionEffect({ isHolding, mousePos, onComplete }) {
  const { viewport, size } = useThree()
  const myPhoto = useTexture('./BG_PT.jpg')
  
  // 🎯 تنظیمات Clamping برای جلوگیری از کشیدگی لبه‌ها
  myPhoto.wrapS = THREE.ClampToEdgeWrapping
  myPhoto.wrapT = THREE.ClampToEdgeWrapping

  const isMobile = size.width < 768 // تشخیص موبایل
  const pointsCount = 60 
  const meshRefs = useRef([])
  const progress = useRef(0)

  const trailData = useMemo(() => 
    Array.from({ length: pointsCount }).map(() => ({
      x: 0, y: 0, age: 0, active: false
    })), [])

  useFrame((state, delta) => {
    // ۱. مدیریت پیشرفت کلی (با حفظ تنظیمات شما + تفکیک موبایل)
    const progressSpeed = isMobile ? 0.2 : 0.5
    if (isHolding) progress.current += delta * progressSpeed
    else progress.current -= delta * 1.0
    progress.current = Math.max(0, Math.min(1.5, progress.current))

    if (progress.current >= 1.2 && onComplete) onComplete()

    // ۲. منطق رد قلمو
    const oldestIdx = trailData.reduce((prev, curr, idx, arr) => 
      curr.age > arr[prev].age ? idx : prev, 0)
    
    trailData[oldestIdx].x = mousePos.x
    trailData[oldestIdx].y = 1 - mousePos.y
    trailData[oldestIdx].age = 0
    trailData[oldestIdx].active = true

    // ۳. آپدیت کردن تمام نقاط
    meshRefs.current.forEach((mesh, i) => {
      if (mesh) {
        const data = trailData[i]
        data.age += delta * 0.5 
        
        const alpha = Math.max(0, 1 - data.age)
        
        // 🎯 تنظیم شعاع و مقیاس (حفظ عدد ۶۵ شما برای دسکتاپ)
        const baseRadius = isMobile ? 0.02 : 0.05
        const scale = isHolding ? 1.5 + progress.current * 65 : 1.0 

        mesh.material.uAlpha = alpha
        mesh.material.uMouse.set(data.x, data.y)
        mesh.material.uTime = state.clock.elapsedTime
        mesh.material.uRadius = baseRadius * scale
        mesh.material.uResolution.set(size.width, size.height)
        mesh.material.uTexture = myPhoto
      }
    })
  })

  return (
    <group renderOrder={1000}>
      {trailData.map((_, i) => (
        <mesh key={i} ref={el => meshRefs.current[i] = el}>
          <planeGeometry args={[viewport.width, viewport.height]} />
          <trailPointMaterial transparent={true} depthTest={false} />
        </mesh>
      ))}
    </group>
  )
}