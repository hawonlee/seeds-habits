# Quick Deploy Guide - Knowledge Graph Edge Function

## ✅ Code Changes Complete

The code has been updated and pushed. Now you need to:

1. Set your OpenAI API key in Supabase
2. Deploy the Edge Function

---

## Step 1: Set OpenAI API Key in Supabase

### Option A: Via Dashboard (Easiest)

1. Go to https://supabase.com/dashboard
2. Select your project
3. Click **"Edge Functions"** in the left sidebar
4. Go to the **"Secrets"** tab (or "Environment Variables")
5. Click **"New secret"**
6. Enter:
   - **Name**: `OPENAI_API_KEY`
   - **Value**: `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`
7. Click **"Save"**

### Option B: Via CLI

```bash
# Install Supabase CLI if needed
npm install -g supabase

# Login
supabase login

# Link project (you'll be prompted to select it)
supabase link

# Set the secret
supabase secrets set OPENAI_API_KEY=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
```

---

## Step 2: Deploy the Edge Function

### Via Supabase CLI

```bash
# Make sure you're in the project root
cd /Users/jwen/seeds-habits-1

# Deploy the function
supabase functions deploy process-knowledge-graph

# Verify it deployed
supabase functions list
```

### Via Dashboard

1. In Supabase dashboard, go to **"Edge Functions"**
2. Click **"Deploy new function"**
3. Select the `process-knowledge-graph` folder from your repo
4. Click **"Deploy"**

---

## Step 3: Test It

Once deployed, users can:

1. Go to `/knowledge` in your app
2. Upload their `conversations.json`
3. Processing happens automatically (no API key needed from them!)

---

## Verify It's Working

### Quick Test

```bash
# Get your Supabase anon key from dashboard
# Then test the function:

supabase functions invoke process-knowledge-graph \
  --data '{
    "conversations": [{
      "id": "test-123",
      "title": "Test Conversation",
      "messages": [
        {"role": "user", "content": "What is 2+2?"},
        {"role": "assistant", "content": "4"}
      ],
      "timestamp": "2025-01-14T00:00:00Z"
    }]
  }'
```

Expected response:
```json
{
  "success": true,
  "processed": 1,
  "nodes": 1,
  "edges": 0
}
```

---

## View Logs

To see what's happening in your function:

```bash
# Real-time logs
supabase functions logs process-knowledge-graph --tail

# Or view in dashboard: Edge Functions → process-knowledge-graph → Logs
```

---

## Cost Estimate

With your centralized API key, costs per user (100 conversations):
- ~$0.30-0.60 per user
- Paid from your OpenAI account

**Recommendation**: Set up usage alerts in your OpenAI dashboard at platform.openai.com/usage

---

## Troubleshooting

### "Function not found" Error
- Make sure you deployed: `supabase functions deploy process-knowledge-graph`
- Check function list: `supabase functions list`

### "OpenAI API key not configured" Error  
- Verify secret is set: `supabase secrets list`
- Check the name is exactly: `OPENAI_API_KEY`

### "Invalid authorization" Error
- User needs to be logged in
- Check Supabase auth is working

---

## What Changed?

**Before**: Users entered their own API key → processed in browser  
**After**: Your API key in Supabase secrets → processed server-side

**Users now**: Just upload → wait → view graph! 🎉

---

## Next Steps After Deploy

1. Test with your own account first
2. Monitor OpenAI usage dashboard
3. Set up usage alerts
4. Optionally add rate limiting if needed

---

**That's it!** Once you complete Steps 1 & 2, the Knowledge Graph will work for all users with your centralized API key. 🚀

