import React from "react";
import { 
  Bell, 
  Radio, 
  Navigation, 
  MapPin, 
  Check, 
  AlertCircle 
} from "lucide-react";

export default function IncidentFeed({ status, ambulance }) {
  const plate = ambulance?.plateNumber || "PX-31";

  // Match the screenshot's exact 5 items and map them dynamically based on the current simulation state
  const steps = [
    {
      id: "received",
      time: "10:24:10 AM",
      title: "Incident Received",
      desc: "High priority trauma reported",
      isComplete: status !== "IDLE",
      color: "bg-red-500",
      icon: Bell,
    },
    {
      id: "dispatched",
      time: "10:24:12 AM",
      title: `Unit ${plate} Dispatched`,
      desc: "En route to incident location",
      isComplete: !["IDLE", "SCANNING"].includes(status),
      color: "bg-blue-500",
      icon: Radio,
    },
    {
      id: "enroute",
      time: "10:24:18 AM",
      title: "En Route",
      desc: "Unit is on the way",
      isComplete: !["IDLE", "SCANNING"].includes(status),
      color: "bg-emerald-500",
      icon: Navigation,
    },
    {
      id: "approaching",
      time: "10:24:30 AM",
      title: "Approaching Destination",
      desc: "ETA updated",
      isComplete: ["ARRIVED_AT_PATIENT", "CONFIRMED_ARRIVAL", "EN_ROUTE_TO_HOSPITAL", "ARRIVED_AT_HOSPITAL", "ADMITTED"].includes(status),
      color: "bg-amber-500",
      icon: MapPin,
    },
    {
      id: "arrived",
      time: "10:24:30 AM",
      title: "Arrived at Hospital",
      desc: "Patient transferred successfully",
      isComplete: ["ARRIVED_AT_HOSPITAL", "ADMITTED"].includes(status),
      color: "bg-emerald-650",
      icon: Check,
    },
  ];

  return (
    <div className="bg-slate-950/80 border border-slate-900 rounded-2xl p-5 shadow-2xl h-full flex flex-col justify-between">
      {/* Header aligned exactly like screenshot */}
      <div className="flex justify-between items-center pb-4 border-b border-slate-900/60">
        <h4 className="text-xs font-black text-rose-500 uppercase tracking-widest font-mono">
          INCIDENT FEED
        </h4>
        <div className="flex items-center gap-1.5 bg-red-950/20 border border-red-900/40 px-2 py-0.5 rounded text-red-500 font-mono text-[9px] font-bold tracking-wider">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
          LIVE
        </div>
      </div>

      {/* Main logs Feed with separated rows */}
      <div className="divide-y divide-slate-905 flex-1 flex flex-col justify-center">
        {steps.map((step, idx) => {
          const IconComponent = step.icon;
          const isActive = step.isComplete;
          return (
            <div 
              key={step.id} 
              className={`flex items-center py-3.5 px-1 transition-all duration-300 ${
                isActive ? "opacity-100" : "opacity-35"
              }`}
            >
              {/* Leftmost: Circle Icon Badge */}
              <div className={`w-9 h-9 rounded-full ${isActive ? step.color : "bg-slate-900"} flex items-center justify-center text-white shrink-0 shadow-lg`}>
                <IconComponent className="w-4 h-4 text-white" />
              </div>

              {/* Middle: Monospace Digital Timestamp */}
              <div className="ml-4 w-24 shrink-0">
                <span className="text-[10px] font-mono font-bold text-slate-400">
                  {step.time}
                </span>
              </div>

              {/* Rightmost: Title & Subtitle descriptions */}
              <div className="ml-2 text-left">
                <h5 className="text-[11.5px] font-bold text-slate-200 tracking-wide">
                  {step.title}
                </h5>
                <p className="text-[10px] text-slate-500 mt-0.5 font-medium">
                  {step.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
