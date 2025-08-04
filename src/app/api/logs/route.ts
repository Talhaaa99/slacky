import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    const logs = await prisma.queryLog.findMany({
      take: limit,
      skip: offset,
      orderBy: {
        timestamp: "desc",
      },
    });

    // Get summary statistics
    const totalLogs = await prisma.queryLog.count();
    const errorLogs = await prisma.queryLog.count({
      where: {
        error: {
          not: null,
        },
      },
    });

    return NextResponse.json({
      logs: logs.map((log) => ({
        ...log,
        timestamp: log.timestamp.toISOString(),
      })),
      summary: {
        total: totalLogs,
        errors: errorLogs,
        success: totalLogs - errorLogs,
        errorRate:
          totalLogs > 0 ? Math.round((errorLogs / totalLogs) * 100) : 0,
      },
    });
  } catch (error) {
    console.error("Error fetching logs:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch logs",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
