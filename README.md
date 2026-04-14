# LLD Masterclass

A modern, interactive web application for learning **Low-Level Design** and **System Design** concepts. Browse detailed technical deep-dives organized by domain, complete with code examples, database schemas, API contracts, and architectural trade-offs.

**Built with React + TypeScript + Vite**

---

## 🖥️ Features

- **Categorized sidebar navigation** — 11 domains with nested subtopics
- **Markdown-powered content** — write once in `.md`, auto-discovered and rendered
- **Syntax highlighting** — code blocks with language-aware highlighting
- **LaTeX math support** — render formulas and complexity notation with KaTeX
- **Search & filter** — find topics instantly across all categories
- **Responsive design** — works on desktop and mobile with a collapsible sidebar
- **Breadcrumb navigation** — always know where you are
- **Dark theme** — easy on the eyes

---

## 📚 Content Domains

| # | Category | Topics |
|---|----------|--------|
| 1 | **Core Infrastructure & Storage** | Distributed Unique ID Generator, Back-of-the-Envelope Calculations |
| 2 | **Concurrency & Scheduling** | Distributed Lock |
| 3 | **Networking & Protocols** | — |
| 4 | **Messaging & Event Systems** | Notification Service |
| 5 | **API & Access Control** | Permission Systems |
| 6 | **File Systems & IO** | — |
| 7 | **Payments & Transactions** | — |
| 8 | **Observability & Reliability** | — |
| 9 | **Caching & Proxies** | Redis |
| 10 | **Practical System Components** | URL Shortener, Elevator Design, Ride Matching Engine, Code Deployment Pipeline |
| 11 | **Algorithms & Data Structures** | Dynamic Programming, Binary Search, Graphs, Greedy, Priority Queue, Stack & Queue, Tries |

---

## 🚀 Getting Started

### Prerequisites

- Node.js ≥ 18
- npm

### Install & Run

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Build for Production

```bash
npm run build
npm run preview
```

---

## 📁 Project Structure

```
lld/
├── content/               # Markdown content files (auto-discovered)
│   ├── redis.md
│   ├── distributed_lock.md
│   ├── elevator_design.md
│   └── ...
├── docs/                  # Internal documentation
├── src/
│   ├── components/
│   │   ├── Sidebar.tsx    # Category navigation with expand/collapse
│   │   └── MarkdownViewer.tsx  # Renders markdown with syntax highlighting + KaTeX
│   ├── pages/
│   │   ├── Dashboard.tsx  # Landing page
│   │   └── ContentPage.tsx  # Topic viewer with breadcrumbs
│   ├── utils/
│   │   └── contentLoader.ts  # Dynamic markdown loading + topic→category mapping
│   ├── App.tsx            # Router setup
│   ├── main.tsx           # Entry point
│   └── index.css          # Global styles + design system
├── index.html
├── package.json
├── vite.config.ts
└── tsconfig.json
```

---

## ➕ Adding New Content

1. Create a markdown file in `content/` (e.g., `content/rate_limiter.md`)
2. Add a mapping entry in `src/utils/contentLoader.ts`:

```typescript
export const TOPIC_MAPPING: Record<string, string> = {
  // ... existing entries
  'rate_limiter': 'api'   // maps to "API & Access Control" category
};
```

3. The topic auto-appears in the sidebar under its category. No other changes needed.

### Available categories

| Category ID | Display Name |
|-------------|-------------|
| `core-infrastructure` | Core Infrastructure & Storage |
| `concurrency` | Concurrency & Scheduling |
| `networking` | Networking & Protocols |
| `messaging` | Messaging & Event Systems |
| `api` | API & Access Control |
| `file-systems` | File Systems & IO |
| `payments` | Payments & Transactions |
| `observability` | Observability & Reliability |
| `caching` | Caching & Proxies |
| `practical-systems` | Practical System Components |
| `algorithms` | Algorithms & Data Structures |

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 19 |
| Language | TypeScript |
| Bundler | Vite 8 |
| Routing | React Router v7 |
| Markdown | react-markdown + remark-gfm |
| Math | KaTeX (rehype-katex + remark-math) |
| Code Highlighting | react-syntax-highlighter |
| Sanitization | DOMPurify |

---

## 📝 License

MIT
