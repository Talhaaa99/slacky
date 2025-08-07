#!/bin/bash

echo "🚀 Setting up dummy database for testing..."

# Check if PostgreSQL is running
if ! pg_isready -q; then
    echo "❌ PostgreSQL is not running. Please start PostgreSQL first."
    exit 1
fi

# Create database and run setup script
echo "📦 Creating database and tables..."
psql -U postgres -f dummy-database-setup.sql

echo "✅ Dummy database setup complete!"
echo ""
echo "📊 Database Details:"
echo "   Database: dummy_ecommerce"
echo "   Host: localhost"
echo "   Port: 5432"
echo "   Username: postgres"
echo "   Password: (your PostgreSQL password)"
echo ""
echo "📈 Data Summary:"
echo "   • 1,000 users"
echo "   • 500 products"
echo "   • 2,000 orders"
echo "   • 5,000 order items"
echo "   • 1,000 reviews"
echo "   • 8 categories"
echo ""
echo "🔍 Sample Queries to Test:"
echo "   • 'Show me all users from New York'"
echo "   • 'What's the total revenue by category?'"
echo "   • 'Get the top 10 products by sales'"
echo "   • 'Show orders from last month'"
echo "   • 'Find products with 5-star ratings'"
echo ""
echo "🎯 Connection Details for the App:"
echo "   Name: Dummy E-commerce DB"
echo "   Type: PostgreSQL"
echo "   Host: localhost"
echo "   Port: 5432"
echo "   Database: dummy_ecommerce"
echo "   Username: postgres"
echo "   Password: (your PostgreSQL password)" 