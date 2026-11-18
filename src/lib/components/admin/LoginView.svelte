<script>
  import { db } from '../../stores/db.svelte.js';

  let { onBackToWebsite } = $props();

  // Setup form fields
  let suName = $state("");
  let suUser = $state("");
  let suPass = $state("");
  let suPass2 = $state("");
  let suErr = $state("");

  // Login form fields
  let liUser = $state("");
  let liPass = $state("");
  let liRemember = $state(false);
  let liErr = $state("");

  let hasAdmin = $derived(!!db.user);

  async function handleSetup(e) {
    e.preventDefault();
    const name = suName.trim();
    const user = suUser.trim().toLowerCase();
    if (!name || !user) {
      suErr = "Please fill in your name and a username.";
      return;
    }
    if (suPass.length < 6) {
      suErr = "Password needs at least 6 characters.";
      return;
    }
    if (suPass !== suPass2) {
      suErr = "The two passwords don't match.";
      return;
    }
    suErr = "";
    await db.setupAdmin(name, user, suPass);
  }

  async function handleLogin(e) {
    e.preventDefault();
    const user = liUser.trim().toLowerCase();
    const success = await db.login(user, liPass, liRemember);
    if (!success) {
      liErr = "Wrong username or password.";
      return;
    }
    liErr = "";
  }
</script>

<div class="login">
  <div class="art">
    <div>
      <span class="mono" style="color:var(--wax)">Back office</span>
      <h1>Java Reef<br />Filmer</h1>
      <p>Customers, bookings and invoices in one place.</p>
    </div>
  </div>

  <div class="form-container">
    {#if !hasAdmin}
      <form onsubmit={handleSetup} novalidate>
        <span class="mono" style="color:var(--wax)">First time here</span>
        <h2>Create admin account</h2>

        <label for="su-name">
          Your name
          <input id="su-name" bind:value={suName} autocomplete="name" required />
        </label>
        <label for="su-user">
          Username
          <input id="su-user" bind:value={suUser} autocomplete="username" required />
        </label>
        <label for="su-pass">
          Password (min. 6 characters)
          <input id="su-pass" type="password" bind:value={suPass} autocomplete="new-password" required />
        </label>
        <label for="su-pass2">
          Repeat password
          <input id="su-pass2" type="password" bind:value={suPass2} autocomplete="new-password" required />
        </label>

        {#if suErr}
          <p class="err" role="alert">{suErr}</p>
        {/if}

        <button class="btn btn-wax" type="submit">Create account &amp; sign in</button>
        <p class="note">
          Data is saved in this browser only (localStorage). Use Account › Backup to move it to another device.
        </p>

        <button type="button" class="back-link" onclick={onBackToWebsite}>
          ← Back to website
        </button>
      </form>
    {:else}
      <form onsubmit={handleLogin} novalidate>
        <span class="mono" style="color:var(--wax)">Admin</span>
        <h2>Sign in</h2>

        <label for="li-user">
          Username
          <input id="li-user" bind:value={liUser} autocomplete="username" required />
        </label>
        <label for="li-pass">
          Password
          <input id="li-pass" type="password" bind:value={liPass} autocomplete="current-password" required />
        </label>
        <label class="remember">
          <input type="checkbox" bind:checked={liRemember} style="width:auto" />
          Keep me signed in on this device
        </label>

        {#if liErr}
          <p class="err" role="alert">{liErr}</p>
        {/if}

        <button class="btn btn-wax" type="submit">Sign in</button>

        <button type="button" class="back-link" onclick={onBackToWebsite}>
          ← Back to website
        </button>
      </form>
    {/if}
  </div>
</div>

<style>
  .login {
    min-height: 100vh;
    display: grid;
    grid-template-columns: 1.1fr 1fr;
  }

  .art {
    position: relative;
    background: var(--deep) url("/img/hero.jpg") center/cover no-repeat;
    display: flex;
    align-items: flex-end;
    padding: 48px;
  }

  .art:before {
    content: "";
    position: absolute;
    inset: 0;
    background: linear-gradient(0deg, rgba(6, 12, 14, 0.9), rgba(6, 12, 14, 0.2));
  }

  .art div {
    position: relative;
    z-index: 1;
  }

  .art h1 {
    font-size: clamp(48px, 6vw, 88px);
    font-weight: 900;
  }

  .art p {
    color: rgba(236, 230, 217, 0.8);
    margin-top: 10px;
  }

  .form-container {
    display: grid;
    place-items: center;
    padding: 32px 20px;
    background: var(--basalt);
  }

  form {
    width: min(380px, 100%);
    display: grid;
    gap: 16px;
  }

  form h2 {
    font-size: 44px;
    font-weight: 800;
  }

  .note {
    font-size: 13px;
    color: var(--muted);
    border-left: 2px solid var(--wax);
    padding-left: 10px;
  }

  .remember {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 500;
    color: var(--foam);
    cursor: pointer;
  }

  .back-link {
    font-size: 13px;
    color: var(--muted);
    text-align: left;
    margin-top: 4px;
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
    transition: color 0.15s;
  }

  .back-link:hover {
    color: var(--foam);
  }

  @media (max-width: 820px) {
    .login {
      grid-template-columns: 1fr;
    }
    .art {
      min-height: 220px;
      padding: 24px;
    }
  }
</style>
