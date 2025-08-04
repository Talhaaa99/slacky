# Slacky - Postgres Assistant Chat & Slack Bot

A comprehensive Next.js 15 application that provides both a web-based chat interface and a Slack bot for querying Postgres databases using natural language. Built with TypeScript, TailwindCSS, and modern AI integration.

## 🚀 Features

### Web Interface
- 🎨 **Slack-like Chat Interface**: Clean, modern chat interface with sidebar navigation
- 🤖 **AI-Powered**: Uses Hugging Face Inference API to convert natural language to SQL
- 📊 **Database Integration**: Direct Postgres integration with Prisma ORM
- 📱 **Responsive Design**: Works perfectly on desktop, tablet, and mobile
- 🔒 **Security**: SQL injection protection and query validation

### Slack Bot
- 💬 **Slack Integration**: Native Slack bot using Bolt.js
- 🧵 **Thread Responses**: Responds only in threads to keep channels clean
- 📝 **Query Logging**: Comprehensive logging of all queries and results
- ⚡ **Real-time Processing**: Instant message processing with loading states
- 🎯 **Channel Targeting**: Configurable channel for bot interactions

### Admin Dashboard
- ⚙️ **Configuration Panel**: Easy setup of Slack and database credentials
- 📊 **Query Logs**: Monitor all queries with filtering and statistics
- 📈 **Analytics**: Track query success rates and performance
- 🎨 **Futuristic UI**: Black and white theme with smooth animations

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, TypeScript, TailwindCSS
- **UI Components**: Shadcn, Lucide React icons
- **AI**: Hugging Face Inference API
- **Database**: PostgreSQL with Prisma ORM
- **Slack**: Bolt.js for Slack bot integration
- **Styling**: TailwindCSS v4

## 🚀 Quick Start

### 1. Clone and Install

```bash
git clone <your-repo>
cd slacky
npm install
```

### 2. Environment Setup

Create a `.env.local` file:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/slacky"

# Hugging Face API
HUGGINGFACE_API_KEY="your_huggingface_api_key_here"

# Slack Bot (for Slack integration)
SLACK_BOT_TOKEN="xoxb-your-bot-token"
SLACK_SIGNING_SECRET="your-signing-secret"
SLACK_CHANNEL_ID="C1234567890"  # Channel where bot listens
```

### 3. Database Setup

```bash
# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push

# Seed with sample data (optional)
npm run db:seed
```

### 4. Slack Bot Setup

1. **Create a Slack App**:
   - Go to [https://api.slack.com/apps](https://api.slack.com/apps)
   - Click "Create New App" → "From scratch"
   - Name your app (e.g., "Slacky Bot")

2. **Configure Bot Permissions**:
   - Go to "OAuth & Permissions"
   - Add bot token scopes:
     - `channels:history`
     - `chat:write`
     - `app_mentions:read`
     - `channels:read`

3. **Set up Event Subscriptions**:
   - Go to "Event Subscriptions"
   - Enable events
   - Set request URL: `https://your-domain.com/api/slack/events`
   - Subscribe to events:
     - `message.channels`

4. **Install App**:
   - Go to "Install App"
   - Install to your workspace
   - Copy the Bot User OAuth Token

### 5. Start the Application

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to access the dashboard.

## 📱 Usage

### Web Interface

Navigate to `/dashboard` to access:
- **Chat Interface**: Test queries directly in the browser
- **Admin Panel**: Configure credentials and monitor status
- **Query Logs**: View all query history and results

### Slack Bot

1. **Add the bot to your channel** (e.g., `#ask-data`)
2. **Ask questions in natural language**:
   - "How many users signed up last week?"
   - "Show me the top 5 paying users"
   - "What's the average session duration?"

3. **Bot responds in threads** with:
   - Generated SQL query
   - Query results
   - Execution time

## 🔧 API Endpoints

### `/api/slack/events`
Handles Slack message events and processes natural language queries.

### `/api/query`
Standalone API for processing queries:
```bash
curl -X POST http://localhost:3000/api/query \
  -H "Content-Type: application/json" \
  -d '{"query": "How many users signed up last week?"}'
```

### `/api/generate-sql`
Converts natural language to SQL using Hugging Face API.

### `/api/execute-sql`
Executes SQL queries against the database.

### `/api/logs`
Retrieves query logs with filtering and pagination.

## 🗄️ Database Schema

```sql
-- Users table
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  signup_source TEXT
);

-- Payments table
CREATE TABLE payments (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  amount DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  status TEXT NOT NULL
);

-- Sessions table
CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  duration_minutes INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  referrer TEXT
);

-- Referrals table
CREATE TABLE referrals (
  id TEXT PRIMARY KEY,
  referrer_id TEXT REFERENCES users(id),
  referred_id TEXT REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  status TEXT NOT NULL
);

-- Query logs table
CREATE TABLE query_logs (
  id TEXT PRIMARY KEY,
  timestamp TIMESTAMP DEFAULT NOW(),
  user TEXT NOT NULL,
  channel TEXT NOT NULL,
  original_query TEXT NOT NULL,
  generated_sql TEXT NOT NULL,
  result JSONB,
  error TEXT,
  execution_time INTEGER NOT NULL
);
```

## 🔒 Security Features

- **SQL Injection Protection**: Only SELECT queries allowed
- **Query Validation**: All queries validated before execution
- **Error Handling**: Comprehensive error handling and logging
- **Rate Limiting**: Built-in protection against abuse
- **Secure Storage**: Credentials stored securely

## 📊 Monitoring & Analytics

### Query Statistics
- Total queries processed
- Success/error rates
- Average execution time
- Most common query types

### Bot Status
- Connection status
- Channel activity
- Error tracking
- Performance metrics

## 🚀 Deployment

### Vercel (Recommended)

1. **Push to GitHub**:
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Deploy to Vercel**:
   - Connect your GitHub repository
   - Add environment variables
   - Deploy!

3. **Update Slack Webhook URL**:
   - Update your Slack app's request URL to your Vercel domain
   - Example: `https://your-app.vercel.app/api/slack/events`

### Environment Variables for Production

```env
DATABASE_URL="postgresql://user:pass@host:5432/db"
HUGGINGFACE_API_KEY="hf_your_api_key"
SLACK_BOT_TOKEN="xoxb-your-bot-token"
SLACK_SIGNING_SECRET="your-signing-secret"
SLACK_CHANNEL_ID="C1234567890"
```

## 🛠️ Development

### Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── slack/events/route.ts    # Slack bot events
│   │   ├── query/route.ts           # Standalone query API
│   │   ├── generate-sql/route.ts    # Hugging Face integration
│   │   ├── execute-sql/route.ts     # Database execution
│   │   └── logs/route.ts            # Query logs API
│   ├── dashboard/page.tsx           # Main dashboard
│   ├── globals.css                  # Global styles
│   └── page.tsx                     # Home redirect
├── components/
│   ├── Chat.tsx                     # Web chat interface
│   ├── AdminPanel.tsx               # Configuration panel
│   ├── QueryLog.tsx                 # Logs viewer
│   ├── ChatWindow.tsx               # Message display
│   ├── Message.tsx                  # Individual message
│   ├── MessageInput.tsx             # Input component
│   └── Sidebar.tsx                  # Navigation
├── lib/
│   └── utils.ts                     # Utility functions
└── types/
    ├── chat.ts                      # Chat types
    └── slack.ts                     # Slack bot types
```

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run db:seed` - Seed database with sample data

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.

## 🆘 Troubleshooting

### Common Issues

1. **Slack Bot Not Responding**:
   - Check bot token and signing secret
   - Verify channel ID is correct
   - Ensure bot is added to the channel

2. **Database Connection Issues**:
   - Verify DATABASE_URL format
   - Check PostgreSQL is running
   - Run `npx prisma db push`

3. **Hugging Face API Errors**:
   - Verify API key is valid
   - Check API rate limits
   - Try different model if needed

### Support

For issues and questions:
- Check the logs in `/dashboard` → Query Logs
- Verify environment variables
- Test connections in Admin Panel
