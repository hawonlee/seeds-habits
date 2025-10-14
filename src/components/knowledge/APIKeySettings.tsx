/**
 * API Key Settings for Knowledge Graph
 * 
 * Allows users to securely store their OpenAI API key in localStorage
 * for processing conversations.
 * 
 * @module APIKeySettings
 */

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Key, Eye, EyeOff, AlertCircle, CheckCircle2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

const API_KEY_STORAGE_KEY = 'lkg_openai_api_key';

/**
 * Get stored API key
 */
export function getStoredAPIKey(): string | null {
  return localStorage.getItem(API_KEY_STORAGE_KEY);
}

/**
 * Store API key
 */
export function storeAPIKey(key: string): void {
  localStorage.setItem(API_KEY_STORAGE_KEY, key);
}

/**
 * Remove stored API key
 */
export function removeAPIKey(): void {
  localStorage.removeItem(API_KEY_STORAGE_KEY);
}

/**
 * API Key settings dialog
 */
export function APIKeySettings() {
  const [open, setOpen] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [hasKey, setHasKey] = useState(false);

  useEffect(() => {
    const stored = getStoredAPIKey();
    if (stored) {
      setApiKey(stored);
      setHasKey(true);
    }
  }, [open]);

  const handleSave = () => {
    if (apiKey.trim()) {
      storeAPIKey(apiKey.trim());
      setHasKey(true);
      setOpen(false);
    }
  };

  const handleRemove = () => {
    removeAPIKey();
    setApiKey('');
    setHasKey(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Key className="h-4 w-4" />
          {hasKey ? 'API Key Set' : 'Set API Key'}
        </Button>
      </DialogTrigger>
      <DialogContent className="kg-glass-card border-kg-border-subtle">
        <DialogHeader>
          <DialogTitle className="kg-gradient-text">OpenAI API Key</DialogTitle>
          <DialogDescription className="text-kg-text-secondary">
            Your API key is stored locally and never sent to our servers.
            It's only used to process your conversations in your browser.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="api-key" className="text-kg-text-primary">
              API Key
            </Label>
            <div className="relative">
              <Input
                id="api-key"
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-..."
                className="pr-10 bg-kg-bg-tertiary border-kg-border-subtle text-kg-text-primary"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setShowKey(!showKey)}
              >
                {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {hasKey && (
            <Alert className="bg-green-500/10 border-green-500/50">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <AlertDescription className="text-green-300 text-sm">
                API key is configured and ready to use
              </AlertDescription>
            </Alert>
          )}

          <Alert className="bg-kg-bg-tertiary border-kg-border-subtle">
            <AlertCircle className="h-4 w-4 text-kg-accent-blue" />
            <AlertDescription className="text-xs text-kg-text-secondary">
              <p className="font-semibold mb-1">Get your API key:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Go to <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-kg-accent-blue hover:underline">platform.openai.com/api-keys</a></li>
                <li>Create a new secret key</li>
                <li>Copy and paste it above</li>
              </ol>
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          {hasKey && (
            <Button variant="outline" onClick={handleRemove} className="mr-auto">
              Remove Key
            </Button>
          )}
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!apiKey.trim()}>
            Save Key
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Require API key before proceeding
 */
export function RequireAPIKey({ children }: { children: React.ReactNode }) {
  const [hasKey, setHasKey] = useState(false);

  useEffect(() => {
    const key = getStoredAPIKey();
    setHasKey(!!key);
  }, []);

  if (!hasKey) {
    return (
      <div className="flex items-center justify-center min-h-screen kg-neural-bg p-4">
        <div className="kg-glass-card p-8 max-w-md text-center space-y-4">
          <Key className="h-12 w-12 mx-auto text-kg-accent-blue" />
          <h2 className="text-2xl font-bold kg-gradient-text">
            API Key Required
          </h2>
          <p className="text-kg-text-secondary">
            Please set your OpenAI API key to process conversations.
            Your key is stored securely in your browser.
          </p>
          <APIKeySettings />
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

