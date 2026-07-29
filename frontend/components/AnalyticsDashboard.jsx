import { TrendingUp, Activity, Users, Clock, Flame, ShieldAlert, Award } from "lucide-react";

export default function AnalyticsDashboard() {
  // Analytical mock datasets for ambulance emergency events
  const metrics = [
    { title: "Total Emergencies Handled", value: "1,582", change: "+12.4%", icon: ShieldAlert, color: "text-red-500 bg-red-950/40 border-red-900/30" },
    { title: "Avg Dispatch Response Time", value: "9.2 min", change: "-1.4 min", icon: Clock, color: "text-amber-500 bg-amber-950/40 border-amber-900/30" },
    { title: "Ambulance Utilization Rate", value: "88.6%", change: "+3.2%", icon: Activity, color: "text-blue-500 bg-blue-950/40 border-blue-900/30" },
    { title: "Hospital Occupancy Rate", value: "72.4%", change: "-2.1%", icon: Users, color: "text-emerald-500 bg-emerald-950/40 border-emerald-900/30" },
  ];

  const emergencyDistribution = [
    { type: "Cardiac Arrest", count: 480, pct: 30, color: "#ef4444" },
    { type: "Severe Trauma / Accident", count: 420, pct: 26, color: "#f97316" },
    { type: "Asthma Attack / Respiratory", count: 280, pct: 18, color: "#f59e0b" },
    { type: "Stroke / Neurological", count: 210, pct: 13, color: "#3b82f6" },
    { type: "Severe Poisoning", count: 110, pct: 7, color: "#8b5cf6" },
    { type: "Other Emergency Status", count: 82, pct: 6, color: "#10b981" },
  ];

  const hospitalUsage = [
    { name: "Metro General Complex", dispatchCount: 540, load: "84%", color: "bg-red-500" },
    { name: "Our Lady of Mercy Center", dispatchCount: 420, load: "68%", color: "bg-amber-500" },
    { name: "St. Jude Emergency Unit", dispatchCount: 380, load: "74%", color: "bg-blue-500" },
    { name: "Valley Health Municipal", dispatchCount: 242, load: "55%", color: "bg-emerald-500" },
  ];

  return (
    <div id="analytics-panel" className="space-y-6">
      {/* Header and overview metric blocks */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold font-sans text-slate-100 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-red-500" />
            Ambulance Fleet & Hospital Analytics Dashboard
          </h2>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            Simulating live telemetry logs, responder velocity and clinical bed occupancy.
          </p>
        </div>
        <div className="bg-slate-950 border border-slate-800 px-3 py-1 rounded-full text-[11px] text-slate-300 font-mono flex items-center gap-1.5 animate-pulse">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500" /> Live Telemetry Feed Connected
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m, idx) => {
          const Icon = m.icon;
          return (
            <div
              key={idx}
              className={`p-4 rounded-xl border bg-slate-950/60 backdrop-blur-md transition-all duration-300 hover:scale-[1.02] flex items-center justify-between ${m.color.split(" ")[2]}`}
            >
              <div className="space-y-2">
                <span className="text-[11px] font-mono text-slate-400 block uppercase tracking-wider">
                  {m.title}
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-slate-100 font-mono">{m.value}</span>
                  <span
                    className={`text-xs font-mono font-bold ${
                      m.change.startsWith("-") && m.title.includes("Time")
                        ? "text-emerald-400"
                        : m.change.startsWith("+")
                        ? "text-emerald-400"
                        : "text-red-400"
                    }`}
                  >
                    {m.change}
                  </span>
                </div>
              </div>
              <div className={`p-2.5 rounded-lg border ${m.color.split(" ")[0]} ${m.color.split(" ")[1]}`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Combined Vector Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Graph 1: Custom Vector Line Graph (Response Time Trend) */}
        <div className="bg-slate-950/80 border border-slate-800/80 p-5 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-200 uppercase font-sans tracking-wide">
              📈 Response Time Trajectory & Optimization (12-Week Trend)
            </h3>
            <span className="text-[10px] bg-slate-900 border border-slate-800 text-slate-400 px-2 py-0.5 rounded font-mono">
              Target: &lt; 10 mins
            </span>
          </div>

          <div className="relative h-44 w-full border-b border-l border-slate-800 flex items-end">
            {/* Custom SVG Line drawing for 100% crashproof rendering */}
            <svg viewBox="0 0 500 150" className="absolute inset-0 w-full h-full overflow-visible">
              <defs>
                <linearGradient id="chart-glow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
                </linearGradient>
              </defs>

              {/* Grid Lines helper */}
              <line x1="0" y1="110" x2="500" y2="110" stroke="#161e38" strokeWidth="1" strokeDasharray="3,3" />
              <line x1="0" y1="60" x2="500" y2="60" stroke="#10b981" strokeWidth="1" strokeDasharray="3,3" />
              
              {/* Green Threshold label */}
              <text x="10" y="52" fill="#10b981" fontSize="8" fontFamily="monospace">Critical Response Guard (6 min)</text>
              <text x="10" y="103" fill="#ef4444" fontSize="8" fontFamily="monospace">Benchmark Alert Limit (11 min)</text>

              {/* Shaded Area */}
              <path
                d="M 10 135 L 80 120 L 150 112 L 220 95 L 290 84 L 360 88 L 430 70 L 490 55 L 490 148 L 10 148 Z"
                fill="url(#chart-glow)"
              />

              {/* Trend Vector Line */}
              <path
                d="M 10 135 L 80 120 L 150 112 L 220 95 L 290 84 L 360 88 L 430 70 L 490 55"
                fill="none"
                stroke="#f43f5e"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Data Points */}
              <circle cx="10" cy="135" r="4" fill="#f43f5e" stroke="#fff" strokeWidth="1" />
              <circle cx="80" cy="120" r="4" fill="#f43f5e" stroke="#fff" strokeWidth="1" />
              <circle cx="150" cy="112" r="4" fill="#f43f5e" stroke="#fff" strokeWidth="1" />
              <circle cx="220" cy="95" r="4" fill="#f43f5e" stroke="#fff" strokeWidth="1" />
              <circle cx="290" cy="84" r="4" fill="#f43f5e" stroke="#fff" strokeWidth="1" />
              <circle cx="360" cy="88" r="4" fill="#f43f5e" stroke="#fff" strokeWidth="1" />
              <circle cx="430" cy="70" r="4" fill="#f43f5e" stroke="#fff" strokeWidth="1" />
              <circle cx="490" cy="55" r="4" fill="#10b981" stroke="#fff" strokeWidth="1.5" className="animate-pulse" />
            </svg>

            {/* X-Axis labels */}
            <div className="absolute inset-x-0 bottom-[-22px] flex justify-between font-mono text-[9px] text-slate-500">
              <span>Wk 1 (13.5m)</span>
              <span>Wk 3 (11.2m)</span>
              <span>Wk 6 (8.4m)</span>
              <span>Wk 9 (7.0m)</span>
              <span>Wk 12 (5.5m - Opt.)</span>
            </div>
          </div>

          <div className="pt-2 text-[10px] text-slate-400 font-mono italic">
            *Optimizations represent the introduction of the real-time AI dispatch routing simulation.
          </div>
        </div>

        {/* Graph 2: Case Taxonomy & Bed Density Distribution */}
        <div className="bg-slate-950/80 border border-slate-800/80 p-5 rounded-2xl space-y-4">
          <h3 className="text-sm font-bold text-slate-200 uppercase font-sans tracking-wide">
            📊 Emergency Category & Case Load Representation
          </h3>

          <div className="space-y-3">
            {emergencyDistribution.map((item, index) => (
              <div key={index} className="space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-300 flex items-center gap-1.5 font-sans">
                    <span
                      className="w-2.5 h-2.5 rounded-full inline-block"
                      style={{ backgroundColor: item.color }}
                    />
                    {item.type}
                  </span>
                  <span className="text-slate-400 font-mono text-[11px]">
                    {item.count} dispatches ({item.pct}%)
                  </span>
                </div>
                <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800/50">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      backgroundColor: item.color,
                      width: `${item.pct}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Bottom Grid: Hospital Load Balancing & Peak hours metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Box 1: Hospital Load Balancing Stats */}
        <div className="md:col-span-2 bg-slate-950/80 border border-slate-800 p-5 rounded-2xl space-y-4">
          <h4 className="text-sm font-bold text-slate-200 uppercase tracking-wide">
            🏢 Emergency Hospital Load Balancing & Active Allotments
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {hospitalUsage.map((h, i) => (
              <div key={i} className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 space-y-2">
                <div className="flex justify-between items-start">
                  <span className="text-xs font-bold text-slate-200 block truncate max-w-[150px]">{h.name}</span>
                  <span className="text-[10px] font-mono text-slate-400">{h.dispatchCount} cases</span>
                </div>
                <div className="flex justify-between items-center text-[11px] font-mono">
                  <span className="text-slate-500">Occupancy load:</span>
                  <span className="text-slate-300 font-bold">{h.load}</span>
                </div>
                <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
                  <div className={`h-full ${h.color}`} style={{ width: h.load }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Box 2: Peak Hours & Quick System Achievements */}
        <div className="bg-slate-950/80 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between space-y-4">
          <h4 className="text-sm font-bold text-slate-200 uppercase tracking-wide">
            🏆 Global Fleet Achievements
          </h4>
          <div className="space-y-3 font-mono text-[11px] text-slate-400">
            <div className="p-2.5 rounded bg-emerald-950/20 border border-emerald-900/30 flex gap-2 items-start">
              <Award className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-emerald-300 font-bold font-sans block text-xs">Peak Hours Optimized</span>
                Golden hour response times down 24% between 18:00 - 22:00.
              </div>
            </div>

            <div className="p-2.5 rounded bg-red-950/20 border border-red-900/30 flex gap-2 items-start">
              <Flame className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-red-300 font-bold font-sans block text-xs">Auto Priority Dispatch</span>
                Category 1 cases allocated to nearest available paramedic squad.
              </div>
            </div>
          </div>
          <div className="border-t border-slate-800/80 pt-3 text-center">
            <span className="text-[10px] font-mono text-slate-500">Validated by WHO Health Grid Standards</span>
          </div>
        </div>
      </div>
    </div>
  );
}
