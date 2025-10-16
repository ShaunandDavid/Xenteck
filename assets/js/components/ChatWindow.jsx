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
  apiKeyDraft,
  onApiKeyDraftChange,
  onSaveKey,
  onClearKey,
  hasStoredKey,
  presets = DEFAULT_PRESETS,
  growthActive,
  statusMessage,
  sourceLabel
}) => {
  const [localTopic, setLocalTopic] = useState(topicDraft);
  const [localKey, setLocalKey] = useState(apiKeyDraft);

  useEffect(() => {
    setLocalTopic(topicDraft);
  }, [topicDraft]);

  useEffect(() => {
    setLocalKey(apiKeyDraft);
  }, [apiKeyDraft]);

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

  const handleKeyInput = (event) => {
    const value = event.target.value;
    setLocalKey(value);
    onApiKeyDraftChange(value);
  };

  const handleSaveKey = () => {
    onSaveKey((localKey || '').trim());
  };

  return (
    <aside className="ai-panel ai-panel--sidebar">
      <div className="ai-panel__heading">
        <h2 className="sora">Scenario controls</h2>
        {growthActive ? (
          <span className="ai-panel__subtext">
            Growth API is powering live projections. Gemini remains optional for hybrid insights.
          </span>
        ) : (
          <span className="ai-panel__subtext">
            Add a Gemini API key or configure Growth API to stream live trajectories.
          </span>
        )}
      </div>

      <form className="ai-form" onSubmit={handleSubmit}>
        <div className="ai-form__group">
          <span className="ai-form__label">Gemini API key</span>
          <div className="ai-form__row">
            <input
              className="ai-input"
              type="password"
              placeholder="galaxy-..."
              value={localKey}
              onChange={handleKeyInput}
            />
            <button className="ai-button" type="button" onClick={handleSaveKey}>
              Save key
            </button>
          </div>
          {hasStoredKey && (
            <button className="ai-link" type="button" onClick={onClearKey}>
              Remove stored key
            </button>
          )}
        </div>

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
