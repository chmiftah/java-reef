# Java Reef Filmer (Svelte 5 + Vite)

Modern, reactive web application and administrative back-office for **Java Reef Filmer** built with **Svelte 5** and **Vite**.

## Features

- **Public Website (`LandingPage`)**:
  - Procedural sunrise surf wave animation and live timecode readout
  - Shot list & services overview
  - Interactive wave shape charts for Uluwatu, Padang Padang, and Java points
  - Session timeline workflow
  - YouTube & Instagram reel showcase
  - Booking request form with automatic local database persistence and ready-to-send messages for WhatsApp & Instagram DM
  - Responsive header navigation with **Login** button and **Book a session** CTA

- **Back-Office Admin Portal (`AdminShell`)**:
  - **Auth Guard**: First-time admin setup (SHA-256 password hashing with salt) and secure login with session persistence
  - **Dashboard**: Real-time KPI summaries, upcoming sessions schedule, 6-month revenue chart, and overdue invoice alerts
  - **Customers Management**: Searchable customer directory with booking counters and unpaid balance calculation
  - **Bookings Management**: Filterable sessions by status (*New*, *Confirmed*, *Done*, *Cancelled*), with one-click invoice generation
  - **Invoices & Billing**: Full invoice generator with customizable line items, tax, discount, partial payment recording, and printable paper invoice (PDF preview & print)
  - **Invoice Tracker**: Kanban aging board (*Draft*, *Sent*, *Partial*, *Overdue*, *Paid*) with automated reminder message generation
  - **Account & Backup**: Business settings, password changes, JSON backup download / clipboard copy, data restore, example seed data, and data management

## Getting Started

### Development
```bash
npm run dev
```

### Production Build
```bash
npm run build
```

### Preview Build
```bash
npm run preview
```
