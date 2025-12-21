import React, { useRef } from 'react'
import { useFrame, useThree, extend } from '@react-three/fiber'
import { shaderMaterial } from '@react-three/drei'
import * as THREE from 'three'

const PortalMaterial = shaderMaterial(
  {
    uTime: 0,
    uColor: new THREE.Color('#e7e6e6ff'), 
    uMouse: new THREE.Vector2(0, 0),
    uProgress: 0,
    uResolution: new THREE.Vector2(1, 1)
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
    uniform vec3 uColor;
    uniform vec2 uMouse;
    uniform float uProgress;
    uniform vec2 uResolution;
    varying vec2 vUv;

    vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
    float snoise(vec2 v){
      const vec4 C = vec4(0.211324865405187, 0.366025403784439,
               -0.577350269189626, 0.024390243902439);
      vec2 i  = floor(v + dot(v, C.yy) );
      vec2 x0 = v - i + dot(i, C.xx);
      vec2 i1;
      i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
      vec4 x12 = x0.xyxy + C.xxzz;
      x12.xy -= i1;
      i = mod(i, 289.0);
      vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
      + i.x + vec3(0.0, i1.x, 1.0 ));
      vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
      m = m*m ;
      m = m*m ;
      vec3 x = 2.0 * fract(p * C.www) - 1.0;
      vec3 h = abs(x) - 0.5;
      vec3 ox = floor(x + 0.5);
      vec3 a0 = x - ox;
      m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
      vec3 g;
      g.x  = a0.x  * x0.x  + h.x  * x0.y;
      g.yz = a0.yz * x12.xz + h.yz * x12.yw;
      return 130.0 * dot(m, g);
    }

    void main() {
      vec2 st = vUv;
      float aspect = uResolution.x / uResolution.y;
      st.x *= aspect;
      vec2 mouse = uMouse;
      mouse.x *= aspect;

      float dist = distance(st, mouse);
      
      // ۱. نویز ظریف‌تر (ضریب ۰.۰۳) برای جلوگیری از پخش شدن زیاد در مرکز
      float noise = snoise(st * 20.0 + uTime * 3.0) * 0.03; 
      
      // ۲. شعاع بر اساس پیشرفت (Progress)
      float radius = uProgress * 1.0;

      // ۳. لبه تیزتر (۰.۰۵ بجای ۰.۲) برای کوچک کردن نقطه شروع
      float alpha = 1.0 - smoothstep(radius, radius + 0.05, dist + noise);

      gl_FragColor = vec4(uColor, alpha);
    }
  `
)

extend({ PortalMaterial })

export default function TransitionEffect({ isHolding, mousePos, onComplete }) {
  const ref = useRef()
  const { viewport, size } = useThree()
  const progress = useRef(0)
  const triggered = useRef(false) // برای جلوگیری از اجرای چندباره onComplete

  useFrame((state, delta) => {
    if (!ref.current) return

    ref.current.uTime = state.clock.elapsedTime
    ref.current.uResolution = new THREE.Vector2(size.width, size.height)
    ref.current.uMouse = new THREE.Vector2(mousePos.x, 1 - mousePos.y)

    // انیمیشن نرم پر شدن و خالی شدن
    if (isHolding) {
      progress.current += delta * 0.4
    } else {
      progress.current -= delta * 2.0
      triggered.current = false // ریست کردن وضعیت وقتی دکمه رها می‌شود
    }

    // محدود کردن مقدار بین ۰ و ۱.۵
    progress.current = Math.max(0, Math.min(1.5, progress.current))
    ref.current.uProgress = progress.current

    // شرط انتقال به صفحه بعد
    if (progress.current >= 1.2 && isHolding && !triggered.current) {
      triggered.current = true
      if (onComplete) onComplete()
    }
  })

  return (
    <mesh renderOrder={1000} position={[0, 0, 0]}>
      <planeGeometry args={[viewport.width, viewport.height]} />
      <portalMaterial 
        ref={ref} 
        transparent={true} 
        depthTest={false} 
      /> 
    </mesh>
  )
}