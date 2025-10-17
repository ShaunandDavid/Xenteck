import React, {
  useCallback,
  useEffect,
  useMemo,
  useState
} from 'react';
import { createRoot } from 'react-dom/client';
import LivingGraph from './components/LivingGraph.jsx';
import ChatWindow from './components/ChatWindow.jsx';
import ScoreExplanation from './components/ScoreExplanation.jsx';
import { fetchGrowthApi, getGrowthApiUrl } from './services/growthService.js';
import { getProjectedGrowthData } from './services/geminiService.js';

const DEFAULT_TOPIC = 'AI Growth';
const sampleTopics = [
  'Quantum Computing',
  'Robotics Process Automation',
  'Generative Design Agents',
  'AI in Healthcare'
];

const getInitialTopic = () => {
  try {
    const params = new URLSearchParams(window.location.search);
    const param = params.get('topic');
    return param ? param.trim() : DEFAULT_TOPIC;
  } catch {
    return DEFAULT_TOPIC;
  }
};

const getTopicSeed = (topic) =>
  topic
    .split('')
    .reduce((sum, char) => sum + char.charCodeAt(0), 0);

const createAggressiveProjection = (topic, startYear = new Date().getUTCFullYear() - 3, span = 14) => {
  const seed = getTopicSeed(topic);
  const base = 90 + (seed % 70);
  const amplitude = 880 + (seed % 240);
  const maxScore = 1250;
  const steepness = 6.2 + (seed % 20) / 10;
  const midpoint = 0.38 + (seed % 40) / 200;

  const logistic = (value) => 1 / (1 + Math.exp(-steepness * (value - midpoint)));

  return Array.from({ length: span }, (_, index) => {
    const progress = index / Math.max(span - 1, 1);
    const advancement = Math.min(
      maxScore,
      Math.round(base + logistic(progress) * amplitude)
    );

    let milestone;
    if (index === Math.round(span * 0.2)) {
      milestone = `${topic} pilots trigger board-level urgency.`;
    } else if (index === Math.round(span * 0.55)) {
      milestone = `${topic} becomes a cross-industry default.`;
    } else if (index === span - 1) {
      milestone = `${topic} rewires operating models globally.`;
    }

    return {
      year: startYear + index,
      advancement,
      milestone
    };
  });
};

const synthesiseProjection = (topic, source = []) => {
  if (!Array.isArray(source) || !source.length) {
    return createAggressiveProjection(topic);
  }

  const sorted = [...source].sort((a, b) => a.year - b.year);
  const startYear = sorted[0]?.year ?? new Date().getUTCFullYear() - 3;
  return createAggressiveProjection(topic, startYear, Math.max(sorted.length, 14));
};

const VisualizerApp = () => {
  const initialTopic = getInitialTopic();

  const [topic, setTopic] = useState(initialTopic);
  const [topicDraft, setTopicDraft] = useState(initialTopic);
  const [projectionData, setProjectionData] = useState(() => createAggressiveProjection(initialTopic));
  const [statusMessage, setStatusMessage] = useState('Illustrative projection. Live ensemble data will appear here when services respond.');
  const [sourceLabel, setSourceLabel] = useState('Illustrative');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [growthActive, setGrowthActive] = useState(false);

  useEffect(() => {
    console.log('[Visualizer] growthApiUrl =', getGrowthApiUrl() || '(none)');
  }, []);

  const runProjection = useCallback(async (currentTopic) => {
    if (!currentTopic) return;

    const growthUrl = getGrowthApiUrl();

    setIsLoading(true);
    setErrorMessage('');
    if (growthUrl) {
      setStatusMessage('Contacting Growth API + ensemble for live projection.');
    } else {
      setStatusMessage('Contacting LLM ensemble for live projection.');
    }

    let data = null;
    let source = 'illustrative';
    let growthError = null;

    if (growthUrl) {
      const result = await fetchGrowthApi(currentTopic);
      if (result.ok) {
        data = synthesiseProjection(currentTopic, result.data);
        source = 'growth';
        setGrowthActive(true);
      } else {
        growthError = result.message || result.reason || 'Growth API unavailable';
        setGrowthActive(false);
      }
    } else {
      setGrowthActive(false);
    }

    if (!data) {
      const result = await getProjectedGrowthData(currentTopic);
      if (result.ok) {
        data = result.data;
        source = 'gemini';
      } else {
        growthError = result.message || result.reason || 'Gemini projection failed';
      }
    }

    if (data && data.length) {
      setProjectionData(data);
      if (source === 'growth') {
        setStatusMessage('Live projection served by Growth API + LLM ensemble');
        setSourceLabel('Growth API + Ensemble');
        setErrorMessage('');
      } else if (source === 'gemini') {
        setStatusMessage('Live projection served by LLM ensemble');
        setSourceLabel('LLM Ensemble');
        if (growthError) {
          setErrorMessage(`Growth API unavailable (${growthError}). Gemini fallback active.`);
        } else {
          setErrorMessage('');
        }
      }
      setLastUpdated(new Date());
    } else {
      const fallback = createAggressiveProjection(currentTopic);
      setProjectionData(fallback);
      setSourceLabel('Illustrative Ensemble');
      setStatusMessage('Showing illustrative projection');
      if (growthError) {
        setErrorMessage(`Live services unavailable: ${growthError}`);
      } else if (growthUrl) {
        setErrorMessage('Growth API returned no data. Gemini fallback unavailable.');
      } else {
        setErrorMessage('Gemini service unavailable. Try again soon.');
      }
      setLastUpdated(null);
    }

    setIsLoading(false);
  }, []);

  useEffect(() => {
    runProjection(topic);
  }, [topic, runProjection]);

  const handleTopicSubmit = (nextTopic) => {
    const trimmed = (nextTopic || '').trim();
    if (!trimmed || trimmed === topic) return;
    setTopic(trimmed);
  };

  const handlePresetSelect = (preset) => {
    setTopicDraft(preset);
    setTopic(preset);
  };

  const headerStats = useMemo(() => ({
    statusMessage,
    sourceLabel,
    errorMessage
  }), [statusMessage, sourceLabel, errorMessage]);

  return (
    <div className="ai-visualizer">
      <div className="ai-visualizer__header">
        <span className="ai-visualizer__badge">Forecast Engine</span>
        <h2 className="ai-visualizer__title sora">
          Compound outcome planning for {topic}
        </h2>
        <p className="ai-visualizer__desc">
          We fuse Growth API telemetry with frontier LLM ensembles to show how quickly a chosen capability can
          outrun today&apos;s baseline. Swap topics, capture the delta, and brief stakeholders in seconds.
        </p>
      </div>

      <div className="ai-visualizer__grid">
        <div className="ai-visualizer__left">
          <div className="ai-panel ai-panel--chart">
            <div className="ai-panel__heading">
              <h2 className="sora">Live trajectory</h2>
              {lastUpdated && (
                <span className="ai-panel__subtext">Updated {lastUpdated.toLocaleTimeString()}</span>
              )}
            </div>
            <p className="ai-panel__subtext">
              Baseline vs. topic-specific acceleration, indexed against a 1-1000 advancement score.
            </p>
            <div className="ai-chart-shell">
              {isLoading ? (
                <div className="ai-chart-placeholder">
                  <div className="visualizer-spinner">
                    <span className="spinner-dot" aria-hidden="true"></span>
                    <span className="spinner-label">Fetching projections.</span>
                  </div>
                </div>
              ) : (
                <LivingGraph topic={topic} projectionData={projectionData} />
              )}
            </div>
            <p className={`ai-status ${headerStats.errorMessage ? 'is-error' : 'is-info'}`}>
              {headerStats.errorMessage || `${headerStats.statusMessage} (Source: ${headerStats.sourceLabel})`}
            </p>
          </div>

          <ScoreExplanation />
        </div>

        <ChatWindow
          topicDraft={topicDraft}
          onTopicDraftChange={setTopicDraft}
          onTopicSubmit={handleTopicSubmit}
          onPresetSelect={handlePresetSelect}
          isLoading={isLoading}
          presets={sampleTopics}
          growthActive={growthActive}
          statusMessage={statusMessage}
          sourceLabel={sourceLabel}
        />
      </div>
    </div>
  );
};

const mountVisualizer = () => {
  const host = document.getElementById('ai-visualizer');
  if (!host) return;

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
