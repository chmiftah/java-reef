<script>
  import { db } from '../../stores/db.svelte.js';
  import {
    fmtDate,
    money,
    today,
    addDays,
    invTotals,
    invStatus,
    nextInvNumber,
    METHODS
  } from '../../utils/format.js';
  import Modal from './Modal.svelte';

  let searchQuery = $state("");
  let statusFilter = $state("All");
  const STATS = ["All", "Draft", "Sent", "Partial", "Overdue", "Paid", "Void"];

  // Modals state
  let isEditModalOpen = $state(false);
  let editingInvoice = $state(null);
  let editError = $state("");

  let isPaymentModalOpen = $state(false);
  let paymentTargetInvoice = $state(null);
  let paymentAmount = $state(0);
  let paymentDate = $state(today());
  let paymentMethod = $state(METHODS[0]);
  let paymentRef = $state("");
  let paymentError = $state("");

  let isPreviewModalOpen = $state(false);
  let previewInvoice = $state(null);

  let isDeleteModalOpen = $state(false);
  let deletingInvoice = $state(null);

  const cur = $derived(db.settings.currency);

  function getCustomer(id) {
    return db.customers.find(c => c.id === id);
  }

  function getCustomerName(id) {
    const c = getCustomer(id);
    return c ? c.name : "Deleted customer";
  }

  let filteredInvoices = $derived.by(() => {
    const q = searchQuery.toLowerCase().trim();
    return db.invoices
      .filter(i => statusFilter === "All" || invStatus(i) === statusFilter)
      .filter(i => !q || [i.number, getCustomerName(i.customerId)].join(" ").toLowerCase().includes(q))
      .sort((a, b) => (b.issueDate || "").localeCompare(a.issueDate || "") || b.number.localeCompare(a.number));
  });

  export function openNewInvoice(prefill = {}) {
    const s = db.settings;
    editingInvoice = {
      number: nextInvNumber(s, db.invoices),
      issueDate: today(),
      dueDate: addDays(today(), +s.dueDays || 7),
      customerId: prefill.customerId || (db.customers[0]?.id || ""),
      bookingId: prefill.bookingId || null,
      items: prefill.items ? JSON.parse(JSON.stringify(prefill.items)) : [{ desc: "", qty: 1, price: 0 }],
      discount: 0,
      taxRate: +s.taxRate || 0,
      sent: false,
      notes: "",
      payments: []
    };
    editError = "";
    isEditModalOpen = true;
  }

  function openEditInvoice(inv) {
    editingInvoice = JSON.parse(JSON.stringify(inv));
    editError = "";
    isEditModalOpen = true;
  }

  function addLineItem() {
    if (!editingInvoice) return;
    editingInvoice.items = [...editingInvoice.items, { desc: "", qty: 1, price: 0 }];
  }

  function removeLineItem(index) {
    if (!editingInvoice) return;
    const copy = [...editingInvoice.items];
    copy.splice(index, 1);
    editingInvoice.items = copy.length ? copy : [{ desc: "", qty: 1, price: 0 }];
  }

  let editingTotals = $derived.by(() => {
    if (!editingInvoice) return { sub: 0, disc: 0, tax: 0, total: 0, paid: 0, balance: 0 };
    return invTotals(editingInvoice);
  });

  function handleSaveInvoice() {
    if (!editingInvoice.customerId) {
      editError = "Please select a customer.";
      return;
    }
    const validItems = editingInvoice.items.filter(it => it.desc.trim() || +it.price);
    if (!validItems.length) {
      editError = "Add at least one line item.";
      return;
    }
    const num = editingInvoice.number.trim();
    if (!num) {
      editError = "Invoice number is required.";
      return;
    }
    if (db.invoices.some(x => x.number === num && x.id !== editingInvoice.id)) {
      editError = "That invoice number is already used.";
      return;
    }

    db.upsertInvoice({
      ...editingInvoice,
      number: num,
      items: validItems.map(it => ({ ...it, qty: +it.qty || 1, price: +it.price || 0 })),
      discount: +editingInvoice.discount || 0,
      taxRate: +editingInvoice.taxRate || 0,
      notes: (editingInvoice.notes || "").trim()
    });
    isEditModalOpen = false;
  }

  // Payment
  function openPayment(inv) {
    paymentTargetInvoice = inv;
    const t = invTotals(inv);
    paymentAmount = t.balance;
    paymentDate = today();
    paymentMethod = METHODS[0];
    paymentRef = "";
    paymentError = "";
    isPaymentModalOpen = true;
  }

  function handleSavePayment() {
    if (!(+paymentAmount > 0)) {
      paymentError = "Enter an amount above zero.";
      return;
    }
    db.addPayment(paymentTargetInvoice.id, {
      amount: +paymentAmount,
      date: paymentDate,
      method: paymentMethod,
      ref: paymentRef
    });
    isPaymentModalOpen = false;
  }

  function handleRemovePayment(payId) {
    db.removePayment(paymentTargetInvoice.id, payId);
    // Refresh local copy
    paymentTargetInvoice = db.invoices.find(x => x.id === paymentTargetInvoice.id);
  }

  // Preview
  export function openPreview(inv) {
    previewInvoice = inv;
    isPreviewModalOpen = true;
  }

  async function copyInvoiceText(inv) {
    const s = db.settings;
    const c = getCustomer(inv.customerId) || {};
    const t = invTotals(inv);
    const txt = `INVOICE ${inv.number}
${s.business}

Bill to: ${c.name || ""}
Issued: ${fmtDate(inv.issueDate)}  Due: ${fmtDate(inv.dueDate)}

${inv.items.map(it => `- ${it.desc}  ${it.qty} x ${money(it.price, s.currency)} = ${money(it.qty * it.price, s.currency)}`).join("\n")}

Total: ${money(t.total, s.currency)}${t.paid ? `\nPaid: ${money(t.paid, s.currency)}\nBalance due: ${money(t.balance, s.currency)}` : ""}${s.bank ? `\n\nPayment details:\n${s.bank}` : ""}`;

    try {
      await navigator.clipboard.writeText(txt);
      db.showToast("Invoice copied — paste it into WhatsApp or email");
    } catch (_) {
      db.showToast("Copy was blocked by the browser");
    }
  }

  function confirmDelete(inv) {
    deletingInvoice = inv;
    isDeleteModalOpen = true;
  }

  function executeDelete() {
    if (deletingInvoice) {
      db.deleteInvoice(deletingInvoice.id);
      deletingInvoice = null;
    }
    isDeleteModalOpen = false;
  }
</script>

<div class="top">
  <div>
    <span class="mono">Billing</span>
    <h1>Invoices</h1>
  </div>
  <div class="tools">
    <input
      type="search"
      placeholder="Search number or customer…"
      bind:value={searchQuery}
      aria-label="Search"
    />
    <button class="btn btn-wax" type="button" onclick={() => openNewInvoice()}>+ Invoice</button>
  </div>
</div>

<div class="chips">
  {#each STATS as s}
    <button
      class="chip {statusFilter === s ? 'on' : ''}"
      type="button"
      onclick={() => (statusFilter = s)}
    >
      {s === "Partial" ? "Partly paid" : s}
    </button>
  {/each}
</div>

{#if filteredInvoices.length}
  <div class="tablewrap">
    <table>
      <thead>
        <tr>
          <th>Number</th>
          <th>Customer</th>
          <th>Issued</th>
          <th>Due</th>
          <th class="r">Total</th>
          <th class="r">Balance</th>
          <th>Status</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {#each filteredInvoices as inv}
          {@const t = invTotals(inv)}
          {@const s = invStatus(inv)}
          <tr>
            <td><b class="num">{inv.number}</b></td>
            <td>{getCustomerName(inv.customerId)}</td>
            <td class="num">{fmtDate(inv.issueDate)}</td>
            <td class="num">{fmtDate(inv.dueDate)}</td>
            <td class="r num">{money(t.total, cur)}</td>
            <td class="r num">{t.balance && s !== "Void" ? money(t.balance, cur) : "—"}</td>
            <td>
              <span class="pill s-{s.toLowerCase()}">{s === "Partial" ? "Partly paid" : s}</span>
            </td>
            <td class="act">
              <button
                class="icon-btn"
                type="button"
                onclick={() => openPreview(inv)}
              >
                View
              </button>
              {#if !["Paid", "Void"].includes(s)}
                <button
                  class="icon-btn"
                  type="button"
                  onclick={() => openPayment(inv)}
                >
                  Payment
                </button>
              {/if}
              <button
                class="icon-btn"
                type="button"
                onclick={() => openEditInvoice(inv)}
              >
                Edit
              </button>
              <button
                class="icon-btn del"
                type="button"
                onclick={() => confirmDelete(inv)}
              >
                Delete
              </button>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
{:else}
  <div class="panel">
    <p class="empty">No invoices {statusFilter !== "All" ? "with this status" : "yet"}.</p>
  </div>
{/if}

<!-- Edit / Create Invoice Modal -->
<Modal
  title={editingInvoice?.id ? "Edit invoice" : "New invoice"}
  open={isEditModalOpen}
  wide={true}
  onClose={() => (isEditModalOpen = false)}
  onSave={handleSaveInvoice}
>
  {#if editingInvoice}
    <div class="grid3">
      <label for="i-num">
        Invoice number
        <input id="i-num" bind:value={editingInvoice.number} />
      </label>
      <label for="i-issue">
        Issue date
        <input id="i-issue" type="date" bind:value={editingInvoice.issueDate} />
      </label>
      <label for="i-due">
        Due date
        <input id="i-due" type="date" bind:value={editingInvoice.dueDate} />
      </label>
      <label class="full" for="i-cust" style="grid-column: 1 / 3">
        Customer
        <select id="i-cust" bind:value={editingInvoice.customerId}>
          <option value="">Choose a customer</option>
          {#each db.customers as c}
            <option value={c.id}>{c.name}</option>
          {/each}
        </select>
      </label>
      <label for="i-book">
        Booking (optional)
        <select id="i-book" bind:value={editingInvoice.bookingId}>
          <option value="">None</option>
          {#each db.bookings.filter(b => !editingInvoice.customerId || b.customerId === editingInvoice.customerId) as b}
            <option value={b.id}>{fmtDate(b.date)} · {b.service}</option>
          {/each}
        </select>
      </label>
    </div>

    <div>
      <span class="mono" style="color:var(--muted)">Items</span>
      <div class="items" style="margin-top:8px">
        {#each editingInvoice.items as it, k}
          <div class="item">
            <input
              aria-label="Description"
              bind:value={it.desc}
              placeholder="Description, e.g. Surf session filming – water angle"
            />
            <input
              aria-label="Quantity"
              type="number"
              min="0"
              step="any"
              bind:value={it.qty}
            />
            <input
              aria-label="Unit price"
              type="number"
              min="0"
              step="any"
              bind:value={it.price}
            />
            <span class="amt">{money((+it.qty || 0) * (+it.price || 0), cur)}</span>
            <button
              type="button"
              class="icon-btn del"
              onclick={() => removeLineItem(k)}
              aria-label="Remove line"
            >
              ✕
            </button>
          </div>
        {/each}
      </div>
      <button class="btn btn-sm" type="button" onclick={addLineItem} style="margin-top:8px">
        + Add line
      </button>
    </div>

    <div class="grid3">
      <label for="i-disc">
        Discount ({cur})
        <input id="i-disc" type="number" min="0" step="any" bind:value={editingInvoice.discount} />
      </label>
      <label for="i-tax">
        Tax %
        <input id="i-tax" type="number" min="0" step="any" bind:value={editingInvoice.taxRate} />
      </label>
      <label for="i-sent" style="align-content:end">
        <span style="display:flex;gap:8px;align-items:center;font-weight:500;color:var(--foam);padding:10px 0">
          <input id="i-sent" type="checkbox" bind:checked={editingInvoice.sent} style="width:auto" />
          Sent to customer
        </span>
      </label>
      <label class="full" for="i-notes">
        Notes on invoice
        <textarea
          id="i-notes"
          bind:value={editingInvoice.notes}
          placeholder="Payment instructions, thank-you note…"
        ></textarea>
      </label>
    </div>

    <div class="totals">
      <div><span>Subtotal</span><span class="num">{money(editingTotals.sub, cur)}</span></div>
      {#if editingTotals.disc}
        <div><span>Discount</span><span class="num">−{money(editingTotals.disc, cur)}</span></div>
      {/if}
      {#if editingTotals.tax}
        <div><span>Tax {editingInvoice.taxRate}%</span><span class="num">{money(editingTotals.tax, cur)}</span></div>
      {/if}
      {#if editingTotals.paid}
        <div><span>Paid</span><span class="num">−{money(editingTotals.paid, cur)}</span></div>
      {/if}
      <div class="grand"><span>Total</span><span class="num">{money(editingTotals.total, cur)}</span></div>
    </div>

    {#if editError}
      <p class="err" role="alert">{editError}</p>
    {/if}
  {/if}
</Modal>

<!-- Payment Modal -->
<Modal
  title={`Record payment · ${paymentTargetInvoice?.number || ""}`}
  open={isPaymentModalOpen}
  onClose={() => (isPaymentModalOpen = false)}
  onSave={handleSavePayment}
  saveLabel="Record payment"
>
  {#if paymentTargetInvoice}
    {@const t = invTotals(paymentTargetInvoice)}
    <p style="color:var(--muted)">
      {getCustomerName(paymentTargetInvoice.customerId)} · Balance
      <b class="num" style="color:var(--foam)">{money(t.balance, cur)}</b>
      of {money(t.total, cur)}
    </p>
    <div class="grid2">
      <label for="p-amt">
        Amount ({cur})
        <input id="p-amt" type="number" min="0" step="any" bind:value={paymentAmount} />
      </label>
      <label for="p-date">
        Date
        <input id="p-date" type="date" bind:value={paymentDate} />
      </label>
      <label for="p-method">
        Method
        <select id="p-method" bind:value={paymentMethod}>
          {#each METHODS as m}
            <option value={m}>{m}</option>
          {/each}
        </select>
      </label>
      <label for="p-ref">
        Reference
        <input id="p-ref" bind:value={paymentRef} placeholder="Transfer ref, receipt no." />
      </label>
    </div>

    {#if paymentTargetInvoice.payments?.length}
      <div>
        <span class="mono" style="color:var(--muted)">Previous payments</span>
        <div class="list">
          {#each paymentTargetInvoice.payments as p}
            <div class="row">
              <div>
                {fmtDate(p.date)}
                <small>{p.method}{p.ref ? " · " + p.ref : ""}</small>
              </div>
              <span style="display:flex;gap:8px;align-items:center">
                <b class="num">{money(p.amount, cur)}</b>
                <button
                  type="button"
                  class="icon-btn del"
                  onclick={() => handleRemovePayment(p.id)}
                >
                  Remove
                </button>
              </span>
            </div>
          {/each}
        </div>
      </div>
    {/if}

    {#if paymentError}
      <p class="err" role="alert">{paymentError}</p>
    {/if}
  {/if}
</Modal>

<!-- Preview / Print Modal -->
<Modal
  title={previewInvoice?.number || "Invoice"}
  open={isPreviewModalOpen}
  wide={true}
  onClose={() => (isPreviewModalOpen = false)}
>
  {#if previewInvoice}
    {@const s = db.settings}
    {@const c = getCustomer(previewInvoice.customerId) || {}}
    {@const t = invTotals(previewInvoice)}
    {@const st = invStatus(previewInvoice)}
    {@const stampColor = {
      Paid: "#1f8a55",
      Overdue: "#c4372a",
      Partial: "#b07a10",
      Void: "#777",
      Draft: "#777",
      Sent: "#2a5fae"
    }[st]}

    <div class="paper" id="printArea">
      <div class="ph">
        <div>
          <h2>Invoice</h2>
          <div class="num" style="margin-top:6px">{previewInvoice.number}</div>
        </div>
        <div style="text-align:right">
          <b>{s.business}</b>
          <div>{s.address}</div>
          <div>{s.email}</div>
          <div>{s.phone}</div>
        </div>
      </div>

      <div class="ph">
        <div>
          <div class="lbl">Bill to</div>
          <b>{c.name || "—"}</b>
          <div>{c.email || ""}</div>
          <div>{c.phone || ""}</div>
          <div>{c.country || ""}</div>
        </div>
        <div style="text-align:right">
          <div class="lbl">Issued</div>
          <div>{fmtDate(previewInvoice.issueDate)}</div>
          <div class="lbl" style="margin-top:10px">Due</div>
          <div>{fmtDate(previewInvoice.dueDate)}</div>
          <div style="margin-top:12px">
            <span class="stamp" style="color:{stampColor}">
              {st === "Partial" ? "Partly paid" : st}
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
          {#each previewInvoice.items as it}
            <tr>
              <td>{it.desc}</td>
              <td class="r num">{it.qty}</td>
              <td class="r num">{money(it.price, s.currency)}</td>
              <td class="r num">{money(it.qty * it.price, s.currency)}</td>
            </tr>
          {/each}
        </tbody>
      </table>

      <div class="tot">
        <div><span>Subtotal</span><span class="num">{money(t.sub, s.currency)}</span></div>
        {#if t.disc}
          <div><span>Discount</span><span class="num">−{money(t.disc, s.currency)}</span></div>
        {/if}
        {#if t.tax}
          <div><span>Tax {previewInvoice.taxRate}%</span><span class="num">{money(t.tax, s.currency)}</span></div>
        {/if}
        <div class="g"><span>Total</span><span class="num">{money(t.total, s.currency)}</span></div>
        {#if t.paid}
          <div><span>Paid</span><span class="num">−{money(t.paid, s.currency)}</span></div>
          <div><b>Balance due</b><b class="num">{money(t.balance, s.currency)}</b></div>
        {/if}
      </div>

      {#if s.bank || previewInvoice.notes}
        <div style="display:grid;gap:12px">
          {#if s.bank}
            <div>
              <div class="lbl">Payment details</div>
              <div style="white-space:pre-line">{s.bank}</div>
            </div>
          {/if}
          {#if previewInvoice.notes}
            <div>
              <div class="lbl">Notes</div>
              <div style="white-space:pre-line">{previewInvoice.notes}</div>
            </div>
          {/if}
        </div>
      {/if}
    </div>
  {/if}

  {#snippet extraActions()}
    {#if previewInvoice}
      <button class="btn" type="button" onclick={() => copyInvoiceText(previewInvoice)}>
        Copy as text
      </button>
      <button class="btn" type="button" onclick={() => window.print()}>
        Print / Save PDF
      </button>
      {#if !previewInvoice.sent && invStatus(previewInvoice) !== "Void"}
        <button
          class="btn btn-wax"
          type="button"
          onclick={() => {
            db.markInvoiceSent(previewInvoice.id);
            previewInvoice = { ...previewInvoice, sent: true };
          }}
        >
          Mark as sent
        </button>
      {/if}
    {/if}
  {/snippet}
</Modal>

<!-- Delete Modal -->
<Modal
  title="Delete invoice?"
  open={isDeleteModalOpen}
  onClose={() => (isDeleteModalOpen = false)}
  onSave={executeDelete}
  saveLabel="Delete invoice"
>
  {#if deletingInvoice}
    <p>
      Invoice <b>{deletingInvoice.number}</b> and its payment records will be removed. This cannot be undone.
    </p>
  {/if}
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

  .tools input[type="search"] {
    width: auto;
    min-width: 220px;
    padding: 9px 12px;
  }

  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-bottom: 14px;
  }

  .chip {
    border: 1px solid var(--line);
    background: none;
    border-radius: 99px;
    padding: 6px 12px;
    font: 500 13px/1 var(--f-body);
    color: var(--muted);
    cursor: pointer;
    transition: all 0.15s;
  }

  .chip:hover {
    color: var(--foam);
  }

  .chip.on {
    border-color: var(--reef);
    color: var(--foam);
    background: rgba(63, 184, 166, 0.12);
  }

  .tablewrap {
    background: var(--panel);
    border: 1px solid var(--line);
    border-radius: 4px;
    overflow-x: auto;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    min-width: 720px;
  }

  th {
    text-align: left;
    font: 600 11px/1 var(--f-mono);
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--muted);
    padding: 13px 14px;
    border-bottom: 1px solid var(--line);
    white-space: nowrap;
  }

  td {
    padding: 12px 14px;
    border-bottom: 1px solid var(--line);
    vertical-align: middle;
  }

  tr:last-child td {
    border-bottom: 0;
  }

  tbody tr:hover {
    background: rgba(236, 230, 217, 0.03);
  }

  td.r,
  th.r {
    text-align: right;
  }

  td.act {
    text-align: right;
    white-space: nowrap;
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
  .s-void { color: #6d7c7b; }

  .panel {
    background: var(--panel);
    border: 1px solid var(--line);
    border-radius: 4px;
    padding: 18px;
  }

  .empty {
    color: var(--muted);
    padding: 22px 0;
    text-align: center;
    font-size: 14px;
  }

  .grid2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 14px;
  }

  .grid3 {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 14px;
  }

  .full {
    grid-column: 1 / -1;
  }

  .items {
    display: grid;
    gap: 8px;
  }

  .item {
    display: grid;
    grid-template-columns: 1fr 70px 140px 120px 32px;
    gap: 8px;
    align-items: center;
  }

  .item .amt {
    text-align: right;
    font-variant-numeric: tabular-nums;
    color: var(--muted);
  }

  .totals {
    display: grid;
    gap: 6px;
    justify-self: end;
    min-width: 260px;
  }

  .totals div {
    display: flex;
    justify-content: space-between;
    gap: 20px;
  }

  .totals .grand {
    font: 800 24px/1 var(--f-display);
    border-top: 1px solid var(--line);
    padding-top: 10px;
    margin-top: 4px;
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

  /* Paper Printable Invoice */
  .paper {
    background: #fbf8f2;
    color: #14201f;
    border-radius: 4px;
    padding: 36px;
    display: grid;
    gap: 24px;
    font-size: 14px;
  }

  .paper .ph {
    display: flex;
    justify-content: space-between;
    gap: 20px;
    flex-wrap: wrap;
  }

  .paper h2 {
    font-size: 40px;
    font-weight: 900;
    color: #14201f;
  }

  .paper .lbl {
    font: 600 10px/1 var(--f-mono);
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: #6c7a78;
    margin-bottom: 6px;
  }

  .paper table {
    min-width: 0;
  }

  .paper th {
    color: #6c7a78;
    border-color: #ddd5c6;
  }

  .paper td {
    color: #14201f;
    border-color: #ece5d8;
  }

  .paper .tot {
    justify-self: end;
    min-width: 260px;
    display: grid;
    gap: 6px;
  }

  .paper .tot div {
    display: flex;
    justify-content: space-between;
    gap: 20px;
  }

  .paper .tot .g {
    font: 900 26px/1 var(--f-display);
    border-top: 2px solid #14201f;
    padding-top: 10px;
  }

  .paper .stamp {
    display: inline-block;
    font: 700 12px/1 var(--f-mono);
    letter-spacing: 0.1em;
    padding: 6px 10px;
    border: 2px solid;
    border-radius: 3px;
    text-transform: uppercase;
  }

  @media (max-width: 820px) {
    .grid2,
    .grid3 {
      grid-template-columns: 1fr;
    }
    .item {
      grid-template-columns: 1fr 60px 1fr 32px;
    }
    .item .amt {
      display: none;
    }
  }

  @media print {
    :global(body *) {
      visibility: hidden;
    }
    #printArea,
    :global(#printArea *) {
      visibility: visible;
    }
    #printArea {
      position: absolute;
      left: 0;
      top: 0;
      width: 100%;
    }
  }
</style>
