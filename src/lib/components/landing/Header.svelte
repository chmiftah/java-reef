<script>
  let { onNavigateAdmin } = $props();
</script>

<header class="nav">
  <div class="wrap">
    <a class="logo" href="#top">
      <i aria-hidden="true"></i>JAVA REEF FILMER
    </a>
    <ul>
      <li><a href="#services">Services</a></li>
      <li><a href="#spots">Spots</a></li>
      <li><a href="#how">How it works</a></li>
      <li><a href="#watch">Watch</a></li>
    </ul>
    <div class="nav-actions">
      <button type="button" class="btn btn-ghost btn-login" onclick={onNavigateAdmin}>
        Login
      </button>
      <a class="btn btn-wax btn-book" href="#book">Book a session</a>
    </div>
  </div>
</header>

<style>
  .nav {
    position: sticky;
    top: 0;
    z-index: 20;
    background: rgba(10, 17, 19, 0.82);
    backdrop-filter: blur(10px);
    border-bottom: 1px solid var(--line);
  }

  .nav .wrap {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    height: 64px;
  }

  .logo {
    font-family: var(--f-display);
    font-weight: 900;
    font-size: 24px;
    letter-spacing: 0.04em;
    text-decoration: none;
    display: flex;
    align-items: center;
    gap: 10px;
    color: var(--foam);
    white-space: nowrap;
  }

  .logo i {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: var(--wax);
    display: inline-block;
    flex-shrink: 0;
  }

  .nav ul {
    display: flex;
    gap: 28px;
    list-style: none;
  }

  .nav ul a {
    text-decoration: none;
    color: var(--muted);
    font-size: 15px;
    transition: color 0.15s;
  }

  .nav ul a:hover {
    color: var(--foam);
  }

  .nav-actions {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .nav :global(.btn) {
    padding: 10px 16px;
  }

  @media (max-width: 900px) {
    .nav ul {
      display: none;
    }
  }

  @media (max-width: 520px) {
    .nav .wrap {
      gap: 10px;
    }

    .logo {
      font-size: 19px;
      gap: 8px;
    }

    .logo i {
      width: 8px;
      height: 8px;
    }

    .btn-book {
      display: none;
    }

    .nav :global(.btn-login) {
      padding: 7px 14px;
      font-size: 13px;
    }
  }
</style>
