# Clever Sermon Frontend

Modern web interface for the Clever Sermon AI-powered sermon generation and Bible study platform.

## Features

- **Authentication**: Secure login and registration
- **Dashboard**: Manage sermon workspaces
- **Workspace Management**: Create and organize sermon projects
- **AI Integration**: Generate outlines, manuscripts, and applications
- **Modern UI**: Built with Next.js 14, React, and Tailwind CSS
- **Responsive Design**: Works on desktop, tablet, and mobile

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **UI**: React 18, Tailwind CSS
- **Components**: Radix UI primitives
- **Icons**: Lucide React
- **HTTP Client**: Axios
- **Forms**: React Hook Form

## Installation

```bash
npm install
```

## Configuration

Copy `.env.local.example` to `.env.local`:

```bash
cp .env.local.example .env.local
```

Configure the API URL:
```
NEXT_PUBLIC_API_URL=http://localhost:4001/api/v1
```

The sermon backend now proxies media and slide orchestration through its `/media` routes, so the frontend only needs `NEXT_PUBLIC_API_URL`.

## Running the App

```bash
# Development
npm run dev

# Production build
npm run build
npm start
```

The app will be available at `http://localhost:4000`

## Project Structure

```
src/
├── app/
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Landing page
│   ├── globals.css         # Global styles
│   ├── login/              # Login page
│   ├── register/           # Registration page
│   ├── dashboard/          # Dashboard page
│   └── workspace/          # Workspace pages
├── components/             # Reusable components
└── lib/                    # Utilities and helpers
```

## Default Credentials

After running the backend seed:
- Email: `admin@example.com`
- Password: `password123`

## Features Overview

### Landing Page
- Feature showcase
- Login/Register buttons
- Responsive design

### Authentication
- Secure JWT-based authentication
- Form validation
- Error handling

### Dashboard
- List all sermon workspaces
- Create new workspaces
- Quick access to recent work
- Status indicators

### Workspace
- Sermon outline generation
- Manuscript creation
- Application generation
- Discussion questions
- Scripture tools
- Notes and highlights

## Development

```bash
# Run linter
npm run lint

# Type checking
npx tsc --noEmit
```

## Deployment

This is a standard Next.js application and can be deployed to:
- Vercel (recommended)
- Netlify
- AWS Amplify
- Any Node.js hosting platform

## License

MIT
