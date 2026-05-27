"use client";
import { useEffect, useRef } from "react";

const FireworksFancy = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    class Particle {
      x: number;
      y: number;
      radius: number;
      color: string;
      speedX: number;
      speedY: number;
      alpha: number;
      trail: { x: number; y: number }[];

      constructor(x: number, y: number, color: string) {
        this.x = x;
        this.y = y;
        this.radius = Math.random() * 2 + 2;
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 7 + 3;
        this.speedX = Math.cos(angle) * speed;
        this.speedY = Math.sin(angle) * speed;
        this.color = color;
        this.alpha = 1;
        this.trail = [];
      }

      update() {
        this.trail.push({ x: this.x, y: this.y });
        if (this.trail.length > 8) this.trail.shift();

        this.x += this.speedX;
        this.y += this.speedY;
        this.speedY += 0.05; // gravity
        this.alpha -= 0.015;
      }

      draw(ctx: CanvasRenderingContext2D) {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();

        // trail effect
        ctx.strokeStyle = this.color;
        ctx.beginPath();
        for (let i = 0; i < this.trail.length - 1; i++) {
          const p1 = this.trail[i];
          const p2 = this.trail[i + 1];
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
        }
        ctx.stroke();

        ctx.restore();
      }
    }

    class Rocket {
      x: number;
      y: number;
      speedY: number;
      color: string;
      exploded: boolean;

      constructor(x: number, y: number, color: string) {
        this.x = x;
        this.y = y;
        this.speedY = Math.random() * -7 - 8;
        this.color = color;
        this.exploded = false;
      }

      update() {
        this.y += this.speedY;
        this.speedY += 0.15; // gravity
        if (this.speedY >= 0 && !this.exploded) {
          this.exploded = true;
          explode(this.x, this.y, this.color);
        }
      }

      draw(ctx: CanvasRenderingContext2D) {
        if (!this.exploded) {
          ctx.save();
          ctx.fillStyle = this.color;
          ctx.fillRect(this.x - 2, this.y - 10, 4, 10);
          ctx.restore();
        }
      }
    }

    let particles: Particle[] = [];
    let rockets: Rocket[] = [];

    function explode(x: number, y: number, color: string) {
      for (let i = 0; i < 60; i++) {
        particles.push(new Particle(x, y, color));
      }
    }

    function createRocket() {
      const x = Math.random() * canvas.width;
      const y = canvas.height;
      const colors = ["#ff0000", "#ff8000", "#ffff00", "#00ff00", "#00ffff", "#0040ff", "#ff00ff"];
      const color = colors[Math.floor(Math.random() * colors.length)];
      rockets.push(new Rocket(x, y, color));
    }

    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height); 

      rockets.forEach((r, i) => {
        r.update();
        r.draw(ctx);
        if (r.exploded) rockets.splice(i, 1);
      });

      particles.forEach((p, i) => {
        p.update();
        p.draw(ctx);
        if (p.alpha <= 0) particles.splice(i, 1);
      });

      requestAnimationFrame(animate);
    }

    const rocketInterval = setInterval(createRocket, 1200);
    animate();

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", resize);

    return () => {
      clearInterval(rocketInterval);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed top-0 left-0 w-full h-full z-50 pointer-events-none"
    />
  );
};

export default FireworksFancy;
