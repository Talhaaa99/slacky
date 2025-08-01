# Slacky AI - Agentic Slack Community Directory

A modern, AI-powered Slack community directory that enables natural language search and discovery of Slack communities. Built with Next.js 15, TypeScript, and advanced search capabilities.

## 🚀 Features

### Core Functionality

- **Agentic Search**: Use natural language to find communities (e.g., "Show me AI agent-focused communities")
- **Traditional Search**: Standard filtering by category, tags, and text search
- **Web Scraping**: Automatically extract community information from landing pages
- **Community Management**: Add, view, and manage Slack communities
- **Responsive Design**: Mobile-first design with beautiful animations

### AI-Powered Features

- **Natural Language Queries**: Ask questions like "Find groups discussing LLMs" or "Best RAG learning communities"
- **Semantic Search**: Advanced search using embeddings (when OpenAI is available)
- **Query Interpretation**: AI interprets user intent and suggests relevant filters
- **Smart Recommendations**: Automatic tag and category suggestions

### Technical Stack

- **Frontend**: Next.js 15 (App Router), TypeScript, Tailwind CSS
- **Backend**: Server Actions, API Routes
- **Database**: SQLite with Prisma ORM (ready for Supabase migration)
- **AI**: OpenAI embeddings and GPT-3.5-turbo for query interpretation
- **Animations**: GSAP for smooth hover effects and transitions
- **Web Scraping**: Cheerio for extracting community data

## 🏗️ Project Structure

```
slacky/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── page.tsx           # Home page with search
│   │   ├── add/page.tsx       # Add community form
│   │   ├── community/[id]/    # Community detail page
│   │   ├── layout.tsx         # Root layout
│   │   └── globals.css        # Global styles
│   ├── components/            # React components
│   │   ├── ui/               # Reusable UI components
│   │   ├── community-card.tsx # Community card with GSAP animations
│   │   ├── search-filters.tsx # Traditional search filters
│   │   ├── agentic-search-box.tsx # AI-powered search
│   │   └── scrape-community.tsx # Web scraping component
│   └── lib/                  # Utility functions
│       ├── actions.ts         # Server actions
│       ├── db.ts             # Database client
│       ├── embeddings.ts     # OpenAI embedding functions
│       ├── agentic-search.ts # AI search logic
│       ├── scraper.ts        # Web scraping utilities
│       └── utils.ts          # Helper functions
├── prisma/
│   ├── schema.prisma         # Database schema
│   └── seed.ts              # Database seeding
└── public/                  # Static assets
```

## 🗄️ Database Schema

```prisma
model SlackCommunity {
  id          String   @id @default(uuid())
  name        String
  description String
  tags        String   // Comma-separated tags
  category    String
  inviteUrl   String
  website     String?
  logoUrl     String?
  sourcePage  String?  // Original page crawled
  embedding   String?  // JSON string of embedding vector
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- OpenAI API key (optional for full AI features)

### Installation

1. **Clone the repository:**

```bash
git clone <repository-url>
cd slacky
```

2. **Install dependencies:**

```bash
npm install
```

3. **Set up environment variables:**

```bash
# Required
DATABASE_URL="file:./dev.db"

# Optional (for AI features)
OPENAI_API_KEY="your-openai-api-key-here"
```

4. **Set up the database:**

```bash
npx prisma db push
```

5. **Seed the database:**

```bash
npm run seed
```

6. **Start the development server:**

```bash
npm run dev
```

7. **Open [http://localhost:3000](http://localhost:3000) in your browser**

## 🔍 Usage

### Traditional Search

- Use the search bar to find communities by name or description
- Filter by categories (Technology, Business, Design, etc.)
- Filter by tags (ai, startup, design, etc.)
- Combine multiple filters for precise results

### Agentic Search

- Switch to "AI Agentic Search" mode
- Ask natural language questions like:
  - "Show me AI agent-focused communities"
  - "Find Slack groups where people talk about LLMs"
  - "What's the best community to learn Retrieval-Augmented Generation?"
  - "Slack communities for startup founders"

### Adding Communities

1. **Manual Entry**: Use the "Add Community" form
2. **Web Scraping**: Click "Scrape" and enter a community landing page URL
3. **Auto-Extraction**: The scraper will extract name, description, tags, and invite links

## 🤖 AI Features

### Natural Language Processing

The application uses OpenAI's GPT-3.5-turbo to:

- Interpret user queries and convert them to searchable terms
- Generate suggested filters based on query content
- Provide reasoning for search results

### Semantic Search

When OpenAI is available, the app:

- Generates embeddings for community content
- Performs cosine similarity searches
- Ranks results by semantic relevance

### Query Examples

```
✅ "Show me AI agent-focused Slack communities"
✅ "Find Slack groups where people talk about LLMs"
✅ "What's the best community to learn Retrieval-Augmented Generation?"
✅ "Slack communities for startup founders"
✅ "Groups discussing machine learning and data science"
```

## 🎨 Design Features

### UI/UX

- **Black & White Theme**: Clean, modern design
- **GSAP Animations**: Smooth hover effects and transitions
- **Responsive Design**: Mobile-first approach
- **Gradient Accents**: Purple-to-blue gradients for AI features
- **Loading States**: Skeleton loaders and progress indicators

### Components

- **Community Cards**: Hover animations with GSAP
- **Search Interface**: Toggle between traditional and AI search
- **Filter System**: Dynamic category and tag filtering
- **Web Scraping**: Real-time community extraction

## 🔧 Development

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run seed         # Seed database with sample data
```

### Environment Variables

```env
# Database
DATABASE_URL="file:./dev.db"

# OpenAI (optional)
OPENAI_API_KEY="your-api-key"

# Supabase (for future migration)
NEXT_PUBLIC_SUPABASE_URL="your-supabase-url"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-supabase-key"
```

### Database Operations

```bash
# Generate Prisma client
npx prisma generate

# Push schema changes
npx prisma db push

# Open Prisma Studio
npx prisma studio

# Reset database
npx prisma db push --force-reset
```

## 🚀 Deployment

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Other Platforms

- **Netlify**: Compatible with Next.js
- **Railway**: Easy database integration
- **Heroku**: Add buildpack for Node.js

### Production Database

For production, consider:

- **Supabase**: PostgreSQL with vector search
- **PlanetScale**: MySQL with branching
- **Neon**: Serverless Postgres

## 🔮 Future Enhancements

### Planned Features

- [ ] **Supabase Integration**: Vector search with pgvector
- [ ] **Real-time Updates**: WebSocket notifications
- [ ] **Community Analytics**: View counts and engagement
- [ ] **Advanced Scraping**: Puppeteer for dynamic content
- [ ] **API Endpoints**: RESTful API for external access
- [ ] **User Authentication**: Sign up and personalization
- [ ] **Community Reviews**: Rating and review system

### AI Enhancements

- [ ] **Conversational Interface**: Chat-like search experience
- [ ] **Smart Recommendations**: ML-based community suggestions
- [ ] **Content Analysis**: Automatic tag generation
- [ ] **Trend Detection**: Identify emerging communities

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by [Disboard](https://disboard.org)
- Built with Next.js 15 and modern web technologies
- Uses GSAP for smooth animations
- OpenAI for AI-powered features

## 📞 Support

For questions or support:

- Open an issue on GitHub
- Check the documentation
- Join our development community

---

**Slacky AI** - Discover amazing Slack communities with the power of AI! 🚀
