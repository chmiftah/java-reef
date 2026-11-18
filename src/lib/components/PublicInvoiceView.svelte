<script>
  import { db } from '../stores/db.svelte.js';
  import { decodeInvoicePayload } from '../utils/invoiceShare.js';
  import { fmtDate, money, invTotals, invStatus, daysBetween, today } from '../utils/format.js';

  let { onBackToWebsite } = $props();

  let invoiceData = $state(null);
  let errorMsg = $state("");
  let copiedBankAcc = $state(false);
  let copiedBankFull = $state(false);
  let copiedLink = $state(false);

  $effect(() => {
    loadInvoiceFromUrl();
    const handleHashChange = () => loadInvoiceFromUrl();
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  });

  function loadInvoiceFromUrl() {
    try {
      const hash = window.location.hash || "";
      const search = window.location.search || "";

      let paramStr = "";
      if (hash.includes("?")) {
        paramStr = hash.slice(hash.indexOf("?") + 1);
      } else if (search.includes("?")) {
        paramStr = search.slice(1);
      }

      const params = new URLSearchParams(paramStr);
      let encodedData = params.get("data");
      const id = params.get("id");

      if (encodedData) {
        let decoded = decodeInvoicePayload(encodedData);
        if (!decoded) {
          try {
            decoded = decodeInvoicePayload(decodeURIComponent(encodedData));
          } catch (_) {}
        }
        if (decoded && decoded.inv) {
          invoiceData = {
            inv: decoded.inv,
            cust: decoded.cust || {},
            settings: decoded.settings || db.settings
          };
          errorMsg = "";
          return;
        }
      }

      // Fallback: check if id exists in database
      if (id) {
        const found = db.invoices.find(i => i.id === id || i.number === id);
        if (found) {
          const cust = db.customers.find(c => c.id === found.customerId) || {};
          invoiceData = {
            inv: found,
            cust,
            settings: db.settings
          };
          errorMsg = "";
          return;
        }
      }

      errorMsg = "Invoice tidak ditemukan atau tautan tidak valid.";
    } catch (e) {
      console.error(e);
      errorMsg = "Gagal memuat invoice.";
    }
  }

  let totals = $derived.by(() => {
    if (!invoiceData?.inv) return { sub: 0, disc: 0, tax: 0, total: 0, paid: 0, balance: 0 };
    return invTotals(invoiceData.inv);
  });

  let status = $derived.by(() => {
    if (!invoiceData?.inv) return "Draft";
    return invStatus(invoiceData.inv);
  });

  let bankParsed = $derived.by(() => {
    const raw = invoiceData?.settings?.bank || "";
    if (!raw) return null;
    const match = raw.match(/\b\d{3,}[-\s]?\d{3,}[-\s]?\d{3,}\b|\b\d{6,16}\b/);
    const accNumber = match ? match[0] : "";
    const cleanNumber = accNumber.replace(/[-\s]/g, "");
    return { raw, accNumber, cleanNumber };
  });

  let overdueDays = $derived.by(() => {
    if (!invoiceData?.inv?.dueDate) return 0;
    return Math.max(0, daysBetween(invoiceData.inv.dueDate, today()));
  });

  function handlePrint() {
    window.print();
  }

  async function copyAccountNumber() {
    if (!bankParsed?.cleanNumber) return;
    try {
      await navigator.clipboard.writeText(bankParsed.cleanNumber);
      copiedBankAcc = true;
      setTimeout(() => (copiedBankAcc = false), 2500);
    } catch (_) {}
  }

  async function copyBankDetails() {
    if (!invoiceData?.settings?.bank) return;
    try {
      await navigator.clipboard.writeText(invoiceData.settings.bank);
      copiedBankFull = true;
      setTimeout(() => (copiedBankFull = false), 2500);
    } catch (_) {}
  }

  async function copyShareLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      copiedLink = true;
      setTimeout(() => (copiedLink = false), 2500);
    } catch (_) {}
  }
</script>

<div class="invoice-page">
  <!-- Top Navigation Header -->
  <header class="top-nav">
    <div class="nav-inner">
      <button type="button" class="brand-link" onclick={onBackToWebsite} title="Kembali ke Beranda">
        <i></i>
        <span>JAVA REEF FILMER</span>
      </button>

      <div class="actions">
        <button type="button" class="action-btn" onclick={copyShareLink} title="Salin Tautan Invoice">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
          </svg>
          <span>{copiedLink ? "✓ Tersalin" : "Salin Link"}</span>
        </button>

        <button type="button" class="action-btn" onclick={handlePrint} title="Cetak atau Simpan PDF">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="6 9 6 2 18 2 18 9"></polyline>
            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
            <rect x="6" y="14" width="12" height="8"></rect>
          </svg>
          <span>Cetak / PDF</span>
        </button>

        <button type="button" class="action-btn action-primary" onclick={onBackToWebsite}>
          <span>← Beranda</span>
        </button>
      </div>
    </div>
  </header>

  <!-- Main Invoice Viewport -->
  <main class="main-content">
    {#if errorMsg}
      <div class="error-box">
        <div class="error-icon">⚠️</div>
        <h2>{errorMsg}</h2>
        <p>Silakan periksa kembali tautan Anda atau hubungi Java Reef Filmer.</p>
        <button class="btn btn-wax" type="button" onclick={onBackToWebsite}>
          ← Kembali ke Beranda
        </button>
      </div>
    {:else if invoiceData}
      {@const inv = invoiceData.inv}
      {@const cust = invoiceData.cust}
      {@const s = invoiceData.settings}
      {@const cur = s.currency || "IDR"}

      <div class="paper" id="printArea">
        <!-- Invoice Top Header -->
        <div class="paper-header">
          <div class="biz-brand">
            <div class="biz-name">JAVA REEF FILMER</div>
            <div class="biz-tagline">Surf Photography &amp; Cinematography</div>
            <div class="biz-meta">
              {#if s.address}<div>{s.address}</div>{/if}
              {#if s.email}<div>{s.email}</div>{/if}
              {#if s.phone}<div>{s.phone}</div>{/if}
            </div>
          </div>

          <div class="inv-badge-area">
            <div class="inv-title">INVOICE</div>
            <div class="inv-number">{inv.number}</div>
            <div class="stamp-wrap">
              <span class="stamp s-{status.toLowerCase()}">
                {#if status === "Paid"}
                  ✓ LUNAS / PAID
                {:else if status === "Overdue"}
                  ! OVERDUE
                {:else if status === "Partial"}
                  PARTLY PAID
                {:else if status === "Sent"}
                  PENDING
                {:else}
                  {status}
                {/if}
              </span>
            </div>
          </div>
        </div>

        <!-- Status Highlight Banner -->
        <div class="status-banner banner-{status.toLowerCase()}">
          {#if status === "Paid"}
            <div class="sb-icon">✓</div>
            <div class="sb-text">
              <b>Pembayaran Lunas</b> · Terima kasih telah mempercayakan dokumentasi surfing Anda kepada Java Reef Filmer!
            </div>
          {:else if status === "Overdue"}
            <div class="sb-icon">⚠️</div>
            <div class="sb-text">
              <b>Tagihan Lewat Jatuh Tempo ({overdueDays} hari)</b> · Total yang harus dibayarkan: <b>{money(totals.balance, cur)}</b>.
            </div>
          {:else if status === "Partial"}
            <div class="sb-icon">⏱</div>
            <div class="sb-text">
              <b>Pembayaran Sebagian ({money(totals.paid, cur)} diterima)</b> · Sisa tagihan: <b>{money(totals.balance, cur)}</b>.
            </div>
          {:else}
            <div class="sb-icon">📄</div>
            <div class="sb-text">
              <b>Jatuh Tempo: {fmtDate(inv.dueDate)}</b> · Mohon selesaikan pembayaran sebesar <b>{money(totals.balance || totals.total, cur)}</b>.
            </div>
          {/if}
        </div>

        <!-- Bill To & Metadata Grid -->
        <div class="info-grid">
          <div class="info-card">
            <div class="card-label">DITUJUKAN KEPADA (BILL TO)</div>
            <div class="cust-name">{cust.name || "Customer"}</div>
            {#if cust.email}<div class="cust-detail">{cust.email}</div>{/if}
            {#if cust.phone}<div class="cust-detail">{cust.phone}</div>{/if}
            {#if cust.country}<div class="cust-detail">{cust.country}</div>{/if}
          </div>

          <div class="info-card">
            <div class="card-label">DETAIL TAGIHAN</div>
            <div class="meta-row">
              <span class="meta-lbl">No. Invoice:</span>
              <span class="meta-val mono">{inv.number}</span>
            </div>
            <div class="meta-row">
              <span class="meta-lbl">Tanggal Terbit:</span>
              <span class="meta-val">{fmtDate(inv.issueDate)}</span>
            </div>
            <div class="meta-row">
              <span class="meta-lbl">Jatuh Tempo:</span>
              <span class="meta-val highlight-due">{fmtDate(inv.dueDate)}</span>
            </div>
          </div>
        </div>

        <!-- Line Items Table (Desktop View) -->
        <div class="items-table-wrap">
          <table class="items-table">
            <thead>
              <tr>
                <th>Deskripsi Layanan</th>
                <th class="col-qty">Qty</th>
                <th class="col-price">Harga</th>
                <th class="col-amt">Jumlah</th>
              </tr>
            </thead>
            <tbody>
              {#each inv.items || [] as it}
                <tr>
                  <td class="col-desc">
                    <b>{it.desc || "Layanan Dokumentasi Surfing"}</b>
                  </td>
                  <td class="col-qty num">{it.qty}</td>
                  <td class="col-price num">{money(it.price, cur)}</td>
                  <td class="col-amt num"><b>{money((+it.qty || 0) * (+it.price || 0), cur)}</b></td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>

        <!-- Line Items Cards (Mobile View) -->
        <div class="items-cards-wrap">
          {#each inv.items || [] as it}
            <div class="item-card">
              <div class="ic-desc">{it.desc || "Layanan Dokumentasi Surfing"}</div>
              <div class="ic-row">
                <span class="ic-calc">{it.qty} × {money(it.price, cur)}</span>
                <span class="ic-amt num">{money((+it.qty || 0) * (+it.price || 0), cur)}</span>
              </div>
            </div>
          {/each}
        </div>

        <!-- Calculation & Totals -->
        <div class="totals-section">
          <div class="tot-box">
            <div class="tot-row">
              <span>Subtotal</span>
              <span class="num">{money(totals.sub, cur)}</span>
            </div>
            {#if totals.disc}
              <div class="tot-row tot-discount">
                <span>Diskon</span>
                <span class="num">−{money(totals.disc, cur)}</span>
              </div>
            {/if}
            {#if totals.tax}
              <div class="tot-row">
                <span>Pajak ({inv.taxRate}%)</span>
                <span class="num">{money(totals.tax, cur)}</span>
              </div>
            {/if}
            <div class="tot-row tot-grand">
              <span>Total Tagihan</span>
              <span class="num">{money(totals.total, cur)}</span>
            </div>
            {#if totals.paid}
              <div class="tot-row tot-paid">
                <span>Telah Dibayar</span>
                <span class="num">−{money(totals.paid, cur)}</span>
              </div>
              <div class="tot-row tot-balance">
                <span>Sisa Tagihan</span>
                <span class="num balance-amt">{money(totals.balance, cur)}</span>
              </div>
            {/if}
          </div>
        </div>

        <!-- Payment Details Card -->
        {#if s.bank}
          <div class="payment-card">
            <div class="pay-head">
              <div class="pay-title">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="2" y="5" width="20" height="14" rx="2"></rect>
                  <line x1="2" y1="10" x2="22" y2="10"></line>
                </svg>
                <span>Instruksi Pembayaran Transfer Bank</span>
              </div>
            </div>

            <div class="bank-details-box">
              <div class="bank-raw-text">{s.bank}</div>
              
              <div class="bank-actions">
                {#if bankParsed?.cleanNumber}
                  <button type="button" class="copy-btn copy-primary" onclick={copyAccountNumber}>
                    {copiedBankAcc ? "✓ No. Rekening Tersalin!" : `Salin No. Rekening (${bankParsed.accNumber})`}
                  </button>
                {/if}
                <button type="button" class="copy-btn" onclick={copyBankDetails}>
                  {copiedBankFull ? "✓ Info Lengkap Tersalin!" : "Salin Info Lengkap"}
                </button>
              </div>
            </div>
          </div>
        {/if}

        <!-- Invoice Notes -->
        {#if inv.notes}
          <div class="notes-card">
            <div class="card-label">CATATAN</div>
            <div class="notes-text">{inv.notes}</div>
          </div>
        {/if}

        <!-- Paper Footer -->
        <footer class="paper-footer">
          <div>Java Reef Filmer · Professional Surf &amp; Ocean Imagery</div>
          <div class="sub-foot">G-Land · Pacitan · Cimaja · Batu Karas · Bali &amp; Beyond</div>
        </footer>
      </div>
    {/if}
  </main>
</div>

<style>
  .invoice-page {
    min-height: 100vh;
    background: #080f11;
    color: var(--foam);
    padding-bottom: 60px;
  }

  /* Top Navigation Bar */
  .top-nav {
    position: sticky;
    top: 0;
    z-index: 50;
    background: rgba(8, 15, 17, 0.95);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border-bottom: 1px solid var(--line);
  }

  .nav-inner {
    max-width: 900px;
    margin: 0 auto;
    padding: 12px 16px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
  }

  .brand-link {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    color: var(--foam);
    font-family: var(--f-display);
    font-weight: 800;
    font-size: 18px;
    letter-spacing: 0.05em;
    cursor: pointer;
    text-decoration: none;
    white-space: nowrap;
  }

  .brand-link i {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--wax);
    flex-shrink: 0;
  }

  .actions {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
    justify-content: flex-end;
  }

  .action-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 7px 12px;
    border-radius: 3px;
    border: 1px solid var(--line);
    background: rgba(236, 230, 217, 0.04);
    color: var(--foam);
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s;
    white-space: nowrap;
  }

  .action-btn:hover {
    background: rgba(236, 230, 217, 0.1);
    border-color: rgba(236, 230, 217, 0.3);
  }

  .action-primary {
    background: var(--wax);
    border-color: var(--wax);
    color: #1a0f02;
    font-weight: 600;
  }

  .action-primary:hover {
    background: #ffb055;
    border-color: #ffb055;
    color: #1a0f02;
  }

  /* Main Container */
  .main-content {
    max-width: 900px;
    margin: 28px auto 0;
    padding: 0 16px;
  }

  /* Error Box */
  .error-box {
    text-align: center;
    padding: 60px 24px;
    background: var(--panel);
    border: 1px solid var(--line);
    border-radius: 6px;
    display: grid;
    gap: 16px;
    justify-items: center;
    max-width: 520px;
    margin: 40px auto;
  }

  .error-icon {
    font-size: 40px;
  }

  .error-box h2 {
    font-size: 26px;
    font-weight: 800;
  }

  .error-box p {
    color: var(--muted);
    font-size: 15px;
  }

  /* The Paper Invoice */
  .paper {
    background: #ffffff;
    color: #1a2223;
    border-radius: 8px;
    border: 1px solid #e2ddd3;
    padding: 44px 48px;
    display: grid;
    gap: 28px;
    font-size: 15px;
    line-height: 1.5;
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.45);
    overflow: hidden;
  }

  /* Paper Header */
  .paper-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 24px;
    border-bottom: 2px solid #14201f;
    padding-bottom: 24px;
  }

  .biz-name {
    font-family: var(--f-display);
    font-size: 28px;
    font-weight: 900;
    letter-spacing: 0.04em;
    color: #0f1c1e;
    line-height: 1;
  }

  .biz-tagline {
    font-size: 13px;
    font-weight: 600;
    color: #2b7a6f;
    margin-top: 4px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .biz-meta {
    margin-top: 10px;
    font-size: 13px;
    color: #556260;
    line-height: 1.4;
  }

  .inv-badge-area {
    text-align: right;
  }

  .inv-title {
    font-family: var(--f-display);
    font-size: 38px;
    font-weight: 900;
    letter-spacing: 0.06em;
    color: #0f1c1e;
    line-height: 0.9;
  }

  .inv-number {
    font-family: var(--f-mono);
    font-size: 18px;
    font-weight: 700;
    color: #4a5957;
    margin-top: 6px;
  }

  .stamp-wrap {
    margin-top: 10px;
  }

  .stamp {
    display: inline-flex;
    align-items: center;
    font-family: var(--f-mono);
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.1em;
    padding: 5px 12px;
    border-radius: 4px;
    border: 2px solid;
    text-transform: uppercase;
  }

  .s-paid {
    color: #177a49;
    border-color: #177a49;
    background: #eafaf1;
  }

  .s-overdue {
    color: #b52c1e;
    border-color: #b52c1e;
    background: #fdf1f0;
  }

  .s-partial {
    color: #a66a08;
    border-color: #a66a08;
    background: #fdf7ec;
  }

  .s-sent {
    color: #1d5cb0;
    border-color: #1d5cb0;
    background: #edf4fe;
  }

  .s-draft {
    color: #616e6d;
    border-color: #616e6d;
    background: #f4f4f4;
  }

  /* Status Banner */
  .status-banner {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px 18px;
    border-radius: 6px;
    font-size: 14px;
  }

  .sb-icon {
    font-size: 18px;
    flex-shrink: 0;
  }

  .banner-paid {
    background: #eaf8f0;
    border: 1px solid #bcead0;
    color: #145e38;
  }

  .banner-overdue {
    background: #fdf0ef;
    border: 1px solid #f6c8c4;
    color: #8c1e14;
  }

  .banner-partial {
    background: #fdf7eb;
    border: 1px solid #f9e2b8;
    color: #825206;
  }

  .banner-sent,
  .banner-draft {
    background: #f0f5fd;
    border: 1px solid #cee0fb;
    color: #1a4985;
  }

  /* Info Grid */
  .info-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
  }

  .info-card {
    background: #f8f6f0;
    border: 1px solid #e7e2d6;
    border-radius: 6px;
    padding: 16px 18px;
  }

  .card-label {
    font-family: var(--f-mono);
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.1em;
    color: #6a7977;
    margin-bottom: 8px;
    text-transform: uppercase;
  }

  .cust-name {
    font-size: 18px;
    font-weight: 700;
    color: #0f1c1e;
    margin-bottom: 4px;
  }

  .cust-detail {
    font-size: 13px;
    color: #556260;
  }

  .meta-row {
    display: flex;
    justify-content: space-between;
    font-size: 13px;
    padding: 4px 0;
    border-bottom: 1px dashed #e2ddd3;
  }

  .meta-row:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }

  .meta-lbl {
    color: #556260;
  }

  .meta-val {
    font-weight: 600;
    color: #0f1c1e;
  }

  .highlight-due {
    color: #a62a1e;
    font-weight: 700;
  }

  /* Line Items Table (Desktop) */
  .items-table-wrap {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }

  .items-table {
    width: 100%;
    border-collapse: collapse;
    text-align: left;
  }

  .items-table th {
    font-family: var(--f-mono);
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.08em;
    color: #5e6d6b;
    text-transform: uppercase;
    padding: 12px 14px;
    background: #f4f1ea;
    border-top: 1px solid #ddd7ca;
    border-bottom: 2px solid #14201f;
  }

  .items-table td {
    padding: 14px;
    border-bottom: 1px solid #e9e4d9;
    vertical-align: middle;
  }

  .items-table tbody tr:hover {
    background: #faf8f4;
  }

  .col-desc {
    color: #0f1c1e;
  }

  .col-qty {
    text-align: center !important;
    width: 70px;
  }

  .col-price {
    text-align: right !important;
    width: 140px;
    white-space: nowrap;
  }

  .col-amt {
    text-align: right !important;
    width: 150px;
    white-space: nowrap;
    color: #0f1c1e;
  }

  /* Items Cards (Mobile fallback) */
  .items-cards-wrap {
    display: none;
  }

  .item-card {
    background: #f8f6f0;
    border: 1px solid #e7e2d6;
    border-radius: 6px;
    padding: 14px;
    display: grid;
    gap: 8px;
  }

  .ic-desc {
    font-weight: 700;
    color: #0f1c1e;
    font-size: 15px;
    line-height: 1.35;
  }

  .ic-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-top: 1px dashed #ded8cb;
    padding-top: 8px;
    font-size: 14px;
  }

  .ic-calc {
    color: #5e6d6b;
    font-size: 13px;
    font-family: var(--f-mono);
  }

  .ic-amt {
    font-weight: 800;
    color: #0f1c1e;
    font-size: 16px;
  }

  /* Totals Section */
  .totals-section {
    display: flex;
    justify-content: flex-end;
  }

  .tot-box {
    width: 320px;
    max-width: 100%;
    display: grid;
    gap: 8px;
  }

  .tot-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 14px;
    color: #445150;
  }

  .tot-discount {
    color: #177a49;
  }

  .tot-grand {
    font-family: var(--f-display);
    font-size: 26px;
    font-weight: 900;
    color: #0f1c1e;
    border-top: 2px solid #0f1c1e;
    padding-top: 10px;
    margin-top: 4px;
  }

  .tot-paid {
    color: #177a49;
    font-weight: 600;
  }

  .tot-balance {
    background: #fcf1ef;
    border: 1px solid #f6cfcb;
    border-radius: 4px;
    padding: 10px 12px;
    margin-top: 6px;
    font-weight: 700;
    font-size: 16px;
  }

  .balance-amt {
    color: #b52c1e;
    font-weight: 800;
    font-size: 18px;
  }

  /* Payment Instructions Card */
  .payment-card {
    background: #f7f5ed;
    border: 1px solid #ded7c8;
    border-radius: 6px;
    padding: 20px;
  }

  .pay-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
  }

  .pay-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 800;
    font-size: 15px;
    color: #0f1c1e;
  }

  .bank-details-box {
    display: grid;
    gap: 14px;
  }

  .bank-raw-text {
    font-family: var(--f-mono);
    font-size: 14px;
    line-height: 1.6;
    color: #243233;
    white-space: pre-line;
    background: #ffffff;
    border: 1px solid #e0d9cc;
    border-radius: 4px;
    padding: 14px 16px;
  }

  .bank-actions {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  .copy-btn {
    font: 600 13px/1 var(--f-body);
    padding: 9px 14px;
    border-radius: 4px;
    border: 1px solid #c9beae;
    background: #ede6d9;
    color: #14201f;
    cursor: pointer;
    transition: all 0.15s;
  }

  .copy-btn:hover {
    background: #e2d9cb;
  }

  .copy-primary {
    background: #2b7a6f;
    border-color: #2b7a6f;
    color: #ffffff;
  }

  .copy-primary:hover {
    background: #23655c;
    border-color: #23655c;
  }

  /* Notes */
  .notes-card {
    border-top: 1px solid #e9e4d9;
    padding-top: 18px;
  }

  .notes-text {
    font-size: 14px;
    color: #4a5957;
    white-space: pre-line;
    line-height: 1.5;
  }

  /* Paper Footer */
  .paper-footer {
    border-top: 1px solid #14201f;
    padding-top: 18px;
    text-align: center;
    font-size: 12px;
    font-weight: 600;
    color: #6a7977;
    line-height: 1.5;
  }

  .sub-foot {
    font-size: 11px;
    color: #8c9b99;
    margin-top: 2px;
  }

  /* Responsive Rules */
  @media (max-width: 680px) {
    .paper {
      padding: 24px 20px;
      gap: 20px;
    }

    .paper-header {
      flex-direction: column;
      align-items: flex-start;
      gap: 16px;
    }

    .inv-badge-area {
      text-align: left;
    }

    .info-grid {
      grid-template-columns: 1fr;
      gap: 12px;
    }

    /* Switch to mobile line items card view */
    .items-table-wrap {
      display: none;
    }

    .items-cards-wrap {
      display: grid;
      gap: 10px;
    }

    .tot-box {
      width: 100%;
    }

    .bank-actions button {
      width: 100%;
      text-align: center;
      justify-content: center;
    }
  }

  @media (max-width: 480px) {
    .nav-inner {
      flex-direction: column;
      align-items: stretch;
      gap: 10px;
      padding: 10px 12px;
    }

    .brand-link {
      justify-content: center;
    }

    .actions {
      justify-content: center;
      width: 100%;
    }

    .action-btn {
      flex: 1;
      justify-content: center;
      padding: 6px 8px;
      font-size: 12px;
    }

    .paper {
      padding: 18px 14px;
      border-radius: 6px;
    }

    .biz-name {
      font-size: 24px;
    }

    .inv-title {
      font-size: 32px;
    }

    .tot-grand {
      font-size: 22px;
    }
  }

  /* Print Stylesheet */
  @media print {
    :global(body) {
      background: #ffffff !important;
      color: #000000 !important;
    }

    .top-nav {
      display: none !important;
    }

    .main-content {
      margin: 0 !important;
      padding: 0 !important;
      max-width: 100% !important;
    }

    .paper {
      box-shadow: none !important;
      border: none !important;
      padding: 0 !important;
    }

    .items-table-wrap {
      display: block !important;
    }

    .items-cards-wrap {
      display: none !important;
    }

    .bank-actions {
      display: none !important;
    }

    .paper-footer {
      border-top: 1px solid #ccc !important;
    }
  }
</style>
