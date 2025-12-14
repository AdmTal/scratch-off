var A = Object.defineProperty;
var F = (u, t, e) => t in u ? A(u, t, { enumerable: !0, configurable: !0, writable: !0, value: e }) : u[t] = e;
var c = (u, t, e) => F(u, typeof t != "symbol" ? t + "" : t, e);
const E = "G-552PMDLPMQ", T = {
  initialized: !1,
  /**
   * Initialize Google Analytics if not already present
   * This allows tracking when the script is embedded on external sites
   */
  init() {
    if (this.initialized) return;
    if (this.initialized = !0, window.dataLayer = window.dataLayer || [], typeof window.gtag != "function" && (window.gtag = function(...e) {
      window.dataLayer.push(e);
    }), !document.querySelector('script[src*="googletagmanager.com/gtag/js"]')) {
      const t = document.createElement("script");
      t.async = !0, t.src = `https://www.googletagmanager.com/gtag/js?id=${E}`, document.head.appendChild(t);
    }
    window.gtag("js", /* @__PURE__ */ new Date()), window.gtag("config", E, {
      // Don't send automatic page view - we'll send our own with host info
      send_page_view: !1
    }), this.trackEvent("page_view", {
      page_title: document.title,
      page_location: window.location.href,
      page_path: window.location.pathname
    });
  },
  /**
   * Track an event with host information for cross-domain analytics
   */
  trackEvent(u, t = {}) {
    if (typeof window.gtag != "function") return;
    const e = {
      ...t,
      host_name: window.location.hostname,
      host_url: window.location.origin,
      page_referrer: document.referrer || "direct",
      embedded: window.self !== window.top
      // true if in iframe
    };
    window.gtag("event", u, e);
  }
};
class L {
  constructor() {
    c(this, "canvas");
    c(this, "ctx");
    c(this, "scratchCanvas");
    c(this, "scratchCtx");
    c(this, "particleCanvas");
    c(this, "particleCtx");
    c(this, "particles", []);
    c(this, "confetti", []);
    c(this, "showingWinner", !1);
    c(this, "isMouseScratching", !1);
    c(this, "mouseLastX", 0);
    c(this, "mouseLastY", 0);
    c(this, "activeTouches", /* @__PURE__ */ new Map());
    c(this, "scratchRadius", 30);
    c(this, "isDesktop", !1);
    c(this, "totalPixels", 0);
    c(this, "scratchedPixels", 0);
    c(this, "fadeThreshold", 0.6);
    c(this, "isFading", !1);
    c(this, "audioContext", null);
    c(this, "audioInitialized", !1);
    c(this, "animationId", null);
    c(this, "shapes", []);
    c(this, "baseColor", "#C0C0C0");
    c(this, "accentColors", ["#A8A8A8", "#B8B8B8", "#D0D0D0", "#BEBEBE"]);
    c(this, "lastScratchDirection", null);
    // Coin cursor SVG (golden coin) - small version for mobile (32x32)
    c(this, "coinCursorSmall", `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 32 32'%3E%3Cellipse cx='16' cy='18' rx='14' ry='10' fill='%23B8860B'/%3E%3Cellipse cx='16' cy='14' rx='14' ry='10' fill='%23FFD700'/%3E%3Cellipse cx='16' cy='14' rx='11' ry='7' fill='%23FFA500'/%3E%3Cellipse cx='16' cy='14' rx='11' ry='7' fill='url(%23shine)'/%3E%3Ctext x='16' y='17' font-family='Arial' font-size='10' font-weight='bold' fill='%23B8860B' text-anchor='middle'%3E%24%3C/text%3E%3Cdefs%3E%3ClinearGradient id='shine' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' style='stop-color:%23FFE66D;stop-opacity:0.8'/%3E%3Cstop offset='50%25' style='stop-color:%23FFD700;stop-opacity:0'/%3E%3Cstop offset='100%25' style='stop-color:%23B8860B;stop-opacity:0.3'/%3E%3C/linearGradient%3E%3C/defs%3E%3C/svg%3E") 16 16, crosshair`);
    // Large version for desktop (72x72 = 2.25x size, 75% of original 96x96)
    c(this, "coinCursorLarge", `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='72' height='72' viewBox='0 0 72 72'%3E%3Cellipse cx='36' cy='41' rx='32' ry='23' fill='%23B8860B'/%3E%3Cellipse cx='36' cy='32' rx='32' ry='23' fill='%23FFD700'/%3E%3Cellipse cx='36' cy='32' rx='25' ry='16' fill='%23FFA500'/%3E%3Cellipse cx='36' cy='32' rx='25' ry='16' fill='url(%23shine)'/%3E%3Ctext x='36' y='38' font-family='Arial' font-size='23' font-weight='bold' fill='%23B8860B' text-anchor='middle'%3E%24%3C/text%3E%3Cdefs%3E%3ClinearGradient id='shine' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' style='stop-color:%23FFE66D;stop-opacity:0.8'/%3E%3Cstop offset='50%25' style='stop-color:%23FFD700;stop-opacity:0'/%3E%3Cstop offset='100%25' style='stop-color:%23B8860B;stop-opacity:0.3'/%3E%3C/linearGradient%3E%3C/defs%3E%3C/svg%3E") 36 36, crosshair`);
    c(this, "coinCursor", this.coinCursorSmall);
    c(this, "scratchDirectionChangeCount", 0);
    // Analytics tracking state
    c(this, "hasStartedScratching", !1);
    c(this, "progressMilestonesReached", /* @__PURE__ */ new Set());
    c(this, "sessionStartTime", 0);
    c(this, "scratchCount", 0);
    c(this, "deviceType", "mouse");
    // Random lottery ticket titles
    c(this, "ticketTitles", [
      "MEGA MILLIONS",
      "CASH BLAST",
      "LUCKY 7s",
      "GOLD RUSH",
      "TRIPLE JACKPOT",
      "DIAMOND MINE",
      "FAST CASH",
      "SET FOR LIFE",
      "WILD CHERRY CROSSWORD",
      "CASH EXPLOSION",
      "LUCKY STREAK",
      "MONEY BAGS",
      "GOLDEN TICKET",
      "5X THE CASH",
      "RUBY RICHES",
      "INSTANT MILLIONAIRE",
      "CASH FRENZY",
      "TRIPLE 777",
      "20X THE MONEY",
      "WINNER WINNER",
      "CASH CACHE",
      "LUCKY RELOAD",
      "PAGE OF FORTUNE"
    ]);
    c(this, "ticketTitle");
    this.canvas = document.createElement("canvas"), this.ctx = this.canvas.getContext("2d"), this.scratchCanvas = document.createElement("canvas"), this.scratchCtx = this.scratchCanvas.getContext("2d"), this.particleCanvas = document.createElement("canvas"), this.particleCtx = this.particleCanvas.getContext("2d"), this.ticketTitle = this.ticketTitles[Math.floor(Math.random() * this.ticketTitles.length)], this.init();
  }
  init() {
    document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", () => this.setup()) : setTimeout(() => this.setup(), 100);
  }
  setup() {
    window.scrollTo(0, 0);
    const t = window.innerWidth, e = window.innerHeight, i = window.innerWidth >= 768, s = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    this.isDesktop = i && !s, this.isDesktop ? (this.coinCursor = this.coinCursorLarge, this.scratchRadius = 68) : (this.coinCursor = this.coinCursorSmall, this.scratchRadius = 30), this.canvas.width = t, this.canvas.height = e, this.canvas.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 999999;
      cursor: ${this.coinCursor};
      touch-action: none;
    `, this.scratchCanvas.width = t, this.scratchCanvas.height = e, this.particleCanvas.width = t, this.particleCanvas.height = e, this.particleCanvas.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 1000000;
      pointer-events: none;
      cursor: ${this.coinCursor};
    `, this.totalPixels = t * e, this.detectElements(), this.drawScratchLayer(), document.body.appendChild(this.canvas), document.body.appendChild(this.particleCanvas), document.body.style.overflow = "hidden", this.bindEvents(), this.initAudioOnInteraction(), T.init(), this.animate();
  }
  initAudioOnInteraction() {
    document.addEventListener("mousedown", this.ensureAudioInitialized.bind(this), { capture: !0 }), document.addEventListener("touchstart", this.ensureAudioInitialized.bind(this), { capture: !0 });
  }
  ensureAudioInitialized() {
    if (!this.audioInitialized) {
      this.audioInitialized = !0;
      try {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)(), this.audioContext.state === "suspended" && this.audioContext.resume();
      } catch {
      }
    }
  }
  detectElements() {
    const t = document.body.querySelectorAll("*"), e = window.innerWidth, i = window.innerHeight;
    let s = 0;
    t.forEach((a) => {
      if (a === this.canvas) return;
      const o = a.getBoundingClientRect();
      if (o.width > 0 && o.height > 0 && o.top < i && o.bottom > 0 && o.left < e && o.right > 0) {
        const n = a.tagName.toLowerCase(), h = window.getComputedStyle(a);
        if (h.display === "none" || h.visibility === "hidden")
          return;
        let r = this.getShapeColor(n, h);
        const l = parseFloat(h.borderTopWidth) || 0, d = parseFloat(h.borderRightWidth) || 0, x = parseFloat(h.borderBottomWidth) || 0, f = parseFloat(h.borderLeftWidth) || 0, p = l + d + x + f > 0, g = h.borderColor || "#888888";
        let C = !1, v = 0, m = [], b = parseFloat(h.fontSize) || 16, S = parseFloat(h.lineHeight) || b * 1.2;
        if (["p", "span", "h1", "h2", "h3", "h4", "h5", "h6", "li", "a", "button", "label", "td", "th", "strong", "em", "code", "pre"].includes(n)) {
          const M = Array.from(a.childNodes).filter((y) => {
            var w;
            return y.nodeType === Node.TEXT_NODE && ((w = y.textContent) == null ? void 0 : w.trim());
          });
          M.length > 0 && (C = !0, v = M.map((y) => {
            var w;
            return ((w = y.textContent) == null ? void 0 : w.trim()) || "";
          }).join("").length, m = this.getTextLineRects(a, M));
        }
        this.isSignificantElement(n, o) && this.shapes.push({
          x: Math.max(0, o.left),
          y: Math.max(0, o.top),
          width: Math.min(o.width, e - o.left),
          height: Math.min(o.height, i - o.top),
          color: r,
          type: n,
          hasBorder: p,
          borderColor: g,
          hasText: C,
          textLength: v,
          textLines: m,
          fontSize: b,
          lineHeight: S,
          domIndex: s++
        });
      }
    }), this.shapes.sort((a, o) => {
      const n = o.width * o.height - a.width * a.height;
      return n !== 0 ? n : o.domIndex - a.domIndex;
    });
  }
  isSignificantElement(t, e) {
    const i = [
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "p",
      "div",
      "section",
      "article",
      "header",
      "footer",
      "nav",
      "main",
      "aside",
      "img",
      "video",
      "canvas",
      "svg",
      "button",
      "a",
      "input",
      "textarea",
      "select",
      "ul",
      "ol",
      "li",
      "table",
      "form",
      "span",
      "strong",
      "em",
      "code",
      "pre"
    ];
    return e.width < 10 || e.height < 10 ? !1 : i.includes(t);
  }
  getTextLineRects(t, e) {
    const i = [], s = document.createRange();
    return e.forEach((a) => {
      if (!a.textContent) return;
      a.textContent, s.selectNodeContents(a);
      const o = s.getClientRects();
      for (let n = 0; n < o.length; n++) {
        const h = o[n];
        if (h.width > 5 && h.height > 5) {
          const r = i.find(
            (l) => Math.abs(l.y - h.top) < h.height * 0.5
          );
          if (r) {
            const l = Math.min(r.x, h.left), d = Math.max(r.x + r.width, h.right);
            r.x = l, r.width = d - l;
          } else
            i.push({
              x: h.left,
              y: h.top,
              width: h.width,
              height: h.height
            });
        }
      }
    }), i.sort((a, o) => a.y - o.y), i;
  }
  getContrastColor(t) {
    const e = t.replace("#", ""), i = parseInt(e.substring(0, 2), 16), s = parseInt(e.substring(2, 4), 16), a = parseInt(e.substring(4, 6), 16);
    return (0.299 * i + 0.587 * s + 0.114 * a) / 255 > 0.5 ? "rgba(40, 40, 40, 0.7)" : "rgba(230, 230, 230, 0.7)";
  }
  formatElementLabel(t) {
    return `<${t} />`;
  }
  getShapeColor(t, e) {
    const i = {
      h1: "#888888",
      h2: "#909090",
      h3: "#989898",
      h4: "#A0A0A0",
      h5: "#A8A8A8",
      h6: "#B0B0B0"
    };
    return i[t] ? i[t] : ["img", "video", "svg", "canvas"].includes(t) ? "#707070" : ["button", "a", "input", "select", "textarea"].includes(t) ? "#858585" : ["p", "span", "li"].includes(t) ? "#A5A5A5" : this.accentColors[Math.floor(Math.random() * this.accentColors.length)];
  }
  drawScratchLayer() {
    const t = this.canvas.width, e = this.canvas.height;
    this.ctx.fillStyle = this.baseColor, this.ctx.fillRect(0, 0, t, e), this.shapes.forEach((i) => {
      this.ctx.fillStyle = i.color;
      const s = Math.min(4, i.width / 4, i.height / 4);
      this.roundRect(i.x, i.y, i.width, i.height, s);
    }), this.addTexture(), this.drawLotteryDecorations(), this.drawElementLabels(), this.drawBorderOutlines(), this.drawTextPlaceholders(), this.scratchCtx.fillStyle = "#FFFFFF", this.scratchCtx.fillRect(0, 0, t, e);
  }
  generateSerialNumber() {
    const t = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let e = "";
    for (let i = 0; i < 12; i++)
      (i === 4 || i === 8) && (e += "-"), e += t[Math.floor(Math.random() * t.length)];
    return e;
  }
  drawLotteryDecorations() {
    const t = this.canvas.width, e = this.canvas.height, i = 50;
    this.ctx.fillStyle = "rgba(80, 60, 20, 0.85)", this.ctx.fillRect(0, 0, t, i);
    const s = this.ctx.createLinearGradient(0, i - 4, 0, i);
    s.addColorStop(0, "#FFD700"), s.addColorStop(0.5, "#FFA500"), s.addColorStop(1, "#B8860B"), this.ctx.fillStyle = s, this.ctx.fillRect(0, i - 4, t, 4), this.ctx.font = 'bold 24px "Arial Black", "Impact", sans-serif', this.ctx.textAlign = "center", this.ctx.textBaseline = "middle", this.ctx.fillStyle = "#FFD700", this.ctx.fillText(this.ticketTitle, t / 2, i / 2 - 2), this.ctx.font = "18px Arial", this.ctx.fillText("★", t / 2 - 155, i / 2), this.ctx.fillText("★", t / 2 + 155, i / 2), this.ctx.font = "14px Arial", this.ctx.fillText("✦", t / 2 - 175, i / 2), this.ctx.fillText("✦", t / 2 + 175, i / 2);
    const a = this.generateSerialNumber();
    this.ctx.font = '10px "Courier New", monospace', this.ctx.textAlign = "right", this.ctx.fillStyle = "rgba(255, 215, 0, 0.7)", this.ctx.fillText(`SN: ${a}`, t - 15, 15), this.ctx.font = "bold 14px Arial, sans-serif", this.ctx.textAlign = "center", this.ctx.fillStyle = "rgba(60, 60, 60, 0.9)", this.ctx.fillText("Match 3 <div>s to WIN!", t / 2, i + 22);
    const o = e - 30;
    this.ctx.font = "9px Arial, sans-serif", this.ctx.textAlign = "left", this.ctx.fillStyle = "rgba(80, 80, 80, 0.7)", this.ctx.fillText("Odds of winning: 1 in 1", 15, o + 10), this.ctx.textAlign = "center", this.ctx.fillText("Must be 18+ to browse this website", t / 2, o + 10), this.ctx.save(), this.ctx.translate(t / 2, e / 2), this.ctx.rotate(-Math.PI / 6), this.ctx.font = "bold 48px Arial, sans-serif", this.ctx.fillStyle = "rgba(100, 100, 100, 0.08)", this.ctx.textAlign = "center", this.ctx.textBaseline = "middle", this.ctx.fillText("VOID IF TAMPERED", 0, 0), this.ctx.restore(), this.ctx.font = "bold 20px Arial, sans-serif", this.ctx.fillStyle = "rgba(255, 215, 0, 0.3)", this.ctx.textAlign = "left", this.ctx.fillText("$", 10, i + 50), this.ctx.textAlign = "right", this.ctx.fillText("$", t - 10, i + 50), this.ctx.textAlign = "left", this.ctx.fillText("$", 10, e - 50), this.ctx.textAlign = "right", this.ctx.fillText("$", t - 10, e - 50);
  }
  drawElementLabels() {
    this.ctx.textAlign = "center", this.ctx.textBaseline = "middle";
    const t = [], e = (i, s, a, o, n = 4) => {
      const h = {
        left: i - a / 2 - n,
        right: i + a / 2 + n,
        top: s - o / 2 - n,
        bottom: s + o / 2 + n
      };
      for (const r of t) {
        const l = {
          left: r.x - r.width / 2,
          right: r.x + r.width / 2,
          top: r.y - r.height / 2,
          bottom: r.y + r.height / 2
        };
        if (!(h.right < l.left || h.left > l.right || h.bottom < l.top || h.top > l.bottom))
          return !0;
      }
      return !1;
    };
    this.shapes.forEach((i) => {
      const s = this.formatElementLabel(i.type), a = this.getContrastColor(i.color), o = i.width * 0.8, n = i.height * 0.4;
      let h = Math.min(n, 24);
      h = Math.max(h, 8), this.ctx.font = `${h}px "SF Mono", "Monaco", "Inconsolata", "Roboto Mono", monospace`;
      let r = this.ctx.measureText(s).width;
      for (; r > o && h > 8; )
        h -= 1, this.ctx.font = `${h}px "SF Mono", "Monaco", "Inconsolata", "Roboto Mono", monospace`, r = this.ctx.measureText(s).width;
      if (h >= 8 && i.width >= 30 && i.height >= 16) {
        const l = i.x + i.width / 2, d = i.y + i.height / 2, x = h;
        if (e(l, d, r, x))
          return;
        this.ctx.fillStyle = a, this.ctx.fillText(s, l, d), t.push({
          x: l,
          y: d,
          width: r,
          height: x
        });
      }
    });
  }
  drawBorderOutlines() {
    this.shapes.forEach((t) => {
      if (!t.hasBorder) return;
      const e = 2, i = t.x + e, s = t.y + e, a = t.width - e * 2, o = t.height - e * 2;
      if (a <= 0 || o <= 0) return;
      this.ctx.save(), this.ctx.strokeStyle = "rgba(60, 60, 60, 0.6)", this.ctx.lineWidth = 2, this.ctx.setLineDash([6, 4]);
      const n = Math.min(4, a / 4, o / 4);
      this.ctx.beginPath(), this.ctx.moveTo(i + n, s), this.ctx.lineTo(i + a - n, s), this.ctx.quadraticCurveTo(i + a, s, i + a, s + n), this.ctx.lineTo(i + a, s + o - n), this.ctx.quadraticCurveTo(i + a, s + o, i + a - n, s + o), this.ctx.lineTo(i + n, s + o), this.ctx.quadraticCurveTo(i, s + o, i, s + o - n), this.ctx.lineTo(i, s + n), this.ctx.quadraticCurveTo(i, s, i + n, s), this.ctx.closePath(), this.ctx.stroke(), this.ctx.restore();
    });
  }
  drawTextPlaceholders() {
    this.ctx.save(), this.shapes.forEach((t) => {
      !t.hasText || t.textLines.length === 0 || t.textLines.forEach((e) => {
        this.ctx.fillStyle = "rgba(40, 40, 40, 0.6)";
        const i = e.height * 0.75, s = (e.height - i) / 2, a = Math.min(3, i / 4), o = e.x, n = e.y + s, h = e.width, r = i;
        this.ctx.beginPath(), this.ctx.moveTo(o + a, n), this.ctx.lineTo(o + h - a, n), this.ctx.quadraticCurveTo(o + h, n, o + h, n + a), this.ctx.lineTo(o + h, n + r - a), this.ctx.quadraticCurveTo(o + h, n + r, o + h - a, n + r), this.ctx.lineTo(o + a, n + r), this.ctx.quadraticCurveTo(o, n + r, o, n + r - a), this.ctx.lineTo(o, n + a), this.ctx.quadraticCurveTo(o, n, o + a, n), this.ctx.closePath(), this.ctx.fill();
      });
    }), this.ctx.restore();
  }
  roundRect(t, e, i, s, a) {
    this.ctx.beginPath(), this.ctx.moveTo(t + a, e), this.ctx.lineTo(t + i - a, e), this.ctx.quadraticCurveTo(t + i, e, t + i, e + a), this.ctx.lineTo(t + i, e + s - a), this.ctx.quadraticCurveTo(t + i, e + s, t + i - a, e + s), this.ctx.lineTo(t + a, e + s), this.ctx.quadraticCurveTo(t, e + s, t, e + s - a), this.ctx.lineTo(t, e + a), this.ctx.quadraticCurveTo(t, e, t + a, e), this.ctx.closePath(), this.ctx.fill();
  }
  addTexture() {
    const t = this.canvas.width, e = this.canvas.height, i = this.ctx.getImageData(0, 0, t, e), s = i.data;
    for (let a = 0; a < s.length; a += 4) {
      const o = (Math.random() - 0.5) * 30;
      s[a] = Math.max(0, Math.min(255, s[a] + o)), s[a + 1] = Math.max(0, Math.min(255, s[a + 1] + o)), s[a + 2] = Math.max(0, Math.min(255, s[a + 2] + o));
    }
    this.ctx.putImageData(i, 0, 0), this.ctx.strokeStyle = "rgba(255, 255, 255, 0.1)", this.ctx.lineWidth = 1;
    for (let a = 0; a < e; a += 3)
      Math.random() > 0.5 && (this.ctx.beginPath(), this.ctx.moveTo(0, a), this.ctx.lineTo(t, a), this.ctx.stroke());
    for (let a = 0; a < 500; a++) {
      const o = Math.random() * t, n = Math.random() * e, h = Math.random() * 2;
      this.ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.5})`, this.ctx.beginPath(), this.ctx.arc(o, n, h, 0, Math.PI * 2), this.ctx.fill();
    }
  }
  bindEvents() {
    this.canvas.addEventListener("mousedown", this.handleStart.bind(this)), this.canvas.addEventListener("mousemove", this.handleMove.bind(this)), this.canvas.addEventListener("mouseup", this.handleEnd.bind(this)), this.canvas.addEventListener("mouseleave", this.handleEnd.bind(this)), this.canvas.addEventListener("touchstart", this.handleTouchStart.bind(this), { passive: !1 }), this.canvas.addEventListener("touchmove", this.handleTouchMove.bind(this), { passive: !1 }), this.canvas.addEventListener("touchend", this.handleTouchEnd.bind(this), { passive: !1 }), this.canvas.addEventListener("touchcancel", this.handleTouchEnd.bind(this), { passive: !1 });
  }
  handleStart(t) {
    this.isMouseScratching = !0, this.mouseLastX = t.clientX, this.mouseLastY = t.clientY, this.scratch(t.clientX, t.clientY, this.mouseLastX, this.mouseLastY), this.mouseLastX = t.clientX, this.mouseLastY = t.clientY;
  }
  handleMove(t) {
    this.isMouseScratching && (this.scratch(t.clientX, t.clientY, this.mouseLastX, this.mouseLastY), this.mouseLastX = t.clientX, this.mouseLastY = t.clientY);
  }
  handleEnd() {
    this.isMouseScratching = !1;
  }
  handleTouchStart(t) {
    t.preventDefault(), this.deviceType = "touch";
    for (let e = 0; e < t.changedTouches.length; e++) {
      const i = t.changedTouches[e], s = {
        lastX: i.clientX,
        lastY: i.clientY
      };
      this.activeTouches.set(i.identifier, s), this.scratch(i.clientX, i.clientY, s.lastX, s.lastY);
    }
  }
  handleTouchMove(t) {
    t.preventDefault();
    for (let e = 0; e < t.changedTouches.length; e++) {
      const i = t.changedTouches[e], s = this.activeTouches.get(i.identifier);
      s && (this.scratch(i.clientX, i.clientY, s.lastX, s.lastY), s.lastX = i.clientX, s.lastY = i.clientY);
    }
  }
  handleTouchEnd(t) {
    t.preventDefault();
    for (let e = 0; e < t.changedTouches.length; e++) {
      const i = t.changedTouches[e];
      this.activeTouches.delete(i.identifier);
    }
  }
  hasPaintAt(t, e) {
    const i = Math.max(4, Math.floor(this.scratchRadius / 3)), s = Math.max(0, Math.floor(t - i / 2)), a = Math.max(0, Math.floor(e - i / 2)), o = Math.min(i, this.canvas.width - s), n = Math.min(i, this.canvas.height - a);
    if (o <= 0 || n <= 0) return !1;
    try {
      const r = this.ctx.getImageData(s, a, o, n).data;
      for (let l = 3; l < r.length; l += 4)
        if (r[l] > 0)
          return !0;
    } catch {
      return !0;
    }
    return !1;
  }
  scratch(t, e, i, s) {
    if (this.isFading) return;
    this.hasStartedScratching || (this.hasStartedScratching = !0, this.sessionStartTime = Date.now(), T.trackEvent("scratch_started", {
      device_type: this.deviceType,
      viewport_width: window.innerWidth,
      viewport_height: window.innerHeight
    })), this.scratchCount++;
    const a = this.hasPaintAt(t, e), o = t - i, n = e - s;
    let h;
    Math.abs(n) > Math.abs(o) ? h = n > 0 ? "down" : "up" : h = o > 0 ? "right" : "left";
    const r = this.lastScratchDirection !== null && this.lastScratchDirection !== h;
    r && this.scratchDirectionChangeCount++, this.lastScratchDirection = h, a && (this.playScratchSound(r), this.createParticles(t, e)), this.ctx.globalCompositeOperation = "destination-out", this.drawIrregularLine(this.ctx, i, s, t, e), this.drawIrregularScratch(this.ctx, t, e), this.ctx.globalCompositeOperation = "source-over", this.scratchCtx.fillStyle = "#000000", this.drawIrregularLine(this.scratchCtx, i, s, t, e), this.drawIrregularScratch(this.scratchCtx, t, e), Math.random() < 0.1 && this.checkProgress();
  }
  drawIrregularScratch(t, e, i) {
    const s = 8 + Math.floor(Math.random() * 5), a = Math.PI * 2 / s, o = Math.random() * Math.PI * 2;
    t.beginPath();
    for (let n = 0; n <= s; n++) {
      const h = o + n * a, r = 0.7 + Math.random() * 0.3, l = this.scratchRadius * r, d = e + Math.cos(h) * l, x = i + Math.sin(h) * l;
      n === 0 ? t.moveTo(d, x) : t.lineTo(d, x);
    }
    t.closePath(), t.fill();
  }
  drawIrregularLine(t, e, i, s, a) {
    const o = s - e, n = a - i, h = Math.sqrt(o * o + n * n);
    if (h < 1) return;
    const r = -n / h, l = o / h, d = Math.max(4, Math.floor(h / 8)), x = [];
    for (let f = 0; f <= d; f++) {
      const p = f / d, g = e + o * p, C = i + n * p, v = 0.8 + Math.random() * 0.3, m = this.scratchRadius * v;
      x.push({
        x: g + r * m,
        y: C + l * m
      });
    }
    for (let f = d; f >= 0; f--) {
      const p = f / d, g = e + o * p, C = i + n * p, v = 0.8 + Math.random() * 0.3, m = this.scratchRadius * v;
      x.push({
        x: g - r * m,
        y: C - l * m
      });
    }
    t.beginPath(), t.moveTo(x[0].x, x[0].y);
    for (let f = 1; f < x.length; f++)
      t.lineTo(x[f].x, x[f].y);
    t.closePath(), t.fill();
  }
  createParticles(t, e) {
    const i = 3 + Math.floor(Math.random() * 5);
    for (let s = 0; s < i; s++) {
      const a = Math.random() * Math.PI * 2, o = 2 + Math.random() * 4, n = ["#C0C0C0", "#A8A8A8", "#B8B8B8", "#D0D0D0", "#909090"];
      this.particles.push({
        x: t + (Math.random() - 0.5) * this.scratchRadius,
        y: e + (Math.random() - 0.5) * this.scratchRadius,
        vx: Math.cos(a) * o,
        vy: Math.sin(a) * o + 5,
        // Stronger downward bias for faster fall
        size: 2 + Math.random() * 4,
        color: n[Math.floor(Math.random() * n.length)],
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.3,
        life: 1,
        maxLife: 30 + Math.random() * 30,
        // Shorter lifespan
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
  updateParticles() {
    for (let t = this.particles.length - 1; t >= 0; t--) {
      const e = this.particles[t];
      e.vy += 0.4, e.vx *= 0.98, e.vy *= 0.98, e.vx += (Math.random() - 0.5) * 0.15, e.x += e.vx, e.y += e.vy, e.rotation += e.rotationSpeed, e.life++, (e.y > this.canvas.height + 20 || e.life > e.maxLife) && this.particles.splice(t, 1);
    }
  }
  drawParticles() {
    this.particleCtx.clearRect(0, 0, this.particleCanvas.width, this.particleCanvas.height), this.particles.forEach((t) => {
      const e = 1 - t.life / t.maxLife;
      this.particleCtx.save(), this.particleCtx.translate(t.x, t.y), this.particleCtx.rotate(t.rotation), this.particleCtx.fillStyle = t.color, this.particleCtx.globalAlpha = e;
      const i = t.size * 0.3, s = t.shapeOffsets;
      this.particleCtx.beginPath(), this.particleCtx.moveTo(-t.size / 2 + s[0] * i, -t.size / 3), this.particleCtx.lineTo(-t.size / 4, -t.size / 2 + s[1] * i), this.particleCtx.lineTo(t.size / 4, -t.size / 2 + s[2] * i), this.particleCtx.lineTo(t.size / 2 + s[3] * i, -t.size / 4), this.particleCtx.lineTo(t.size / 2, t.size / 4 + s[4] * i), this.particleCtx.lineTo(t.size / 4, t.size / 2), this.particleCtx.lineTo(-t.size / 4, t.size / 2 + s[5] * i), this.particleCtx.lineTo(-t.size / 2, t.size / 4), this.particleCtx.closePath(), this.particleCtx.fill(), this.particleCtx.restore();
    });
  }
  playScratchSound(t = !1) {
    if (this.ensureAudioInitialized(), !this.audioContext)
      return;
    const e = 0.02 + Math.random() * 0.015, i = this.audioContext.sampleRate, s = Math.floor(i * e), a = this.audioContext.createBuffer(1, s, i), o = a.getChannelData(0);
    for (let f = 0; f < s; f++) {
      const p = f / s, g = Math.pow(Math.sin(p * Math.PI), 1.5);
      o[f] = (Math.random() * 2 - 1) * 0.15 * g;
    }
    const n = this.audioContext.createBufferSource();
    n.buffer = a;
    const h = t ? 1800 : 1200, r = t ? 600 : 400, l = this.audioContext.createBiquadFilter();
    l.type = "bandpass", l.frequency.value = h + Math.random() * r, l.Q.value = t ? 1.2 : 0.8;
    const d = this.audioContext.createBiquadFilter();
    d.type = "lowpass", d.frequency.value = 2500, d.Q.value = 0.5;
    const x = this.audioContext.createGain();
    x.gain.value = t ? 0.04 : 0.025, n.connect(l), l.connect(d), d.connect(x), x.connect(this.audioContext.destination), n.start();
  }
  checkProgress() {
    const e = this.scratchCtx.getImageData(
      0,
      0,
      this.scratchCanvas.width,
      this.scratchCanvas.height
    ).data;
    let i = 0;
    for (let n = 0; n < e.length; n += 400)
      e[n] === 0 && i++;
    const s = Math.floor(e.length / 400), a = i / s, o = [25, 50, 75];
    for (const n of o) {
      const h = n / 100;
      if (a >= h && !this.progressMilestonesReached.has(n)) {
        this.progressMilestonesReached.add(n);
        const r = this.sessionStartTime > 0 ? Date.now() - this.sessionStartTime : 0;
        T.trackEvent("scratch_progress", {
          progress_percent: n,
          elapsed_time_ms: r,
          scratch_count: this.scratchCount,
          device_type: this.deviceType
        });
      }
    }
    a >= this.fadeThreshold && !this.isFading && this.fadeOut();
  }
  createConfettiBurst() {
    const t = this.canvas.width, e = this.canvas.height, i = ["#FFD700", "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7", "#DDA0DD", "#98D8C8", "#F7DC6F", "#BB8FCE"], s = ["square", "circle", "strip"], a = [
      { x: t * 0.2, y: e * 0.3 },
      { x: t * 0.5, y: e * 0.2 },
      { x: t * 0.8, y: e * 0.3 },
      { x: t * 0.3, y: e * 0.5 },
      { x: t * 0.7, y: e * 0.5 }
    ];
    for (const o of a)
      for (let n = 0; n < 30; n++) {
        const h = Math.random() * Math.PI * 2, r = 3 + Math.random() * 8;
        this.confetti.push({
          x: o.x + (Math.random() - 0.5) * 100,
          y: o.y + (Math.random() - 0.5) * 50,
          vx: Math.cos(h) * r,
          vy: Math.sin(h) * r - 5,
          // Initial upward burst
          size: 6 + Math.random() * 8,
          color: i[Math.floor(Math.random() * i.length)],
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() - 0.5) * 0.3,
          wobble: Math.random() * Math.PI * 2,
          wobbleSpeed: 0.05 + Math.random() * 0.1,
          life: 0,
          maxLife: 150 + Math.random() * 100,
          shape: s[Math.floor(Math.random() * s.length)]
        });
      }
  }
  updateConfetti() {
    for (let t = this.confetti.length - 1; t >= 0; t--) {
      const e = this.confetti[t];
      e.vy += 0.15, e.vx *= 0.99, e.vy *= 0.99, e.wobble += e.wobbleSpeed, e.vx += Math.sin(e.wobble) * 0.2, e.x += e.vx, e.y += e.vy, e.rotation += e.rotationSpeed, e.life++, (e.y > this.canvas.height + 50 || e.life > e.maxLife) && this.confetti.splice(t, 1);
    }
  }
  drawConfetti() {
    this.confetti.forEach((t) => {
      const e = Math.max(0, 1 - t.life / t.maxLife * 0.5);
      this.particleCtx.save(), this.particleCtx.translate(t.x, t.y), this.particleCtx.rotate(t.rotation), this.particleCtx.globalAlpha = e, this.particleCtx.fillStyle = t.color, t.shape === "square" ? this.particleCtx.fillRect(-t.size / 2, -t.size / 2, t.size, t.size) : t.shape === "circle" ? (this.particleCtx.beginPath(), this.particleCtx.arc(0, 0, t.size / 2, 0, Math.PI * 2), this.particleCtx.fill()) : this.particleCtx.fillRect(-t.size / 2, -t.size / 6, t.size, t.size / 3), this.particleCtx.restore();
    });
  }
  showWinnerOverlay() {
    this.showingWinner = !0;
    const t = document.createElement("div");
    t.id = "winner-overlay", t.style.cssText = `
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
    const e = document.createElement("style");
    e.textContent = `
      @keyframes winnerPulse {
        0% { transform: scale(0.5); opacity: 0; }
        50% { transform: scale(1.1); }
        100% { transform: scale(1); opacity: 1; }
      }
      @keyframes winnerGlow {
        0%, 100% { text-shadow: 0 0 20px #FFD700, 0 0 40px #FFA500, 0 0 60px #FF6347; }
        50% { text-shadow: 0 0 40px #FFD700, 0 0 80px #FFA500, 0 0 120px #FF6347; }
      }
    `, document.head.appendChild(e), t.innerHTML = `
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
    `, document.body.appendChild(t), this.createConfettiBurst(), this.playWinSound();
  }
  playWinSound() {
    if (this.ensureAudioInitialized(), !this.audioContext) return;
    const t = (e, i, s) => {
      const a = this.audioContext.createOscillator(), o = this.audioContext.createGain();
      a.type = "sine", a.frequency.value = e, o.gain.setValueAtTime(0, this.audioContext.currentTime + i), o.gain.linearRampToValueAtTime(0.3, this.audioContext.currentTime + i + 0.05), o.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + i + s), a.connect(o), o.connect(this.audioContext.destination), a.start(this.audioContext.currentTime + i), a.stop(this.audioContext.currentTime + i + s);
    };
    t(523.25, 0, 0.2), t(659.25, 0.15, 0.2), t(783.99, 0.3, 0.2), t(1046.5, 0.45, 0.4);
  }
  fadeOut() {
    this.isFading = !0;
    const t = this.sessionStartTime > 0 ? Date.now() - this.sessionStartTime : 0;
    T.trackEvent("scratch_completed", {
      total_time_ms: t,
      total_scratch_count: this.scratchCount,
      device_type: this.deviceType,
      viewport_width: window.innerWidth,
      viewport_height: window.innerHeight
    }), this.showWinnerOverlay(), setTimeout(() => {
      this.canvas.style.transition = "opacity 0.8s ease-out", this.canvas.style.opacity = "0";
      const e = document.getElementById("winner-overlay");
      e && (e.style.transition = "opacity 0.8s ease-out", e.style.opacity = "0");
    }, 1500), setTimeout(() => {
      this.particleCanvas.style.transition = "opacity 1s ease-out", this.particleCanvas.style.opacity = "0";
    }, 2e3), setTimeout(() => {
      this.cleanup();
    }, 3e3);
  }
  cleanup() {
    this.animationId && cancelAnimationFrame(this.animationId), this.canvas.parentNode && this.canvas.parentNode.removeChild(this.canvas), this.particleCanvas.parentNode && this.particleCanvas.parentNode.removeChild(this.particleCanvas);
    const t = document.getElementById("winner-overlay");
    t && t.parentNode && t.parentNode.removeChild(t), document.body.style.overflow = "", this.audioContext && this.audioContext.close();
  }
  animate() {
    this.updateParticles(), this.updateConfetti(), this.drawParticles(), this.drawConfetti(), this.animationId = requestAnimationFrame(() => this.animate());
  }
}
new L();
export {
  L as ScratchOff
};
