"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Globe, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { scrapeAndAddCommunity } from "@/lib/actions";

interface ScrapeCommunityProps {
  onSuccess: () => void;
}

export function ScrapeCommunity({ onSuccess }: ScrapeCommunityProps) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    data?: any;
  } | null>(null);

  const handleScrape = async () => {
    if (!url.trim()) return;

    setLoading(true);
    setResult(null);

    try {
      const response = await scrapeAndAddCommunity(url);

      if (response.success) {
        setResult({
          success: true,
          message: "Community scraped and added successfully!",
          data: response.data,
        });
        setUrl("");
        onSuccess();
      } else {
        setResult({
          success: false,
          message: response.error || "Failed to scrape community",
        });
      }
    } catch (error) {
      setResult({
        success: false,
        message: "An error occurred while scraping the community",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !loading) {
      handleScrape();
    }
  };

  return (
    <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Globe className="w-5 h-5" />
          Scrape Community from URL
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            Community URL
          </label>
          <div className="relative">
            <Input
              placeholder="https://example.com/community"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyPress={handleKeyPress}
              className="pr-20"
            />
            <Button
              onClick={handleScrape}
              disabled={loading || !url.trim()}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-green-600 hover:bg-green-700 text-white"
              size="sm"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Globe className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Result Display */}
        {result && (
          <div
            className={`p-3 rounded-md ${
              result.success
                ? "bg-green-50 border border-green-200"
                : "bg-red-50 border border-red-200"
            }`}
          >
            <div className="flex items-center gap-2">
              {result.success ? (
                <CheckCircle className="w-4 h-4 text-green-600" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-600" />
              )}
              <p
                className={`text-sm ${
                  result.success ? "text-green-700" : "text-red-700"
                }`}
              >
                {result.message}
              </p>
            </div>

            {result.success && result.data && (
              <div className="mt-2 p-2 bg-white rounded border">
                <p className="text-xs font-medium text-gray-700">
                  Scraped Data:
                </p>
                <p className="text-xs text-gray-600">{result.data.name}</p>
                <p className="text-xs text-gray-500 line-clamp-2">
                  {result.data.description}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Instructions */}
        <div className="text-xs text-gray-500 space-y-1">
          <p className="font-medium">How it works:</p>
          <ul className="space-y-1">
            <li>• Enter a community landing page URL</li>
            <li>• AI will extract community information</li>
            <li>• Automatically generates embeddings for search</li>
            <li>• Adds to the database for discovery</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
