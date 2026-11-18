<script>
  import { db } from '../stores/db.svelte.js';
  import { decodeInvoicePayload } from '../utils/invoiceShare.js';
  import { fmtDate, money, invTotals, invStatus } from '../utils/format.js';

  let { onBackToWebsite } = $props();

  let invoiceData = $state(null);
  let errorMsg = $state("");
  let copiedBank = $state(false);
  let copiedLink = $state(false);

  $effect(() => {
    loadInvoiceFromUrl();
  });

  function loadInvoiceFromUrl() {
    try {
      const hash = window.location.hash || "";
      const search = window.location.search || "";
      
      // Look for data in hash query or search query (#invoice?data=... or ?data=...)
      let paramStr = "";
      if (hash.includes("?")) {
        paramStr = hash.slice(hash.indexOf("?") + 1);
      } else if (search.includes("?")) {
        paramStr = search.slice(1);
      }

      const params = new URLSearchParams(paramStr);
      const encodedData = params.get("data");
      const id = params.get("id");

      if (encodedData) {
        const decoded = decodeInvoicePayload(decodeURIComponent(encodedData));
        if (decoded && decoded.inv) {
          invoiceData = {
            inv: decoded.inv,
            cust: decoded.cust || {},
            settings: decoded.settings || db.settings
          };
          return;
        }
      }

      // Fallback: check if id exists in local database
      if (id) {
        const found = db.invoices.find(i => i.id === id || i.number === id);
        if (found) {
          const cust = db.customers.find(c => c.id === found.customerId) || {};
          invoiceData = {
            inv: found,
            cust,
            settings: db.settings
          };
          return;
        }
      }

      errorMsg = "Invoice not found or the link is invalid.";
    } catch (e) {
      console.error(e);
      errorMsg = "Failed to load invoice.";
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

  let stampColor = $derived.by(() => {
    switch (status) {
      case "Paid": return "#1f8a55";
      case "Overdue": return "#c4372a";
      case "Partial": return "#b07a10";
      case "Sent": return "#2a5fae";
      default: return "#777";
    }
  });

  function handlePrint() {
    window.print();
  }

  async function copyBankDetails() {
    if (!invoiceData?.settings?.bank) return;
    try {
      await navigator.clipboard.writeText(invoiceData.settings.bank);
      copiedBank = true;
      setTimeout(() => (copiedBank = false), 2000);
    } catch (_) {}
  }

  async function copyShareLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      copiedLink = true;
      setTimeout(() => (copiedLink = false), 2000);
    } catch (_) {}
  }
</script>

<div class="invoice-page">
  <header class="top-nav">
    <div class="wrap nav-inner">
      <button type="button" class="brand-link" onclick={onBackToWebsite}>
        <i aria-hidden="true"></i>JAVA REEF FILMER
      </button>
      <div class="actions">
        <button type="button" class="btn btn-ghost btn-sm" onclick={copyShareLink}>
          {copiedLink ? "✓ Link Copied" : "Copy Link"}
        </button>
        <button type="button" class="btn btn-ghost btn-sm" onclick={handlePrint}>
          Print / Save PDF
        </button>
        <button type="button" class="btn btn-wax btn-sm" onclick={onBackToWebsite}>
          ← Back to Website
        </button>
      </div>
    </div>
  </header>

  <main class="wrap main-content">
    {#if errorMsg}
      <div class="error-box">
        <h2>{errorMsg}</h2>
        <p>Please check the link or contact Java Reef Filmer directly.</p>
        <button class="btn btn-wax" type="button" onclick={onBackToWebsite}>
          Go to Homepage
        </button>
      </div>
    {:else if invoiceData}
      {@const inv = invoiceData.inv}
      {@const cust = invoiceData.cust}
      {@const s = invoiceData.settings}
      {@const cur = s.currency || "IDR"}

      <div class="paper" id="printArea">
        <div class="ph">
          <div>
            <h2>Invoice</h2>
            <div class="num invoice-number">{inv.number}</div>
          </div>
          <div class="biz-info">
            <b>{s.business || "Java Reef Filmer"}</b>
            {#if s.address}<div>{s.address}</div>{/if}
            {#if s.email}<div>{s.email}</div>{/if}
            {#if s.phone}<div>{s.phone}</div>{/if}
          </div>
        </div>

        <div class="ph">
          <div>
            <div class="lbl">Bill to</div>
            <b>{cust.name || "Customer"}</b>
            {#if cust.email}<div>{cust.email}</div>{/if}
            {#if cust.phone}<div>{cust.phone}</div>{/if}
            {#if cust.country}<div>{cust.country}</div>{/if}
          </div>
          <div class="dates-info">
            <div class="lbl">Issued</div>
            <div>{fmtDate(inv.issueDate)}</div>
            <div class="lbl" style="margin-top:10px">Due</div>
            <div>{fmtDate(inv.dueDate)}</div>
            <div style="margin-top:12px">
              <span class="stamp" style="color:{stampColor};border-color:{stampColor}">
                {status === "Partial" ? "Partly paid" : status}
              </span>
            </div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Description</th>
              <th class="r">Qty</th>
              <th class="r">Price</th>
              <th class="r">Amount</th>
            </tr>
          </thead>
          <tbody>
            {#each inv.items || [] as it}
              <tr>
                <td>{it.desc}</td>
                <td class="r num">{it.qty}</td>
                <td class="r num">{money(it.price, cur)}</td>
                <td class="r num">{money((+it.qty || 0) * (+it.price || 0), cur)}</td>
              </tr>
            {/each}
          </tbody>
        </table>

        <div class="tot">
          <div><span>Subtotal</span><span class="num">{money(totals.sub, cur)}</span></div>
          {#if totals.disc}
            <div><span>Discount</span><span class="num">−{money(totals.disc, cur)}</span></div>
          {/if}
          {#if totals.tax}
            <div><span>Tax {inv.taxRate}%</span><span class="num">{money(totals.tax, cur)}</span></div>
          {/if}
          <div class="g"><span>Total</span><span class="num">{money(totals.total, cur)}</span></div>
          {#if totals.paid}
            <div><span>Paid</span><span class="num">−{money(totals.paid, cur)}</span></div>
            <div class="balance-row">
              <b>Balance Due</b>
              <b class="num balance-amt">{money(totals.balance, cur)}</b>
            </div>
          {/if}
        </div>

        {#if s.bank || inv.notes}
          <div class="footer-sections">
            {#if s.bank}
              <div class="bank-box">
                <div class="bank-header">
                  <div class="lbl">Payment Details</div>
                  <button type="button" class="copy-bank-btn" onclick={copyBankDetails}>
                    {copiedBank ? "✓ Copied" : "Copy Bank Details"}
                  </button>
                </div>
                <div class="bank-content">{s.bank}</div>
              </div>
            {/if}
            {#if inv.notes}
              <div class="notes-box">
                <div class="lbl">Notes</div>
                <div class="notes-content">{inv.notes}</div>
              </div>
            {/if}
          </div>
        {/if}
      </div>
    {/if}
  </main>
</div>

<style>
  .invoice-page {
    min-height: 100vh;
    background: var(--basalt);
    padding-bottom: 60px;
  }

  .top-nav {
    position: sticky;
    top: 0;
    z-index: 10;
    background: rgba(10, 17, 19, 0.9);
    backdrop-filter: blur(10px);
    border-bottom: 1px solid var(--line);
  }

  .nav-inner {
    display: flex;
    justify-content: space-between;
    align-items: center;
    height: 64px;
  }

  .brand-link {
    font-family: var(--f-display);
    font-weight: 900;
    font-size: 22px;
    letter-spacing: 0.04em;
    display: flex;
    align-items: center;
    gap: 8px;
    color: var(--foam);
    cursor: pointer;
  }

  .brand-link i {
    width: 9px;
    height: 9px;
    border-radius: 50%;
    background: var(--wax);
  }

  .actions {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .main-content {
    margin-top: 36px;
    max-width: 860px;
  }

  .error-box {
    text-align: center;
    padding: 60px 20px;
    background: var(--panel);
    border: 1px solid var(--line);
    border-radius: 4px;
    display: grid;
    gap: 16px;
    justify-items: center;
  }

  .error-box h2 {
    font-size: 32px;
    font-weight: 800;
  }

  .error-box p {
    color: var(--muted);
  }

  /* Paper Invoice */
  .paper {
    background: #fbf8f2;
    color: #14201f;
    border-radius: 6px;
    padding: clamp(24px, 5vw, 48px);
    display: grid;
    gap: 28px;
    font-size: 15px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4);
  }

  .ph {
    display: flex;
    justify-content: space-between;
    gap: 20px;
    flex-wrap: wrap;
  }

  .paper h2 {
    font-size: clamp(36px, 5vw, 48px);
    font-weight: 900;
    color: #14201f;
  }

  .invoice-number {
    font-size: 18px;
    font-weight: 700;
    margin-top: 4px;
    color: #4a5756;
  }

  .biz-info,
  .dates-info {
    text-align: right;
  }

  .lbl {
    font: 600 11px/1 var(--f-mono);
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: #6c7a78;
    margin-bottom: 6px;
  }

  .paper table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 10px;
  }

  .paper th {
    text-align: left;
    font: 600 11px/1 var(--f-mono);
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #6c7a78;
    padding: 12px 10px;
    border-bottom: 2px solid #ddd5c6;
  }

  .paper td {
    padding: 14px 10px;
    border-bottom: 1px solid #ece5d8;
    color: #14201f;
  }

  .paper td.r,
  .paper th.r {
    text-align: right;
  }

  .tot {
    justify-self: end;
    min-width: 280px;
    display: grid;
    gap: 8px;
  }

  .tot div {
    display: flex;
    justify-content: space-between;
    gap: 20px;
  }

  .tot .g {
    font: 900 28px/1 var(--f-display);
    border-top: 2px solid #14201f;
    padding-top: 12px;
    margin-top: 4px;
  }

  .balance-row {
    font-size: 17px;
    border-top: 1px dashed #c0b8aa;
    padding-top: 8px;
    margin-top: 4px;
  }

  .balance-amt {
    color: #a82e22;
  }

  .stamp {
    display: inline-block;
    font: 700 12px/1 var(--f-mono);
    letter-spacing: 0.12em;
    padding: 6px 12px;
    border: 2px solid;
    border-radius: 3px;
    text-transform: uppercase;
  }

  .footer-sections {
    display: grid;
    gap: 16px;
    border-top: 1px solid #ece5d8;
    padding-top: 20px;
  }

  .bank-box {
    background: #f1ede4;
    border: 1px solid #e0d8ca;
    border-radius: 4px;
    padding: 16px;
  }

  .bank-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
  }

  .copy-bank-btn {
    font: 600 12px/1 var(--f-body);
    color: #14201f;
    background: #e2dbce;
    border: 1px solid #c9beae;
    padding: 4px 8px;
    border-radius: 3px;
    cursor: pointer;
  }

  .copy-bank-btn:hover {
    background: #d6cdbe;
  }

  .bank-content,
  .notes-content {
    white-space: pre-line;
    line-height: 1.5;
  }

  @media (max-width: 600px) {
    .biz-info,
    .dates-info {
      text-align: left;
    }
    .ph {
      flex-direction: column;
    }
    .tot {
      width: 100%;
    }
  }

  @media print {
    :global(body) {
      background: #fff;
    }
    .top-nav {
      display: none !important;
    }
    .main-content {
      margin: 0 !important;
      max-width: 100% !important;
    }
    .paper {
      box-shadow: none !important;
      padding: 0 !important;
    }
    .copy-bank-btn {
      display: none !important;
    }
  }
</style>
