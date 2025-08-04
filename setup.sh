#!/bin/bash

echo "🚀 Setting up Slacky - Postgres Assistant Chat"
echo "================================================"

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "📝 Creating .env.local file..."
    cat > .env.local << EOF
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/slacky"

# Hugging Face API
HUGGINGFACE_API_KEY="your_huggingface_api_key_here"
EOF
    echo "✅ Created .env.local file"
    echo "⚠️  Please update the DATABASE_URL and HUGGINGFACE_API_KEY in .env.local"
else
    echo "✅ .env.local already exists"
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Update .env.local with your database URL and Hugging Face API key"
echo "2. Create your PostgreSQL database: CREATE DATABASE slacky;"
echo "3. Run: npx prisma db push"
echo "4. (Optional) Seed with sample data: npm run db:seed"
echo "5. Start the development server: npm run dev"
echo ""
echo "For more information, see README.md" 