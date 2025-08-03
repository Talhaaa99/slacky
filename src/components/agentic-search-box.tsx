"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Sparkles, Loader2 } from "lucide-react";
import { agenticSearchCommunities } from "@/lib/actions";

interface AgenticSearchBoxProps {
  onResults: (results: any) => void;
  onLoading: (loading: boolean) => void;
}

export function AgenticSearchBox({
  onResults,
  onLoading,
}: AgenticSearchBoxProps) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [interpretedQuery, setInterpretedQuery] = useState("");
  const [suggestedFilters, setSuggestedFilters] = useState<string[]>([]);

  const handleSearch = async () => {
    if (!query.trim()) return;

    setLoading(true);
    onLoading(true);

    try {
      const result = await agenticSearchCommunities(query);

      setInterpretedQuery(result.interpretation);
      setSuggestedFilters(result.suggestedFilters);

      // Transform results for display
      const transformedResults = result.results.map((item) => ({
        ...item,
        tags: item.tags || [],
      }));

      onResults(transformedResults);
    } catch (error) {
      console.error("Agentic search error:", error);
      onResults([]);
    } finally {
      setLoading(false);
      onLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !loading) {
      handleSearch();
    }
  };

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          placeholder="Ask about Slack communities... (e.g., 'Show me AI agent-focused communities')"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyPress={handleKeyPress}
          className="pl-10 pr-20"
        />
        <Button
          onClick={handleSearch}
          disabled={loading || !query.trim()}
          className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
          size="sm"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4" />
          )}
        </Button>
      </div>

      {/* Interpreted Query Display */}
      {interpretedQuery && (
        <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-purple-800 flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              AI Interpretation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-purple-700">"{interpretedQuery}"</p>
          </CardContent>
        </Card>
      )}

      {/* Suggested Filters */}
      {suggestedFilters.length > 0 && (
        <Card className="bg-gradient-to-r from-blue-50 to-green-50 border-blue-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-800">
              Suggested Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-1">
              {suggestedFilters.slice(0, 10).map((filter, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                >
                  {filter}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Example Queries */}
      <div className="text-xs text-gray-500 space-y-1">
        <p className="font-medium">Try these queries:</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
          <button
            onClick={() =>
              setQuery("Show me AI agent-focused Slack communities")
            }
            className="text-left hover:text-blue-600 transition-colors"
          >
            • "Show me AI agent-focused communities"
          </button>
          <button
            onClick={() =>
              setQuery("Find Slack groups where people talk about LLMs")
            }
            className="text-left hover:text-blue-600 transition-colors"
          >
            • "Find groups discussing LLMs"
          </button>
          <button
            onClick={() =>
              setQuery(
                "What's the best community to learn Retrieval-Augmented Generation?"
              )
            }
            className="text-left hover:text-blue-600 transition-colors"
          >
            • "Best RAG learning communities"
          </button>
          <button
            onClick={() => setQuery("Slack communities for startup founders")}
            className="text-left hover:text-blue-600 transition-colors"
          >
            • "Startup founder communities"
          </button>
        </div>
      </div>
    </div>
  );
}
