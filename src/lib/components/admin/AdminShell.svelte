<script>
  import { db } from '../../stores/db.svelte.js';
  import { invStatus } from '../../utils/format.js';
  import DashboardView from './DashboardView.svelte';
  import CustomersView from './CustomersView.svelte';
  import BookingsView from './BookingsView.svelte';
  import InvoicesView from './InvoicesView.svelte';
  import TrackerView from './TrackerView.svelte';
  import AccountView from './AccountView.svelte';

  let { onBackToWebsite } = $props();

  let activeView = $state("dashboard");

  // References to child views to trigger modals
  let customersViewRef = $state();
  let bookingsViewRef = $state();
  let invoicesViewRef = $state();

  const VIEWS = [
    { id: "dashboard", label: "Dashboard" },
    { id: "customers", label: "Customers" },
    { id: "bookings", label: "Bookings" },
    { id: "invoices", label: "Invoices" },
    { id: "tracker", label: "Invoice tracker" },
    { id: "account", label: "Account" }
  ];

  let newBookingsCount = $derived(db.bookings.filter(b => b.status === "New").length);
  let overdueInvoicesCount = $derived(db.invoices.filter(i => invStatus(i) === "Overdue").length);

  function handleNavigateView(viewId) {
    activeView = viewId;
  }

  function handleOpenNewBooking() {
    activeView = "bookings";
    setTimeout(() => {
      bookingsViewRef?.openNewBooking();
    }, 50);
  }

  function handleOpenNewInvoice(prefill) {
    activeView = "invoices";
    setTimeout(() => {
      invoicesViewRef?.openNewInvoice(prefill);
    }, 50);
  }

  function handleOpenBookingForCustomer(customerId) {
    activeView = "bookings";
    setTimeout(() => {
      bookingsViewRef?.openNewBooking(customerId);
    }, 50);
  }

  function handleOpenInvoiceForBooking(booking, existingInvoiceId) {
    activeView = "invoices";
    setTimeout(() => {
      if (existingInvoiceId) {
        const inv = db.invoices.find(i => i.id === existingInvoiceId);
        if (inv) invoicesViewRef?.openPreview(inv);
      } else {
        const days = booking.days || 1;
        const desc = `${booking.service} – ${booking.spot && !booking.spot.startsWith("Let's") ? booking.spot + ", " : ""}${booking.date}${days > 1 ? ` (${days} days)` : ""}`;
        invoicesViewRef?.openNewInvoice({
          customerId: booking.customerId,
          bookingId: booking.id,
          items: [{ desc, qty: 1, price: booking.price || 0 }]
        });
      }
    }, 50);
  }

  function handleOpenViewInvoice(inv) {
    activeView = "invoices";
    setTimeout(() => {
      invoicesViewRef?.openPreview(inv);
    }, 50);
  }
</script>

<div class="app">
  <aside class="side">
    <div class="brand">
      <i></i>JAVA REEF
    </div>
    <div class="mobile-top-actions">
      <button class="btn btn-sm btn-ghost" type="button" onclick={onBackToWebsite} title="View website">
        Website →
      </button>
      <button class="btn btn-sm" type="button" onclick={() => db.logout()} title="Sign out">
        Sign out
      </button>
    </div>
    <nav>
      {#each VIEWS as v}
        <button
          type="button"
          class="nav-link {activeView === v.id ? 'on' : ''}"
          onclick={() => (activeView = v.id)}
        >
          <span>{v.label}</span>
          {#if v.id === "bookings" && newBookingsCount}
            <span class="badge">{newBookingsCount}</span>
          {:else if v.id === "tracker" && overdueInvoicesCount}
            <span class="badge" style="background:var(--bad);color:#fff">
              {overdueInvoicesCount}
            </span>
          {/if}
        </button>
      {/each}
    </nav>
    <div class="me">
      <span class="signed-in">Signed in as {db.session?.name || db.user?.name}</span>
      <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
        <button class="btn btn-sm" type="button" onclick={() => db.logout()}>
          Sign out
        </button>
        <button class="btn btn-sm btn-ghost" type="button" onclick={onBackToWebsite}>
          Website →
        </button>
      </div>
    </div>
  </aside>

  <div class="content">
    <div class="mobile-nav">
      {#each VIEWS as v}
        <button
          type="button"
          class="mnav-link {activeView === v.id ? 'on' : ''}"
          onclick={() => (activeView = v.id)}
        >
          <span>{v.label}</span>
          {#if v.id === "bookings" && newBookingsCount}
            <span class="badge">{newBookingsCount}</span>
          {:else if v.id === "tracker" && overdueInvoicesCount}
            <span class="badge" style="background:var(--bad);color:#fff">
              {overdueInvoicesCount}
            </span>
          {/if}
        </button>
      {/each}
    </div>

    <main class="main">
      {#if activeView === "dashboard"}
        <DashboardView
          onNavigateView={handleNavigateView}
          onOpenNewBooking={handleOpenNewBooking}
          onOpenNewInvoice={() => handleOpenNewInvoice()}
        />
      {:else if activeView === "customers"}
        <CustomersView
          bind:this={customersViewRef}
          onOpenBookingForCustomer={handleOpenBookingForCustomer}
        />
      {:else if activeView === "bookings"}
        <BookingsView
          bind:this={bookingsViewRef}
          onOpenInvoiceForBooking={handleOpenInvoiceForBooking}
        />
      {:else if activeView === "invoices"}
        <InvoicesView bind:this={invoicesViewRef} />
      {:else if activeView === "tracker"}
        <TrackerView
          onOpenNewInvoice={() => handleOpenNewInvoice()}
          onOpenViewInvoice={handleOpenViewInvoice}
          onOpenPaymentForInvoice={handleOpenViewInvoice}
        />
      {:else if activeView === "account"}
        <AccountView onLogout={() => db.logout()} />
      {/if}
    </main>
  </div>
</div>

<style>
  .app {
    display: grid;
    grid-template-columns: 230px 1fr;
    min-height: 100vh;
  }

  .side {
    background: var(--panel);
    border-right: 1px solid var(--line);
    padding: 20px 14px;
    display: flex;
    flex-direction: column;
    gap: 22px;
    position: sticky;
    top: 0;
    height: 100vh;
  }

  .brand {
    font-family: var(--f-display);
    font-weight: 900;
    font-size: 22px;
    letter-spacing: 0.04em;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 0 8px;
    color: var(--foam);
  }

  .brand i {
    width: 9px;
    height: 9px;
    border-radius: 50%;
    background: var(--wax);
  }

  .side nav {
    display: grid;
    gap: 2px;
  }

  .nav-link {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 12px;
    border-radius: 3px;
    color: var(--muted);
    font-weight: 500;
    text-align: left;
    width: 100%;
    transition: background 0.15s, color 0.15s;
    font-size: 14px;
  }

  .nav-link:hover {
    background: rgba(236, 230, 217, 0.05);
    color: var(--foam);
  }

  .nav-link.on {
    background: rgba(63, 184, 166, 0.12);
    color: var(--foam);
    box-shadow: inset 2px 0 0 var(--reef);
  }

  .badge {
    font: 600 11px/1 var(--f-mono);
    background: var(--wax);
    color: #1a0f02;
    border-radius: 99px;
    padding: 3px 7px;
  }

  .side .me {
    margin-top: auto;
    padding: 12px 8px;
    border-top: 1px solid var(--line);
    display: grid;
    gap: 10px;
    font-size: 13px;
    color: var(--muted);
  }

  .signed-in {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .content {
    min-width: 0;
  }

  .main {
    padding: 28px clamp(16px, 3vw, 40px) 60px;
    min-width: 0;
  }

  .mobile-top-actions {
    display: none;
  }

  .mobile-nav {
    display: none;
  }

  @media (max-width: 820px) {
    .app {
      grid-template-columns: 1fr;
    }
    .side {
      position: static;
      height: auto;
      flex-direction: row;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      border-right: none;
      border-bottom: 1px solid var(--line);
    }
    .mobile-top-actions {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .side nav,
    .side .me {
      display: none;
    }
    .mobile-nav {
      display: flex;
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
      scrollbar-width: none;
      gap: 6px;
      padding: 10px 14px;
      border-bottom: 1px solid var(--line);
      background: var(--panel);
    }
    .mobile-nav::-webkit-scrollbar {
      display: none;
    }
    .mnav-link {
      flex: none;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 7px 12px;
      border-radius: 99px;
      border: 1px solid var(--line);
      color: var(--muted);
      font-size: 13px;
      font-weight: 500;
      white-space: nowrap;
      background: rgba(236, 230, 217, 0.02);
      transition: background 0.15s, color 0.15s, border-color 0.15s;
    }
    .mnav-link:hover {
      color: var(--foam);
    }
    .mnav-link.on {
      border-color: var(--reef);
      color: var(--foam);
      background: rgba(63, 184, 166, 0.15);
      font-weight: 600;
    }
    .mnav-link .badge {
      font-size: 10px;
      padding: 2px 6px;
    }
    .main {
      padding: 20px 14px 44px;
    }
  }

  @media (max-width: 480px) {
    .side {
      padding: 10px 12px;
    }
    .brand {
      font-size: 18px;
    }
    .mobile-top-actions {
      gap: 6px;
    }
    .mobile-top-actions .btn {
      padding: 5px 8px;
      font-size: 12px;
    }
    .mobile-nav {
      padding: 8px 10px;
      gap: 5px;
    }
    .mnav-link {
      padding: 6px 10px;
      font-size: 12px;
    }
    .main {
      padding: 14px 10px 36px;
    }
  }
</style>
