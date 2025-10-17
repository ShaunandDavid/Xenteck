import React from 'react';

const ScoreExplanation = () => (
  <div className="ai-panel ai-panel--explain">
    <div className="ai-panel__heading">
      <h2>Score Intelligence</h2>
    </div>
    <p className="ai-panel__subtext">
      Advancement Score blends capability, adoption velocity, capital inflow, and regulatory momentum on a 1-1000 scale for the selected domain.
    </p>
    <ul>
      <li><span>1-100:</span> Nascent, primarily research-grade.</li>
      <li><span>101-400:</span> Early adoption with measurable pilots.</li>
      <li><span>401-800:</span> Operates across industries with high ROI.</li>
      <li><span>801-1000:</span> Ubiquitous, market-defining, defensible.</li>
    </ul>
    <div className="ai-meta">
      <strong>Read the delta.</strong>
      <span>
        The dotted line is predictable pace. The neon sweep shows how fast your chosen field will bend operating models. The gap is the compounding edge - or erosion - you need to plan for. Projections are generated from a blended view of GPT-4o, Claude, Gemini, and Llama.
      </span>
    </div>
  </div>
);

export default ScoreExplanation;
