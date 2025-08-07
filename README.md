# Database Assistant

A modern, conversational database assistant that allows you to query your databases using natural language. Built with Next.js 15, TypeScript, and powered by Hugging Face AI.

## Features

### 🔒 **Secure Database Management**

- Connect multiple PostgreSQL and MongoDB databases
- Encrypted credential storage
- Sidebar with all connected databases
- Add, edit, and remove connections

### 🗃️ **Multi-Database Support**

- **PostgreSQL**: Full schema introspection with table and column information
- **MongoDB**: Collection and field discovery
- Automatic schema detection and mapping

### 📊 **Interactive Schema Visualizer**

- **React Flow** powered flowchart view
- Draggable table/collection cards
- Expandable column/field details
- Zoom and pan functionality
- Dark mode support

### 💬 **AI-Powered Chat Interface**

- Natural language to SQL/MongoDB query conversion
- **Hugging Face Inference API** integration
- Real-time query execution
- Chat history persistence
- Error handling and feedback

### 🧠 **Intelligent Features**

- Semantic table mapping
- Context-aware query generation
- Schema-aware AI prompts
- Safe query execution

## Tech Stack

- **Frontend**: Next.js 15, React 18, TypeScript
- **Styling**: TailwindCSS, shadcn/ui components
- **State Management**: Zustand
- **AI**: Hugging Face Inference API
- **Databases**: PostgreSQL, MongoDB
- **Visualization**: React Flow (@xyflow/react)
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL or MongoDB instance
- Hugging Face API key

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd database-assistant
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env.local
   ```

   Add your Hugging Face API key:

   ```
   HUGGINGFACE_API_KEY=your_api_key_here
   ```

4. **Run the development server**

   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Usage

### 1. **Add Database Connection**

- Go to the "Connections" tab
- Click "Add Database Connection"
- Fill in your database credentials
- Test the connection

### 2. **View Schema**

- Select a database from the sidebar
- Go to the "Schema" tab
- Explore your database structure visually

### 3. **Start Chatting**

- Select a database from the sidebar
- Go to the "Chat" tab
- Ask questions like:
  - "Show me all users from last month"
  - "What's the total revenue by country?"
  - "Get the top 10 customers by order value"

## API Routes

### `/api/generate-query`

Generates database queries from natural language using AI.

**Request:**

```json
{
  "message": "Show me all users from last month",
  "schema": {
    /* database schema */
  },
  "mapping": {
    /* table mappings */
  },
  "databaseType": "postgresql"
}
```

**Response:**

```json
{
  "success": true,
  "query": "SELECT * FROM users WHERE created_at >= '2024-01-01' LIMIT 100"
}
```

### `/api/execute-query`

Executes generated queries on the connected database.

**Request:**

```json
{
  "connection": {
    /* database connection */
  },
  "query": "SELECT * FROM users LIMIT 10"
}
```

**Response:**

```json
{
  "success": true,
  "result": [
    /* query results */
  ]
}
```

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Main page
├── components/            # React components
│   ├── Chat.tsx          # Chat interface
│   ├── DatabaseConnections.tsx
│   ├── SchemaVisualizer.tsx
│   └── Sidebar.tsx
├── lib/                  # Utilities
│   ├── database.ts       # Database operations
│   └── utils.ts          # Helper functions
├── store/                # State management
│   └── useStore.ts       # Zustand store
└── types/                # TypeScript types
    └── index.ts
```

## Environment Variables

| Variable              | Description                           | Required |
| --------------------- | ------------------------------------- | -------- |
| `HUGGINGFACE_API_KEY` | Hugging Face API key for AI inference | Yes      |

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For support, please open an issue on GitHub or contact the development team.
