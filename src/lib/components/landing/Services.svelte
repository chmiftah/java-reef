<section id="services">
  <div class="wrap">
    <div class="head">
      <span class="mono">Shot list</span>
      <h2>What I do</h2>
      <p>
        One local crew for the whole trip: someone to film you, take you to the right break for
        the swell, and drive you there.
      </p>
    </div>
    <div class="shots">
      <article class="shot">
        <span class="mono">Shot 01 · In the water</span>
        <h3>Surf<br />videography</h3>
        <ul>
          <li>Water angles from the channel and the impact zone</li>
          <li>Land angles from the cliff and the beach</li>
          <li>Surf photography of your best waves</li>
          <li>Session clips edited for Instagram and YouTube</li>
        </ul>
      </article>
      <article class="shot">
        <span class="mono">Shot 02 · On the road</span>
        <h3>Trips &amp;<br />guiding</h3>
        <ul>
          <li>Indo surf trip packages across Bali and Java</li>
          <li>Surf coaching, with footage to review your technique</li>
          <li>Car rental for getting between breaks</li>
          <li>Local knowledge of which spot works on which swell</li>
        </ul>
      </article>
      <article class="shot">
        <span class="mono">Shot 03 · On land</span>
        <h3>Commercial<br />&amp; weddings</h3>
        <ul>
          <li>Commercial advertisements for brands in Bali</li>
          <li>Wedding films in Bali</li>
          <li>Ocean and lifestyle footage for campaigns</li>
        </ul>
      </article>
    </div>
  </div>
</section>

<style>
  section {
    padding: 110px 0 0;
  }

  .head {
    display: grid;
    grid-template-columns: 200px 1fr;
    gap: 24px;
    align-items: end;
    margin-bottom: 48px;
  }

  .head .mono {
    color: var(--wax);
    padding-bottom: 8px;
  }

  .head h2 {
    font-size: clamp(48px, 7vw, 96px);
    font-weight: 800;
  }

  .head p {
    grid-column: 2;
    max-width: 58ch;
    color: var(--muted);
  }

  .shots {
    border-top: 1px solid var(--line);
  }

  .shot {
    display: grid;
    grid-template-columns: 200px 1fr 1.1fr;
    gap: 24px;
    padding: 34px 0;
    border-bottom: 1px solid var(--line);
    transition: background 0.2s;
  }

  .shot:hover {
    background: linear-gradient(90deg, rgba(63, 184, 166, 0.07), transparent 70%);
  }

  .shot .mono {
    color: var(--muted);
    padding-top: 8px;
  }

  .shot h3 {
    font-size: clamp(34px, 4vw, 52px);
    font-weight: 800;
  }

  .shot ul {
    list-style: none;
    display: grid;
    gap: 10px;
  }

  .shot li {
    display: flex;
    gap: 12px;
    align-items: baseline;
  }

  .shot li:before {
    content: "";
    flex: none;
    width: 14px;
    height: 2px;
    background: var(--reef);
    transform: translateY(-4px);
  }

  @media (max-width: 900px) {
    .head,
    .shot {
      grid-template-columns: 1fr;
    }
    .head p {
      grid-column: 1;
    }
    .shot {
      gap: 12px;
    }
  }
</style>
