<script>
  let { title, open = false, wide = false, onClose, onSave, saveLabel = "Save", cancelLabel = "Cancel", children, extraActions } = $props();

  let dialogEl = $state();

  $effect(() => {
    if (!dialogEl) return;
    if (open && !dialogEl.open) {
      dialogEl.showModal();
    } else if (!open && dialogEl.open) {
      dialogEl.close();
    }
  });

  function handleClose() {
    if (onClose) onClose();
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (onSave) onSave();
  }
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<dialog
  bind:this={dialogEl}
  class={wide ? "wide" : ""}
  onclose={handleClose}
>
  <form onsubmit={handleSubmit} novalidate>
    <div class="mh">
      <h2>{title}</h2>
      <button type="button" class="icon-btn" onclick={handleClose} aria-label="Close">✕</button>
    </div>
    <div class="mb">
      {@render children?.()}
    </div>
    <div class="mf">
      {#if extraActions}
        {@render extraActions()}
      {/if}
      <button type="button" class="btn" onclick={handleClose}>
        {onSave ? cancelLabel : "Close"}
      </button>
      {#if onSave}
        <button class="btn btn-wax" type="submit">{saveLabel}</button>
      {/if}
    </div>
  </form>
</dialog>

<style>
  dialog {
    margin: auto;
    border: 1px solid var(--line);
    border-radius: 6px;
    background: var(--panel);
    color: var(--foam);
    width: min(720px, calc(100% - 24px));
    max-height: calc(100% - 24px);
    padding: 0;
    overflow: hidden;
  }

  dialog.wide {
    width: min(860px, calc(100% - 24px));
  }

  dialog::backdrop {
    background: rgba(3, 7, 8, 0.75);
    backdrop-filter: blur(3px);
  }

  dialog form {
    display: flex;
    flex-direction: column;
    max-height: calc(100vh - 48px);
    overflow: hidden;
  }

  .mh {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 18px 22px;
    border-bottom: 1px solid var(--line);
    background: var(--panel);
    z-index: 2;
  }

  .mh h2 {
    font-size: 30px;
    font-weight: 800;
  }

  .mb {
    padding: 22px;
    display: grid;
    gap: 14px;
    overflow-y: auto;
  }

  .mf {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: 10px;
    padding: 16px 22px;
    border-top: 1px solid var(--line);
    background: var(--panel);
  }

  @media (max-width: 600px) {
    dialog {
      width: calc(100% - 16px);
      max-height: calc(100vh - 20px);
    }
    .mh {
      padding: 14px 16px;
    }
    .mh h2 {
      font-size: 22px;
    }
    .mb {
      padding: 16px 14px;
      gap: 12px;
    }
    .mf {
      padding: 12px 14px;
      flex-wrap: wrap;
      gap: 8px;
    }
    .mf .btn {
      flex: 1 1 auto;
      text-align: center;
      justify-content: center;
    }
  }
</style>
