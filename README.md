# The Office Brainstorm

An AI-powered brainstorming platform featuring characters from "The Office" TV show. Create dynamic brainstorming sessions where AI agents simulate character personalities and facilitate creative discussions.

## Features

- **Character-Based AI Agents**: Choose from 8 Office characters with authentic personalities
- **Real-Time Streaming**: Watch brainstorming sessions unfold in real-time
- **Interactive Participation**: Join sessions as a participant or observer
- **Smart Voting System**: Characters vote on ideas based on their personalities
- **AI Analysis**: Automatic pros/cons analysis of sticky notes
- **Key Takeaways**: AI-generated summaries of winning ideas

## Technology Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Node.js + Express + TypeScript
- **UI**: Radix UI + Tailwind CSS + shadcn/ui
- **AI**: Vultr Inference API (llama-3.1-70b-instruct-fp8)
- **Database**: PostgreSQL with Drizzle ORM
- **Real-time**: Server-Sent Events (SSE)

## Quick Start

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set environment variables**:
   ```bash
   VULTR_API_KEY=your_vultr_api_key
   GROQ_API_KEY=your_groq_api_key
   DATABASE_URL=your_postgresql_url
   ```

3. **Run development server**:
   ```bash
   npm run dev
   ```

4. **Build for production**:
   ```bash
   npm run build
   npm run start
   ```

## Deployment

### Vultr Deployment
1. Connect your GitHub repository to Vultr App Platform
2. Set build command: `npm run build`
3. Set start command: `npm run start`
4. Add environment variables in Vultr dashboard

### Environment Variables
```
NODE_ENV=production
VULTR_API_KEY=your_vultr_api_key
GROQ_API_KEY=your_groq_api_key
DATABASE_URL=your_postgresql_url
BASIC_AUTH_USERNAME=your_username
BASIC_AUTH_PASSWORD=your_password
```

## Password Protection

The app includes basic HTTP authentication for production deployments. Set `BASIC_AUTH_USERNAME` and `BASIC_AUTH_PASSWORD` environment variables to enable password protection.

## Characters Available

- Michael Scott (Regional Manager)
- Dwight Schrute (Assistant Regional Manager)
- Jim Halpert (Sales Representative)
- Pam Beesly (Receptionist)
- Kevin Malone (Accountant)
- Karen Filippelli (Sales Representative)
- Jan Levinson (Corporate)
- Erin Hannon (Receptionist)

## License

MIT License