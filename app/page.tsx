"use client";

import { useEffect, useRef, useState } from "react";

// Katakana + alphanumeric mix for the matrix rain characters
const CHARS =
  "アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";

const LINES = ["hello, world 👋 "];

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
    const speedMin = 0.2;
    const speedMax = 0.8;
    const shimmerMin = 0.6;
    const shimmerMax = 1.0;
    const dropResetThreshold = 0.975; // higher = fewer simultaneous columns
    const brightHeadChance = 0.2;
    const brightHeadColor = "rgb(180, 255, 180)";

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
        const progress = (col.drop * fontSize) / canvas.height;
        const brightness = Math.round(255 * Math.max(0, 1 - progress)); // characters dim as they fall
        const shimmer = shimmerMin + Math.random() * (shimmerMax - shimmerMin); // random flicker gives the trail texture
        ctx.fillStyle = col.hasBrightHead
          ? brightHeadColor
          : `rgb(0, ${Math.round(brightness * shimmer)}, 0)`;
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
      <div className="relative z-10 flex items-center justify-center h-full">
        {/* Monaco/Menlo for Mac, Consolas for Windows — no web font dependency. Ligatures off to prevent ... → … substitution. Phosphor glow via text-shadow. */}
        <div
          className="text-sm sm:text-base text-green-400 p-8 max-w-sm w-full bg-black/90 backdrop-blur-sm rounded border border-green-500/40"
          style={{
            fontFamily: "Monaco, Menlo, Consolas, 'Courier New', monospace",
            fontVariantLigatures: "none",
            textShadow: "0 0 8px rgba(0, 255, 65, 0.7)",
            boxShadow:
              "0 0 24px rgba(0, 255, 65, 0.15), inset 0 0 24px rgba(0, 255, 65, 0.03)",
          }}
        >
          <div className="mb-1">
            <span>rod {">"}</span> {typed}
            <span className={showCursor ? "opacity-100" : "opacity-0"}>█</span>
          </div>
          <div className="mt-6 flex gap-6 text-xs text-green-700">
            <a
              href="https://github.com/rodmk"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-green-400 transition-colors"
            >
              ~/github
            </a>
            <a
              href="https://linkedin.com/in/rodmk"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-green-400 transition-colors"
            >
              ~/linkedin
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
