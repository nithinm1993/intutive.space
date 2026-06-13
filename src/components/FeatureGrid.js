/**
 * FeatureGrid.js — Capabilities section feature cards
 * Dynamically injects 6 feature cards into the capabilities grid
 */

const FEATURES = [
  {
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="3"/><circle cx="12" cy="3" r="1.5"/><circle cx="12" cy="21" r="1.5"/>
      <circle cx="3" cy="12" r="1.5"/><circle cx="21" cy="12" r="1.5"/>
      <line x1="12" y1="5" x2="12" y2="9"/><line x1="12" y1="15" x2="12" y2="19"/>
      <line x1="5" y1="12" x2="9" y2="12"/><line x1="15" y1="12" x2="19" y2="12"/>
    </svg>`,
    title: 'Agent Orchestration',
    desc: 'Dynamic creation, management, and deletion of AI agents on demand — scaling intelligence to match the complexity of any task.',
  },
  {
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="3"/><rect x="7" y="7" width="10" height="10" rx="1.5"/>
      <line x1="7" y1="3" x2="7" y2="7"/><line x1="17" y1="3" x2="17" y2="7"/>
      <line x1="7" y1="17" x2="7" y2="21"/><line x1="17" y1="17" x2="17" y2="21"/>
    </svg>`,
    title: 'Sandbox Environment',
    desc: 'Isolated, secure execution environments for product development, research studies, and experimental AI workflows.',
  },
  {
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M2 12h4l3-9 6 18 3-9h4"/>
    </svg>`,
    title: 'Edge Device Integration',
    desc: 'Connect LLMs directly to edge and IoT devices — bringing intelligence to the physical world in real time.',
  },
  {
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 2L4 7v5c0 5.5 3.4 10.7 8 12 4.6-1.3 8-6.5 8-12V7l-8-5z"/>
      <path d="M9 12l2 2 4-4"/>
    </svg>`,
    title: 'Drone Fleet Control',
    desc: 'Orchestrate and command 100+ drones simultaneously through LLM integration — autonomous fleet intelligence.',
  },
  {
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="8" r="5"/><path d="M7 21v-2a4 4 0 014-4h2a4 4 0 014 4v2"/>
      <path d="M15 3.5A3 3 0 0118 6.5v1"/><path d="M9 3.5A3 3 0 006 6.5v1"/>
    </svg>`,
    title: 'Robotic Skill Learning',
    desc: 'Agent-governed robotic skill acquisition — machines that learn new capabilities through AI-directed practice.',
  },
  {
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>`,
    title: 'Task Scheduling',
    desc: 'Intelligent task orchestration and scheduling — automated pipelines that adapt to workload and priority in real time.',
  },
];

/**
 * Renders the feature grid into the capabilities section
 */
export function renderFeatureGrid() {
  const grid = document.getElementById('capabilities-grid');
  if (!grid) return;

  grid.innerHTML = FEATURES.map(
    (f) => `
    <div class="cap-card glass-card fade-up">
      <div class="cap-card__icon">${f.icon}</div>
      <h3 class="cap-card__title">${f.title}</h3>
      <p class="cap-card__desc">${f.desc}</p>
    </div>
  `
  ).join('');
}
