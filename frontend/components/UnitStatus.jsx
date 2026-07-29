import React from "react";
import { Siren, Users } from "lucide-react";

export default function UnitStatus({ status, ambulance, imageSrc }) {
  const isActive = status !== "IDLE" && status !== "ADMITTED";

  // Mock crew lists
  const crew = [
    { name: "Dr. Alex Morgan", role: "Critical Paramedic", status: "ONLINE 🟢" },
    { name: "Sam Wilson", role: "Registered Trauma Nurse", status: "ONLINE 🟢" },
    { name: "Riley Carter", role: "Primary EMT Driver", status: "ONLINE 🟢" },
  ];

  return (
    <div className="bg-slate-950/70 backdrop-blur-md border border-slate-900 rounded-3xl p-5 space-y-4 relative overflow-hidden shadow-2xl">
      <div className="border-b border-slate-900 pb-3 flex justify-between items-center">
        <h4 className="text-xs font-black text-rose-500 uppercase flex items-center gap-1.5 tracking-wider font-mono">
          <Siren className="w-4 h-4 text-rose-500" />
          Unit Status
        </h4>
        <span className={`text-[8.5px] font-mono font-bold px-2 py-0.5 rounded-full ${isActive ? "bg-red-950/60 border border-red-900/40 text-red-500" : "bg-slate-900 text-slate-500"}`}>
          {isActive ? `${ambulance?.id?.toUpperCase() || "UNIT PX-31"} DISPATCHED` : "FLEET READY"}
        </span>
      </div>

      <div className="space-y-4 font-sans">
        {/* Ambulance night shot rendering with tactical borders */}
        <div className="relative h-40 bg-slate-900 rounded-2xl overflow-hidden border border-slate-800/80 group">
          {imageSrc ? (
            <img
              src={imageSrc}
              alt="Medical Rescue Ambulance"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-700"
            />
          ) : (
            <div className="w-full h-full bg-slate-900 flex items-center justify-center font-mono text-[10px] text-slate-500">
              No Asset Imagery Loaded
            </div>
          )}
          {/* Neon gradient overlays matching screenshot */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-red-950/20" />
          
          <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md bg-slate-950/90 border border-slate-800 text-[8px] font-mono uppercase tracking-widest text-slate-205">
            ALS Unit System
          </div>

          <div className="absolute bottom-2.5 left-3 text-left">
            <span className="text-[10px] font-mono text-slate-400 block tracking-wide uppercase">Emergency Vehicle</span>
            <span className="text-sm font-black text-slate-100 tracking-wide font-sans block leading-none mt-1">
              {isActive ? ambulance?.plateNumber || "PX-3100-KAR" : "STANDBY POOL ALPHA"}
            </span>
          </div>

          {isActive && (
            <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded bg-red-650 text-white text-[9px] font-mono font-black animate-pulse tracking-wide uppercase">
              EN ROUTE
            </div>
          )}
        </div>

        {/* Assigned Responder specs */}
        {isActive ? (
          <div className="bg-slate-900/50 p-3 rounded-2xl border border-slate-850/80 space-y-2 text-xs">
            <div className="grid grid-cols-2 gap-2 font-mono text-[10.5px]">
              <div>
                <span className="text-slate-500 text-[9px] uppercase block">Lead Paramedic</span>
                <span className="text-slate-200 font-bold block">{ambulance?.driverName || "Alex Morgan"}</span>
              </div>
              <div>
                <span className="text-slate-500 text-[9px] uppercase block">Radio Contact</span>
                <span className="text-emerald-405 font-bold block">{ambulance?.driverPhone || "+92 (300) 911-0"}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-slate-900/40 p-3 rounded-2xl border border-slate-850/40 text-center py-4">
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
              No Responder Dispatched Yet
            </span>
          </div>
        )}

        {/* Paramedic crew list with green online checkmarks */}
        <div className="space-y-2 pt-1 font-sans">
          <span className="text-[9.5px] font-mono text-slate-450 uppercase flex items-center gap-1">
            <Users className="w-3.5 h-3.5 text-slate-500" />
            Active Trauma Crew Roster
          </span>
          <div className="space-y-1.5 pt-1 text-xs">
            {crew.map((member, i) => (
              <div key={i} className="flex justify-between items-center bg-slate-900/20 p-2 rounded-xl border border-slate-900">
                <div className="text-left font-sans">
                  <span className="font-bold text-slate-250 block">{member.name}</span>
                  <span className="text-[9px] font-mono text-slate-500 block">{member.role}</span>
                </div>
                <span className="text-[9.5px] font-mono font-bold text-emerald-450 tracking-wider">
                  {member.status}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
