import React from "react";

export default function ResponseSimulation({ isPremium }) {
  // SVG circular properties
  const radius = 38;
  const stroke = 3;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;

  return (
    <div className="bg-slate-950/80 border border-slate-900 rounded-2xl p-5 shadow-2xl h-full flex flex-col justify-between">
      {/* Header section */}
      <div className="pb-4 border-b border-slate-900/60 flex items-center justify-between">
        <h4 className="text-xs font-black text-rose-500 uppercase tracking-widest font-mono">
          RESPONSE SIMULATION
        </h4>
      </div>

      {/* Dials main row container enclosed in a styled border box */}
      <div className="my-auto bg-slate-955 border border-slate-900/80 rounded-xl p-6 relative">
        <div className="grid grid-cols-12 gap-2 items-center">
          
          {/* LEFT AREA: STANDARD RESPONSE (Blue Dials) */}
          <div className="col-span-4 flex flex-col items-center">
            <span className="text-[10px] text-sky-400 font-mono font-bold uppercase tracking-wider text-center leading-none">
              STANDARD RESPONSE
            </span>
            <span className="text-[8.5px] text-slate-500 font-mono mt-1 font-bold">
              5 MIN WINDOW
            </span>

            {/* Circular Speedometer */}
            <div className="relative flex items-center justify-center mt-5">
              <svg className="w-24 h-24" viewBox="0 0 80 80">
                <circle
                  className="text-slate-900"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="transparent"
                  r={normalizedRadius}
                  cx="40"
                  cy="40"
                />
                <circle
                  className="text-sky-505"
                  strokeWidth="3.5"
                  strokeDasharray={`${circumference} ${circumference}`}
                  style={{ strokeDashoffset: circumference * 0.3 }}
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="transparent"
                  r={normalizedRadius}
                  cx="40"
                  cy="40"
                />
              </svg>
              {/* Inner details text */}
              <div className="absolute text-center leading-none flex flex-col items-center justify-center">
                <span className="text-sm font-black font-mono text-slate-200">
                  00:30
                </span>
                <span className="text-[7.5px] text-slate-505 font-mono uppercase tracking-wide font-black mt-0.5">
                  SIMULATED
                </span>
              </div>
            </div>
          </div>

          {/* MIDDLE AREA: VS SEPARATOR & ACTIVE SELECT STATE */}
          <div className="col-span-4 flex flex-col items-center justify-center text-center">
            {/* VS Badge */}
            <div className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center shadow-lg relative">
              <span className="text-xs font-black font-mono text-slate-400">
                VS
              </span>
            </div>

            {/* Selected feedback indicators */}
            <div className="mt-4 leading-none">
              <span className="text-[9px] font-mono font-black text-slate-505 uppercase tracking-widest block mb-1">
                SELECTED
              </span>
              <span className={`text-xs font-black px-2 py-0.5 rounded uppercase tracking-wider font-mono ${
                isPremium 
                  ? "text-red-500 font-black animate-pulse" 
                  : "text-sky-400 font-black"
              }`}>
                {isPremium ? "PREMIUM" : "STANDARD"}
              </span>
            </div>
          </div>

          {/* RIGHT AREA: PREMIUM RESPONSE (Red/Orange Dials) */}
          <div className="col-span-4 flex flex-col items-center">
            <span className="text-[10px] text-red-505 font-mono font-bold uppercase tracking-wider text-center leading-none">
              PREMIUM RESPONSE
            </span>
            <span className="text-[8.5px] text-slate-500 font-mono mt-1 font-bold">
              2 MIN WINDOW
            </span>

            {/* Circular Speedometer */}
            <div className="relative flex items-center justify-center mt-5">
              <svg className="w-24 h-24" viewBox="0 0 80 80">
                <circle
                  className="text-slate-900"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="transparent"
                  r={normalizedRadius}
                  cx="40"
                  cy="40"
                />
                <circle
                  className="text-red-505"
                  strokeWidth="3.5"
                  strokeDasharray={`${circumference} ${circumference}`}
                  style={{ strokeDashoffset: circumference * 0.15 }}
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="transparent"
                  r={normalizedRadius}
                  cx="40"
                  cy="40"
                />
              </svg>
              {/* Inner details text */}
              <div className="absolute text-center leading-none flex flex-col items-center justify-center">
                <span className="text-sm font-black font-mono text-slate-200">
                  00:20
                </span>
                <span className="text-[7.5px] text-slate-505 font-mono uppercase tracking-wide font-black mt-0.5">
                  SIMULATED
                </span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Bottom info text captions */}
      <div className="pt-4 border-t border-slate-900/60">
        <p className="text-[10px] text-slate-500 font-mono tracking-wide leading-relaxed text-center">
          Simulation compresses real-world travel time for operational training.
        </p>
      </div>
    </div>
  );
}
