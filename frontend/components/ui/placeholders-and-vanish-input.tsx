"use client";

import { AnimatePresence, motion } from "motion/react";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { cn } from "@/lib/utils";

export function PlaceholdersAndVanishInput({
  placeholders,
  onChange,
  onSubmit,
  onSubmitValue,
  disabled = false,
}: {
  placeholders: string[];
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onSubmit?: (e: React.FormEvent<HTMLFormElement>) => void | Promise<void>;
  // optional convenient handler that receives the sanitized string value
  onSubmitValue?: (value: string) => void | Promise<void>;
  disabled?: boolean;
}) {
  const [currentPlaceholder, setCurrentPlaceholder] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // rotate placeholder
  useEffect(() => {
    const start = () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = setInterval(() => {
        setCurrentPlaceholder((p) => (p + 1) % placeholders.length);
      }, 3000);
    };
    start();
    const onVis = () => {
      if (document.visibilityState === "visible") start();
      else if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [placeholders.length]);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const newDataRef = useRef<any[]>([]);
  const animationIdRef = useRef<number | null>(null);

  const [value, setValue] = useState("");
  const [animating, setAnimating] = useState(false);
  const submittedRef = useRef(false);
  const framesRef = useRef(0);

  const MIN_HEIGHT = 48;

  // sanitize user input before sending to external handlers or storing
  const sanitizeInput = (raw: string) => {
    let s = (raw || "").trim();
    // remove zero-width spaces
    s = s.replace(/\u200B/g, "");
    // remove script tags entirely
    s = s.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "");
    // strip disallowed control characters except newline and tab
    s = s.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");
    // cap length to avoid extremely large submissions
    const MAX = 5000;
    if (s.length > MAX) s = s.slice(0, MAX);
    // escape HTML-sensitive characters to make later rendering safe
    s = s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    return s;
  };

  /**
   * drawAndSample:
   * - draws text into device backing store and samples pixels
   * - forces particle color to white in dark theme, black in light theme
   */
  const drawAndSample = useCallback(() => {
    const ta = inputRef.current;
    const canvas = canvasRef.current;
    if (!ta || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // CSS size of textarea
    const taRect = ta.getBoundingClientRect();
    const parentRect = (
      canvas.parentElement || document.body
    ).getBoundingClientRect();
    const cssW = Math.max(1, Math.floor(taRect.width));
    const cssH = Math.max(1, Math.floor(taRect.height));

    // DPR
    const dprRaw =
      typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
    const dpr = Math.min(dprRaw, 2);

    // position canvas overlay in CSS px
    const left = taRect.left - parentRect.left;
    const top = taRect.top - parentRect.top;
    Object.assign(canvas.style, {
      position: "absolute",
      left: `${left}px`,
      top: `${top}px`,
      width: `${cssW}px`,
      height: `${cssH}px`,
      zIndex: "9999",
      pointerEvents: "none",
      transition: "opacity 450ms ease",
    });

    // backing store in device px
    const backingW = Math.max(1, Math.floor(cssW * dpr));
    const backingH = Math.max(1, Math.floor(cssH * dpr));
    canvas.width = backingW;
    canvas.height = backingH;

    // reset and clear
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, backingW, backingH);

    // draw text scaled to device px (fontSize * dpr)
    const computed = getComputedStyle(ta);
    const fontSize = parseFloat(computed.fontSize || "14") || 14;
    const fontFamily = computed.fontFamily || "Inter, system-ui, sans-serif";
    ctx.font = `${fontSize * dpr}px ${fontFamily}`;
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = "rgba(0,0,0,1)";

    // padding and lineHeight (CSS -> device px)
    const padL = (parseFloat(computed.paddingLeft || "0") || 16) * dpr;
    const padT = (parseFloat(computed.paddingTop || "0") || 8) * dpr;
    const lineHeightCss =
      computed.lineHeight && computed.lineHeight !== "normal"
        ? parseFloat(computed.lineHeight as string)
        : fontSize * 1.2;
    const lineHeight = lineHeightCss * dpr;

    // draw each line at device px positions
    const lines = value.split("\n");
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      let yDevice: number;
      if (ta.dataset.mode === "single") {
        const centerCss = cssH / 2;
        const metrics = ctx.measureText(line || " ");
        const ascent = metrics.actualBoundingBoxAscent || fontSize * 0.8 * dpr;
        const descent =
          metrics.actualBoundingBoxDescent || fontSize * 0.2 * dpr;
        yDevice = centerCss * dpr + (ascent - descent) / 2;
      } else {
        yDevice =
          padT + (i + 1) * lineHeight - (lineHeight - fontSize * dpr) / 2;
      }
      ctx.fillText(line, padL, yDevice);
    }

    // sample device-pixel image data
    const img = ctx.getImageData(0, 0, backingW, backingH);
    const data = img.data;
    const step = Math.max(1, Math.floor(2 * dpr)); // sampling density
    const alphaThreshold = 16;

    // detect theme: prefer html.dark class, else prefers-color-scheme
    const isDark =
      (typeof document !== "undefined" &&
        document.documentElement.classList.contains("dark")) ||
      (typeof window !== "undefined" &&
        window.matchMedia &&
        window.matchMedia("(prefers-color-scheme: dark)").matches);

    const targetColor = isDark
      ? { r: 255, g: 255, b: 255 }
      : { r: 0, g: 0, b: 0 };

    const particles: any[] = [];
    for (let y = 0; y < backingH; y += step) {
      for (let x = 0; x < backingW; x += step) {
        const idx = (y * backingW + x) * 4;
        const a = data[idx + 3];
        if (a > alphaThreshold) {
          // preserve alpha for softer edges but force color to targetColor
          const alpha = a / 255;
          // increase life and reduce decay for noticeably longer animation
          particles.push({
            x: x + (Math.random() - 0.5) * step,
            y: y + (Math.random() - 0.5) * step,
            vx: (Math.random() - 0.5) * 0.42, // slower velocities for longer visible duration
            vy: (Math.random() - 0.5) * 0.42 - 0.06,
            life: 2.8 + Math.random() * 1.6, // longer life
            decay: 0.002 + Math.random() * 0.006, // smaller decay => slower fade
            size: Math.max(1, Math.round(step * (0.6 + Math.random() * 0.9))),
            color: `rgba(${targetColor.r},${targetColor.g},${targetColor.b},${alpha})`,
          });
        }
      }
    }

    newDataRef.current = particles;
  }, [value]);

  useEffect(() => {
    drawAndSample();
  }, [value, drawAndSample]);

  // autosize textarea
  const adjustTextareaHeight = () => {
    const ta = inputRef.current;
    if (!ta) return;
    ta.style.whiteSpace = "pre-wrap";
    ta.style.wordBreak = "break-word";
    ta.style.overflowY = "hidden";
    ta.style.height = "auto";
    const target = Math.max(MIN_HEIGHT, ta.scrollHeight);
    ta.style.height = `${target}px`;
    if (target > MIN_HEIGHT + 2 || ta.value.includes("\n"))
      ta.dataset.mode = "multiline";
    else ta.dataset.mode = "single";
  };

  useLayoutEffect(() => {
    const ta = inputRef.current;
    if (ta) {
      ta.style.height = `${MIN_HEIGHT}px`;
      ta.style.lineHeight = `${MIN_HEIGHT}px`;
      ta.style.whiteSpace = "nowrap";
      ta.style.overflowX = "auto";
      ta.style.overflowY = "hidden";
      ta.dataset.mode = "single";
    }
    requestAnimationFrame(adjustTextareaHeight);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    requestAnimationFrame(adjustTextareaHeight);
  }, [value]);

  // animate particles (clears whole canvas each frame)
  const animateParticles = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      setAnimating(false);
      submittedRef.current = false;
      return;
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      setAnimating(false);
      submittedRef.current = false;
      return;
    }

    framesRef.current = 0;

    const loop = () => {
      animationIdRef.current = requestAnimationFrame(() => {
        framesRef.current++;
        const w = canvas.width;
        const h = canvas.height;
        ctx.clearRect(0, 0, w, h);

        const next: any[] = [];
        for (let i = 0; i < newDataRef.current.length; i++) {
          const p = newDataRef.current[i];
          // update
          p.x += p.vx;
          p.y += p.vy;
          // small gravity/jitter (reduced to slow down movement)
          p.vy += 0.008 * (Math.random() - 0.08);
          p.vx *= 0.992;
          p.vy *= 0.992;
          p.life -= p.decay;

          if (p.life > 0) {
            next.push(p);
            ctx.globalAlpha = Math.max(0, p.life);
            ctx.fillStyle = p.color;
            ctx.fillRect(
              Math.round(p.x),
              Math.round(p.y),
              Math.max(1, p.size),
              Math.max(1, p.size)
            );
          }
        }

        ctx.globalAlpha = 1;
        newDataRef.current = next;

        // stop conditions: allow longer duration because decay is smaller
        if (next.length === 0 || framesRef.current > 12000) {
          if (animationIdRef.current)
            cancelAnimationFrame(animationIdRef.current);
          animationIdRef.current = null;
          newDataRef.current = [];
          setValue("");
          setAnimating(false);
          submittedRef.current = false;
          if (canvas) canvas.style.opacity = "0";
          return;
        }
        loop();
      });
    };

    if (canvas) canvas.style.opacity = "1";
    loop();
  }, []);

  // vanish on submit
  const vanishAndSubmit = () => {
    setAnimating(true);
    // snapshot + sample
    drawAndSample();

    const val = (inputRef.current?.value || "").trim();
    if (val.length > 0) {
      // ensure textarea becomes text-transparent visually before frames
      requestAnimationFrame(() => {
        animateParticles();
      });
    } else {
      setAnimating(false);
      submittedRef.current = false;
      setValue("");
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (submittedRef.current || disabled) return;
    submittedRef.current = true;
    // call legacy onSubmit synchronously (event is a pooled synthetic event)
    onSubmit && onSubmit(e);

    // capture and sanitize value for async background submission
    const raw = (inputRef.current?.value || "").toString();
    const sanitized = sanitizeInput(raw);

    // run optional value-based submit in background (non-blocking)
    if (onSubmitValue) {
      // fire-and-forget so animation isn't blocked
      void Promise.resolve().then(() => onSubmitValue(sanitized));
    }

    // start visual vanish/particle animation immediately
    vanishAndSubmit();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (
      e.key === "Enter" &&
      !e.shiftKey &&
      !animating &&
      !disabled &&
      !submittedRef.current
    ) {
      e.preventDefault();
      inputRef.current?.form?.requestSubmit?.();
    }
  };

  // cleanup RAF
  useEffect(() => {
    return () => {
      if (animationIdRef.current) cancelAnimationFrame(animationIdRef.current);
    };
  }, []);

  const isEmpty = value.trim().length === 0;

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        "relative w-full max-w-xl mx-auto overflow-hidden transition duration-200",
        "bg-white dark:bg-zinc-800",
        value ? "bg-gray-50" : "",
        "rounded-lg",
        "flex items-center",
        "shadow-[0px_2px_3px_-1px_rgba(0,0,0,0.08)]"
      )}
      style={{ minHeight: `${MIN_HEIGHT}px`, boxSizing: "border-box" }}
    >
      <canvas
        ref={canvasRef}
        aria-hidden
        style={{
          position: "absolute",
          inset: "0px",
          pointerEvents: "none",
          zIndex: 9999,
          opacity: animating ? 1 : 0,
          transition: "opacity 140ms linear",
        }}
      />

      <textarea
        ref={inputRef}
        value={value}
        onChange={(e) => {
          if (!animating && !disabled) {
            setValue(e.target.value);
            onChange && onChange(e);
            requestAnimationFrame(adjustTextareaHeight);
          }
        }}
        onKeyDown={handleKeyDown}
        rows={1}
        spellCheck={false}
        disabled={disabled}
        wrap="soft"
        className={cn(
          "w-full resize-none border-none bg-transparent text-sm sm:text-base",
          "focus:outline-none focus:ring-0 pl-4 pr-12",
          isEmpty ? "py-0" : "py-3",
          animating && "text-transparent",
          disabled && "opacity-50 cursor-not-allowed",
          "dark:text-white text-black"
        )}
        style={
          isEmpty
            ? {
                height: `${MIN_HEIGHT}px`,
                lineHeight: `${MIN_HEIGHT}px`,
                whiteSpace: "nowrap",
                overflowX: "hidden",
                overflowY: "hidden",
                WebkitOverflowScrolling: "touch",
                boxSizing: "border-box",
              }
            : {
                minHeight: `${MIN_HEIGHT}px`,
                lineHeight: "1.4",
                whiteSpace: "pre-wrap",
                overflowWrap: "anywhere",
                wordBreak: "break-word",
                boxSizing: "border-box",
              }
        }
      />

      <button
        disabled={!value || disabled}
        type="submit"
        aria-label="Submit"
        className={cn(
          "absolute right-3 top-1/2 -translate-y-1/2 z-50 flex items-center justify-center",
          "h-9 w-9 rounded-full transition duration-200",
          "bg-black dark:bg-zinc-900 text-white",
          "disabled:opacity-50 disabled:cursor-not-allowed"
        )}
      >
        <motion.svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-4 w-4"
        >
          <path stroke="none" d="M0 0h24v24H0z" fill="none" />
          <motion.path
            d="M5 12l14 0"
            initial={{
              strokeDasharray: "50%",
              strokeDashoffset: "50%",
            }}
            animate={{
              strokeDashoffset: value ? 0 : "50%",
            }}
            transition={{
              duration: 0.6,
              ease: "linear",
            }}
          />
          <path d="M13 18l6 -6" />
          <path d="M13 6l6 6" />
        </motion.svg>
      </button>

      <AnimatePresence mode="wait">
        {!value && (
          <motion.div
            initial={{ y: 0, opacity: 0 }}
            key={`current-placeholder-${currentPlaceholder}`}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -10, opacity: 0 }}
            transition={{ duration: 0.45, ease: "linear" }}
            aria-hidden
            className={cn(
              "absolute left-4 text-sm sm:text-base font-normal",
              "text-neutral-500 dark:text-zinc-500 overflow-hidden text-ellipsis whitespace-nowrap pointer-events-none"
            )}
          >
            {placeholders[currentPlaceholder]}
          </motion.div>
        )}
      </AnimatePresence>
    </form>
  );
}
