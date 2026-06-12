# BriefMe

AI-powered company research briefs for your meetings. Get a snapshot, recent news, talking points, and risk flags for any company — all in seconds.

## Tech Stack

- **Next.js 15** + TypeScript + Tailwind CSS
- **Exa API** — live web research on companies
- **Mem0 API** — persistent memory for past meeting notes
- **Gemini 2.0 Flash** — AI synthesis of research into structured briefs

## Setup

1. **Install dependencies:**

```bash
cd briefme
npm install
```

2. **Configure environment variables:**

```bash
cp .env.local.example .env.local
```

Edit `.env.local` and add your API keys:

| Variable | Source |
|----------|--------|
| `GEMINI_API_KEY` | [Google AI Studio](https://aistudio.google.com/apikey) |
| `EXA_API_KEY` | [Exa Dashboard](https://dashboard.exa.ai) |
| `MEM0_API_KEY` | [Mem0 Platform](https://app.mem0.ai) |

3. **Run the dev server:**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Demo Flow

1. Enter a company name (e.g., "DBS Bank") or click an example chip
2. View the generated brief with 5 sections:
   - **Snapshot** — quick company overview
   - **Recent News** — latest developments
   - **Past Context** — your previous meeting notes (from Mem0)
   - **Talking Points** — suggested conversation starters
   - **Risk Flags** — potential concerns to be aware of
3. After your meeting, add notes in the textarea and click **Save to Memory**
4. Next time you research the same company, your past notes will inform the brief

## Project Structure

```
briefme/
├── src/app/
│   ├── page.tsx              # Home — company input + example chips
│   ├── brief/page.tsx        # Brief display + post-meeting notes
│   ├── api/brief/route.ts    # Exa + Mem0 + Gemini orchestration
│   ├── api/memory/route.ts   # Save notes to Mem0
│   ├── layout.tsx            # Root layout
│   └── globals.css           # Tailwind + base styles
├── package.json
├── tailwind.config.js
├── next.config.js
└── tsconfig.json
```
