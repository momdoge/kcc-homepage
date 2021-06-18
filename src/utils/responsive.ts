import React from 'react'
import { useEffect } from 'react'
import { isMobile as mobile, isIPad13 } from 'react-device-detect'
export function useResponsive() {
  const MobileWidth = 768
  const [isMobile, setIsModile] = React.useState(false)
  const calc = () => {
    const width = document.body.clientWidth ?? document.documentElement.clientWidth
    if (width <= MobileWidth) {
      setIsModile(true)
    } else {
      setIsModile(false)
    }
  }
  useEffect(() => {
    calc()
    window.addEventListener('resize', calc)
    return () => {
      window.removeEventListener('resize', calc)
    }
  }, [])

  return { isMobile: isMobile || mobile || isIPad13 }
}
