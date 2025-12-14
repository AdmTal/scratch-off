/**
 * Scratch-Off Library
 * Turns any website into a scratch-off lottery ticket experience
 */

// Google Analytics Measurement ID
const GA_MEASUREMENT_ID = 'G-552PMDLPMQ';

// Extend window for gtag
declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
  }
}

/**
 * Analytics module for tracking scratch-off events
 * Supports cross-domain tracking by including host info with every event
 */
const Analytics = {
  initialized: false,

  /**
   * Initialize Google Analytics if not already present
   * This allows tracking when the script is embedded on external sites
   */
  init(): void {
    if (this.initialized) return;
    this.initialized = true;

    // Initialize dataLayer if not present
    window.dataLayer = window.dataLayer || [];

    // Define gtag function if not present
    if (typeof window.gtag !== 'function') {
      window.gtag = function gtag(...args: unknown[]) {
        window.dataLayer.push(args);
      };
    }

    // Check if GA script is already loaded
    const existingScript = document.querySelector(`script[src*="googletagmanager.com/gtag/js"]`);
    if (!existingScript) {
      // Dynamically load GA script for embedded usage
      const script = document.createElement('script');
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
      document.head.appendChild(script);
    }

    // Configure GA
    window.gtag('js', new Date());
    window.gtag('config', GA_MEASUREMENT_ID, {
      // Don't send automatic page view - we'll send our own with host info
      send_page_view: false
    });

    // Send custom page view with host information for cross-domain tracking
    this.trackEvent('page_view', {
      page_title: document.title,
      page_location: window.location.href,
      page_path: window.location.pathname
    });
  },

  /**
   * Track an event with host information for cross-domain analytics
   */
  trackEvent(eventName: string, params: Record<string, unknown> = {}): void {
    if (typeof window.gtag !== 'function') return;

    // Add host information to all events for cross-domain tracking
    const enrichedParams = {
      ...params,
      host_name: window.location.hostname,
      host_url: window.location.origin,
      page_referrer: document.referrer || 'direct',
      embedded: window.self !== window.top // true if in iframe
    };

    window.gtag('event', eventName, enrichedParams);
  }
};

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

interface ConfettiParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  rotation: number;
  rotationSpeed: number;
  wobble: number;
  wobbleSpeed: number;
  life: number;
  maxLife: number;
  shape: 'square' | 'circle' | 'strip';
}

interface TextLineInfo {
  x: number;
  y: number;
  width: number;
  height: number;
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
  textLines: TextLineInfo[];
  fontSize: number;
  lineHeight: number;
}

interface TouchState {
  lastX: number;
  lastY: number;
}

class ScratchOff {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private scratchCanvas: HTMLCanvasElement;
  private scratchCtx: CanvasRenderingContext2D;
  private particleCanvas: HTMLCanvasElement;
  private particleCtx: CanvasRenderingContext2D;
  private particles: Particle[] = [];
  private confetti: ConfettiParticle[] = [];
  private showingWinner = false;
  private isMouseScratching = false;
  private mouseLastX = 0;
  private mouseLastY = 0;
  private activeTouches: Map<number, TouchState> = new Map();
  private scratchRadius = 30;
  private isDesktop = false;
  private totalPixels = 0;
  private scratchedPixels = 0;
  private fadeThreshold = 0.60;
  private isFading = false;
  private audioContext: AudioContext | null = null;
  private audioInitialized = false;
  private animationId: number | null = null;
  private shapes: ElementShape[] = [];
  private baseColor = '#C0C0C0';
  private accentColors = ['#A8A8A8', '#B8B8B8', '#D0D0D0', '#BEBEBE'];
  private lastScratchDirection: 'up' | 'down' | 'left' | 'right' | null = null;
  // Coin cursor SVG (golden coin) - small version for mobile (32x32)
  private coinCursorSmall = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 32 32'%3E%3Cellipse cx='16' cy='18' rx='14' ry='10' fill='%23B8860B'/%3E%3Cellipse cx='16' cy='14' rx='14' ry='10' fill='%23FFD700'/%3E%3Cellipse cx='16' cy='14' rx='11' ry='7' fill='%23FFA500'/%3E%3Cellipse cx='16' cy='14' rx='11' ry='7' fill='url(%23shine)'/%3E%3Ctext x='16' y='17' font-family='Arial' font-size='10' font-weight='bold' fill='%23B8860B' text-anchor='middle'%3E%24%3C/text%3E%3Cdefs%3E%3ClinearGradient id='shine' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' style='stop-color:%23FFE66D;stop-opacity:0.8'/%3E%3Cstop offset='50%25' style='stop-color:%23FFD700;stop-opacity:0'/%3E%3Cstop offset='100%25' style='stop-color:%23B8860B;stop-opacity:0.3'/%3E%3C/linearGradient%3E%3C/defs%3E%3C/svg%3E") 16 16, crosshair`;
  // Large version for desktop (72x72 = 2.25x size, 75% of original 96x96)
  private coinCursorLarge = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='72' height='72' viewBox='0 0 72 72'%3E%3Cellipse cx='36' cy='41' rx='32' ry='23' fill='%23B8860B'/%3E%3Cellipse cx='36' cy='32' rx='32' ry='23' fill='%23FFD700'/%3E%3Cellipse cx='36' cy='32' rx='25' ry='16' fill='%23FFA500'/%3E%3Cellipse cx='36' cy='32' rx='25' ry='16' fill='url(%23shine)'/%3E%3Ctext x='36' y='38' font-family='Arial' font-size='23' font-weight='bold' fill='%23B8860B' text-anchor='middle'%3E%24%3C/text%3E%3Cdefs%3E%3ClinearGradient id='shine' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' style='stop-color:%23FFE66D;stop-opacity:0.8'/%3E%3Cstop offset='50%25' style='stop-color:%23FFD700;stop-opacity:0'/%3E%3Cstop offset='100%25' style='stop-color:%23B8860B;stop-opacity:0.3'/%3E%3C/linearGradient%3E%3C/defs%3E%3C/svg%3E") 36 36, crosshair`;
  private coinCursor = this.coinCursorSmall;
  private scratchDirectionChangeCount = 0;
  // Analytics tracking state
  private hasStartedScratching = false;
  private progressMilestonesReached = new Set<number>();
  private sessionStartTime = 0;
  private scratchCount = 0;
  private deviceType: 'mouse' | 'touch' = 'mouse';
  // Random lottery ticket titles
  private readonly ticketTitles = [
    'MEGA MILLIONS',
    'CASH BLAST',
    'LUCKY 7s',
    'GOLD RUSH',
    'TRIPLE JACKPOT',
    'DIAMOND MINE',
    'FAST CASH',
    'SET FOR LIFE',
    'WILD CHERRY CROSSWORD',
    'CASH EXPLOSION',
    'LUCKY STREAK',
    'MONEY BAGS',
    'GOLDEN TICKET',
    '5X THE CASH',
    'RUBY RICHES',
    'INSTANT MILLIONAIRE',
    'CASH FRENZY',
    'TRIPLE 777',
    '20X THE MONEY',
    'WINNER WINNER',
    'CASH CACHE',
    'LUCKY RELOAD',
    'PAGE OF FORTUNE'
  ];
  private ticketTitle: string;

  constructor() {
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d')!;
    this.scratchCanvas = document.createElement('canvas');
    this.scratchCtx = this.scratchCanvas.getContext('2d')!;
    this.particleCanvas = document.createElement('canvas');
    this.particleCtx = this.particleCanvas.getContext('2d')!;

    // Select a random ticket title
    this.ticketTitle = this.ticketTitles[Math.floor(Math.random() * this.ticketTitles.length)];

    this.init();
  }

  private init(): void {
    // Disable browser's automatic scroll restoration on refresh
    // This must be set before the browser restores scroll position
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }

    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setup());
    } else {
      // Small delay to ensure all content is rendered
      setTimeout(() => this.setup(), 100);
    }
  }

  private setup(): void {
    // Scroll to top on load to ensure consistent starting position
    // Some browsers maintain partial scroll position on refresh
    window.scrollTo(0, 0);

    const width = window.innerWidth;
    const height = window.innerHeight;

    // Detect if this is a desktop device (non-mobile)
    // Use multiple signals: no touch support, larger screen, and no mobile user agent
    const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const isLargeScreen = window.innerWidth >= 768;
    const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    // Desktop = large screen without mobile user agent (touch capability alone doesn't disqualify - laptops have touch)
    this.isDesktop = isLargeScreen && !isMobileUA;

    // Set coin cursor and scratch radius based on device type
    if (this.isDesktop) {
      this.coinCursor = this.coinCursorLarge;
      this.scratchRadius = 68; // 2.25x the mobile size (75% of original 90)
    } else {
      this.coinCursor = this.coinCursorSmall;
      this.scratchRadius = 30;
    }

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
      cursor: ${this.coinCursor};
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
      cursor: ${this.coinCursor};
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

    // Initialize analytics
    Analytics.init();

    // Start animation loop
    this.animate();
  }

  private initAudioOnInteraction(): void {
    // Initialize audio on any user interaction (using capture to run before canvas handlers)
    document.addEventListener('mousedown', this.ensureAudioInitialized.bind(this), { capture: true });
    document.addEventListener('touchstart', this.ensureAudioInitialized.bind(this), { capture: true });
  }

  private ensureAudioInitialized(): void {
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
        let textLines: TextLineInfo[] = [];
        let fontSize = parseFloat(computedStyle.fontSize) || 16;
        let lineHeight = parseFloat(computedStyle.lineHeight) || fontSize * 1.2;

        const textTags = ['p', 'span', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'li', 'a', 'button', 'label', 'td', 'th', 'strong', 'em', 'code', 'pre'];
        if (textTags.includes(tagName)) {
          // Get direct text content and calculate line positions
          const textNodes = Array.from(el.childNodes)
            .filter(node => node.nodeType === Node.TEXT_NODE && node.textContent?.trim());

          if (textNodes.length > 0) {
            hasText = true;
            textLength = textNodes.map(n => n.textContent?.trim() || '').join('').length;

            // Use Range API to get actual text line positions
            textLines = this.getTextLineRects(el as HTMLElement, textNodes);
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
            textLength,
            textLines,
            fontSize,
            lineHeight
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

  private getTextLineRects(element: HTMLElement, textNodes: ChildNode[]): TextLineInfo[] {
    const lines: TextLineInfo[] = [];
    const range = document.createRange();

    textNodes.forEach(textNode => {
      if (!textNode.textContent) return;

      const text = textNode.textContent;
      range.selectNodeContents(textNode);

      // Get all client rects - each rect represents a line of text
      const rects = range.getClientRects();

      for (let i = 0; i < rects.length; i++) {
        const rect = rects[i];
        // Filter out tiny rects and ensure minimum size
        if (rect.width > 5 && rect.height > 5) {
          // Check if this line overlaps with an existing one (merge if so)
          const existingLine = lines.find(
            line => Math.abs(line.y - rect.top) < rect.height * 0.5
          );

          if (existingLine) {
            // Extend the existing line
            const minX = Math.min(existingLine.x, rect.left);
            const maxX = Math.max(existingLine.x + existingLine.width, rect.right);
            existingLine.x = minX;
            existingLine.width = maxX - minX;
          } else {
            lines.push({
              x: rect.left,
              y: rect.top,
              width: rect.width,
              height: rect.height
            });
          }
        }
      }
    });

    // Sort lines by vertical position
    lines.sort((a, b) => a.y - b.y);

    return lines;
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

    // Draw lottery ticket decorations (header, instructions, footer)
    this.drawLotteryDecorations();

    // Draw element labels on shapes
    this.drawElementLabels();

    // Draw visual guides for borders and text
    this.drawBorderOutlines();
    this.drawTextPlaceholders();

    // Initialize scratch tracking (white = unscratched)
    this.scratchCtx.fillStyle = '#FFFFFF';
    this.scratchCtx.fillRect(0, 0, width, height);
  }

  private generateSerialNumber(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let serial = '';
    for (let i = 0; i < 12; i++) {
      if (i === 4 || i === 8) serial += '-';
      serial += chars[Math.floor(Math.random() * chars.length)];
    }
    return serial;
  }

  private drawLotteryDecorations(): void {
    const width = this.canvas.width;
    const height = this.canvas.height;

    // Draw header banner
    const headerHeight = 50;
    this.ctx.fillStyle = 'rgba(80, 60, 20, 0.85)';
    this.ctx.fillRect(0, 0, width, headerHeight);

    // Draw gold gradient border at bottom of header
    const gradient = this.ctx.createLinearGradient(0, headerHeight - 4, 0, headerHeight);
    gradient.addColorStop(0, '#FFD700');
    gradient.addColorStop(0.5, '#FFA500');
    gradient.addColorStop(1, '#B8860B');
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, headerHeight - 4, width, 4);

    // Main title
    this.ctx.font = 'bold 24px "Arial Black", "Impact", sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillStyle = '#FFD700';
    this.ctx.fillText(this.ticketTitle, width / 2, headerHeight / 2 - 2);

    // Stars decorations (positioned further out to avoid overlapping with title)
    this.ctx.font = '18px Arial';
    this.ctx.fillText('★', width / 2 - 155, headerHeight / 2);
    this.ctx.fillText('★', width / 2 + 155, headerHeight / 2);
    this.ctx.font = '14px Arial';
    this.ctx.fillText('✦', width / 2 - 175, headerHeight / 2);
    this.ctx.fillText('✦', width / 2 + 175, headerHeight / 2);

    // Serial number (top right)
    const serialNumber = this.generateSerialNumber();
    this.ctx.font = '10px "Courier New", monospace';
    this.ctx.textAlign = 'right';
    this.ctx.fillStyle = 'rgba(255, 215, 0, 0.7)';
    this.ctx.fillText(`SN: ${serialNumber}`, width - 15, 15);

    // Instructions below header
    this.ctx.font = 'bold 14px Arial, sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.fillStyle = 'rgba(60, 60, 60, 0.9)';
    this.ctx.fillText('Match 3 <div>s to WIN!', width / 2, headerHeight + 22);

    // Draw footer area
    const footerY = height - 30;

    // "Odds of winning" text (bottom left)
    this.ctx.font = '9px Arial, sans-serif';
    this.ctx.textAlign = 'left';
    this.ctx.fillStyle = 'rgba(80, 80, 80, 0.7)';
    this.ctx.fillText('Odds of winning: 1 in 1', 15, footerY + 10);

    // "Must be 18+" text (bottom center)
    this.ctx.textAlign = 'center';
    this.ctx.fillText('Must be 18+ to browse this website', width / 2, footerY + 10);

    // "VOID IF TAMPERED" watermark (diagonal, faint)
    this.ctx.save();
    this.ctx.translate(width / 2, height / 2);
    this.ctx.rotate(-Math.PI / 6); // -30 degrees
    this.ctx.font = 'bold 48px Arial, sans-serif';
    this.ctx.fillStyle = 'rgba(100, 100, 100, 0.08)';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText('VOID IF TAMPERED', 0, 0);
    this.ctx.restore();

    // Draw corner decorations (dollar signs)
    this.ctx.font = 'bold 20px Arial, sans-serif';
    this.ctx.fillStyle = 'rgba(255, 215, 0, 0.3)';
    this.ctx.textAlign = 'left';
    this.ctx.fillText('$', 10, headerHeight + 50);
    this.ctx.textAlign = 'right';
    this.ctx.fillText('$', width - 10, headerHeight + 50);
    this.ctx.textAlign = 'left';
    this.ctx.fillText('$', 10, height - 50);
    this.ctx.textAlign = 'right';
    this.ctx.fillText('$', width - 10, height - 50);
  }

  private drawElementLabels(): void {
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';

    // Track drawn label bounding boxes to prevent overlap
    const drawnLabels: { x: number; y: number; width: number; height: number }[] = [];

    // Helper function to check if a new label would overlap with existing ones
    const wouldOverlap = (x: number, y: number, width: number, height: number, padding: number = 4): boolean => {
      const newBox = {
        left: x - width / 2 - padding,
        right: x + width / 2 + padding,
        top: y - height / 2 - padding,
        bottom: y + height / 2 + padding
      };

      for (const label of drawnLabels) {
        const existingBox = {
          left: label.x - label.width / 2,
          right: label.x + label.width / 2,
          top: label.y - label.height / 2,
          bottom: label.y + label.height / 2
        };

        // Check for intersection
        if (!(newBox.right < existingBox.left ||
              newBox.left > existingBox.right ||
              newBox.bottom < existingBox.top ||
              newBox.top > existingBox.bottom)) {
          return true; // Overlaps
        }
      }
      return false;
    };

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
        const textHeight = fontSize;

        // Skip this label if it would overlap with an already drawn label
        if (wouldOverlap(centerX, centerY, textWidth, textHeight)) {
          return; // Skip drawing this label
        }

        this.ctx.fillStyle = textColor;
        this.ctx.fillText(label, centerX, centerY);

        // Record this label's position
        drawnLabels.push({
          x: centerX,
          y: centerY,
          width: textWidth,
          height: textHeight
        });
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
    this.ctx.save();

    this.shapes.forEach(shape => {
      if (!shape.hasText || shape.textLines.length === 0) return;

      // Draw redaction rectangles for each line of text
      shape.textLines.forEach(line => {
        // Use a dark semi-transparent color for the redaction bar
        this.ctx.fillStyle = 'rgba(40, 40, 40, 0.6)';

        // Add small padding/rounding for a cleaner look
        const barHeight = line.height * 0.75; // Slightly shorter than full line height
        const yOffset = (line.height - barHeight) / 2; // Center vertically

        // Draw rounded rectangle for the redaction bar
        const radius = Math.min(3, barHeight / 4);
        const x = line.x;
        const y = line.y + yOffset;
        const width = line.width;
        const height = barHeight;

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
      });
    });

    this.ctx.restore();
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

    // Touch events - support multi-touch
    this.canvas.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
    this.canvas.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
    this.canvas.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });
    this.canvas.addEventListener('touchcancel', this.handleTouchEnd.bind(this), { passive: false });
  }

  private handleStart(e: MouseEvent): void {
    this.isMouseScratching = true;
    this.mouseLastX = e.clientX;
    this.mouseLastY = e.clientY;
    this.scratch(e.clientX, e.clientY, this.mouseLastX, this.mouseLastY);
    this.mouseLastX = e.clientX;
    this.mouseLastY = e.clientY;
  }

  private handleMove(e: MouseEvent): void {
    if (!this.isMouseScratching) return;
    this.scratch(e.clientX, e.clientY, this.mouseLastX, this.mouseLastY);
    this.mouseLastX = e.clientX;
    this.mouseLastY = e.clientY;
  }

  private handleEnd(): void {
    this.isMouseScratching = false;
  }

  private handleTouchStart(e: TouchEvent): void {
    e.preventDefault();
    this.deviceType = 'touch';
    // Process all new touches
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      const touchState: TouchState = {
        lastX: touch.clientX,
        lastY: touch.clientY
      };
      this.activeTouches.set(touch.identifier, touchState);
      this.scratch(touch.clientX, touch.clientY, touchState.lastX, touchState.lastY);
    }
  }

  private handleTouchMove(e: TouchEvent): void {
    e.preventDefault();
    // Process all moved touches
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      const touchState = this.activeTouches.get(touch.identifier);
      if (touchState) {
        this.scratch(touch.clientX, touch.clientY, touchState.lastX, touchState.lastY);
        touchState.lastX = touch.clientX;
        touchState.lastY = touch.clientY;
      }
    }
  }

  private handleTouchEnd(e: TouchEvent): void {
    e.preventDefault();
    // Remove ended touches
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      this.activeTouches.delete(touch.identifier);
    }
  }

  private hasPaintAt(x: number, y: number): boolean {
    // Check if there's paint (opaque pixels) at the given position
    // Sample a small area around the point
    const sampleSize = Math.max(4, Math.floor(this.scratchRadius / 3));
    const startX = Math.max(0, Math.floor(x - sampleSize / 2));
    const startY = Math.max(0, Math.floor(y - sampleSize / 2));
    const width = Math.min(sampleSize, this.canvas.width - startX);
    const height = Math.min(sampleSize, this.canvas.height - startY);

    if (width <= 0 || height <= 0) return false;

    try {
      const imageData = this.ctx.getImageData(startX, startY, width, height);
      const data = imageData.data;

      // Check if any pixel has alpha > 0 (has paint)
      for (let i = 3; i < data.length; i += 4) {
        if (data[i] > 0) {
          return true;
        }
      }
    } catch {
      // If getImageData fails, assume there's paint
      return true;
    }

    return false;
  }

  private scratch(x: number, y: number, lastX: number, lastY: number): void {
    if (this.isFading) return;

    // Track first scratch interaction
    if (!this.hasStartedScratching) {
      this.hasStartedScratching = true;
      this.sessionStartTime = Date.now();
      Analytics.trackEvent('scratch_started', {
        device_type: this.deviceType,
        viewport_width: window.innerWidth,
        viewport_height: window.innerHeight
      });
    }

    // Increment scratch count for analytics
    this.scratchCount++;

    // Check if there's actually paint to scratch at this location
    const hasPaint = this.hasPaintAt(x, y);

    // Determine scratch direction and detect direction changes
    const dx = x - lastX;
    const dy = y - lastY;
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

    // Only play sound and create particles if there's paint to scratch
    if (hasPaint) {
      // Play scratch sound with direction awareness
      this.playScratchSound(directionChanged);

      // Create particles along the scratch path
      this.createParticles(x, y);
    }

    // Scratch in main canvas (use destination-out to reveal underneath)
    this.ctx.globalCompositeOperation = 'destination-out';

    // Draw irregular scratch line from last position
    this.drawIrregularLine(this.ctx, lastX, lastY, x, y);

    // Also draw at current position for single clicks with irregular shape
    this.drawIrregularScratch(this.ctx, x, y);

    this.ctx.globalCompositeOperation = 'source-over';

    // Track scratched area with same irregular shapes
    this.scratchCtx.fillStyle = '#000000';
    this.drawIrregularLine(this.scratchCtx, lastX, lastY, x, y);
    this.drawIrregularScratch(this.scratchCtx, x, y);

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
    // Ensure audio is initialized on first scratch (fixes race condition with event listeners)
    this.ensureAudioInitialized();

    if (!this.audioContext) {
      return; // Audio not supported
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

    // Track progress milestones (25%, 50%, 75%)
    const milestones = [25, 50, 75];
    for (const milestone of milestones) {
      const threshold = milestone / 100;
      if (progress >= threshold && !this.progressMilestonesReached.has(milestone)) {
        this.progressMilestonesReached.add(milestone);
        const elapsedTime = this.sessionStartTime > 0 ? Date.now() - this.sessionStartTime : 0;
        Analytics.trackEvent('scratch_progress', {
          progress_percent: milestone,
          elapsed_time_ms: elapsedTime,
          scratch_count: this.scratchCount,
          device_type: this.deviceType
        });
      }
    }

    if (progress >= this.fadeThreshold && !this.isFading) {
      this.fadeOut();
    }
  }

  private createConfettiBurst(): void {
    const width = this.canvas.width;
    const height = this.canvas.height;
    const colors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE'];
    const shapes: ('square' | 'circle' | 'strip')[] = ['square', 'circle', 'strip'];

    // Create confetti from multiple points
    const burstPoints = [
      { x: width * 0.2, y: height * 0.3 },
      { x: width * 0.5, y: height * 0.2 },
      { x: width * 0.8, y: height * 0.3 },
      { x: width * 0.3, y: height * 0.5 },
      { x: width * 0.7, y: height * 0.5 },
    ];

    for (const point of burstPoints) {
      for (let i = 0; i < 30; i++) {
        const angle = (Math.random() * Math.PI * 2);
        const speed = 3 + Math.random() * 8;

        this.confetti.push({
          x: point.x + (Math.random() - 0.5) * 100,
          y: point.y + (Math.random() - 0.5) * 50,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 5, // Initial upward burst
          size: 6 + Math.random() * 8,
          color: colors[Math.floor(Math.random() * colors.length)],
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() - 0.5) * 0.3,
          wobble: Math.random() * Math.PI * 2,
          wobbleSpeed: 0.05 + Math.random() * 0.1,
          life: 0,
          maxLife: 150 + Math.random() * 100,
          shape: shapes[Math.floor(Math.random() * shapes.length)]
        });
      }
    }
  }

  private updateConfetti(): void {
    for (let i = this.confetti.length - 1; i >= 0; i--) {
      const c = this.confetti[i];

      // Apply gravity
      c.vy += 0.15;

      // Air resistance
      c.vx *= 0.99;
      c.vy *= 0.99;

      // Wobble effect
      c.wobble += c.wobbleSpeed;
      c.vx += Math.sin(c.wobble) * 0.2;

      c.x += c.vx;
      c.y += c.vy;
      c.rotation += c.rotationSpeed;
      c.life++;

      // Remove if off screen or expired
      if (c.y > this.canvas.height + 50 || c.life > c.maxLife) {
        this.confetti.splice(i, 1);
      }
    }
  }

  private drawConfetti(): void {
    this.confetti.forEach(c => {
      const alpha = Math.max(0, 1 - (c.life / c.maxLife) * 0.5);
      this.particleCtx.save();
      this.particleCtx.translate(c.x, c.y);
      this.particleCtx.rotate(c.rotation);
      this.particleCtx.globalAlpha = alpha;
      this.particleCtx.fillStyle = c.color;

      if (c.shape === 'square') {
        this.particleCtx.fillRect(-c.size / 2, -c.size / 2, c.size, c.size);
      } else if (c.shape === 'circle') {
        this.particleCtx.beginPath();
        this.particleCtx.arc(0, 0, c.size / 2, 0, Math.PI * 2);
        this.particleCtx.fill();
      } else {
        // Strip/ribbon shape
        this.particleCtx.fillRect(-c.size / 2, -c.size / 6, c.size, c.size / 3);
      }

      this.particleCtx.restore();
    });
  }

  private showWinnerOverlay(): void {
    this.showingWinner = true;

    // Create winner overlay
    const overlay = document.createElement('div');
    overlay.id = 'winner-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      z-index: 1000001;
      pointer-events: none;
      animation: winnerPulse 0.5s ease-out;
    `;

    // Add keyframe animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes winnerPulse {
        0% { transform: scale(0.5); opacity: 0; }
        50% { transform: scale(1.1); }
        100% { transform: scale(1); opacity: 1; }
      }
      @keyframes winnerGlow {
        0%, 100% { text-shadow: 0 0 20px #FFD700, 0 0 40px #FFA500, 0 0 60px #FF6347; }
        50% { text-shadow: 0 0 40px #FFD700, 0 0 80px #FFA500, 0 0 120px #FF6347; }
      }
    `;
    document.head.appendChild(style);

    overlay.innerHTML = `
      <div style="
        font-family: 'Arial Black', Impact, sans-serif;
        font-size: 72px;
        font-weight: bold;
        color: #FFD700;
        text-shadow: 0 0 20px #FFD700, 0 0 40px #FFA500, 0 0 60px #FF6347, 3px 3px 0 #B8860B;
        -webkit-text-stroke: 5px black;
        paint-order: stroke fill;
        animation: winnerGlow 1s ease-in-out infinite;
        letter-spacing: 8px;
      ">WINNER!</div>
      <div style="
        font-family: Arial, sans-serif;
        font-size: 24px;
        color: #FFD700;
        margin-top: 20px;
        text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
      ">🎉 Congratulations! 🎉</div>
    `;

    document.body.appendChild(overlay);

    // Trigger confetti
    this.createConfettiBurst();

    // Play win sound
    this.playWinSound();
  }

  private playWinSound(): void {
    // Ensure audio is initialized
    this.ensureAudioInitialized();

    if (!this.audioContext) return;

    // Create a celebratory "ding ding ding" sound
    const playNote = (freq: number, delay: number, duration: number) => {
      const oscillator = this.audioContext!.createOscillator();
      const gainNode = this.audioContext!.createGain();

      oscillator.type = 'sine';
      oscillator.frequency.value = freq;

      gainNode.gain.setValueAtTime(0, this.audioContext!.currentTime + delay);
      gainNode.gain.linearRampToValueAtTime(0.3, this.audioContext!.currentTime + delay + 0.05);
      gainNode.gain.linearRampToValueAtTime(0, this.audioContext!.currentTime + delay + duration);

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext!.destination);

      oscillator.start(this.audioContext!.currentTime + delay);
      oscillator.stop(this.audioContext!.currentTime + delay + duration);
    };

    // Play ascending celebratory notes
    playNote(523.25, 0, 0.2);     // C5
    playNote(659.25, 0.15, 0.2);  // E5
    playNote(783.99, 0.3, 0.2);   // G5
    playNote(1046.50, 0.45, 0.4); // C6 (longer)
  }

  private fadeOut(): void {
    this.isFading = true;

    // Track completion event
    const totalTime = this.sessionStartTime > 0 ? Date.now() - this.sessionStartTime : 0;
    Analytics.trackEvent('scratch_completed', {
      total_time_ms: totalTime,
      total_scratch_count: this.scratchCount,
      device_type: this.deviceType,
      viewport_width: window.innerWidth,
      viewport_height: window.innerHeight
    });

    // Show winner overlay with confetti first
    this.showWinnerOverlay();

    // Delay the fade out to let winner animation play
    setTimeout(() => {
      this.canvas.style.transition = 'opacity 0.8s ease-out';
      this.canvas.style.opacity = '0';

      // Fade out winner overlay
      const overlay = document.getElementById('winner-overlay');
      if (overlay) {
        overlay.style.transition = 'opacity 0.8s ease-out';
        overlay.style.opacity = '0';
      }
    }, 1500);

    // Keep particle canvas visible longer for confetti
    setTimeout(() => {
      this.particleCanvas.style.transition = 'opacity 1s ease-out';
      this.particleCanvas.style.opacity = '0';
    }, 2000);

    setTimeout(() => {
      this.cleanup();
    }, 3000);
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

    // Remove winner overlay
    const overlay = document.getElementById('winner-overlay');
    if (overlay && overlay.parentNode) {
      overlay.parentNode.removeChild(overlay);
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
    this.updateConfetti();
    this.drawParticles();
    this.drawConfetti();

    this.animationId = requestAnimationFrame(() => this.animate());
  }
}

// Auto-initialize when script loads
new ScratchOff();

// Export for module usage
export { ScratchOff };
