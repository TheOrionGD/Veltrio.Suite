# Consolidate All AI Services Under Groq

Migrate from the current fragmented HuggingFace + Groq setup to a **single Groq-powered backend** for all AI capabilities: translation, speech-to-text (STT), text-to-speech (TTS), sentiment analysis, and chat.

## Background

The current system uses:
| Capability | Current Provider | Issues |
|---|---|---|
| **Chat** (ChatbotWidget) | ✅ Groq (`llama-3.3-70b-versatile`) | Working |
| **Translation** | HuggingFace (`nllb-200-distilled-600M`) | Fetching errors, model cold-starts |
| **Sentiment Analysis** | HuggingFace (`twitter-roberta-base-sentiment`) | Fetching errors |
| **STT / Whisper** | HuggingFace (`fal-ai/whisper`) | Fetching errors |
| **TTS** | HuggingFace (`facebook/mms-tts-*`) | Fetching errors |
| **Chat** (ConversationView) | HuggingFace (`Qwen/Qwen2.5-7B`) | Fetching errors |

**After migration**, all 6 capabilities will use Groq with a single `VITE_GROQ_API_KEY`.

## User Review Required

> [!IMPORTANT]
> **HuggingFace token becomes unused.** After this migration, `VITE_HF_TOKEN` is no longer needed. The `openai` and `@huggingface/inference` npm packages can also be removed from `package.json` to reduce bundle size.

> [!WARNING]
> **Translation quality trade-off:** HuggingFace used a dedicated machine translation model (NLLB). Groq will use LLM-based prompt translation via `llama-3.3-70b-versatile`, which is generally excellent for major languages but may be slightly less specialized for rare language pairs. The 17 languages currently supported will all work well with Llama 3.3.

> [!IMPORTANT]
> **TTS language coverage:** Groq's native TTS model (`canopylabs/orpheus-v1-english`) currently supports **English** natively. For non-English TTS, we will fallback to the browser's built-in `SpeechSynthesis` API (which is already the existing fallback). This matches what HuggingFace MMS-TTS was doing — not all languages were supported there either.

## Open Questions

> [!IMPORTANT]
> **TTS Voice preference:** Groq's Orpheus model supports multiple voice presets: `tara`, `leah`, `jess`, `leo`, `dan`, `mara`, `zac`, `troy`. Which voice would you prefer as the default? I'll default to `tara` (female, natural-sounding) unless you have a preference.

## Proposed Changes

### Service Layer — Complete Rewrite

#### [DELETE] [huggingfaceService.ts](file:///e:/GitHub-Repos/Veltrio-EnterpriseSuite/services/huggingfaceService.ts)
- Remove entirely — all functionality migrated to the Groq service.

#### [MODIFY] [groqService.ts](file:///e:/GitHub-Repos/Veltrio-EnterpriseSuite/services/groqService.ts)
Expand from a chat-only service to a **full AI service layer** covering all 5 capabilities:

| Function | Groq Endpoint | Model |
|---|---|---|
| `chatWithGroq()` | `/v1/chat/completions` | `llama-3.3-70b-versatile` (unchanged) |
| `translateTextGroq()` | `/v1/chat/completions` | `llama-3.3-70b-versatile` (prompt-based) |
| `analyzeSentimentGroq()` | `/v1/chat/completions` | `llama-3.3-70b-versatile` (returns JSON) |
| `transcribeAudioGroq()` | `/v1/audio/transcriptions` | `whisper-large-v3-turbo` |
| `generateSpeechGroq()` | `/v1/audio/speech` | `canopylabs/orpheus-v1-english` |

**Translation approach:** Use a tightly constrained system prompt:
```
You are a professional translator. Translate the text from {source} to {target}.
Output ONLY the translated text. No explanations, no notes, no formatting.
```
Temperature: `0.2` for deterministic, consistent translations.

**Sentiment approach:** Use a structured JSON output prompt:
```
Analyze the sentiment of the following text. Respond with ONLY valid JSON:
{"sentiment": "Positive"|"Negative"|"Neutral", "explanation": "brief reason", "scores": {"positive": 0.0, "negative": 0.0, "neutral": 0.0}}
```

---

### Component Updates — Import Swaps

#### [MODIFY] [TranslatorView.tsx](file:///e:/GitHub-Repos/Veltrio-EnterpriseSuite/components/TranslatorView.tsx)
- Change import from `huggingfaceService` → `groqService`
- Replace `translateTextHF` → `translateTextGroq`
- Replace `analyzeSentimentHF` → `analyzeSentimentGroq`
- Replace `transcribeAudioHF` → `transcribeAudioGroq`
- Replace `generateSpeechHF` → `generateSpeechGroq`
- Remove HF token checks (`import.meta.env.VITE_HF_TOKEN`), replace with Groq key checks

#### [MODIFY] [ConversationView.tsx](file:///e:/GitHub-Repos/Veltrio-EnterpriseSuite/components/ConversationView.tsx)
- Change import from `huggingfaceService` → `groqService`
- Replace `transcribeAudioHF` → `transcribeAudioGroq`
- Replace `generateSpeechHF` → `generateSpeechGroq`
- Replace `chatHF` → `chatWithGroq`
- Remove HF token checks

---

### Configuration Cleanup

#### [MODIFY] [.env](file:///e:/GitHub-Repos/Veltrio-EnterpriseSuite/.env)
- Remove `VITE_HF_TOKEN` line
- Keep `VITE_GROQ_API_KEY` as the only API key

#### [MODIFY] [.env.example](file:///e:/GitHub-Repos/Veltrio-EnterpriseSuite/.env.example)
- Update to reflect Groq-only setup

#### [MODIFY] [package.json](file:///e:/GitHub-Repos/Veltrio-EnterpriseSuite/package.json)
- Remove `@huggingface/inference` dependency
- Remove `openai` dependency
- Run `npm install` to update lockfile

## Verification Plan

### Automated Tests
```bash
npm run build
```
Ensures TypeScript compiles cleanly with no missing imports or type errors.

### Manual Verification
1. **Translation:** Type text in Translator tab → verify translation appears in target language
2. **Sentiment:** Verify sentiment panel updates with Positive/Negative/Neutral classification
3. **STT (Whisper):** Click microphone → speak → verify transcription appears in input
4. **TTS:** Click speaker icon → verify audio plays for translated text
5. **Chat:** Open chatbot widget → send message → verify AI response
6. **Live Conversation:** Record audio in Conversation tab → verify full STT → Chat → TTS pipeline
