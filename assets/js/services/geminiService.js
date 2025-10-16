const MODEL_NAME = 'gemini-2.5-flash';
const API_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent`;

const systemInstruction = `
You are a technology futurist and data analyst. Your task is to generate a projected growth trajectory for a specific field of Artificial Intelligence provided by the user.
You must respond with only a JSON array of objects. Do not include any other text, explanation, or markdown formatting.
Each object in the array represents a data point with a 'year', a numeric 'advancement' score (from 1 to 1000, where 1 is nascent and 1000 is transformative), and an optional 'milestone' string.
The data should start from a plausible year of inception for the given topic and project about 15-20 years into the future.
The growth curve should be exponential, reflecting the accelerating nature of AI development.
`.trim();

const responseSchema = {
  type: 'ARRAY',
  items: {
    type: 'OBJECT',
    properties: {
      year: { type: 'NUMBER' },
      advancement: { type: 'NUMBER' },
      milestone: { type: 'STRING' }
    },
    required: ['year', 'advancement']
  }
};

const normalisePoints = (payload) => payload
  .map((point) => ({
    year: Number(point.year),
    advancement: Number(point.advancement),
    milestone: point.milestone || undefined
  }))
  .filter((point) => Number.isFinite(point.year) && Number.isFinite(point.advancement))
  .sort((a, b) => a.year - b.year);

const getEnvKey = () => {
  if (typeof window === 'undefined') return '';
  const value = window.ENV?.GEMINI_API_KEY ?? '';
  return value ? String(value).trim() : '';
};

const extractTextFromResponse = (payload) => {
  if (!payload?.candidates?.length) {
    return '';
  }
  for (const candidate of payload.candidates) {
    const parts = candidate?.content?.parts;
    if (Array.isArray(parts)) {
      const text = parts
        .map((part) => part?.text)
        .filter(Boolean)
        .join('\n')
        .trim();
      if (text) return text;
    }
  }
  return '';
};

const parseGeminiPayload = (payload) => {
  const text = extractTextFromResponse(payload);
  if (!text) {
    throw new Error('Gemini response did not include a text payload');
  }

  const cleaned = text.replace(/^```json\s*/i, '').replace(/```$/i, '').trim();
  const json = JSON.parse(cleaned);

  if (!Array.isArray(json)) {
    throw new Error('Gemini payload did not resolve to an array');
  }

  return normalisePoints(json);
};

export const getProjectedGrowthData = async (topic, providedKey) => {
  const apiKey = (providedKey && providedKey.trim()) || getEnvKey();
  if (!apiKey) {
    return { ok: false, reason: 'no-key' };
  }

  const url = `${API_ENDPOINT}?key=${encodeURIComponent(apiKey)}`;
  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timeoutId = controller ? setTimeout(() => controller.abort(), 12000) : null;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: {
          role: 'system',
          parts: [{ text: systemInstruction }]
        },
        contents: [
          {
            role: 'user',
            parts: [{ text: `Generate the growth trajectory for: "${topic}"` }]
          }
        ],
        generationConfig: {
          responseMimeType: 'application/json'
        },
        responseSchema
      }),
      signal: controller?.signal
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.warn('[Visualizer] Gemini HTTP error', response.status, errorText);
      return { ok: false, reason: `http-${response.status}`, message: errorText };
    }

    const payload = await response.json();
    const data = parseGeminiPayload(payload);

    if (!data.length) {
      return { ok: false, reason: 'empty' };
    }

    return { ok: true, data, source: 'gemini' };
  } catch (error) {
    if (timeoutId) clearTimeout(timeoutId);
    console.error('[Visualizer] Gemini projection failed', error);
    return {
      ok: false,
      reason: error?.name === 'AbortError' ? 'timeout' : 'error',
      message: error instanceof Error ? error.message : String(error)
    };
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
};
