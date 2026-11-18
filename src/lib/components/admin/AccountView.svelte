<script>
  import { db } from '../../stores/db.svelte.js';
  import { today, hashPassword } from '../../utils/format.js';
  import Modal from './Modal.svelte';

  let { onLogout } = $props();

  // Settings form
  let sBus = $state(db.settings.business);
  let sAddr = $state(db.settings.address);
  let sEmail = $state(db.settings.email);
  let sPhone = $state(db.settings.phone);
  let sCur = $state(db.settings.currency);
  let sPrefix = $state(db.settings.prefix);
  let sDue = $state(db.settings.dueDays);
  let sTax = $state(db.settings.taxRate);
  let sBank = $state(db.settings.bank);

  // Password form
  let pwOld = $state("");
  let pwNew = $state("");
  let pwErr = $state("");

  // Restore Modal
  let isRestoreModalOpen = $state(false);
  let restoreJSONText = $state("");
  let restoreErr = $state("");

  // Wipe Modal
  let isWipeModalOpen = $state(false);

  function handleSaveSettings(e) {
    e.preventDefault();
    db.saveAppSettings({
      business: sBus.trim(),
      address: sAddr.trim(),
      email: sEmail.trim(),
      phone: sPhone.trim(),
      currency: sCur,
      prefix: (sPrefix.trim() || "INV").toUpperCase(),
      dueDays: +sDue || 0,
      taxRate: +sTax || 0,
      bank: sBank.trim()
    });
  }

  async function handleUpdatePassword(e) {
    e.preventDefault();
    const acc = db.user || {};
    if (!acc.salt) return;
    const oldHash = await hashPassword(pwOld, acc.salt);
    if (oldHash !== acc.hash) {
      pwErr = "Current password is wrong.";
      return;
    }
    if (pwNew.length < 6) {
      pwErr = "New password needs at least 6 characters.";
      return;
    }
    const newHash = await hashPassword(pwNew, acc.salt);
    db.user = { ...acc, hash: newHash };
    db.saveUser();
    pwErr = "";
    pwOld = "";
    pwNew = "";
    db.showToast("Password updated");
  }

  function downloadBackup() {
    try {
      const json = db.getBackupJSON();
      const b = new Blob([json], { type: "application/json" });
      const u = URL.createObjectURL(b);
      const l = document.createElement("a");
      l.href = u;
      l.download = `java-reef-backup-${today()}.json`;
      document.body.appendChild(l);
      l.click();
      l.remove();
      setTimeout(() => URL.revokeObjectURL(u), 1000);
      db.showToast("Backup downloaded");
    } catch (_) {
      db.showToast("Download blocked here. Use Copy backup instead.");
    }
  }

  function copyBackup() {
    navigator.clipboard.writeText(db.getBackupJSON()).then(
      () => db.showToast("Backup copied to clipboard"),
      () => db.showToast("Copy was blocked by the browser")
    );
  }

  async function handleFileUpload(e) {
    const file = e.target.files?.[0];
    if (file) {
      restoreJSONText = await file.text();
    }
  }

  function handleRestoreBackup() {
    if (!restoreJSONText.trim()) {
      restoreErr = "Paste backup JSON or choose a file.";
      return;
    }
    const ok = db.restoreBackup(restoreJSONText);
    if (!ok) {
      restoreErr = "That doesn't look like a Java Reef backup. Check you pasted the whole file.";
      return;
    }
    restoreErr = "";
    restoreJSONText = "";
    isRestoreModalOpen = false;
  }

  function handleWipe() {
    db.wipeAll();
    isWipeModalOpen = false;
  }
</script>

<div class="top">
  <div>
    <span class="mono">Admin</span>
    <h1>Account</h1>
  </div>
  <div class="tools">
    <button class="btn" type="button" onclick={onLogout}>Sign out</button>
  </div>
</div>

<div class="panels">
  <form class="panel" onsubmit={handleSaveSettings}>
    <h3>Business details</h3>
    <div class="grid2">
      <label class="full" for="s-bus">
        Business name
        <input id="s-bus" bind:value={sBus} />
      </label>
      <label class="full" for="s-addr">
        Address
        <input id="s-addr" bind:value={sAddr} />
      </label>
      <label for="s-email">
        Email
        <input id="s-email" bind:value={sEmail} />
      </label>
      <label for="s-phone">
        Phone / WhatsApp
        <input id="s-phone" bind:value={sPhone} />
      </label>
      <label for="s-cur">
        Currency
        <select id="s-cur" bind:value={sCur}>
          <option value="IDR">IDR</option>
          <option value="USD">USD</option>
          <option value="AUD">AUD</option>
          <option value="EUR">EUR</option>
        </select>
      </label>
      <label for="s-prefix">
        Invoice prefix
        <input id="s-prefix" bind:value={sPrefix} />
      </label>
      <label for="s-due">
        Default payment term (days)
        <input id="s-due" type="number" min="0" bind:value={sDue} />
      </label>
      <label for="s-tax">
        Default tax %
        <input id="s-tax" type="number" min="0" step="any" bind:value={sTax} />
      </label>
      <label class="full" for="s-bank">
        Payment details shown on invoices
        <textarea
          id="s-bank"
          bind:value={sBank}
          placeholder="Bank name, account name, account number…"
        ></textarea>
      </label>
    </div>
    <button class="btn btn-wax" type="submit" style="justify-self:start;margin-top:10px">
      Save details
    </button>
  </form>

  <div style="display:grid;gap:16px;align-content:start">
    <form class="panel" onsubmit={handleUpdatePassword}>
      <h3>Change password</h3>
      <p style="color:var(--muted);font-size:13px">
        Signed in as <b>{db.user?.user || ""}</b>
      </p>
      <div style="display:grid;gap:12px;margin-top:12px">
        <label for="pw-old">
          Current password
          <input id="pw-old" type="password" bind:value={pwOld} autocomplete="current-password" required />
        </label>
        <label for="pw-new">
          New password
          <input id="pw-new" type="password" bind:value={pwNew} autocomplete="new-password" required />
        </label>
        {#if pwErr}
          <p class="err" role="alert">{pwErr}</p>
        {/if}
        <button class="btn" type="submit" style="justify-self:start">
          Update password
        </button>
      </div>
    </form>

    <div class="panel" style="display:grid;gap:12px">
      <h3>Backup &amp; data</h3>
      <p style="color:var(--muted);font-size:13px">
        {db.customers.length} customers · {db.bookings.length} bookings · {db.invoices.length} invoices,
        stored in this browser.
      </p>
      <div class="tools">
        <button class="btn" type="button" onclick={downloadBackup}>Download backup</button>
        <button class="btn" type="button" onclick={copyBackup}>Copy backup</button>
        <button class="btn" type="button" onclick={() => (isRestoreModalOpen = true)}>
          Restore backup
        </button>
      </div>
      <div class="tools">
        <button class="btn" type="button" onclick={() => db.seedExampleData()}>
          Load example data
        </button>
        <button class="btn btn-danger" type="button" onclick={() => (isWipeModalOpen = true)}>
          Delete all data
        </button>
      </div>
    </div>
  </div>
</div>

<!-- Restore Modal -->
<Modal
  title="Restore backup"
  open={isRestoreModalOpen}
  onClose={() => (isRestoreModalOpen = false)}
  onSave={handleRestoreBackup}
  saveLabel="Restore"
>
  <p style="color:var(--muted)">
    Choose a backup file or paste its contents. This replaces the customers, bookings, invoices and
    business details in this browser.
  </p>
  <label for="imp-file">
    Backup file
    <input id="imp-file" type="file" accept=".json,application/json" onchange={handleFileUpload} />
  </label>
  <label for="imp">
    Or paste backup
    <textarea
      id="imp"
      bind:value={restoreJSONText}
      style="min-height:160px;font-family:var(--f-mono);font-size:12px"
    ></textarea>
  </label>
  {#if restoreErr}
    <p class="err" role="alert">{restoreErr}</p>
  {/if}
</Modal>

<!-- Wipe Modal -->
<Modal
  title="Delete all data?"
  open={isWipeModalOpen}
  onClose={() => (isWipeModalOpen = false)}
  onSave={handleWipe}
  saveLabel="Delete everything"
>
  <p>
    All customers, bookings and invoices in this browser will be deleted. Your admin login stays.
    Download a backup first if you might need them.
  </p>
</Modal>

<style>
  .top {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 24px;
  }

  .top h1 {
    font-size: clamp(40px, 5vw, 60px);
    font-weight: 800;
  }

  .top .mono {
    color: var(--wax);
    display: block;
    margin-bottom: 6px;
  }

  .tools {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    align-items: center;
  }

  .panels {
    display: grid;
    grid-template-columns: 1.2fr 1fr;
    gap: 16px;
  }

  .panel {
    background: var(--panel);
    border: 1px solid var(--line);
    border-radius: 4px;
    padding: 18px;
    min-width: 0;
  }

  .panel h3 {
    font-size: 24px;
    font-weight: 800;
    margin-bottom: 12px;
  }

  .grid2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 14px;
  }

  .full {
    grid-column: 1 / -1;
  }

  @media (max-width: 1100px) {
    .panels {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 820px) {
    .grid2 {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 600px) {
    .top {
      flex-direction: column;
      align-items: stretch;
      gap: 12px;
      margin-bottom: 16px;
    }
    .top h1 {
      font-size: 32px;
    }
    .tools {
      display: flex;
      flex-direction: column;
      width: 100%;
      gap: 8px;
    }
    .tools .btn {
      width: 100%;
      text-align: center;
      justify-content: center;
    }
  }
</style>
