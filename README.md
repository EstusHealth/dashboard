# Team Pulse Dashboard

Weekly team wellness and workload tracking dashboard for **Estus Health**. Built with Next.js 14 (App Router), reads live data from a published Google Sheets CSV.

## Setup

### 1. Publish your Google Sheet as CSV

In Google Sheets: **File > Share > Publish to web** and select **Comma-separated values (.csv)** as the format. Copy the generated URL.

### 2. Clone and install

```bash
git clone <repo-url>
cd dashboard
npm install
```

### 3. Configure environment

```bash
cp .env.example .env.local
```

Edit `.env.local` and set `NEXT_PUBLIC_SHEET_CSV_URL` to your published CSV URL.

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploy to Vercel

1. Push this repo to GitHub
2. Import in Vercel
3. Add the environment variable `NEXT_PUBLIC_SHEET_CSV_URL` in the Vercel project settings
4. Deploy

## Tech Stack

- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS** - styling and layout
- **Recharts** - trend charts, donut chart
- **Papaparse** - CSV parsing (client-side)

## CSV Column Mapping

| CSV Column | Internal Key | Type |
|---|---|---|
| Timestamp | timestamp | string |
| Role | role | string |
| Date | date | string |
| Energy & Recovery | recovery | 1-5 |
| Execution Cost | execution | 1-5 |
| Workload Perception | workload | text |
| Primary Friction Source | friction | comma-separated |
| Meaningful Progress | progress | 1-5 |
| Forward Capacity | forward | text |
| Optional Context | notes | text |
