# The Office Brainstorm

An advanced AI-powered brainstorming platform featuring characters from "The Office" TV show. Create dynamic brainstorming sessions with authentic Office characters using cutting-edge AI technology.

## 🚀 Features

- **Character Selection**: Choose from 8 authentic Office characters with distinct personalities
- **AI-Powered Discussions**: Real-time streaming conversations with character-authentic responses
- **Interactive Participation**: Users can contribute messages, sticky notes, and vote alongside AI characters
- **Live Analysis**: Automatic pros/cons analysis of ideas as they're generated
- **Voting System**: Democratic selection of top ideas with character-specific reasoning
- **Password Protection**: Secure access with HTTP Basic Authentication
- **Real-time Updates**: Server-Sent Events for live brainstorm session streaming

## 🛠 Technology Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui
- **Backend**: Node.js, Express, TypeScript
- **AI**: Vultr Cloud API with LangChain & LangGraph orchestration
- **Database**: PostgreSQL with Drizzle ORM (optional, defaults to in-memory)
- **Authentication**: HTTP Basic Authentication
- **Deployment**: Vultr Cloud Compute

## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn
- Vultr API key (for AI functionality)

## 🔧 Installation

1. **Clone the repository**:
```bash
git clone https://github.com/bruchansky/officebrainstorm.git
cd officebrainstorm
```

2. **Install dependencies**:
```bash
npm install
```

3. **Set up environment variables**:
```bash
# Required for production
export NODE_ENV=production
export VULTR_API_KEY=your_vultr_api_key
export BASIC_AUTH_USERNAME=your_username
export BASIC_AUTH_PASSWORD=your_password
```

4. **Build the application**:
```bash
npm run build
```

5. **Start the production server**:
```bash
npm start
```

The application will be available at `http://localhost:5000`

## 🎭 Available Characters

- **Michael Scott** - Regional Manager, attention-seeking and pop culture obsessed
- **Dwight Schrute** - Assistant Regional Manager, intense and rule-focused
- **Jim Halpert** - Sales Representative, laid-back with subtle humor
- **Pam Beesly** - Receptionist, kind and emotionally intelligent
- **Kevin Malone** - Accountant, simple and food-obsessed
- **Karen Filippelli** - Sales Representative, confident and professional
- **Jan Levinson** - VP of Regional Sales, intense and ambitious
- **Erin Hannon** - Receptionist, cheerful and eager to please

## 🚀 Deployment

### Vultr Cloud Compute

1. Create a Vultr server with Ubuntu 22.04
2. Install Node.js 20:
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

3. Clone and setup the application:
```bash
git clone https://github.com/bruchansky/officebrainstorm.git
cd officebrainstorm
npm install
```

4. Configure environment variables:
```bash
export NODE_ENV=production
export VULTR_API_KEY=your_key
export BASIC_AUTH_USERNAME=admin
export BASIC_AUTH_PASSWORD=your_password
```

5. Build and start:
```bash
npm run build
npm start
```

6. Configure firewall to allow TCP port 5000

## 🔒 Security

- HTTP Basic Authentication protects the entire application
- Environment variables store sensitive API keys
- Firewall configuration restricts access to necessary ports only

## 🏗 Architecture

The application uses a multi-agent AI architecture:

- **LangGraph Workflow**: Orchestrates multi-turn conversations
- **Character Agents**: Individual AI agents with distinct personalities
- **Real-time Streaming**: Server-Sent Events for live updates
- **State Management**: Persistent conversation state throughout sessions

## 📝 API Endpoints

- `GET /` - Main application (protected)
- `POST /api/brainstorm` - Create new brainstorm session
- `GET /api/brainstorm/:id` - Get session details
- `GET /api/brainstorm/:id/stream` - Real-time session streaming
- `POST /api/brainstorm/:id/user-input` - Submit user participation

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

This project is for educational and entertainment purposes.