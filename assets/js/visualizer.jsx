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
  'Autonomous Logistics',
  'GenAI Sales Co-Pilots',
  'Quantum Machine Learning',
  'Autonomous Bioengineering',
  'AI-Driven Compliance',
  'Robotics Process Automation',
  'Intelligent Edge Vision',
  'Predictive Healthcare Agents'
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

const createFallbackProjection = (topic) => {
  const currentYear = new Date().getUTCFullYear();
  const startYear = currentYear - 6;
  const span = 12;

  return Array.from({ length: span }, (_, index) => {
    const year = startYear + index;
    const growth = Math.min(
      1000,
      Math.round(12 * Math.pow(1.34, index + 1) * (1 + index * 0.18))
    );
    const milestone = index % 3 === 0 ? `${topic} breakthrough expected` : undefined;

    return { year, advancement: growth, milestone };
  });
};

const VisualizerApp = () => {
  const initialTopic = getInitialTopic();

  const [topic, setTopic] = useState(initialTopic);
  const [topicDraft, setTopicDraft] = useState(initialTopic);
  const [projectionData, setProjectionData] = useState(() => createFallbackProjection(initialTopic));
  const [statusMessage, setStatusMessage] = useState('Illustrative projection. Growth API or Gemini live data will appear here when available.');
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
      setStatusMessage('Contacting Growth API for live projection.');
    } else {
      setStatusMessage('Contacting Gemini service for live projection.');
    }

    let data = null;
    let source = 'illustrative';
    let growthError = null;

    if (growthUrl) {
      const result = await fetchGrowthApi(currentTopic);
      if (result.ok) {
        data = result.data;
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
        setStatusMessage('Live projection served by Growth API');
        setSourceLabel('Growth API');
        setErrorMessage('');
      } else if (source === 'gemini') {
        setStatusMessage('Live Gemini projection');
        setSourceLabel('Gemini');
        if (growthError) {
          setErrorMessage(`Growth API unavailable (${growthError}). Gemini fallback active.`);
        } else {
          setErrorMessage('');
        }
      }
      setLastUpdated(new Date());
    } else {
      const fallback = createFallbackProjection(currentTopic);
      setProjectionData(fallback);
      setSourceLabel('Illustrative');
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
          Stream Growth API projections or fall back to Gemini to see how fast emerging intelligence reshapes
          your operating model. Swap topics, capture deltas, and brief stakeholders in seconds.
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
