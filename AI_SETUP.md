# AI Feature Setup Guide

The "Ask AI" feature supports **multiple AI providers** with automatic fallback. Choose the best option for your needs!

## 🏆 Recommended: Groq (FREE)

**Why Groq?**
- ✅ **Completely FREE** - No credit card required
- ✅ **14,400 requests/day** free tier
- ✅ **Blazing fast** inference (< 1 second)
- ✅ **Llama 3.1 70B** - Excellent quality
- ✅ **Perfect for personal use**

### Setup Groq (5 minutes)

1. Go to [https://console.groq.com](https://console.groq.com)
2. Sign up (no credit card required)
3. Create an API key
4. Add to `backend/.env`:

```env
GROQ_API_KEY=gsk_your-key-here
```

That's it! Restart the backend and AI features work.

---

## 📊 All Supported Providers

The system automatically uses the **first configured provider** in this priority order:

### 1. Groq (FREE) 🎉
```env
GROQ_API_KEY=gsk_your-key-here
```
- **Cost**: FREE (250,000 tokens/min)
- **Model**: Llama 3.3 70B Versatile
- **Speed**: ⚡ 280 tokens/sec (very fast)
- **Quality**: ⭐⭐⭐⭐
- **Get key**: [console.groq.com](https://console.groq.com)

### 2. OpenRouter ($0.50/month) 💰
```env
OPENROUTER_API_KEY=sk-or-your-key
```
- **Cost**: ~$0.50-2/month (pay as you go)
- **Model**: Llama 3.1 8B Instruct (default)
- **Speed**: Fast
- **Quality**: ⭐⭐⭐
- **Get key**: [openrouter.ai/keys](https://openrouter.ai/keys)
- **Bonus**: Access to 100+ models (Claude, GPT-4, Gemini, etc.)

### 3. Grok ($8/month) 🐦
```env
GROK_API_KEY=xai-your-key
```
- **Cost**: $8/month X Premium + $25 API credits
- **Model**: Grok Beta
- **Speed**: Medium
- **Quality**: ⭐⭐⭐⭐
- **Get key**: [console.x.ai](https://console.x.ai)
- **Note**: Requires X Premium subscription

### 4. OpenAI ($10-20/month) 💸
```env
OPENAI_API_KEY=sk-your-key
```
- **Cost**: ~$10-20/month
- **Model**: GPT-4o mini (default)
- **Speed**: Fast
- **Quality**: ⭐⭐⭐⭐⭐
- **Get key**: [platform.openai.com/api-keys](https://platform.openai.com/api-keys)

---

## 🔄 Switching Providers

The system automatically detects and uses providers in priority order. To switch:

### Change Priority
Simply set a higher-priority provider's API key:

```env
# Currently using OpenAI, want to switch to Groq
GROQ_API_KEY=gsk_new-key  # This will be used instead
OPENAI_API_KEY=sk-old-key  # This becomes fallback
```

### Override Model
Use a different model for your provider:

```env
GROQ_API_KEY=gsk_your-key
AI_MODEL=mixtral-8x7b-32768  # Override default Llama 3.1
```

**Available models by provider:**

**Groq:**
- `llama-3.3-70b-versatile` (default, best quality)
- `llama-3.1-8b-instant` (faster, good for simple tasks)
- `openai/gpt-oss-120b` (alternative, very capable)

**OpenRouter:**
- `meta-llama/llama-3.1-8b-instruct` (default, cheapest)
- `anthropic/claude-3.5-haiku` (best quality)
- `google/gemini-pro-1.5` (good balance)

**OpenAI:**
- `gpt-4o-mini` (default, cost-effective)
- `gpt-4o` (best quality, expensive)

---

## ✨ Features Enabled

Once configured, users can:

1. **Ask AI Questions**
   - Open search modal with `⌘K`
   - Switch to "Ask AI" tab
   - Type question and press Enter

2. **Smart Context Search**
   - AI searches through all your captures
   - Finds relevant context automatically
   - Shows sources used in answer

3. **Example Questions**
   - "What are the main topics I've saved?"
   - "Summarize my recent captures about programming"
   - "Find links I saved about React"
   - "What did I capture yesterday?"

---

## 🔧 Troubleshooting

### "AI service is not configured"
**Solution**: Set at least one API key in `.env` and restart backend

### "Invalid API key"
**Solution**: Double-check your API key, ensure no extra spaces

### Provider not detected
**Solution**: Check provider priority - higher priority providers are used first

### Rate limits hit
**Solutions:**
- **Groq**: 14,400/day is generous, usually not an issue
- **OpenRouter**: Add credits to your account
- **OpenAI**: Increase spending limits

### Check active provider
Start backend and look for this log:
```
AI Provider initialized: Groq (FREE)
```

Or call the status endpoint:
```bash
curl http://localhost:3001/api/ai/status
```

---

## 💡 Cost Comparison (1,000 questions/month)

| Provider | Cost/Month | Quality | Speed | Recommendation |
|----------|------------|---------|-------|----------------|
| **Groq** | **FREE** | ⭐⭐⭐⭐ | ⚡ Fastest | **✅ Best Choice** |
| OpenRouter | $0.50-2 | ⭐⭐⭐ | Fast | Good paid option |
| Grok | $8 | ⭐⭐⭐⭐ | Medium | Only if using X Premium |
| OpenAI | $10-20 | ⭐⭐⭐⭐⭐ | Fast | Expensive |

---

## 🚀 Quick Start

**Option 1: Free (Groq)**
```bash
# 1. Get free key from console.groq.com
# 2. Add to .env
echo "GROQ_API_KEY=gsk_your-key" >> backend/.env
# 3. Restart
npm run dev:backend
```

**Option 2: Multiple Providers (Fallback)**
```bash
# Set multiple for redundancy
GROQ_API_KEY=gsk_primary
OPENROUTER_API_KEY=sk-or-backup
OPENAI_API_KEY=sk-fallback
```

The system will use Groq first, fallback to OpenRouter if it fails, then OpenAI.

---

## 📝 Configuration Examples

### Personal Use (Free)
```env
GROQ_API_KEY=gsk_your-key-here
```

### Production (Redundancy)
```env
GROQ_API_KEY=gsk_primary
OPENROUTER_API_KEY=sk-or-backup
```

### Premium Quality
```env
OPENAI_API_KEY=sk-your-key
AI_MODEL=gpt-4o
```

### Budget-Conscious
```env
OPENROUTER_API_KEY=sk-or-your-key
AI_MODEL=meta-llama/llama-3.1-8b-instruct
```

---

## 🎯 Recommendations by Use Case

**Personal/Hobby Project**: Groq (FREE)
**Small Team**: OpenRouter ($1-5/month)
**Production App**: Groq + OpenRouter (redundancy)
**Premium Quality**: OpenAI GPT-4o

---

## Need Help?

- Check logs for "AI Provider initialized" message
- Test with status endpoint: `GET /api/ai/status`
- Verify API key format matches provider requirements
- Ensure backend is restarted after config changes
