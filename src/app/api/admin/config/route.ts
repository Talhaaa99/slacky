import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  // Return environment variables for display (masked for security)
  return NextResponse.json({
    databaseUrl: process.env.DATABASE_URL ? '***configured***' : '',
    huggingfaceApiKey: process.env.HUGGINGFACE_API_KEY ? '***configured***' : '',
    slackBotToken: process.env.SLACK_BOT_TOKEN ? '***configured***' : '',
    slackSigningSecret: process.env.SLACK_SIGNING_SECRET ? '***configured***' : '',
  });
}

export async function POST(request: NextRequest) {
  try {
    const config = await request.json();
    
    // In production, you would save these to a secure configuration service
    // For now, we'll just validate the format
    
    if (config.databaseUrl && !config.databaseUrl.startsWith('postgresql://')) {
      return NextResponse.json(
        { error: 'Invalid database URL format' },
        { status: 400 }
      );
    }
    
    if (config.huggingfaceApiKey && !config.huggingfaceApiKey.startsWith('hf_')) {
      return NextResponse.json(
        { error: 'Invalid Hugging Face API key format' },
        { status: 400 }
      );
    }
    
    if (config.slackBotToken && !config.slackBotToken.startsWith('xoxb-')) {
      return NextResponse.json(
        { error: 'Invalid Slack bot token format' },
        { status: 400 }
      );
    }
    
    // In a real application, you would:
    // 1. Encrypt sensitive values
    // 2. Store in a secure database or service
    // 3. Update environment variables securely
    // 4. Restart the application if needed
    
    return NextResponse.json({ 
      success: true, 
      message: 'Configuration validated successfully. In production, this would be saved securely.' 
    });
    
  } catch (error) {
    console.error('Error saving config:', error);
    return NextResponse.json(
      { error: 'Failed to save configuration' },
      { status: 500 }
    );
  }
} 