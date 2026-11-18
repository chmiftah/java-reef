import { invTotals, invStatus, money, fmtDate } from './format.js';

/**
 * Encodes invoice, customer, and settings into a base64 URL payload
 */
export function encodeInvoicePayload(inv, customer, settings) {
  const payload = {
    v: 1,
    inv: {
      id: inv.id,
      number: inv.number,
      issueDate: inv.issueDate,
      dueDate: inv.dueDate,
      items: inv.items || [],
      discount: +inv.discount || 0,
      taxRate: +inv.taxRate || 0,
      payments: inv.payments || [],
      notes: inv.notes || "",
      sent: true,
      void: !!inv.void
    },
    cust: customer
      ? {
          name: customer.name || "",
          email: customer.email || "",
          phone: customer.phone || "",
          country: customer.country || ""
        }
      : null,
    settings: {
      business: settings?.business || "Java Reef Filmer",
      address: settings?.address || "Bali, Indonesia",
      email: settings?.email || "",
      phone: settings?.phone || "",
      currency: settings?.currency || "IDR",
      bank: settings?.bank || ""
    }
  };

  try {
    const json = JSON.stringify(payload);
    // encodeURIComponent handles UTF-8 properly before btoa
    const base64 = btoa(unescape(encodeURIComponent(json)));
    return base64;
  } catch (e) {
    console.error("Error encoding invoice payload", e);
    return "";
  }
}

/**
 * Decodes invoice, customer, and settings from a base64 URL payload
 */
export function decodeInvoicePayload(base64) {
  if (!base64) return null;
  try {
    const json = decodeURIComponent(escape(atob(base64)));
    const data = JSON.parse(json);
    return data;
  } catch (e) {
    console.error("Error decoding invoice payload", e);
    return null;
  }
}

/**
 * Generates the full shareable URL for an invoice
 */
export function getInvoiceShareUrl(inv, customer, settings) {
  const encoded = encodeInvoicePayload(inv, customer, settings);
  const base = `${window.location.origin}${window.location.pathname}`;
  return `${base}#invoice?data=${encodeURIComponent(encoded)}`;
}

/**
 * Generates a friendly message with the invoice link for WhatsApp or DM
 */
export function getInvoiceShareMessage(inv, customer, settings) {
  const link = getInvoiceShareUrl(inv, customer, settings);
  const cur = settings?.currency || "IDR";
  const totals = invTotals(inv);
  const custName = customer?.name ? customer.name.split(" ")[0] : "there";

  return `Hi ${custName},

Here is your invoice ${inv.number} for ${money(totals.balance > 0 ? totals.balance : totals.total, cur)} from ${settings?.business || "Java Reef Filmer"}.

You can view and download your invoice here:
${link}

${settings?.bank ? `Payment details:\n${settings.bank}\n\n` : ""}Thank you!`;
}
