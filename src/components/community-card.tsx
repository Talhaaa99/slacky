"use client";

import { useRef, useEffect } from "react";
import { gsap } from "gsap";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, Users } from "lucide-react";
import { cn } from "@/lib/utils";

interface CommunityCardProps {
  id: string;
  name: string;
  description: string;
  tags: string[];
  category: string;
  inviteUrl: string;
  website?: string;
  logoUrl?: string;
  createdAt: Date;
}

export function CommunityCard({
  id,
  name,
  description,
  tags,
  category,
  inviteUrl,
  website,
  logoUrl,
  createdAt,
}: CommunityCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!cardRef.current) return;

    const card = cardRef.current;

    const handleMouseEnter = () => {
      gsap.to(card, {
        y: -8,
        scale: 1.02,
        duration: 0.3,
        ease: "power2.out",
      });
    };

    const handleMouseLeave = () => {
      gsap.to(card, {
        y: 0,
        scale: 1,
        duration: 0.3,
        ease: "power2.out",
      });
    };

    card.addEventListener("mouseenter", handleMouseEnter);
    card.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      card.removeEventListener("mouseenter", handleMouseEnter);
      card.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  return (
    <Card
      ref={cardRef}
      className="group cursor-pointer transition-all duration-300 hover:shadow-lg"
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-xl font-bold text-gray-900 group-hover:text-black transition-colors">
              {name}
            </CardTitle>
            <div className="flex items-center gap-2 mt-1">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {category}
              </span>
              <span className="text-xs text-gray-500">
                {new Date(createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
          {logoUrl && (
            <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
              <img
                src={logoUrl}
                alt={name}
                className="w-full h-full object-cover"
              />
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent>
        <p className="text-gray-600 text-sm line-clamp-3 mb-4">{description}</p>

        <div className="flex flex-wrap gap-1 mb-4">
          {tags.slice(0, 3).map((tag, index) => (
            <span
              key={index}
              className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
            >
              {tag}
            </span>
          ))}
          {tags.length > 3 && (
            <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700">
              +{tags.length - 3} more
            </span>
          )}
        </div>
      </CardContent>

      <CardFooter className="flex justify-between items-center pt-0">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Users className="w-4 h-4" />
          <span>Slack Community</span>
        </div>

        <div className="flex gap-2">
          {website && (
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                window.open(website, "_blank");
              }}
              className="flex items-center gap-1"
            >
              <ExternalLink className="w-3 h-3" />
              Website
            </Button>
          )}
          <Button
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              window.open(inviteUrl, "_blank");
            }}
            className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-1"
          >
            <Users className="w-3 h-3" />
            Join
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
