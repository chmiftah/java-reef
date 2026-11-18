<script>
  let canvasEl = $state();
  let timecodeStr = $state("00:00:00:00");
  let heroPhotoLoaded = $state(true);

  $effect(() => {
    if (!canvasEl) return;
    const cv = canvasEl;
    const ctx = cv.getContext("2d");
    let W = 0, H = 0, dpr = 1;
    let animId = null;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function size() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = cv.clientWidth;
      H = cv.clientHeight;
      cv.width = W * dpr;
      cv.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    size();
    window.addEventListener("resize", size);

    const layers = [
      { y: 0.5, amp: 4, len: 180, sp: 0.25, col: "#1d5459" },
      { y: 0.57, amp: 7, len: 260, sp: 0.35, col: "#1a4a4f" },
      { y: 0.65, amp: 12, len: 340, sp: 0.5, col: "#143c41" },
      { y: 0.75, amp: 18, len: 420, sp: 0.7, col: "#0f3035" },
      { y: 0.87, amp: 24, len: 520, sp: 0.95, col: "#0b2226" }
    ];

    function wave(x, t, L) {
      return (
        Math.sin((x / L.len) * 6.283 + t * L.sp) +
        0.45 * Math.sin((x / (L.len * 0.47)) * 6.283 - t * L.sp * 1.3)
      );
    }

    function draw(t) {
      if (!ctx || W === 0 || H === 0) return;
      const sky = ctx.createLinearGradient(0, 0, 0, H * 0.5);
      sky.addColorStop(0, "#102a30");
      sky.addColorStop(0.6, "#3c5655");
      sky.addColorStop(1, "#d98a4a");
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, W, H);

      // sun
      const sx = W * 0.72, sy = H * 0.47;
      const g = ctx.createRadialGradient(sx, sy, 0, sx, sy, H * 0.45);
      g.addColorStop(0, "rgba(255,190,110,.75)");
      g.addColorStop(0.15, "rgba(242,155,56,.35)");
      g.addColorStop(1, "rgba(242,155,56,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = "#ffd29a";
      ctx.beginPath();
      ctx.arc(sx, sy, H * 0.045, 0, 7);
      ctx.fill();

      // headland silhouette
      ctx.fillStyle = "#0c1c1f";
      ctx.beginPath();
      ctx.moveTo(0, H * 0.5);
      ctx.lineTo(0, H * 0.36);
      ctx.lineTo(W * 0.08, H * 0.38);
      ctx.lineTo(W * 0.17, H * 0.41);
      ctx.lineTo(W * 0.26, H * 0.44);
      ctx.lineTo(W * 0.34, H * 0.5);
      ctx.fill();

      layers.forEach((L, i) => {
        const base = H * L.y;
        ctx.beginPath();
        ctx.moveTo(0, H);
        for (let x = 0; x <= W + 8; x += 8) {
          ctx.lineTo(x, base + wave(x, t, L) * L.amp);
        }
        ctx.lineTo(W, H);
        ctx.closePath();
        ctx.fillStyle = L.col;
        ctx.fill();

        ctx.beginPath();
        for (let x = 0; x <= W + 8; x += 8) {
          const y = base + wave(x, t, L) * L.amp;
          x ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
        }
        ctx.strokeStyle = `rgba(236,230,217,${0.1 + i * 0.04})`;
        ctx.lineWidth = 1 + i * 0.4;
        ctx.stroke();

        if (i < 3) {
          ctx.fillStyle = "rgba(255,200,130,.25)";
          for (let k = 0; k < 6; k++) {
            const gx = sx - 60 + ((k * 53 + t * 20 * (i + 1)) % 120);
            ctx.fillRect(gx, base + wave(gx, t, L) * L.amp + 3, 14 - i * 3, 1.5);
          }
        }
      });

      // surfer on the third swell
      const L = layers[2];
      const sxp = ((t * 38) % (W + 120)) - 60;
      const syp = H * L.y + wave(sxp, t, L) * L.amp;
      ctx.save();
      ctx.translate(sxp, syp - 2);
      ctx.fillStyle = "#071012";
      ctx.beginPath();
      ctx.ellipse(0, 2, 15, 2.4, -0.08, 0, 7);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-5, 1);
      ctx.lineTo(-2, -10);
      ctx.lineTo(3, -9);
      ctx.lineTo(5, 1);
      ctx.lineTo(2, 1);
      ctx.lineTo(1, -5);
      ctx.lineTo(-2, 1);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(0.5, -13, 2.6, 0, 7);
      ctx.fill();
      ctx.lineWidth = 1.6;
      ctx.strokeStyle = "#071012";
      ctx.beginPath();
      ctx.moveTo(-9, -11);
      ctx.lineTo(0, -8);
      ctx.lineTo(10, -6);
      ctx.stroke();
      ctx.restore();

      // grain + vignette
      const v = ctx.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, W * 0.75);
      v.addColorStop(0, "rgba(0,0,0,0)");
      v.addColorStop(1, "rgba(0,0,0,.55)");
      ctx.fillStyle = v;
      ctx.fillRect(0, 0, W, H);
    }

    const t0 = performance.now();
    const p = n => String(n).padStart(2, "0");

    function loop(now) {
      const t = (now - t0) / 1000;
      if (!heroPhotoLoaded) draw(t);
      const f = Math.floor(t * 25);
      timecodeStr = `${p(Math.floor(f / 90000))}:${p(Math.floor(f / 1500) % 60)}:${p(Math.floor(f / 25) % 60)}:${p(f % 25)}`;
      if (!reduce) animId = requestAnimationFrame(loop);
    }

    animId = requestAnimationFrame(loop);

    return () => {
      if (animId) cancelAnimationFrame(animId);
      window.removeEventListener("resize", size);
    };
  });
</script>

<div class="hero wrap" id="top">
  <div class="frame">
    <canvas bind:this={canvasEl} id="sea" aria-hidden="true"></canvas>
    {#if heroPhotoLoaded}
      <img
        class="photo"
        src="img/hero.jpg"
        alt="Surfer riding a wave at sunset"
        onerror={() => (heroPhotoLoaded = false)}
      />
    {/if}
    <span class="shade" aria-hidden="true"></span>
    <div class="vf" aria-hidden="true">
      <span class="c tl"></span><span class="c tr"></span>
      <span class="c bl"></span><span class="c br"></span>
      <span class="cross"></span>
      <div class="readout top mono">
        <span class="rec"><b></b>REC <span>{timecodeStr}</span></span>
        <span class="hide-s">ULUWATU · 8°49′S 115°05′E</span>
        <span>WATER ANGLE</span>
      </div>
    </div>
    <div class="hero-copy">
      <span class="mono">Surf filmer · Photographer · Guide — Bali &amp; Java</span>
      <h1>Your wave,<br /><em>on film.</em></h1>
      <p class="lead">
        Water and land angles of your session at Indonesia's reef breaks, shot by a local who
        knows the lineup. Uluwatu, Padang Padang and Java's hidden point breaks.
      </p>
      <div class="cta">
        <a class="btn btn-wax" href="#book">Book a session</a>
        <a
          class="btn btn-ghost"
          href="https://m.youtube.com/@JavaReeffilmer"
          target="_blank"
          rel="noopener noreferrer"
        >
          Watch on YouTube
        </a>
      </div>
    </div>
  </div>
  <div class="ticker mono">
    <span><b>@blackskin777</b> on Instagram</span>
    <span>Based in <b>Bali</b></span>
    <span>Filming <b>Bali + Java</b></span>
    <span>Video · Photo · Trips · Coaching · Car rental</span>
  </div>
</div>

<style>
  .hero {
    position: relative;
    padding: 28px 0 0;
  }

  .frame {
    position: relative;
    display: flex;
    align-items: flex-end;
    min-height: 600px;
    overflow: hidden;
    border-radius: 4px;
    background: var(--deep);
  }

  #sea {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
  }

  .photo {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    max-width: none;
  }

  .shade {
    position: absolute;
    inset: 0;
    background: linear-gradient(90deg, rgba(6, 12, 14, 0.75), rgba(6, 12, 14, 0.15) 65%),
      linear-gradient(0deg, rgba(6, 12, 14, 0.6), transparent 50%);
  }

  .vf {
    position: absolute;
    inset: 18px;
    pointer-events: none;
  }

  .vf .c {
    position: absolute;
    width: 34px;
    height: 34px;
    border: 2px solid rgba(236, 230, 217, 0.85);
  }

  .vf .tl { top: 0; left: 0; border-right: 0; border-bottom: 0; }
  .vf .tr { top: 0; right: 0; border-left: 0; border-bottom: 0; }
  .vf .bl { bottom: 0; left: 0; border-right: 0; border-top: 0; }
  .vf .br { bottom: 0; right: 0; border-left: 0; border-top: 0; }

  .vf .cross {
    position: absolute;
    left: 50%;
    top: 50%;
    width: 22px;
    height: 22px;
    transform: translate(-50%, -50%);
  }

  .vf .cross:before,
  .vf .cross:after {
    content: "";
    position: absolute;
    background: rgba(236, 230, 217, 0.55);
  }

  .vf .cross:before {
    left: 50%;
    top: 0;
    bottom: 0;
    width: 1px;
  }

  .vf .cross:after {
    top: 50%;
    left: 0;
    right: 0;
    height: 1px;
  }

  .readout {
    position: absolute;
    display: flex;
    gap: 18px;
    align-items: center;
    color: rgba(236, 230, 217, 0.92);
  }

  .readout.top {
    top: 14px;
    left: 52px;
    right: 52px;
    justify-content: space-between;
  }

  .rec {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .rec b {
    width: 9px;
    height: 9px;
    border-radius: 50%;
    background: #ff4a3d;
    animation: blink 1.2s steps(2) infinite;
  }

  @keyframes blink {
    50% { opacity: 0.15; }
  }

  .hero-copy {
    position: relative;
    padding: 110px clamp(24px, 6vw, 72px) clamp(40px, 7vw, 72px);
    max-width: 820px;
    z-index: 2;
  }

  .hero-copy .mono {
    color: var(--wax);
    margin-bottom: 14px;
    display: block;
  }

  .hero h1 {
    font-size: clamp(56px, 9vw, 128px);
    font-weight: 900;
    text-shadow: 0 2px 30px rgba(0, 0, 0, 0.35);
  }

  .hero h1 em {
    font-style: normal;
    color: transparent;
    -webkit-text-stroke: 2px var(--foam);
  }

  .hero p.lead {
    max-width: 48ch;
    margin: 18px 0 26px;
    font-size: 18px;
    color: rgba(236, 230, 217, 0.9);
  }

  .cta {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
  }

  .ticker {
    display: flex;
    flex-wrap: wrap;
    gap: 10px 28px;
    padding: 18px 0;
    border-bottom: 1px solid var(--line);
    color: var(--muted);
  }

  .ticker span b {
    color: var(--foam);
    font-weight: 600;
  }

  @media (max-width: 520px) {
    .readout.top .hide-s {
      display: none;
    }
  }
</style>
