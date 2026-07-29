import React, { useState, useEffect } from "react";
import { 
  Bell, 
  Activity, 
  Check, 
  Flame, 
  Clock, 
  Gauge, 
  ChevronDown, 
  Settings, 
  Sparkles,
  Zap,
  TrendingUp,
  RotateCcw
} from "lucide-react";

export default function HorizontalBentoDashboard({ 
  dispatchStatus, 
  assignedAmbulance, 
  isPremiumEmergency, 
  selectedHospital,
  pastCasesCount = 0
}) {
  const [autoScroll, setAutoScroll] = useState(true);
  const [timeframe, setTimeframe] = useState("1_day"); // Options: "1_day", "1_week", "1_year"
  const [vitals, setVitals] = useState({
    hr: 98,
    spo2: 94,
    bp: "120/80",
    rr: 22,
    condition: "Stable",
    risk: "Moderate"
  });

  // Fluctuate vitals in real-time when active
  useEffect(() => {
    const isWorking = dispatchStatus !== "IDLE" && dispatchStatus !== "ADMITTED";
    const interval = setInterval(() => {
      if (!isWorking) {
        setVitals({
          hr: 98,
          spo2: 94,
          bp: "120/80",
          rr: 22,
          condition: "Stable",
          risk: "Moderate"
        });
        return;
      }

      if (isPremiumEmergency) {
        setVitals({
          hr: Math.floor(105 + Math.random() * 15),
          spo2: Math.floor(91 + Math.random() * 4),
          bp: `${Math.floor(138 + Math.random() * 12)}/${Math.floor(88 + Math.random() * 8)}`,
          rr: Math.floor(21 + Math.random() * 4),
          condition: "Critical",
          risk: "High"
        });
      } else {
        setVitals({
          hr: Math.floor(88 + Math.random() * 10),
          spo2: Math.floor(95 + Math.random() * 3),
          bp: `${Math.floor(120 + Math.random() * 8)}/${Math.floor(78 + Math.random() * 6)}`,
          rr: Math.floor(18 + Math.random() * 3),
          condition: "Stable",
          risk: "Moderate"
        });
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [dispatchStatus, isPremiumEmergency]);

  // Determine active phase for Incident Feed highlighting
  const getPhaseHighlight = () => {
    switch (dispatchStatus) {
      case "IDLE": return 0;
      case "SCANNING": return 1;
      case "DISPATCHED": return 2;
      case "ARRIVED_AT_PATIENT": return 3;
      case "CONFIRMED_ARRIVAL": return 4;
      case "EN_ROUTE_TO_HOSPITAL": return 4;
      case "ARRIVED_AT_HOSPITAL": return 5;
      case "ADMITTED": return 6;
      default: return 0;
    }
  };

  const currentPhase = getPhaseHighlight();

  // Color mappings for incidents type chart
  const typesData = [
    { name: "Cardiac Arrest", val: 42, pct: "33%", color: "bg-rose-500", border: "#ef4444" },
    { name: "Accidents", val: 36, pct: "28%", color: "bg-orange-500", border: "#f97316" },
    { name: "Breathing Issues", val: 22, pct: "17%", color: "bg-sky-500", border: "#0ea5e9" },
    { name: "Trauma", val: 18, pct: "14%", color: "bg-purple-500", border: "#a855f7" },
    { name: "Others", val: 10, pct: "08%", color: "bg-slate-500", border: "#64748b" }
  ];

  return (
    <div id="horizontal-bento-dashboard" className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
      
      {/* 1. INCIDENT FEED (LIVE) */}
      <div className="bg-[#030712]/90 border border-slate-900 rounded-2xl p-4 flex flex-col justify-between shadow-[inset_0_1px_1px_rgba(255,255,255,0.05),0_8px_24px_rgba(0,0,0,0.6)] h-56">
        <div className="flex justify-between items-center border-b border-slate-900/50 pb-2 mb-2">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            <h4 className="text-[10px] font-black text-rose-500 uppercase tracking-wider font-mono">
              INCIDENT FEED (LIVE)
            </h4>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-mono text-slate-500">Auto Scroll</span>
            <button 
              onClick={() => setAutoScroll(!autoScroll)}
              className={`w-7 h-4 rounded-full p-0.5 transition-colors cursor-pointer outline-none relative ${autoScroll ? "bg-emerald-500" : "bg-slate-800"}`}
            >
              <div className={`w-3 h-3 rounded-full bg-white transition-transform ${autoScroll ? "translate-x-3" : "translate-x-0"}`} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pr-1 scrollbar-thin text-left font-sans py-1.5 relative">
          {/* Vertical Timeline dashed line */}
          <div className="absolute left-1.5 top-3 bottom-3 w-px border-l border-dashed border-slate-800" />

          <div className="pl-5 space-y-3.5 relative">
            {/* Item 1 */}
            <div className={`relative transition-opacity duration-300 ${currentPhase >= 0 ? "opacity-100" : "opacity-30"}`}>
              <span className="absolute left-[-18.5px] top-[4px] w-2 h-2 rounded-full bg-amber-500 border border-slate-950 shadow-[0_0_6px_#f59e0b] z-10" />
              <div className="flex flex-col">
                <div className="flex items-baseline gap-2">
                  <span className="text-slate-400 font-mono text-[9px]">12:34 PM</span>
                  <span className="text-slate-200 font-extrabold text-[10.5px]">New Cardiac Arrest Case</span>
                </div>
                <span className="text-[9px] text-slate-500 font-mono mt-0.5 pl-[1px]">Nazimabad Block 3</span>
              </div>
            </div>

            {/* Item 2 */}
            <div className={`relative transition-opacity duration-300 ${currentPhase >= 2 ? "opacity-100" : "opacity-30"}`}>
              <span className="absolute left-[-18.5px] top-[4px] w-2 h-2 rounded-full bg-emerald-500 border border-slate-950 shadow-[0_0_6px_#10b981] z-10" />
              <div className="flex items-center justify-between pointer-events-none">
                <div className="flex items-baseline gap-2">
                  <span className="text-slate-400 font-mono text-[9px]">12:35 PM</span>
                  <span className="text-slate-200 font-extrabold text-[10.5px]">Ambulance #{assignedAmbulance?.id?.replace("unit-", "") || "204"} Assigned</span>
                </div>
                <span className="text-[9.5px] font-mono text-emerald-400 font-bold block shrink-0">0%</span>
              </div>
            </div>

            {/* Item 3 */}
            <div className={`relative transition-opacity duration-300 ${currentPhase >= 3 ? "opacity-100" : "opacity-30"}`}>
              <span className="absolute left-[-18.5px] top-[4px] w-2 h-2 rounded-full bg-amber-500 border border-slate-950 shadow-[0_0_6px_#f59e0b] z-10" />
              <div className="flex items-center justify-between pointer-events-none">
                <div className="flex items-baseline gap-2">
                  <span className="text-slate-400 font-mono text-[9px]">12:36 PM</span>
                  <span className="text-slate-200 font-extrabold text-[10.5px]">En Route to Scene</span>
                </div>
                <span className="text-[9.5px] font-mono text-emerald-400 font-bold block shrink-0">0%</span>
              </div>
            </div>

            {/* Item 4 */}
            <div className={`relative transition-opacity duration-300 ${currentPhase >= 4 ? "opacity-100" : "opacity-30"}`}>
              <span className="absolute left-[-18.5px] top-[4px] w-2 h-2 rounded-full bg-amber-500 border border-slate-950 shadow-[0_0_6px_#f59e0b] z-10" />
              <div className="flex items-center justify-between pointer-events-none">
                <div className="flex items-baseline gap-2">
                  <span className="text-slate-400 font-mono text-[9px]">12:38 PM</span>
                  <span className="text-slate-200 font-extrabold text-[10.5px]">Hospital Notified</span>
                </div>
                <span className="text-[9.5px] font-mono text-emerald-400 font-bold block shrink-0">0%</span>
              </div>
            </div>

            {/* Item 5 */}
            <div className={`relative transition-opacity duration-300 ${currentPhase >= 4 ? "opacity-100" : "opacity-30"}`}>
              <span className="absolute left-[-18.5px] top-[4px] w-2 h-2 rounded-full bg-purple-500 border border-slate-950 shadow-[0_0_6px_#a855f7] z-10" />
              <div className="flex items-center justify-between pointer-events-none">
                <div className="flex items-baseline gap-2">
                  <span className="text-slate-400 font-mono text-[9px]">12:40 PM</span>
                  <span className="text-slate-200 font-extrabold text-[10.5px]">Patient Picked Up</span>
                </div>
                <span className="text-[9.5px] font-mono text-emerald-400 font-bold block shrink-0">0%</span>
              </div>
            </div>

            {/* Item 6 */}
            <div className={`relative transition-opacity duration-300 ${currentPhase >= 5 ? "opacity-100" : "opacity-30"}`}>
              <span className="absolute left-[-18.5px] top-[4px] w-2 h-2 rounded-full bg-rose-500 border border-slate-950 shadow-[0_0_6px_#f43f5e] z-10" />
              <div className="flex items-baseline gap-2">
                <span className="text-slate-400 font-mono text-[9px]">12:44 PM</span>
                <span className="text-slate-200 font-extrabold text-[10.5px]">ETA to Hospital: {isPremiumEmergency ? "02:20" : "04:35"}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. TODAY'S OVERVIEW */}
      <div className="bg-[#030712]/90 border border-slate-900 rounded-2xl p-4 flex flex-col justify-between shadow-[inset_0_1px_1px_rgba(255,255,255,0.05),0_8px_24px_rgba(0,0,0,0.6)] h-56">
        <div className="flex justify-between items-center border-b border-slate-900/50 pb-2 mb-2">
          <div className="flex items-center gap-1.5 text-pink-500">
            <span className="w-3 h-3 flex items-center justify-center border border-pink-500 rounded-sm text-[8px] font-bold">⌖</span>
            <h4 className="text-[10px] font-black uppercase tracking-wider font-mono">
              STATUS OVERVIEW
            </h4>
          </div>
          <select 
            value={timeframe} 
            onChange={(e) => setTimeframe(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded px-1.5 py-0.5 text-[8.5px] text-slate-300 font-mono outline-none focus:border-pink-500 cursor-pointer"
          >
            <option value="1_day" className="bg-slate-950 text-slate-300">Last 1 Day</option>
            <option value="1_week" className="bg-slate-950 text-slate-300">Last Week</option>
            <option value="1_year" className="bg-slate-950 text-slate-300">Last Year</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-2 flex-1 pt-1">
          {/* Card 1: Total Incidents */}
          <div className="bg-[#0b1329]/30 border border-blue-950/40 rounded-xl p-2 flex flex-col justify-center relative overflow-hidden group hover:border-blue-900/60 transition-colors">
            <div className="text-left px-1">
              <span className="text-[8.5px] font-sans font-medium text-slate-400 leading-tight block uppercase tracking-wider">Total Incidents</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-lg font-mono font-black text-slate-100">
                  {timeframe === "1_day" ? (128 + pastCasesCount) : timeframe === "1_week" ? (892 + pastCasesCount) : (4520 + pastCasesCount)}
                </span>
                <span className="text-[8px] font-mono text-emerald-400 font-bold flex items-center">▲ 18%</span>
              </div>
            </div>
          </div>

          {/* Card 2: Completed */}
          <div className="bg-[#0c1a12]/30 border border-emerald-955/40 rounded-xl p-2 flex flex-col justify-center relative overflow-hidden group hover:border-emerald-900/60 transition-colors">
            <div className="text-left px-1">
              <span className="text-[8.5px] font-sans font-medium text-slate-400 leading-tight block uppercase tracking-wider">Completed</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-lg font-mono font-black text-slate-100">
                  {timeframe === "1_day" ? (92 + pastCasesCount) : timeframe === "1_week" ? (740 + pastCasesCount) : (4210 + pastCasesCount)}
                </span>
                <span className="text-[8px] font-mono text-emerald-400 font-bold flex items-center">▲ 12%</span>
              </div>
            </div>
          </div>

          {/* Card 3: On Going */}
          <div className="bg-[#120f26]/30 border border-purple-955/40 rounded-xl p-2 flex flex-col justify-center relative overflow-hidden group hover:border-purple-900/60 transition-colors">
            <div className="text-left px-1">
              <span className="text-[8.5px] font-sans font-medium text-slate-400 leading-tight block uppercase tracking-wider">On Going</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-lg font-mono font-black text-slate-100 font-extrabold">
                  {timeframe === "1_day"
                    ? (dispatchStatus !== "IDLE" && dispatchStatus !== "ADMITTED" ? 24 : 23)
                    : timeframe === "1_week"
                    ? (dispatchStatus !== "IDLE" && dispatchStatus !== "ADMITTED" ? 5 : 4)
                    : (dispatchStatus !== "IDLE" && dispatchStatus !== "ADMITTED" ? 29 : 28)
                  }
                </span>
                <span className="text-[8px] font-mono text-purple-400 font-bold flex items-center">▲ 5%</span>
              </div>
            </div>
          </div>

          {/* Card 4: Critical Cases */}
          <div className="bg-[#1c080b]/30 border border-rose-955/40 rounded-xl p-2 flex flex-col justify-center relative overflow-hidden group hover:border-rose-900/60 transition-colors">
            <div className="text-left px-1">
              <span className="text-[8.5px] font-sans font-medium text-slate-400 leading-tight block uppercase tracking-wider">Critical Cases</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-lg font-mono font-black text-slate-100">
                  {timeframe === "1_day"
                    ? (dispatchStatus !== "IDLE" && dispatchStatus !== "ADMITTED" ? 14 : 13)
                    : timeframe === "1_week"
                    ? (dispatchStatus !== "IDLE" && dispatchStatus !== "ADMITTED" ? 39 : 38)
                    : (dispatchStatus !== "IDLE" && dispatchStatus !== "ADMITTED" ? 126 : 125)
                  }
                </span>
                <span className="text-[8px] font-mono text-rose-400 font-bold flex items-center">▲ 30%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. RESPONSE TIME TREND */}
      <div className="bg-[#030712]/90 border border-slate-900 rounded-2xl p-4 flex flex-col justify-between shadow-[inset_0_1px_1px_rgba(255,255,255,0.05),0_8px_24px_rgba(0,0,0,0.6)] h-56">
        <div className="flex justify-between items-center border-b border-slate-900/50 pb-2 mb-2">
          <div className="flex items-center gap-1.5 text-pink-500">
            <span className="w-3 h-3 flex items-center justify-center border border-pink-500 rounded-sm text-[8px] font-bold">⌖</span>
            <h4 className="text-[10px] font-black uppercase tracking-wider font-mono">
              RESPONSE TIME TREND
            </h4>
          </div>
          <select 
            value={timeframe} 
            onChange={(e) => setTimeframe(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded px-1.5 py-0.5 text-[8.5px] text-slate-300 font-mono outline-none focus:border-pink-500 cursor-pointer"
          >
            <option value="1_day" className="bg-slate-950 text-slate-300">Last 1 Day</option>
            <option value="1_week" className="bg-slate-950 text-slate-300">Last Week</option>
            <option value="1_year" className="bg-slate-950 text-slate-300">Last Year</option>
          </select>
        </div>

        {/* Elegant glowing spark line chart drawn via Custom SVG */}
        <div className="flex-1 relative mt-1 select-none">
          <svg viewBox="0 0 160 80" className="w-full h-full overflow-visible">
            {/* Grid dotted lines */}
            <line x1="15" y1="15" x2="155" y2="15" stroke="#161b30" strokeDasharray="1,2" strokeWidth="0.5" />
            <line x1="15" y1="35" x2="155" y2="35" stroke="#161b30" strokeDasharray="1,2" strokeWidth="0.5" />
            <line x1="15" y1="55" x2="155" y2="55" stroke="#161b30" strokeDasharray="1,2" strokeWidth="0.5" />
            <line x1="15" y1="70" x2="155" y2="70" stroke="#10b981" strokeDasharray="1,1" strokeWidth="0.5" opacity="0.3" />

            {/* Y Axes */}
            <text x="2" y="18" fill="#475569" fontSize="6" fontFamily="monospace">20</text>
            <text x="2" y="38" fill="#475569" fontSize="6" fontFamily="monospace">10</text>
            <text x="2" y="58" fill="#475569" fontSize="6" fontFamily="monospace">5</text>
            <text x="2" y="73" fill="#475569" fontSize="6" fontFamily="monospace">0</text>

            {/* Glowing Shadow Gradient */}
            <defs>
              <linearGradient id="pink-glow-path" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ec4899" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#ec4899" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path 
              d={timeframe === "1_day" 
                 ? "M 15 50 L 38 60 L 61 35 L 84 45 L 107 20 L 130 30 L 155 40 L 155 70 L 15 70 Z" 
                 : timeframe === "1_week" 
                 ? "M 15 65 L 38 52 L 61 28 L 84 57 L 107 24 L 130 54 L 155 60 L 155 70 L 15 70 Z"
                 : "M 15 45 L 38 35 L 61 48 L 84 32 L 107 55 L 130 25 L 155 30 L 155 70 L 15 70 Z"
              } 
              fill="url(#pink-glow-path)" 
            />

            {/* Trend line vector */}
            <path 
              d={timeframe === "1_day"
                 ? "M 15 50 L 38 60 L 61 35 L 84 45 L 107 20 L 130 30 L 155 40"
                 : timeframe === "1_week"
                 ? "M 15 65 L 38 52 L 61 28 L 84 57 L 107 24 L 130 54 L 155 60"
                 : "M 15 45 L 38 35 L 61 48 L 84 32 L 107 55 L 130 25 L 155 30"
              }
              fill="none" 
              stroke="#ec4899" 
              strokeWidth="1.5" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              style={{ filter: "drop-shadow(0 0 3px #ec4899)" }}
            />

            {/* Data points */}
            {timeframe === "1_day" && (
              <>
                <circle cx="15" cy="50" r="1.5" fill="#ec4899" />
                <circle cx="38" cy="60" r="1.5" fill="#ec4899" />
                <circle cx="61" cy="35" r="1.5" fill="#ec4899" />
                <circle cx="84" cy="45" r="1.5" fill="#ec4899" />
                <circle cx="107" cy="20" r="1.5" fill="#ec4899" stroke="#ef4444" strokeWidth="1" />
                <circle cx="130" cy="30" r="1.5" fill="#ec4899" />
                <circle cx="155" cy="40" r="1.5" fill="#ec4899" />
                <line x1="107" y1="20" x2="107" y2="70" stroke="#ef4444" strokeWidth="0.5" strokeDasharray="1,1" />
              </>
            )}

            {timeframe === "1_week" && (
              <>
                <circle cx="15" cy="65" r="1.5" fill="#ec4899" />
                <circle cx="38" cy="52" r="1.5" fill="#ec4899" />
                <circle cx="61" cy="28" r="1.5" fill="#ec4899" />
                <circle cx="84" cy="57" r="1.5" fill="#ec4899" stroke="#ef4444" strokeWidth="1" />
                <circle cx="107" cy="24" r="1.5" fill="#ec4899" />
                <circle cx="130" cy="54" r="1.5" fill="#ec4899" />
                <circle cx="155" cy="60" r="1.5" fill="#ec4899" />
                <line x1="84" y1="57" x2="84" y2="70" stroke="#ef4444" strokeWidth="0.5" strokeDasharray="1,1" />
              </>
            )}

            {timeframe === "1_year" && (
              <>
                <circle cx="15" cy="45" r="1.5" fill="#ec4899" />
                <circle cx="38" cy="35" r="1.5" fill="#ec4899" />
                <circle cx="61" cy="48" r="1.5" fill="#ec4899" />
                <circle cx="84" cy="32" r="1.5" fill="#ec4899" />
                <circle cx="107" cy="55" r="1.5" fill="#ec4899" />
                <circle cx="130" cy="25" r="1.5" fill="#ec4899" stroke="#ef4444" strokeWidth="1" />
                <circle cx="155" cy="30" r="1.5" fill="#ec4899" />
                <line x1="130" y1="25" x2="130" y2="70" stroke="#ef4444" strokeWidth="0.5" strokeDasharray="1,1" />
              </>
            )}

            {/* Dynamic average tooltip popup bubble matches selected option */}
            <g transform={timeframe === "1_day" ? "translate(85, 2)" : timeframe === "1_week" ? "translate(62, 10)" : "translate(108, 2)"}>
              <rect x="0" y="0" width="46" height="18" rx="3" fill="#030712" stroke="#ec4899" strokeWidth="0.5" style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.5))" }} />
              <text x="23" y="7" fill="#64748b" fontSize="4.5" fontFamily="sans-serif" textAnchor="middle" fontWeight="bold">Avg Response</text>
              <text x="23" y="14" fill="#ec4899" fontSize="6.5" fontFamily="monospace" textAnchor="middle" fontWeight="black">
                {timeframe === "1_day" ? "05:32 Min" : timeframe === "1_week" ? "06:45 Min" : "08:12 Min"}
              </text>
            </g>
          </svg>

          {/* Dynamic timescale labels below */}
          <div className="absolute inset-x-0 bottom-[-2px] flex justify-between px-3 text-[7.5px] font-mono text-slate-500">
            {timeframe === "1_day" ? (
              <>
                <span>00h</span>
                <span>04h</span>
                <span>08h</span>
                <span>12h</span>
                <span>16h</span>
                <span>20h</span>
                <span>24h</span>
              </>
            ) : timeframe === "1_week" ? (
              <>
                <span>Mon</span>
                <span>Tue</span>
                <span>Wed</span>
                <span>Thu</span>
                <span>Fri</span>
                <span>Sat</span>
                <span>Sun</span>
              </>
            ) : (
              <>
                <span>Q1</span>
                <span>Q2</span>
                <span>Q3</span>
                <span>Q4</span>
              </>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
