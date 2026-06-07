import { SentimentResult, SentimentLabel, TranslationResult } from '../types';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

const getGroqApiKey = (): string => {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("VITE_GROQ_API_KEY environment variable is not set");
  }
  return apiKey;
};

const LANG_NAME_MAP: Record<string, string> = {
  en: 'English',
  es: 'Spanish',
  fr: 'French',
  de: 'German',
  it: 'Italian',
  ja: 'Japanese',
  ko: 'Korean',
  zh: 'Mandarin/Chinese',
  pt: 'Portuguese',
  ru: 'Russian',
  ar: 'Arabic',
  hi: 'Hindi',
  nl: 'Dutch',
  pl: 'Polish',
  sv: 'Swedish',
  tr: 'Turkish',
  vi: 'Vietnamese',
};

export const chatWithGroq = async (messages: ChatMessage[]): Promise<string> => {
  const apiKey = getGroqApiKey();
  
  const systemInstruction: ChatMessage = {
    role: 'system',
    content: `You are the Veltrio AI Chatbot, a friendly and intelligent virtual assistant integrated directly into Veltrio. 
Your goal is to help users with:
- Language translation and phrasing tips.
- Language learning questions, culture, and idioms.
- Explaining how to use Veltrio (which features a Translator tab for text/voice translation with sentiment analysis and a Live Conversation tab for interactive voice chat).
Keep your responses extremely short, concise, and clear (maximum 1-2 sentences or bullet points). Think of it as a terminal log style. Do not mention any prohibited terms like "Enterprise" or "Cybersecurity" or "Gemini" or "Google".`
  };

  // Combine instructions with conversation history
  const fullMessages = [systemInstruction, ...messages];

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: fullMessages,
      temperature: 0.7,
      max_tokens: 256
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Groq request failed with status ${response.status}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "";
};

export const translateTextGroq = async (text: string, srcLang: string, tgtLang: string): Promise<TranslationResult> => {
  if (!text.trim()) return { translatedText: '' };
  const apiKey = getGroqApiKey();
  const srcName = srcLang === 'auto' ? 'Auto-Detect' : (LANG_NAME_MAP[srcLang] || srcLang);
  const tgtName = LANG_NAME_MAP[tgtLang] || tgtLang;

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: "llama-3.1-8b-instant",
      messages: [
        {
          role: 'system',
          content: `You are a professional translator and linguist. Translate the text from ${srcName} to ${tgtName}.
If the source language is "Auto-Detect", identify the source language first.
Assess the quality and readability of the translation.
You must respond with a JSON object containing these exact fields:
{
  "detectedLanguageName": "the English name of the detected source language (e.g. 'Spanish', 'French')",
  "detectedLanguageCode": "the 2-letter ISO code of the detected source language (e.g. 'es', 'fr')",
  "translatedText": "the translated text in ${tgtName}",
  "languageConfidence": 0.95, // float between 0.0 and 1.0 representing detection confidence
  "translationQualityScore": 0.98, // float between 0.0 and 1.0 representing translation quality
  "clarityScore": 0.92 // float between 0.0 and 1.0 representing text readability/clarity
}
Output ONLY this JSON object. Do not wrap in markdown or backticks.`
        },
        {
          role: 'user',
          content: text
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.2
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Groq request failed with status ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || "";
  try {
    const parsed = JSON.parse(content);
    return {
      translatedText: parsed.translatedText || "",
      detectedLanguageName: parsed.detectedLanguageName || "",
      detectedLanguageCode: parsed.detectedLanguageCode || "",
      languageConfidence: typeof parsed.languageConfidence === 'number' ? parsed.languageConfidence : 0.9,
      qualityScore: typeof parsed.translationQualityScore === 'number' ? parsed.translationQualityScore : 0.9,
      clarityScore: typeof parsed.clarityScore === 'number' ? parsed.clarityScore : 0.9
    };
  } catch (e) {
    console.error("Failed to parse JSON translation response:", content, e);
    return {
      translatedText: content,
      detectedLanguageName: srcLang !== 'auto' ? srcName : '',
      languageConfidence: 0.8,
      qualityScore: 0.85,
      clarityScore: 0.8
    };
  }
};

export const analyzeSentimentGroq = async (text: string): Promise<SentimentResult> => {
  if (!text.trim()) {
    return {
      sentiment: SentimentLabel.Neutral,
      explanation: 'No text provided.',
      intensity: 0,
      emotionalInsights: [],
      tone: 'Neutral',
      confidence: 1.0
    };
  }
  const apiKey = getGroqApiKey();

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: 'system',
          content: `Analyze the sentiment of the provided text. You must respond with a JSON object containing these exact fields:
{
  "sentiment": "Positive" | "Negative" | "Neutral", // exactly matching one of these capitalized strings
  "explanation": "concise explanation of why this sentiment was chosen",
  "intensity": 0.85, // float between 0.0 and 1.0 representing emotional strength
  "emotionalInsights": ["Excited", "Warm"], // array of 1-3 specific emotions identified
  "tone": "Empathetic", // the primary tone of the speaker (e.g. Professional, Impatient, Friendly)
  "confidence": 0.95 // float between 0.0 and 1.0 representing sentiment analysis confidence
}
Output ONLY this JSON object. Do not wrap in markdown or backticks.`
        },
        {
          role: 'user',
          content: text
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.1
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Groq request failed with status ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || "";
  try {
    const parsed = JSON.parse(content);
    return {
      sentiment: (parsed.sentiment as SentimentLabel) || SentimentLabel.Neutral,
      explanation: parsed.explanation || "",
      intensity: typeof parsed.intensity === 'number' ? parsed.intensity : 0.5,
      emotionalInsights: Array.isArray(parsed.emotionalInsights) ? parsed.emotionalInsights : [],
      tone: parsed.tone || "Neutral",
      confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.8
    };
  } catch (e) {
    console.error("Failed to parse Groq sentiment JSON response:", content, e);
    return {
      sentiment: SentimentLabel.Neutral,
      explanation: "Could not parse sentiment response.",
      intensity: 0.5,
      emotionalInsights: [],
      tone: "Neutral",
      confidence: 0.5
    };
  }
};

export const transcribeAudioGroq = async (audioBlob: Blob, languageCode?: string): Promise<string> => {
  const apiKey = getGroqApiKey();
  const formData = new FormData();
  formData.append('file', audioBlob, 'audio.webm');
  formData.append('model', 'whisper-large-v3-turbo');
  if (languageCode && languageCode !== 'auto') {
    formData.append('language', languageCode);
  }

  const response = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`
    },
    body: formData
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Groq audio transcription failed with status ${response.status}`);
  }

  const data = await response.json();
  return data.text || "";
};

let isGroqTtsDisabled = false;

export const isGroqTtsActive = (): boolean => !isGroqTtsDisabled;

export const generateSpeechGroq = async (text: string, targetLang: string): Promise<Blob> => {
  // Groq's canopylabs/orpheus-v1-english is for English. If the target language is not English,
  // or if Groq TTS has been disabled due to terms agreement restrictions, fall back.
  if (isGroqTtsDisabled) {
    throw new Error("Groq TTS is disabled due to model terms required. Falling back to native SpeechSynthesis.");
  }
  if (targetLang !== 'en') {
    throw new Error("Groq TTS only supports English natively. Falling back to native SpeechSynthesis.");
  }

  const apiKey = getGroqApiKey();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 2000); // 2-second timeout to fall back to browser synthesis

  try {
    const response = await fetch("https://api.groq.com/openai/v1/audio/speech", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "canopylabs/orpheus-v1-english",
        input: text,
        voice: "hannah"
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      console.error("Groq TTS Error Response:", errorText);
      if (errorText.includes("model_terms_required") || errorText.includes("terms acceptance")) {
        isGroqTtsDisabled = true;
        console.warn("Groq TTS requires terms acceptance. Disabling Groq TTS and falling back to native SpeechSynthesis.");
      }
      let message = `Groq TTS request failed with status ${response.status}`;
      try {
        const parsed = JSON.parse(errorText);
        if (parsed.error?.message) {
          message = parsed.error.message;
        }
      } catch (_) {}
      throw new Error(message);
    }

    const audioBlob = await response.blob();
    if (audioBlob.size === 0) {
      throw new Error('Groq TTS returned an empty audio response');
    }
    return audioBlob;
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      console.warn("Groq TTS request timed out. Falling back to browser SpeechSynthesis.");
      throw new Error("Groq TTS request timed out");
    }
    throw err;
  }
};

export interface ConversationChatResponse {
  languageCode: string;
  responseText: string;
}

export const chatWithGroqConversation = async (
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  inputLanguage: string = 'auto'
): Promise<ConversationChatResponse> => {
  const apiKey = getGroqApiKey();
  
  const detectedLangInstruction = inputLanguage !== 'auto'
    ? `The user's language is explicitly set to language code "${inputLanguage}". You MUST respond to the user in this exact same language. Do NOT respond in any other language.`
    : `Detect the language of the user's latest input. Respond to the user in that exact same language.`;

  const systemInstruction = {
    role: 'system',
    content: `You are a helpful, friendly, and natural voice assistant.
${detectedLangInstruction}
Keep your response extremely short (maximum 1-2 sentences, under 30 words) and highly conversational. Suitable for real-time voice conversation.
You must strictly adhere to safety policies: do not assist with illegal activities, hate speech, violence, self-harm, harassment, or private data exposure. If the user request violates this, politely refuse to answer.

You must respond with a JSON object containing two fields:
1. "languageCode": the ISO 2-letter language code of the language you are responding in (e.g. "en" for English, "fr" for French, "es" for Spanish, "ja" for Japanese, "de" for German, "ru" for Russian, "ar" for Arabic, etc.).
2. "responseText": your friendly conversational response in that language.

Example output:
{
  "languageCode": "fr",
  "responseText": "Bonjour! Comment puis-je vous aider aujourd'hui?"
}`
  };

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: "llama-3.1-8b-instant",
      messages: [systemInstruction, ...messages],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 128
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Groq request failed with status ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || "";
  try {
    const parsed = JSON.parse(content);
    return {
      languageCode: parsed.languageCode || 'en',
      responseText: parsed.responseText || ''
    };
  } catch (e) {
    console.error("Failed to parse JSON chat conversation response:", content, e);
    return {
      languageCode: 'en',
      responseText: content
    };
  }
};
