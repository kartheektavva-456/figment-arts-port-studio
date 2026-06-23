# Building Belonging, Brick by Brick 🧱

> A community feedback wall and fundraising thermometer built for **Figment Arts** as part of the **Create With × EVOLVE Hackathon 2026**.

🌐 **Live site:** [figment-arts-port-studio.lovable.app](https://figment-arts-port-studio.lovable.app/)

---

## What is this?

Figment Arts is a Brighton-based Community Interest Company raising funds to open **Port Studio** — a permanent, inclusive creative hub for neurodivergent and disabled artists.

This project turns their fundraising ask into something people actually want to be part of: **every message of support becomes a literal brick**, filling in the shape of Port Studio from the ground up — just like the real building will be built, piece by piece.

---

## Features

### 🧱 Brick-by-Brick Feedback Wall
- Visitors add a short message of support via "Add your brick"
- Each message instantly becomes a coloured brick on a house-shaped wall
- Wall fills **bottom-up** (foundation first, roof last) — mirroring how Port Studio will actually be built
- Hover/tap any brick to reveal the supporter's name and message
- Calm entrance animation (respects `prefers-reduced-motion`)
- Real-time updates via Supabase — new bricks appear instantly for all visitors

### 📊 Live Fundraising Stats
- Amount raised, % funded, supporter count, and days left — all pulled live from the database
- Funding milestone messages (e.g. "A quarter of the way there") update automatically
- Real campaign data: £1,747 raised of £6,000 target (29% funded as of June 2026)

### 📤 Shareable Brick Card
- After adding a brick, supporters get a downloadable 1080×1080 image card
- Card includes their message, name, and a link to the campaign
- Native share sheet on mobile (Web Share API), plus Facebook and LinkedIn share buttons

### 🌡️ Embeddable Fundraising Thermometer
- Standalone widget at `/thermometer` — embeddable on any external site via `<iframe>`
- Pulls live from the same Supabase data source
- Real-time updates, no page refresh needed

### 🛡️ Admin Moderation Panel
- Password-protected `/admin` route for Figment Arts to manage submissions
- View, delete, and refresh brick messages
- Auto-recompacts position indices after deletion (no gaps in the wall)
- Server-side atomic operations with UNIQUE constraint to prevent race conditions

### ♿ Accessibility
- Full keyboard navigation with visible focus states
- Skip-to-content link
- Screen reader support: ARIA labels on bricks, `role="progressbar"`, `aria-live` regions
- `prefers-reduced-motion` respected globally (brick animation, milestone fade, hover transforms)
- WCAG AA colour contrast throughout

---

## Tech Stack

| Layer | Tool |
|---|---|
| Frontend / Build | [Lovable](https://lovable.dev) (React + TypeScript + Vite) |
| Database | [Supabase](https://supabase.com) (PostgreSQL + Realtime) |
| Styling | Tailwind CSS + shadcn/ui |
| Hosting | Lovable Cloud |
| Planning & QA | Claude (Anthropic) |

---

## Project Structure

```
src/
├── components/         # UI components (BrickWall, BrickGrid, ShareModal, etc.)
├── routes/             # Page routes (index, thermometer, admin)
├── lib/                # Server functions (addBrick, deleteBrick, campaignStats)
└── styles/             # Global CSS including reduced-motion rules
supabase/
└── migrations/         # Database schema and RLS policies
```

---

## Database Schema

```sql
-- Brick messages
create table bricks (
  id uuid primary key default gen_random_uuid(),
  name text default 'Anonymous',
  message text not null,
  color text not null,
  position_index int not null unique,
  created_at timestamptz default now()
);

-- Campaign stats (manually updated, realtime subscribed)
create table campaign_stats (
  id int primary key default 1,
  amount_raised numeric default 0,
  target numeric default 6000,
  supporters int default 0,
  deadline_date date default '2026-07-27',
  updated_at timestamptz default now()
);
```

---

## Key Design Decisions

- **Bottom-up fill** — bricks fill from the foundation row up, so the roof is the final "completion" moment
- **Decoupled stats** — funding figures are independent from brick count; supporter numbers reflect the real Crowdfunder campaign, not form submissions
- **Server-side position assignment** — brick slots are assigned atomically server-side with retry logic to prevent race conditions when multiple users submit simultaneously
- **Auto-recompaction on delete** — when a brick is deleted via admin, remaining bricks are re-sequenced in a single atomic transaction, so the wall never has gaps
- **Live Crowdfunder integration attempted** — we tested automated scraping via Make.com but found Crowdfunder uses Cloudflare bot protection that blocks server-side requests. Stats are currently updated manually; next step would be a headless-browser service (e.g. Apify/Browserless) or a direct API partnership

---

## Hackathon Context

**Event:** Create With × EVOLVE Hackathon 2026
**Track:** Online (48-hour build window, 19–21 June 2026)
**Non-profit:** [Figment Arts](https://figmentarts.org.uk) — Port Studio campaign
**Brief:** Build something that raises awareness for a Brighton non-profit — a feedback wall and embeddable fundraising thermometer, shaped with David at Figment Arts

---

## About the Builder

**Kartheek Tavva** — IT Project Manager at One Digital Technologies, Northampton UK.
MSc Project Management (Distinction) · PRINCE2® Practitioner · CSM® · PMI GenAI & Prompt Engineering Certificate

[LinkedIn](https://linkedin.com/in/naga-manikanta-kartheek)

---

## Live Demo

🌐 [figment-arts-port-studio.lovable.app](https://figment-arts-port-studio.lovable.app/)
🌡️ Thermometer widget: [figment-arts-port-studio.lovable.app/thermometer](https://figment-arts-port-studio.lovable.app/thermometer)

---

*Built with care for a community that deserves a permanent home.*
