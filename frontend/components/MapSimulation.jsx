import { useEffect, useRef, useState, useMemo } from "react";
import { Navigation, Compass, Siren, ShieldCheck, Milestone, Globe, Map as MapIcon, ArrowUp, AlertTriangle } from "lucide-react";
import { MOCK_AMBULANCES } from "../data";

const STANDBY_STATUSES = {
  amb_01: "available",
  amb_02: "busy",
  amb_03: "available",
  amb_04: "offline",
  amb_05: "available"
};

// Predefined landmark coordinates in Karachi for mock mapping and routing
const REAL_COORDS = {
  pakistanCenter: { lat: 30.3753, lng: 69.3451 },
  karachiCenter: { lat: 24.8607, lng: 67.0011 },
  patientDefault: { lat: 24.9157, lng: 67.0270 }, // Nazimabad Block 3 Karachi
  hospitals: {
    hosp_metro: { lat: 24.9189, lng: 67.0336 }, // Abbasi Shaheed Hospital (Nazimabad No. 3)
    hosp_mercy: { lat: 24.9431, lng: 67.0357 }, // Ziauddin University Hospital (North Nazimabad)
    hosp_st_jude: { lat: 24.9319, lng: 67.0381 }, // Imam Clinic & Hospital (Five Star Chowrangi)
    hosp_valley: { lat: 24.8943, lng: 67.0494 } // Liaquat National Hospital
  }
};

// Map canvas coordinates from App.jsx candidates (0-400 span) down to realistic Karachi GPS locations
const mapCanvasToGps = (canvasX, canvasY, referenceAddress = "") => {
  // Use address keyword matching for authentic localization offsets
  const isNazimabad = referenceAddress.toLowerCase().includes("nazimabad");
  const isClifton = referenceAddress.toLowerCase().includes("clifton") || referenceAddress.toLowerCase().includes("defense") || referenceAddress.toLowerCase().includes("phase");
  
  let baseCoords = { ...REAL_COORDS.patientDefault };
  if (isClifton) {
    baseCoords = { lat: 24.8138, lng: 67.0315 }; // Clifton Karachi
  } else if (isNazimabad) {
    baseCoords = { lat: 24.9127, lng: 67.0315 }; // Nazimabad Karachi
  }

  // Linear scaling offsets to transform 0-400 canvas bounds into Karachi region GPS offsets
  const latOffset = ((canvasY - 220) * 0.00018); // Scaled scale factor
  const lngOffset = ((canvasX - 200) * 0.00018);
  
  return {
    lat: baseCoords.lat - latOffset, // Invert Y axis for map lat matching standard screen orientation
    lng: baseCoords.lng + lngOffset
  };
};

// Great-circle distance using Haversine formula
function getHaversineDistance(c1, c2) {
  if (!c1 || !c2) return 0;
  const R = 6371; // Earth radius in km
  const dLat = (c2.lat - c1.lat) * Math.PI / 180;
  const dLng = (c2.lng - c1.lng) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(c1.lat * Math.PI / 180) * Math.cos(c2.lat * Math.PI / 180) * 
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Live bearing compass calculation
function getBearing(c1, c2) {
  if (!c1 || !c2) return 0;
  const lat1 = c1.lat * Math.PI / 180;
  const lat2 = c2.lat * Math.PI / 180;
  const dLng = (c2.lng - c1.lng) * Math.PI / 180;
  
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) -
            Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  let brng = Math.atan2(y, x) * 180 / Math.PI;
  return (brng + 360) % 360;
}

function getCompassDirection(bearing) {
  const directions = ["North", "North-East", "East", "South-East", "South", "South-West", "West", "North-West"];
  const index = Math.round(bearing / 45) % 8;
  return directions[index];
}

// Helper to generate grid-aligned route coordinates that follow city streets and road lines
const generateGpsRoute = (start, end, steps = 300) => {
  const points = [];
  
  // We want to simulate standard road directions following a grid of streets/avenues.
  // Instead of a direct rough line, we simulate a realistic multi-turn street route.
  const latDiff = end.lat - start.lat;
  const lngDiff = end.lng - start.lng;
  
  // Anchor points that outline the route along orthogonal roads (block structures):
  // 1. Start coordinate
  // 2. Drive along the longitude road (East-West street) to about 40% of the destination longitude
  // 3. Turn onto a major Ave (North-South) and go down to 100% of the destination latitude
  // 4. Turn onto the target street (East-West) to reach the final longitude
  const anchors = [
    { lat: start.lat, lng: start.lng },
    { lat: start.lat, lng: start.lng + lngDiff * 0.4 },
    { lat: start.lat + latDiff * 1.0, lng: start.lng + lngDiff * 0.4 },
    { lat: start.lat + latDiff * 1.0, lng: end.lng },
    { lat: end.lat, lng: end.lng }
  ];
  
  // Compute individual distances of each step so we can allocate index counts smoothly
  const distances = [];
  let totalDis = 0;
  for (let s = 0; s < anchors.length - 1; s++) {
    const d = getHaversineDistance(anchors[s], anchors[s+1]);
    distances.push(d);
    totalDis += d;
  }
  
  if (totalDis === 0) {
    for (let i = 0; i <= steps; i++) {
      points.push({ lat: start.lat, lng: start.lng });
    }
    return points;
  }
  
  let currentStep = 0;
  for (let s = 0; s < anchors.length - 1; s++) {
    const sStart = anchors[s];
    const sEnd = anchors[s+1];
    
    // Distribute steps based on segment distance relative weights
    let segmentSteps = Math.round((distances[s] / totalDis) * steps);
    
    // Adjust last segment to match precision steps
    if (s === anchors.length - 2) {
      segmentSteps = steps - currentStep;
    }
    
    for (let j = 0; j < segmentSteps; j++) {
      const t = j / segmentSteps;
      const lat = sStart.lat + (sEnd.lat - sStart.lat) * t;
      const lng = sStart.lng + (sEnd.lng - sStart.lng) * t;
      points.push({ lat, lng });
      currentStep++;
    }
  }
  
  points.push({ lat: end.lat, lng: end.lng });
  return points;
};

export default function MapSimulation({
  status,
  currentAddress,
  ambulance,
  hospital,
  searchingAmbulances = [],
  onArrivedAtPatient,
  onRouteCompleted,
  onSelectAmbulance,
  isPremiumEmergency = false,
}) {
  const containerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  
  // Script / Asset Load States
  const [leafletLoaded, setLeafletLoaded] = useState(false);
  const [mapStyle, setMapStyle] = useState("night"); // standard, night, satellite
  const [tick, setTick] = useState(0);

  // Core GPS Locations
  const [patientGps, setPatientGps] = useState(REAL_COORDS.patientDefault);
  const [hospitalGps, setHospitalGps] = useState(REAL_COORDS.hospitals.hosp_metro);
  
  // Real-time Telemetry state
  const [ambulanceGps, setAmbulanceGps] = useState(REAL_COORDS.patientDefault);
  const [prevAmbulanceGps, setPrevAmbulanceGps] = useState(null);
  const [activeRoutePoints, setActiveRoutePoints] = useState([]);
  const [routeIndex, setRouteIndex] = useState(0);

  // Visual metrics displays
  const [distanceRemaining, setDistanceRemaining] = useState(0);
  const [bearingDegree, setBearingDegree] = useState(0);
  const [compassText, setCompassText] = useState("North");
  const [currentStreetName, setCurrentStreetName] = useState("Nazimabad Boulevard, District Central, Karachi");
  const [searchQuery, setSearchQuery] = useState("");

  const [searchRadius, setSearchRadius] = useState(10); // Configurable search radius (1km to 15km)
  const [driftOffset, setDriftOffset] = useState(0);

  useEffect(() => {
    const driftTimer = setInterval(() => {
      setDriftOffset((prev) => prev + 0.05);
    }, 1500);
    return () => clearInterval(driftTimer);
  }, []);

  const getStandbyGps = (amb, baseGps) => {
    let offsetLat = 0;
    let offsetLng = 0;
    
    if (amb.id === "amb_01") { offsetLat = 0.008; offsetLng = -0.007; }
    else if (amb.id === "amb_02") { offsetLat = -0.015; offsetLng = 0.014; }
    else if (amb.id === "amb_03") { offsetLat = 0.022; offsetLng = -0.019; }
    else if (amb.id === "amb_04") { offsetLat = -0.038; offsetLng = -0.029; }
    else if (amb.id === "amb_05") { offsetLat = 0.052; offsetLng = 0.048; }
    
    let liveDriftLat = 0;
    let liveDriftLng = 0;
    const sValue = STANDBY_STATUSES[amb.id] || "available";
    if (sValue !== "offline") {
      liveDriftLat = 0.0006 * Math.sin(driftOffset + (parseFloat(amb.id.replace("amb_", "")) || 5));
      liveDriftLng = 0.0006 * Math.cos(driftOffset + (parseFloat(amb.id.replace("amb_", "")) || 5));
    }
    
    return {
      lat: baseGps.lat + offsetLat + liveDriftLat,
      lng: baseGps.lng + offsetLng + liveDriftLng
    };
  };

  const standbyAmbulances = useMemo(() => {
    return MOCK_AMBULANCES.map((amb) => {
      const sValue = STANDBY_STATUSES[amb.id] || "available";
      const gps = getStandbyGps(amb, patientGps);
      const distanceKm = getHaversineDistance(patientGps, gps);
      const etaMinutes = Math.max(1, Math.round(distanceKm * 2.2));
      return {
        ...amb,
        status: sValue,
        gps,
        distanceKm,
        etaMinutes
      };
    });
  }, [patientGps, driftOffset]);

  const nearbyDrivers = useMemo(() => {
    return standbyAmbulances.filter(amb => amb.distanceKm <= searchRadius);
  }, [standbyAmbulances, searchRadius]);

  // Map markers & layers instances
  const markersRef = useRef({
    patient: null,
    hospital: null,
    ambulance: null,
    searching: [],
    polyline: null,
    traveledPolyline: null,
    polylineTeal: null,
    polylineRed: null,
    polylineSeg1: null,
    polylineSeg2: null,
    polylineSeg3: null,
    polylineSeg4: null,
    milestones: []
  });

  // Calculate coordinates dynamically based on user typed address
  useEffect(() => {
    if (currentAddress) {
      const parsedGps = mapCanvasToGps(200, 220, currentAddress);
      setPatientGps(parsedGps);
    }
  }, [currentAddress]);

  // Handle hospital selection updates
  useEffect(() => {
    if (hospital) {
      if (REAL_COORDS.hospitals[hospital.id]) {
        setHospitalGps(REAL_COORDS.hospitals[hospital.id]);
      } else {
        const fallBackGps = mapCanvasToGps(hospital.longitude, hospital.latitude, currentAddress);
        setHospitalGps(fallBackGps);
      }
    }
  }, [hospital, currentAddress]);

  // Load Leaflet CDN script & styles safely
  useEffect(() => {
    if (window.L) {
      setLeafletLoaded(true);
      return;
    }

    const cssId = "leaflet-style-cdn";
    if (!document.getElementById(cssId)) {
      const link = document.createElement("link");
      link.id = cssId;
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }

    const scriptId = "leaflet-script-cdn";
    if (!document.getElementById(scriptId)) {
      const script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.onload = () => setLeafletLoaded(true);
      document.body.appendChild(script);
    } else {
      const interval = setInterval(() => {
        if (window.L) {
          setLeafletLoaded(true);
          clearInterval(interval);
        }
      }, 100);
      return () => clearInterval(interval);
    }
  }, []);

  // Map initialization
  useEffect(() => {
    if (!leafletLoaded || !containerRef.current || mapInstanceRef.current) return;

    // Create Leaflet Map centered overall on Pakistan with high capability Zoom
    const map = window.L.map(containerRef.current, {
      center: [30.3753, 69.3451], // Central Pakistan coordinates
      zoom: 5,
      zoomControl: false,
      attributionControl: false
    });

    mapInstanceRef.current = map;
    updateTileLayer(mapStyle);

    // Dynamic scale helper
    window.L.control.scale({ position: "bottomright" }).addTo(map);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [leafletLoaded]);

  // Redraw Tile layers on map style changes
  const updateTileLayer = (style) => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Remove old layers
    map.eachLayer((layer) => {
      if (layer instanceof window.L.TileLayer) {
        map.removeLayer(layer);
      }
    });

    let tileUrl = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"; // Standard fallback with names
    if (style === "night") {
      tileUrl = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
    } else if (style === "satellite") {
      tileUrl = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
    }

    window.L.tileLayer(tileUrl, {
      maxZoom: 19,
      attribution: "© OpenStreetMap contributors"
    }).addTo(map);

    // If satellite view, let's overlap a light street label layer so place names are visible!
    if (style === "satellite") {
      window.L.tileLayer("https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png", {
        maxZoom: 19
      }).addTo(map);
    }
  };

  useEffect(() => {
    updateTileLayer(mapStyle);
  }, [mapStyle, leafletLoaded]);

  // Synchronize layout fly-centers when dispatch state changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !leafletLoaded) return;

    if (status === "IDLE") {
      // Show overall Pakistan
      map.setView([30.3753, 69.3451], 5, { animate: true, duration: 2.5 });
    } else if (status === "SCANNING") {
      // Fly into Karachi Metropolitan Medical Hub
      map.setView([patientGps.lat, patientGps.lng], 13, { animate: true, duration: 3.0 });
    } else if (status === "DISPATCHED" || status === "CONFIRMED_ARRIVAL" || status === "EN_ROUTE_TO_HOSPITAL") {
      // Zoom right into the clinical emergency area block names
      map.setView([patientGps.lat, patientGps.lng], 15, { animate: true, duration: 2.0 });
    }
  }, [status, patientGps, leafletLoaded]);

  // Setup/Switch route calculation points
  useEffect(() => {
    if (status === "IDLE") {
      setAmbulanceGps(patientGps);
      setActiveRoutePoints([]);
      setRouteIndex(0);
      setDistanceRemaining(0);
    } else if (status === "DISPATCHED") {
      // Map canvas-based simulated start to real GPS coords
      const startPoint = ambulance 
        ? mapCanvasToGps(ambulance.longitude, ambulance.latitude, currentAddress)
        : { lat: patientGps.lat + 0.012, lng: patientGps.lng - 0.015 }; // From a few km away
      
      const routePoints = generateGpsRoute(startPoint, patientGps, 300); // 300 steps * 200ms = 60 seconds (1 min)
      setActiveRoutePoints(routePoints);
      setAmbulanceGps(startPoint);
      setRouteIndex(0);
    } else if (status === "CONFIRMED_ARRIVAL" || status === "EN_ROUTE_TO_HOSPITAL" || status === "ARRIVED_AT_PATIENT") {
      const startPoint = patientGps;
      const endPoint = hospitalGps;
      
      const routePoints = generateGpsRoute(startPoint, endPoint, 300); // 300 steps * 200ms = 60 seconds (1 min)
      setActiveRoutePoints(routePoints);
      setAmbulanceGps(startPoint);
      setRouteIndex(0);
    }
  }, [status, hospitalGps, patientGps, ambulance]);

  // Linear position indexing increments
  useEffect(() => {
    if (activeRoutePoints.length === 0) return;

    let timer = null;
    if (
      status === "DISPATCHED" ||
      status === "CONFIRMED_ARRIVAL" ||
      status === "EN_ROUTE_TO_HOSPITAL"
    ) {
      // 20 sec for premium emergency (2 mins ETA), 30 sec for standard SOS (5 mins ETA)
      const intervalMs = isPremiumEmergency ? 66 : 100;

      timer = setInterval(() => {
        setRouteIndex((prevIndex) => {
          const nextIndex = prevIndex + 1;
          if (nextIndex >= activeRoutePoints.length) {
            clearInterval(timer);
            return prevIndex;
          }
          return nextIndex;
        });
      }, intervalMs);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [activeRoutePoints, status, isPremiumEmergency]);

  // Listen for route index state progress to trigger callbacks and compute telemetry metrics
  useEffect(() => {
    if (activeRoutePoints.length === 0) return;

    if (routeIndex >= activeRoutePoints.length - 1) {
      if (status === "DISPATCHED") {
        onArrivedAtPatient();
      } else if (status === "CONFIRMED_ARRIVAL" || status === "EN_ROUTE_TO_HOSPITAL") {
        onRouteCompleted();
      }
      return;
    }

    const currentPos = activeRoutePoints[routeIndex];
    if (currentPos) {
      setPrevAmbulanceGps(ambulanceGps);
      setAmbulanceGps(currentPos);

      // Compute Distance metric in real time
      const targetDest = (status === "DISPATCHED") ? patientGps : hospitalGps;
      const distKm = getHaversineDistance(currentPos, targetDest);
      setDistanceRemaining(distKm);

      // Compute Bearing Compass Heading angle and cardinal
      const bearing = getBearing(currentPos, targetDest);
      setBearingDegree(bearing);
      setCompassText(getCompassDirection(bearing));

      // Dynamic local Karachi neighborhood street generator HUD based on relative distance offsets
      const streetIndex = Math.floor(routeIndex / 70) % 5;
      const streetStops = [
        "Nazimabad Main Commercial Highway, Karachi",
        "Sir Syed Chowrangi Underpass Interchange, Karachi",
        "Altaf Ali Barelvi Rd (Block 3 Core), District Central, Karachi",
        "Board Office Chowrangi Flyover, Karachi",
        "Ziauddin Medical Road Expressway, Karachi"
      ];
      setCurrentStreetName(streetStops[streetIndex]);
    }
  }, [routeIndex, activeRoutePoints, status, patientGps, hospitalGps]);

  // Live Drawing Markers & Overlays inside Leaflet Container
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !leafletLoaded) return;

    // Clear old components safely
    const m = markersRef.current;
    if (m.patient) { map.removeLayer(m.patient); m.patient = null; }
    if (m.hospital) { map.removeLayer(m.hospital); m.hospital = null; }
    if (m.ambulance) { map.removeLayer(m.ambulance); m.ambulance = null; }
    m.searching.forEach((mark) => map.removeLayer(mark));
    m.searching = [];
    if (m.polyline) { map.removeLayer(m.polyline); m.polyline = null; }
    if (m.traveledPolyline) { map.removeLayer(m.traveledPolyline); m.traveledPolyline = null; }
    if (m.polylineTeal) { map.removeLayer(m.polylineTeal); m.polylineTeal = null; }
    if (m.polylineRed) { map.removeLayer(m.polylineRed); m.polylineRed = null; }
    if (m.polylineSeg1) { map.removeLayer(m.polylineSeg1); m.polylineSeg1 = null; }
    if (m.polylineSeg2) { map.removeLayer(m.polylineSeg2); m.polylineSeg2 = null; }
    if (m.polylineSeg3) { map.removeLayer(m.polylineSeg3); m.polylineSeg3 = null; }
    if (m.polylineSeg4) { map.removeLayer(m.polylineSeg4); m.polylineSeg4 = null; }
    if (m.milestones) {
      m.milestones.forEach((mark) => map.removeLayer(mark));
      m.milestones = [];
    }

    const L = window.L;

    // Define custom high-end neon styled divIcons for clean React layouts to match user uploaded screenshot perfectly
    const patientIcon = L.divIcon({
      className: "custom-patient-locator",
      html: `
        <div class="relative flex flex-col items-center justify-center select-none animate-fade-in" style="width: 120px; height: 120px;">
          <!-- Location Name Label above the pin exactly as screenshot -->
          <div class="absolute -top-8 flex flex-col items-center justify-center text-center whitespace-nowrap animate-pulse" style="filter: drop-shadow(0px 2px 6px rgba(0,0,0,0.97));">
            <span class="text-[13px] font-extrabold text-emerald-400 bg-slate-950/90 border border-emerald-500/30 px-2.5 py-1 rounded-lg tracking-wide uppercase font-sans">${currentAddress || "Gulshan-e-Iqbal"}</span>
          </div>

          <!-- Pulsing green concentric circles on the ground matching image -->
          <div class="absolute w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 animate-ping" style="animation-duration: 3s; transform: scaleY(0.55);"></div>
          <div class="absolute w-8 h-8 rounded-full bg-emerald-500/20 border-2 border-emerald-500/50 animate-pulse" style="transform: scaleY(0.55);"></div>
          
          <!-- Elegant green pin pointing directly to coordinates -->
          <div class="absolute flex items-center justify-center" style="transform: translateY(-20px);">
            <svg width="28" height="38" viewBox="0 0 32 42" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0px 4px 6px rgba(0,0,0,0.6));">
              <path d="M16 0C7.16 0 0 7.16 0 16c0 11.25 14.5 24.8 15.12 25.37.5.47 1.25.47 1.76 0C17.5 40.8 32 27.25 32 16 32 7.16 24.84 0 16 0z" fill="#22c55e" />
              <circle cx="16" cy="16" r="6" fill="#ffffff" />
            </svg>
          </div>
        </div>
      `,
      iconSize: [120, 120],
      iconAnchor: [60, 80]
    });

    const hospitalIcon = L.divIcon({
      className: "custom-hospital-locator",
      html: `
        <div class="relative flex flex-col items-center justify-center select-none animate-fade-in" style="width: 120px; height: 120px;">
          <!-- Pulsing red concentric circles on the ground matching image -->
          <div class="absolute w-14 h-14 rounded-full bg-red-500/15 border border-red-500/30 animate-ping" style="animation-duration: 3s; transform: scaleY(0.55);"></div>
          <div class="absolute w-9 h-9 rounded-full bg-red-500/25 border-2 border-red-500/50 animate-pulse" style="transform: scaleY(0.55);"></div>

          <!-- Elegant red pin pointing directly to coordinates -->
          <div class="absolute flex items-center justify-center" style="transform: translateY(-20px);">
            <svg width="28" height="38" viewBox="0 0 32 42" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0px 4px 6px rgba(0,0,0,0.6));">
              <path d="M16 0C7.16 0 0 7.16 0 16c0 11.25 14.5 24.8 15.12 25.37.5.47 1.25.47 1.76 0C17.5 40.8 32 27.25 32 16 32 7.16 24.84 0 16 0z" fill="#ef4444" />
              <circle cx="16" cy="16" r="6" fill="#ffffff" />
            </svg>
          </div>

          <!-- Location Name Label below the pin exactly as screenshot -->
          <div class="absolute top-[48px] flex flex-col items-center justify-center text-center whitespace-nowrap" style="filter: drop-shadow(0px 2px 5px rgba(0,0,0,0.95));">
            <span class="text-[12px] font-black text-white tracking-tight leading-tight uppercase font-sans">${hospital?.name || "City Medical Center"}</span>
          </div>
        </div>
      `,
      iconSize: [120, 120],
      iconAnchor: [60, 80]
    });

    // 1. Plot Patient Marker
    if (status !== "IDLE") {
      m.patient = L.marker([patientGps.lat, patientGps.lng], { icon: patientIcon }).addTo(map)
        .bindPopup(`<strong class="text-xs text-red-500">🚑 PATIENT SOS LOCATION</strong><br><span class="text-[10px] text-slate-600">${currentAddress}</span>`);
    }

    // 2. Plot Hospital Med-center
    if (status !== "IDLE" && hospital) {
      m.hospital = L.marker([hospitalGps.lat, hospitalGps.lng], { icon: hospitalIcon }).addTo(map)
        .bindPopup(`<strong class="text-xs text-teal-500">${hospital.name}</strong><br><span class="text-[10px] text-slate-600">Assigned Room: ${hospital.assignedRoom}</span>`);
    }

    // 3. Draw Standby / Interconnected Radars on IDLE or SCANNING mode within configured search radius
    if (status === "IDLE" || status === "SCANNING") {
      nearbyDrivers.forEach((amb) => {
        const pinColorClass = amb.status === "available" ? "text-emerald-400" : amb.status === "busy" ? "text-amber-400" : "text-slate-500";
        const indicatorDot = amb.status === "available" ? "🟢" : amb.status === "busy" ? "🟡" : "⚫";
        
        const standbyIcon = L.divIcon({
          className: `standby-ambulance-marker-${amb.id}`,
          html: `
            <div class="relative flex flex-col items-center justify-center select-none" style="width: 64px; height: 64px; cursor: pointer;">
              <!-- High fidelity 2D Side-profile Black Ambulance -->
              <svg width="44" height="44" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" class="mb-1" style="filter: drop-shadow(0px 3px 5px rgba(0,0,0,0.4));">
                <!-- Dropped shadow beneath the vehicle -->
                <ellipse cx="32" cy="50" rx="22" ry="5" fill="#000000" opacity="0.45" />

                <!-- Chassis connection -->
                <rect x="12" y="44" width="40" height="2" fill="#1e293b" />

                <!-- Main Body Back Compartment (Glossy Black hull) -->
                <rect x="6" y="20" width="34" height="25" rx="3" fill="#111827" stroke="#4b5563" stroke-width="1.2" />
                
                <!-- Main Cab Front Compartment (Glossy Black hull) -->
                <path d="M 40,26 L 50,26 L 58,34 L 58,45 L 40,45 Z" fill="#1f2937" stroke="#4b5563" stroke-width="1.2" />

                <!-- White medical badge with red cross -->
                <circle cx="20" cy="32" r="6" fill="#ffffff" stroke="#cb4141" stroke-width="0.75" />
                <path d="M 17,32 L 23,32 M 20,29 L 20,35" stroke="#ef4444" stroke-width="2" stroke-linecap="round" />

                <!-- White & red striping -->
                <rect x="6" y="38" width="34" height="2" fill="#ffffff" />
                <rect x="6" y="40" width="34" height="1.5" fill="#ef4444" />
                <rect x="40" y="40" width="13" height="1.5" fill="#ef4444" />

                <!-- Front Glass windshield -->
                <path d="M 42,28 L 48,28 L 53,34 L 40,34 Z" fill="#38bdf8" opacity="0.85" stroke="#0ea5e9" stroke-width="0.5" />
                
                <!-- Front headlight -->
                <circle cx="56" cy="39" r="1.5" fill="#fbbf24" stroke="#f59e0b" stroke-width="0.5" />

                <!-- Wheels (Black tires, bright hubs) -->
                <circle cx="18" cy="46" r="6.5" fill="#111827" stroke="#4b5563" stroke-width="1" />
                <circle cx="18" cy="46" r="2.8" fill="#ffffff" />
                <circle cx="18" cy="46" r="1" fill="#000000" />
                <circle cx="44" cy="46" r="6.5" fill="#111827" stroke="#4b5563" stroke-width="1" />
                <circle cx="44" cy="46" r="2.8" fill="#ffffff" />
                <circle cx="44" cy="46" r="1" fill="#000000" />

                <!-- Dual roof strobe sirens with glowing LEDs -->
                <rect x="41" y="24" width="7" height="1.5" fill="#1e293b" rx="0.5" />
                <circle cx="42.5" cy="23" r="2.2" fill="#00f2ff" class="animate-pulse" style="filter: drop-shadow(0 0 2px #00f2ff);" />
                <circle cx="46.5" cy="23" r="2.2" fill="#a855f7" class="animate-pulse" style="filter: drop-shadow(0 0 2px #a855f7);" />
              </svg>
              <span class="text-[8.5px] font-mono font-black bg-slate-950/95 border border-slate-850 px-1 py-0.5 rounded shadow whitespace-nowrap ${pinColorClass}">
                ${indicatorDot} ${amb.driverName}
              </span>
            </div>
          `,
          iconSize: [64, 64],
          iconAnchor: [32, 32]
        });

        const ambMarker = L.marker([amb.gps.lat, amb.gps.lng], { icon: standbyIcon }).addTo(map);
        
        ambMarker.bindPopup(`
          <div class="bg-slate-950 text-slate-100 p-2.5 rounded-xl border border-slate-800 text-xs min-w-[160px] font-sans">
            <strong class="text-xs uppercase font-extrabold text-red-500 block mb-1">🚑 SWIFTRESCUE DISPATCH RADAR</strong>
            <p class="font-bold text-slate-200">Driver Name: ${amb.driverName}</p>
            <p class="text-[10px] text-slate-400">Plate: ${amb.plateNumber}</p>
            <p class="text-[11px] mt-1">Status: <span class="uppercase font-black font-mono ${pinColorClass}">${amb.status}</span></p>
            <p class="text-[10px] text-slate-300">Distance: <span class="font-bold text-slate-100">${amb.distanceKm.toFixed(2)} km</span></p>
            <p class="text-[10px] text-slate-300">ETA to Scene: <span class="font-bold text-slate-100">${amb.etaMinutes} mins</span></p>
            ${amb.status === "available" ? '<p class="text-[9px] text-green-400 mt-1 font-mono italic animate-pulse">Click marker or row to dispatch</p>' : ''}
          </div>
        `);

        // If scanning or idle, clicking the marker allows direct manual selection & routing!
        ambMarker.on("click", () => {
          if (amb.status === "available" && onSelectAmbulance) {
            onSelectAmbulance(amb);
          }
        });

        m.searching.push(ambMarker);
      });
    }

    // 3b. Plot scanning/candid radar searches and allow any to be selected directly by clicking!
    if (status === "SCANNING" && searchingAmbulances.length > 0) {
      searchingAmbulances.forEach((cand, idx) => {
        const candGps = mapCanvasToGps(cand.longitude, cand.latitude, currentAddress);
        
        const candidateIcon = L.divIcon({
          className: "cand-med-marker",
          html: `
            <div class="relative flex flex-col items-center justify-center select-none" style="width: 64px; height: 64px; cursor: pointer;">
              <!-- High fidelity 2D Side-profile Black Ambulance (Candidate) -->
              <svg width="44" height="44" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" class="mb-1 animate-pulse" style="filter: drop-shadow(0px 3px 5px rgba(0,0,0,0.4));">
                <!-- Dropped shadow beneath the vehicle -->
                <ellipse cx="32" cy="50" rx="22" ry="5" fill="#000000" opacity="0.45" />

                <!-- Chassis connection -->
                <rect x="12" y="44" width="40" height="2" fill="#1e293b" />

                <!-- Main Body Back Compartment (Glossy Black hull) -->
                <rect x="6" y="20" width="34" height="25" rx="3" fill="#111827" stroke="#4b5563" stroke-width="1.2" />
                
                <!-- Main Cab Front Compartment (Glossy Black hull) -->
                <path d="M 40,26 L 50,26 L 58,34 L 58,45 L 40,45 Z" fill="#1f2937" stroke="#4b5563" stroke-width="1.2" />

                <!-- White medical badge with red cross -->
                <circle cx="20" cy="32" r="6" fill="#ffffff" stroke="#cb4141" stroke-width="0.75" />
                <path d="M 17,32 L 23,32 M 20,29 L 20,35" stroke="#ef4444" stroke-width="2" stroke-linecap="round" />

                <!-- White & red striping -->
                <rect x="6" y="38" width="34" height="2" fill="#ffffff" />
                <rect x="6" y="40" width="34" height="1.5" fill="#ef4444" />
                <rect x="40" y="40" width="13" height="1.5" fill="#ef4444" />

                <!-- Front Glass windshield -->
                <path d="M 42,28 L 48,28 L 53,34 L 40,34 Z" fill="#38bdf8" opacity="0.85" stroke="#0ea5e9" stroke-width="0.5" />
                
                <!-- Front headlight -->
                <circle cx="56" cy="39" r="1.5" fill="#fbbf24" stroke="#f59e0b" stroke-width="0.5" />

                <!-- Wheels (Black tires, bright hubs) -->
                <circle cx="18" cy="46" r="6.5" fill="#111827" stroke="#4b5563" stroke-width="1" />
                <circle cx="18" cy="46" r="2.8" fill="#ffffff" />
                <circle cx="18" cy="46" r="1" fill="#000000" />
                <circle cx="44" cy="46" r="6.5" fill="#111827" stroke="#4b5563" stroke-width="1" />
                <circle cx="44" cy="46" r="2.8" fill="#ffffff" />
                <circle cx="44" cy="46" r="1" fill="#000000" />

                <!-- Dual roof strobe sirens with glowing LEDs -->
                <rect x="41" y="24" width="7" height="1.5" fill="#1e293b" rx="0.5" />
                <circle cx="42.5" cy="23" r="2.2" fill="#00f2ff" class="animate-pulse" style="filter: drop-shadow(0 0 2px #00f2ff);" />
                <circle cx="46.5" cy="23" r="2.2" fill="#a855f7" class="animate-pulse" style="filter: drop-shadow(0 0 2px #a855f7);" />
              </svg>
              <span class="text-[9px] font-mono font-bold bg-slate-950/90 text-red-500 border border-slate-800 px-1 py-0.5 rounded shadow whitespace-nowrap font-sans">
                ⚡ ${cand.driverName} (CANDIDATE)
              </span>
            </div>
          `,
          iconSize: [64, 64],
          iconAnchor: [32, 32]
        });

        const candMarker = L.marker([candGps.lat, candGps.lng], { icon: candidateIcon }).addTo(map);
        
        candMarker.bindPopup(`
          <div class="bg-slate-950 text-slate-100 p-2.5 rounded-xl border border-slate-800 text-xs min-w-[150px] font-sans">
            <strong class="text-xs uppercase font-extrabold text-amber-500 block mb-1">⚡ DISPATCH CANDIDATE</strong>
            <p class="font-bold text-slate-100">Driver: ${cand.driverName}</p>
            <p class="text-[10px] text-slate-400">Plate: ${cand.plateNumber}</p>
            <p class="text-[10px] text-slate-400">Rating: ⭐ ${cand.rating}</p>
            <p class="text-[10px] text-slate-400">Current Speed: ${cand.currentSpeedKph} km/h</p>
            <p class="text-[9px] text-amber-400 mt-1 font-mono animate-pulse">Click marker/row to select unit</p>
          </div>
        `);

        candMarker.on("click", () => {
          if (onSelectAmbulance) {
            onSelectAmbulance(cand);
          }
        });

        m.searching.push(candMarker);
      });
    }

    // 4. Plot Active Dispatched Ambulance Marker inside proper path direction frame
    if (
      status === "DISPATCHED" ||
      status === "ARRIVED_AT_PATIENT" ||
      status === "CONFIRMED_ARRIVAL" ||
      status === "EN_ROUTE_TO_HOSPITAL"
    ) {
      // Keep vehicle horizontal to prevent weird vertical nose-dives during North/South (upward/downward) travel.
      // - If traveling downward (South) or upward (North) or rightward (East), keep it facing right: face on right, backside on left.
      // - If traveling leftward (West, bearing is roughly between 195 and 345), flip horizontally so it faces left.
      const isWestward = bearingDegree > 195 && bearingDegree < 345;
      const transformStyle = isWestward ? "transform: scaleX(-1);" : "transform: scaleX(1);";
      const ambulanceIcon = L.divIcon({
        className: "active-ambulance-marker",
        html: `
          <div class="relative flex flex-col items-center justify-center select-none" style="width: 64px; height: 64px;">
            <!-- High fidelity 2D Side-profile Black Ambulance - keeping horizontal and flipping according to direction hemisphere -->
            <div style="${transformStyle} transition: transform 0.2s ease-in-out; width: 44px; height: 44px; pointer-events: none;" class="mb-1">
              <svg width="44" height="44" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0px 3px 5px rgba(0,0,0,0.4));">
                <!-- Dropped shadow beneath the vehicle -->
                <ellipse cx="32" cy="50" rx="22" ry="5" fill="#000000" opacity="0.45" />

                <!-- Chassis connection -->
                <rect x="12" y="44" width="40" height="2" fill="#1e293b" />

                <!-- Main Body Back Compartment (Glossy Black hull) -->
                <rect x="6" y="20" width="34" height="25" rx="3" fill="#111827" stroke="#4b5563" stroke-width="1.2" />
                
                <!-- Main Cab Front Compartment (Glossy Black hull) -->
                <path d="M 40,26 L 50,26 L 58,34 L 58,45 L 40,45 Z" fill="#1f2937" stroke="#4b5563" stroke-width="1.2" />

                <!-- White medical badge with red cross -->
                <circle cx="20" cy="32" r="6" fill="#ffffff" stroke="#cb4141" stroke-width="0.75" />
                <path d="M 17,32 L 23,32 M 20,29 L 20,35" stroke="#ef4444" stroke-width="2" stroke-linecap="round" />

                <!-- White & red striping -->
                <rect x="6" y="38" width="34" height="2" fill="#ffffff" />
                <rect x="6" y="40" width="34" height="1.5" fill="#ef4444" />
                <rect x="40" y="40" width="13" height="1.5" fill="#ef4444" />

                <!-- Front Glass windshield -->
                <path d="M 42,28 L 48,28 L 53,34 L 40,34 Z" fill="#38bdf8" opacity="0.85" stroke="#0ea5e9" stroke-width="0.5" />
                
                <!-- Front headlight -->
                <circle cx="56" cy="39" r="1.5" fill="#fbbf24" stroke="#f59e0b" stroke-width="0.5" />

                <!-- Wheels (Black tires, bright hubs) -->
                <circle cx="18" cy="46" r="6.5" fill="#111827" stroke="#4b5563" stroke-width="1" />
                <circle cx="18" cy="46" r="2.8" fill="#ffffff" />
                <circle cx="18" cy="46" r="1" fill="#000000" />
                <circle cx="44" cy="46" r="6.5" fill="#111827" stroke="#4b5563" stroke-width="1" />
                <circle cx="44" cy="46" r="2.8" fill="#ffffff" />
                <circle cx="44" cy="46" r="1" fill="#000000" />

                <!-- Dual roof strobe sirens with glowing LEDs -->
                <rect x="41" y="24" width="7" height="1.5" fill="#1e293b" rx="0.5" />
                <circle cx="42.5" cy="23" r="2.2" fill="#00f2ff" class="animate-pulse" style="filter: drop-shadow(0 0 2px #00f2ff);" />
                <circle cx="46.5" cy="23" r="2.2" fill="#a855f7" class="animate-pulse" style="filter: drop-shadow(0 0 2px #a855f7);" />
              </svg>
            </div>
            <span class="text-[8.5px] font-mono font-black bg-slate-950/95 border border-slate-850 px-1 py-0.5 rounded shadow whitespace-nowrap text-red-500">
              🚨 ${ambulance?.driverName || "EMS UNIT"}
            </span>
          </div>
        `,
        iconSize: [64, 64],
        iconAnchor: [32, 32]
      });

      m.ambulance = L.marker([ambulanceGps.lat, ambulanceGps.lng], { icon: ambulanceIcon }).addTo(map)
        .bindPopup(`<strong class="text-xs text-red-500">EMS UNIT EN-ROUTE</strong><br><span class="text-[10px] text-slate-600">Driver Crew: ${ambulance?.driverName || "Ems Officer"}</span>`);

      // Draw Path trajectories polylines routes exactly matching the vibrantly colored Legs
      if (activeRoutePoints.length > 0) {
        const polylineCoords = activeRoutePoints.map((p) => [p.lat, p.lng]);
        
        const totalPoints = activeRoutePoints.length;
        const q1End = Math.floor(totalPoints * 0.25);
        const q2End = Math.floor(totalPoints * 0.50);
        const q3End = Math.floor(totalPoints * 0.75);
        const q4End = totalPoints - 1;

        // 1. Traveled route (dim slate/grey) shown as a background trail
        if (routeIndex > 0) {
          const traveledCoords = polylineCoords.slice(0, routeIndex + 1);
          m.traveledPolyline = L.polyline(traveledCoords, {
            color: "#334155", 
            weight: 6,
            opacity: 0.55
          }).addTo(map);
        }

        // 2. Leg 1 segment (Emerald Green)
        if (routeIndex < q1End) {
          m.polylineSeg1 = L.polyline(polylineCoords.slice(routeIndex, q1End + 1), {
            color: "#10b981", 
            weight: 7,
            opacity: 0.95
          }).addTo(map);
        }

        // 3. Leg 2 segment (Electric Cyan/Teal)
        const startSeg2 = Math.max(routeIndex, q1End);
        if (startSeg2 < q2End) {
          m.polylineSeg2 = L.polyline(polylineCoords.slice(startSeg2, q2End + 1), {
            color: "#06b6d4", 
            weight: 7,
            opacity: 0.95
          }).addTo(map);
        }

        // 4. Leg 3 segment (Warm Yellow-Orange)
        const startSeg3 = Math.max(routeIndex, q2End);
        if (startSeg3 < q3End) {
          m.polylineSeg3 = L.polyline(polylineCoords.slice(startSeg3, q3End + 1), {
            color: "#f59e0b", 
            weight: 7,
            opacity: 0.95
          }).addTo(map);
        }

        // 5. Leg 4 segment (Rose Crimson Red leading to destination)
        const startSeg4 = Math.max(routeIndex, q3End);
        if (startSeg4 < q4End) {
          m.polylineSeg4 = L.polyline(polylineCoords.slice(startSeg4, q4End + 1), {
            color: "#ef4444", 
            weight: 7,
            opacity: 0.95
          }).addTo(map);
        }

        // 6. Draw custom glowing double-ring milestone waypoints EXACTLY at turning vertices
        m.milestones = [];
        
        const waypointNodes = [
          { idx: q1End, color: "#10b981", shadow: "rgba(16, 185, 129, 0.6)" },
          { idx: q2End, color: "#06b6d4", shadow: "rgba(6, 182, 212, 0.6)" },
          { idx: q3End, color: "#f59e0b", shadow: "rgba(245, 158, 11, 0.6)" },
        ];
        
        waypointNodes.forEach((node) => {
          if (node.idx > routeIndex && node.idx < q4End - 3) {
            const coord = polylineCoords[node.idx];
            
            const waypointIcon = L.divIcon({
              className: `custom-waypoint-${node.idx}`,
              html: `
                <div class="relative flex items-center justify-center animate-pulse" style="width: 24px; height: 24px;">
                  <!-- External glowing ring -->
                  <div class="absolute w-5 h-5 rounded-full border-2 border-white shadow-lg flex items-center justify-center" style="background-color: ${node.color}; box-shadow: 0 0 10px ${node.shadow};">
                    <!-- Concentric dot center -->
                    <div class="w-1.5 h-1.5 bg-white rounded-full"></div>
                  </div>
                </div>
              `,
              iconSize: [24, 24],
              iconAnchor: [12, 12]
            });
            
            const wMarker = L.marker(coord, { icon: waypointIcon }).addTo(map);
            m.milestones.push(wMarker);
          }
        });
      }
    }

  }, [
    leafletLoaded,
    status,
    ambulanceGps,
    patientGps,
    hospitalGps,
    bearingDegree,
    activeRoutePoints,
    routeIndex,
    driftOffset,
    searchRadius,
    nearbyDrivers,
    searchingAmbulances,
    onSelectAmbulance,
  ]);

  // Handle flying inputs for addresses simulation searches
  const handleQuerySearch = (e) => {
    e.preventDefault();
    if (!searchQuery || !mapInstanceRef.current) return;
    
    // Check keywords to simulate flying coordinates to locations in Karachi / Pakistan
    const q = searchQuery.toLowerCase();
    if (q.includes("pakistan") || q.includes("islamabad") || q.includes("lahore")) {
      mapInstanceRef.current.setView([30.3753, 69.3451], 5, { animate: true, duration: 2.0 });
    } else if (q.includes("karachi") || q.includes("clifton") || q.includes("nazimabad") || q.includes("saddar") || q.includes("gulshan")) {
      const destinationMap = q.includes("clifton") 
        ? { lat: 24.8138, lng: 67.0315 } 
        : { lat: 24.9127, lng: 67.0315 };
      
      mapInstanceRef.current.setView([destinationMap.lat, destinationMap.lng], 14, { animate: true, duration: 2.2 });
      
      // Update patient GPS spot dynamically to match the searched zip district!
      setPatientGps(destinationMap);
    } else {
      // General coordinate drift simulate
      const driftLat = 24.8607 + (Math.random() * 0.1 - 0.05);
      const driftLng = 67.0011 + (Math.random() * 0.1 - 0.05);
      mapInstanceRef.current.setView([driftLat, driftLng], 13, { animate: true, duration: 2.0 });
      setPatientGps({ lat: driftLat, lng: driftLng });
    }
  };

  return (
    <div id="leaflet-map-simulation-container" className="relative bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl transition-all duration-300 flex flex-col min-h-[685px]">
      
      {/* Top Floating HUD Status Menu */}
      <div className="absolute top-3 left-3 right-3 z-10 flex flex-wrap gap-2 justify-between items-center bg-slate-950/85 backdrop-blur-md border border-slate-800 p-3 rounded-2xl shadow-lg">
        <div className="flex items-center gap-2">
          {status === "DISPATCHED" ? (
            <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
          ) : status === "EN_ROUTE_TO_HOSPITAL" ? (
            <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-ping" />
          ) : (
            <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
          )}
          <span className="text-xs font-mono text-slate-350">
            SYSTEM STATUS:{" "}
            <span
              className={
                status === "DISPATCHED"
                  ? "text-red-400 font-extrabold"
                  : status === "ARRIVED_AT_PATIENT" || status === "CONFIRMED_ARRIVAL"
                  ? "text-yellow-400 font-extrabold"
                  : status === "EN_ROUTE_TO_HOSPITAL"
                  ? "text-blue-400 font-extrabold"
                  : "text-green-405 font-bold"
              }
            >
              {status}
            </span>
          </span>
        </div>

        <div className="flex items-center gap-2.5 text-xs font-mono text-slate-400">
          <div className="flex items-center gap-1.5 bg-slate-900 px-2.5 py-1 rounded border border-slate-800 text-slate-300">
            <Milestone className="w-3.5 h-3.5 text-red-500 shrink-0" />
            <span className="truncate max-w-[170px] font-bold text-[10.5px]">
              {status === "IDLE" ? "Pakistan Interconnected Route Node" : currentStreetName.split(",")[0]}
            </span>
          </div>
        </div>
      </div>

      {/* Floating Interactive Live Controller Sidebar */}
      <div className="absolute bottom-4 left-4 z-10 flex flex-col gap-2 p-1.5 bg-slate-950/85 backdrop-blur border border-slate-800 rounded-2xl shadow-lg">
        <span className="text-[8.5px] font-mono text-slate-500 text-center font-black pb-0.5 border-b border-slate-850 uppercase">Fly-To</span>
        
        <button
          type="button"
          onClick={() => mapInstanceRef.current?.setView([30.3753, 69.3451], 5, { animate: true, duration: 1.5 })}
          className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors flex flex-col items-center gap-0.5"
          title="Zoom to Pakistan Map"
        >
          <Globe className="w-4 h-4 text-sky-400" />
          <span className="text-[8px] font-mono font-bold">Pakistan</span>
        </button>

        <button
          type="button"
          onClick={() => mapInstanceRef.current?.setView([24.8607, 67.0011], 11, { animate: true, duration: 1.5 })}
          className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors flex flex-col items-center gap-0.5"
          title="Zoom to Karachi Districts"
        >
          <MapIcon className="w-4 h-4 text-emerald-400" />
          <span className="text-[8px] font-mono font-bold">Karachi</span>
        </button>

        <button
          type="button"
          onClick={() => mapInstanceRef.current?.setView([patientGps.lat, patientGps.lng], 16, { animate: true, duration: 1.5 })}
          className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors flex flex-col items-center gap-0.5"
          title="Zoom to Nazimabad Scene Block"
        >
          <Navigation className="w-4 h-4 text-red-400" />
          <span className="text-[8px] font-mono font-bold">Scene</span>
        </button>
      </div>

      {/* Top-Right Interactive Maps Style Selector & Address Input bar */}
      <div className="absolute top-16 left-3 right-3 z-10 bg-slate-950/90 backdrop-blur border border-slate-800 p-2.5 rounded-2xl flex flex-col md:flex-row gap-2.5 items-stretch md:items-center justify-between shadow-xl">
        <form onSubmit={handleQuerySearch} className="flex items-center gap-1.5 flex-1 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl">
          <span className="text-slate-500 text-xs">🔍</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Type and fly map (e.g., Karachi, Lahore, Clifton)..."
            className="w-full text-xs bg-transparent text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-0 font-sans"
          />
          {searchQuery && (
            <button type="button" onClick={() => setSearchQuery("")} className="text-slate-400 hover:text-white text-xs px-1">✕</button>
          )}
        </form>
        
        <div className="flex gap-1 items-center justify-between bg-slate-900 p-1 border border-slate-800 rounded-xl shrink-0">
          <span className="text-[8px] font-mono text-slate-500 font-black uppercase px-2">Map Skin:</span>
          {[
            { id: "night", label: "Night Vision" },
            { id: "standard", label: "Street GIS" },
            { id: "satellite", label: "Satellite" }
          ].map((style) => (
            <button
              key={style.id}
              onClick={() => setMapStyle(style.id)}
              type="button"
              className={`px-2.5 py-1 rounded-lg text-[9px] font-bold font-mono transition-all uppercase cursor-pointer ${
                mapStyle === style.id 
                  ? "bg-red-600 text-white shadow-md" 
                  : "bg-transparent text-slate-400 hover:text-white"
              }`}
            >
              {style.label}
            </button>
          ))}
        </div>
      </div>

      {/* Map Body: splits into Map (left) and Sidebar (right) under IDLE/SCANNING modes */}
      <div className="flex-1 w-full min-h-[685px] flex flex-col lg:flex-row relative">
        
        {/* Map View Frame (Left pane) */}
        <div className="flex-1 relative min-h-[685px]">
          {!leafletLoaded && (
            <div className="absolute inset-0 bg-slate-950/95 flex flex-col items-center justify-center space-y-4 z-20">
              <div className="w-10 h-10 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
              <div className="text-center">
                <p className="text-sm font-bold font-mono text-slate-205">SYNCHRONIZING MAP LAYER ARRAYS</p>
                <p className="text-xs text-slate-500 mt-1 max-w-xs leading-relaxed">
                  Assembling live interactive mapping server. Zero API key credentials required.
                </p>
              </div>
            </div>
          )}
          
          {/* Leaflet DOM Anchor */}
          <div 
            ref={containerRef} 
            style={{ width: "100%", height: "100%", minHeight: "685px", background: "#090d16" }} 
            className="z-0" 
          />
        </div>
      </div>

      {/* Real-Time Live Distance & Compass Direction Header Display */}
      {status !== "IDLE" && (() => {
        const stepsLeft = activeRoutePoints.length > 0 ? (activeRoutePoints.length - 1 - routeIndex) : 0;
        const tickIntervalMs = status === "DISPATCHED" ? 400 : 250;
        
        let displayMin = 0;
        let displaySec = 0;
        if ((status === "DISPATCHED" || status === "CONFIRMED_ARRIVAL" || status === "EN_ROUTE_TO_HOSPITAL") && activeRoutePoints.length > 0) {
          // Calculate high precision proportional countdown from 2 minutes (120 seconds) for premium or 5 minutes (300 seconds) for normal SOS
          const totalSeconds = isPremiumEmergency ? 120 : 300;
          const totalSteps = activeRoutePoints.length - 1 || 1;
          const ratio = stepsLeft / totalSteps;
          const virtualSeconds = Math.max(0, Math.ceil(ratio * totalSeconds));
          displayMin = Math.floor(virtualSeconds / 60);
          displaySec = virtualSeconds % 60;
        } else {
          const remainingSecondsTotal = Math.ceil((stepsLeft * tickIntervalMs) / 1000);
          displayMin = Math.floor(remainingSecondsTotal / 60);
          displaySec = remainingSecondsTotal % 60;
        }

        const progressPercent = activeRoutePoints.length > 0 ? Math.round((routeIndex / (activeRoutePoints.length - 1)) * 100) : 0;

        return (
          <div className="bg-slate-950/95 border-t border-slate-850 p-4 space-y-4 shadow-2xl relative z-10 shrink-0">
            
            {/* Live Progress Bar indicator */}
            {(status === "DISPATCHED" || status === "CONFIRMED_ARRIVAL" || status === "EN_ROUTE_TO_HOSPITAL") && (
              <div className="space-y-1.5 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                <div className="flex justify-between items-center text-[10px] font-mono">
                  <span className="text-red-400 font-extrabold flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
                    {status === "DISPATCHED" 
                      ? `AMBULANCE TRANSIT EN ROUTE (${isPremiumEmergency ? "2 MIN" : "5 MIN"} TRAVEL TIME CAP)` 
                      : `TRANSITING PATIENT TO EMERGENCY CENTER (${isPremiumEmergency ? "2 MIN" : "5 MIN"} TRAVEL TIME CAP)`}
                  </span>
                  <span className="text-slate-300 font-bold">{progressPercent}% Completed</span>
                </div>
                <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                  <div 
                    className="bg-gradient-to-r from-red-600 via-rose-500 to-emerald-500 h-full transition-all duration-300 ease-out"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            )}

            {/* Real-time Telemetry Dashboard (Compass + Distance + ETA) */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              
              {/* Live Distance Box */}
              <div className="bg-slate-900/80 p-3 rounded-2xl border border-slate-800 flex items-center gap-3.5">
                <div className="w-10 h-10 bg-red-950/50 rounded-xl flex items-center justify-center border border-red-900/40 shrink-0">
                  <Navigation className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <span className="block text-[8px] font-mono text-slate-500 uppercase tracking-wider">Live Path Distance</span>
                  {status === "ARRIVED_AT_PATIENT" ? (
                    <span className="text-sm font-extrabold text-green-400 font-mono tracking-tight uppercase">Arrived • At Scene</span>
                  ) : (
                    <span className="text-base font-black text-white font-mono tracking-tight animate-pulse">
                      {distanceRemaining > 1 
                        ? `${distanceRemaining.toFixed(2)} km` 
                        : `${Math.round(distanceRemaining * 1000)} meters`}
                    </span>
                  )}
                  <span className="block text-[9px] text-slate-500 mt-0.5 leading-none">Actual route calculation GPS</span>
                </div>
              </div>

              {/* Live ETA Box */}
              <div className="bg-slate-900/80 p-3 rounded-2xl border border-red-500/30 flex items-center gap-3.5 shadow-[0_0_15px_rgba(239,68,68,0.07)]">
                <div className="w-10 h-10 bg-red-950/60 rounded-xl flex items-center justify-center border border-red-500/40 shrink-0">
                  <span className="text-2xl animate-pulse">⏱️</span>
                </div>
                <div>
                  <span className="block text-[8px] font-mono text-slate-500 uppercase tracking-wider">REAL-TIME COUNTDOWN ETA</span>
                  {status === "ARRIVED_AT_PATIENT" ? (
                    <span className="text-sm font-extrabold text-emerald-400 block font-mono">00m 00s — SECURED</span>
                  ) : (
                    <span className="text-base font-black text-amber-400 block font-mono tracking-tight">
                      {displayMin.toString().padStart(2, "0")}m {displaySec.toString().padStart(2, "0")}s
                    </span>
                  )}
                  <span className="block text-[9px] text-slate-400 font-mono mt-0.5">Speed limited for medical safety</span>
                </div>
              </div>

              {/* Live Steering Compass Box */}
              <div className="bg-slate-900/80 p-3 rounded-2xl border border-slate-800 flex items-center gap-3.5">
                <div className="w-10 h-10 bg-amber-950/40 rounded-xl flex items-center justify-center border border-amber-900/30 shrink-0 select-none">
                  {/* Visual Compass pointer rotating toward targets */}
                  <ArrowUp 
                    className="w-5 h-5 text-amber-500 transition-transform duration-200" 
                    style={{ transform: `rotate(${bearingDegree}deg)` }} 
                  />
                </div>
                <div>
                  <span className="block text-[8px] font-mono text-slate-500 uppercase tracking-wider">Steering Compass</span>
                  <span className="text-sm font-bold text-slate-201 block font-mono">
                    {compassText} ({Math.round(bearingDegree)}°)
                  </span>
                  <span className="block text-[9px] text-amber-500 text-[8.5px] mt-0.5 font-mono">Bearing to target vector</span>
                </div>
              </div>

              {/* Active Telemetry Speeds Box */}
              <div className="bg-slate-900/80 p-3 rounded-2xl border border-slate-800 flex flex-col justify-between">
                <div>
                  <span className="block text-[8px] font-mono text-slate-500 uppercase">Gps Signal Lat / Lng</span>
                  <span className="text-[10px] font-mono text-slate-350 font-bold block">
                    {ambulanceGps.lat.toFixed(5)}, {ambulanceGps.lng.toFixed(5)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono mt-0.5">
                  <span>Speed:</span>
                  <span className="text-white font-black">
                    {status === "ARRIVED_AT_PATIENT" ? "0 km/h" : `${Math.round((ambulance?.currentSpeedKph || 50) + Math.sin(Date.now() / 1200) * 4)} km/h`}
                  </span>
                </div>
              </div>

            </div>

            {/* User Address Banner */}
            <div className="flex flex-col md:flex-row gap-2 items-start md:items-center justify-between bg-emerald-950/20 border border-emerald-900/30 px-3.5 py-2.5 rounded-xl text-xs">
              <span className="text-emerald-400 font-mono flex items-center gap-1.5 shrink-0">
                <ShieldCheck className="w-4 h-4 text-emerald-500" /> 
                Secure GPS Intercept Loop Locked
              </span>
              <span className="text-slate-400 text-[9px] font-mono truncate max-w-lg">
                Patient Current Target Address: {currentAddress}
              </span>
            </div>

          </div>
        );
      })()}
    </div>
  );
}
