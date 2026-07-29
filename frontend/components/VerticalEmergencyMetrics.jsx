import React, { useState, useEffect } from "react";
import { Siren } from "lucide-react";

export function PatientVitalsCard({ status, isPremium }) {
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
    const isWorking = status !== "IDLE" && status !== "ADMITTED";
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

      if (isPremium) {
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
  }, [status, isPremium]);

  return (
    <div className="bg-[#030712]/90 border border-slate-900 rounded-3xl p-5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05),0_8px_24px_rgba(0,0,0,0.6)] text-left">
      <div className="flex justify-between items-center pb-3 border-b border-slate-900/60 mb-2">
        <div className="flex items-center gap-1.5 text-pink-500">
          <span className="w-1.5 h-1.5 rounded-full bg-pink-500 animate-ping" />
          <span className="text-rose-500 shrink-0">❤️</span>
          <h4 className="text-[10px] font-black uppercase tracking-wider font-mono">
            PATIENT VITALS (LIVE)
          </h4>
        </div>
        <span className="text-pink-500 animate-pulse text-[10px]">📟</span>
      </div>

      <div className="grid grid-cols-2 gap-2.5 font-sans pt-1">
        {/* HR */}
        <div className="bg-slate-900/40 border border-slate-900 p-2 rounded-xl flex items-center justify-between">
          <div className="text-left">
            <span className="text-[7.5px] font-mono uppercase text-slate-500 leading-none block">Heart Rate</span>
            <span className="text-sm font-mono font-black text-emerald-405 leading-tight block mt-0.5">
              {vitals.hr} <span className="text-[8px] font-mono text-slate-400">BPM</span>
            </span>
          </div>
          <svg className="w-10 h-6 text-emerald-405 opacity-80" viewBox="0 0 40 20" fill="none" stroke="currentColor" strokeWidth="1">
            <path d="M0 10 H12 L14 4 L16 16 L18 10 H40" />
          </svg>
        </div>

        {/* SpO2 */}
        <div className="bg-slate-900/40 border border-slate-900 p-2 rounded-xl flex items-center justify-between">
          <div className="text-left">
            <span className="text-[7.5px] font-mono uppercase text-slate-500 leading-none block">SpO₂</span>
            <span className="text-sm font-mono font-black text-sky-405 leading-tight block mt-0.5">
              {vitals.spo2}% <span className="text-[8px] font-mono text-slate-400">O₂</span>
            </span>
          </div>
          <svg className="w-10 h-6 text-sky-400 opacity-80" viewBox="0 0 40 20" fill="none" stroke="currentColor" strokeWidth="1">
            <path d="M0 10 Q 8 2, 16 10 T 32 10 T 40 10" />
          </svg>
        </div>

        {/* BP */}
        <div className="bg-slate-900/40 border border-slate-900 p-2 rounded-xl flex items-center gap-1.5">
          <span className="text-cyan-500 font-bold text-xs">🛡️</span>
          <div className="text-left">
            <span className="text-[7.5px] font-mono uppercase text-slate-500 leading-none block">Blood Pressure</span>
            <span className="text-[12px] font-mono font-black text-slate-200 leading-tight block mt-0.5">
              {vitals.bp} <span className="text-[7px] text-slate-500 font-sans block">mmHg</span>
            </span>
          </div>
        </div>

        {/* Resp Rate */}
        <div className="bg-slate-900/40 border border-slate-900 p-2 rounded-xl flex items-center gap-1.5">
          <span className="text-sky-505 font-bold text-xs">🎚️</span>
          <div className="text-left">
            <span className="text-[7.5px] font-mono uppercase text-slate-550 leading-none block">Respiration Rate</span>
            <span className="text-sm font-mono font-black text-sky-400 leading-tight block mt-0.5">
              {vitals.rr} <span className="text-[7.5px] text-slate-550 font-sans block">Breaths/min</span>
            </span>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center text-[9px] border-t border-slate-900/60 pt-2 font-mono mt-1">
        <div className="flex items-center gap-1 bg-emerald-950/20 border border-emerald-900/30 px-1.5 py-0.5 rounded-md">
          <span className="text-emerald-400">Condition:</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-emerald-300 font-bold">{vitals.condition}</span>
        </div>
        <div className="flex items-center gap-1 bg-amber-955/20 border border-amber-900/30 px-1.5 py-0.5 rounded-md">
          <span className="text-amber-400">Risk Level:</span>
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
          <span className="text-amber-300 font-bold">{vitals.risk}</span>
        </div>
      </div>
    </div>
  );
}

export function HospitalCapacityCard({ hospital }) {
  const currentHospitalName = hospital?.name || "Abbasi Shaheed Hospital";

  return (
    <div className="bg-[#030712]/90 border border-slate-900 rounded-3xl p-5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05),0_8px_24px_rgba(0,0,0,0.6)] text-left">
      <div className="flex justify-between items-center pb-3 border-b border-slate-900/60 mb-2">
        <h4 className="text-xs font-black text-rose-500 uppercase flex items-center gap-1.5 tracking-wider font-mono">
          <span className="text-rose-505">🏥</span>
          HOSPITAL CAPACITY
        </h4>
        <div className="flex items-center gap-1 bg-slate-950 border border-slate-850 px-2 py-0.5 rounded text-[8.5px] font-mono font-bold tracking-wider text-emerald-455">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-505 animate-pulse" />
          Live
        </div>
      </div>

      <div className="text-[10px] font-semibold text-slate-400 block mb-3 font-sans truncate" title={currentHospitalName}>
        {currentHospitalName}
      </div>

      <div className="grid grid-cols-2 gap-2.5 font-mono">
        {/* Beds */}
        <div className="bg-[#061529]/35 border border-sky-955/40 rounded-2xl p-2.5 text-center flex flex-col justify-between hover:border-sky-800/40 transition-all duration-300">
          <span className="text-[7.5px] font-sans font-bold block uppercase tracking-wider text-sky-405">Beds</span>
          <span className="text-base font-black text-slate-100 block my-1">45 / 80</span>
          <span className="text-[7px] text-slate-500 block uppercase leading-none">Available</span>
        </div>

        {/* ICU */}
        <div className="bg-[#1c0a11]/35 border border-rose-955/45 rounded-2xl p-2.5 text-center flex flex-col justify-between hover:border-rose-800/40 transition-all duration-300">
          <span className="text-[7.5px] font-sans font-bold block uppercase tracking-wider text-rose-405">ICU</span>
          <span className="text-base font-black text-rose-450 block my-1">05 / 10</span>
          <span className="text-[7px] text-slate-550 block uppercase leading-none">Available</span>
        </div>

        {/* ER Rooms */}
        <div className="bg-[#140b29]/35 border border-purple-955/45 rounded-2xl p-2.5 text-center flex flex-col justify-between hover:border-purple-800/40 transition-all duration-300">
          <span className="text-[7.5px] font-sans font-bold block uppercase tracking-wider text-purple-405">ER Rooms</span>
          <span className="text-base font-black text-purple-405 block my-1">03 / 05</span>
          <span className="text-[7px] text-slate-550 block uppercase leading-none">Available</span>
        </div>

        {/* Ventilators */}
        <div className="bg-[#171207]/35 border border-amber-955/45 rounded-2xl p-2.5 text-center flex flex-col justify-between hover:border-amber-800/40 transition-all duration-300">
          <span className="text-[7.5px] font-sans font-bold block uppercase tracking-wider text-amber-505">Ventilators</span>
          <span className="text-base font-black text-amber-450 block my-1">12 / 20</span>
          <span className="text-[7px] text-slate-550 block uppercase leading-none">Available</span>
        </div>
      </div>
    </div>
  );
}

export default function VerticalEmergencyMetrics({ 
  status, 
  ambulance, 
  hospital, 
  isPremium 
}) {
  return (
    <div id="vertical-emergency-metrics" className="space-y-6">
      <PatientVitalsCard status={status} isPremium={isPremium} />
      <HospitalCapacityCard hospital={hospital} />
    </div>
  );
}
