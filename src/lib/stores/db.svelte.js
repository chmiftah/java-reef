import { uid, hashPassword, today, addDays } from '../utils/format.js';

const K = {
  user: "jrf_admin",
  cust: "jrf_customers",
  book: "jrf_bookings",
  inv: "jrf_invoices",
  set: "jrf_settings",
  sess: "jrf_session"
};

export const defaultAdminUser = {
  name: "Administrator",
  user: "admin",
  salt: "default_salt",
  hash: "df983045dfd19d7e5057e82a75786019451e4f2c02edd33fa882a37350063555" // SHA-256 of "default_salt:admin"
};

export const defaultSettings = {
  business: "Java Reef Filmer",
  address: "Uluwatu, Bali, Indonesia",
  email: "filmer@javareef.com",
  phone: "+62 812 3456 7890",
  bank: "Bank Central Asia (BCA)\nNo. Rekening: 1234567890\na/n Java Reef Filmer",
  currency: "IDR",
  prefix: "INV",
  dueDays: 7,
  taxRate: 0
};

function getStorage(k, d) {
  try {
    const v = localStorage.getItem(k);
    return v !== null ? JSON.parse(v) : d;
  } catch (_) {
    return d;
  }
}

function setStorage(k, v) {
  try {
    localStorage.setItem(k, JSON.stringify(v));
  } catch (_) {}
}

function delStorage(k) {
  try {
    localStorage.removeItem(k);
  } catch (_) {}
}

function getInitialSession() {
  try {
    const s = sessionStorage.getItem(K.sess);
    if (s) return JSON.parse(s);
  } catch (_) {}
  return getStorage(K.sess, null);
}

export function getInitialDummyData() {
  const t = today();
  const C = [
    { name: "Liam Carter", email: "liam.carter@example.com", phone: "+61 412 000 111", country: "Australia", level: "Advanced" },
    { name: "Sofia Mendes", email: "sofia.m@example.com", phone: "+351 910 000 222", country: "Portugal", level: "Intermediate" },
    { name: "Kenji Watanabe", email: "kenji.w@example.com", phone: "+81 90 0000 3333", country: "Japan", level: "Pro" },
    { name: "Emma & Noah", email: "emma.noah@example.com", phone: "+44 7700 000444", country: "United Kingdom", level: "" },
    { name: "Bali Board Co.", email: "hello@example.com", phone: "+62 812 0000 555", country: "Indonesia", level: "" }
  ].map((c, i) => ({ ...c, id: `cust_${i + 1}`, notes: "Regular surf client", createdAt: Date.now() - (10 - i) * 864e5 }));

  const B = [
    [0, "Surf videography (water angle)", "Uluwatu", 3, 1, 1500000, "Confirmed"],
    [1, "Indo surf trip package", "Java point breaks", 10, 7, 18500000, "Confirmed"],
    [2, "Surf videography (land angle)", "Padang Padang", -12, 1, 1200000, "Done"],
    [3, "Wedding film", "Other", 21, 1, 25000000, "New"],
    [4, "Commercial / advertisement", "Uluwatu", -40, 2, 30000000, "Done"],
    [1, "Surf coaching", "Let's decide on the forecast", 1, 3, 2400000, "New"],
    [0, "Surf photography", "Padang Padang", -25, 1, 900000, "Done"]
  ].map(([ci, service, spot, off, days, price, status], i) => ({
    id: `book_${i + 1}`,
    customerId: C[ci].id,
    service,
    spot,
    date: addDays(t, off),
    days,
    people: ci === 3 ? 2 : 1,
    price,
    status,
    notes: "",
    source: status === "New" ? "Website" : "Admin",
    createdAt: Date.now() - Math.abs(off) * 864e5
  }));

  const y = new Date().getFullYear();
  const pre = "INV";
  const mk = (n, b, issueOff, dueOff, sent, pays) => ({
    id: `inv_${n}`,
    number: `${pre}-${y}-${String(n).padStart(3, "0")}`,
    customerId: b.customerId,
    bookingId: b.id,
    issueDate: addDays(t, issueOff),
    dueDate: addDays(t, dueOff),
    items: [{ desc: `${b.service} – ${b.spot}`, qty: 1, price: b.price }],
    discount: 0,
    taxRate: 0,
    sent,
    notes: "Payment due within 7 days. Thank you for choosing Java Reef Filmer!",
    payments: pays.map(([a, o], pi) => ({
      id: `pay_${n}_${pi}`,
      amount: a,
      date: addDays(t, o),
      method: "Bank transfer",
      ref: `TRF-${n}00`
    })),
    createdAt: Date.now() - Math.abs(issueOff) * 864e5
  });

  const I = [
    mk(5, B[4], -45, -38, true, [[30000000, -36]]),
    mk(6, B[2], -12, -5, true, []),
    mk(7, B[6], -25, -18, true, [[900000, -20]]),
    mk(8, B[1], -3, 4, true, [[9250000, -2]]),
    mk(9, B[0], 0, 7, false, [])
  ];

  [[-150, 4000000], [-120, 6500000], [-90, 3200000], [-60, 8800000]].forEach(([o, a], k) => {
    I.push({
      id: `inv_prev_${k + 1}`,
      number: `${pre}-${y}-${String(1 + k).padStart(3, "0")}`,
      customerId: C[k % 3].id,
      bookingId: null,
      issueDate: addDays(t, o - 5),
      dueDate: addDays(t, o + 2),
      items: [{ desc: "Surf session filming", qty: 1, price: a }],
      discount: 0,
      taxRate: 0,
      sent: true,
      notes: "",
      payments: [{ id: `pay_prev_${k}`, amount: a, date: addDays(t, o), method: "Cash", ref: "" }],
      createdAt: Date.now() - Math.abs(o) * 864e5
    });
  });

  return { customers: C, bookings: B, invoices: I };
}

function initData() {
  const dummy = getInitialDummyData();
  const existingCust = getStorage(K.cust, null);
  const existingBook = getStorage(K.book, null);
  const existingInv = getStorage(K.inv, null);
  const existingUser = getStorage(K.user, null);

  const user = existingUser || defaultAdminUser;
  const customers = existingCust || dummy.customers;
  const bookings = existingBook || dummy.bookings;
  const invoices = existingInv || dummy.invoices;

  // Persist defaults to localStorage if not yet set
  if (!existingUser) setStorage(K.user, user);
  if (!existingCust) setStorage(K.cust, customers);
  if (!existingBook) setStorage(K.book, bookings);
  if (!existingInv) setStorage(K.inv, invoices);

  return { user, customers, bookings, invoices };
}

const initial = initData();

class Database {
  customers = $state(initial.customers);
  bookings = $state(initial.bookings);
  invoices = $state(initial.invoices);
  settings = $state(Object.assign({}, defaultSettings, getStorage(K.set, {})));
  user = $state(initial.user);
  session = $state(getInitialSession());
  toastMsg = $state("");
  toastVisible = $state(false);
  #toastTimeout = null;

  constructor() {
    if (typeof window !== "undefined") {
      window.addEventListener("storage", (e) => {
        if (e.key === K.cust) this.customers = getStorage(K.cust, initial.customers);
        if (e.key === K.book) this.bookings = getStorage(K.book, initial.bookings);
        if (e.key === K.inv) this.invoices = getStorage(K.inv, initial.invoices);
        if (e.key === K.set) this.settings = Object.assign({}, defaultSettings, getStorage(K.set, {}));
        if (e.key === K.user) this.user = getStorage(K.user, defaultAdminUser);
      });
    }
  }

  showToast(msg) {
    this.toastMsg = msg;
    this.toastVisible = true;
    if (this.#toastTimeout) clearTimeout(this.#toastTimeout);
    this.#toastTimeout = setTimeout(() => {
      this.toastVisible = false;
    }, 2500);
  }

  saveCustomers() {
    setStorage(K.cust, this.customers);
  }

  saveBookings() {
    setStorage(K.book, this.bookings);
  }

  saveInvoices() {
    setStorage(K.inv, this.invoices);
  }

  saveSettings() {
    setStorage(K.set, this.settings);
  }

  saveUser() {
    if (this.user) {
      setStorage(K.user, this.user);
    } else {
      delStorage(K.user);
    }
  }

  // --- Auth ---
  async setupAdmin(name, user, password) {
    const salt = uid();
    const hash = await hashPassword(password, salt);
    this.user = { name, user, salt, hash };
    this.saveUser();
    this.setSession({ user, name, at: Date.now() }, false);
  }

  async login(user, password, remember) {
    const u = (user || "").trim().toLowerCase();
    const pw = password || "";

    // Allow default admin / admin login at any time
    if (u === "admin" && pw === "admin") {
      if (!this.user || this.user.user !== "admin") {
        this.user = defaultAdminUser;
        this.saveUser();
      }
      this.setSession({ user: "admin", name: this.user?.name || "Administrator", at: Date.now() }, remember);
      return true;
    }

    if (this.user && u === this.user.user) {
      const computed = await hashPassword(pw, this.user.salt);
      if (computed === this.user.hash) {
        this.setSession({ user: u, name: this.user.name, at: Date.now() }, remember);
        return true;
      }
    }

    return false;
  }

  setSession(s, remember) {
    this.session = s;
    try {
      sessionStorage.setItem(K.sess, JSON.stringify(s));
    } catch (_) {}
    if (remember) {
      setStorage(K.sess, s);
    } else {
      delStorage(K.sess);
    }
  }

  logout() {
    try {
      sessionStorage.removeItem(K.sess);
    } catch (_) {}
    delStorage(K.sess);
    this.session = null;
  }

  // --- Website Booking integration ---
  saveBookingFromWebsite(d) {
    try {
      const contact = d.contact.trim();
      const isEmail = contact.includes("@");
      const norm = v => (v || "").toLowerCase().replace(/[\s-]/g, "");

      let c = this.customers.find(x =>
        isEmail ? norm(x.email) === norm(contact) : norm(x.phone) === norm(contact)
      );

      if (!c) {
        c = {
          id: uid(),
          name: d.name.trim(),
          email: isEmail ? contact : "",
          phone: isEmail ? "" : contact,
          country: "",
          level: d.level || "",
          notes: "Added from website booking form",
          createdAt: Date.now()
        };
        this.customers = [...this.customers, c];
        this.saveCustomers();
      }

      const newBooking = {
        id: uid(),
        customerId: c.id,
        service: d.service,
        date: d.date,
        days: +d.days || 1,
        spot: d.spot,
        people: +d.people || 1,
        price: null,
        status: "New",
        notes: (d.msg || "").trim(),
        source: "Website",
        createdAt: Date.now()
      };

      this.bookings = [...this.bookings, newBooking];
      this.saveBookings();
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  }

  // --- Customers CRUD ---
  upsertCustomer(customer) {
    const isNew = !customer.id;
    const rec = {
      ...customer,
      id: customer.id || uid(),
      createdAt: customer.createdAt || Date.now()
    };
    const idx = this.customers.findIndex(c => c.id === rec.id);
    if (idx >= 0) {
      const copy = [...this.customers];
      copy[idx] = rec;
      this.customers = copy;
      this.showToast("Customer updated");
    } else {
      this.customers = [...this.customers, rec];
      this.showToast("Customer added");
    }
    this.saveCustomers();
    return rec;
  }

  deleteCustomer(id) {
    this.customers = this.customers.filter(c => c.id !== id);
    this.saveCustomers();
    this.showToast("Customer deleted");
  }

  // --- Bookings CRUD ---
  upsertBooking(booking) {
    const isNew = !booking.id;
    const rec = {
      ...booking,
      id: booking.id || uid(),
      createdAt: booking.createdAt || Date.now(),
      source: booking.source || "Admin"
    };
    const idx = this.bookings.findIndex(b => b.id === rec.id);
    if (idx >= 0) {
      const copy = [...this.bookings];
      copy[idx] = rec;
      this.bookings = copy;
      this.showToast("Booking updated");
    } else {
      this.bookings = [...this.bookings, rec];
      this.showToast("Booking added");
    }
    this.saveBookings();
    return rec;
  }

  deleteBooking(id) {
    this.bookings = this.bookings.filter(b => b.id !== id);
    this.saveBookings();
    this.showToast("Booking deleted");
  }

  // --- Invoices CRUD ---
  upsertInvoice(invoice) {
    const rec = {
      ...invoice,
      id: invoice.id || uid(),
      createdAt: invoice.createdAt || Date.now()
    };
    const idx = this.invoices.findIndex(i => i.id === rec.id);
    if (idx >= 0) {
      const copy = [...this.invoices];
      copy[idx] = rec;
      this.invoices = copy;
      this.showToast("Invoice updated");
    } else {
      this.invoices = [...this.invoices, rec];
      this.showToast("Invoice created");
    }
    this.saveInvoices();
    return rec;
  }

  deleteInvoice(id) {
    this.invoices = this.invoices.filter(i => i.id !== id);
    this.saveInvoices();
    this.showToast("Invoice deleted");
  }

  markInvoiceSent(id) {
    const idx = this.invoices.findIndex(i => i.id === id);
    if (idx >= 0) {
      const copy = [...this.invoices];
      copy[idx] = { ...copy[idx], sent: true };
      this.invoices = copy;
      this.saveInvoices();
      this.showToast("Marked as sent");
    }
  }

  addPayment(invoiceId, payment) {
    const idx = this.invoices.findIndex(i => i.id === invoiceId);
    if (idx >= 0) {
      const inv = this.invoices[idx];
      const newPayment = {
        id: uid(),
        amount: +payment.amount,
        date: payment.date || today(),
        method: payment.method,
        ref: (payment.ref || "").trim()
      };
      const updated = {
        ...inv,
        sent: true,
        payments: [...(inv.payments || []), newPayment]
      };
      const copy = [...this.invoices];
      copy[idx] = updated;
      this.invoices = copy;
      this.saveInvoices();
      this.showToast("Payment recorded");
    }
  }

  removePayment(invoiceId, paymentId) {
    const idx = this.invoices.findIndex(i => i.id === invoiceId);
    if (idx >= 0) {
      const inv = this.invoices[idx];
      const updated = {
        ...inv,
        payments: (inv.payments || []).filter(p => p.id !== paymentId)
      };
      const copy = [...this.invoices];
      copy[idx] = updated;
      this.invoices = copy;
      this.saveInvoices();
      this.showToast("Payment removed");
    }
  }

  // --- Settings ---
  saveAppSettings(newSettings) {
    this.settings = { ...newSettings };
    this.saveSettings();
    this.showToast("Details saved");
  }

  // --- Backup, Seed & Wipe ---
  getBackupJSON() {
    return JSON.stringify(
      {
        app: "java-reef-admin",
        version: 1,
        exportedAt: new Date().toISOString(),
        settings: this.settings,
        customers: this.customers,
        bookings: this.bookings,
        invoices: this.invoices
      },
      null,
      2
    );
  }

  restoreBackup(jsonString) {
    try {
      const d = JSON.parse(jsonString);
      if (!Array.isArray(d.customers) || !Array.isArray(d.bookings) || !Array.isArray(d.invoices)) {
        throw new Error("Invalid structure");
      }
      this.customers = d.customers;
      this.bookings = d.bookings;
      this.invoices = d.invoices;
      if (d.settings) this.settings = d.settings;
      this.saveCustomers();
      this.saveBookings();
      this.saveInvoices();
      this.saveSettings();
      this.showToast("Backup restored");
      return true;
    } catch (_) {
      return false;
    }
  }

  wipeAll() {
    this.customers = [];
    this.bookings = [];
    this.invoices = [];
    this.saveCustomers();
    this.saveBookings();
    this.saveInvoices();
    this.showToast("All data deleted");
  }

  seedExampleData() {
    const dummy = getInitialDummyData();
    this.customers = dummy.customers;
    this.bookings = dummy.bookings;
    this.invoices = dummy.invoices;
    this.saveCustomers();
    this.saveBookings();
    this.saveInvoices();
    this.showToast("Example data loaded");
  }
}

export const db = new Database();
