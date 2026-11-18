<script>
  import { db } from './lib/stores/db.svelte.js';
  import LandingPage from './lib/components/landing/LandingPage.svelte';
  import LoginView from './lib/components/admin/LoginView.svelte';
  import AdminShell from './lib/components/admin/AdminShell.svelte';
  import PublicInvoiceView from './lib/components/PublicInvoiceView.svelte';

  function getRouteFromLocation() {
    const hash = window.location.hash || "";
    const path = window.location.pathname || "";
    if (hash.startsWith("#invoice") || path.startsWith("/invoice")) {
      return "invoice";
    }
    if (hash === "#admin" || hash.startsWith("#admin/") || path === "/admin" || path.startsWith("/admin/")) {
      return "admin";
    }
    return "landing";
  }

  let currentRoute = $state(getRouteFromLocation());

  $effect(() => {
    function handleLocationChange() {
      currentRoute = getRouteFromLocation();
    }
    window.addEventListener("hashchange", handleLocationChange);
    window.addEventListener("popstate", handleLocationChange);
    return () => {
      window.removeEventListener("hashchange", handleLocationChange);
      window.removeEventListener("popstate", handleLocationChange);
    };
  });

  function navigateTo(route) {
    currentRoute = route;
    if (route === "admin") {
      window.location.hash = "#admin";
    } else {
      window.location.hash = "#top";
    }
  }
</script>

{#if currentRoute === "invoice"}
  <PublicInvoiceView onBackToWebsite={() => navigateTo("landing")} />
{:else if currentRoute === "admin"}
  {#if !db.session}
    <LoginView onBackToWebsite={() => navigateTo("landing")} />
  {:else}
    <AdminShell onBackToWebsite={() => navigateTo("landing")} />
  {/if}
{:else}
  <LandingPage onNavigateAdmin={() => navigateTo("admin")} />
{/if}

{#if db.toastVisible}
  <div class="toast" role="status">
    {db.toastMsg}
  </div>
{/if}
