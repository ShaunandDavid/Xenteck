import React, {
  useCallback,
  useEffect,
  useState
} from 'react';
import { createRoot } from 'react-dom/client';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
const DEFAULT_TOPIC = 'Agentic SaaS';
const LOCAL_STORAGE_KEY = 'xenteck_gemini_key';
const growthApiUrl = typeof window !== 'undefined' && window.ENV?.GROWTH_API_URL
  ? String(window.ENV.GROWTH_API_URL).trim()
  : '';

const baselineData = [
  { year: 2010, advancement: 5, milestone: 'Deep learning breakthroughs begin' },
  { year: 2012, advancement: 10, milestone: 'AlexNet wins ImageNet' },
  { year: 2014, advancement: 20, milestone: 'GANs are introduced' },
  { year: 2016, advancement: 35, milestone: 'AlphaGo beats Lee Sedol' },
  { year: 2018, advancement: 60, milestone: 'BERT transformer model released' },
  { year: 2020, advancement: 100, milestone: 'GPT-3 showcases advanced text generation' },
  { year: 2022, advancement: 180, milestone: 'Diffusion models popularize AI art' },
  { year: 2024, advancement: 300, milestone: 'Multi-modality models become mainstream' },
  { year: 2026, advancement: 500 },
  { year: 2028, advancement: 800 },
  { year: 2030, advancement: 1000 }
];

const sampleTopics = [
  'Autonomous Logistics',
  'GenAI Sales Co-Pilots',
  'Quantum Machine Learning',
  'Autonomous Bioengineering',
  'AI-Driven Compliance',
  'Robotics Process Automation',
  'Intelligent Edge Vision',
  'Predictive Healthcare Agents'
];

let geminiModulePromise = null;

const loadGeminiSdk = async () => {
  if (!geminiModulePromise) {
    geminiModulePromise = import('@google/genai').catch((error) => {
      console.error('Failed to load Gemini SDK', error);
      return null;
    });
  }
  return geminiModulePromise;
};

const systemInstruction = `
You are a technology futurist and data analyst. Your task is to generate a projected growth trajectory for a specific field of Artificial Intelligence provided by the user.
You must respond with only a JSON array of objects. Do not include any other text, explanation, or markdown formatting.
Each object in the array represents a data point with a 'year', a numeric 'advancement' score (from 1 to 1000, where 1 is nascent and 1000 is transformative), and an optional 'milestone' string.
The data should start from a plausible year of inception for the given topic and project about 15-20 years into the future.
The growth curve should be exponential, reflecting the accelerating nature of AI development.
`;

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

  const cleaned = rawText
    .trim()
    .replace(/^```json\s*/i, '')
    .replace(/```$/i, '');

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

const createFallbackProjection = (topic) => {
  const currentYear = new Date().getFullYear();
  const startYear = currentYear - 6;
  const span = 12;

  return Array.from({ length: span }, (_, index) => {
    const year = startYear + index;
    const growth = Math.min(
      1000,
      Math.round(12 * Math.pow(1.34, index + 1) * (1 + index * 0.18))
    );
    const milestone = index % 3 === 0
      ? `${topic} breakthrough expected`
      : undefined;

    return { year, advancement: growth, milestone };
  });
};

const mergeBaselineWithProjection = (projectionData, topic) => {
  const projectionMap = new Map(projectionData.map((point) => [point.year, point]));
  const allYears = new Set([
    ...baselineData.map((point) => point.year),
    ...projectionData.map((point) => point.year)
  ]);

  return Array.from(allYears)
    .sort((a, b) => a - b)
    .map((year) => {
      const baselinePoint = baselineData.find((point) => point.year === year);
      const projectionPoint = projectionMap.get(year);

      return {
        year,
        baseline: baselinePoint ? baselinePoint.advancement : undefined,
        advancement: projectionPoint ? projectionPoint.advancement : undefined,
        milestone: projectionPoint?.milestone,
        topic
      };
    });
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) {
    return null;
  }

  const projection = payload.find((entry) => entry.dataKey === 'advancement');
  const baseline = payload.find((entry) => entry.dataKey === 'baseline');
  const dataPoint = projection?.payload;

  return (
    <div className="ai-panel ai-panel--tooltip">
      <p className="label sora" style={{ fontWeight: 600, margin: 0 }}>
        Year {label}
      </p>
      {projection && (
        <p style={{ margin: '.35rem 0', color: 'rgba(0, 225, 255, .9)' }}>
          {projection.name}: {projection.value}
        </p>
      )}
      {baseline && (
        <p style={{ margin: 0, color: 'rgba(201, 210, 224, .8)' }}>
          Baseline: {baseline.value}
        </p>
      )}
      {dataPoint?.milestone && (
        <p style={{ marginTop: '.6rem', color: 'rgba(255, 202, 87, .9)', fontSize: '.82rem' }}>
          Milestone: {dataPoint.milestone}
        </p>
      )}
    </div>
  );
};

const LivingGraph = ({ topic, projectionData }) => {
  const combinedData = useMemo(
    () => mergeBaselineWithProjection(projectionData, topic),
    [projectionData, topic]
  );

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={combinedData} margin={{ top: 10, right: 24, left: 16, bottom: 0 }}>
        <defs>
          <linearGradient id="projection-gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#00e1ff" stopOpacity={0.8} />
            <stop offset="95%" stopColor="#00e1ff" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="baseline-gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#6b7280" stopOpacity={0.4} />
            <stop offset="95%" stopColor="#6b7280" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#2b2f3c" />
        <XAxis
          dataKey="year"
          type="number"
          domain={['dataMin', 'dataMax']}
          tick={{ fill: '#94a3b8', fontSize: 12 }}
          stroke="#4c5263"
        />
        <YAxis
          tick={{ fill: '#94a3b8', fontSize: 12 }}
          stroke="#4c5263"
          domain={[0, 1100]}
          label={{
            value: 'Advancement Score',
            angle: -90,
            position: 'insideLeft',
            fill: '#94a3b8',
            fontSize: 13,
            dy: 50
          }}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend verticalAlign="top" height={32} iconType="circle" />
        <Area
          type="monotone"
          dataKey="baseline"
          name="General AI Trend"
          stroke="#64748b"
          strokeWidth={2}
          strokeDasharray="6 4"
          fill="url(#baseline-gradient)"
          connectNulls
          isAnimationActive={false}
        />
        <Area
          type="monotone"
          dataKey="advancement"
          name={`${topic} projection`}
          stroke="#00e1ff"
          strokeWidth={3}
          fill="url(#projection-gradient)"
          dot={{ stroke: '#00e1ff', strokeWidth: 1, r: 3, fill: '#00e1ff' }}
          connectNulls
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};

const ScoreExplanation = () => (
  <div className="ai-panel ai-panel--explain">
    <div className="ai-panel__heading">
      <h2>Score Intelligence</h2>
    </div>
    <p className="ai-panel__subtext">
      Advancement Score is a blended metric (1 – 1000) that weights capability, adoption velocity,
      capital inflow, and regulatory momentum for the specified field.
    </p>
    <ul>
      <li><span>1–100:</span> Nascent, primarily research-grade.</li>
      <li><span>101–400:</span> Early adoption with measurable pilots.</li>
      <li><span>401–800:</span> Operates across industries with high ROI.</li>
      <li><span>801–1000:</span> Ubiquitous, market-defining, defensible.</li>
    </ul>
    <div className="ai-meta">
      <strong>Read the delta.</strong>
      <span>
        The dotted line is the predictable pace. The neon sweep is how quickly the chosen domain
        will reshape your operating model. That gap is the compounding edge—or erosion—you must plan for.
      </span>
    </div>
  </div>
);

const getStoredKey = () => {
  try {
    if ('localStorage' in window) {
      return localStorage.getItem(LOCAL_STORAGE_KEY) || '';
    }
  } catch (_) {
    // ignore storage issues
  }
  return '';
};

const persistKey = (value) => {
  try {
    if ('localStorage' in window) {
      if (value) {
        localStorage.setItem(LOCAL_STORAGE_KEY, value);
      } else {
        localStorage.removeItem(LOCAL_STORAGE_KEY);
      }
    }
  } catch (_) {
    // ignore storage issues
  }
};

const normaliseExternalPoints = (payload) => {
  if (!payload) return [];
  const raw = Array.isArray(payload) ? payload : payload.data;
  if (!Array.isArray(raw)) return [];

  return raw
    .map((point) => ({
      year: Number(point.year),
      advancement: Number(point.advancement),
      milestone: point.milestone || undefined
    }))
    .filter((point) => Number.isFinite(point.year) && Number.isFinite(point.advancement))
    .sort((a, b) => a.year - b.year);
};

const fetchGrowthApi = async (topic) => {
  if (!growthApiUrl) return null;

  const base = growthApiUrl.includes('://')
    ? growthApiUrl
    : `${growthApiUrl.startsWith('/') ? '' : '/'}${growthApiUrl}`;

  const separator = base.includes('?') ? '&' : '?';
  const url = `${base}${separator}topic=${encodeURIComponent(topic)}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: { Accept: 'application/json' }
  });

  if (!response.ok) {
    throw new Error(`Growth API responded with ${response.status}`);
  }

  const data = await response.json();
  const points = normaliseExternalPoints(data);
  if (!points.length) {
    throw new Error('Growth API returned no data');
  }

  return points;
};

async function getProjectedGrowthData(apiKey, topic) {
  if (!apiKey) {
    throw new Error('Gemini key unavailable');
  }

  const gemini = await loadGeminiSdk();
  if (!gemini || !gemini.GoogleGenAI) {
    throw new Error('Gemini client unavailable');
  }

  const schema = buildResponseSchema(gemini.Type);
  const config = {
    systemInstruction,
    responseMimeType: 'application/json'
  };
  if (schema) {
    config.responseSchema = schema;
  }

  const client = new gemini.GoogleGenAI({ apiKey });

  const response = await client.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: `Generate the growth trajectory for: "${topic}"`,
    config
  });

  return sanitiseAndParse(response);
}

const VisualizerApp = () => {
  const envKey = typeof window !== 'undefined' && window.ENV?.GEMINI_API_KEY
    ? String(window.ENV.GEMINI_API_KEY)
    : '';
  const storedKey = typeof window !== 'undefined' ? getStoredKey() : '';

  const [topic, setTopic] = useState(DEFAULT_TOPIC);
  const [topicDraft, setTopicDraft] = useState(DEFAULT_TOPIC);
  const [apiKey, setApiKey] = useState(envKey || storedKey);
  const [apiKeyDraft, setApiKeyDraft] = useState(envKey || storedKey);
  const [projectionData, setProjectionData] = useState(() => createFallbackProjection(DEFAULT_TOPIC));
  const [statusMessage, setStatusMessage] = useState(
    growthApiUrl
      ? 'Illustrative projection. Configure Growth API for live data.'
      : 'Illustrative projection. Add a Gemini API key to unlock live data.'
  );
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  const runProjection = useCallback(async (currentTopic, options = { force: false }) => {
    if (!currentTopic) {
      return;
    }

    setIsLoading(true);
    setErrorMessage('');
    setStatusMessage(growthApiUrl ? 'Contacting growth service…' : 'Contacting Gemini for live projection…');

    let data = null;
    let source = 'fallback';
    let growthError = null;

    if (growthApiUrl) {
      try {
        data = await fetchGrowthApi(currentTopic);
        source = 'growth';
      } catch (error) {
        growthError = error instanceof Error ? error.message : String(error);
        console.error('Growth API projection failed', error);
      }
    }

    if (!data && apiKey) {
      try {
        data = await getProjectedGrowthData(apiKey, currentTopic);
        source = 'gemini';
      } catch (error) {
        console.error('Gemini projection failed', error);
        growthError = growthError || (error instanceof Error ? error.message : 'Unable to fetch projection from Gemini.');
      }
    }

    if (data && data.length) {
      setProjectionData(data);
      if (source === 'growth') {
        setStatusMessage('Live projection served by Growth API');
      } else if (source === 'gemini') {
        setStatusMessage('Live Gemini projection');
      }
      if (growthError && source === 'gemini') {
        setErrorMessage(`Growth API failed (${growthError}). Gemini fallback is active.`);
      } else {
        setErrorMessage('');
      }
      setLastUpdated(new Date());
    } else {
      setProjectionData(createFallbackProjection(currentTopic));
      setStatusMessage('Showing illustrative projection');
      if (growthError) {
        setErrorMessage(`Live services unavailable: ${growthError}`);
      } else if (!apiKey) {
        setErrorMessage('Add a Gemini key or configure Growth API to activate live projections.');
      } else {
        setErrorMessage('Unable to fetch projection from Gemini.');
      }
      setLastUpdated(null);
    }

    setIsLoading(false);
  }, [apiKey]);

  useEffect(() => {
    let cancelled = false;
    const execute = async () => {
      if (cancelled) return;
      await runProjection(topic);
    };
    execute();
    return () => { cancelled = true; };
  }, [topic, runProjection]);

  const handleTopicSubmit = (event) => {
    event.preventDefault();
    const nextTopic = topicDraft.trim();
    if (!nextTopic || nextTopic === topic) {
      return;
    }
    setTopic(nextTopic);
  };

  const handleTopicChip = (preset) => {
    setTopicDraft(preset);
    setTopic(preset);
  };

  const handleSaveKey = (event) => {
    event.preventDefault();
    const trimmed = apiKeyDraft.trim();
    setApiKey(trimmed);
    persistKey(trimmed);
    if (!trimmed) {
      setStatusMessage('Illustrative projection. Add a Gemini API key to unlock live data.');
      setErrorMessage('');
      setLastUpdated(null);
    } else {
      setStatusMessage('Gemini key stored. Trigger a projection to refresh.');
    }
  };

  const handleClearKey = (event) => {
    event.preventDefault();
    setApiKey('');
    setApiKeyDraft('');
    persistKey('');
    setStatusMessage('Illustrative projection. Add a Gemini API key to unlock live data.');
    setErrorMessage('');
    setLastUpdated(null);
  };

  return (
    <div className="ai-visualizer">
      <div className="ai-visualizer__header">
        <span className="ai-visualizer__badge">Forecast Engine</span>
        <h2 className="ai-visualizer__title sora">
          Compound outcome planning for {topic}
        </h2>
        <p className="ai-visualizer__desc">
          Stream projections from Gemini or run simulated curves to see how quickly an intelligence
          capability will bend your revenue, opex, and control surfaces. Swap topics, capture deltas,
          and brief stakeholders in seconds.
        </p>
      </div>

      <div className="ai-visualizer__grid">
        <div className="ai-visualizer__left">
          <div className="ai-panel ai-panel--chart">
            <div className="ai-panel__heading">
              <h2 className="sora">Live trajectory</h2>
              {lastUpdated && (
                <span className="ai-panel__subtext">
                  Updated {lastUpdated.toLocaleTimeString()}
                </span>
              )}
            </div>
            <p className="ai-panel__subtext">
              Baseline vs. topic-specific acceleration indexed against a 1–1000 advancement score.
            </p>
            <div className="ai-chart-shell">
              {isLoading ? (
                <div className="ai-chart-placeholder">
                  <div className="visualizer-spinner">
                    <span className="spinner-dot" aria-hidden="true"></span>
                    <span className="spinner-label">Fetching projections…</span>
                  </div>
                </div>
              ) : (
                <LivingGraph topic={topic} projectionData={projectionData} />
              )}
            </div>
            <p className={`ai-status ${errorMessage ? 'is-error' : 'is-info'}`}>
              {errorMessage || statusMessage}
            </p>
          </div>

          <ScoreExplanation />
        </div>

        <aside className="ai-panel ai-panel--sidebar">
          <div className="ai-panel__heading">
            <h2 className="sora">Scenario controls</h2>
            <span className="ai-panel__subtext">Supply a Gemini API key to stream live data.</span>
          </div>
          <form className="ai-form" onSubmit={handleTopicSubmit}>
            <div className="ai-form__group">
              <span className="ai-form__label">Gemini API key</span>
              <div className="ai-form__row">
                <input
                  className="ai-input"
                  type="password"
                  placeholder="galaxy-..."
                  value={apiKeyDraft}
                  onChange={(event) => setApiKeyDraft(event.target.value)}
                />
                <button className="ai-button" type="button" onClick={handleSaveKey}>
                  Save key
                </button>
              </div>
              {apiKey && (
                <button className="ai-link" type="button" onClick={handleClearKey}>
                  Remove stored key
                </button>
              )}
            </div>

            <div className="ai-form__group">
              <span className="ai-form__label">Projection topic</span>
              <input
                className="ai-input"
                type="text"
                value={topicDraft}
                placeholder="e.g. Autonomous Risk Ops"
                onChange={(event) => setTopicDraft(event.target.value)}
                disabled={isLoading}
              />
            </div>

            <button
              className="ai-button"
              type="submit"
              disabled={isLoading || !topicDraft.trim() || topicDraft.trim() === topic}
            >
              {isLoading ? 'Projecting…' : 'Project growth'}
            </button>
          </form>

          <div>
            <span className="ai-form__label">Quick scenarios</span>
            <div className="ai-topic-list">
              {sampleTopics.map((preset) => (
                <button
                  key={preset}
                  className="ai-topic-chip"
                  type="button"
                  onClick={() => handleTopicChip(preset)}
                  disabled={isLoading}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          <div className="ai-meta">
            <strong>API usage</strong>
            <span>
              Gemini responses are parsed locally in the browser. Keys are stored in localStorage
              (if available) for convenience. Remove the key any time from this panel.
            </span>
          </div>
        </aside>
      </div>
    </div>
  );
};

const mountVisualizer = () => {
  const host = document.getElementById('ai-visualizer');
  if (!host) {
    return;
  }

  const root = createRoot(host);
  root.render(
    <React.StrictMode>
      <VisualizerApp />
    </React.StrictMode>
  );
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mountVisualizer, { once: true });
} else {
  mountVisualizer();
}
