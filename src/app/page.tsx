"use client";

import { useState, useEffect } from "react";
import { CommunityCard } from "@/components/community-card";
import { SearchFilters } from "@/components/search-filters";
import { AgenticSearchBox } from "@/components/agentic-search-box";
import { ScrapeCommunity } from "@/components/scrape-community";
import { Button } from "@/components/ui/button";
import { Plus, Users, Sparkles, Globe, Brain, Search } from "lucide-react";
import Link from "next/link";
import { getCommunities, getCategories, getAllTags } from "@/lib/actions";

export default function HomePage() {
  const [communities, setCommunities] = useState<
    Array<Record<string, unknown>>
  >([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [searchMode, setSearchMode] = useState<"traditional" | "agentic">(
    "traditional"
  );
  const [showScrapeForm, setShowScrapeForm] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [communitiesData, categoriesData, tagsData] = await Promise.all([
          getCommunities(),
          getCategories(),
          getAllTags(),
        ]);

        setCommunities(communitiesData);
        setCategories(categoriesData);
        setAllTags(tagsData);
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    if (searchMode === "traditional") {
      const fetchCommunities = async () => {
        setLoading(true);
        try {
          const data = await getCommunities(
            searchTerm,
            selectedCategory,
            selectedTags
          );
          setCommunities(data);
        } catch (error) {
          console.error("Error fetching communities:", error);
        } finally {
          setLoading(false);
        }
      };

      fetchCommunities();
    }
  }, [searchTerm, selectedCategory, selectedTags, searchMode]);

  const handleAgenticResults = (results: Array<Record<string, unknown>>) => {
    setCommunities(results);
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Slacky AI</h1>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                onClick={() => setShowScrapeForm(!showScrapeForm)}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Globe className="w-4 h-4" />
                Scrape
              </Button>
              <Link href="/add">
                <Button className="bg-green-600 hover:bg-green-700 text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Community
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Discover Amazing Slack Communities with AI
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Use natural language to find the perfect Slack communities. Ask
            questions like &ldquo;Show me AI agent-focused communities&rdquo; or
            &ldquo;Find groups discussing LLMs&rdquo;.
          </p>
        </div>

        {/* Search Mode Toggle */}
        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-lg p-1 shadow-sm border">
            <div className="flex">
              <button
                onClick={() => setSearchMode("traditional")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  searchMode === "traditional"
                    ? "bg-gray-100 text-gray-900"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <Search className="w-4 h-4 inline mr-2" />
                Traditional Search
              </button>
              <button
                onClick={() => setSearchMode("agentic")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  searchMode === "agentic"
                    ? "bg-gradient-to-r from-purple-100 to-blue-100 text-purple-900"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <Sparkles className="w-4 h-4 inline mr-2" />
                AI Agentic Search
              </button>
            </div>
          </div>
        </div>

        {/* Web Scraping Form */}
        {showScrapeForm && (
          <div className="mb-8">
            <ScrapeCommunity onSuccess={handleRefresh} />
          </div>
        )}

        {/* Search and Filters */}
        <div className="mb-8">
          {searchMode === "traditional" ? (
            <SearchFilters
              onSearch={setSearchTerm}
              onCategoryChange={setSelectedCategory}
              onTagsChange={setSelectedTags}
              categories={categories}
              allTags={allTags}
              selectedCategory={selectedCategory}
              selectedTags={selectedTags}
            />
          ) : (
            <AgenticSearchBox
              onResults={handleAgenticResults}
              onLoading={setLoading}
            />
          )}
        </div>

        {/* Results */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              {loading
                ? "Searching..."
                : `${communities.length} communities found`}
            </h3>
            {communities.length > 0 && (
              <div className="text-sm text-gray-500">
                Showing {communities.length} of {communities.length} communities
              </div>
            )}
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="bg-white rounded-lg shadow-sm border animate-pulse"
                >
                  <div className="p-6">
                    <div className="h-6 bg-gray-200 rounded mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : communities.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {communities.map((community) => (
                <Link key={community.id} href={`/community/${community.id}`}>
                  <CommunityCard {...community} />
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No communities found
              </h3>
              <p className="text-gray-500 mb-6">
                {searchMode === "agentic"
                  ? "Try a different query or use traditional search."
                  : "Try adjusting your search or filters to find what you're looking for."}
              </p>
              <div className="flex justify-center gap-3">
                <Link href="/add">
                  <Button className="bg-green-600 hover:bg-green-700 text-white">
                    <Plus className="w-4 h-4 mr-2" />
                    Add the first community
                  </Button>
                </Link>
                {searchMode === "agentic" && (
                  <Button
                    onClick={() => setSearchMode("traditional")}
                    variant="outline"
                  >
                    <Search className="w-4 h-4 mr-2" />
                    Use Traditional Search
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
