<script>
  import { db } from '../../stores/db.svelte.js';
  import { fmtDate, money, today, SERVICES, SPOTS, BSTAT } from '../../utils/format.js';
  import Modal from './Modal.svelte';

  let { onOpenInvoiceForBooking } = $props();

  let searchQuery = $state("");
  let statusFilter = $state("All");
  let editingBooking = $state(null);
  let isModalOpen = $state(false);
  let formError = $state("");

  let deletingBooking = $state(null);
  let isDeleteModalOpen = $state(false);

  const cur = $derived(db.settings.currency);

  let counts = $derived.by(() => {
    const c = {};
    BSTAT.forEach(s => {
      c[s] = db.bookings.filter(b => b.status === s).length;
    });
    return c;
  });

  function getCustomer(id) {
    return db.customers.find(c => c.id === id);
  }

  function getCustomerName(id) {
    const c = getCustomer(id);
    return c ? c.name : "Deleted customer";
  }

  function getInvoiceForBooking(bookingId) {
    return db.invoices.find(i => i.bookingId === bookingId);
  }

  let filteredBookings = $derived.by(() => {
    const q = searchQuery.toLowerCase().trim();
    return db.bookings
      .filter(b => statusFilter === "All" || b.status === statusFilter)
      .filter(b => !q || [getCustomerName(b.customerId), b.service, b.spot, b.notes].join(" ").toLowerCase().includes(q))
      .sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  });

  export function openNewBooking(customerId = "") {
    editingBooking = {
      customerId: customerId || (db.customers[0]?.id || ""),
      service: SERVICES[0],
      date: today(),
      days: 1,
      spot: SPOTS[0],
      people: 1,
      price: "",
      status: "New",
      notes: ""
    };
    formError = "";
    isModalOpen = true;
  }

  function openEditBooking(b) {
    editingBooking = { ...b };
    formError = "";
    isModalOpen = true;
  }

  function handleSaveBooking() {
    if (!editingBooking.customerId) {
      formError = "Please select a customer.";
      return;
    }
    if (!editingBooking.date) {
      formError = "Pick a date.";
      return;
    }
    db.upsertBooking({
      ...editingBooking,
      days: +editingBooking.days || 1,
      people: +editingBooking.people || 1,
      price: editingBooking.price === "" ? null : +editingBooking.price,
      notes: (editingBooking.notes || "").trim()
    });
    isModalOpen = false;
  }

  function confirmDelete(b) {
    deletingBooking = b;
    isDeleteModalOpen = true;
  }

  function executeDelete() {
    if (deletingBooking) {
      db.deleteBooking(deletingBooking.id);
      deletingBooking = null;
    }
    isDeleteModalOpen = false;
  }
</script>

<div class="top">
  <div>
    <span class="mono">Sessions</span>
    <h1>Bookings</h1>
  </div>
  <div class="tools">
    <input
      type="search"
      placeholder="Search customer, service, spot…"
      bind:value={searchQuery}
      aria-label="Search"
    />
    <button class="btn btn-wax" type="button" onclick={() => openNewBooking()}>+ Booking</button>
  </div>
</div>

<div class="chips">
  <button
    class="chip {statusFilter === 'All' ? 'on' : ''}"
    type="button"
    onclick={() => (statusFilter = "All")}
  >
    All
  </button>
  {#each BSTAT as s}
    <button
      class="chip {statusFilter === s ? 'on' : ''}"
      type="button"
      onclick={() => (statusFilter = s)}
    >
      {s} · {counts[s]}
    </button>
  {/each}
</div>

{#if filteredBookings.length}
  <div class="tablewrap">
    <table>
      <thead>
        <tr>
          <th>Date</th>
          <th>Customer</th>
          <th>Service</th>
          <th>Spot</th>
          <th class="r">People</th>
          <th class="r">Price</th>
          <th>Status</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {#each filteredBookings as b}
          {@const inv = getInvoiceForBooking(b.id)}
          <tr>
            <td class="num">
              {fmtDate(b.date)}
              <small>{b.days > 1 ? b.days + " days" : "1 day"}</small>
            </td>
            <td>
              <b>{getCustomerName(b.customerId)}</b>
              {#if b.source === "Website"}
                <small>From website</small>
              {/if}
            </td>
            <td>{b.service}</td>
            <td>{b.spot || "—"}</td>
            <td class="r num">{b.people || 1}</td>
            <td class="r num">{b.price ? money(b.price, cur) : "—"}</td>
            <td>
              <span class="pill s-{b.status.toLowerCase()}">{b.status}</span>
            </td>
            <td class="act">
              {#if inv}
                <button
                  class="icon-btn"
                  type="button"
                  onclick={() => onOpenInvoiceForBooking(b, inv.id)}
                >
                  {inv.number}
                </button>
              {:else}
                <button
                  class="icon-btn"
                  type="button"
                  onclick={() => onOpenInvoiceForBooking(b)}
                >
                  Invoice
                </button>
              {/if}
              <button
                class="icon-btn"
                type="button"
                onclick={() => openEditBooking(b)}
              >
                Edit
              </button>
              <button
                class="icon-btn del"
                type="button"
                onclick={() => confirmDelete(b)}
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
    <p class="empty">
      No bookings {statusFilter !== "All" ? `with status “${statusFilter}”` : "yet"}.
    </p>
  </div>
{/if}

<!-- Booking Modal -->
<Modal
  title={editingBooking?.id ? "Edit booking" : "New booking"}
  open={isModalOpen}
  onClose={() => (isModalOpen = false)}
  onSave={handleSaveBooking}
>
  {#if editingBooking}
    <div class="grid2">
      <label class="full" for="b-cust">
        Customer
        <select id="b-cust" bind:value={editingBooking.customerId}>
          <option value="">Choose a customer</option>
          {#each db.customers as c}
            <option value={c.id}>{c.name}</option>
          {/each}
        </select>
      </label>
      <label class="full" for="b-service">
        Service
        <select id="b-service" bind:value={editingBooking.service}>
          {#each SERVICES as s}
            <option value={s}>{s}</option>
          {/each}
        </select>
      </label>
      <label for="b-date">
        Date
        <input id="b-date" type="date" bind:value={editingBooking.date} />
      </label>
      <label for="b-days">
        Days
        <input id="b-days" type="number" min="1" bind:value={editingBooking.days} />
      </label>
      <label for="b-spot">
        Spot
        <select id="b-spot" bind:value={editingBooking.spot}>
          {#each SPOTS as sp}
            <option value={sp}>{sp}</option>
          {/each}
        </select>
      </label>
      <label for="b-people">
        People
        <input id="b-people" type="number" min="1" bind:value={editingBooking.people} />
      </label>
      <label for="b-price">
        Price ({cur})
        <input id="b-price" type="number" min="0" step="any" bind:value={editingBooking.price} />
      </label>
      <label for="b-status">
        Status
        <select id="b-status" bind:value={editingBooking.status}>
          {#each BSTAT as st}
            <option value={st}>{st}</option>
          {/each}
        </select>
      </label>
      <label class="full" for="b-notes">
        Notes
        <textarea id="b-notes" bind:value={editingBooking.notes}></textarea>
      </label>
    </div>
    {#if formError}
      <p class="err" role="alert">{formError}</p>
    {/if}
  {/if}
</Modal>

<!-- Delete Confirmation Modal -->
<Modal
  title="Delete booking?"
  open={isDeleteModalOpen}
  onClose={() => (isDeleteModalOpen = false)}
  onSave={executeDelete}
  saveLabel="Delete booking"
>
  {#if deletingBooking}
    <p>
      The {deletingBooking.service} booking on {fmtDate(deletingBooking.date)} for
      <b>{getCustomerName(deletingBooking.customerId)}</b> will be removed. Invoices created from it are kept.
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

  td small {
    display: block;
    color: var(--muted);
    font-size: 12px;
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

  .s-new { color: var(--wax); }
  .s-confirmed { color: var(--info); }
  .s-done { color: var(--ok); }
  .s-cancelled { color: var(--muted); }

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

  .full {
    grid-column: 1 / -1;
  }

  @media (max-width: 820px) {
    .grid2 {
      grid-template-columns: 1fr;
    }
  }
</style>
