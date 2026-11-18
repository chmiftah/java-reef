export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

export const today = () => new Date().toISOString().slice(0, 10);

export const addDays = (d, n) => {
  const x = new Date(d + "T00:00");
  x.setDate(x.getDate() + n);
  return x.toISOString().slice(0, 10);
};

export const daysBetween = (a, b) => Math.round((new Date(b + "T00:00") - new Date(a + "T00:00")) / 864e5);

export const fmtDate = d => (d ? new Date(d + "T00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—");

export function money(n, currency = "IDR") {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: currency === "IDR" ? 0 : 2
    }).format(n || 0);
  } catch (_) {
    return currency + " " + Math.round(n || 0).toLocaleString();
  }
}

export function compact(n) {
  try {
    return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(n);
  } catch (_) {
    return Math.round(n).toLocaleString();
  }
}

export async function hashPassword(pw, salt) {
  const data = new TextEncoder().encode(salt + ":" + pw);
  try {
    const b = await crypto.subtle.digest("SHA-256", data);
    return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, "0")).join("");
  } catch (_) {
    let h = 5381;
    for (const c of data) h = ((h << 5) + h + c) >>> 0;
    return "x" + h.toString(16);
  }
}

export const SERVICES = [
  "Surf videography (water angle)",
  "Surf videography (land angle)",
  "Surf photography",
  "Indo surf trip package",
  "Surf coaching",
  "Car rental",
  "Commercial / advertisement",
  "Wedding film"
];

export const SPOTS = [
  "Let's decide on the forecast",
  "Uluwatu",
  "Padang Padang",
  "Java point breaks",
  "Other"
];

export const BSTAT = ["New", "Confirmed", "Done", "Cancelled"];
export const METHODS = ["Bank transfer", "Cash", "Wise", "PayPal", "Card"];

export function invTotals(inv) {
  const sub = (inv.items || []).reduce((s, i) => s + (+i.qty || 0) * (+i.price || 0), 0);
  const disc = +inv.discount || 0;
  const tax = Math.max(0, sub - disc) * (+inv.taxRate || 0) / 100;
  const total = Math.max(0, sub - disc + tax);
  const paid = (inv.payments || []).reduce((s, p) => s + (+p.amount || 0), 0);
  return { sub, disc, tax, total, paid, balance: Math.max(0, total - paid) };
}

export function invStatus(inv) {
  if (inv.void) return "Void";
  const t = invTotals(inv);
  if (t.total > 0 && t.paid >= t.total) return "Paid";
  if (!inv.sent && t.paid === 0) return "Draft";
  if (inv.dueDate && inv.dueDate < today()) return "Overdue";
  if (t.paid > 0) return "Partial";
  return "Sent";
}

export function nextInvNumber(settings, invoices = []) {
  const y = new Date().getFullYear();
  const prefix = settings?.prefix || "INV";
  const nums = invoices
    .map(i => i.number)
    .filter(n => n && n.startsWith(`${prefix}-${y}-`))
    .map(n => +n.split("-").pop() || 0);
  return `${prefix}-${y}-${String((nums.length ? Math.max(...nums) : 0) + 1).padStart(3, "0")}`;
}
