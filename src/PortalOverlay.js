import React, { useRef, useMemo } from 'react'
import { useFrame, useThree, extend } from '@react-three/fiber'
import { shaderMaterial, useTexture } from '@react-three/drei'
import * as THREE from 'three'

// تصویر دنیای جدید (کهکشان)
const IMG_URL = "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?q=80&w=2000&auto=format&fit=crop"

const PortalMaterial = shaderMaterial(
  {
    uTime: 0,
    uTexture: null,
    uMouse: new THREE.Vector2(0, 0),
    uProgress: 0, // 0 = بسته، 1 = باز
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
    uniform sampler2D uTexture;
    uniform vec2 uMouse;
    uniform float uProgress;
    uniform vec2 uResolution;
    varying vec2 vUv;

    // توابع نویز برای جوشش
    vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
    float snoise(vec2 v){
      const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
      vec2 i  = floor(v + dot(v, C.yy) );
      vec2 x0 = v - i + dot(i, C.xx);
      vec2 i1;
      i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
      vec4 x12 = x0.xyxy + C.xxzz;
      x12.xy -= i1;
      i = mod(i, 289.0);
      vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 )) + i.x + vec3(0.0, i1.x, 1.0 ));
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
      
      // نویز جوشان و زنده
      float noise = snoise(st * 10.0 - uTime * 2.0) * 0.1; 
      
      // شعاع باز شدن پورتال
      // ضرب در 2.5 تا مطمئن شویم کل صفحه را می‌گیرد
      float radius = uProgress * 2.5;

      // ایجاد دایره با لبه‌های نرم و جوشان
      float mask = 1.0 - smoothstep(radius, radius + 0.2, dist + noise);

      // تصویر پس‌زمینه
      vec4 texColor = texture2D(uTexture, vUv);

      // اعمال ماسک روی تصویر (فقط داخل دایره دیده شود)
      gl_FragColor = vec4(texColor.rgb, mask);
    }
  `
)

extend({ PortalMaterial })

export default function PortalOverlay({ active, mousePos }) {
  const ref = useRef()
  const { viewport, size } = useThree()
  const texture = useTexture(IMG_URL)
  
  // مقدار پیشرفت انیمیشن (Current Progress)
  const progress = useRef(0)

  useFrame((state, delta) => {
    if (!ref.current) return

    // آپدیت زمان و رزولوشن
    ref.current.uTime = state.clock.elapsedTime
    ref.current.uResolution = new THREE.Vector2(size.width, size.height)
    ref.current.uTexture = texture
    
    // آپدیت پوزیشن موس برای شیدر
    if (mousePos) {
      ref.current.uMouse = new THREE.Vector2(mousePos.x, 1 - mousePos.y)
    }

    // === لاجیک انیمیشن مستقل ===
    // اگر active true بود زیاد شو، اگر false بود کم شو
    const target = active ? 1 : 0
    // سرعت انیمیشن: 0.5 برای باز شدن (حدودا همزمان با 4 ثانیه)، 2.0 برای بسته شدن سریع
    const speed = active ? 0.3 : 2.0 
    
    // حرکت نرم به سمت هدف
    progress.current = THREE.MathUtils.lerp(progress.current, target, delta * speed)
    
    ref.current.uProgress = progress.current
  })

  return (
    // رندر اوردر بالا (999) تا روی همه چیز باشد
    <mesh renderOrder={999} position={[0, 0, 5]}>
      <planeGeometry args={[viewport.width, viewport.height]} />
      <portalMaterial 
        ref={ref} 
        transparent={true} 
        depthTest={false} 
      /> 
    </mesh>
  )
}