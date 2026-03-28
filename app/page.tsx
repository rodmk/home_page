"use client";

import { useEffect, useRef, useState } from "react";

// Katakana + alphanumeric mix for the matrix rain characters
const CHARS =
  "アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";

// Terminal lines — loop continuously with a hold on the last line before resetting
const LINES = ["initializing...", "loading rodmk.com", "coming soon"];

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [typed, setTyped] = useState("");
  const [showCursor, setShowCursor] = useState(true);

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
    const speedMin = 0.3;
    const speedMax = 1.5; // speedMin + 1.2
    const shimmerMin = 0.6;
    const shimmerMax = 1.0;
    const dropResetThreshold = 0.975; // higher = fewer simultaneous columns
    const brightHeadChance = 0.2;
    const brightHeadColor = "rgb(180, 255, 180)";

    let cols = Math.floor(canvas.width / fontSize);
    const rows = Math.floor(canvas.height / fontSize);
    const drops: number[] = Array.from({ length: cols }, () =>
      Math.floor(Math.random() * rows)
    );
    const speeds: number[] = Array.from(
      { length: cols },
      () => speedMin + Math.random() * (speedMax - speedMin)
    );
    const hasWhiteHead: boolean[] = Array.from(
      { length: cols },
      () => Math.random() < brightHeadChance
    );

    const draw = () => {
      cols = Math.floor(canvas.width / fontSize);
      while (drops.length < cols) drops.push(1);
      while (speeds.length < cols)
        speeds.push(speedMin + Math.random() * (speedMax - speedMin));
      while (hasWhiteHead.length < cols)
        hasWhiteHead.push(Math.random() < brightHeadChance);

      ctx.fillStyle = `rgba(0, 0, 0, ${trailFadeAlpha})`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.font = `${fontSize}px monospace`;

      for (let i = 0; i < drops.length; i++) {
        const char = CHARS[Math.floor(Math.random() * CHARS.length)];
        const progress = (drops[i] * fontSize) / canvas.height;
        const brightness = Math.round(255 * Math.max(0, 1 - progress));
        const shimmer = shimmerMin + Math.random() * (shimmerMax - shimmerMin);
        ctx.fillStyle = hasWhiteHead[i]
          ? brightHeadColor
          : `rgb(0, ${Math.round(brightness * shimmer)}, 0)`;
        ctx.fillText(char, i * fontSize, drops[i] * fontSize);
        if (
          drops[i] * fontSize > canvas.height &&
          Math.random() > dropResetThreshold
        ) {
          drops[i] = 0;
          hasWhiteHead[i] = Math.random() < brightHeadChance;
        }
        drops[i] += speeds[i];
      }
    };

    const tickMs = 120;
    const prerollMs = 5000;
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

      const line = LINES[lineIndex];
      if (charIndex < line.length) {
        current += line[charIndex];
        setTyped(current);
        charIndex++;
        setTimeout(type, 70);
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
          isLast ? 3000 : 700
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
      <div className="relative z-10 flex items-center justify-center h-full">
        {/* Monaco/Menlo for Mac, Consolas for Windows — no web font dependency. Ligatures off to prevent ... → … substitution. Phosphor glow via text-shadow. */}
        <div
          className="text-sm sm:text-base text-green-400 p-8 max-w-lg w-full bg-black/70 backdrop-blur-sm rounded"
          style={{
            fontFamily: "Monaco, Menlo, Consolas, 'Courier New', monospace",
            fontVariantLigatures: "none",
            textShadow: "0 0 4px rgba(0, 255, 65, 0.4)",
          }}
        >
          <div className="mb-6 text-green-500 opacity-60 text-xs tracking-widest uppercase">
            rodmk.com
          </div>
          <div className="mb-1">
            <span className="opacity-50">{">"}</span> {typed}
            <span className={showCursor ? "opacity-100" : "opacity-0"}>█</span>
          </div>
          <div className="mt-6 text-xs text-green-700 hover:text-green-400 transition-colors">
            <a
              href="https://github.com/rodmk"
              target="_blank"
              rel="noopener noreferrer"
            >
              ~/github.com/rodmk
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
