![EduBox](https://socialify.git.ci/ARYPROGRAMMER/EduBox/image?font=KoHo&forks=1&issues=1&language=1&name=1&owner=1&pattern=Floating+Cogs&stargazers=1&theme=Dark)

---

<div align="center" style="margin-top: 12px;">
   <img src="frontend/public/logo-text.png" alt="EduBox" width="300" />
   <p style="margin-top: 0; color: #555;">Your intelligent student hub — notes, planner, campus life, and an AI assistant in one app.</p>

   <div style="display:flex;flex-wrap:wrap;justify-content:center;gap:8px;margin-top:18px;">
      <!-- Row 1: core tech -->
      <a href="https://nextjs.org/" aria-label="Next.js">
         <img src="https://img.shields.io/badge/Next.js-15.5.2-black?style=for-the-badge&logo=next.js&logoColor=white" alt="Next.js" />
      </a>
      <a href="https://reactjs.org/" aria-label="React">
         <img src="https://img.shields.io/badge/React-19.1.0-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React" />
      </a>
      <a href="https://typescriptlang.org/" aria-label="TypeScript">
         <img src="https://img.shields.io/badge/TypeScript-5.5.4-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
      </a>
      <a href="https://tailwindcss.com/" aria-label="Tailwind CSS">
         <img src="https://img.shields.io/badge/Tailwind_CSS-3.4.17-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
      </a>
      <a href="https://clerk.com/" aria-label="Clerk">
         <img src="https://img.shields.io/badge/Clerk-Authentication-6C47FF?style=for-the-badge&logo=clerk&logoColor=white" alt="Clerk" />
      </a>
      <a href="LICENSE" aria-label="License">
         <img src="https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge" alt="License" />
      </a>
      <a href="http://makeapullrequest.com" aria-label="PRs Welcome">
         <img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=for-the-badge" alt="PRs Welcome" />
      </a>
      <a href="CONTRIBUTING.md" aria-label="Contributions Welcome">
         <img src="https://img.shields.io/badge/contributions-welcome-brightgreen.svg?style=for-the-badge" alt="Contributions Welcome" />
      </a>

   </div>
</div>
</div>

---

## 🎓 About EduBox

**EduBox** is your intelligent student hub that organizes notes, schedules, assignments, and campus life in one place. Powered by AI, it streamlines your academic journey with smart organization, intelligent planning, and seamless campus life integration.

## ✨ Features

- **🗂️ Smart File Management** - AI-powered organization and semantic search
- **📅 Intelligent Planner** - Never miss deadlines with smart scheduling
- **🏫 Campus Life Hub** - Stay connected with clubs, events, and dining
- **🤖 AI Assistant** - Get instant answers about your academic life
- **📊 Analytics Dashboard** - Track your academic progress

---

## 🎓 About

EduBox is an intelligent student hub that organizes notes, schedules, assignments, and campus life in one place. It uses AI to help with organization, planning, and finding what you need quickly.

## ✨ Highlights

- AI-powered file organization and semantic search
- Intelligent planner with reminders and calendar sync
- Campus life hub: events, clubs, dining info
- Built-in AI assistant for fast help and answers
- Analytics dashboard to track study progress
- Responsive UI with light/dark themes

---

## 🎥 Demo Video

[![Demo Video](https://img.shields.io/badge/Demo-Video-red?style=for-the-badge&logo=youtube)](https://youtube.com/watch?v=your-demo-video-id)

---

## 📸 Screenshots

<details>
<summary>Click to expand screenshots</summary>

### Dashboard Overview

![Dashboard](https://via.placeholder.com/800x400?text=Dashboard+Screenshot)

### AI Assistant

![AI Assistant](https://via.placeholder.com/800x400?text=AI+Assistant+Screenshot)

### Planner

![Planner](https://via.placeholder.com/800x400?text=Planner+Screenshot)

</details>

---

## 🚀 Quick start

### Prerequisites

- Node.js 18+ and pnpm
- Git
- Accounts for: Clerk, Convex, Schematic, Nuclia (Progress RAG), Google AI, Groq

### 1. Clone and Setup

```powershell
git clone https://github.com/ARYPROGRAMMER/EduBox.git
cd EduBox
```

### 2. Choose Your Setup

#### Quick Setup (All Services)

For the complete development experience with all services running:

```powershell
# Install all dependencies
npm run setup

# Configure environment variables
cp frontend/env.example frontend/.env.local
# Edit frontend/.env.local with your API keys

# Start all services
npm run dev
```

This will run:

- Frontend (Next.js) on http://localhost:3000
- Convex backend functions
- Nuclia sync service on port 4000

## 📋 Setup Options

### Option 1: Backend Running Setup

Run the Nuclia sync service for document processing and RAG functionality.

```powershell
# Navigate to backend
cd backend/nuclia-sync

# Install dependencies
npm install

# Create environment file
cp .env.example .env
# Edit .env with your NUCLIA_API_KEY and other required variables

# Start the sync service
npm start
```

**Environment Variables for Backend:**

```env
PORT=4000
NUCLIA_API_KEY=your_nuclia_api_key
```

### Option 2: Frontend Development Setup

Run the Next.js application with all UI components and integrations.

```powershell
# Navigate to frontend
cd frontend

# Install dependencies
pnpm install

# Create environment file
cp env.example .env.local

# Edit .env.local with all required API keys (see Environment Variables section below)

# Start development server
pnpm dev
```

### Option 3: Full Stack AI Setup (CopilotKit + Nuclia RAG + Convex + Schematic + Clerk)

Complete setup with AI chat, RAG search, database, billing, and authentication.

```powershell
# 1. Setup Convex (Database & Backend Functions)
cd frontend
npx convex dev --once  # Initialize Convex project
# Follow prompts to create/link your Convex project

# 2. Setup Environment Variables
cp env.example .env.local
# Fill in all required variables (see below)

# 3. Start Convex Backend
npx convex dev

# 4. In another terminal, start Frontend
pnpm dev

# 5. Start Backend Sync Service (in third terminal)
cd ../backend/nuclia-sync
npm start
```

## 🔧 Environment Variables

Create `.env.local` in the `frontend` directory with:

```env
# Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Database
CONVEX_DEPLOYMENT=your_convex_deployment
NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud

# AI Services
GOOGLE_GENERATIVE_AI_API_KEY=your_google_ai_key
GROQ_API_KEY=your_groq_key
GOOGLE_API_KEY=your_google_api_key
YOUTUBE_API_KEY=your_youtube_api_key

# CopilotKit AI Chat
NEXT_PUBLIC_COPILOTKIT_PUBLIC_LICENSE_KEY=your_copilotkit_license
NEXT_PUBLIC_COPILOTKIT_PUBLIC_API_KEY=your_copilotkit_api_key

# Nuclia RAG (Progress/Kendo)
NEXT_PUBLIC_NUCLIA_SYNC_URL=http://localhost:4000
NEXT_PUBLIC_NUCLIA_API_KEY=your_nuclia_api_key

# Billing & Feature Gates
NEXT_PUBLIC_SCHEMATIC_PUBLISHABLE_KEY=your_schematic_pub_key
SCHEMATIC_API_KEY=your_schematic_secret_key
NEXT_PUBLIC_SCHEMATIC_COMPONENT_ID=your_component_id
```

## 🏗️ Tech Stack Details

### Frontend Framework

- **Next.js 15.5.2** - React framework with App Router
- **React 19.1.0** - UI library with concurrent features
- **TypeScript 5.5.4** - Type-safe JavaScript

### UI & Styling

- **Tailwind CSS 3.4.17** - Utility-first CSS framework
- **Shadcn/ui** - Modern component library built on Radix UI
- **MagicUI** - Animated UI components
- **Aceternity UI** - Additional UI components
- **Framer Motion** - Animation library
- **Three.js** - 3D graphics and interactive droplets

### Authentication & Security

- **Clerk** - Complete authentication and user management
- **Schematic** - Feature gating and billing management

### Database & Backend

- **Convex** - Real-time database with serverless functions
- **Nuclia Sync** - Custom backend service for document processing

### AI & ML

- **CopilotKit** - AI chat interface and actions
- **Vercel AI SDK** - Unified AI API interface
- **Google AI (Gemini)** - Large language models
- **Groq** - Fast LLM inference
- **Nuclia RAG** - Retrieval-augmented generation (Progress/Kendo)

### Additional Libraries

- **Kendo UI** - Enterprise UI components (licensed)
- **Tsparticles** - Interactive particle effects
- **React Dropzone** - File upload handling
- **React Markdown** - Markdown rendering
- **Recharts** - Data visualization
- **Date-fns** - Date manipulation
- **Zod** - Schema validation

## 🏃‍♂️ Development Scripts

### Root-Level Scripts (Recommended)

```bash
# Quick setup for everything
npm run setup          # Install all dependencies and show next steps
npm run dev           # Start all services (frontend + convex + backend)
npm install:all       # Install dependencies for all services
```

### Frontend Scripts

```bash
cd frontend

# Development
pnpm dev          # Start dev server with Turbopack
pnpm build        # Production build
pnpm start        # Production server
pnpm lint         # ESLint checking

# Convex Database
npx convex dev    # Start Convex development
npx convex deploy # Deploy Convex functions
npx convex dashboard # Open Convex dashboard
```

### Backend Scripts

```bash
cd backend/nuclia-sync

# Development
npm run dev       # Start with auto-restart (nodemon)
npm start         # Production start
```

### Multi-Service Development

For running multiple services simultaneously, consider using a process manager like PM2 or concurrently.

## 🔍 Troubleshooting

### Common Issues

**CopilotKit not working:**

- Verify `NEXT_PUBLIC_COPILOTKIT_PUBLIC_LICENSE_KEY` and `NEXT_PUBLIC_COPILOTKIT_PUBLIC_API_KEY` are set
- Check browser console for CopilotKit initialization errors

**Convex connection failed:**

- Ensure `npx convex dev` is running
- Verify `CONVEX_DEPLOYMENT` and `NEXT_PUBLIC_CONVEX_URL` are correct
- Run `npx convex dashboard` to check deployment status

**Nuclia RAG not responding:**

- Ensure backend sync service is running on port 4000
- Check `NEXT_PUBLIC_NUCLIA_API_KEY` is valid
- Verify Nuclia knowledge box configuration

**Schematic billing not working:**

- Confirm `NEXT_PUBLIC_SCHEMATIC_PUBLISHABLE_KEY` and `SCHEMATIC_API_KEY` are set
- Check Schematic dashboard for component configuration

**Build errors:**

- Ensure all environment variables are set
- Try `pnpm install` to refresh dependencies
- Check Node.js version (18+ required)

### Environment Setup Verification

Run this script to verify your environment:

```bash
# In frontend directory
node -e "
console.log('Node version:', process.version);
console.log('Environment check:');
console.log('CLERK_KEY:', !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);
console.log('CONVEX_URL:', !!process.env.NEXT_PUBLIC_CONVEX_URL);
console.log('COPILOTKIT_KEY:', !!process.env.NEXT_PUBLIC_COPILOTKIT_PUBLIC_LICENSE_KEY);
console.log('NUCLIA_KEY:', !!process.env.NEXT_PUBLIC_NUCLIA_API_KEY);
console.log('SCHEMATIC_KEY:', !!process.env.NEXT_PUBLIC_SCHEMATIC_PUBLISHABLE_KEY);
"
```

## 📁 Project Structure

```
EduBox/
├── frontend/                 # Next.js application
│   ├── app/                  # App Router pages and API routes
│   ├── components/           # React components
│   │   ├── magicui/         # MagicUI components
│   │   ├── schematic/       # Schematic billing components
│   │   └── ui/              # Shadcn/ui components
│   ├── convex/              # Convex database schema and functions
│   ├── lib/                 # Utility libraries
│   ├── hooks/               # Custom React hooks
│   └── types/               # TypeScript type definitions
├── backend/
│   └── nuclia-sync/         # Nuclia document sync service
└── README.md
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Development Guidelines

- Use TypeScript for all new code
- Follow ESLint configuration
- Test components with React Testing Library
- Update Convex schema for database changes
- Document new environment variables

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<div align="center">
  <p>Made with ❤️ by Arya • <a href="https://github.com/ARYPROGRAMMER">GitHub</a> • <a href="https://edubox.dev">Website</a></p>
</div>
