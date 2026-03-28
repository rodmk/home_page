"use client";

import { useEffect, useRef, useState } from "react";

// Katakana + alphanumeric mix for the matrix rain characters
const CHARS =
  "アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";

const LINES = ["hello, world 👋 "];

// Rainbow hues cycled by clicking anywhere on the terminal card
const RAIN_HUES = [120, 200, 270, 0, 30, 60]; // green, blue, purple, red, orange, yellow

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colorIndexRef = useRef(0);
  const [hue, setHue] = useState(RAIN_HUES[0]);
  const [typed, setTyped] = useState("");
  const [showCursor, setShowCursor] = useState(true);

  const cycleColor = () => {
    colorIndexRef.current = (colorIndexRef.current + 1) % RAIN_HUES.length;
    setHue(RAIN_HUES[colorIndexRef.current]);
  };

  // Matrix rain
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const fontSize = 16;
    const trailFadeAlpha = 0.05; // lower = longer trails
    const speedMin = 0.2;
    const speedMax = 0.8;
    const shimmerMin = 0.6;
    const shimmerMax = 1.0;
    const dropResetThreshold = 0.975; // higher = fewer simultaneous columns
    const brightHeadChance = 0.05;
    const brightHeadLightness = 85; // lightness % for bright head characters

    type Column = {
      drop: number;
      speed: number;
      hasBrightHead: boolean;
      char: string;
      lastRow: number;
    };

    const makeColumn = (rows: number): Column => ({
      drop: Math.floor(Math.random() * rows), // stagger start positions so rain looks mid-flow
      speed: speedMin + Math.random() * (speedMax - speedMin), // vary speed per column so drops feel independent
      hasBrightHead: Math.random() < brightHeadChance, // some columns lead with a bright character for visual variety
      char: CHARS[Math.floor(Math.random() * CHARS.length)], // initial char before first drop
      lastRow: -1, // tracks row for sticky chars
    });

    let cols = Math.floor(canvas.width / fontSize);
    const rows = Math.floor(canvas.height / fontSize);
    const columns: Column[] = Array.from({ length: cols }, () =>
      makeColumn(rows)
    );

    const draw = () => {
      cols = Math.floor(canvas.width / fontSize);
      while (columns.length < cols) columns.push(makeColumn(rows));

      ctx.fillStyle = `rgba(0, 0, 0, ${trailFadeAlpha})`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.font = `${fontSize}px monospace`;

      for (let i = 0; i < columns.length; i++) {
        const col = columns[i];
        const currentRow = Math.floor(col.drop);
        if (currentRow !== col.lastRow) {
          col.char = CHARS[Math.floor(Math.random() * CHARS.length)]; // new char each row so trail reads as distinct characters
          col.lastRow = currentRow;
        }
        const hue = RAIN_HUES[colorIndexRef.current];
        const progress = (col.drop * fontSize) / canvas.height;
        const lightness = Math.max(0, 1 - progress) * 50; // characters dim as they fall (0–50% lightness)
        const shimmer = shimmerMin + Math.random() * (shimmerMax - shimmerMin); // random flicker gives the trail texture
        ctx.fillStyle = col.hasBrightHead
          ? `hsl(${hue}, 100%, ${brightHeadLightness}%)`
          : `hsl(${hue}, 100%, ${(lightness * shimmer).toFixed(1)}%)`;
        ctx.fillText(col.char, i * fontSize, Math.floor(col.drop) * fontSize); // snap to grid to avoid sub-pixel smear
        if (
          col.drop * fontSize > canvas.height &&
          Math.random() > dropResetThreshold
        ) {
          col.drop = 0;
          col.hasBrightHead = Math.random() < brightHeadChance;
        }
        col.drop += col.speed;
      }
    };

    const tickMs = 120;
    const prerollMs = 10000; // simulate past state so rain looks mid-flow on load
    for (let i = 0; i < Math.round(prerollMs / tickMs); i++) draw();

    const interval = setInterval(draw, tickMs);
    return () => {
      clearInterval(interval);
      window.removeEventListener("resize", resize);
    };
  }, []);

  // Typewriter
  useEffect(() => {
    let lineIndex = 0;
    let charIndex = 0;
    let current = "";
    let cancelled = false;

    const type = () => {
      if (cancelled) return;

      const chars = Array.from(LINES[lineIndex]);
      if (charIndex < chars.length) {
        current += chars[charIndex];
        setTyped(current);
        charIndex++;
        setTimeout(type, 80 + Math.random() * 80);
      } else {
        const isLast = lineIndex === LINES.length - 1;
        // Hold cursor at end of line, then cycle to next (or reset if last)
        setTimeout(
          () => {
            if (cancelled) return;
            setTyped("");
            current = "";
            charIndex = 0;
            lineIndex = isLast ? 0 : lineIndex + 1;
            setTimeout(type, 1000);
          },
          isLast ? 5000 : 700
        );
      }
    };

    setTimeout(type, 2000);
    return () => {
      cancelled = true;
    };
  }, []);

  // Blinking cursor
  useEffect(() => {
    const interval = setInterval(() => setShowCursor((v) => !v), 530);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className="relative w-full overflow-hidden bg-black"
      style={{ height: "100dvh" }}
    >
      <canvas ref={canvasRef} className="absolute inset-0" />
      {/* CRT scanline effect */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.4) 2px, rgba(0,0,0,0.4) 4px)",
        }}
      />
      <div className="relative z-10 flex flex-col items-center justify-center h-full gap-4">
        {/* Monaco/Menlo for Mac, Consolas for Windows — no web font dependency. Ligatures off to prevent ... → … substitution. Phosphor glow via text-shadow. */}
        <div
          onClick={cycleColor}
          className="text-sm sm:text-base p-8 max-w-sm w-full bg-black/90 backdrop-blur-sm rounded transition-colors duration-300"
          style={{
            fontFamily: "Monaco, Menlo, Consolas, 'Courier New', monospace",
            fontVariantLigatures: "none",
            color: `hsl(${hue}, 100%, 65%)`,
            borderWidth: 1,
            borderStyle: "solid",
            borderColor: `hsla(${hue}, 100%, 50%, 0.4)`,
            textShadow: `0 0 8px hsla(${hue}, 100%, 50%, 0.7)`,
            boxShadow: `0 0 24px hsla(${hue}, 100%, 50%, 0.15), inset 0 0 24px hsla(${hue}, 100%, 50%, 0.03)`,
            cursor: "pointer",
            userSelect: "none",
          }}
        >
          <div>
            rod {">"} {typed}
            <span className={showCursor ? "opacity-100" : "opacity-0"}>█</span>
          </div>
        </div>
        <div
          className="flex gap-4"
          style={{ color: `hsl(${hue}, 100%, 35%)` }}
        >
          <a
            href="https://github.com/rodmk"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors duration-300 p-2"
            onMouseEnter={(e) => (e.currentTarget.style.color = `hsl(${hue}, 100%, 65%)`)}
            onMouseLeave={(e) => (e.currentTarget.style.color = "")}
            aria-label="GitHub"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
            </svg>
          </a>
          <a
            href="https://linkedin.com/in/rodmk"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors duration-300 p-2"
            onMouseEnter={(e) => (e.currentTarget.style.color = `hsl(${hue}, 100%, 65%)`)}
            onMouseLeave={(e) => (e.currentTarget.style.color = "")}
            aria-label="LinkedIn"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
            </svg>
          </a>
          <button
            onClick={() => {
              window.location.href = `mailto:rod@${window.location.hostname.replace(/^www\./, "")}`;
            }}
            className="transition-colors duration-300 p-2"
            onMouseEnter={(e) => (e.currentTarget.style.color = `hsl(${hue}, 100%, 65%)`)}
            onMouseLeave={(e) => (e.currentTarget.style.color = "")}
            aria-label="Email"
            style={{ background: "none", border: "none", color: "inherit", cursor: "pointer" }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4-8 5-8-5V6l8 5 8-5v2z"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
