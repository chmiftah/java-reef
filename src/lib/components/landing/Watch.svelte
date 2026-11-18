<section id="watch">
  <div class="wrap">
    <div class="head">
      <span class="mono">Reel</span>
      <h2>Watch the work</h2>
    </div>
    <div class="watch">
      <a
        class="reel yt"
        href="https://m.youtube.com/@JavaReeffilmer"
        target="_blank"
        rel="noopener noreferrer"
      >
        <img
          class="photo"
          src="img/youtube.jpg"
          alt=""
          loading="lazy"
          onerror={(e) => e.currentTarget.remove()}
        />
        <span class="play">
          <svg viewBox="0 0 20 20"><path d="M4 2l14 8-14 8z" /></svg>
        </span>
        <span class="mono">YouTube · JAVA REEF FILMER</span>
        <h3>Full sessions</h3>
        <p>Full-length surf documentaries, hidden point-break sessions and swell recaps.</p>
      </a>
      <a
        class="reel ig"
        href="https://www.instagram.com/blackskin777/"
        target="_blank"
        rel="noopener noreferrer"
      >
        <img
          class="photo"
          src="img/instagram.jpg"
          alt=""
          loading="lazy"
          onerror={(e) => e.currentTarget.remove()}
        />
        <span class="play">
          <svg viewBox="0 0 20 20"><path d="M4 2l14 8-14 8z" /></svg>
        </span>
        <span class="mono">Instagram · @blackskin777</span>
        <h3>Daily reels</h3>
        <p>Daily clips from the lineup, plus booking contact.</p>
      </a>
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

  .watch {
    display: grid;
    grid-template-columns: 1.4fr 1fr;
    gap: 16px;
  }

  .reel {
    position: relative;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    min-height: 300px;
    padding: 28px;
    border-radius: 4px;
    text-decoration: none;
    overflow: hidden;
    border: 1px solid var(--line);
  }

  .reel:before {
    content: "";
    position: absolute;
    inset: 0;
    z-index: 0;
    transition: transform 0.5s;
  }

  .reel:hover:before {
    transform: scale(1.04);
  }

  .reel > :global(*) {
    position: relative;
    z-index: 1;
  }

  .reel.yt:before {
    background: radial-gradient(120% 90% at 80% 10%, #f29b3855, transparent 55%),
      linear-gradient(170deg, #18474b, #0a1a1d 70%);
  }

  .reel.ig:before {
    background: radial-gradient(100% 80% at 20% 0%, #3fb8a64d, transparent 60%),
      linear-gradient(200deg, #13333a, #0a1113 75%);
  }

  .reel .photo {
    position: absolute;
    z-index: 0;
    opacity: 0.55;
    transition: transform 0.5s;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .reel:hover .photo {
    transform: scale(1.04);
  }

  .reel:after {
    content: "";
    position: absolute;
    inset: 0;
    z-index: 0;
    background: linear-gradient(0deg, rgba(6, 12, 14, 0.9), rgba(6, 12, 14, 0.2) 75%);
  }

  .reel .play {
    width: 64px;
    height: 64px;
    border-radius: 50%;
    border: 2px solid var(--foam);
    display: grid;
    place-items: center;
    margin-bottom: auto;
    transition: background 0.2s, border-color 0.2s;
  }

  .reel:hover .play {
    background: var(--wax);
    border-color: var(--wax);
  }

  .reel .play svg {
    width: 20px;
    height: 20px;
    fill: var(--foam);
    margin-left: 3px;
  }

  .reel:hover .play svg {
    fill: #1a0f02;
  }

  .reel h3 {
    font-size: clamp(36px, 4vw, 56px);
    font-weight: 800;
    margin: 10px 0 8px;
  }

  .reel p {
    color: rgba(236, 230, 217, 0.8);
    max-width: 42ch;
  }

  .reel .mono {
    color: var(--wax);
  }

  @media (max-width: 900px) {
    .head {
      grid-template-columns: 1fr;
    }
    .watch {
      grid-template-columns: 1fr;
    }
  }
</style>
