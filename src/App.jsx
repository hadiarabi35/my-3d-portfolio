import Scene from './Scene' 
import React, { useState, useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import TransitionEffect from './TransitionEffect'

// --- صفحه دنیای جدید (بعد از ترنزیشن) ---
function NewWorldPage({ onBack }) {
  return (
    <div style={{ 
      width: '100vw', height: '100vh', 
      background: '#000', color: '#fff', 
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      animation: 'fadeIn 1s ease', zIndex: 2000, position: 'relative',
      fontFamily: 'sans-serif'
    }}>
      <h1 style={{ fontSize: '3rem', fontWeight: '200', letterSpacing: '5px' }}>THE VOID</h1>
      <p style={{ marginTop: '20px', opacity: 0.7, fontWeight: '300' }}>Welcome to the next dimension.</p>
      <button onClick={onBack} style={{ 
        marginTop: '40px', padding: '12px 30px', 
        background: 'transparent', border: '1px solid rgba(255,255,255,0.5)', 
        color: 'white', cursor: 'pointer', borderRadius: '50px' 
      }}>
        Return Home
      </button>
    </div>
  )
}

export default function App() {
  const [currentPage, setCurrentPage] = useState('home')
  const [scrollProgress, setScrollProgress] = useState(0)
  const [isHolding, setIsHolding] = useState(false)
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 })
  const mainContainerRef = useRef(null)

  // --- محاسبات رنگ (Color Interpolation) ---
  const interpolateColor = (color1, color2, factor) => {
    const c1 = parseInt(color1.slice(1), 16), c2 = parseInt(color2.slice(1), 16)
    const r = Math.round(((c1 >> 16) & 255) + (((c2 >> 16) & 255) - ((c1 >> 16) & 255)) * factor)
    const g = Math.round(((c1 >> 8) & 255) + (((c2 >> 8) & 255) - ((c1 >> 8) & 255)) * factor)
    const b = Math.round((c1 & 255) + ((c2 & 255) - (c1 & 255)) * factor)
    return `rgb(${r}, ${g}, ${b})`
  }

  // تغییر رنگ‌ها: زمینه از طوسی روشن به سرمه‌ای تیره، متن برعکس
  const backgroundColor = interpolateColor("#f5f5f5", "#050a14", scrollProgress)
  const textColor = interpolateColor("#050a14", "#ffffff", scrollProgress)
  const objectColor = interpolateColor("#ffffffff", "#ebebebff", scrollProgress)
  const glassBorderColor = interpolateColor("#000000", "#ffffff", scrollProgress)

  // --- هندلر اسکرول ---
  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target
    const progress = Math.min(scrollTop / (scrollHeight - clientHeight), 1)
    setScrollProgress(progress)
  }

  // --- هندلرهای موس ---
  const handleDown = (e) => {
    if (currentPage !== 'home') return
    if (e.button !== 0 && e.type === 'mousedown') return 
    setIsHolding(true)
    updateMousePos(e)
  }
  const handleMove = (e) => { if (isHolding) updateMousePos(e) }
  const handleUp = () => setIsHolding(false)
  
  const updateMousePos = (e) => {
    const x = e.clientX || (e.touches && e.touches[0].clientX)
    const y = e.clientY || (e.touches && e.touches[0].clientY)
    if (x !== undefined) setMousePos({ x: x / window.innerWidth, y: y / window.innerHeight })
  }

  const handleTransitionComplete = () => {
    setIsHolding(false)
    setCurrentPage('newWorld')
  }

  if (currentPage === 'newWorld') return <NewWorldPage onBack={() => setCurrentPage('home')} />

  return (
    <div 
      ref={mainContainerRef}
      onMouseDown={handleDown} onMouseUp={handleUp} onMouseMove={handleMove}
      onTouchStart={handleDown} onTouchEnd={handleUp} onTouchMove={handleMove}
      style={{ 
        width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden',
        backgroundColor: backgroundColor, transition: 'background-color 0.1s linear',
        userSelect: 'none', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
      }}
    >
      {/* لایه ۳ بعدی */}
      <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0 }}>
        <Canvas eventSource={mainContainerRef} eventPrefix="client" camera={{ position: [0, 0, 5] }}>
          <Scene objectColor={objectColor} />
          <TransitionEffect isHolding={isHolding} mousePos={mousePos} onComplete={handleTransitionComplete} />
        </Canvas>
      </div>

      {/* لایه محتوا (اسکرول) */}
      <div 
        onScroll={handleScroll}
        style={{
          position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', 
          zIndex: 10, overflowY: 'auto', scrollBehavior: 'smooth', pointerEvents: 'none' 
        }}
      >
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 24px', color: textColor, transition: 'color 0.2s' }}>
          
          {/* SECTION 1: Intro */}
          <section style={{ height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', pointerEvents: 'auto' }}>
            <span style={{ fontSize: '0.8rem', letterSpacing: '4px', opacity: 0.6, marginBottom: '1rem', textTransform: 'uppercase' }}>
              Architecture & Code
            </span>
            <h1 style={{ fontSize: '3.5rem', fontWeight: '300', margin: 0, lineHeight: 1.1, letterSpacing: '-1px' }}>
              Minimal<br/>Perspectives.
            </h1>
            <p style={{ fontSize: '1rem', marginTop: '2rem', maxWidth: '300px', fontWeight: '300', lineHeight: '1.6', opacity: 0.8 }}>
              Exploring the boundaries between digital interfaces and organic motion. Hold click to transcend.
            </p>
          </section>
          
          {/* SECTION 2: Text Content */}
          <section style={{ padding: '100px 0', pointerEvents: 'auto', textAlign: 'justify' }}>
            <h2 style={{ fontSize: '1.8rem', fontWeight: '300', marginBottom: '40px' }}>The Concept</h2>
            <p style={{ fontSize: '1rem', lineHeight: '1.8', fontWeight: '300', marginBottom: '30px', opacity: 0.9 }}>
              Minimalism is not defined by what is not there but by the perfectness of what is left. In our digital journey, we strip away the unnecessary noise to reveal the core structure of interaction. The object you see floating is a representation of this core—fluid, reactive, and ever-changing based on your perspective.
            </p>
            <p style={{ fontSize: '1rem', lineHeight: '1.8', fontWeight: '300', opacity: 0.9 }}>
              We believe in "Invisible Design". Design that works so well you don't even notice it's there. It's about the feeling, the motion, and the subtle feedback loops that create an immersive experience without shouting for attention.
            </p>
            {/* داخل بخش Concept */}
            <div style={{ 
              marginTop: '60px', 
              width: '100%', 
              overflow: 'hidden', 
              borderRadius: '4px', // لبه‌های کمی گرد برای حس مدرن
              backgroundColor: 'rgba(0,0,0,0.05)' // یک رنگ موقت تا عکس لود شود
            }}>
              <img 
                src="https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?auto=format&fit=crop&w=1200&q=80" 
                alt="Minimal Interior"
                style={{
                  width: '100%',
                  height: 'auto',
                  display: 'block',
                  filter: `grayscale(${1 - scrollProgress})`, // نکته آموزشی: با اسکرول عکس رنگی می‌شود!
                  transition: 'filter 0.5s ease'
                }}
              />
            </div>
                        {/* داخل بخش Concept */}
            <div style={{ 
              marginTop: '60px', 
              width: '100%', 
              overflow: 'hidden', 
              borderRadius: '4px', // لبه‌های کمی گرد برای حس مدرن
              backgroundColor: 'rgba(0,0,0,0.05)' // یک رنگ موقت تا عکس لود شود
            }}>
              <img 
                src="https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?auto=format&fit=crop&w=1200&q=80" 
                alt="Minimal Interior"
                style={{
                  width: '100%',
                  height: 'auto',
                  display: 'block',
                  filter: `grayscale(${1 - scrollProgress})`, // نکته آموزشی: با اسکرول عکس رنگی می‌شود!
                  transition: 'filter 0.5s ease'
                }}
              />
            </div>
 {/* داخل بخش Concept */}
            <div style={{ 
              marginTop: '60px', 
              width: '100%', 
              overflow: 'hidden', 
              borderRadius: '4px', // لبه‌های کمی گرد برای حس مدرن
              backgroundColor: 'rgba(0,0,0,0.05)' // یک رنگ موقت تا عکس لود شود
            }}>
              <img 
                src="https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?auto=format&fit=crop&w=1200&q=80" 
                alt="Minimal Interior"
                style={{
                  width: '100%',
                  height: 'auto',
                  display: 'block',
                  filter: `grayscale(${1 - scrollProgress})`, // نکته آموزشی: با اسکرول عکس رنگی می‌شود!
                  transition: 'filter 0.5s ease'
                }}
              />
            </div>
                        {/* داخل بخش Concept */}
            <div style={{ 
              marginTop: '60px', 
              width: '100%', 
              overflow: 'hidden', 
              borderRadius: '4px', // لبه‌های کمی گرد برای حس مدرن
              backgroundColor: 'rgba(0,0,0,0.05)' // یک رنگ موقت تا عکس لود شود
            }}>
              <img 
                src="https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?auto=format&fit=crop&w=1200&q=80" 
                alt="Minimal Interior"
                style={{
                  width: '100%',
                  height: 'auto',
                  display: 'block',
                  filter: `grayscale(${1 - scrollProgress})`, // نکته آموزشی: با اسکرول عکس رنگی می‌شود!
                  transition: 'filter 0.5s ease'
                }}
              />
            </div>

          </section>

          {/* SECTION 3: Services / Details */}
          <section style={{ padding: '100px 0', pointerEvents: 'auto' }}>
             <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: '400', marginBottom: '15px' }}>Fluid Dynamics</h3>
                  <p style={{ fontSize: '0.9rem', opacity: 0.7, lineHeight: '1.6' }}>
                    Implementing real-time physics and WebGL shaders to create organic movement that responds to user input naturally.
                  </p>
                </div>
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: '400', marginBottom: '15px' }}>Interaction</h3>
                  <p style={{ fontSize: '0.9rem', opacity: 0.7, lineHeight: '1.6' }}>
                    Bridging the gap between static content and dynamic storytelling through scroll-driven animations and gesture control.
                  </p>
                </div>
             </div>
          </section>

           {/* SECTION 4: More Text to increase height */}
           <section style={{ padding: '100px 0', pointerEvents: 'auto', textAlign: 'left' }}>
            <h2 style={{ fontSize: '1.8rem', fontWeight: '300', marginBottom: '40px' }}>Methodology</h2>
            <p style={{ fontSize: '1rem', lineHeight: '1.8', fontWeight: '300', opacity: 0.9 }}>
              Our process is iterative and recursive. We start with a raw idea, refine it through code, test the emotional response, and refine again. It's not just about pixels on a screen; it's about how those pixels make you feel. The transition from light to dark represents the depth of focus required to solve complex problems.
            </p>
          </section>

          {/* SECTION 5: Portfolio / Glass Cards (بازگشت المان‌های شیشه‌ای) */}
          <section style={{ minHeight: '100vh', paddingTop: '100px', pointerEvents: 'auto' }}>
             <h2 style={{ fontSize: '2rem', fontWeight: '200', textAlign: 'center', marginBottom: '80px', letterSpacing: '2px' }}>
               SELECTED WORKS
             </h2>
             
             <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '30px' }}>
                <GlassCard title="Project Aether" desc="WebGL Experience" borderColor={glassBorderColor} />
                <GlassCard title="Neon Genesis" desc="UI Architecture" borderColor={glassBorderColor} />
                <GlassCard title="Void Walker" desc="Interactive Art" borderColor={glassBorderColor} />
                <GlassCard title="Mono Scale" desc="Minimal E-comm" borderColor={glassBorderColor} />
             </div>

             {/* دکمه شیشه‌ای بزرگ پایین صفحه */}
             <div style={{ marginTop: '150px', display: 'flex', justifyContent: 'center', paddingBottom: '100px' }}>
                <button style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  backdropFilter: 'blur(10px)',
                  border: `1px solid ${scrollProgress > 0.5 ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'}`, // تغییر رنگ بوردر بر اساس اسکرول
                  padding: '20px 60px',
                  borderRadius: '2px', // گوشه‌های تیز برای مینیمال بودن
                  color: textColor,
                  fontSize: '0.9rem',
                  letterSpacing: '3px',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                   e.target.style.background = 'rgba(255, 255, 255, 0.1)'
                   e.target.style.letterSpacing = '5px'
                }}
                onMouseLeave={(e) => {
                   e.target.style.background = 'rgba(255, 255, 255, 0.05)'
                   e.target.style.letterSpacing = '3px'
                }}
                >
                  Initiate Contact
                </button>
             </div>
          </section>

        </div>
      </div>

      {/* راهنمای کوچک برای نگه داشتن کلیک */}
      <div style={{
        position: 'fixed', bottom: '10px', right: '10px', 
        fontSize: '0.7rem', opacity: isHolding ? 1 : 0.5, 
        letterSpacing: '2px', color: textColor, pointerEvents: 'none',
        transition: 'opacity 0.3s'
      }}>
        {isHolding ? "CHARGING..." : "HOLD CLICK TO TRAVEL"}
      </div>

    </div>
  )
}

// کامپوننت کارت شیشه‌ای
function GlassCard({ title, desc, borderColor }) {
  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.03)', // پس‌زمینه بسیار شفاف
      backdropFilter: 'blur(10px)', // تاری پشت
      border: '1px solid',
      borderColor: borderColor, // رنگ خط دور داینامیک است اما با آلفا کم کنترل میشه در استایل پایین
      borderWidth: '1px',
      padding: '40px 30px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      height: '250px',
      transition: 'transform 0.3s ease',
      cursor: 'pointer',
      borderColor: 'rgba(128, 128, 128, 0.2)' // رنگ ثابت ملایم برای بوردر
    }}
    onMouseEnter={(e) => {
       e.currentTarget.style.transform = 'translateY(-10px)'
       e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'
    }}
    onMouseLeave={(e) => {
       e.currentTarget.style.transform = 'translateY(0)'
       e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'
    }}
    >
      <div style={{ width: '30px', height: '1px', background: 'currentColor', opacity: 0.5 }}></div>
      <div>
        <h3 style={{ fontSize: '1.4rem', fontWeight: '300', marginBottom: '10px' }}>{title}</h3>
        <p style={{ fontSize: '0.8rem', opacity: 0.6, letterSpacing: '1px', textTransform: 'uppercase' }}>{desc}</p>
      </div>
    </div>
  )
}