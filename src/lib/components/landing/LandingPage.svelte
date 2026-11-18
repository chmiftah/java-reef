<script>
  import Header from './Header.svelte';
  import Hero from './Hero.svelte';
  import Services from './Services.svelte';
  import Spots from './Spots.svelte';
  import HowItWorks from './HowItWorks.svelte';
  import Watch from './Watch.svelte';
  import Booking from './Booking.svelte';
  import Footer from './Footer.svelte';

  let { onNavigateAdmin } = $props();
</script>

<div>
  <Header {onNavigateAdmin} />
  <main id="top">
    <Hero />
    <Services />
    <Spots />
    <HowItWorks />
    <Watch />
    <Booking />
  </main>
  <Footer {onNavigateAdmin} />
</div>
