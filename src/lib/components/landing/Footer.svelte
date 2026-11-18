<script>
  let { onNavigateAdmin } = $props();
  const year = new Date().getFullYear();
</script>

<footer>
  <div class="wrap">
    <div class="big" aria-hidden="true">Java Reef</div>
    <nav class="mono">
      <a
        href="https://www.instagram.com/blackskin777/"
        target="_blank"
        rel="noopener noreferrer"
      >
        Instagram
      </a>
      <a
        href="https://m.youtube.com/@JavaReeffilmer"
        target="_blank"
        rel="noopener noreferrer"
      >
        YouTube
      </a>
      <span>Photos: Unsplash</span>
      <button type="button" class="admin-link" onclick={onNavigateAdmin}>
        Admin
      </button>
      <span>© {year} Java Reef Filmer</span>
    </nav>
  </div>
</footer>

<style>
  footer {
    margin-top: 120px;
    border-top: 1px solid var(--line);
    padding: 40px 0 60px;
  }

  footer .wrap {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    gap: 24px;
    align-items: end;
  }

  footer .big {
    font-family: var(--f-display);
    font-weight: 900;
    font-size: clamp(56px, 12vw, 180px);
    line-height: 0.8;
    color: transparent;
    -webkit-text-stroke: 1px rgba(236, 230, 217, 0.25);
    text-transform: uppercase;
  }

  footer nav {
    display: flex;
    flex-wrap: wrap;
    gap: 20px;
    color: var(--muted);
    align-items: center;
  }

  footer nav a,
  .admin-link {
    text-decoration: none;
    color: var(--muted);
    font-size: inherit;
    font-family: inherit;
    letter-spacing: inherit;
    text-transform: inherit;
    cursor: pointer;
    transition: color 0.15s;
  }

  footer nav a:hover,
  .admin-link:hover {
    color: var(--foam);
  }
</style>
