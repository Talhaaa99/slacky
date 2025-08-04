'use client';

import { useState, useEffect } from 'react';
import { AdminConfig, SlackBotStatus } from '@/types/slack';
import { cn } from '@/lib/utils';
import { Settings, Database, Bot, Activity, CheckCircle, XCircle } from 'lucide-react';

interface AdminPanelProps {
  onConfigUpdate?: (config: AdminConfig) => void;
}

export default function AdminPanel({ onConfigUpdate }: AdminPanelProps) {
  const [config, setConfig] = useState<AdminConfig>({
    slackBotToken: '',
    slackSigningSecret: '',
    databaseUrl: '',
    huggingfaceApiKey: '',
  });

  const [status, setStatus] = useState<SlackBotStatus>({
    isConnected: false,
    channels: [],
    lastActivity: new Date(),
    totalQueries: 0,
    errorRate: 0,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    // Load saved config from localStorage
    const savedConfig = localStorage.getItem('slacky-admin-config');
    if (savedConfig) {
      setConfig(JSON.parse(savedConfig));
    }
  }, []);

  const handleConfigChange = (key: keyof AdminConfig, value: string) => {
    const newConfig = { ...config, [key]: value };
    setConfig(newConfig);
    localStorage.setItem('slacky-admin-config', JSON.stringify(newConfig));
    onConfigUpdate?.(newConfig);
  };

  const testConnection = async () => {
    setIsLoading(true);
    setMessage('');

    try {
      // Test database connection
      const dbResponse = await fetch('/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: 'How many users are in the database?',
          userId: 'admin-test',
          channel: 'admin',
        }),
      });

      if (!dbResponse.ok) {
        throw new Error('Database connection failed');
      }

      // Test Hugging Face API
      const hfResponse = await fetch('/api/generate-sql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'test query' }),
      });

      if (!hfResponse.ok) {
        throw new Error('Hugging Face API connection failed');
      }

      setMessage('✅ All connections successful!');
      setStatus(prev => ({ ...prev, isConnected: true }));

    } catch (error) {
      setMessage(`❌ Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setStatus(prev => ({ ...prev, isConnected: false }));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center">
            <Settings className="w-8 h-8 mr-3" />
            Slacky Admin Panel
          </h1>
          <p className="text-gray-400">Configure your Slack bot and database connections</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Configuration Panel */}
          <div className="space-y-6">
            <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <Bot className="w-5 h-5 mr-2" />
                Slack Configuration
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Bot Token</label>
                  <input
                    type="password"
                    value={config.slackBotToken}
                    onChange={(e) => handleConfigChange('slackBotToken', e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="xoxb-your-bot-token"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Signing Secret</label>
                  <input
                    type="password"
                    value={config.slackSigningSecret}
                    onChange={(e) => handleConfigChange('slackSigningSecret', e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="your-signing-secret"
                  />
                </div>
              </div>
            </div>

            <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <Database className="w-5 h-5 mr-2" />
                Database Configuration
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Database URL</label>
                  <input
                    type="text"
                    value={config.databaseUrl}
                    onChange={(e) => handleConfigChange('databaseUrl', e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="postgresql://user:pass@localhost:5432/db"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Hugging Face API Key</label>
                  <input
                    type="password"
                    value={config.huggingfaceApiKey}
                    onChange={(e) => handleConfigChange('huggingfaceApiKey', e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="hf_your_api_key"
                  />
                </div>
              </div>
            </div>

            <button
              onClick={testConnection}
              disabled={isLoading}
              className={cn(
                "w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-medium py-3 px-4 rounded-md transition-colors flex items-center justify-center",
                isLoading && "cursor-not-allowed"
              )}
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Testing Connections...
                </>
              ) : (
                <>
                  <Activity className="w-4 h-4 mr-2" />
                  Test Connections
                </>
              )}
            </button>

            {message && (
              <div className={cn(
                "p-3 rounded-md flex items-center",
                message.includes('✅') ? "bg-green-900 text-green-200" : "bg-red-900 text-red-200"
              )}>
                {message.includes('✅') ? (
                  <CheckCircle className="w-4 h-4 mr-2" />
                ) : (
                  <XCircle className="w-4 h-4 mr-2" />
                )}
                {message}
              </div>
            )}
          </div>

          {/* Status Panel */}
          <div className="space-y-6">
            <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <Activity className="w-5 h-5 mr-2" />
                Bot Status
              </h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Connection Status</span>
                  <div className={cn(
                    "flex items-center",
                    status.isConnected ? "text-green-400" : "text-red-400"
                  )}>
                    {status.isConnected ? (
                      <CheckCircle className="w-4 h-4 mr-1" />
                    ) : (
                      <XCircle className="w-4 h-4 mr-1" />
                    )}
                    {status.isConnected ? 'Connected' : 'Disconnected'}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Total Queries</span>
                  <span className="text-white font-mono">{status.totalQueries}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Error Rate</span>
                  <span className="text-white font-mono">{status.errorRate}%</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Last Activity</span>
                  <span className="text-white text-sm">
                    {status.lastActivity.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
              <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
              
              <div className="space-y-3">
                <button className="w-full bg-gray-800 hover:bg-gray-700 text-white py-2 px-4 rounded-md transition-colors text-left">
                  View Query Logs
                </button>
                <button className="w-full bg-gray-800 hover:bg-gray-700 text-white py-2 px-4 rounded-md transition-colors text-left">
                  Test Slack Integration
                </button>
                <button className="w-full bg-gray-800 hover:bg-gray-700 text-white py-2 px-4 rounded-md transition-colors text-left">
                  Export Configuration
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 