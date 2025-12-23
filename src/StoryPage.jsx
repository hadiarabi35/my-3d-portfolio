// src/StoryPage.jsx
import { useEffect } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'

export default function StoryPage({ onScrollChange }) {
  // گرفتن میزان اسکرول صفحه (بین 0 تا 1)
  const { scrollYProgress } = useScroll()

  // --- محاسبات رنگ ---
  // وقتی اسکرول 0 است (بالا): پس‌زمینه روشن، جسم تیره
  // وقتی اسکرول 1 است (پایین): پس‌زمینه تیره، جسم روشن
  
  // تبدیل اسکرول به رنگ پس‌زمینه (برای HTML)
  const backgroundColor = useTransform(
    scrollYProgress,
    [0, 0.8], // از بالای صفحه تا 80 درصد پایین
    ["#d8d7d7", "#1a1a1a"] // از طوسی روشن به مشکی
  )

  // تبدیل اسکرول به رنگ متن
  const textColor = useTransform(
    scrollYProgress,
    [0, 0.5],
    ["#535353", "#ffffff"] // از نوک‌مدادی به سفید
  )

  // تبدیل اسکرول به رنگ جسم سه بعدی (برعکس پس‌زمینه)
  const objectColor3D = useTransform(
    scrollYProgress,
    [0, 0.8],
    ["#a0a0a0", "#249750ff"] // از طوسی به سبز نئونی (یا هر رنگ روشنی)
  )

  // --- ارسال رنگ به سه بعدی ---
  // هر بار که اسکرول تغییر کرد، رنگ جدید را به App بفرست
  useEffect(() => {
    const unsubscribe = objectColor3D.on("change", (latestColor) => {
      onScrollChange(latestColor)
    })
    return () => unsubscribe()
  }, [objectColor3D, onScrollChange])

  // --- استایل‌های انیمیشنی ---
  // این تگ motion.div مثل div معمولی است اما قابلیت تغییر رنگ دارد
  return (
    <motion.div 
      style={{ 
        backgroundColor, // وصل کردن رنگ متغیر به پس‌زمینه
        minHeight: '100vh', // حداقل ارتفاع
        width: '100%',
        paddingTop: '100px', // فاصله از بالا
        position: 'relative',
        zIndex: 10
      }}
    >
      {/* محتوای طولانی برای ایجاد اسکرول */}
      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
        
        {/* بخش اول */}
        <Section text="SCROLL TO EXPLORE" color={textColor} />
        
        {/* بخش دوم */}
        <Section text="THE ATMOSPHERE IS CHANGING" color={textColor} />

        {/* بخش سوم */}
        <Section text="DARKNESS FALLS" color={textColor} />

        {/* بخش چهارم */}
        <Section text="BUT THE LIGHT EMERGES" color={textColor} />

      </div>
      
      {/* فضای خالی برای اسکرول بیشتر */}
      <div style={{ height: '50vh' }}></div>
    </motion.div>
  )
}

// کامپوننت کمکی برای نمایش متن‌ها با افکت
function Section({ text, color }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 50 }} // حالت اولیه: پنهان و پایین
      whileInView={{ opacity: 1, y: 0 }} // وقتی دیده شد: آشکار و بالا بیاد
      transition={{ duration: 0.8 }}
      viewport={{ margin: "-20%" }} // وقتی 20 درصد وارد صفحه شد اجرا بشه
      style={{ height: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      <motion.h1 style={{ color, fontSize: '2rem', textAlign: 'center', letterSpacing: '5px' }}>
        {text}
      </motion.h1>
    </motion.div>
  )
}