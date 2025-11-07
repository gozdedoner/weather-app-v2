import { useEffect, useRef } from "react";

interface Props {
  type: string; // clear, rain, snow, clouds, thunderstorm
}

export default function WeatherBackground({ type }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    let particles: { x: number; y: number; speed: number; size: number }[] = [];

    // 🌧️ Yağmur
    if (type === "rain") {
      particles = Array.from({ length: 150 }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        speed: 4 + Math.random() * 3,
        size: 1,
      }));
    }

    // ❄️ Kar
    if (type === "snow") {
      particles = Array.from({ length: 120 }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        speed: 1 + Math.random() * 1.5,
        size: 2 + Math.random() * 2,
      }));
    }

    // ✨ Yıldızlı gece
    if (type === "clear" || type === "clouds") {
      particles = Array.from({ length: 80 }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        speed: 0,
        size: 1 + Math.random() * 1.5,
      }));
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle =
        type === "rain"
          ? "rgba(173, 216, 230, 0.6)"
          : type === "snow"
          ? "rgba(255,255,255,0.9)"
          : "rgba(255,255,255,0.6)";

      particles.forEach((p) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        p.y += p.speed;
        if (p.y > canvas.height) p.y = 0;
      });

      requestAnimationFrame(animate);
    };

    animate();

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [type]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute top-0 left-0 w-full h-full -z-10 opacity-40"
    />
  );
}
