import React, { useMemo } from 'react';
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

const baselineData = [
  { year: 2010, advancement: 12, milestone: 'Deep Learning breakthroughs begin' },
  { year: 2012, advancement: 18, milestone: 'AlexNet wins ImageNet' },
  { year: 2014, advancement: 34, milestone: 'GANs are introduced' },
  { year: 2016, advancement: 58, milestone: 'AlphaGo beats Lee Sedol' },
  { year: 2018, advancement: 92, milestone: 'Transformers hit production workloads' },
  { year: 2020, advancement: 140, milestone: 'Foundation models enter enterprise pilots' },
  { year: 2022, advancement: 190, milestone: 'Diffusion and GPT-4 become table stakes' },
  { year: 2024, advancement: 240, milestone: 'Agentic workflows emerge across teams' },
  { year: 2026, advancement: 310 },
  { year: 2028, advancement: 380 },
  { year: 2030, advancement: 450 }
];

const mergeBaselineWithProjection = (projectionData = [], topic) => {
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
      <AreaChart data={combinedData} margin={{ top: 16, right: 64, left: 32, bottom: 32 }}>
        <defs>
          <linearGradient id="baseline-gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#90a0ba" stopOpacity={0.55} />
            <stop offset="100%" stopColor="rgba(144, 160, 186, 0)" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="projection-gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#00e1ff" stopOpacity={0.45} />
            <stop offset="100%" stopColor="rgba(0, 225, 255, 0)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
        <XAxis
          dataKey="year"
          stroke="rgba(255, 255, 255, 0.45)"
          tick={{ fill: 'rgba(255, 255, 255, 0.55)', fontSize: 12 }}
          type="number"
          domain={['dataMin', 'dataMax']}
          allowDecimals={false}
        />
        <YAxis
          stroke="rgba(255, 255, 255, 0.45)"
          tick={{ fill: 'rgba(255, 255, 255, 0.55)', fontSize: 12 }}
          domain={[0, 1300]}
          label={{
            value: 'Advancement Score',
            angle: -90,
            position: 'insideLeft',
            fill: 'rgba(255,255,255,0.6)',
            fontSize: 13,
            dy: 50
          }}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend verticalAlign="top" height={36} iconType="circle" />
        <Area
          type="monotone"
          dataKey="baseline"
          name="General AI Trend"
          stroke="#90a0ba"
          strokeWidth={2}
          strokeDasharray="5 5"
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

export default LivingGraph;
