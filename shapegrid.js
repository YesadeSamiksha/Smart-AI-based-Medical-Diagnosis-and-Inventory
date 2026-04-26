/**
 * ShapeGrid Background — Hexagon grid with light-green glow hover effect
 * Inspired by https://www.reactbits.dev/backgrounds/shape-grid
 * Pure Vanilla JS, zero dependencies.
 */
class ShapeGridBackground {
    constructor(containerId = 'shapegrid-container') {
        this.container = document.getElementById(containerId);
        if (!this.container) return;

        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.style.display = 'block';
        this.container.appendChild(this.canvas);

        // ——— Visual tuning ———
        this.bgColor     = '#0a0a0a';                   // Near-black background
        this.lineColor   = 'rgba(255, 255, 255, 0.06)'; // Very faint grid
        this.glowColor   = [74, 222, 128];               // Light-green RGB (#4ade80)
        this.shapeSize   = 50;                           // Hex cell radius
        this.hoverRadius = 180;                          // Glow radius in px

        this.cells = [];
        this.mouseX = -9999;
        this.mouseY = -9999;
        this.smoothX = -9999;
        this.smoothY = -9999;

        // Bindings
        this._resize     = this._resize.bind(this);
        this._mouseMove  = this._mouseMove.bind(this);
        this._mouseLeave = this._mouseLeave.bind(this);
        this._loop        = this._loop.bind(this);

        window.addEventListener('resize', this._resize);
        document.addEventListener('mousemove', this._mouseMove);
        document.addEventListener('mouseleave', this._mouseLeave);

        this._resize();
        requestAnimationFrame(this._loop);
    }

    /* ——— Grid setup ——— */
    _resize() {
        const dpr = window.devicePixelRatio || 1;
        const w = window.innerWidth;
        const h = window.innerHeight;

        this.canvas.width  = w * dpr;
        this.canvas.height = h * dpr;
        this.canvas.style.width  = w + 'px';
        this.canvas.style.height = h + 'px';
        this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        this.displayW = w;
        this.displayH = h;
        this._buildGrid();
    }

    _buildGrid() {
        this.cells = [];
        const s   = this.shapeSize;
        const hW  = Math.sqrt(3) * s;   // hex width
        const rowH = s * 1.5;           // vertical spacing

        const cols = Math.ceil(this.displayW / hW) + 2;
        const rows = Math.ceil(this.displayH / rowH) + 2;

        for (let r = -1; r <= rows; r++) {
            for (let c = -1; c <= cols; c++) {
                let x = c * hW;
                let y = r * rowH;
                if (Math.abs(r % 2) === 1) x += hW / 2;
                this.cells.push({ x, y, glow: 0 });
            }
        }
    }

    /* ——— Input ——— */
    _mouseMove(e) {
        this.mouseX = e.clientX;
        this.mouseY = e.clientY;
    }
    _mouseLeave() {
        this.mouseX = -9999;
        this.mouseY = -9999;
    }

    /* ——— Drawing ——— */
    _hexPath(cx, cy, r) {
        const ctx = this.ctx;
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const a = (Math.PI / 3) * i - Math.PI / 6;
            const px = cx + r * Math.cos(a);
            const py = cy + r * Math.sin(a);
            i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
        }
        ctx.closePath();
    }

    _loop() {
        const ctx = this.ctx;
        const W = this.displayW;
        const H = this.displayH;

        // Clear
        ctx.fillStyle = this.bgColor;
        ctx.fillRect(0, 0, W, H);

        // Smooth mouse tracking (lerp)
        this.smoothX += (this.mouseX - this.smoothX) * 0.12;
        this.smoothY += (this.mouseY - this.smoothY) * 0.12;
        const mx = this.smoothX;
        const my = this.smoothY;

        const R = this.hoverRadius;
        const [gr, gg, gb] = this.glowColor;
        const innerSize = this.shapeSize * 0.92;

        for (let i = 0; i < this.cells.length; i++) {
            const c = this.cells[i];
            const dx = c.x - mx;
            const dy = c.y - my;
            const dist = Math.sqrt(dx * dx + dy * dy);

            // Target glow intensity based on proximity
            let target = 0;
            if (dist < R) {
                target = Math.pow(1 - dist / R, 1.8);     // ease-out curve
            }

            // Smoothly animate glow (fast attack, slow decay → trail effect)
            if (target > c.glow) {
                c.glow += (target - c.glow) * 0.3;        // fast rise
            } else {
                c.glow += (target - c.glow) * 0.06;       // slow fade → trail
            }

            this._hexPath(c.x, c.y, innerSize);

            // Outline (always visible, slightly brighter near cursor)
            const lineAlpha = 0.06 + c.glow * 0.25;
            ctx.strokeStyle = `rgba(${gr}, ${gg}, ${gb}, ${lineAlpha})`;
            ctx.lineWidth = 1;
            ctx.stroke();

            // Fill glow
            if (c.glow > 0.005) {
                ctx.fillStyle = `rgba(${gr}, ${gg}, ${gb}, ${c.glow * 0.22})`;
                ctx.fill();
            }
        }

        requestAnimationFrame(this._loop);
    }
}

/* ——— Auto-init ——— */
(function initShapeGrid() {
    function boot() {
        // Inject critical CSS
        const style = document.createElement('style');
        style.textContent = `
            #shapegrid-container {
                position: fixed;
                inset: 0;
                z-index: -1;
                overflow: hidden;
                pointer-events: none;
                background: #0a0a0a;
            }
            #shapegrid-container canvas { pointer-events: none; }
            body { background: transparent !important; }
        `;
        document.head.appendChild(style);

        let el = document.getElementById('shapegrid-container');
        if (!el) {
            el = document.createElement('div');
            el.id = 'shapegrid-container';
            document.body.prepend(el);
        }
        if (!window._shapeGrid) {
            window._shapeGrid = new ShapeGridBackground('shapegrid-container');
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot);
    } else {
        boot();
    }
})();
