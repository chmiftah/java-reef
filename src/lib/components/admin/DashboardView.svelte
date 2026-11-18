<script>
  import { db } from '../../stores/db.svelte.js';
  import { today, addDays, daysBetween, fmtDate, money, compact, invTotals, invStatus } from '../../utils/format.js';

  let { onNavigateView, onOpenNewBooking, onOpenNewInvoice } = $props();

  const cur = $derived(db.settings.currency);
  const t = today();

  let upcoming = $derived(
    db.bookings
      .filter(b => b.date >= t && b.date <= addDays(t, 14) && b.status !== "Cancelled")
      .sort((a, b) => a.date.localeCompare(b.date))
  );

  let newBookings = $derived(db.bookings.filter(b => b.status === "New"));

  let overdueInfo = $derived.by(() => {
    let outstanding = 0;
    let overdue = 0;
    const overList = [];
    db.invoices.forEach(i => {
      const s = invStatus(i);
      const tt = invTotals(i);
      if (["Sent", "Partial", "Overdue"].includes(s)) outstanding += tt.balance;
      if (s === "Overdue") {
        overdue += tt.balance;
        overList.push(i);
      }
    });
    return { outstanding, overdue, overList };
  });

  let thisMonthRevenue = $derived.by(() => {
    const ym = t.slice(0, 7);
    const pays = db.invoices.flatMap(i => i.payments || []);
    return pays.filter(p => (p.date || "").startsWith(ym)).reduce((s, p) => s + (+p.amount || 0), 0);
  });

  let chartData = $derived.by(() => {
    const pays = db.invoices.flatMap(i => i.payments || []);
    const months = [...Array(6)].map((_, k) => {
      const d = new Date();
      d.setDate(1);
      d.setMonth(d.getMonth() - 5 + k);
      return d.toISOString().slice(0, 7);
    });
    const rev = months.map(m =>
      pays.filter(p => (p.date || "").startsWith(m)).reduce((s, p) => s + (+p.amount || 0), 0)
    );
    const max = Math.max(1, ...rev);
    return { months, rev, max };
  });

  function getCustomerName(id) {
    const c = db.customers.find(x => x.id === id);
    return c ? c.name : "Deleted customer";
  }
</script>

<div class="top">
  <div>
    <span class="mono">Overview</span>
    <h1>Dashboard</h1>
  </div>
  <div class="tools">
    <button class="btn" type="button" onclick={onOpenNewBooking}>+ Booking</button>
    <button class="btn btn-wax" type="button" onclick={onOpenNewInvoice}>+ Invoice</button>
  </div>
</div>

<div class="kpis">
  <div class="kpi">
    <span class="mono">New bookings</span>
    <b class="num">{newBookings.length}</b>
    <small>Waiting for your reply</small>
  </div>
  <div class="kpi">
    <span class="mono">Next 14 days</span>
    <b class="num">{upcoming.length}</b>
    <small>Sessions scheduled</small>
  </div>
  <div class="kpi">
    <span class="mono">Paid this month</span>
    <b class="num">{money(thisMonthRevenue, cur)}</b>
    <small>{new Date().toLocaleDateString("en-GB", { month: "long" })}</small>
  </div>
  <div class="kpi">
    <span class="mono">Outstanding</span>
    <b class="num">{money(overdueInfo.outstanding, cur)}</b>
    <small>Sent, not fully paid</small>
  </div>
  <div class="kpi {overdueInfo.overdue ? 'alert' : ''}">
    <span class="mono">Overdue</span>
    <b class="num">{money(overdueInfo.overdue, cur)}</b>
    <small>{overdueInfo.overList.length} invoice{overdueInfo.overList.length === 1 ? "" : "s"} past due</small>
  </div>
</div>

<div class="panels">
  <div class="panel">
    <h3>
      Upcoming sessions
      <button class="btn btn-sm" type="button" onclick={() => onNavigateView('bookings')}>
        All bookings
      </button>
    </h3>
    {#if upcoming.length}
      <div class="list">
        {#each upcoming.slice(0, 8) as b}
          <div class="row">
            <div>
              <b>{getCustomerName(b.customerId)}</b>
              <small>{b.service} · {b.spot || ""}</small>
            </div>
            <div style="text-align:right">
              <span class="num">{fmtDate(b.date)}</span>
              <small>
                <span class="pill s-{b.status.toLowerCase()}">{b.status}</span>
              </small>
            </div>
          </div>
        {/each}
      </div>
    {:else}
      <p class="empty">No sessions in the next 14 days.</p>
    {/if}
  </div>

  <div class="panel">
    <h3>Revenue, last 6 months</h3>
    <div class="bars">
      {#each chartData.rev as v, k}
        <div class="bar {k === 5 ? 'cur' : ''}" title={money(v, cur)}>
          <span class="num">{v ? compact(v) : ""}</span>
          <i style="height:{Math.round((v / chartData.max) * 120)}px"></i>
        </div>
      {/each}
    </div>
    <div class="bar-lbl">
      {#each chartData.months as m}
        <span>{new Date(m + "-01T00:00").toLocaleDateString("en-GB", { month: "short" })}</span>
      {/each}
    </div>

    <h3 style="margin-top:22px">
      Overdue invoices
      <button class="btn btn-sm" type="button" onclick={() => onNavigateView('tracker')}>
        Tracker
      </button>
    </h3>
    {#if overdueInfo.overList.length}
      <div class="list">
        {#each overdueInfo.overList as i}
          <div class="row">
            <div>
              <b>{i.number}</b>
              <small>{getCustomerName(i.customerId)} · {daysBetween(i.dueDate, t)} days late</small>
            </div>
            <b class="num" style="color:var(--bad)">{money(invTotals(i).balance, cur)}</b>
          </div>
        {/each}
      </div>
    {:else}
      <p class="empty">Nothing overdue.</p>
    {/if}
  </div>
</div>

{#if !db.bookings.length && !db.customers.length}
  <div class="panel" style="margin-top:16px">
    <h3>Start here</h3>
    <p style="color:var(--muted);margin-bottom:12px">
      Bookings sent from the website's form show up here automatically. You can also add data by
      hand, or load example data to try everything out.
    </p>
    <button class="btn" type="button" onclick={() => db.seedExampleData()}>
      Load example data
    </button>
  </div>
{/if}

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

  .kpis {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
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

  .kpi small {
    color: var(--muted);
    font-size: 12px;
  }

  .kpi.alert {
    border-color: rgba(255, 107, 94, 0.45);
  }

  .kpi.alert b {
    color: var(--bad);
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
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 10px;
  }

  .empty {
    color: var(--muted);
    padding: 22px 0;
    text-align: center;
    font-size: 14px;
  }

  .list {
    display: grid;
  }

  .list .row {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    padding: 10px 0;
    border-bottom: 1px solid var(--line);
    align-items: center;
  }

  .list .row:last-child {
    border-bottom: 0;
  }

  .list .row small {
    color: var(--muted);
    display: block;
  }

  .bars {
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    gap: 10px;
    align-items: end;
    height: 170px;
    padding-top: 10px;
    border-bottom: 1px solid var(--line);
  }

  .bar {
    min-width: 0;
    display: grid;
    align-content: end;
    gap: 6px;
    height: 100%;
    text-align: center;
  }

  .bar i {
    display: block;
    background: linear-gradient(180deg, var(--reef), rgba(63, 184, 166, 0.35));
    border-radius: 2px 2px 0 0;
    min-height: 2px;
  }

  .bar.cur i {
    background: linear-gradient(180deg, var(--wax), rgba(242, 155, 56, 0.4));
  }

  .bar span {
    font: 500 10px/1.1 var(--f-mono);
    color: var(--muted);
    white-space: nowrap;
  }

  .bar-lbl {
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    gap: 10px;
    margin-top: 6px;
    text-align: center;
  }

  .bar-lbl span {
    font: 500 11px/1 var(--f-mono);
    color: var(--muted);
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

  .s-new { color: var(--wax); }
  .s-confirmed { color: var(--info); }
  .s-done { color: var(--ok); }
  .s-cancelled { color: var(--muted); }

  @media (max-width: 1100px) {
    .kpis {
      grid-template-columns: repeat(3, 1fr);
    }
    .panels {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 820px) {
    .kpis {
      grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    }
    .kpi b {
      font-size: 22px;
      overflow-wrap: anywhere;
    }
  }
</style>
