import React, { useState, useEffect } from "react";
import { Activity, Heart } from "lucide-react";

export default function VitalsMonitor({ status, isPremium }) {
  const [pulseLineIndex, setPulseLineIndex] = useState(0);
  const [heartRate, setHeartRate] = useState(0);
  const [spO2, setSpO2] = useState(98);
  const [respRate, setRespRate] = useState(16);
  const [bp, setBP] = useState("120/80");

  const isActive = status !== "IDLE" && status !== "ADMITTED";

  useEffect(() => {
    if (!isActive) {
      setHeartRate(0);
      setSpO2(99);
      setRespRate(15);
      setBP("120/80");
      return;
    }

    // Live fluctuate simulation for trauma patient
    const interval = setInterval(() => {
      // Premium emergency is more critical (faster pulse, higher BP)
      if (isPremium) {
        setHeartRate(Math.floor(108 + Math.random() * 24)); // 108 to 132
        setBP(`14${Math.floor(Math.random() * 8)}/${88 + Math.floor(Math.random() * 8)}`);
        setSpO2(Math.floor(92 + Math.random() * 4)); // 92 to 96%
        setRespRate(Math.floor(22 + Math.random() * 5)); // 22 to 27
      } else {
        setHeartRate(Math.floor(82 + Math.random() * 12)); // 82 to 94
        setBP(`128/${80 + Math.floor(Math.random() * 6)}`);
        setSpO2(Math.floor(96 + Math.random() * 3)); // 96 to 99%
        setRespRate(Math.floor(18 + Math.random() * 3)); // 18 to 21
      }
    }, 1800);

    return () => clearInterval(interval);
  }, [isActive, isPremium]);

  return (
    <div className="bg-slate-950/70 backdrop-blur-md border border-slate-900 rounded-3xl p-5 space-y-4 relative overflow-hidden shadow-2xl">
      <div className="border-b border-slate-900 pb-3 flex justify-between items-center">
        <h4 className="text-xs font-black text-rose-500 uppercase flex items-center gap-1.5 tracking-wider font-mono">
          <Activity className="w-4 h-4 animate-pulse" />
          Patient Vitals (LIVE)
        </h4>
        <span className={`text-[8px] font-mono font-bold px-2 py-0.5 rounded-full ${isActive ? "bg-red-950/60 border border-red-900/40 text-red-500 animate-pulse" : "bg-slate-900 text-slate-500"}`}>
          {isActive ? "PATIENT MONITOR SIGNAL" : "SIGNAL STANDBY"}
        </span>
      </div>

      <div className="space-y-4">
        {/* ECG Neon Heartbeat Wave Line Animation */}
        <div className="relative w-full h-16 bg-slate-950 border border-slate-900/80 rounded-xl overflow-hidden flex items-center justify-center">
          <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:8px_8px] opacity-25" />
          <svg className={`absolute inset-0 w-full h-full stroke-2 ${isActive ? "text-emerald-500" : "text-slate-700/60"}`} fill="none" viewBox="0 0 300 60" stroke="currentColor">
            <path
              d="M0,30 L60,30 L70,30 L80,10 L90,50 L100,25 L110,35 L120,30 L180,30 L190,30 L200,5 L210,55 L220,20 L230,40 L240,30 L300,30"
              strokeDasharray="600"
              strokeDashoffset="600"
              className={isActive ? "animate-[ecgStroke_2s_linear_infinite]" : ""}
            />
          </svg>
          <style>{`
            @keyframes ecgStroke {
              to {
                stroke-dashoffset: 0;
              }
            }
          `}</style>
          {!isActive && (
            <div className="absolute font-mono text-[9px] text-slate-500 uppercase tracking-widest bg-slate-950 px-2 py-0.5 rounded">
              Telemetry Standby
            </div>
          )}
        </div>

        {/* Vital Stats Grid */}
        <div className="grid grid-cols-2 gap-2.5 font-sans">
          <div className="bg-slate-900/50 p-3 rounded-2xl border border-slate-850/60 flex items-center justify-between">
            <div>
              <span className="text-slate-500 block text-[9px] font-mono uppercase">Heart Rate</span>
              <span className={`text-base font-black tracking-tight ${isActive ? "text-slate-200" : "text-slate-500"}`}>
                {isActive ? heartRate : "--"} <span className="text-[10px] font-normal text-slate-500">BPM</span>
              </span>
            </div>
            {isActive && (
              <Heart className="w-4 h-4 text-red-500 fill-red-500 animate-ping absolute right-8" />
            )}
          </div>

          <div className="bg-slate-900/50 p-3 rounded-2xl border border-slate-850/60">
            <span className="text-slate-500 block text-[9px] font-mono uppercase">Blood Pressure</span>
            <span className={`text-sm font-black tracking-tight ${isActive ? "text-slate-200" : "text-slate-500"}`}>
              {isActive ? bp : "--/--"} <span className="text-[8px] font-normal text-slate-500">mmHg</span>
            </span>
          </div>

          <div className="bg-slate-900/50 p-3 rounded-2xl border border-slate-850/60">
            <span className="text-slate-500 block text-[9px] font-mono uppercase">Oxygen Saturation</span>
            <span className={`text-sm font-black tracking-tight ${isActive ? "text-emerald-400" : "text-slate-500"}`}>
              {isActive ? `${spO2}%` : "--%"} <span className="text-[8px] font-normal text-slate-500">SpO2</span>
            </span>
          </div>

          <div className="bg-slate-900/50 p-3 rounded-2xl border border-slate-850/60">
            <span className="text-slate-500 block text-[9px] font-mono uppercase">Respiration Rate</span>
            <span className={`text-sm font-black tracking-tight ${isActive ? "text-slate-200" : "text-slate-500"}`}>
              {isActive ? `${respRate} rpm` : "-- rpm"}
            </span>
          </div>
        </div>

        {isActive && (
          <div className="bg-red-950/20 border border-red-900/40 p-2.5 rounded-xl text-center">
            <span className="text-[9.5px] font-mono font-bold text-red-500 animate-pulse tracking-wide uppercase">
              ⚠️ MONITOR LOCK: CRITICAL CLINICAL EMERGENCY STATE
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
