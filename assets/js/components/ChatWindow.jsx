import React, { useEffect, useState } from 'react';

const DEFAULT_PRESETS = [
  'Autonomous Logistics',
  'GenAI Sales Co-Pilots',
  'Quantum Machine Learning',
  'Autonomous Bioengineering',
  'AI-Driven Compliance',
  'Robotics Process Automation',
  'Intelligent Edge Vision',
  'Predictive Healthcare Agents'
];

const ChatWindow = ({
  topicDraft,
  onTopicDraftChange,
  onTopicSubmit,
  onPresetSelect,
  isLoading,
  presets = DEFAULT_PRESETS,
  growthActive,
  statusMessage,
  sourceLabel
}) => {
  const [localTopic, setLocalTopic] = useState(topicDraft);

  useEffect(() => {
    setLocalTopic(topicDraft);
  }, [topicDraft]);

  const handleSubmit = (event) => {
    event.preventDefault();
    const trimmed = (localTopic || '').trim();
    if (!trimmed) return;
    onTopicDraftChange(trimmed);
    onTopicSubmit(trimmed);
  };

  const handleTopicChange = (event) => {
    const value = event.target.value;
    setLocalTopic(value);
    onTopicDraftChange(value);
  };

  const handlePreset = (preset) => {
    setLocalTopic(preset);
    onTopicDraftChange(preset);
    onPresetSelect(preset);
  };

  return (
    <aside className="ai-panel ai-panel--sidebar">
      <div className="ai-panel__heading">
        <h2 className="sora">Scenario controls</h2>
        <span className="ai-panel__subtext">
          {growthActive
            ? 'Live feed blends Growth API telemetry with ensembles of GPT-4o, Claude, Gemini, and Llama.'
            : 'We synthesise projections with a four-model LLM ensemble tuned for acceleration signals.'}
        </span>
      </div>

      <form className="ai-form" onSubmit={handleSubmit}>
        <div className="ai-form__group">
          <span className="ai-form__label">Projection topic</span>
          <input
            className="ai-input"
            type="text"
            value={localTopic}
            placeholder="e.g. Autonomous Risk Ops"
            onChange={handleTopicChange}
            disabled={isLoading}
          />
        </div>

        <button
          className="ai-button"
          type="submit"
          disabled={isLoading || !(localTopic || '').trim()}
        >
          {isLoading ? 'Projecting.' : 'Project growth'}
        </button>
      </form>

      <div>
        <span className="ai-form__label">Quick scenarios</span>
        <div className="ai-topic-list">
          {presets.map((preset) => (
            <button
              key={preset}
              className="ai-topic-chip"
              type="button"
              onClick={() => handlePreset(preset)}
              disabled={isLoading}
            >
              {preset}
            </button>
          ))}
        </div>
      </div>

      <div className="ai-meta">
        <strong>Feed status</strong>
        <span>{statusMessage} {sourceLabel ? `(Source: ${sourceLabel})` : ''}</span>
      </div>
    </aside>
  );
};

export default ChatWindow;
