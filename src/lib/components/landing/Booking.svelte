<script>
  import { db } from '../../stores/db.svelte.js';
  import { today, SERVICES } from '../../utils/format.js';

  let name = $state("");
  let contact = $state("");
  let service = $state("");
  let date = $state("");
  let days = $state(1);
  let spot = $state("Let's decide on the forecast");
  let level = $state("Intermediate");
  let people = $state(1);
  let msg = $state("");

  let error = $state("");
  let generatedMsg = $state("");
  let resultVisible = $state(false);
  let copied = $state(false);
  let resultEl = $state();

  const minDate = today();
  const WA_NUMBER = ""; // Set if available

  function handleSubmit(e) {
    e.preventDefault();
    const missing = [];
    if (!name.trim()) missing.push("your name");
    if (!contact.trim()) missing.push("an email or WhatsApp number");
    if (!service) missing.push("a service");
    if (!date) missing.push("a preferred date");

    if (missing.length) {
      error = "Please add " + missing.join(", ") + ".";
      resultVisible = false;
      return;
    }

    error = "";
    const niceDate = new Date(date + "T00:00").toLocaleDateString("en-GB", {
      weekday: "short",
      day: "numeric",
      month: "long",
      year: "numeric"
    });

    generatedMsg = `Hi Java Reef Filmer! I'd like to book a session.

Name: ${name.trim()}
Contact: ${contact.trim()}
Service: ${service}
Date: ${niceDate} (${days || 1} day${(+days || 1) > 1 ? "s" : ""})
Spot: ${spot}
Level: ${level}
People: ${people || 1}
${msg.trim() ? "\nNotes: " + msg.trim() + "\n" : ""}
What are your rates and availability? Thanks!`;

    // Persist to local database
    db.saveBookingFromWebsite({
      name,
      contact,
      service,
      date,
      days,
      spot,
      level,
      people,
      msg
    });

    resultVisible = true;
    setTimeout(() => {
      if (resultEl) {
        resultEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    }, 100);
  }

  async function copyMessage() {
    try {
      await navigator.clipboard.writeText(generatedMsg);
      copied = true;
    } catch (_) {
      copied = false;
    }
    setTimeout(() => (copied = false), 2200);
  }
</script>

<section id="book">
  <div class="wrap book">
    <aside>
      <div class="head" style="grid-template-columns:1fr;margin:0">
        <span class="mono">Booking</span>
        <h2>Book your session</h2>
      </div>
      <p>
        Fill in your plans and you'll get a ready-made booking message to send by DM. Rates depend
        on the service, the spot and how many surfers, so ask in your message.
      </p>
      <div>
        <div class="contact-line">
          <span class="mono">Instagram</span>
          <a
            href="https://www.instagram.com/blackskin777/"
            target="_blank"
            rel="noopener noreferrer"
          >
            @blackskin777
          </a>
        </div>
        <div class="contact-line">
          <span class="mono">YouTube</span>
          <a
            href="https://m.youtube.com/@JavaReeffilmer"
            target="_blank"
            rel="noopener noreferrer"
          >
            @JavaReeffilmer
          </a>
        </div>
        <div class="contact-line">
          <span class="mono">Base</span>
          <span>Bali, Indonesia</span>
        </div>
      </div>
    </aside>

    <form onsubmit={handleSubmit} novalidate>
      <div class="field">
        <label for="f-name">Your name</label>
        <input id="f-name" bind:value={name} autocomplete="name" required />
      </div>
      <div class="field">
        <label for="f-contact">Email or WhatsApp</label>
        <input
          id="f-contact"
          bind:value={contact}
          required
          placeholder="you@email.com / +61…"
        />
      </div>
      <div class="field full">
        <label for="f-service">Service</label>
        <select id="f-service" bind:value={service} required>
          <option value="">Choose a service</option>
          {#each SERVICES as s}
            <option value={s}>{s}</option>
          {/each}
        </select>
      </div>
      <div class="field">
        <label for="f-date">Preferred date</label>
        <input id="f-date" bind:value={date} type="date" min={minDate} required />
      </div>
      <div class="field">
        <label for="f-days">Number of days</label>
        <input id="f-days" bind:value={days} type="number" min="1" max="60" />
      </div>
      <div class="field">
        <label for="f-spot">Spot</label>
        <select id="f-spot" bind:value={spot}>
          <option>Let's decide on the forecast</option>
          <option>Uluwatu</option>
          <option>Padang Padang</option>
          <option>Java point breaks</option>
          <option>Other (in message)</option>
        </select>
      </div>
      <div class="field">
        <label for="f-level">Surf level</label>
        <select id="f-level" bind:value={level}>
          <option>Beginner</option>
          <option>Intermediate</option>
          <option>Advanced</option>
          <option>Pro</option>
          <option>Not surfing (non-surf shoot)</option>
        </select>
      </div>
      <div class="field full">
        <label for="f-people">Number of people</label>
        <input id="f-people" bind:value={people} type="number" min="1" max="30" />
      </div>
      <div class="field full">
        <label for="f-msg">Anything else?</label>
        <textarea
          id="f-msg"
          bind:value={msg}
          placeholder="Board type, what you want to improve, where you're staying…"
        ></textarea>
      </div>

      {#if error}
        <p class="err full" role="alert">{error}</p>
      {/if}

      <button class="btn btn-wax" type="submit">Create my booking message</button>

      {#if resultVisible}
        <div class="result show" bind:this={resultEl} aria-live="polite">
          <span class="mono" style="color:var(--reef)">Booking message ready</span>
          <pre>{generatedMsg}</pre>
          <div class="row">
            <button class="btn btn-wax" type="button" onclick={copyMessage}>
              {copied ? "Copied" : "Copy message"}
            </button>
            {#if WA_NUMBER}
              <a
                class="btn btn-ghost"
                href={"https://wa.me/" + WA_NUMBER + "?text=" + encodeURIComponent(generatedMsg)}
                target="_blank"
                rel="noopener noreferrer"
              >
                Send on WhatsApp
              </a>
            {/if}
            <a
              class="btn btn-ghost"
              href="https://ig.me/m/blackskin777"
              target="_blank"
              rel="noopener noreferrer"
            >
              Open Instagram DM
            </a>
          </div>
          <small>
            {WA_NUMBER
              ? "Send it on WhatsApp, or copy it and paste it into the Instagram DM to @blackskin777."
              : "Copy the message, then paste it into the Instagram DM to @blackskin777."}
          </small>
        </div>
      {/if}
    </form>
  </div>
</section>

<style>
  section {
    padding: 110px 0 0;
  }

  .book {
    display: grid;
    grid-template-columns: 1fr 1.25fr;
    gap: 48px;
    align-items: start;
  }

  .book aside {
    display: grid;
    gap: 18px;
    position: sticky;
    top: 96px;
  }

  .book aside p {
    color: var(--muted);
  }

  .contact-line {
    display: flex;
    justify-content: space-between;
    gap: 16px;
    padding: 14px 0;
    border-bottom: 1px solid var(--line);
  }

  .contact-line .mono {
    color: var(--muted);
  }

  form {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    padding: 32px;
    background: var(--deep);
    border: 1px solid var(--line);
    border-radius: 4px;
  }

  .field {
    display: grid;
    gap: 6px;
  }

  .field.full {
    grid-column: 1 / -1;
  }

  select {
    appearance: none;
    background-image: linear-gradient(45deg, transparent 50%, var(--muted) 50%),
      linear-gradient(135deg, var(--muted) 50%, transparent 50%);
    background-position: calc(100% - 18px) 55%, calc(100% - 13px) 55%;
    background-size: 5px 5px;
    background-repeat: no-repeat;
  }

  form :global(.btn) {
    justify-content: center;
    grid-column: 1 / -1;
    padding: 16px;
  }

  .result {
    grid-column: 1 / -1;
    display: grid;
    gap: 14px;
    padding: 20px;
    border: 1px solid rgba(63, 184, 166, 0.45);
    border-radius: 2px;
    background: rgba(63, 184, 166, 0.06);
  }

  .result pre {
    white-space: pre-wrap;
    font: 400 13px/1.55 var(--f-mono);
    color: var(--foam);
    background: var(--basalt);
    padding: 14px;
    border-radius: 2px;
    max-height: 260px;
    overflow: auto;
  }

  .result .row {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }

  .result small {
    color: var(--muted);
  }

  @media (max-width: 900px) {
    .book {
      grid-template-columns: 1fr;
    }
    .book aside {
      position: static;
    }
  }

  @media (max-width: 520px) {
    form {
      grid-template-columns: 1fr;
      padding: 22px;
    }
  }
</style>
