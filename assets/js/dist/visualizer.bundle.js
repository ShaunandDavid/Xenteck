// assets/js/visualizer.jsx
import React4, {
  useCallback,
  useEffect as useEffect2,
  useMemo as useMemo2,
  useState as useState2
} from "react";
import { createRoot } from "react-dom/client";

// assets/js/components/LivingGraph.jsx
import React, { useMemo } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from "recharts";
var baselineData = [
  { year: 2010, advancement: 5, milestone: "Deep Learning breakthroughs begin" },
  { year: 2012, advancement: 10, milestone: "AlexNet wins ImageNet" },
  { year: 2014, advancement: 20, milestone: "GANs are introduced" },
  { year: 2016, advancement: 35, milestone: "AlphaGo beats Lee Sedol" },
  { year: 2018, advancement: 60, milestone: "BERT transformer model released" },
  { year: 2020, advancement: 100, milestone: "GPT-3 showcases advanced text generation" },
  { year: 2022, advancement: 180, milestone: "Diffusion models popularize AI art" },
  { year: 2024, advancement: 300, milestone: "Multi-modality models become mainstream" },
  { year: 2026, advancement: 500 },
  { year: 2028, advancement: 800 },
  { year: 2030, advancement: 1e3 }
];
var mergeBaselineWithProjection = (projectionData = [], topic) => {
  const projectionMap = new Map(projectionData.map((point) => [point.year, point]));
  const allYears = /* @__PURE__ */ new Set([
    ...baselineData.map((point) => point.year),
    ...projectionData.map((point) => point.year)
  ]);
  return Array.from(allYears).sort((a, b) => a - b).map((year) => {
    const baselinePoint = baselineData.find((point) => point.year === year);
    const projectionPoint = projectionMap.get(year);
    return {
      year,
      baseline: baselinePoint ? baselinePoint.advancement : void 0,
      advancement: projectionPoint ? projectionPoint.advancement : void 0,
      milestone: projectionPoint?.milestone,
      topic
    };
  });
};
var CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) {
    return null;
  }
  const projection = payload.find((entry) => entry.dataKey === "advancement");
  const baseline = payload.find((entry) => entry.dataKey === "baseline");
  const dataPoint = projection?.payload;
  return /* @__PURE__ */ React.createElement("div", { className: "ai-panel ai-panel--tooltip" }, /* @__PURE__ */ React.createElement("p", { className: "label sora", style: { fontWeight: 600, margin: 0 } }, "Year ", label), projection && /* @__PURE__ */ React.createElement("p", { style: { margin: ".35rem 0", color: "rgba(0, 225, 255, .9)" } }, projection.name, ": ", projection.value), baseline && /* @__PURE__ */ React.createElement("p", { style: { margin: 0, color: "rgba(201, 210, 224, .8)" } }, "Baseline: ", baseline.value), dataPoint?.milestone && /* @__PURE__ */ React.createElement("p", { style: { marginTop: ".6rem", color: "rgba(255, 202, 87, .9)", fontSize: ".82rem" } }, "Milestone: ", dataPoint.milestone));
};
var LivingGraph = ({ topic, projectionData }) => {
  const combinedData = useMemo(
    () => mergeBaselineWithProjection(projectionData, topic),
    [projectionData, topic]
  );
  return /* @__PURE__ */ React.createElement(ResponsiveContainer, { width: "100%", height: "100%" }, /* @__PURE__ */ React.createElement(AreaChart, { data: combinedData, margin: { top: 10, right: 24, left: 16, bottom: 0 } }, /* @__PURE__ */ React.createElement("defs", null, /* @__PURE__ */ React.createElement("linearGradient", { id: "baseline-gradient", x1: "0", y1: "0", x2: "0", y2: "1" }, /* @__PURE__ */ React.createElement("stop", { offset: "0%", stopColor: "#90a0ba", stopOpacity: 0.55 }), /* @__PURE__ */ React.createElement("stop", { offset: "100%", stopColor: "rgba(144, 160, 186, 0)", stopOpacity: 0 })), /* @__PURE__ */ React.createElement("linearGradient", { id: "projection-gradient", x1: "0", y1: "0", x2: "0", y2: "1" }, /* @__PURE__ */ React.createElement("stop", { offset: "0%", stopColor: "#00e1ff", stopOpacity: 0.45 }), /* @__PURE__ */ React.createElement("stop", { offset: "100%", stopColor: "rgba(0, 225, 255, 0)", stopOpacity: 0 }))), /* @__PURE__ */ React.createElement(CartesianGrid, { strokeDasharray: "3 3", stroke: "rgba(255,255,255,0.08)" }), /* @__PURE__ */ React.createElement(
    XAxis,
    {
      dataKey: "year",
      stroke: "rgba(255, 255, 255, 0.45)",
      tick: { fill: "rgba(255, 255, 255, 0.55)", fontSize: 12 },
      type: "number",
      domain: ["dataMin", "dataMax"],
      allowDecimals: false
    }
  ), /* @__PURE__ */ React.createElement(
    YAxis,
    {
      stroke: "rgba(255, 255, 255, 0.45)",
      tick: { fill: "rgba(255, 255, 255, 0.55)", fontSize: 12 },
      domain: [0, 1100],
      label: {
        value: "Advancement Score",
        angle: -90,
        position: "insideLeft",
        fill: "rgba(255,255,255,0.6)",
        fontSize: 13,
        dy: 50
      }
    }
  ), /* @__PURE__ */ React.createElement(Tooltip, { content: /* @__PURE__ */ React.createElement(CustomTooltip, null) }), /* @__PURE__ */ React.createElement(Legend, { verticalAlign: "top", height: 36, iconType: "circle" }), /* @__PURE__ */ React.createElement(
    Area,
    {
      type: "monotone",
      dataKey: "baseline",
      name: "General AI Trend",
      stroke: "#90a0ba",
      strokeWidth: 2,
      strokeDasharray: "5 5",
      fill: "url(#baseline-gradient)",
      connectNulls: true,
      isAnimationActive: false
    }
  ), /* @__PURE__ */ React.createElement(
    Area,
    {
      type: "monotone",
      dataKey: "advancement",
      name: `${topic} projection`,
      stroke: "#00e1ff",
      strokeWidth: 3,
      fill: "url(#projection-gradient)",
      dot: { stroke: "#00e1ff", strokeWidth: 1, r: 3, fill: "#00e1ff" },
      connectNulls: true
    }
  )));
};
var LivingGraph_default = LivingGraph;

// assets/js/components/ChatWindow.jsx
import React2, { useEffect, useState } from "react";
var DEFAULT_PRESETS = [
  "Autonomous Logistics",
  "GenAI Sales Co-Pilots",
  "Quantum Machine Learning",
  "Autonomous Bioengineering",
  "AI-Driven Compliance",
  "Robotics Process Automation",
  "Intelligent Edge Vision",
  "Predictive Healthcare Agents"
];
var ChatWindow = ({
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
    const trimmed = (localTopic || "").trim();
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
    onSaveKey((localKey || "").trim());
  };
  return /* @__PURE__ */ React2.createElement("aside", { className: "ai-panel ai-panel--sidebar" }, /* @__PURE__ */ React2.createElement("div", { className: "ai-panel__heading" }, /* @__PURE__ */ React2.createElement("h2", { className: "sora" }, "Scenario controls"), growthActive ? /* @__PURE__ */ React2.createElement("span", { className: "ai-panel__subtext" }, "Growth API is powering live projections. Gemini remains optional for hybrid insights.") : /* @__PURE__ */ React2.createElement("span", { className: "ai-panel__subtext" }, "Add a Gemini API key or configure Growth API to stream live trajectories.")), /* @__PURE__ */ React2.createElement("form", { className: "ai-form", onSubmit: handleSubmit }, /* @__PURE__ */ React2.createElement("div", { className: "ai-form__group" }, /* @__PURE__ */ React2.createElement("span", { className: "ai-form__label" }, "Gemini API key"), /* @__PURE__ */ React2.createElement("div", { className: "ai-form__row" }, /* @__PURE__ */ React2.createElement(
    "input",
    {
      className: "ai-input",
      type: "password",
      placeholder: "galaxy-...",
      value: localKey,
      onChange: handleKeyInput
    }
  ), /* @__PURE__ */ React2.createElement("button", { className: "ai-button", type: "button", onClick: handleSaveKey }, "Save key")), hasStoredKey && /* @__PURE__ */ React2.createElement("button", { className: "ai-link", type: "button", onClick: onClearKey }, "Remove stored key")), /* @__PURE__ */ React2.createElement("div", { className: "ai-form__group" }, /* @__PURE__ */ React2.createElement("span", { className: "ai-form__label" }, "Projection topic"), /* @__PURE__ */ React2.createElement(
    "input",
    {
      className: "ai-input",
      type: "text",
      value: localTopic,
      placeholder: "e.g. Autonomous Risk Ops",
      onChange: handleTopicChange,
      disabled: isLoading
    }
  )), /* @__PURE__ */ React2.createElement(
    "button",
    {
      className: "ai-button",
      type: "submit",
      disabled: isLoading || !(localTopic || "").trim()
    },
    isLoading ? "Projecting." : "Project growth"
  )), /* @__PURE__ */ React2.createElement("div", null, /* @__PURE__ */ React2.createElement("span", { className: "ai-form__label" }, "Quick scenarios"), /* @__PURE__ */ React2.createElement("div", { className: "ai-topic-list" }, presets.map((preset) => /* @__PURE__ */ React2.createElement(
    "button",
    {
      key: preset,
      className: "ai-topic-chip",
      type: "button",
      onClick: () => handlePreset(preset),
      disabled: isLoading
    },
    preset
  )))), /* @__PURE__ */ React2.createElement("div", { className: "ai-meta" }, /* @__PURE__ */ React2.createElement("strong", null, "Feed status"), /* @__PURE__ */ React2.createElement("span", null, statusMessage, " ", sourceLabel ? `(Source: ${sourceLabel})` : "")));
};
var ChatWindow_default = ChatWindow;

// assets/js/components/ScoreExplanation.jsx
import React3 from "react";
var ScoreExplanation = () => /* @__PURE__ */ React3.createElement("div", { className: "ai-panel ai-panel--explain" }, /* @__PURE__ */ React3.createElement("div", { className: "ai-panel__heading" }, /* @__PURE__ */ React3.createElement("h2", null, "Score Intelligence")), /* @__PURE__ */ React3.createElement("p", { className: "ai-panel__subtext" }, "Advancement Score blends capability, adoption velocity, capital inflow, and regulatory momentum on a 1-1000 scale for the selected domain."), /* @__PURE__ */ React3.createElement("ul", null, /* @__PURE__ */ React3.createElement("li", null, /* @__PURE__ */ React3.createElement("span", null, "1-100:"), " Nascent, primarily research-grade."), /* @__PURE__ */ React3.createElement("li", null, /* @__PURE__ */ React3.createElement("span", null, "101-400:"), " Early adoption with measurable pilots."), /* @__PURE__ */ React3.createElement("li", null, /* @__PURE__ */ React3.createElement("span", null, "401-800:"), " Operates across industries with high ROI."), /* @__PURE__ */ React3.createElement("li", null, /* @__PURE__ */ React3.createElement("span", null, "801-1000:"), " Ubiquitous, market-defining, defensible.")), /* @__PURE__ */ React3.createElement("div", { className: "ai-meta" }, /* @__PURE__ */ React3.createElement("strong", null, "Read the delta."), /* @__PURE__ */ React3.createElement("span", null, "The dotted line is predictable pace. The neon sweep shows how fast your chosen field will bend operating models. The gap is the compounding edge\u2014or erosion\u2014you need to plan for.")));
var ScoreExplanation_default = ScoreExplanation;

// assets/js/services/growthService.js
var normaliseExternalPoints = (payload) => {
  if (!payload) return [];
  const raw = Array.isArray(payload) ? payload : payload.data;
  if (!Array.isArray(raw)) return [];
  return raw.map((point) => ({
    year: Number(point.year),
    advancement: Number(point.advancement),
    milestone: point.milestone || void 0
  })).filter((point) => Number.isFinite(point.year) && Number.isFinite(point.advancement)).sort((a, b) => a.year - b.year);
};
var resolveGrowthUrl = () => {
  if (typeof window === "undefined") return "";
  const envUrl = window.ENV?.GROWTH_API_URL;
  const legacy = window.GROWTH_API_URL;
  return (envUrl ?? legacy ?? "").toString().trim();
};
var getGrowthApiUrl = () => resolveGrowthUrl();
var fetchGrowthApi = async (topic) => {
  const configuredUrl = resolveGrowthUrl();
  if (!configuredUrl) {
    return { ok: false, reason: "missing-url" };
  }
  const base = configuredUrl.includes("://") ? configuredUrl : `${configuredUrl.startsWith("/") ? "" : "/"}${configuredUrl}`;
  const separator = base.includes("?") ? "&" : "?";
  const url = `${base}${separator}topic=${encodeURIComponent(topic)}`;
  try {
    const response = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json" }
    });
    if (!response.ok) {
      console.warn(`[Visualizer] Growth API error: HTTP ${response.status}`);
      return { ok: false, reason: `http-${response.status}` };
    }
    const payload = await response.json();
    const data = normaliseExternalPoints(payload);
    if (!data.length) {
      console.warn("[Visualizer] Growth API returned empty data.");
      return { ok: false, reason: "empty" };
    }
    console.log(`[Visualizer] Growth API OK: ${data.length} points`);
    return { ok: true, data, source: "growth-api", url: base };
  } catch (error) {
    console.error("[Visualizer] Growth API fetch failed", error);
    return {
      ok: false,
      reason: "fetch-error",
      message: error instanceof Error ? error.message : String(error)
    };
  }
};

// assets/js/services/geminiService.js
var MODEL_NAME = "gemini-2.5-flash";
var API_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent`;
var systemInstruction = `
You are a technology futurist and data analyst. Your task is to generate a projected growth trajectory for a specific field of Artificial Intelligence provided by the user.
You must respond with only a JSON array of objects. Do not include any other text, explanation, or markdown formatting.
Each object in the array represents a data point with a 'year', a numeric 'advancement' score (from 1 to 1000, where 1 is nascent and 1000 is transformative), and an optional 'milestone' string.
The data should start from a plausible year of inception for the given topic and project about 15-20 years into the future.
The growth curve should be exponential, reflecting the accelerating nature of AI development.
`.trim();
var responseSchema = {
  type: "ARRAY",
  items: {
    type: "OBJECT",
    properties: {
      year: { type: "NUMBER" },
      advancement: { type: "NUMBER" },
      milestone: { type: "STRING" }
    },
    required: ["year", "advancement"]
  }
};
var normalisePoints = (payload) => payload.map((point) => ({
  year: Number(point.year),
  advancement: Number(point.advancement),
  milestone: point.milestone || void 0
})).filter((point) => Number.isFinite(point.year) && Number.isFinite(point.advancement)).sort((a, b) => a.year - b.year);
var getEnvKey = () => {
  if (typeof window === "undefined") return "";
  const value = window.ENV?.GEMINI_API_KEY ?? "";
  return value ? String(value).trim() : "";
};
var extractTextFromResponse = (payload) => {
  if (!payload?.candidates?.length) {
    return "";
  }
  for (const candidate of payload.candidates) {
    const parts = candidate?.content?.parts;
    if (Array.isArray(parts)) {
      const text = parts.map((part) => part?.text).filter(Boolean).join("\n").trim();
      if (text) return text;
    }
  }
  return "";
};
var parseGeminiPayload = (payload) => {
  const text = extractTextFromResponse(payload);
  if (!text) {
    throw new Error("Gemini response did not include a text payload");
  }
  const cleaned = text.replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
  const json = JSON.parse(cleaned);
  if (!Array.isArray(json)) {
    throw new Error("Gemini payload did not resolve to an array");
  }
  return normalisePoints(json);
};
var getProjectedGrowthData = async (topic, providedKey) => {
  const apiKey = providedKey && providedKey.trim() || getEnvKey();
  if (!apiKey) {
    return { ok: false, reason: "no-key" };
  }
  const url = `${API_ENDPOINT}?key=${encodeURIComponent(apiKey)}`;
  const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
  const timeoutId = controller ? setTimeout(() => controller.abort(), 12e3) : null;
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: {
          role: "system",
          parts: [{ text: systemInstruction }]
        },
        contents: [
          {
            role: "user",
            parts: [{ text: `Generate the growth trajectory for: "${topic}"` }]
          }
        ],
        generationConfig: {
          responseMimeType: "application/json"
        },
        responseSchema
      }),
      signal: controller?.signal
    });
    if (!response.ok) {
      const errorText = await response.text();
      console.warn("[Visualizer] Gemini HTTP error", response.status, errorText);
      return { ok: false, reason: `http-${response.status}`, message: errorText };
    }
    const payload = await response.json();
    const data = parseGeminiPayload(payload);
    if (!data.length) {
      return { ok: false, reason: "empty" };
    }
    return { ok: true, data, source: "gemini" };
  } catch (error) {
    if (timeoutId) clearTimeout(timeoutId);
    console.error("[Visualizer] Gemini projection failed", error);
    return {
      ok: false,
      reason: error?.name === "AbortError" ? "timeout" : "error",
      message: error instanceof Error ? error.message : String(error)
    };
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
};

// assets/js/visualizer.jsx
var DEFAULT_TOPIC = "AI Growth";
var LOCAL_STORAGE_KEY = "xenteck_gemini_key";
var sampleTopics = [
  "Autonomous Logistics",
  "GenAI Sales Co-Pilots",
  "Quantum Machine Learning",
  "Autonomous Bioengineering",
  "AI-Driven Compliance",
  "Robotics Process Automation",
  "Intelligent Edge Vision",
  "Predictive Healthcare Agents"
];
var getStoredKey = () => {
  try {
    if ("localStorage" in window) {
      return localStorage.getItem(LOCAL_STORAGE_KEY) || "";
    }
  } catch (_) {
  }
  return "";
};
var persistKey = (value) => {
  try {
    if ("localStorage" in window) {
      if (value) {
        localStorage.setItem(LOCAL_STORAGE_KEY, value);
      } else {
        localStorage.removeItem(LOCAL_STORAGE_KEY);
      }
    }
  } catch (_) {
  }
};
var getInitialTopic = () => {
  try {
    const params = new URLSearchParams(window.location.search);
    const param = params.get("topic");
    return param ? param.trim() : DEFAULT_TOPIC;
  } catch {
    return DEFAULT_TOPIC;
  }
};
var createFallbackProjection = (topic) => {
  const currentYear = (/* @__PURE__ */ new Date()).getUTCFullYear();
  const startYear = currentYear - 6;
  const span = 12;
  return Array.from({ length: span }, (_, index) => {
    const year = startYear + index;
    const growth = Math.min(
      1e3,
      Math.round(12 * Math.pow(1.34, index + 1) * (1 + index * 0.18))
    );
    const milestone = index % 3 === 0 ? `${topic} breakthrough expected` : void 0;
    return { year, advancement: growth, milestone };
  });
};
var VisualizerApp = () => {
  const initialTopic = getInitialTopic();
  const envKey = typeof window !== "undefined" && window.ENV?.GEMINI_API_KEY ? String(window.ENV.GEMINI_API_KEY).trim() : "";
  const storedKey = typeof window !== "undefined" ? getStoredKey() : "";
  const initialKey = envKey || storedKey;
  const [topic, setTopic] = useState2(initialTopic);
  const [topicDraft, setTopicDraft] = useState2(initialTopic);
  const [apiKey, setApiKey] = useState2(initialKey);
  const [apiKeyDraft, setApiKeyDraft] = useState2(initialKey);
  const [projectionData, setProjectionData] = useState2(() => createFallbackProjection(initialTopic));
  const [statusMessage, setStatusMessage] = useState2("Illustrative projection. Configure Growth API or add a Gemini key to activate live data.");
  const [sourceLabel, setSourceLabel] = useState2("Illustrative");
  const [errorMessage, setErrorMessage] = useState2("");
  const [isLoading, setIsLoading] = useState2(false);
  const [lastUpdated, setLastUpdated] = useState2(null);
  const [growthActive, setGrowthActive] = useState2(false);
  useEffect2(() => {
    console.log("[Visualizer] growthApiUrl =", getGrowthApiUrl() || "(none)");
  }, []);
  const runProjection = useCallback(async (currentTopic) => {
    if (!currentTopic) return;
    const growthUrl = getGrowthApiUrl();
    const trimmedKey = (apiKey || "").trim();
    setIsLoading(true);
    setErrorMessage("");
    if (growthUrl) {
      setStatusMessage("Contacting Growth API for live projection.");
    } else if (trimmedKey) {
      setStatusMessage("Contacting Gemini for live projection.");
    } else {
      setStatusMessage("Illustrative projection. Add a Gemini key or configure Growth API to unlock live feeds.");
    }
    let data = null;
    let source = "illustrative";
    let growthError = null;
    if (growthUrl) {
      const result = await fetchGrowthApi(currentTopic);
      if (result.ok) {
        data = result.data;
        source = "growth";
        setGrowthActive(true);
      } else {
        growthError = result.message || result.reason || "Growth API unavailable";
        setGrowthActive(false);
      }
    } else {
      setGrowthActive(false);
    }
    if (!data && trimmedKey) {
      const result = await getProjectedGrowthData(currentTopic, trimmedKey);
      if (result.ok) {
        data = result.data;
        source = "gemini";
      } else if (result.reason !== "no-key") {
        growthError = result.message || result.reason || "Gemini projection failed";
      }
    }
    if (data && data.length) {
      setProjectionData(data);
      if (source === "growth") {
        setStatusMessage("Live projection served by Growth API");
        setSourceLabel("Growth API");
        setErrorMessage("");
      } else if (source === "gemini") {
        setStatusMessage("Live Gemini projection");
        setSourceLabel("Gemini");
        if (growthError) {
          setErrorMessage(`Growth API unavailable (${growthError}). Gemini fallback active.`);
        } else {
          setErrorMessage("");
        }
      }
      setLastUpdated(/* @__PURE__ */ new Date());
    } else {
      const fallback = createFallbackProjection(currentTopic);
      setProjectionData(fallback);
      setSourceLabel("Illustrative");
      setStatusMessage("Showing illustrative projection");
      if (growthError) {
        setErrorMessage(`Live services unavailable: ${growthError}`);
      } else if (!trimmedKey) {
        setErrorMessage("Add a Gemini key or configure Growth API to activate live projections.");
      } else {
        setErrorMessage("Unable to fetch live projection.");
      }
      setLastUpdated(null);
    }
    setIsLoading(false);
  }, [apiKey]);
  useEffect2(() => {
    runProjection(topic);
  }, [topic, apiKey, runProjection]);
  const handleTopicSubmit = (nextTopic) => {
    const trimmed = (nextTopic || "").trim();
    if (!trimmed || trimmed === topic) return;
    setTopic(trimmed);
  };
  const handlePresetSelect = (preset) => {
    setTopicDraft(preset);
    setTopic(preset);
  };
  const handleSaveKey = (value) => {
    setApiKey(value);
    setApiKeyDraft(value);
    persistKey(value);
  };
  const handleClearKey = () => {
    setApiKey("");
    setApiKeyDraft("");
    persistKey("");
  };
  const headerStats = useMemo2(() => ({
    statusMessage,
    sourceLabel,
    errorMessage
  }), [statusMessage, sourceLabel, errorMessage]);
  return /* @__PURE__ */ React4.createElement("div", { className: "ai-visualizer" }, /* @__PURE__ */ React4.createElement("div", { className: "ai-visualizer__header" }, /* @__PURE__ */ React4.createElement("span", { className: "ai-visualizer__badge" }, "Forecast Engine"), /* @__PURE__ */ React4.createElement("h2", { className: "ai-visualizer__title sora" }, "Compound outcome planning for ", topic), /* @__PURE__ */ React4.createElement("p", { className: "ai-visualizer__desc" }, "Stream Growth API projections or fall back to Gemini to see how fast emerging intelligence reshapes your operating model. Swap topics, capture deltas, and brief stakeholders in seconds.")), /* @__PURE__ */ React4.createElement("div", { className: "ai-visualizer__grid" }, /* @__PURE__ */ React4.createElement("div", { className: "ai-visualizer__left" }, /* @__PURE__ */ React4.createElement("div", { className: "ai-panel ai-panel--chart" }, /* @__PURE__ */ React4.createElement("div", { className: "ai-panel__heading" }, /* @__PURE__ */ React4.createElement("h2", { className: "sora" }, "Live trajectory"), lastUpdated && /* @__PURE__ */ React4.createElement("span", { className: "ai-panel__subtext" }, "Updated ", lastUpdated.toLocaleTimeString())), /* @__PURE__ */ React4.createElement("p", { className: "ai-panel__subtext" }, "Baseline vs. topic-specific acceleration, indexed against a 1-1000 advancement score."), /* @__PURE__ */ React4.createElement("div", { className: "ai-chart-shell" }, isLoading ? /* @__PURE__ */ React4.createElement("div", { className: "ai-chart-placeholder" }, /* @__PURE__ */ React4.createElement("div", { className: "visualizer-spinner" }, /* @__PURE__ */ React4.createElement("span", { className: "spinner-dot", "aria-hidden": "true" }), /* @__PURE__ */ React4.createElement("span", { className: "spinner-label" }, "Fetching projections."))) : /* @__PURE__ */ React4.createElement(LivingGraph_default, { topic, projectionData })), /* @__PURE__ */ React4.createElement("p", { className: `ai-status ${headerStats.errorMessage ? "is-error" : "is-info"}` }, headerStats.errorMessage || `${headerStats.statusMessage} (Source: ${headerStats.sourceLabel})`)), /* @__PURE__ */ React4.createElement(ScoreExplanation_default, null)), /* @__PURE__ */ React4.createElement(
    ChatWindow_default,
    {
      topicDraft,
      onTopicDraftChange: setTopicDraft,
      onTopicSubmit: handleTopicSubmit,
      onPresetSelect: handlePresetSelect,
      isLoading,
      apiKeyDraft,
      onApiKeyDraftChange: setApiKeyDraft,
      onSaveKey: handleSaveKey,
      onClearKey: handleClearKey,
      hasStoredKey: Boolean(apiKey),
      presets: sampleTopics,
      growthActive,
      statusMessage,
      sourceLabel
    }
  )));
};
var mountVisualizer = () => {
  const host = document.getElementById("ai-visualizer");
  if (!host) return;
  const root = createRoot(host);
  root.render(
    /* @__PURE__ */ React4.createElement(React4.StrictMode, null, /* @__PURE__ */ React4.createElement(VisualizerApp, null))
  );
};
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", mountVisualizer, { once: true });
} else {
  mountVisualizer();
}
