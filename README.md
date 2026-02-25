# Capstone Animal Rescue Platform

A full-stack web application for animal rescue coordination, built with Next.js and Express.

## Project Structure

```
├── apps/
│   ├── server/          # Express API (Node.js)
│   └── web/             # Next.js frontend (React + TypeScript)
├── docs/                # Project documentation and diagram scripts
├── ngrok/               # Tunnel script for exposing local dev to the internet
├── .gitignore
├── LICENSE
└── README.md
```

## Prerequisites

- [Node.js](https://nodejs.org/) 18 or higher
- npm (included with Node.js)
- Git

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/Lennon0926/capstone-animal-rescue-platform.git
cd capstone-animal-rescue-platform
```

### 2. Install dependencies

```bash
cd apps/server && npm install
cd ../web && npm install
```

### 3. Configure environment variables

**Server** (`apps/server/.env.local`):

```env
PORT='8080'
```

**Web** (`apps/web/.env.local`):

```env
NEXT_PUBLIC_API_BASE_URL='http://localhost:8080'
```

### 4. Start the development servers

In one terminal, start the API server:

```bash
cd apps/server
npm run dev
```

In a second terminal, start the frontend:

```bash
cd apps/web
npm run dev
```

The API will be available at `http://localhost:8080` and the frontend at `http://localhost:3000`.

## Tech Stack

| Layer    | Technology                          |
| -------- | ----------------------------------- |
| Frontend | Next.js 16, React 19, Tailwind CSS 4, TypeScript |
| Backend  | Express 5, Node.js                  |
| Tooling  | ESLint, Nodemon, PostCSS            |

## Documentation Scripts

The `docs/scripts/` directory contains Python scripts for generating project diagrams (flowcharts, sequence diagrams, timelines, algorithm charts). These are documentation-only utilities and are not required to run the application.

To run them:

```bash
cd docs/scripts
pip install -r requirements.txt
python flowchart/generate_flowchart.py
```

## ngrok Tunnel

The `ngrok/` directory includes a script to expose the local frontend via a public URL for testing. See [`ngrok/README.md`](ngrok/README.md) for setup instructions.

```bash
./ngrok/start-ngrok.sh
```

## License

See [LICENSE](LICENSE) for details.
