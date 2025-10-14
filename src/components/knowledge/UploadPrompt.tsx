/**
 * Upload Prompt for Knowledge Graph
 * 
 * Shown to users who haven't uploaded their ChatGPT conversation data yet.
 * Provides instructions and a file upload interface.
 * 
 * @module UploadPrompt
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Brain, Upload, FileText, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { processUploadedConversations } from '@/lib/knowledge/processUpload';

interface UploadPromptProps {
  onUploadComplete?: () => void;
}

type UploadStatus = 'idle' | 'uploading' | 'processing' | 'success' | 'error';

export function UploadPrompt({ onUploadComplete }: UploadPromptProps) {
  const [status, setStatus] = useState<UploadStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setStatus('uploading');
    setError(null);
    setProgress(10);

    try {
      // Read file content
      const text = await file.text();
      setProgress(15);

      // Process conversations (parsing happens server-side to avoid blocking browser)
      await processUploadedConversations(text, (progressData) => {
        setProgress(progressData.progress);
        
        if (progressData.error) {
          throw new Error(progressData.error);
        }
        
        // Update status based on stage
        if (progressData.stage === 'parsing') {
          setStatus('uploading');
        } else if (progressData.stage === 'summarizing' || progressData.stage === 'embedding') {
          setStatus('processing');
        } else if (progressData.stage === 'graphing' || progressData.stage === 'storing') {
          setStatus('processing');
        } else if (progressData.stage === 'complete') {
          setStatus('success');
        }
      });

      // Wait a moment to show success message
      setTimeout(() => {
        onUploadComplete?.();
      }, 1500);

    } catch (err) {
      console.error('Upload error:', err);
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Upload failed');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen kg-neural-bg p-4">
      <Card className="kg-glass-card max-w-2xl w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 kg-pulse">
            <Brain className="h-16 w-16 kg-glow-blue" style={{ color: 'var(--kg-accent-blue)' }} />
          </div>
          <CardTitle className="text-3xl kg-gradient-text">
            Build Your Knowledge Graph
          </CardTitle>
          <CardDescription className="text-kg-text-secondary text-base">
            Upload your ChatGPT conversation export to visualize your learning journey
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Instructions */}
          <div className="kg-glass-card p-4 space-y-3">
            <h3 className="font-semibold text-kg-text-primary flex items-center gap-2">
              <FileText className="h-5 w-5 text-kg-accent-blue" />
              How to Export Your Conversations
            </h3>
            <ol className="text-sm text-kg-text-secondary space-y-2 list-decimal list-inside">
              <li>Go to <a href="https://chat.openai.com" target="_blank" rel="noopener noreferrer" className="text-kg-accent-blue hover:underline">chat.openai.com</a></li>
              <li>Click your profile → Settings → Data controls</li>
              <li>Click "Export data" and confirm via email</li>
              <li>Download the ZIP file and extract <code className="text-xs bg-kg-bg-tertiary px-1 py-0.5 rounded">conversations.json</code></li>
              <li>Upload the file below</li>
            </ol>
          </div>

          {/* Upload Area */}
          {status === 'idle' && (
            <div className="border-2 border-dashed border-kg-border-subtle rounded-lg p-8 text-center hover:border-kg-accent-blue transition-colors">
              <input
                type="file"
                id="conversations-upload"
                accept=".json,application/json"
                onChange={handleFileSelect}
                className="hidden"
              />
              <label
                htmlFor="conversations-upload"
                className="cursor-pointer flex flex-col items-center gap-3"
              >
                <Upload className="h-12 w-12 text-kg-accent-blue" />
                <div>
                  <p className="text-lg font-semibold text-kg-text-primary">
                    Choose conversations.json
                  </p>
                  <p className="text-sm text-kg-text-secondary mt-1">
                    or drag and drop here
                  </p>
                </div>
                <Button className="mt-2">
                  <Upload className="h-4 w-4 mr-2" />
                  Select File
                </Button>
              </label>
            </div>
          )}

          {/* Uploading/Processing */}
          {(status === 'uploading' || status === 'processing') && (
            <div className="kg-glass-card p-6 space-y-4">
              <div className="flex items-center gap-3">
                <Loader2 className="h-6 w-6 animate-spin text-kg-accent-blue" />
                <div className="flex-1">
                  <p className="font-semibold text-kg-text-primary">
                    {status === 'uploading' ? 'Uploading...' : 'Processing conversations...'}
                  </p>
                  <p className="text-sm text-kg-text-secondary">
                    {fileName}
                  </p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-kg-bg-tertiary rounded-full h-2 overflow-hidden">
                <div
                  className="h-full kg-glow-blue transition-all duration-300"
                  style={{
                    width: `${progress}%`,
                    background: 'var(--kg-gradient-blue-teal)',
                  }}
                />
              </div>

              <p className="text-xs text-kg-text-tertiary text-center">
                This may take a few minutes depending on the number of conversations...
              </p>
            </div>
          )}

          {/* Success */}
          {status === 'success' && (
            <Alert className="bg-green-500/10 border-green-500/50">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <AlertTitle className="text-green-400">Success!</AlertTitle>
              <AlertDescription className="text-green-300">
                Your knowledge graph has been built. Redirecting...
              </AlertDescription>
            </Alert>
          )}

          {/* Error */}
          {status === 'error' && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Upload Failed</AlertTitle>
              <AlertDescription>
                {error}
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={() => {
                    setStatus('idle');
                    setError(null);
                    setProgress(0);
                  }}
                >
                  Try Again
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {/* Privacy Notice */}
          <div className="text-xs text-kg-text-tertiary text-center space-y-1">
            <p>🔒 Your conversations are processed securely on our servers</p>
            <p>Only you can access your knowledge graph</p>
            <p>Your data is isolated and protected with Row Level Security</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Small inline upload button for existing users to re-upload
 */
export function UploadButton({ onUploadComplete }: { onUploadComplete?: () => void }) {
  const [isUploading, setIsUploading] = useState(false);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);

    try {
      const text = await file.text();

      // Call processUploadedConversations which uses Edge Function
      await processUploadedConversations(text);

      onUploadComplete?.();
    } catch (err) {
      console.error('Upload error:', err);
      alert('Upload failed: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <>
      <input
        type="file"
        id="conversations-reupload"
        accept=".json,application/json"
        onChange={handleFileSelect}
        className="hidden"
        disabled={isUploading}
      />
      <label htmlFor="conversations-reupload">
        <Button variant="outline" size="sm" disabled={isUploading} asChild>
          <span>
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Re-upload Data
              </>
            )}
          </span>
        </Button>
      </label>
    </>
  );
}

