import { useEffect, useRef, useState } from 'react';
import baseImage from './assets/base.png';

const SPOTLIGHT_R = 260;

export default function App() {
  const mouse = useRef({ x: -999, y: -999 });
  const smooth = useRef({ x: -999, y: -999 });
  const rafRef = useRef(0);
  const maskRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cursorPos, setCursorPos] = useState({ x: -999, y: -999 });
  const [isRevealing, setIsRevealing] = useState(false);
  const [isMobile, setIsMobile] = useState(() => window.matchMedia('(max-width: 639px)').matches);
  const mediaTransform = 'translate(0px, 132px) scale(0.79)';

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 639px)');
    const handleChange = (event: MediaQueryListEvent) => setIsMobile(event.matches);

    setIsMobile(mediaQuery.matches);
    mediaQuery.addEventListener('change', handleChange);

    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    if (isMobile) return;

    const hasFinePointer = window.matchMedia('(pointer: fine)').matches;
    const handleMouseMove = (event: MouseEvent) => {
      if (!hasFinePointer) return;
      setIsRevealing(true);
      mouse.current.x = event.clientX;
      mouse.current.y = event.clientY;
    };

    const tick = (time: number) => {
      if (!hasFinePointer) {
        const cx = window.innerWidth / 2;
        const cy = window.innerHeight * 0.55;
        const r = Math.min(window.innerWidth, window.innerHeight) * 0.22;
        const t = time * 0.0004;
        mouse.current.x = cx + Math.cos(t) * r;
        mouse.current.y = cy + Math.sin(t) * r * 0.7;
      }

      smooth.current.x += (mouse.current.x - smooth.current.x) * 0.1;
      smooth.current.y += (mouse.current.y - smooth.current.y) * 0.1;
      setCursorPos({ x: smooth.current.x, y: smooth.current.y });
      rafRef.current = window.requestAnimationFrame(tick);
    };

    window.addEventListener('mousemove', handleMouseMove);
    rafRef.current = window.requestAnimationFrame(tick);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.cancelAnimationFrame(rafRef.current);
    };
  }, [isMobile]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const sizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    sizeCanvas();
    window.addEventListener('resize', sizeCanvas);

    return () => window.removeEventListener('resize', sizeCanvas);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const mask = maskRef.current;
    const ctx = canvas?.getContext('2d');

    if (!canvas || !mask || !ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!isRevealing) {
      mask.style.opacity = '0';
      mask.style.maskImage = 'none';
      mask.style.webkitMaskImage = 'none';
      return;
    }

    const gradient = ctx.createRadialGradient(cursorPos.x, cursorPos.y, 0, cursorPos.x, cursorPos.y, SPOTLIGHT_R);
    gradient.addColorStop(0, 'rgba(255,255,255,1)');
    gradient.addColorStop(0.4, 'rgba(255,255,255,1)');
    gradient.addColorStop(0.6, 'rgba(255,255,255,0.75)');
    gradient.addColorStop(0.75, 'rgba(255,255,255,0.4)');
    gradient.addColorStop(0.88, 'rgba(255,255,255,0.12)');
    gradient.addColorStop(1, 'rgba(255,255,255,0)');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(cursorPos.x, cursorPos.y, SPOTLIGHT_R, 0, Math.PI * 2);
    ctx.fill();

    const maskImage = `url(${canvas.toDataURL()})`;
    mask.style.maskImage = maskImage;
    mask.style.webkitMaskImage = maskImage;
    mask.style.maskSize = '100% 100%';
    mask.style.webkitMaskSize = '100% 100%';
    mask.style.opacity = '1';
  }, [cursorPos, isRevealing]);

  return (
    <div className="min-h-screen bg-black tracking-[-0.02em]" style={{ fontFamily: 'Inter' }}>
      {isMobile ? (
        <video
          src="./reveal.mp4"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          className="fixed inset-0 h-full w-full object-contain"
          style={{ transform: 'scale(1.3)' }}
        />
      ) : (
        <>
          <div
            className="fixed inset-0 bg-center bg-cover bg-no-repeat"
            style={{ backgroundImage: `url(${baseImage})`, transform: mediaTransform }}
          />
          <div
            ref={maskRef}
            className="fixed inset-0 pointer-events-none overflow-hidden transition-opacity duration-300"
            style={{ opacity: 0 }}
          >
            <video
              src="./reveal.mp4"
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
              className="absolute inset-0 h-full w-full object-cover"
              style={{ objectPosition: 'center', transform: mediaTransform }}
            />
          </div>
          <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none" style={{ display: 'none' }} />
        </>
      )}
      <div className="fixed top-[14%] left-0 right-0 z-10 flex justify-center px-5 text-center pointer-events-none">
        <h1
          className="hero-anim hero-reveal font-playfair italic font-normal text-white leading-[0.95] text-5xl sm:text-7xl md:text-8xl"
          style={{ letterSpacing: '-0.05em', animationDelay: '0.25s' }}
        >
          There's nothing here...
        </h1>
      </div>
    </div>
  );
}
