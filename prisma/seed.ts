import { PrismaClient } from "@prisma/client";
import { generateEmbedding, stringifyEmbedding } from "../src/lib/free-ai";

const prisma = new PrismaClient();

async function main() {
  const sampleCommunities = [
    {
      name: "AI Agents & Automation",
      description:
        "A community for developers and researchers working on AI agents, automation, and intelligent systems. Share knowledge about LLMs, RAG, and agent architectures.",
      tags: "ai,agents,automation,llm,rag,research",
      category: "Technology",
      inviteUrl: "https://slack.com/invite/ai-agents",
      website: "https://aiagents.com",
      logoUrl: "https://via.placeholder.com/150/6366F1/FFFFFF?text=AI",
    },
    {
      name: "LangChain Developers",
      description:
        "Connect with developers building applications using LangChain. Share code, discuss best practices, and get help with your LangChain projects.",
      tags: "langchain,python,llm,development,ai",
      category: "Technology",
      inviteUrl: "https://slack.com/invite/langchain-dev",
      website: "https://langchain.com",
      logoUrl: "https://via.placeholder.com/150/10B981/FFFFFF?text=LC",
    },
    {
      name: "Retrieval-Augmented Generation",
      description:
        "Deep dive into RAG systems, vector databases, and semantic search. Learn about embeddings, chunking strategies, and evaluation methods.",
      tags: "rag,embeddings,vector-search,semantic-search,ai",
      category: "Technology",
      inviteUrl: "https://slack.com/invite/rag-community",
      website: "https://ragcommunity.org",
    },
    {
      name: "Startup Founders Network",
      description:
        "A community for startup founders to network, share experiences, and get advice from fellow entrepreneurs. Discuss fundraising, growth, and challenges.",
      tags: "startup,entrepreneurship,business,networking,funding",
      category: "Business",
      inviteUrl: "https://slack.com/invite/startup-founders",
      website: "https://startupfounders.com",
    },
    {
      name: "Product Management",
      description:
        "For product managers to discuss strategy, tools, methodologies, and career development. Share insights on user research, roadmapping, and team collaboration.",
      tags: "product-management,strategy,user-research,roadmap,leadership",
      category: "Business",
      inviteUrl: "https://slack.com/invite/product-management",
      website: "https://productmanagement.com",
    },
    {
      name: "Machine Learning Engineers",
      description:
        "Connect with ML engineers working on production systems. Discuss MLOps, model deployment, monitoring, and scaling ML infrastructure.",
      tags: "mlops,machine-learning,engineering,deployment,monitoring",
      category: "Technology",
      inviteUrl: "https://slack.com/invite/ml-engineers",
      website: "https://mlengineers.org",
    },
    {
      name: "Design Systems",
      description:
        "Connect with designers and developers building scalable design systems. Share tools, techniques, and best practices for component libraries.",
      tags: "design,design-systems,ui,ux,components",
      category: "Design",
      inviteUrl: "https://slack.com/invite/design-systems",
      website: "https://designsystems.com",
      logoUrl: "https://via.placeholder.com/150/6366F1/FFFFFF?text=DS",
    },
    {
      name: "Web3 & Blockchain",
      description:
        "Explore the future of the web with blockchain technology, DeFi, NFTs, and decentralized applications. Connect with builders and enthusiasts.",
      tags: "web3,blockchain,crypto,defi,nft",
      category: "Technology",
      inviteUrl: "https://slack.com/invite/web3-blockchain",
      website: "https://web3community.org",
    },
    {
      name: "Remote Work Community",
      description:
        "Connect with remote workers worldwide. Share tips, tools, and experiences for successful remote work and work-life balance.",
      tags: "remote-work,productivity,work-life-balance,distributed-teams",
      category: "Business",
      inviteUrl: "https://slack.com/invite/remote-work",
      website: "https://remotework.com",
    },
    {
      name: "Digital Marketing",
      description:
        "Learn and share digital marketing strategies, tools, and trends. From SEO to social media marketing, growth hacking to content strategy.",
      tags: "marketing,seo,social-media,digital,growth-hacking",
      category: "Marketing",
      inviteUrl: "https://slack.com/invite/digital-marketing",
      website: "https://digitalmarketing.com",
    },
  ];

  console.log("Seeding database...");

  for (const community of sampleCommunities) {
    try {
      // Generate embedding for the community
      const embeddingText = `${community.name} ${community.description} ${community.tags}`;
      const embedding = await generateEmbedding(embeddingText);

      await prisma.slackCommunity.create({
        data: {
          ...community,
          embedding: stringifyEmbedding(embedding.embedding),
        },
      });

      console.log(`Added: ${community.name}`);
    } catch (error) {
      console.error(`Error adding ${community.name}:`, error);
    }
  }

  console.log("Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
