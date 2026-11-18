<section id="how">
  <div class="wrap">
    <div class="head">
      <span class="mono">Timeline</span>
      <h2>How a session works</h2>
    </div>
    <div class="steps">
      <div class="step">
        <span class="tc">00:00</span>
        <h3>Book</h3>
        <p>Send the form below with your dates, level and what you want filmed.</p>
      </div>
      <div class="step">
        <span class="tc">00:15</span>
        <h3>Check the swell</h3>
        <p>We look at the forecast and tides together and choose the break and time.</p>
      </div>
      <div class="step">
        <span class="tc">01:00</span>
        <h3>Paddle out</h3>
        <p>You surf. I film from the water, the land, or both.</p>
      </div>
      <div class="step">
        <span class="tc">02:00</span>
        <h3>Get your clips</h3>
        <p>Your best waves, edited and ready to post.</p>
      </div>
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

  .steps {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 0;
    border: 1px solid var(--line);
    border-radius: 4px;
  }

  .step {
    padding: 28px 24px;
    border-right: 1px solid var(--line);
    display: grid;
    gap: 12px;
    align-content: start;
  }

  .step:last-child {
    border-right: 0;
  }

  .step .tc {
    font-family: var(--f-mono);
    font-size: 13px;
    color: var(--wax);
  }

  .step h3 {
    font-size: 30px;
    font-weight: 800;
  }

  .step p {
    color: var(--muted);
    font-size: 15px;
  }

  @media (max-width: 900px) {
    .head {
      grid-template-columns: 1fr;
    }
    .steps {
      grid-template-columns: 1fr 1fr;
    }
    .step:nth-child(2) {
      border-right: 0;
    }
    .step:nth-child(-n + 2) {
      border-bottom: 1px solid var(--line);
    }
  }

  @media (max-width: 520px) {
    .steps {
      grid-template-columns: 1fr;
    }
    .step {
      border-right: 0;
      border-bottom: 1px solid var(--line);
    }
    .step:last-child {
      border-bottom: 0;
    }
  }
</style>
