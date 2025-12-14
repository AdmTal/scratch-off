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
  // Pre-computed shape offsets to prevent trail artifacts from per-frame randomness
  shapeOffsets: number[];
}

interface ElementShape {
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  type: string;
  hasBorder: boolean;
  borderColor: string;
  hasText: boolean;
  textLength: number;
}

class ScratchOff {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private scratchCanvas: HTMLCanvasElement;
  private scratchCtx: CanvasRenderingContext2D;
  private particleCanvas: HTMLCanvasElement;
  private particleCtx: CanvasRenderingContext2D;
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
  private audioInitialized = false;
  private animationId: number | null = null;
  private shapes: ElementShape[] = [];
  private baseColor = '#C0C0C0';
  private accentColors = ['#A8A8A8', '#B8B8B8', '#D0D0D0', '#BEBEBE'];
  private lastScratchDirection: 'up' | 'down' | 'left' | 'right' | null = null;
  private scratchDirectionChangeCount = 0;

  constructor() {
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d')!;
    this.scratchCanvas = document.createElement('canvas');
    this.scratchCtx = this.scratchCanvas.getContext('2d')!;
    this.particleCanvas = document.createElement('canvas');
    this.particleCtx = this.particleCanvas.getContext('2d')!;

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

    // Setup particle canvas (overlay for particles)
    this.particleCanvas.width = width;
    this.particleCanvas.height = height;
    this.particleCanvas.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 1000000;
      pointer-events: none;
    `;

    this.totalPixels = width * height;

    // Detect elements and create shapes
    this.detectElements();

    // Draw initial scratch layer
    this.drawScratchLayer();

    // Add to DOM
    document.body.appendChild(this.canvas);
    document.body.appendChild(this.particleCanvas);

    // Prevent scrolling
    document.body.style.overflow = 'hidden';

    // Bind events
    this.bindEvents();

    // Pre-initialize audio context on first user interaction
    this.initAudioOnInteraction();

    // Start animation loop
    this.animate();
  }

  private initAudioOnInteraction(): void {
    const initAudio = () => {
      if (this.audioInitialized) return;
      this.audioInitialized = true;

      try {
        this.audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
        // Immediately resume to avoid delay on first scratch
        if (this.audioContext.state === 'suspended') {
          this.audioContext.resume();
        }
      } catch {
        // Audio not supported
      }

      // Remove listeners once initialized
      document.removeEventListener('mousedown', initAudio);
      document.removeEventListener('touchstart', initAudio);
    };

    // Initialize audio on any user interaction
    document.addEventListener('mousedown', initAudio);
    document.addEventListener('touchstart', initAudio);
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

        // Detect if element has a visible border
        const borderTopWidth = parseFloat(computedStyle.borderTopWidth) || 0;
        const borderRightWidth = parseFloat(computedStyle.borderRightWidth) || 0;
        const borderBottomWidth = parseFloat(computedStyle.borderBottomWidth) || 0;
        const borderLeftWidth = parseFloat(computedStyle.borderLeftWidth) || 0;
        const hasBorder = (borderTopWidth + borderRightWidth + borderBottomWidth + borderLeftWidth) > 0;
        const borderColor = computedStyle.borderColor || '#888888';

        // Detect if element has direct text content (not from child elements)
        let hasText = false;
        let textLength = 0;
        const textTags = ['p', 'span', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'li', 'a', 'button', 'label', 'td', 'th', 'strong', 'em', 'code', 'pre'];
        if (textTags.includes(tagName)) {
          // Get direct text content only
          const directText = Array.from(el.childNodes)
            .filter(node => node.nodeType === Node.TEXT_NODE)
            .map(node => node.textContent?.trim() || '')
            .join('');
          if (directText.length > 0) {
            hasText = true;
            textLength = directText.length;
          }
        }

        // Only add if it's a meaningful element
        if (this.isSignificantElement(tagName, rect)) {
          this.shapes.push({
            x: Math.max(0, rect.left),
            y: Math.max(0, rect.top),
            width: Math.min(rect.width, viewportWidth - rect.left),
            height: Math.min(rect.height, viewportHeight - rect.top),
            color,
            type: tagName,
            hasBorder,
            borderColor,
            hasText,
            textLength
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

  private getContrastColor(hexColor: string): string {
    // Parse hex color to RGB
    const hex = hexColor.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    // Calculate relative luminance (WCAG formula)
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

    // Return dark or light color based on background luminance
    // Use semi-transparent colors for a subtle, classy look
    return luminance > 0.5 ? 'rgba(40, 40, 40, 0.7)' : 'rgba(230, 230, 230, 0.7)';
  }

  private formatElementLabel(tagName: string): string {
    // Format as self-closing tag: <tagName />
    return `<${tagName} />`;
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

    // Draw element labels on shapes
    this.drawElementLabels();

    // Draw visual guides for borders and text
    this.drawBorderOutlines();
    this.drawTextPlaceholders();

    // Initialize scratch tracking (white = unscratched)
    this.scratchCtx.fillStyle = '#FFFFFF';
    this.scratchCtx.fillRect(0, 0, width, height);
  }

  private drawElementLabels(): void {
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';

    this.shapes.forEach(shape => {
      const label = this.formatElementLabel(shape.type);
      const textColor = this.getContrastColor(shape.color);

      // Calculate font size based on shape dimensions
      // Aim for text to fit nicely within the shape
      const maxWidth = shape.width * 0.8;
      const maxHeight = shape.height * 0.4;

      // Start with a size based on shape height, then adjust
      let fontSize = Math.min(maxHeight, 24);
      fontSize = Math.max(fontSize, 8); // Minimum readable size

      this.ctx.font = `${fontSize}px "SF Mono", "Monaco", "Inconsolata", "Roboto Mono", monospace`;

      // Measure text and scale down if needed
      let textWidth = this.ctx.measureText(label).width;
      while (textWidth > maxWidth && fontSize > 8) {
        fontSize -= 1;
        this.ctx.font = `${fontSize}px "SF Mono", "Monaco", "Inconsolata", "Roboto Mono", monospace`;
        textWidth = this.ctx.measureText(label).width;
      }

      // Only draw if shape is large enough for readable text
      if (fontSize >= 8 && shape.width >= 30 && shape.height >= 16) {
        const centerX = shape.x + shape.width / 2;
        const centerY = shape.y + shape.height / 2;

        this.ctx.fillStyle = textColor;
        this.ctx.fillText(label, centerX, centerY);
      }
    });
  }

  private drawBorderOutlines(): void {
    this.shapes.forEach(shape => {
      if (!shape.hasBorder) return;

      const padding = 2; // Inset from edge
      const x = shape.x + padding;
      const y = shape.y + padding;
      const width = shape.width - padding * 2;
      const height = shape.height - padding * 2;

      if (width <= 0 || height <= 0) return;

      this.ctx.save();
      this.ctx.strokeStyle = 'rgba(60, 60, 60, 0.6)';
      this.ctx.lineWidth = 2;
      this.ctx.setLineDash([6, 4]); // Dotted line pattern

      const radius = Math.min(4, width / 4, height / 4);
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
      this.ctx.stroke();

      this.ctx.restore();
    });
  }

  private drawTextPlaceholders(): void {
    const blockChar = '█';

    this.shapes.forEach(shape => {
      if (!shape.hasText || shape.textLength === 0) return;

      // Calculate how many placeholder blocks we can fit
      const padding = 8;
      const availableWidth = shape.width - padding * 2;
      const availableHeight = shape.height - padding * 2;

      if (availableWidth < 20 || availableHeight < 10) return;

      // Calculate font size based on available space
      let fontSize = Math.min(availableHeight * 0.6, 16);
      fontSize = Math.max(fontSize, 8);

      this.ctx.font = `${fontSize}px "SF Mono", "Monaco", "Inconsolata", "Roboto Mono", monospace`;

      // Measure single block character
      const blockWidth = this.ctx.measureText(blockChar + ' ').width;

      // Determine how many blocks fit and how many to show
      const maxBlocks = Math.floor(availableWidth / blockWidth);
      const numBlocks = Math.min(Math.ceil(shape.textLength / 3), maxBlocks, 12); // Cap at 12 blocks

      if (numBlocks <= 0) return;

      // Build placeholder string: █ █ █
      const placeholderText = Array(numBlocks).fill(blockChar).join(' ');

      // Position: center in available space, below the element label
      const centerX = shape.x + shape.width / 2;
      const centerY = shape.y + shape.height / 2 + fontSize * 0.8; // Offset below label

      this.ctx.save();
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillStyle = 'rgba(50, 50, 50, 0.5)';
      this.ctx.fillText(placeholderText, centerX, centerY);
      this.ctx.restore();
    });
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

    // Determine scratch direction and detect direction changes
    const dx = x - this.lastX;
    const dy = y - this.lastY;
    let currentDirection: 'up' | 'down' | 'left' | 'right';

    if (Math.abs(dy) > Math.abs(dx)) {
      currentDirection = dy > 0 ? 'down' : 'up';
    } else {
      currentDirection = dx > 0 ? 'right' : 'left';
    }

    // Detect direction change for sound variation
    const directionChanged = this.lastScratchDirection !== null &&
      this.lastScratchDirection !== currentDirection;
    if (directionChanged) {
      this.scratchDirectionChangeCount++;
    }
    this.lastScratchDirection = currentDirection;

    // Play scratch sound with direction awareness
    this.playScratchSound(directionChanged);

    // Create particles along the scratch path
    this.createParticles(x, y);

    // Scratch in main canvas (use destination-out to reveal underneath)
    this.ctx.globalCompositeOperation = 'destination-out';

    // Draw irregular scratch line from last position
    this.drawIrregularLine(this.ctx, this.lastX, this.lastY, x, y);

    // Also draw at current position for single clicks with irregular shape
    this.drawIrregularScratch(this.ctx, x, y);

    this.ctx.globalCompositeOperation = 'source-over';

    // Track scratched area with same irregular shapes
    this.scratchCtx.fillStyle = '#000000';
    this.drawIrregularLine(this.scratchCtx, this.lastX, this.lastY, x, y);
    this.drawIrregularScratch(this.scratchCtx, x, y);

    this.lastX = x;
    this.lastY = y;

    // Check scratch progress periodically
    if (Math.random() < 0.1) {
      this.checkProgress();
    }
  }

  private drawIrregularScratch(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    // Draw an irregular polygon instead of a perfect circle
    const points = 8 + Math.floor(Math.random() * 5); // 8-12 points
    const angleStep = (Math.PI * 2) / points;
    const baseAngle = Math.random() * Math.PI * 2; // Random rotation

    ctx.beginPath();
    for (let i = 0; i <= points; i++) {
      const angle = baseAngle + i * angleStep;
      // Vary the radius for each point (70-100% of scratch radius)
      const radiusVariation = 0.7 + Math.random() * 0.3;
      const r = this.scratchRadius * radiusVariation;
      const px = x + Math.cos(angle) * r;
      const py = y + Math.sin(angle) * r;

      if (i === 0) {
        ctx.moveTo(px, py);
      } else {
        ctx.lineTo(px, py);
      }
    }
    ctx.closePath();
    ctx.fill();
  }

  private drawIrregularLine(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number): void {
    // Calculate line properties
    const dx = x2 - x1;
    const dy = y2 - y1;
    const length = Math.sqrt(dx * dx + dy * dy);

    if (length < 1) return;

    // Normal vector perpendicular to line
    const nx = -dy / length;
    const ny = dx / length;

    // Create irregular shape along the line
    const segments = Math.max(4, Math.floor(length / 8)); // More segments for longer lines
    const points: { x: number; y: number }[] = [];

    // Generate points along one side
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const baseX = x1 + dx * t;
      const baseY = y1 + dy * t;
      // Vary width along the line (80-110% of radius)
      const widthVariation = 0.8 + Math.random() * 0.3;
      const offset = this.scratchRadius * widthVariation;
      points.push({
        x: baseX + nx * offset,
        y: baseY + ny * offset
      });
    }

    // Generate points along other side (in reverse)
    for (let i = segments; i >= 0; i--) {
      const t = i / segments;
      const baseX = x1 + dx * t;
      const baseY = y1 + dy * t;
      const widthVariation = 0.8 + Math.random() * 0.3;
      const offset = this.scratchRadius * widthVariation;
      points.push({
        x: baseX - nx * offset,
        y: baseY - ny * offset
      });
    }

    // Draw the irregular shape
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.closePath();
    ctx.fill();
  }

  private createParticles(x: number, y: number): void {
    const particleCount = 3 + Math.floor(Math.random() * 5);

    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 4;
      const colors = ['#C0C0C0', '#A8A8A8', '#B8B8B8', '#D0D0D0', '#909090'];

      this.particles.push({
        x: x + (Math.random() - 0.5) * this.scratchRadius,
        y: y + (Math.random() - 0.5) * this.scratchRadius,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed + 5, // Stronger downward bias for faster fall
        size: 2 + Math.random() * 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.3,
        life: 1,
        maxLife: 30 + Math.random() * 30, // Shorter lifespan
        // Pre-compute random shape offsets to prevent trail artifacts
        shapeOffsets: [
          Math.random(),
          Math.random(),
          Math.random(),
          Math.random(),
          Math.random(),
          Math.random()
        ]
      });
    }
  }

  private updateParticles(): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];

      // Apply stronger gravity and air resistance for faster falling
      p.vy += 0.4;
      p.vx *= 0.98;
      p.vy *= 0.98;

      // Add slight horizontal drift
      p.vx += (Math.random() - 0.5) * 0.15;

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
    // Clear particle canvas each frame to prevent trails
    this.particleCtx.clearRect(0, 0, this.particleCanvas.width, this.particleCanvas.height);

    this.particles.forEach(p => {
      const alpha = 1 - (p.life / p.maxLife);
      this.particleCtx.save();
      this.particleCtx.translate(p.x, p.y);
      this.particleCtx.rotate(p.rotation);
      this.particleCtx.fillStyle = p.color;
      this.particleCtx.globalAlpha = alpha;

      // Draw jagged irregular flake shape using pre-computed offsets
      const jag = p.size * 0.3; // jaggedness factor
      const o = p.shapeOffsets; // use stored offsets instead of Math.random()
      this.particleCtx.beginPath();
      this.particleCtx.moveTo(-p.size / 2 + o[0] * jag, -p.size / 3);
      this.particleCtx.lineTo(-p.size / 4, -p.size / 2 + o[1] * jag);
      this.particleCtx.lineTo(p.size / 4, -p.size / 2 + o[2] * jag);
      this.particleCtx.lineTo(p.size / 2 + o[3] * jag, -p.size / 4);
      this.particleCtx.lineTo(p.size / 2, p.size / 4 + o[4] * jag);
      this.particleCtx.lineTo(p.size / 4, p.size / 2);
      this.particleCtx.lineTo(-p.size / 4, p.size / 2 + o[5] * jag);
      this.particleCtx.lineTo(-p.size / 2, p.size / 4);
      this.particleCtx.closePath();
      this.particleCtx.fill();

      this.particleCtx.restore();
    });
  }

  private playScratchSound(directionChanged: boolean = false): void {
    // Use pre-initialized audio context
    if (!this.audioContext) {
      return; // Audio not ready yet
    }

    // Shorter duration for quick "scritch" sounds
    const duration = 0.02 + Math.random() * 0.015; // 20-35ms (slightly longer for softer feel)
    const sampleRate = this.audioContext.sampleRate;
    const bufferSize = Math.floor(sampleRate * duration);
    const buffer = this.audioContext.createBuffer(1, bufferSize, sampleRate);
    const data = buffer.getChannelData(0);

    // Generate softer scratchy noise with smoother envelope
    for (let i = 0; i < bufferSize; i++) {
      const position = i / bufferSize;
      // Softer envelope with slower attack
      const envelope = Math.pow(Math.sin(position * Math.PI), 1.5);
      data[i] = (Math.random() * 2 - 1) * 0.15 * envelope;
    }

    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;

    // Lower frequencies for a softer, less harsh sound
    const baseFreq = directionChanged ? 1800 : 1200;
    const freqVariation = directionChanged ? 600 : 400;

    const filter = this.audioContext.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = baseFreq + Math.random() * freqVariation;
    filter.Q.value = directionChanged ? 1.2 : 0.8; // Lower Q for softer sound

    // Add a lowpass filter to cut harshness
    const lowpass = this.audioContext.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.value = 2500; // Cut high frequencies
    lowpass.Q.value = 0.5;

    const gainNode = this.audioContext.createGain();
    // Softer volume
    gainNode.gain.value = directionChanged ? 0.04 : 0.025;

    source.connect(filter);
    filter.connect(lowpass);
    lowpass.connect(gainNode);
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
    this.particleCanvas.style.transition = 'opacity 0.8s ease-out';
    this.particleCanvas.style.opacity = '0';

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

    if (this.particleCanvas.parentNode) {
      this.particleCanvas.parentNode.removeChild(this.particleCanvas);
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
