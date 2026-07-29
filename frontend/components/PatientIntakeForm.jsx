import React from "react";
import { ClipboardList, UserCheck, Flame, Trash2, MapPin } from "lucide-react";

export default function PatientIntakeForm({
  patientForm,
  setPatientForm,
  patientAddress,
  setPatientAddress,
  selectedHospital,
  setSelectedHospital,
  mockHospitals,
  handlePatientSubmit,
  handleInstantEmergency,
  activePatient,
  handleCancelCase, // Action to reset/clear registered cases
}) {
  return (
    <div className="bg-slate-950/70 backdrop-blur-md border border-slate-900 rounded-3xl p-5 md:p-6 space-y-4 shadow-2xl relative overflow-hidden">
      <div className="absolute top-0 right-10 w-32 h-32 bg-red-650/5 rounded-full blur-2xl pointer-events-none" />

      <div className="border-b border-slate-900 pb-3 flex justify-between items-start">
        <div>
          <h4 className="text-xs font-black text-rose-500 uppercase flex items-center gap-1.5 tracking-wider font-mono">
            <ClipboardList className="w-4 h-4 text-rose-500" />
            Trauma Intake Case
          </h4>
          <span className="text-[9.5px] text-slate-500 font-mono block mt-0.5 uppercase">
            Federal clinical emergency logs framework
          </span>
        </div>
        {activePatient && (
          <span className="text-[8px] font-mono font-black bg-emerald-950/60 border border-emerald-900/40 text-emerald-450 px-2 py-0.5 rounded uppercase tracking-wider animate-pulse">
            Locked
          </span>
        )}
      </div>

      {activePatient ? (
        /* Patient Summary display when locked & active */
        <div className="space-y-4">
          <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-900 space-y-3 font-sans text-xs">
            <div className="flex items-center gap-1.5 font-mono text-emerald-450 font-bold border-b border-slate-950 pb-2 mb-2 text-[11px]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              ✓ ACTIVE TARGET PATIENT PROFILE
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-slate-500 block text-[9px] font-mono uppercase">Full Name</span>
                <span className="font-bold text-slate-200 block truncate">{activePatient.name}</span>
              </div>
              <div>
                <span className="text-slate-505 block text-[9px] font-mono uppercase">Age Indicator</span>
                <span className="font-bold text-slate-205 block">{activePatient.age} yrs</span>
              </div>
              <div className="mt-1">
                <span className="text-slate-505 block text-[9px] font-mono uppercase">Blood Category</span>
                <span className="font-extrabold text-red-500 font-mono block">{activePatient.bloodGroup}</span>
              </div>
              <div className="mt-1">
                <span className="text-slate-505 block text-[9px] font-mono uppercase">Trauma Injury</span>
                <span className="font-bold text-slate-200 block truncate">{activePatient.emergencyType}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-950 mt-2">
              <span className="text-slate-500 block text-[9px] font-mono uppercase">Incidence Address Location</span>
              <p className="text-slate-300 font-mono text-[9.5px] leading-relaxed mt-0.5 flex items-start gap-1">
                <MapPin className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
                <span>{patientAddress}</span>
              </p>
            </div>

            {activePatient.additionalNotes && (
              <div className="pt-2 border-t border-slate-950 mt-2">
                <span className="text-slate-500 block text-[9px] font-mono uppercase">Incident Synopsis</span>
                <p className="text-slate-400 block mt-0.5 italic leading-relaxed text-[10.5px]">
                  "{activePatient.additionalNotes}"
                </p>
              </div>
            )}
          </div>

          {/* FACILITY INTAKE CAPACITY HUD */}
          <div className="bg-slate-900/40 p-4 rounded-2xl border border-slate-900 space-y-3 font-sans text-xs">
            <div className="flex justify-between items-center border-b border-slate-950 pb-2">
              <span className="text-[10px] font-mono font-black text-rose-500 uppercase tracking-widest flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                HOSPITAL CAPACITY (LIVE)
              </span>
              <span className="text-[7.5px] font-mono text-slate-500 uppercase font-bold">TELEMETRY</span>
            </div>
            <div className="text-left py-0.5">
              <div className="text-[11px] font-black text-slate-100 flex items-center gap-1">
                <span>🏢</span>
                <span className="truncate">{selectedHospital?.name?.replace("🏥 ", "") || "STANDBY CLINIC"}</span>
              </div>
              <span className="text-[8px] font-mono text-slate-500 block uppercase mt-0.5">ROOM ASSIGNED: {selectedHospital?.assignedRoom || "PENDING"}</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-center text-xs">
              <div className="bg-blue-950/20 border border-blue-900/30 rounded-xl p-2.5 flex flex-col justify-between">
                <span className="text-[8px] font-mono text-slate-550 uppercase tracking-wider block font-bold">Beds</span>
                <span className="text-xs font-mono font-black text-blue-400 mt-1 block">
                  {selectedHospital?.availableBeds || 0} <span className="text-[9px] font-sans text-slate-500">/ 80</span>
                </span>
              </div>

              <div className="bg-red-950/20 border border-red-900/30 rounded-xl p-2.5 flex flex-col justify-between">
                <span className="text-[8px] font-mono text-slate-550 uppercase tracking-wider block font-bold">ICU</span>
                <span className="text-xs font-mono font-black text-red-500 mt-1 block">
                  {selectedHospital?.availableIcuBeds || 0} <span className="text-[9px] font-sans text-slate-500">/ 10</span>
                </span>
              </div>

              <div className="bg-purple-950/20 border border-purple-900/30 rounded-xl p-2.5 flex flex-col justify-between">
                <span className="text-[8px] font-mono text-slate-550 uppercase tracking-wider block font-bold">ER Rooms</span>
                <span className="text-xs font-mono font-black text-purple-400 mt-1 block">
                  {Math.floor((selectedHospital?.availableBeds || 12) / 10) + 1} <span className="text-[9px] font-sans text-slate-500">/ 05</span>
                </span>
              </div>

              <div className="bg-amber-950/20 border border-amber-900/30 rounded-xl p-2.5 flex flex-col justify-between">
                <span className="text-[8px] font-mono text-slate-550 uppercase tracking-wider block font-bold">Ventilators</span>
                <span className="text-xs font-mono font-black text-amber-500 mt-1 block">
                  {Math.floor((selectedHospital?.availableBeds || 12) / 3) + 2} <span className="text-[9px] font-sans text-slate-500">/ 20</span>
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={handleCancelCase}
            className="w-full py-2.5 bg-red-950/40 hover:bg-red-900/40 text-red-400 rounded-xl border border-red-950 hover:border-red-900 font-black font-sans text-[10.5px] flex items-center justify-center gap-1.5 tracking-wider transition-all cursor-pointer shadow uppercase"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Reset Active Profile & Intake New Case</span>
          </button>
        </div>
      ) : (
        /* Fillable Intake Form when idle */
        <form onSubmit={handlePatientSubmit} className="space-y-3.5 font-sans">
          <div className="grid grid-cols-2 gap-2.5">
            <div className="space-y-1 text-left">
              <label className="text-[9px] font-mono font-bold text-slate-400 uppercase block pl-0.5">Patient Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Johnathan Doe"
                className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-900 rounded-xl text-slate-200 focus:outline-none focus:border-red-500 transition-colors"
                value={patientForm.name}
                onChange={(e) => setPatientForm({ ...patientForm, name: e.target.value })}
              />
            </div>

            <div className="space-y-1 text-left">
              <label className="text-[9px] font-mono font-bold text-slate-400 uppercase block pl-0.5">Age (Years)</label>
              <input
                type="number"
                required
                placeholder="e.g. 42"
                min="1"
                max="120"
                className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-900 rounded-xl text-slate-200 focus:outline-none focus:border-red-500 transition-colors"
                value={patientForm.age || ""}
                onChange={(e) => setPatientForm({ ...patientForm, age: parseInt(e.target.value) || 0 })}
              />
            </div>

            <div className="space-y-1 text-left">
              <label className="text-[9px] font-mono font-bold text-slate-400 uppercase block pl-0.5">Blood Group</label>
              <select
                className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-900 rounded-xl text-slate-200 focus:outline-none focus:border-red-500 transition-colors font-mono"
                value={patientForm.bloodGroup}
                onChange={(e) => setPatientForm({ ...patientForm, bloodGroup: e.target.value })}
              >
                {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((g) => (
                  <option key={g} value={g} className="bg-slate-950">{g}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1 text-left">
              <label className="text-[9px] font-mono font-bold text-slate-400 uppercase block pl-0.5">Injury Type</label>
              <select
                className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-900 rounded-xl text-slate-200 focus:outline-none focus:border-red-500 font-sans transition-colors font-semibold"
                value={patientForm.emergencyType}
                onChange={(e) => setPatientForm({ ...patientForm, emergencyType: e.target.value })}
              >
                <option value="Cardiac Arrest" className="bg-slate-950">Cardiac Arrest 💔</option>
                <option value="Severe Trauma / Accident" className="bg-slate-950">Severe Trauma 🚗</option>
                <option value="Asthma Attack / Respiratory" className="bg-slate-950">Asthma Attack 💨</option>
                <option value="Stroke / Neurological" className="bg-slate-950">Stroke 🧠</option>
                <option value="Severe Impairment / Poison" className="bg-slate-950">Seizures 🧪</option>
                <option value="Other Emergency" className="bg-slate-950">Secondary Trauma 🩺</option>
              </select>
            </div>
          </div>

          <div className="space-y-1 text-left">
            <label className="text-[9px] font-mono font-bold text-slate-400 uppercase block pl-0.5">Paramedic Contact Number</label>
            <input
              type="tel"
              required
              placeholder="e.g. +92 (300) 911-384"
              className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-900 rounded-xl text-slate-200 focus:outline-none focus:border-red-500 transition-colors font-mono"
              value={patientForm.contactNumber}
              onChange={(e) => setPatientForm({ ...patientForm, contactNumber: e.target.value })}
            />
          </div>

          <div className="space-y-1 text-left">
            <label className="text-[9px] font-mono font-bold text-slate-400 uppercase block pl-0.5">Incidence GPS Address Pin</label>
            <input
              type="text"
              required
              placeholder="Nazimabad Road Sector 4, Karachi"
              className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-900 rounded-xl text-slate-200 focus:outline-none focus:border-red-500 transition-colors font-mono"
              value={patientAddress}
              onChange={(e) => setPatientAddress(e.target.value)}
            />
          </div>

          <div className="space-y-1 text-left">
            <label className="text-[9px] font-mono font-bold text-slate-400 uppercase block pl-0.5">Symptomatic Log Context</label>
            <textarea
              placeholder="Unconscious, irregular respirations, immediate paramedic care required..."
              rows={1.5}
              className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-900 rounded-xl text-slate-200 focus:outline-none focus:border-red-500 transition-colors font-sans"
              value={patientForm.additionalNotes}
              onChange={(e) => setPatientForm({ ...patientForm, additionalNotes: e.target.value })}
            />
          </div>

          {/* Hospital assignment inside clinical form */}
          <div className="bg-slate-900/40 p-3 rounded-2xl border border-slate-900 space-y-2 text-left">
            <span className="text-[9px] font-mono font-bold text-slate-400 uppercase block pl-0.5">
              Select Intake Facility Target
            </span>
            <div className="grid grid-cols-1 gap-1.5 max-h-32 overflow-y-auto">
              {mockHospitals.map((h) => (
                <div
                  key={h.id}
                  onClick={() => setSelectedHospital(h)}
                  className={`p-2 rounded-xl border transition-all cursor-pointer flex justify-between items-center text-xs ${
                    selectedHospital.id === h.id
                      ? "bg-red-950/20 border-red-500/80 text-white font-bold"
                      : "bg-slate-950 border-slate-900 text-slate-400 hover:border-slate-800"
                  }`}
                >
                  <span className="truncate max-w-[150px]">{h.name}</span>
                  <span className="text-[9px] font-mono text-red-400 font-bold shrink-0">{h.distanceKm.toFixed(1)} km</span>
                </div>
              ))}
            </div>
          </div>

          {/* FACILITY INTAKE CAPACITY HUD IN IDLE */}
          <div className="bg-slate-900/40 p-3.5 rounded-2xl border border-slate-900 space-y-2.5 font-sans text-xs">
            <div className="flex justify-between items-center border-b border-slate-950 pb-2">
              <span className="text-[9.5px] font-mono font-bold text-rose-500 uppercase tracking-wider flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                Capacity Telemetry ({selectedHospital?.name?.split("(")[0]?.replace("🏥 ", "") || "STANDBY"})
              </span>
              <span className="text-[7.5px] font-mono text-slate-500 uppercase font-bold">LIVE TELEMETRY</span>
            </div>

            <div className="grid grid-cols-4 gap-1.5 text-center text-[10px]">
              <div className="bg-blue-950/20 border border-blue-900/30 rounded-lg p-1.5 flex flex-col justify-between">
                <span className="text-[7.5px] font-mono text-slate-500 uppercase tracking-tight block font-bold leading-none">Beds</span>
                <span className="text-xs font-mono font-black text-blue-400 mt-1 block">
                  {selectedHospital?.availableBeds || 0} <span className="text-[8px] font-sans text-slate-550">/ 80</span>
                </span>
              </div>

              <div className="bg-red-950/20 border border-red-900/30 rounded-lg p-1.5 flex flex-col justify-between">
                <span className="text-[7.5px] font-mono text-slate-500 uppercase tracking-tight block font-bold leading-none">ICU</span>
                <span className="text-xs font-mono font-black text-red-500 mt-1 block">
                  {selectedHospital?.availableIcuBeds || 0} <span className="text-[8px] font-sans text-slate-550">/ 10</span>
                </span>
              </div>

              <div className="bg-purple-950/20 border border-purple-900/30 rounded-lg p-1.5 flex flex-col justify-between">
                <span className="text-[7.5px] font-mono text-slate-500 uppercase tracking-tight block font-bold leading-none">ER Rooms</span>
                <span className="text-xs font-mono font-black text-purple-400 mt-1 block">
                  {Math.floor((selectedHospital?.availableBeds || 12) / 10) + 1} <span className="text-[8px] font-sans text-slate-550">/ 05</span>
                </span>
              </div>

              <div className="bg-amber-950/20 border border-amber-900/30 rounded-lg p-1.5 flex flex-col justify-between">
                <span className="text-[7.5px] font-mono text-slate-500 uppercase tracking-tight block font-bold leading-none">Vents</span>
                <span className="text-xs font-mono font-black text-amber-500 mt-1 block">
                  {Math.floor((selectedHospital?.availableBeds || 12) / 3) + 2} <span className="text-[8px] font-sans text-slate-550">/ 20</span>
                </span>
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-red-650 to-red-650 hover:bg-opacity-90 text-white py-2.5 rounded-xl text-[11px] font-black font-sans uppercase tracking-[1.5px] border border-red-500/20 shadow-lg cursor-pointer transition-all flex items-center justify-center gap-2"
          >
            <UserCheck className="w-4 h-4" />
            <span>Register & Dispatch Case</span>
          </button>

          {/* Direct Tap Emergency SOS Bypass */}
          <div className="pt-2 border-t border-slate-900 mt-2 text-center text-slate-500 text-[10px] space-y-2">
            <p className="font-mono uppercase text-[9px]">Critical Trauma Transit Bypass Access</p>
            <button
              type="button"
              onClick={handleInstantEmergency}
              className="w-full py-2 bg-red-955 hover:bg-red-950 text-red-200 hover:text-white rounded-xl border border-red-900 hover:border-red-500 transition-all font-black font-mono text-[10.5px] flex items-center justify-center gap-2 tracking-wider shadow-md cursor-pointer"
            >
              <Flame className="w-3.5 h-3.5 text-red-505 animate-bounce" />
              <span>🚨 DIRECT ONE-TAP SOS BYPASS</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
