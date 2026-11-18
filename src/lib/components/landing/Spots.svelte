<script>
  let canvasElements = $state([]);

  const spotsData = [
    {
      name: "Uluwatu",
      meta: ["Left-hander", "Reef", "Bukit, Bali"],
      desc: "Bali's best-known left, filmed from the water and from the cliffs above the cave.",
      wave: "left",
      img: "img/uluwatu.jpg",
      alt: "Uluwatu reef break"
    },
    {
      name: "Padang Padang",
      meta: ["Left barrel", "Shallow reef", "Bukit, Bali"],
      desc: "A heavy, hollow left over shallow reef. Strong surfers only when it's big.",
      wave: "barrel",
      img: "img/padang-padang.jpg",
      alt: "Padang Padang barrel"
    },
    {
      name: "Java points",
      meta: ["Point breaks", "Reef", "Java"],
      desc: "Hidden point breaks across Java, away from the crowds. Location details shared when you book a trip.",
      wave: "point",
      img: "img/java.jpg",
      alt: "Point break in Java"
    }
  ];

  $effect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let animId = null;
    const start = performance.now();

    function render(cv, kind, t) {
      if (!cv) return;
      const ctx = cv.getContext("2d");
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const W = cv.clientWidth;
      const H = cv.clientHeight;
      if (cv.width !== W * dpr) {
        cv.width = W * dpr;
        cv.height = H * dpr;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const bg = ctx.createLinearGradient(0, 0, 0, H);
      bg.addColorStop(0, "#123a3f");
      bg.addColorStop(1, "#0a1c1f");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      // reef shelf
      ctx.fillStyle = "rgba(63,184,166,.18)";
      ctx.beginPath();
      if (kind === "point") {
        ctx.moveTo(W, 0);
        ctx.lineTo(W * 0.55, H * 0.2);
        ctx.quadraticCurveTo(W * 0.2, H * 0.55, W * 0.1, H);
        ctx.lineTo(W, H);
      } else {
        ctx.moveTo(W * 0.15, 0);
        ctx.quadraticCurveTo(W * 0.45, H * 0.55, W * 0.95, H * 0.75);
        ctx.lineTo(W, H * 0.75);
        ctx.lineTo(W, 0);
      }
      ctx.fill();

      // swell lines
      for (let i = 0; i < 4; i++) {
        const off = ((t * 14 + i * 42) % 168) - 20;
        const y = H * 0.15 + off;
        ctx.beginPath();
        for (let x = 0; x <= W; x += 6) {
          const bend =
            kind === "point"
              ? Math.pow(x / W, 1.6) * -40
              : Math.sin((x / W) * 3.14) * -14;
          ctx.lineTo(x, y + bend);
        }
        ctx.strokeStyle = `rgba(236,230,217,${0.15 + i * 0.08})`;
        ctx.lineWidth = kind === "barrel" ? 3 : 2;
        ctx.stroke();
      }

      // peel marker
      const peel = (t * 0.18) % 1;
      const px = kind === "point" ? W * (0.85 - peel * 0.6) : W * (0.8 - peel * 0.6);
      ctx.fillStyle = "#f29b38";
      ctx.beginPath();
      ctx.arc(px, H * 0.5, 4, 0, 7);
      ctx.fill();

      ctx.fillStyle = "rgba(236,230,217,.55)";
      ctx.font = "11px 'JetBrains Mono', monospace";
      ctx.fillText(
        kind === "point"
          ? "POINT · PEELS LONG"
          : kind === "barrel"
          ? "HOLLOW · SHALLOW"
          : "LEFT · REEF SHELF",
        12,
        H - 12
      );
    }

    function loop(now) {
      const t = (now - start) / 1000;
      canvasElements.forEach((cv, idx) => {
        if (cv) render(cv, spotsData[idx].wave, t);
      });
      if (!reduce) animId = requestAnimationFrame(loop);
    }

    animId = requestAnimationFrame(loop);

    return () => {
      if (animId) cancelAnimationFrame(animId);
    };
  });
</script>

<section id="spots">
  <div class="wrap">
    <div class="head">
      <span class="mono">Where we shoot</span>
      <h2>The breaks</h2>
      <p>
        Reef breaks reward local knowledge: the tide, the swell direction and the safest angle to
        film from. We pick the spot together based on your level and the forecast.
      </p>
    </div>
    <div class="spots">
      {#each spotsData as spot, i}
        <article class="spot">
          <div class="pic">
            <canvas bind:this={canvasElements[i]} aria-hidden="true"></canvas>
            <img
              class="photo"
              src={spot.img}
              alt={spot.alt}
              loading="lazy"
              onerror={(e) => e.currentTarget.remove()}
            />
          </div>
          <div class="body">
            <div class="meta">
              {#each spot.meta as m, idx}
                <span class="chip {idx === 0 ? 'l' : ''}">{m}</span>
              {/each}
            </div>
            <h3>{spot.name}</h3>
            <p>{spot.desc}</p>
          </div>
        </article>
      {/each}
    </div>
  </div>
</section>

<style>
  section {
    padding: 110px 0 0;
  }

  .head {
    display: grid;
    grid-template-columns: 200px 1fr;
    gap: 24px;
    align-items: end;
    margin-bottom: 48px;
  }

  .head .mono {
    color: var(--wax);
    padding-bottom: 8px;
  }

  .head h2 {
    font-size: clamp(48px, 7vw, 96px);
    font-weight: 800;
  }

  .head p {
    grid-column: 2;
    max-width: 58ch;
    color: var(--muted);
  }

  .spots {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
  }

  .spot {
    position: relative;
    border: 1px solid var(--line);
    border-radius: 4px;
    overflow: hidden;
    background: var(--deep);
    display: flex;
    flex-direction: column;
  }

  .pic {
    position: relative;
    height: 190px;
    overflow: hidden;
  }

  .pic canvas {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    background: #0d2427;
  }

  .pic .photo {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.6s;
  }

  .spot:hover .pic .photo {
    transform: scale(1.05);
  }

  .spot .body {
    padding: 20px 22px 24px;
    display: grid;
    gap: 8px;
  }

  .spot h3 {
    font-size: 40px;
    font-weight: 800;
  }

  .spot .meta {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .chip {
    border: 1px solid var(--line);
    border-radius: 999px;
    padding: 4px 10px;
    font: 500 12px/1.2 var(--f-mono);
    letter-spacing: 0.05em;
    color: var(--foam);
  }

  .chip.l {
    border-color: rgba(63, 184, 166, 0.5);
    color: var(--reef);
  }

  .spot p {
    color: var(--muted);
    font-size: 15px;
  }

  @media (max-width: 900px) {
    .head {
      grid-template-columns: 1fr;
    }
    .head p {
      grid-column: 1;
    }
    .spots {
      grid-template-columns: 1fr;
    }
  }
</style>
