# Figment Arts — Port Studio

A crowdfunding landing page for **Figment Arts**' **Port Studio** project. Visitors can leave a personalised message on a communal "brick wall" and track real-time campaign progress.

## Features

- **Brick Wall** — A responsive, house-shaped brick wall (68 slots) that fills from the bottom up. Supporters add a brick with their name and a short message.
- **Live Campaign Stats** — Real-time funding progress, supporter count, and days remaining powered by Supabase.
- **Admin Panel** (`/admin`) — Password-protected admin page for listing and deleting bricks. Deletions automatically re-compact the remaining bricks' positions so the wall never shows gaps.
- **Accessibility** — WCAG AA colour contrast, skip link, ARIA labels, live regions, and full `prefers-reduced-motion` support.
- **SEO / Social** — Open Graph and Twitter Card meta tags, canonical URLs.

## Tech Stack

- [TanStack Start](https://tanstack.com/start) (React 19 + Vite 7)
- [Tailwind CSS](https://tailwindcss.com/) v4
- [Supabase](https://supabase.com/) (PostgreSQL + realtime)
- [shadcn/ui](https://ui.shadcn.com/) components
- [Radix UI](https://www.radix-ui.com/) primitives
- Bun (package manager & runtime)

## Project Structure

```
src/
  routes/
    index.tsx          # Homepage — hero, brick wall, submission form, stats
    admin.tsx          # Admin dashboard
    __root.tsx         # Root layout (head, providers)
  lib/
    bricks.functions.ts # addBrick server function
    admin.functions.ts  # adminListBricks, adminDeleteBrick server functions
  components/
    ui/                 # shadcn/ui primitives
    ShareBrickModal.tsx
    TestimonialsCarousel.tsx
  styles.css            # Tailwind v4 theme tokens + custom animations
supabase/
  migrations/           # Database migrations (bricks, campaign_stats, RLS)
```

## Database Schema

### `bricks`

| Column           | Type   | Notes                              |
|------------------|--------|------------------------------------|
| `id`             | uuid   | Primary key                        |
| `name`           | text   | Supporter name (default: "Anonymous") |
| `message`        | text   | 1–80 characters                    |
| `color`          | text   | Hex colour for the brick           |
| `position_index` | int2   | Unique, 0–67, defines wall slot    |

### `campaign_stats`

| Column           | Type      | Notes                        |
|------------------|-----------|------------------------------|
| `id`             | int8      | Primary key (single row)     |
| `amount_raised`  | numeric   | Current funds raised         |
| `target`         | numeric   | Funding target               |
| `supporters`     | int8      | Number of backers            |
| `deadline_date`  | date      | Campaign deadline            |

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) installed
- Supabase project (URL + publishable key)

### Environment Variables

Create a `.env` file in the project root:

```
VITE_SUPABASE_URL=https://<your-project>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<your-anon-key>
SUPABASE_URL=https://<your-project>.supabase.co
SUPABASE_PUBLISHABLE_KEY=<your-anon-key>
```

### Install & Run

```bash
bun install
bun run dev
```

The dev server will start on `http://localhost:8080` (or the next available port).

### Build

```bash
bun run build
```

### Format / Lint

```bash
bun run format
bun run lint
```

## Admin Access

Navigate to `/admin` and enter the admin password to view and manage bricks.

## License

Copyright © Figment Arts. All rights reserved.
