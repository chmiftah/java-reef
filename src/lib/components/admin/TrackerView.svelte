<script>
  import { db } from '../../stores/db.svelte.js';
  import {
    fmtDate,
    money,
    today,
    daysBetween,
    invTotals,
    invStatus
  } from '../../utils/format.js';
  import { getInvoiceShareUrl } from '../../utils/invoiceShare.js';

  let { onOpenNewInvoice, onOpenViewInvoice, onOpenPaymentForInvoice } = $props();

  const cur = $derived(db.settings.currency);
  const t = today();

  const COLS = [
    { status: "Draft", color: "var(--muted)" },
    { status: "Sent", color: "var(--info)" },
    { status: "Partial", color: "var(--warn)", label: "Partly paid" },
    { status: "Overdue", color: "var(--bad)" },
    { status: "Paid", color: "var(--ok)" }
  ];

  function getCustomer(id) {
    return db.customers.find(c => c.id === id);
  }

  function getCustomerName(id) {
    const c = getCustomer(id);
    return c ? c.name : "Deleted customer";
  }

  let liveInvoices = $derived(db.invoices.filter(i => invStatus(i) !== "Void"));

  let aging = $derived.by(() => {
    const res = { cur: 0, a: 0, b: 0, c: 0 };
    liveInvoices.forEach(i => {
      const s = invStatus(i);
      const bal = invTotals(i).balance;
      if (!["Sent", "Partial", "Overdue"].includes(s)) return;
      if (s !== "Overdue") {
        res.cur += bal;
      } else {
        const d = daysBetween(i.dueDate, t);
        if (d <= 30) res.a += bal;
        else if (d <= 60) res.b += bal;
        else res.c += bal;
      }
    });
    return res;
  });

  function isPaidRecent(i) {
    const last = (i.payments || []).map(p => p.date).sort().pop();
    return last && daysBetween(last, t) <= 30;
  }

  function getColumnInvoices(status) {
    let items = liveInvoices.filter(i => invStatus(i) === status);
    if (status === "Paid") items = items.filter(isPaidRecent);
    items.sort((a, b) => (a.dueDate || "").localeCompare(b.dueDate || ""));
    return items;
  }

  function getColumnSum(status, items) {
    return items.reduce((a, i) => {
      if (status === "Paid" || status === "Draft") {
        return a + invTotals(i).total;
      }
      return a + invTotals(i).balance;
    }, 0);
  }

  function copyReminder(inv) {
    const t = invTotals(inv);
    const c = getCustomer(inv.customerId) || {};
    const txt = `Hi ${c.name ? c.name.split(" ")[0] : "there"}, a friendly reminder that invoice ${inv.number} (${money(t.balance, cur)}) was due on ${fmtDate(inv.dueDate)}.${db.settings.bank ? `\n\nPayment details:\n${db.settings.bank}` : ""}\n\nThank you!\n${db.settings.business}`;

    navigator.clipboard.writeText(txt).then(
      () => db.showToast("Reminder copied"),
      () => db.showToast("Copy was blocked by the browser")
    );
  }

  async function handleCopyInvoiceLink(inv) {
    const c = getCustomer(inv.customerId);
    const url = getInvoiceShareUrl(inv, c, db.settings);
    try {
      await navigator.clipboard.writeText(url);
      if (!inv.sent) {
        db.markInvoiceSent(inv.id);
      }
      db.showToast("Invoice link copied to clipboard!");
    } catch (_) {
      db.showToast("Copy was blocked by the browser");
    }
  }
</script>

<div class="top">
  <div>
    <span class="mono">Follow the money</span>
    <h1>Invoice tracker</h1>
  </div>
  <div class="tools">
    <button class="btn btn-wax" type="button" onclick={onOpenNewInvoice}>+ Invoice</button>
  </div>
</div>

<div class="aging">
  <div class="kpi">
    <span class="mono">Not yet due</span>
    <b class="num">{money(aging.cur, cur)}</b>
  </div>
  <div class="kpi {aging.a ? 'alert' : ''}">
    <span class="mono">1–30 days late</span>
    <b class="num">{money(aging.a, cur)}</b>
  </div>
  <div class="kpi {aging.b ? 'alert' : ''}">
    <span class="mono">31–60 days late</span>
    <b class="num">{money(aging.b, cur)}</b>
  </div>
  <div class="kpi {aging.c ? 'alert' : ''}">
    <span class="mono">60+ days late</span>
    <b class="num">{money(aging.c, cur)}</b>
  </div>
</div>

<div class="board">
  {#each COLS as col}
    {@const items = getColumnInvoices(col.status)}
    {@const sum = getColumnSum(col.status, items)}
    <section class="col">
      <header>
        <span class="pill s-{col.status.toLowerCase()}" style="justify-self:start">
          {col.label || col.status}
        </span>
        <span class="num">{money(sum, cur)}</span>
        <span class="cnt">
          {items.length} invoice{items.length === 1 ? "" : "s"}{col.status === "Paid" ? " · last 30 days" : ""}
        </span>
      </header>
      <div class="cards">
        {#if items.length}
          {#each items as i}
            {@const tt = invTotals(i)}
            {@const d = i.dueDate ? daysBetween(t, i.dueDate) : null}
            {@const when =
              col.status === "Paid"
                ? `Paid ${fmtDate((i.payments || []).map(p => p.date).sort().pop())}`
                : d === null
                ? "No due date"
                : d < 0
                ? `${-d} days overdue`
                : d === 0
                ? "Due today"
                : `Due in ${d} days`}
            <article class="card" style="--c:{col.color}">
              <div class="t">
                <span class="num">{i.number}</span>
                <span class="num">
                  {money(col.status === "Paid" || col.status === "Draft" ? tt.total : tt.balance, cur)}
                </span>
              </div>
              <div class="m">
                <span>{getCustomerName(i.customerId)}</span>
                <span style={d < 0 && col.status !== "Paid" ? "color:var(--bad)" : ""}>{when}</span>
              </div>
              {#if tt.paid && col.status !== "Paid"}
                <div class="progress" title="{Math.round((tt.paid / tt.total) * 100)}% paid">
                  <i style="width:{Math.min(100, (tt.paid / tt.total) * 100)}%"></i>
                </div>
              {/if}
              <div class="acts">
                <button
                  class="icon-btn"
                  type="button"
                  title="Copy shareable link"
                  onclick={() => handleCopyInvoiceLink(i)}
                >
                  🔗 Link
                </button>
                <button
                  class="icon-btn"
                  type="button"
                  onclick={() => onOpenViewInvoice(i)}
                >
                  View
                </button>
                {#if col.status === "Draft"}
                  <button
                    class="icon-btn"
                    type="button"
                    onclick={() => db.markInvoiceSent(i.id)}
                  >
                    Mark sent
                  </button>
                {/if}
                {#if col.status !== "Paid" && col.status !== "Draft"}
                  <button
                    class="icon-btn"
                    type="button"
                    onclick={() => onOpenPaymentForInvoice(i)}
                  >
                    Payment
                  </button>
                {/if}
                {#if col.status === "Overdue"}
                  <button
                    class="icon-btn"
                    type="button"
                    onclick={() => copyReminder(i)}
                  >
                    Copy reminder
                  </button>
                {/if}
              </div>
            </article>
          {/each}
        {:else}
          <p class="empty" style="padding:12px 0">Empty</p>
        {/if}
      </div>
    </section>
  {/each}
</div>

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

  .aging {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
    margin-bottom: 20px;
  }

  .kpi {
    min-width: 0;
    background: var(--panel);
    border: 1px solid var(--line);
    border-radius: 4px;
    padding: 16px;
    display: grid;
    gap: 6px;
  }

  .kpi .mono {
    color: var(--muted);
  }

  .kpi b {
    font: 800 30px/1 var(--f-display);
    letter-spacing: 0.02em;
  }

  .kpi.alert {
    border-color: rgba(255, 107, 94, 0.45);
  }

  .kpi.alert b {
    color: var(--bad);
  }

  .board {
    display: grid;
    grid-template-columns: repeat(5, minmax(220px, 1fr));
    gap: 12px;
    overflow-x: auto;
    padding-bottom: 8px;
  }

  .col {
    background: var(--panel);
    border: 1px solid var(--line);
    border-radius: 4px;
    display: flex;
    flex-direction: column;
    min-height: 240px;
  }

  .col header {
    padding: 14px;
    border-bottom: 1px solid var(--line);
    display: grid;
    gap: 6px;
  }

  .col header .num {
    font: 800 22px/1 var(--f-display);
  }

  .col header .cnt {
    color: var(--muted);
    font-size: 12px;
  }

  .col .cards {
    padding: 10px;
    display: grid;
    gap: 10px;
    align-content: start;
  }

  .card {
    background: var(--basalt);
    border: 1px solid var(--line);
    border-radius: 3px;
    padding: 12px;
    display: grid;
    gap: 8px;
    border-left: 3px solid var(--c, var(--line));
  }

  .card .t {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    gap: 2px 8px;
    font-weight: 600;
  }

  .card .t span {
    white-space: nowrap;
  }

  .card .m {
    color: var(--muted);
    font-size: 12px;
    display: flex;
    justify-content: space-between;
    gap: 8px;
  }

  .card .acts {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }

  .progress {
    height: 4px;
    background: rgba(236, 230, 217, 0.08);
    border-radius: 2px;
    overflow: hidden;
  }

  .progress i {
    display: block;
    height: 100%;
    background: var(--ok);
  }

  .pill {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font: 600 11px/1 var(--f-mono);
    letter-spacing: 0.05em;
    text-transform: uppercase;
    padding: 5px 9px;
    border-radius: 99px;
    border: 1px solid currentColor;
    white-space: nowrap;
  }

  .pill:before {
    content: "";
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: currentColor;
  }

  .s-draft { color: var(--muted); }
  .s-sent { color: var(--info); }
  .s-partial { color: var(--warn); }
  .s-overdue { color: var(--bad); }
  .s-paid { color: var(--ok); }

  .empty {
    color: var(--muted);
    padding: 22px 0;
    text-align: center;
    font-size: 14px;
  }

  @media (max-width: 1100px) {
    .aging {
      grid-template-columns: 1fr 1fr;
    }
  }

  @media (max-width: 820px) {
    .aging {
      grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    }
    .board {
      -webkit-overflow-scrolling: touch;
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
    .kpi {
      padding: 12px 10px;
    }
    .kpi b {
      font-size: clamp(16px, 4.4vw, 22px);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }
</style>
