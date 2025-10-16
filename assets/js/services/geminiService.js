const MODEL_NAME = 'gemini-2.5-flash';

const systemInstruction = `
You are a technology futurist and data analyst. Your task is to generate a projected growth trajectory for a specific field of Artificial Intelligence provided by the user.
You must respond with only a JSON array of objects. Do not include any other text, explanation, or markdown formatting.
Each object in the array represents a data point with a 'year', a numeric 'advancement' score (from 1 to 1000, where 1 is nascent and 1000 is transformative), and an optional 'milestone' string.
The data should start from a plausible year of inception for the given topic and project about 15-20 years into the future.
The growth curve should be exponential, reflecting the accelerating nature of AI development.
`;

let sdkPromise = null;

const loadGeminiSdk = async () => {
  if (!sdkPromise) {
    sdkPromise = import('@google/genai').catch((error) => {
      console.error('[Visualizer] Failed to load Gemini SDK', error);
      return null;
    });
  }
  return sdkPromise;
};

const getEnvKey = () => {
  if (typeof window === 'undefined') return '';
  const value = window.ENV?.GEMINI_API_KEY ?? '';
  return value ? String(value).trim() : '';
};

const sanitiseAndParse = async (maybeResponse) => {
  if (!maybeResponse) {
    throw new Error('Empty Gemini response');
  }

  const rawText = typeof maybeResponse.text === 'function'
    ? await maybeResponse.text()
    : maybeResponse.text;

  if (typeof rawText !== 'string') {
    throw new Error('Unexpected Gemini payload');
  }

  const cleaned = rawText.trim().replace(/^```json\s*/i, '').replace(/```$/i, '');
  const parsed = JSON.parse(cleaned);

  if (!Array.isArray(parsed)) {
    throw new Error('Gemini payload did not resolve to an array');
  }

  return parsed
    .map((point) => ({
      year: Number(point.year),
      advancement: Number(point.advancement),
      milestone: point.milestone || undefined
    }))
    .filter((point) => Number.isFinite(point.year) && Number.isFinite(point.advancement))
    .sort((a, b) => a.year - b.year);
};

const buildResponseSchema = (Type) => {
  if (!Type) return undefined;
  return {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        year: { type: Type.NUMBER },
        advancement: { type: Type.NUMBER },
        milestone: { type: Type.STRING }
      },
      required: ['year', 'advancement']
    }
  };
};

export const getProjectedGrowthData = async (topic, providedKey) => {
  const apiKey = (providedKey && providedKey.trim()) || getEnvKey();
  if (!apiKey) {
    return { ok: false, reason: 'no-key' };
  }

  const sdk = await loadGeminiSdk();
  if (!sdk?.GoogleGenAI) {
    return { ok: false, reason: 'sdk-load-failed' };
  }

  try {
    const schema = buildResponseSchema(sdk.Type);
    const client = new sdk.GoogleGenAI({ apiKey });
    const response = await client.models.generateContent({
      model: MODEL_NAME,
      contents: `Generate the growth trajectory for: "${topic}"`,
      config: schema
        ? { systemInstruction, responseMimeType: 'application/json', responseSchema: schema }
        : { systemInstruction, responseMimeType: 'application/json' }
    });

    const data = await sanitiseAndParse(response);
    return { ok: true, data, source: 'gemini' };
  } catch (error) {
    console.error('[Visualizer] Gemini projection failed', error);
    return {
      ok: false,
      reason: 'error',
      message: error instanceof Error ? error.message : String(error)
    };
  }
};
