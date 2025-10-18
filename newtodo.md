# Tech Momentum Hero Refresh – TODO

- [ ] Reinstate hero video layer, remove temporary overlay, and reserve space for the live momentum graph.
- [ ] Build new “Tech Momentum” chart shell with search input, wiring to `/api/v1/interest-trends`, and fallback to aggressive logistic curve when API misses.
- [ ] Style the baseline vs. acceleration lines so the neon trajectory clearly dominates the grey baseline.
- [ ] Add real-time status chips (growth feed, ensemble models) near the chart heading; ensure responsive layout keeps controls visible.
- [ ] Implement soft-debounce typing to avoid flooding the API while keeping the chart feeling live.
- [ ] Surface key milestones on the chart (pilot urgency, industry default, global rewiring) with tooltip copy tied to topic.
- [ ] Update sidebar copy to emphasize Growth API + GPT-4o/Claude/Gemini/Llama ensemble; remove obsolete key-storage logic.
- [ ] Prepare slots for ROI calculator, Build Queue ticker, and Agent demo cards under the hero so widgets can be layered next.
- [ ] Add basic telemetry logging hook (console stub for now) when projections render, to wire into analytics later.
