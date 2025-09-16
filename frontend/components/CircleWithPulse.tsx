import React, { memo, useMemo, useEffect, useState, useRef } from "react"
import { PulsingBorder } from "@paper-design/shaders-react"

const DEFAULT_COLORS = ["#5800FF", "#BEECFF", "#E77EDC", "#FF4C3E"]

type Quality = "low" | "medium" | "high"

type Props = {
  spotsPerColor?: number
  className?: string
  style?: React.CSSProperties
  // size in px (number) or any CSS unit string (e.g. '50%', '420px')
  size?: number | string
  // optional override: 'low' | 'medium' | 'high'
  quality?: Quality
}

function PulsingBorderShader({
  spotsPerColor = 5,
  className,
  style,
  size = 420,
  quality,
}: Props) {
  const [detectedQuality, setDetectedQuality] = useState<Quality | null>(null)
  const rafCountRef = useRef(0)
  const rafStartRef = useRef<number | null>(null)

  // detect device capabilities on client and set quality heuristically
  useEffect(() => {
    if (typeof window === "undefined") return

    if (quality) {
      setDetectedQuality(quality)
      return
    }

    const deviceMemory = (navigator as any).deviceMemory || 4
    const hwConcurrency = (navigator as any).hardwareConcurrency || 4
    const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
    const prefersReducedMotion =
      typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches

    if (deviceMemory <= 1.5 || hwConcurrency <= 2 || isMobile || prefersReducedMotion) {
      setDetectedQuality("low")
      return
    }

    // Short requestAnimationFrame probe to estimate fps
    rafCountRef.current = 0
    rafStartRef.current = null
    let rafId: number
    const probe = (t: number) => {
      if (!rafStartRef.current) rafStartRef.current = t
      rafCountRef.current += 1
      const elapsed = t - (rafStartRef.current || 0)
      if (elapsed < 500) {
        rafId = requestAnimationFrame(probe)
        return
      }
      const fps = (rafCountRef.current / elapsed) * 1000
      if (fps < 40) setDetectedQuality("low")
      else if (fps < 60) setDetectedQuality("medium")
      else setDetectedQuality("high")
    }

    try {
      rafId = requestAnimationFrame(probe)
    } catch (e) {
      setDetectedQuality("medium")
    }

    return () => {
      if (rafId) cancelAnimationFrame(rafId)
    }
  }, [quality])

  const finalQuality: Quality = (quality as Quality) || (detectedQuality ?? "medium")

  const preset = useMemo(() => {
    switch (finalQuality) {
      case "low":
        return {
          speed: 1,
          softness: 0.2,
          intensity: 0.6,
          spotSize: 0.08,
          smoke: 0.35,
          smokeSize: 1.2,
          scale: 0.6,
        }
      case "high":
        return {
          speed: 1.6,
          softness: 0.08,
          intensity: 1.1,
          spotSize: 0.12,
          smoke: 0.6,
          smokeSize: 2.2,
          scale: 0.7,
        }
      case "medium":
      default:
        return {
          speed: 1.4,
          softness: 0.1,
          intensity: 0.9,
          spotSize: 0.1,
          smoke: 0.5,
          smokeSize: 1.6,
          scale: 0.65,
        }
    }
  }, [finalQuality])

  const sizeValue = typeof size === "number" ? `${size}px` : size

  const pbProps = useMemo(() => {
    return {
      colors: DEFAULT_COLORS,
      colorBack: "#00000000",
      speed: preset.speed,
      roundness: 1,
      thickness: 0.05,
      softness: preset.softness,
      intensity: preset.intensity,
      // keep spots internal to prevent accidental DOM leakage
      spotSize: preset.spotSize,
      pulse: 0.2,
      smoke: preset.smoke,
      smokeSize: preset.smokeSize,
      scale: preset.scale,
      rotation: 0,
      frame: 9161408.251009725,
      className,
      // Ensure the element is block-level and horizontally centered; allow size override
      style: {
        display: "block",
        marginLeft: "auto",
        marginRight: "auto",
        width: sizeValue,
        height: sizeValue,
        borderRadius: "0px",
        backgroundImage:
          "radial-gradient(circle in oklab, oklab(0% 0 -.0001 / 0%) 25.22%, oklab(30.5% 0.029 -0.184) 43.89%, oklab(0% 0 -.0001 / 0%) 60.04%)",
        ...style,
      },
    } as any
  }, [preset, className, style, sizeValue])

  return <PulsingBorder {...(pbProps as any)} />
}

// Memoize the wrapper so it only re-renders when its explicit props change.
export default memo(PulsingBorderShader)
