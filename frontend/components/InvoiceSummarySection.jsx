import React from "react";
import { DollarSign, FileText } from "lucide-react";

export default function InvoiceSummarySection({ isPremium, generatedSlip, distanceKm, isPaid }) {
  // Safe default calculations if generatedSlip is not loaded yet
  const baseRate = isPremium ? 5000 : 1500;
  const multiplier = isPremium ? 500 : 250;
  const computedDistanceFare = Math.round(distanceKm * multiplier);
  const totalAmount = baseRate + computedDistanceFare;

  const finalBase = generatedSlip?.baseFare || baseRate;
  const finalDistanceFare = generatedSlip?.distanceFare || computedDistanceFare;
  const finalTotal = generatedSlip?.totalAmount || totalAmount;

  return (
    <div className="bg-slate-950/70 backdrop-blur-md border border-slate-900 rounded-3xl p-5 space-y-4 shadow-2xl relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-red-600 via-yellow-500 to-emerald-500" />
      
      <div className="border-b border-slate-900 pb-3">
        <h4 className="text-xs font-black text-rose-500 uppercase flex items-center gap-1.5 tracking-wider font-mono">
          <DollarSign className="w-4 h-4 text-rose-500" />
          Invoice Summary
        </h4>
        <p className="text-[9px] text-slate-500 font-mono block mt-0.5 uppercase">
          Dynamic mileage calculation with priority routing fees
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-stretch">
        {/* Fare details math card */}
        <div className="md:col-span-7 bg-slate-900/40 p-3.5 rounded-2xl border border-slate-900 space-y-3 flex flex-col justify-between">
          <div className="space-y-2.5 font-sans text-xs">
            <span className="text-[9.5px] font-mono font-bold text-slate-500 uppercase block">
              Fare Contribution Breakdown
            </span>
            
            <div className="space-y-1.5 font-mono text-[11px] text-slate-350">
              <div className="flex justify-between items-center bg-slate-950/30 p-1.5 rounded-lg border border-slate-950">
                <span className="text-slate-500">Base Rate Pool:</span>
                <span className="font-bold text-slate-200">Rs. {finalBase.toFixed(2)}</span>
              </div>
              
              <div className="flex justify-between items-center bg-slate-950/30 p-1.5 rounded-lg border border-slate-950">
                <span className="text-slate-500">GPS Mileage Distance:</span>
                <span className="font-bold text-amber-500">{distanceKm.toFixed(1)} km</span>
              </div>

              <div className="flex justify-between items-center bg-slate-950/30 p-1.5 rounded-lg border border-slate-950">
                <span className="text-slate-500">Mileage Surcharge:</span>
                <span className="font-bold text-slate-200">Rs. {finalDistanceFare.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-900/80 pt-3 flex justify-between items-center">
            <span className="text-[10px] font-mono text-slate-400 font-bold uppercase">OUTSTANDING TARIFF:</span>
            <span className={`text-sm font-mono font-black ${isPaid ? "text-emerald-400" : "text-amber-500"} animate-pulse`}>
              Rs. {finalTotal.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Graphical Representation Invoice Document Placeholder Sheet */}
        <div className="md:col-span-5 bg-slate-900/60 p-4 rounded-2xl border border-slate-900 flex flex-col items-center justify-center relative overflow-hidden text-center">
          <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-red-600/10 to-transparent blur-lg pointer-events-none" />
          
          {/* Custom SVG Document illustration representing high-fidelity layout */}
          <div className="w-16 h-20 bg-slate-950 rounded-lg border border-slate-800 flex flex-col justify-between p-2 relative shadow-inner">
            <div className="flex justify-between items-center">
              <span className="w-5 h-1 bg-red-650 rounded-full" />
              <div className={`w-2 h-2 rounded-full ${isPaid ? "bg-emerald-500 animate-pulse" : "bg-red-500"}`} />
            </div>
            
            {/* Pseudo text markers inside illustration */}
            <div className="space-y-1 my-1">
              <div className="w-full h-1 bg-slate-900 rounded" />
              <div className="w-4/5 h-1 bg-slate-900 rounded" />
              <div className="w-2/3 h-1 bg-slate-900 rounded" />
            </div>

            {/* Giant Gold Rs / $ symbol center of illustrated sheet */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-red-500/20 font-black text-2xl font-mono">
              Rs.
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-slate-900">
              <span className="text-[6px] font-mono text-slate-550 uppercase">TOTAL</span>
              <span className="text-[6px] font-mono font-bold text-emerald-405">PKR</span>
            </div>
          </div>

          <div className="mt-3.5 space-y-0.5 font-mono text-[9px]">
            <span className="text-slate-500 block uppercase font-bold">Document Status</span>
            <span className={`font-black uppercase block tracking-wider ${isPaid ? "text-emerald-405" : "text-red-500 animate-pulse"}`}>
              {isPaid ? "✓ SECURE PAID (CLOSED)" : "⚠ TARIFF OUTSTANDING"}
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}
