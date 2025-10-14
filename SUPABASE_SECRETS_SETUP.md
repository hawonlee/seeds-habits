# Supabase Secrets Setup for Knowledge Graph

## Overview

The Knowledge Graph feature now uses a centralized OpenAI API key stored in Supabase secrets. This means all users share the same API key (yours), simplifying the user experience and ensuring consistent service quality.

---

## Setting Up the OpenAI API Key in Supabase

### Method 1: Via Supabase Dashboard (Recommended)

1. **Go to your Supabase project dashboard**
   - Visit https://supabase.com/dashboard
   - Select your project

2. **Navigate to Edge Functions Secrets**
   - Click "Edge Functions" in the left sidebar
   - Go to the "Secrets" tab

3. **Add the OpenAI API Key**
   - Click "New secret"
   - Name: `OPENAI_API_KEY`
   - Value: Your OpenAI API key (e.g., `sk-proj-...`)
   - Click "Save"

### Method 2: Via Supabase CLI

```bash
# Install Supabase CLI if you haven't already
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref your-project-ref

# Set the secret
supabase secrets set OPENAI_API_KEY=your-openai-api-key-here
```

---

## Deploying the Edge Function

After setting the secret, you need to deploy the Edge Function:

```bash
# Deploy the process-knowledge-graph function
supabase functions deploy process-knowledge-graph

# Verify deployment
supabase functions list
```

---

## Verifying the Setup

### Test the Edge Function

You can test the function using the Supabase dashboard or CLI:

```bash
# Using Supabase CLI
supabase functions invoke process-knowledge-graph \
  --headers '{"Authorization":"Bearer YOUR_SUPABASE_ANON_KEY"}' \
  --data '{"conversations":[{"id":"test","title":"Test","messages":[{"role":"user","content":"Hello"},{"role":"assistant","content":"Hi there!"}],"timestamp":"2025-01-01T00:00:00Z"}]}'
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

## Required Environment Variables

The Edge Function automatically has access to these Supabase-provided variables:

- `SUPABASE_URL` - Automatically provided
- `SUPABASE_SERVICE_ROLE_KEY` - Automatically provided

You only need to set:
- `OPENAI_API_KEY` - Your OpenAI API key

---

## How It Works

### Architecture Flow

```
User Uploads → Client parses JSON → Calls Edge Function → 
Edge Function:
  1. Authenticates user
  2. Processes with OpenAI (using secret key)
  3. Builds knowledge graph
  4. Stores in database (with user_id)
→ Client receives success → Displays graph
```

### Security Features

1. **User Authentication**: Edge Function validates JWT token
2. **Data Isolation**: All data tagged with `user_id`
3. **RLS Policies**: Automatic filtering in database
4. **Secret Management**: API key never exposed to client
5. **Server-Side Processing**: All AI processing happens on Supabase servers

---

## Cost Considerations

Since all users share your OpenAI API key:

### Per User Costs (100 conversations)
- Summarization: ~$0.20-0.40
- Embeddings: ~$0.10-0.20
- **Total: ~$0.30-0.60 per user**

### Recommendations
1. **Monitor Usage**: Check your OpenAI dashboard regularly
2. **Set Budget Alerts**: Configure alerts in OpenAI dashboard
3. **Rate Limiting**: Consider adding rate limits if needed
4. **Usage Tracking**: Add analytics to track processing volume

---

## Troubleshooting

### "OpenAI API key not configured" Error

**Problem**: Edge Function can't access the secret

**Solutions**:
1. Verify secret is set: `supabase secrets list`
2. Redeploy function: `supabase functions deploy process-knowledge-graph`
3. Check secret name matches exactly: `OPENAI_API_KEY`

### "Invalid authorization" Error

**Problem**: User authentication failing

**Solutions**:
1. Ensure user is logged in
2. Check JWT token is being sent
3. Verify Supabase auth is configured correctly

### "Failed to process any conversations" Error

**Problem**: OpenAI API errors or conversation parsing issues

**Solutions**:
1. Check OpenAI API key is valid
2. Verify OpenAI account has credits
3. Check conversation JSON format
4. Review Edge Function logs: `supabase functions logs process-knowledge-graph`

---

## Viewing Logs

To see what's happening in your Edge Function:

```bash
# Real-time logs
supabase functions logs process-knowledge-graph --tail

# Recent logs
supabase functions logs process-knowledge-graph --limit 50
```

---

## Updating the API Key

If you need to rotate or update your API key:

```bash
# Update the secret
supabase secrets set OPENAI_API_KEY=new-api-key-here

# No need to redeploy - takes effect immediately
```

---

## Local Development

For local testing with Supabase CLI:

```bash
# Create local .env file in supabase/functions/process-knowledge-graph/
echo "OPENAI_API_KEY=your-key-here" > supabase/functions/process-knowledge-graph/.env

# Run function locally
supabase functions serve process-knowledge-graph
```

⚠️ **Never commit .env files with secrets!**

---

## Production Checklist

Before going live:

- [ ] OpenAI API key set in Supabase secrets
- [ ] Edge Function deployed
- [ ] Test with sample conversation
- [ ] Verify user authentication works
- [ ] Check RLS policies are active
- [ ] Set up OpenAI usage alerts
- [ ] Monitor function logs
- [ ] Test error handling

---

## Support

If you encounter issues:

1. Check Supabase function logs
2. Verify OpenAI API key is valid
3. Test authentication flow
4. Review Edge Function code
5. Check browser console for errors

---

**Last Updated**: Now  
**Version**: 2.0.0 (Centralized API Key)  
**Status**: Production Ready ✅

