<script>
  import { db } from '../../stores/db.svelte.js';
  import { money, invTotals, invStatus } from '../../utils/format.js';
  import Modal from './Modal.svelte';

  let { onOpenBookingForCustomer } = $props();

  let searchQuery = $state("");
  let editingCustomer = $state(null);
  let isModalOpen = $state(false);
  let formError = $state("");

  // Customer delete confirmation
  let deletingCustomer = $state(null);
  let isDeleteModalOpen = $state(false);

  const cur = $derived(db.settings.currency);

  let filteredCustomers = $derived.by(() => {
    const q = searchQuery.toLowerCase().trim();
    return db.customers
      .filter(c => !q || [c.name, c.email, c.phone, c.country].join(" ").toLowerCase().includes(q))
      .sort((a, b) => a.name.localeCompare(b.name));
  });

  function getBookingCount(customerId) {
    return db.bookings.filter(b => b.customerId === customerId).length;
  }

  function getUnpaidBalance(customerId) {
    return db.invoices
      .filter(i => i.customerId === customerId && !["Draft", "Void"].includes(invStatus(i)))
      .reduce((s, i) => s + invTotals(i).balance, 0);
  }

  export function openNewCustomer() {
    editingCustomer = {
      name: "",
      email: "",
      phone: "",
      country: "",
      level: "",
      notes: ""
    };
    formError = "";
    isModalOpen = true;
  }

  function openEditCustomer(c) {
    editingCustomer = { ...c };
    formError = "";
    isModalOpen = true;
  }

  function handleSaveCustomer() {
    if (!editingCustomer.name || !editingCustomer.name.trim()) {
      formError = "Name is required.";
      return;
    }
    db.upsertCustomer({
      ...editingCustomer,
      name: editingCustomer.name.trim(),
      email: (editingCustomer.email || "").trim(),
      phone: (editingCustomer.phone || "").trim(),
      country: (editingCustomer.country || "").trim(),
      notes: (editingCustomer.notes || "").trim()
    });
    isModalOpen = false;
  }

  function confirmDelete(c) {
    deletingCustomer = c;
    isDeleteModalOpen = true;
  }

  function executeDelete() {
    if (deletingCustomer) {
      db.deleteCustomer(deletingCustomer.id);
      deletingCustomer = null;
    }
    isDeleteModalOpen = false;
  }
</script>

<div class="top">
  <div>
    <span class="mono">People</span>
    <h1>Customers</h1>
  </div>
  <div class="tools">
    <input
      type="search"
      placeholder="Search name, email, phone…"
      bind:value={searchQuery}
      aria-label="Search"
    />
    <button class="btn btn-wax" type="button" onclick={openNewCustomer}>+ Customer</button>
  </div>
</div>

{#if filteredCustomers.length}
  <div class="tablewrap">
    <table>
      <thead>
        <tr>
          <th>Name</th>
          <th>Contact</th>
          <th>Country</th>
          <th class="r">Bookings</th>
          <th class="r">Unpaid</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {#each filteredCustomers as c}
          {@const due = getUnpaidBalance(c.id)}
          <tr>
            <td>
              <b>{c.name}</b>
              {#if c.notes}
                <small>{c.notes.slice(0, 60)}</small>
              {/if}
            </td>
            <td>
              {c.email || "—"}
              {#if c.phone}
                <small>{c.phone}</small>
              {/if}
            </td>
            <td>{c.country || "—"}</td>
            <td class="r num">{getBookingCount(c.id)}</td>
            <td class="r num" style={due ? "color:var(--warn)" : ""}>
              {due ? money(due, cur) : "—"}
            </td>
            <td class="act">
              <button
                class="icon-btn"
                type="button"
                onclick={() => onOpenBookingForCustomer(c.id)}
              >
                + Booking
              </button>
              <button
                class="icon-btn"
                type="button"
                onclick={() => openEditCustomer(c)}
              >
                Edit
              </button>
              <button
                class="icon-btn del"
                type="button"
                onclick={() => confirmDelete(c)}
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
      {searchQuery
        ? "No customers match your search."
        : "No customers yet. Add one, or they'll be created from website bookings."}
    </p>
  </div>
{/if}

<!-- Customer Modal -->
<Modal
  title={editingCustomer?.id ? "Edit customer" : "New customer"}
  open={isModalOpen}
  onClose={() => (isModalOpen = false)}
  onSave={handleSaveCustomer}
>
  {#if editingCustomer}
    <div class="grid2">
      <label class="full" for="c-name">
        Full name
        <input id="c-name" bind:value={editingCustomer.name} required />
      </label>
      <label for="c-email">
        Email
        <input id="c-email" type="email" bind:value={editingCustomer.email} />
      </label>
      <label for="c-phone">
        WhatsApp / phone
        <input id="c-phone" bind:value={editingCustomer.phone} />
      </label>
      <label for="c-country">
        Country
        <input id="c-country" bind:value={editingCustomer.country} />
      </label>
      <label for="c-level">
        Surf level
        <select id="c-level" bind:value={editingCustomer.level}>
          <option value="">Select level</option>
          <option value="Beginner">Beginner</option>
          <option value="Intermediate">Intermediate</option>
          <option value="Advanced">Advanced</option>
          <option value="Pro">Pro</option>
        </select>
      </label>
      <label class="full" for="c-notes">
        Notes
        <textarea id="c-notes" bind:value={editingCustomer.notes}></textarea>
      </label>
    </div>
    {#if formError}
      <p class="err" role="alert">{formError}</p>
    {/if}
  {/if}
</Modal>

<!-- Delete Confirmation Modal -->
<Modal
  title="Delete customer?"
  open={isDeleteModalOpen}
  onClose={() => (isDeleteModalOpen = false)}
  onSave={executeDelete}
  saveLabel="Delete customer"
>
  {#if deletingCustomer}
    <p>
      <b>{deletingCustomer.name}</b> will be removed. Their bookings and invoices will remain marked
      “Deleted customer”.
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
