/**
 * Scratch-Off Library
 * Turns any website into a scratch-off lottery ticket experience
 */

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  rotation: number;
  rotationSpeed: number;
  life: number;
  maxLife: number;
}

interface ElementShape {
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  type: string;
}

class ScratchOff {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private scratchCanvas: HTMLCanvasElement;
  private scratchCtx: CanvasRenderingContext2D;
  private particles: Particle[] = [];
  private isScratching = false;
  private lastX = 0;
  private lastY = 0;
  private scratchRadius = 30;
  private totalPixels = 0;
  private scratchedPixels = 0;
  private fadeThreshold = 0.90;
  private isFading = false;
  private audioContext: AudioContext | null = null;
  private animationId: number | null = null;
  private shapes: ElementShape[] = [];
  private baseColor = '#C0C0C0';
  private accentColors = ['#A8A8A8', '#B8B8B8', '#D0D0D0', '#BEBEBE'];

  constructor() {
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d')!;
    this.scratchCanvas = document.createElement('canvas');
    this.scratchCtx = this.scratchCanvas.getContext('2d')!;

    this.init();
  }

  private init(): void {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setup());
    } else {
      // Small delay to ensure all content is rendered
      setTimeout(() => this.setup(), 100);
    }
  }

  private setup(): void {
    const width = window.innerWidth;
    const height = window.innerHeight;

    // Setup main canvas
    this.canvas.width = width;
    this.canvas.height = height;
    this.canvas.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 999999;
      cursor: crosshair;
      touch-action: none;
    `;

    // Setup scratch tracking canvas
    this.scratchCanvas.width = width;
    this.scratchCanvas.height = height;

    this.totalPixels = width * height;

    // Detect elements and create shapes
    this.detectElements();

    // Draw initial scratch layer
    this.drawScratchLayer();

    // Add to DOM
    document.body.appendChild(this.canvas);

    // Prevent scrolling
    document.body.style.overflow = 'hidden';

    // Bind events
    this.bindEvents();

    // Start animation loop
    this.animate();
  }

  private detectElements(): void {
    const elements = document.body.querySelectorAll('*');
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    elements.forEach((el) => {
      if (el === this.canvas) return;

      const rect = el.getBoundingClientRect();

      // Only include elements visible in viewport
      if (
        rect.width > 0 &&
        rect.height > 0 &&
        rect.top < viewportHeight &&
        rect.bottom > 0 &&
        rect.left < viewportWidth &&
        rect.right > 0
      ) {
        const tagName = el.tagName.toLowerCase();
        const computedStyle = window.getComputedStyle(el);

        // Skip invisible elements
        if (computedStyle.display === 'none' || computedStyle.visibility === 'hidden') {
          return;
        }

        // Assign colors based on element type
        let color = this.getShapeColor(tagName, computedStyle);

        // Only add if it's a meaningful element
        if (this.isSignificantElement(tagName, rect)) {
          this.shapes.push({
            x: Math.max(0, rect.left),
            y: Math.max(0, rect.top),
            width: Math.min(rect.width, viewportWidth - rect.left),
            height: Math.min(rect.height, viewportHeight - rect.top),
            color,
            type: tagName
          });
        }
      }
    });

    // Sort by area (larger elements first) to layer properly
    this.shapes.sort((a, b) => (b.width * b.height) - (a.width * a.height));
  }

  private isSignificantElement(tagName: string, rect: DOMRect): boolean {
    const significantTags = [
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'p', 'div', 'section', 'article', 'header', 'footer', 'nav', 'main', 'aside',
      'img', 'video', 'canvas', 'svg',
      'button', 'a', 'input', 'textarea', 'select',
      'ul', 'ol', 'li', 'table', 'form',
      'span', 'strong', 'em', 'code', 'pre'
    ];

    // Must be at least 10x10 pixels
    if (rect.width < 10 || rect.height < 10) return false;

    return significantTags.includes(tagName);
  }

  private getShapeColor(tagName: string, style: CSSStyleDeclaration): string {
    // Create variety of silver/gray tones for lottery ticket look
    const headingColors: Record<string, string> = {
      'h1': '#888888',
      'h2': '#909090',
      'h3': '#989898',
      'h4': '#A0A0A0',
      'h5': '#A8A8A8',
      'h6': '#B0B0B0'
    };

    if (headingColors[tagName]) {
      return headingColors[tagName];
    }

    if (['img', 'video', 'svg', 'canvas'].includes(tagName)) {
      return '#707070';
    }

    if (['button', 'a', 'input', 'select', 'textarea'].includes(tagName)) {
      return '#858585';
    }

    if (['p', 'span', 'li'].includes(tagName)) {
      return '#A5A5A5';
    }

    // Default
    return this.accentColors[Math.floor(Math.random() * this.accentColors.length)];
  }

  private drawScratchLayer(): void {
    const width = this.canvas.width;
    const height = this.canvas.height;

    // Fill with base silver color
    this.ctx.fillStyle = this.baseColor;
    this.ctx.fillRect(0, 0, width, height);

    // Draw detected element shapes
    this.shapes.forEach(shape => {
      this.ctx.fillStyle = shape.color;

      // Add slight rounded corners for softer look
      const radius = Math.min(4, shape.width / 4, shape.height / 4);
      this.roundRect(shape.x, shape.y, shape.width, shape.height, radius);
    });

    // Add scratch-off texture overlay
    this.addTexture();

    // Initialize scratch tracking (white = unscratched)
    this.scratchCtx.fillStyle = '#FFFFFF';
    this.scratchCtx.fillRect(0, 0, width, height);
  }

  private roundRect(x: number, y: number, width: number, height: number, radius: number): void {
    this.ctx.beginPath();
    this.ctx.moveTo(x + radius, y);
    this.ctx.lineTo(x + width - radius, y);
    this.ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    this.ctx.lineTo(x + width, y + height - radius);
    this.ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    this.ctx.lineTo(x + radius, y + height);
    this.ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    this.ctx.lineTo(x, y + radius);
    this.ctx.quadraticCurveTo(x, y, x + radius, y);
    this.ctx.closePath();
    this.ctx.fill();
  }

  private addTexture(): void {
    const width = this.canvas.width;
    const height = this.canvas.height;
    const imageData = this.ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    // Add noise for scratch-off texture
    for (let i = 0; i < data.length; i += 4) {
      const noise = (Math.random() - 0.5) * 30;
      data[i] = Math.max(0, Math.min(255, data[i] + noise));
      data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise));
      data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise));
    }

    this.ctx.putImageData(imageData, 0, 0);

    // Add subtle horizontal lines for metallic effect
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    this.ctx.lineWidth = 1;
    for (let y = 0; y < height; y += 3) {
      if (Math.random() > 0.5) {
        this.ctx.beginPath();
        this.ctx.moveTo(0, y);
        this.ctx.lineTo(width, y);
        this.ctx.stroke();
      }
    }

    // Add some sparkle dots
    for (let i = 0; i < 500; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const size = Math.random() * 2;
      this.ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.5})`;
      this.ctx.beginPath();
      this.ctx.arc(x, y, size, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }

  private bindEvents(): void {
    // Mouse events
    this.canvas.addEventListener('mousedown', this.handleStart.bind(this));
    this.canvas.addEventListener('mousemove', this.handleMove.bind(this));
    this.canvas.addEventListener('mouseup', this.handleEnd.bind(this));
    this.canvas.addEventListener('mouseleave', this.handleEnd.bind(this));

    // Touch events
    this.canvas.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
    this.canvas.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
    this.canvas.addEventListener('touchend', this.handleEnd.bind(this));
  }

  private handleStart(e: MouseEvent): void {
    this.isScratching = true;
    this.lastX = e.clientX;
    this.lastY = e.clientY;
    this.scratch(e.clientX, e.clientY);
  }

  private handleMove(e: MouseEvent): void {
    if (!this.isScratching) return;
    this.scratch(e.clientX, e.clientY);
  }

  private handleTouchStart(e: TouchEvent): void {
    e.preventDefault();
    this.isScratching = true;
    const touch = e.touches[0];
    this.lastX = touch.clientX;
    this.lastY = touch.clientY;
    this.scratch(touch.clientX, touch.clientY);
  }

  private handleTouchMove(e: TouchEvent): void {
    e.preventDefault();
    if (!this.isScratching) return;
    const touch = e.touches[0];
    this.scratch(touch.clientX, touch.clientY);
  }

  private handleEnd(): void {
    this.isScratching = false;
  }

  private scratch(x: number, y: number): void {
    if (this.isFading) return;

    // Play scratch sound
    this.playScratchSound();

    // Create particles along the scratch path
    this.createParticles(x, y);

    // Scratch in main canvas (use destination-out to reveal underneath)
    this.ctx.globalCompositeOperation = 'destination-out';

    // Draw scratch line from last position
    this.ctx.beginPath();
    this.ctx.moveTo(this.lastX, this.lastY);
    this.ctx.lineTo(x, y);
    this.ctx.lineWidth = this.scratchRadius * 2;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    this.ctx.stroke();

    // Also draw at current position for single clicks
    this.ctx.beginPath();
    this.ctx.arc(x, y, this.scratchRadius, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.globalCompositeOperation = 'source-over';

    // Track scratched area
    this.scratchCtx.fillStyle = '#000000';
    this.scratchCtx.beginPath();
    this.scratchCtx.moveTo(this.lastX, this.lastY);
    this.scratchCtx.lineTo(x, y);
    this.scratchCtx.lineWidth = this.scratchRadius * 2;
    this.scratchCtx.lineCap = 'round';
    this.scratchCtx.stroke();
    this.scratchCtx.beginPath();
    this.scratchCtx.arc(x, y, this.scratchRadius, 0, Math.PI * 2);
    this.scratchCtx.fill();

    this.lastX = x;
    this.lastY = y;

    // Check scratch progress periodically
    if (Math.random() < 0.1) {
      this.checkProgress();
    }
  }

  private createParticles(x: number, y: number): void {
    const particleCount = 3 + Math.floor(Math.random() * 5);

    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 3;
      const colors = ['#C0C0C0', '#A8A8A8', '#B8B8B8', '#D0D0D0', '#909090'];

      this.particles.push({
        x: x + (Math.random() - 0.5) * this.scratchRadius,
        y: y + (Math.random() - 0.5) * this.scratchRadius,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed + 2, // Bias downward
        size: 2 + Math.random() * 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.2,
        life: 1,
        maxLife: 60 + Math.random() * 60
      });
    }
  }

  private updateParticles(): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];

      // Apply gravity and air resistance
      p.vy += 0.15;
      p.vx *= 0.99;
      p.vy *= 0.99;

      // Add slight horizontal drift
      p.vx += (Math.random() - 0.5) * 0.1;

      p.x += p.vx;
      p.y += p.vy;
      p.rotation += p.rotationSpeed;
      p.life++;

      // Remove if off screen or expired
      if (p.y > this.canvas.height + 20 || p.life > p.maxLife) {
        this.particles.splice(i, 1);
      }
    }
  }

  private drawParticles(): void {
    this.particles.forEach(p => {
      const alpha = 1 - (p.life / p.maxLife);
      this.ctx.save();
      this.ctx.translate(p.x, p.y);
      this.ctx.rotate(p.rotation);
      this.ctx.fillStyle = p.color;
      this.ctx.globalAlpha = alpha;

      // Draw irregular flake shape
      this.ctx.beginPath();
      this.ctx.moveTo(-p.size / 2, -p.size / 4);
      this.ctx.lineTo(0, -p.size / 2);
      this.ctx.lineTo(p.size / 2, -p.size / 4);
      this.ctx.lineTo(p.size / 2, p.size / 4);
      this.ctx.lineTo(0, p.size / 2);
      this.ctx.lineTo(-p.size / 2, p.size / 4);
      this.ctx.closePath();
      this.ctx.fill();

      this.ctx.restore();
    });
  }

  private playScratchSound(): void {
    if (!this.audioContext) {
      try {
        this.audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      } catch {
        return; // Audio not supported
      }
    }

    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }

    // Create scratch sound using noise
    const duration = 0.05;
    const sampleRate = this.audioContext.sampleRate;
    const bufferSize = Math.floor(sampleRate * duration);
    const buffer = this.audioContext.createBuffer(1, bufferSize, sampleRate);
    const data = buffer.getChannelData(0);

    // Generate scratchy noise
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.3;
    }

    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;

    // Add filter to make it sound more like scratching
    const filter = this.audioContext.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 2000 + Math.random() * 2000;
    filter.Q.value = 1;

    const gainNode = this.audioContext.createGain();
    gainNode.gain.value = 0.15;

    source.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    source.start();
  }

  private checkProgress(): void {
    const imageData = this.scratchCtx.getImageData(
      0, 0,
      this.scratchCanvas.width,
      this.scratchCanvas.height
    );
    const data = imageData.data;

    let scratched = 0;
    // Sample every 100th pixel for performance
    for (let i = 0; i < data.length; i += 400) {
      if (data[i] === 0) { // Black = scratched
        scratched++;
      }
    }

    const sampleTotal = Math.floor(data.length / 400);
    const progress = scratched / sampleTotal;

    if (progress >= this.fadeThreshold && !this.isFading) {
      this.fadeOut();
    }
  }

  private fadeOut(): void {
    this.isFading = true;
    this.canvas.style.transition = 'opacity 0.8s ease-out';
    this.canvas.style.opacity = '0';

    setTimeout(() => {
      this.cleanup();
    }, 800);
  }

  private cleanup(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }

    if (this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas);
    }

    // Restore scrolling
    document.body.style.overflow = '';

    // Close audio context
    if (this.audioContext) {
      this.audioContext.close();
    }
  }

  private animate(): void {
    this.updateParticles();
    this.drawParticles();

    this.animationId = requestAnimationFrame(() => this.animate());
  }
}

// Auto-initialize when script loads
new ScratchOff();

// Export for module usage
export { ScratchOff };
