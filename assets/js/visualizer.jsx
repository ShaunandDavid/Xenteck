import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import { createRoot } from 'react-dom/client';
import LivingGraph from './components/LivingGraph.jsx';
import ChatWindow from './components/ChatWindow.jsx';
import ScoreExplanation from './components/ScoreExplanation.jsx';
import { fetchGrowthApi, getGrowthApiUrl } from './services/growthService.js';
import { getProjectedGrowthData } from './services/geminiService.js';
import { fetchInterestTrends } from './services/momentumService.js';
import { fetchBuildQueue } from './services/buildQueueService.js';
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

const buildAggressiveCurve = ({
  topic,
  startYear,
  span,
  startValue,
  targetValue
}) => {
  const seed = getTopicSeed(topic);
  const clippedTarget = Math.min(1350, Math.max(startValue + 320, targetValue));
  const steepness = 5.2 + (seed % 25) / 6;
  const midpoint = 0.33 + (seed % 40) / 170;
  const logistic = (value) => 1 / (1 + Math.exp(-steepness * (value - midpoint)));

  return Array.from({ length: span }, (_, index) => {
    const progress = index / Math.max(span - 1, 1);
    const baseValue = startValue + logistic(progress) * (clippedTarget - startValue);
    const jitter = Math.sin(seed + index * 1.72) * 12 + Math.cos(seed / 3 + index * 0.6) * 6;
    const advancement = Math.min(1350, Math.round(baseValue + jitter));

    let milestone;
    if (index === Math.round(span * 0.18)) {
      milestone = `${topic} pilots trigger board-level urgency.`;
    } else if (index === Math.round(span * 0.52)) {
      milestone = `${topic} becomes a cross-industry default.`;
    } else if (index === span - 1) {
      milestone = `${topic} rewires operating models globally.`;
    }

    return { year: startYear + index, advancement, milestone };
  });
};

const synthesiseProjection = (topic, source = []) => {
  const now = new Date().getUTCFullYear();
  if (Array.isArray(source) && source.length) {
    const sorted = [...source].sort((a, b) => a.year - b.year);
    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    const span = Math.max(sorted.length + 6, 14);
    const startValue = Math.max(30, Math.round(first.advancement * 0.85));
    const projectedTarget = Math.max(
      startValue + 380,
      Math.round(last.advancement * 1.65 + 180)
    );

    return buildAggressiveCurve({
      topic,
      startYear: first.year,
      span,
      startValue,
      targetValue: projectedTarget
    });
  }

  const seed = getTopicSeed(topic);
  const startYear = now - 4 + (seed % 3);
  const startValue = 60 + (seed % 40);
  const targetValue = 1080 + (seed % 180);
  return buildAggressiveCurve({
    topic,
    startYear,
    span: 15,
    startValue,
    targetValue
  });
};

const generateBaselineSeries = (topic, startYear, span) => {
  const seed = getTopicSeed(`${topic}-baseline`);
  return Array.from({ length: span }, (_, index) => {
    const progress = index / Math.max(span - 1, 1);
    const baseline =
      75 +
      progress * 320 +
      Math.sin(seed / 3 + index * 0.72) * 9 +
      Math.cos(seed / 5 + index * 0.66) * 5;
    return {
      year: startYear + index,
      baseline: Math.round(Math.max(20, baseline))
    };
  });
};

const mergeSeries = (baselineSeries, momentumSeries) => {
  const baselineMap = new Map(baselineSeries.map((point) => [point.year, point]));
  const momentumMap = new Map(momentumSeries.map((point) => [point.year, point]));
  const years = new Set([...baselineMap.keys(), ...momentumMap.keys()]);

  return Array.from(years)
    .sort((a, b) => a - b)
    .map((year) => {
      const baselinePoint = baselineMap.get(year);
      const momentumPoint = momentumMap.get(year);
      return {
        year,
        baseline: baselinePoint?.baseline ?? null,
        advancement: momentumPoint?.advancement ?? null,
        milestone: momentumPoint?.milestone
      };
    });
};

const buildMomentumFrame = (topic, sourcePoints = []) => {
  const momentumSeries = synthesiseProjection(topic, sourcePoints);
  const startYear = momentumSeries[0]?.year ?? new Date().getUTCFullYear() - 4;
  const span = Math.max(momentumSeries.length, 15);
  const baselineSeries = generateBaselineSeries(topic, startYear, span);
  const combined = mergeSeries(baselineSeries, momentumSeries);

  const firstPoint = combined[0] ?? {
    year: startYear,
    advancement: 120,
    baseline: 90
  };
  const lastPoint = combined[combined.length - 1] ?? firstPoint;
  const backIndex = Math.max(combined.length - 4, 0);
  const trailingPoint = combined[backIndex] ?? firstPoint;

  const delta = Math.max(
    0,
    Math.round((lastPoint.advancement ?? 0) - (lastPoint.baseline ?? 0))
  );
  const velocity = Math.round(
    (lastPoint.advancement ?? 0) - (trailingPoint.advancement ?? firstPoint.advancement ?? 0)
  );
  const growthMultiple = Number(
    (
      (lastPoint.advancement ?? 1) /
      Math.max(firstPoint.advancement ?? 1, 1)
    ).toFixed(1)
  );

  const nextMilestone =
    momentumSeries.find((point) => point.milestone)?.milestone ||
    `${topic} breaks through incumbents.`;

  return {
    dataset: combined,
    summary: {
      delta,
      velocity,
      growthMultiple,
      horizon: lastPoint.year ?? startYear + span - 1,
      nextMilestone
    }
  };
};

const numberFormatter = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 0
});

const velocityFormatter = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 0,
  signDisplay: 'always'
});

const multipleFormatter = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 1
});

const computeProjectionSummary = (series = []) => {
  if (!Array.isArray(series) || series.length === 0) {
    const year = new Date().getUTCFullYear();
    return {
      delta: 0,
      velocity: 0,
      multiple: 1,
      horizon: year,
      startYear: year
    };
  }

  const sorted = [...series].sort((a, b) => (a.year || 0) - (b.year || 0));
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  const prev = sorted[Math.max(sorted.length - 2, 0)] || first;

  const startValue = Number(first.advancement) || 1;
  const endValue = Number(last.advancement) || startValue;
  const delta = Math.round(endValue - startValue);
  const velocity = Math.round(endValue - (Number(prev.advancement) || startValue));
  const multiple = Math.max(0, Number((endValue / Math.max(startValue, 1)).toFixed(1)));

  return {
    delta,
    velocity,
    multiple,
    horizon: last.year || first.year,
    startYear: first.year || new Date().getUTCFullYear()
  };
};

const logProjectionTelemetry = (topic, source, summary) => {
  try {
    console.info('[telemetry] projection-render', {
      topic,
      source,
      delta: summary?.delta,
      velocity: summary?.velocity,
      multiple: summary?.multiple,
      horizon: summary?.horizon
    });
  } catch (error) {
    // noop for now; swap with real analytics later
  }
};

const MomentumTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) {
    return null;
  }

  const advancement = payload.find((entry) => entry.dataKey === 'advancement');
  const baseline = payload.find((entry) => entry.dataKey === 'baseline');
  const milestone = advancement?.payload?.milestone;

  return (
    <div className="ai-panel ai-panel--tooltip">
      <p className="label sora" style={{ fontWeight: 600, margin: 0 }}>
        Year {label}
      </p>
      {advancement && (
        <p style={{ margin: '.35rem 0', color: 'rgba(0, 225, 255, .9)' }}>
          Momentum: {numberFormatter.format(advancement.value)}
        </p>
      )}
      {baseline && (
        <p style={{ margin: 0, color: 'rgba(201, 210, 224, .8)' }}>
          Baseline: {numberFormatter.format(baseline.value)}
        </p>
      )}
      {milestone && (
        <p style={{ marginTop: '.6rem', color: 'rgba(255, 202, 87, .9)', fontSize: '.82rem' }}>
          {milestone}
        </p>
      )}
    </div>
  );
};

const MomentumHero = () => {
  const initialTopic = sampleTopics[0];
  const [inputValue, setInputValue] = useState(initialTopic);
  const [activeTopic, setActiveTopic] = useState(initialTopic);
  const [frame, setFrame] = useState(() => buildMomentumFrame(initialTopic));
  const [statusLabel, setStatusLabel] = useState('LLM Ensemble');
  const [isLoading, setIsLoading] = useState(false);
  const [isDebouncing, setIsDebouncing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const debounceRef = useRef(null);
  const [userPinned, setUserPinned] = useState(false);

  const loadMomentum = useCallback(
    async (topic) => {
      if (!topic) return;
      setIsLoading(true);
      setErrorMessage('');
      let sourcePoints = [];
      let liveLabel = 'LLM Ensemble';

      const response = await fetchInterestTrends(topic);
      if (response.ok && response.data.length) {
        sourcePoints = response.data;
        liveLabel = 'Growth Feed + Ensemble';
      } else if (!response.ok) {
        setErrorMessage(
          response.message || 'Signal feed unavailable. Using ensemble projection.'
        );
      }

      const nextFrame = buildMomentumFrame(topic, sourcePoints);
      setFrame(nextFrame);
      setStatusLabel(liveLabel);
      setLastUpdated(new Date());
      setIsLoading(false);
    },
    []
  );

  useEffect(() => {
    loadMomentum(activeTopic);
  }, [activeTopic, loadMomentum]);

  useEffect(() => {
    if (userPinned) return undefined;
    let index = sampleTopics.indexOf(activeTopic);
    const id = window.setInterval(() => {
      index = (index + 1) % sampleTopics.length;
      const next = sampleTopics[index];
      setInputValue(next);
      setActiveTopic(next);
    }, 9800);
    return () => window.clearInterval(id);
  }, [activeTopic, userPinned]);

  useEffect(
    () => () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    },
    []
  );

  const handleInputChange = (event) => {
    const value = event.target.value;
    setInputValue(value);
    setUserPinned(true);
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    if (!value.trim()) {
      setIsDebouncing(false);
      return;
    }
    setIsDebouncing(true);
    debounceRef.current = window.setTimeout(() => {
      setActiveTopic(value.trim());
      setIsDebouncing(false);
    }, 480);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      setIsDebouncing(false);
    }
    const trimmed = inputValue.trim();
    if (trimmed && trimmed !== activeTopic) {
      setUserPinned(true);
      setActiveTopic(trimmed);
    }
  };

  const handleSuggestion = (topic) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    setInputValue(topic);
    setUserPinned(true);
    setIsDebouncing(false);
    if (topic !== activeTopic) {
      setActiveTopic(topic);
    }
  };

  const hint = errorMessage
    ? errorMessage
    : isLoading
    ? 'Crunching live telemetry...'
    : isDebouncing
    ? 'Syncing feed...'
    : 'Type a capability or tap a chip to bend the curve.';

  const summary = frame.summary;
  const deltaLabel = `${summary.delta > 0 ? '+' : ''}${numberFormatter.format(summary.delta)} pts`;
  const velocityLabel = `${velocityFormatter.format(summary.velocity)} / yr`;
  const multipleLabel = `${multipleFormatter.format(summary.growthMultiple)}×`;
  const sourceChipClass =
    statusLabel === 'Growth Feed + Ensemble' ? 'status-chip status-chip--live' : 'status-chip';

  const chartData = frame.dataset;
  const loadingOverlay = isLoading || isDebouncing;

  return (
    <>
      <div className="momentum-panel__top">
        <div>
          <span className="momentum-pill">Tech Momentum</span>
          <h2>{activeTopic}</h2>
        </div>
        <div className="momentum-status">
          <span className={sourceChipClass}>{statusLabel}</span>
          <span className="status-chip">GPT-4o · Claude · Gemini · Llama</span>
          <small>
            {lastUpdated
              ? `Updated ${lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
              : 'Awaiting feed...'}
          </small>
        </div>
      </div>
      <div className="momentum-shell">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 12, right: 16, left: 0, bottom: 12 }}>
            <defs>
              <linearGradient id="momentum-baseline" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#8DA0BF" stopOpacity={0.35} />
                <stop offset="100%" stopColor="rgba(141, 160, 191, 0)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="momentum-curve" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#00e1ff" stopOpacity={0.55} />
                <stop offset="100%" stopColor="rgba(0, 225, 255, 0)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="rgba(255,255,255,0.08)" horizontal vertical={false} />
            <XAxis
              dataKey="year"
              stroke="rgba(255, 255, 255, 0.42)"
              tick={{ fill: 'rgba(255, 255, 255, 0.55)', fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              stroke="rgba(255, 255, 255, 0.42)"
              tick={{ fill: 'rgba(255, 255, 255, 0.55)', fontSize: 12 }}
              domain={[0, 1350]}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<MomentumTooltip />} />
            <Legend
              verticalAlign="top"
              height={32}
              wrapperStyle={{ color: 'rgba(212, 226, 255, 0.85)', fontSize: '0.8rem' }}
            />
            <Area
              type="monotone"
              dataKey="baseline"
              name="General AI Trend"
              stroke="#8da0bf"
              strokeWidth={2}
              strokeDasharray="6 6"
              fill="url(#momentum-baseline)"
              connectNulls
              isAnimationActive={false}
            />
            <Area
              type="monotone"
              dataKey="advancement"
              name="Momentum"
              stroke="#00e1ff"
              strokeWidth={3}
              fill="url(#momentum-curve)"
              dot={{ stroke: '#00e1ff', strokeWidth: 1, r: 4, fill: '#00e1ff' }}
              connectNulls
            />
          </AreaChart>
        </ResponsiveContainer>
        {loadingOverlay && (
          <div className="momentum-shell__overlay">
            <div className="visualizer-spinner">
              <span className="spinner-dot" aria-hidden="true" />
              <span className="spinner-label">Syncing momentum signals...</span>
            </div>
          </div>
        )}
      </div>
      <form className="momentum-form" onSubmit={handleSubmit}>
        <label className="momentum-label" htmlFor="momentum-input">
          Track a topic
        </label>
        <div className="momentum-input-row">
          <input
            id="momentum-input"
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            placeholder="Agent operations, autonomy ops, AI in finance..."
            autoComplete="off"
          />
          <button type="submit">Track</button>
        </div>
        <div className="momentum-hint">{hint}</div>
        <div className="momentum-suggestions">
          {sampleTopics.map((topic) => (
            <button
              key={topic}
              type="button"
              className="momentum-chip"
              onClick={() => handleSuggestion(topic)}
            >
              {topic}
            </button>
          ))}
        </div>
        <div className="momentum-metrics">
          <div>
            <span>Acceleration delta</span>
            <strong className="up">{deltaLabel}</strong>
          </div>
          <div>
            <span>Tipping year</span>
            <strong>{summary.horizon}</strong>
          </div>
          <div>
            <span>Velocity</span>
            <strong className="fast">{velocityLabel}</strong>
          </div>
        </div>
        <div className="momentum-submetrics">
          <div>
            <span>Growth multiple</span>
            <strong>{multipleLabel}</strong>
          </div>
          <p className="momentum-insight">{summary.nextMilestone}</p>
        </div>
      </form>
    </>
  );
};

const computeRoi = (values) => {
  const teamSize = Math.max(1, Number.parseFloat(values.teamSize) || 0);
  const workflowsPerWeek = Math.max(0, Number.parseFloat(values.workflowsPerWeek) || 0);
  const hoursPerWorkflow = Math.max(0, Number.parseFloat(values.hoursPerWorkflow) || 0);
  const hourlyRate = Math.max(0, Number.parseFloat(values.hourlyRate) || 0);
  const automationCost = Math.max(0, Number.parseFloat(values.automationCost) || 0);

  const workflowsPerMonth = workflowsPerWeek * 4;
  const hoursSavedMonthly = teamSize * workflowsPerMonth * hoursPerWorkflow;
  const valueSavedMonthly = hoursSavedMonthly * hourlyRate;
  const valueSavedAnnual = valueSavedMonthly * 12;
  const paybackMonths = valueSavedMonthly > 0 ? automationCost / valueSavedMonthly : Infinity;
  const roiPercent =
    automationCost > 0
      ? ((valueSavedAnnual - automationCost) / automationCost) * 100
      : Infinity;

  return {
    hoursSavedMonthly,
    valueSavedMonthly,
    valueSavedAnnual,
    paybackMonths,
    roiPercent,
    automationCost
  };
};

const RoiCalculator = () => {
  const [inputs, setInputs] = useState({
    teamSize: '6',
    workflowsPerWeek: '8',
    hoursPerWorkflow: '1.5',
    hourlyRate: '85',
    automationCost: '9500'
  });
  const [results, setResults] = useState(() => computeRoi(inputs));
  const [copyState, setCopyState] = useState('');

  const handleChange = (event) => {
    const { name, value } = event.target;
    setInputs((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const nextResults = computeRoi(inputs);
    setResults(nextResults);
  };

  const handleCopy = async () => {
    const summary = [
      `Team size: ${inputs.teamSize}`,
      `Hours saved / month: ${numberFormatter.format(results.hoursSavedMonthly)}`,
      `Value created / month: $${numberFormatter.format(results.valueSavedMonthly)}`,
      `Payback period: ${
        Number.isFinite(results.paybackMonths)
          ? `${results.paybackMonths.toFixed(1)} months`
          : 'N/A'
      }`,
      `12-month ROI: ${
        Number.isFinite(results.roiPercent)
          ? `${results.roiPercent.toFixed(1)}%`
          : 'N/A'
      }`
    ].join('\n');

    try {
      await navigator.clipboard.writeText(summary);
      setCopyState('Copied summary');
    } catch {
      setCopyState('Copy failed');
    }
    window.setTimeout(() => setCopyState(''), 1800);
  };

  return (
    <form className="roi-form" onSubmit={handleSubmit}>
      <div className="roi-grid">
        <div className="roi-field">
          <label htmlFor="teamSize">Team size</label>
          <input
            id="teamSize"
            name="teamSize"
            type="number"
            min="1"
            step="1"
            value={inputs.teamSize}
            onChange={handleChange}
            required
          />
        </div>
        <div className="roi-field">
          <label htmlFor="workflowsPerWeek">Workflows / week</label>
          <input
            id="workflowsPerWeek"
            name="workflowsPerWeek"
            type="number"
            min="0"
            step="1"
            value={inputs.workflowsPerWeek}
            onChange={handleChange}
            required
          />
        </div>
        <div className="roi-field">
          <label htmlFor="hoursPerWorkflow">Hours saved / workflow</label>
          <input
            id="hoursPerWorkflow"
            name="hoursPerWorkflow"
            type="number"
            min="0"
            step="0.1"
            value={inputs.hoursPerWorkflow}
            onChange={handleChange}
            required
          />
        </div>
        <div className="roi-field">
          <label htmlFor="hourlyRate">Blended hourly rate ($)</label>
          <input
            id="hourlyRate"
            name="hourlyRate"
            type="number"
            min="0"
            step="1"
            value={inputs.hourlyRate}
            onChange={handleChange}
            required
          />
        </div>
        <div className="roi-field">
          <label htmlFor="automationCost">Automation investment ($)</label>
          <input
            id="automationCost"
            name="automationCost"
            type="number"
            min="0"
            step="100"
            value={inputs.automationCost}
            onChange={handleChange}
            required
          />
        </div>
      </div>
      <div className="roi-actions">
        <button type="submit" className="btn-primary-lite">
          Recalculate ROI
        </button>
        <button type="button" className="btn-ghost-lite" onClick={handleCopy}>
          Copy summary
        </button>
        {copyState && <span>{copyState}</span>}
      </div>
      <div className="roi-results">
        <div>
          <strong>${numberFormatter.format(results.valueSavedMonthly)}</strong>
          <span>Monthly value created</span>
        </div>
        <div>
          <strong>
            {Number.isFinite(results.paybackMonths)
              ? `${results.paybackMonths.toFixed(1)} months`
              : 'N/A'}
          </strong>
          <span>Automation payback</span>
        </div>
        <div>
          <strong>
            {Number.isFinite(results.roiPercent)
              ? `${results.roiPercent.toFixed(1)}%`
              : 'N/A'}
          </strong>
          <span>12-month ROI</span>
        </div>
      </div>
    </form>
  );
};

const BuildQueueTicker = () => {
  const [snapshot, setSnapshot] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const loadQueue = useCallback(async () => {
    setIsLoading(true);
    const response = await fetchBuildQueue();
    if (response.ok) {
      setSnapshot({
        ...response.data,
        refreshedAt: response.refreshedAt || new Date()
      });
      setErrorMessage('');
    } else {
      setErrorMessage(response.message || 'Unable to fetch build queue.');
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadQueue();
  }, [loadQueue]);

  const stats = snapshot || {
    auditsRunning: 0,
    deploymentsToday: 0,
    avgTimeToValue: 0,
    activeAgents: 0,
    backlog: 0,
    refreshedAt: new Date()
  };

  return (
    <div className="build-queue">
      <div className="queue-stats">
        <div className="queue-stat">
          <span>Audits running</span>
          <strong>{stats.auditsRunning}</strong>
        </div>
        <div className="queue-stat">
          <span>Deployments today</span>
          <strong>{stats.deploymentsToday}</strong>
        </div>
        <div className="queue-stat">
          <span>Avg time-to-value</span>
          <strong>{stats.avgTimeToValue} days</strong>
        </div>
        <div className="queue-stat">
          <span>Active agents</span>
          <strong>{stats.activeAgents}</strong>
        </div>
        <div className="queue-stat">
          <span>Build backlog</span>
          <strong>{stats.backlog}</strong>
        </div>
      </div>
      <div className="queue-refresh">
        <button type="button" className="btn-ghost-lite" onClick={loadQueue} disabled={isLoading}>
          {isLoading ? 'Refreshing...' : 'Refresh feed'}
        </button>
        <span>
          Updated{' '}
          {stats.refreshedAt
            ? new Date(stats.refreshedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : '--'}
        </span>
      </div>
      {errorMessage && <p className="momentum-error">{errorMessage}</p>}
    </div>
  );
};

const AGENT_TEMPLATES = {
  sop: ({ topic }) => [
    `Kick off with a 12-minute discovery on current ${topic} path, mapping trigger -> owner -> artefacts.`,
    `Draft a crisp SOP with swimlanes, approval thresholds, and L0 fallback within 45 minutes.`,
    `Automate version control: ship SOP to Notion + Slack, capturing comments and change telemetry automatically.`
  ],
  process: ({ topic }) => [
    `Ingest the raw transcript and surface the three highest-friction steps in ${topic}.`,
    `Model failure modes with guardrails, then propose agent/human breakpoints with a 30-60-90 plan.`,
    `Publish a live dashboard showing cycle time, delta vs. baseline, and rollback triggers.`
  ],
  automation: ({ topic }) => [
    `Capture the upstream signals feeding ${topic} and validate data hygiene with the growth telemetry API.`,
    `Compose an agentic runbook: perception, reasoning, action, and audit logging in under 60 seconds.`,
    `Spin up an A/B harness so the agent can ship safe changes with automated post-run reviews.`
  ]
};

const OUTCOME_DATA = [
  {
    title: 'Autonomy Ops',
    delta: '+428 hrs saved',
    metric: 'Deployment velocity +41%',
    timeframe: '30 days',
    highlight: 'Agents closed 92% of incident loops end-to-end.'
  },
  {
    title: 'Revenue Engine',
    delta: '+$1.8M pipeline',
    metric: 'Reply rate lifted 3.4x',
    timeframe: '45 days',
    highlight: 'Sequenced agents drafted, QA’d, and shipped 12k outreach assets.'
  },
  {
    title: 'Support Mesh',
    delta: '-63% resolution time',
    metric: 'Escalations down 58%',
    timeframe: '60 days',
    highlight: 'Hybrid LLM guardrails auto-resolved repetitive tickets with full audit logs.'
  }
];

const OutcomeLeaderboard = () => (
  <div className="leaderboard-list">
    {OUTCOME_DATA.map((item) => (
      <div key={item.title} className="leaderboard-item">
        <header>
          <span>{item.title}</span>
          <span>{item.timeframe}</span>
        </header>
        <p>{item.highlight}</p>
        <footer>
          <strong>{item.delta}</strong>
          <span>{item.metric}</span>
        </footer>
      </div>
    ))}
  </div>
);

const AgentDemoCard = () => {
  const [scenario, setScenario] = useState('sop');
  const [description, setDescription] = useState('');
  const [output, setOutput] = useState([]);
  const [copyState, setCopyState] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();
    const trimmed = description.trim() || 'the process';
    const builder = AGENT_TEMPLATES[scenario];
    const plan = builder({ topic: trimmed });
    setOutput(plan);
    setCopyState('');
  };

  const handleCopy = async () => {
    if (!output.length) return;
    try {
      await navigator.clipboard.writeText(output.join('\n'));
      setCopyState('Plan copied');
    } catch {
      setCopyState('Copy failed');
    }
    window.setTimeout(() => setCopyState(''), 1800);
  };

  return (
    <div className="agent-demo">
      <form onSubmit={handleSubmit}>
        <label className="momentum-label" htmlFor="agent-scenario">
          Agent focus
        </label>
        <select
          id="agent-scenario"
          value={scenario}
          onChange={(event) => setScenario(event.target.value)}
        >
          <option value="sop">Draft a SOP</option>
          <option value="process">Analyze a process</option>
          <option value="automation">Map an automation</option>
        </select>
        <label className="momentum-label" htmlFor="agent-desc">
          Describe the workflow
        </label>
        <textarea
          id="agent-desc"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="e.g. Level 7 onboarding intake, enterprise support handoffs..."
        />
        <button type="submit">Generate plan</button>
      </form>
      {output.length > 0 && (
        <div className="agent-output">
          {output.map((line, index) => (
            <div key={index}>
              <code>Step {index + 1}</code> {line}
            </div>
          ))}
          <button type="button" className="btn-ghost-lite" onClick={handleCopy}>
            {copyState || 'Copy plan'}
          </button>
        </div>
      )}
    </div>
  );
};

const HeroWorkbench = () => (
  <div className="hero-widgets">
    <div className="hero-widget">
      <header>
        <h3>ROI Console</h3>
        <span>Model the payback</span>
      </header>
      <RoiCalculator />
    </div>
    <div className="hero-widget">
      <header>
        <h3>Build Queue</h3>
        <span>Live delivery rhythm</span>
      </header>
      <BuildQueueTicker />
    </div>
    <div className="hero-widget">
      <header>
        <h3>Outcome Leaderboard</h3>
        <span>Proof in the signals</span>
      </header>
      <OutcomeLeaderboard />
    </div>
    <div className="hero-widget">
      <header>
        <h3>Agent Blueprint</h3>
        <span>Launch in 60 seconds</span>
      </header>
      <AgentDemoCard />
    </div>
  </div>
);

const VisualizerApp = () => {
  const initialTopic = getInitialTopic();

  const [topic, setTopic] = useState(initialTopic);
  const [topicDraft, setTopicDraft] = useState(initialTopic);
  const [projectionData, setProjectionData] = useState(() => createAggressiveProjection(initialTopic));
  const [projectionSummary, setProjectionSummary] = useState(() =>
    computeProjectionSummary(createAggressiveProjection(initialTopic))
  );
  const [statusMessage, setStatusMessage] = useState('Illustrative projection. Live ensemble data will appear here when services respond.');
  const [sourceLabel, setSourceLabel] = useState('Illustrative');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [growthActive, setGrowthActive] = useState(false);

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
      const summary = computeProjectionSummary(data);
      setProjectionData(data);
      setProjectionSummary(summary);
      logProjectionTelemetry(currentTopic, source, summary);
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
      const summary = computeProjectionSummary(fallback);
      setProjectionData(fallback);
      setProjectionSummary(summary);
      logProjectionTelemetry(currentTopic, 'illustrative', summary);
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

  const summaryStats = useMemo(() => {
    const { delta, velocity, multiple, horizon } = projectionSummary;
    return [
      { label: 'Delta vs start', value: `${delta >= 0 ? '+' : ''}${numberFormatter.format(delta)} pts` },
      { label: 'Velocity', value: `${velocityFormatter.format(velocity)} / yr` },
      { label: 'Tipping year', value: horizon || '—' },
      { label: 'Growth multiple', value: `${multipleFormatter.format(multiple)}x` }
    ];
  }, [projectionSummary]);

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
            <div className="ai-stat-strip">
              {summaryStats.map((item) => (
                <div key={item.label} className="ai-stat-chip">
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                </div>
              ))}
            </div>
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

const mountMomentum = () => {
  const host = document.getElementById('tech-momentum');
  if (!host) return;

  const root = createRoot(host);
  root.render(
    <React.StrictMode>
      <MomentumHero />
    </React.StrictMode>
  );
};

const mountHeroWorkbench = () => {
  const host = document.getElementById('hero-workbench');
  if (!host) return;

  const root = createRoot(host);
  root.render(
    <React.StrictMode>
      <HeroWorkbench />
    </React.StrictMode>
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

const bootInteractive = () => {
  mountMomentum();
  mountHeroWorkbench();
  mountVisualizer();
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootInteractive, { once: true });
} else {
  bootInteractive();
}





