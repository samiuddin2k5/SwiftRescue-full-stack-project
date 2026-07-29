import { useState, useEffect, useRef } from "react";
import { jsPDF } from "jspdf";
import ambulanceBg from "../src/assets/images/ambulance_hud_bg_1780502342977.png";
import swiftrescueBg from "../src/assets/images/swiftrescue_ambulance_bg_1780149461946.png";
import swiftBg from "../src/assets/images/swift.png";
import { MOCK_AMBULANCES, MOCK_HOSPITALS, FIRST_AID_SUGGESTIONS } from "./data";
import MapSimulation from "./components/MapSimulation";
import PatientIntakeForm from "./components/PatientIntakeForm";
import IncidentFeed from "./components/IncidentFeed";
import ResponseSimulation from "./components/ResponseSimulation";
import UnitStatus from "./components/UnitStatus";
import VitalsMonitor from "./components/VitalsMonitor";
import InvoiceSummarySection from "./components/InvoiceSummarySection";
import AnalyticsDashboard from "./components/AnalyticsDashboard";
import HorizontalBentoDashboard from "./components/HorizontalBentoDashboard";
import VerticalEmergencyMetrics, { PatientVitalsCard, HospitalCapacityCard } from "./components/VerticalEmergencyMetrics";
import {
  Siren,
  Hospital as HospitalIcon,
  ShieldAlert,
  ClipboardList,
  UserCheck,
  LogOut,
  MapPin,
  HeartPulse,
  Flame,
  Phone,
  ArrowRight,
  Sparkles,
  Layers,
  History,
  Activity,
  UserCheck2,
  CreditCard,
  DollarSign,
  HelpCircle,
  MessageCircle,
  Send,
  X,
  Sun,
  Moon,
} from "lucide-react";

export default function App() {
  const scanIntervalRef = useRef(null);
  const scanTimeoutRef = useRef(null);

  // Authentication states
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem("smart_dispatch_user");
    return saved ? JSON.parse(saved) : null;
  });
  const [authTab, setAuthTab] = useState("SIGNUP");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authName, setAuthName] = useState("");
  const [authError, setAuthError] = useState("");
  const [authSuccess, setAuthSuccess] = useState("");

  // Patient creation state
  const [patientForm, setPatientForm] = useState({
    name: "",
    age: 0,
    bloodGroup: "O+",
    emergencyType: "Cardiac Arrest",
    additionalNotes: "",
    contactNumber: "",
  });
  const [activePatient, setActivePatient] = useState(() => {
    const saved = localStorage.getItem("smart_dispatch_patient");
    return saved ? JSON.parse(saved) : null;
  });

  // Simulator dispatch variables
  const [dispatchStatus, setDispatchStatus] = useState(() => {
    const saved = localStorage.getItem("smart_dispatch_status");
    return saved || "IDLE";
  });
  
  const [hospitals, setHospitals] = useState(() => {
    const saved = localStorage.getItem("smart_dispatch_hospitals");
    return saved ? JSON.parse(saved) : MOCK_HOSPITALS;
  });

  const [selectedHospital, setSelectedHospital] = useState(() => {
    const saved = localStorage.getItem("smart_dispatch_hospitals");
    const list = saved ? JSON.parse(saved) : MOCK_HOSPITALS;
    return list[0] || MOCK_HOSPITALS[0];
  });
  const [assignedAmbulance, setAssignedAmbulance] = useState(null);
  
  // Custom user input address
  const [patientAddress, setPatientAddress] = useState("Nazimabad Block 3, near Abbasi Shaheed Hospital, Karachi");

  // Historical trauma archives
  const [pastCases, setPastCases] = useState([]);
  const [archiveDateFilter, setArchiveDateFilter] = useState("");

  const [scanProgress, setScanProgress] = useState(0);

  // Live premium ambulance fare calculator and billing transaction state variables
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("CREDIT_CARD");
  const [paymentForm, setPaymentForm] = useState({
    cardName: "",
    cardNumber: "",
    cardExpiry: "",
    cardCVV: "",
    walletNumber: "",
    walletName: "",
    walletPin: "",
  });
  const [isPaying, setIsPaying] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [generatedSlip, setGeneratedSlip] = useState(null);

  // Navigation page layout state
  const [activePage, setActivePage] = useState("DISPATCH");
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem("theme") !== "light");
  const [isSoundOff, setIsSoundOff] = useState(false);
  const [searchingAmbulances, setSearchingAmbulances] = useState([]);
  const [isPremiumEmergency, setIsPremiumEmergency] = useState(false);

  // Customer Support Helper & Chatbot states
  const [supportOpen, setSupportOpen] = useState(false);
  const [supportInput, setSupportInput] = useState("");
  const [supportMessages, setSupportMessages] = useState([
    {
      id: "sup_init",
      sender: "bot",
      text: "👋 Hello! I am the **SwiftRescue Customer Support Helper**. I can explain how to use the interactive maps, details regarding candidate ambulances, and how the automated 3-second completion celebration tunes play on arrival. Ask me anything!",
      timestamp: new Date().toLocaleTimeString(),
    },
  ]);
  const [isSupportTyping, setIsSupportTyping] = useState(false);

  const handleSendSupport = async (forcedText) => {
    const rawVal = forcedText || supportInput;
    if (!rawVal.trim() || isSupportTyping) return;

    const userMsg = {
      id: `sup_user_${Date.now()}`,
      sender: "user",
      text: rawVal,
      timestamp: new Date().toLocaleTimeString(),
    };

    setSupportMessages((prev) => [...prev, userMsg]);
    setIsSupportTyping(true);
    if (!forcedText) {
      setSupportInput("");
    }

    try {
      const res = await fetch("/api/support-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: rawVal,
          history: supportMessages.map((m) => ({ sender: m.sender, text: m.text })),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const botMsg = {
          id: `sup_bot_${Date.now()}`,
          sender: "bot",
          text: data.text || "I'm available to help explain features such as candidate radar, Karachi maps (Nazimabad), or first-aid guidance.",
          timestamp: new Date().toLocaleTimeString(),
        };
        setSupportMessages((prev) => [...prev, botMsg]);
      } else {
        throw new Error();
      }
    } catch {
      const botMsg = {
        id: `sup_bot_err_${Date.now()}`,
        sender: "bot",
        text: "I experienced a minor connection lag. Remember you can configure your **GEMINI_API_KEY** inside the project settings to activate deep smart support recommendations! Let me know what you need.",
        timestamp: new Date().toLocaleTimeString(),
      };
      setSupportMessages((prev) => [...prev, botMsg]);
    } finally {
      setIsSupportTyping(false);
    }
  };

  // Ambulance driver specific chat states
  const [driverChatMessages, setDriverChatMessages] = useState([
    {
      id: "driver_init",
      sender: "driver",
      text: "Hello! This is your dispatched paramedic driver. I am navigating to your location as fast as possible. Let me know if you have any status updates or instructions!",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }
  ]);
  const [driverChatInput, setDriverChatInput] = useState("");
  const [isDriverTyping, setIsDriverTyping] = useState(false);

  const handleSendDriverChat = (forcedText) => {
    const rawVal = forcedText || driverChatInput;
    if (!rawVal.trim() || isDriverTyping) return;

    const userMsg = {
      id: `driver_user_${Date.now()}`,
      sender: "user",
      text: rawVal,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setDriverChatMessages((prev) => [...prev, userMsg]);
    if (!forcedText) {
      setDriverChatInput("");
    }
    setIsDriverTyping(true);

    // Simulate auto driver response after 1 second
    setTimeout(() => {
      let responseText = "Understood. We are on full speed and on our way to your exact location coordinates. Stay calm and rest assured.";
      const query = rawVal.toLowerCase();

      if (query.includes("where") || query.includes("status") || query.includes("location") || query.includes("where are u") || query.includes("where are you") || query.includes("kahan")) {
        responseText = `I am currently navigating the traffic route. My current GPS speed is ${assignedAmbulance?.currentSpeedKph || 52} Kph. I am focused and will reach you very soon!`;
      } else if (query.includes("time") || query.includes("minutes") || query.includes("min") || query.includes("eta") || query.includes("how much time") || query.includes("duration") || query.includes("kab")) {
        responseText = "According to SwiftRescue live navigation routes, we are around 2 minutes away. No severe traffic is slowing us down!";
      } else if (query.includes("hi") || query.includes("hello") || query.includes("hey") || query.includes("salam") || query.includes("assalam")) {
        responseText = `Hello! This is your driver ${assignedAmbulance?.driverName || "Paramedic Officer"}. We are actively heading towards you. Please keep the local area clear for arrival.`;
      } else if (query.includes("hurry") || query.includes("fast") || query.includes("please hurry")) {
        responseText = "Understood, sirens are fully active on maximum power. Driving aggressively to bypass all signal junctions!";
      } else if (query.includes("conscious") || query.includes("breathing") || query.includes("stable")) {
        responseText = "Understood. That's a good sign. Paramedics on board are preparing proper secondary clinical response kits.";
      } else if (query.includes("help") || query.includes("medical") || query.includes("condition") || query.includes("patient") || query.includes("emergency") || query.includes("severe")) {
        responseText = "Understood. Our onboard crew has prepared all required resuscitation tools, oxygen, and emergency kits. Keep the patient in a comfortable position.";
      } else if (query.includes("thank") || query.includes("thanks") || query.includes("ok") || query.includes("okay")) {
        responseText = "You're welcome! Standard response protocols are engaged in fully synced order.";
      }

      setDriverChatMessages((prev) => [
        ...prev,
        {
          id: `driver_resp_${Date.now()}`,
          sender: "driver",
          text: responseText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }
      ]);
      setIsDriverTyping(false);
    }, 1000);
  };

  // Load and save past emergencies securely
  useEffect(() => {
    const savedCases = localStorage.getItem("smart_dispatch_cases");
    if (savedCases) {
      setPastCases(JSON.parse(savedCases));
    }

    // Load from server-backed database sync (which checks local fallback file and Supabase)
    const loadLogs = async () => {
      try {
        const res = await fetch("/api/cases");
        if (res.ok) {
          const list = await res.json();
          if (list && list.length > 0) {
            setPastCases(list);
            localStorage.setItem("smart_dispatch_cases", JSON.stringify(list));
          }
        }
      } catch (err) {
        console.error("Failed to load list from database API:", err);
      }
    };
    loadLogs();
  }, []);

  // Sync state variables with local storage for high-fidelity recovery
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem("smart_dispatch_user", JSON.stringify(currentUser));
    } else {
      localStorage.removeItem("smart_dispatch_user");
    }
  }, [currentUser]);

  useEffect(() => {
    if (activePatient) {
      localStorage.setItem("smart_dispatch_patient", JSON.stringify(activePatient));
    } else {
      localStorage.removeItem("smart_dispatch_patient");
    }
  }, [activePatient]);

  useEffect(() => {
    localStorage.setItem("smart_dispatch_status", dispatchStatus);
  }, [dispatchStatus]);

  // Audio & Vibration "Arrived Sirens" continuous effect
  useEffect(() => {
    let audioCtx = null;
    let intervalId = null;
    let sirenOsc1 = null;
    let sirenOsc2 = null;
    let sirenGain = null;

    if (dispatchStatus === "ARRIVED_AT_PATIENT" && !isSoundOff) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
        sirenGain = audioCtx.createGain();
        sirenGain.gain.setValueAtTime(0.18, audioCtx.currentTime);
        sirenGain.connect(audioCtx.destination);

        // Main sine oscillator
        sirenOsc1 = audioCtx.createOscillator();
        sirenOsc1.type = "sine";
        sirenOsc1.frequency.setValueAtTime(600, audioCtx.currentTime);
        sirenOsc1.connect(sirenGain);

        // Harmonizing sound
        sirenOsc2 = audioCtx.createOscillator();
        sirenOsc2.type = "sawtooth";
        sirenOsc2.frequency.setValueAtTime(400, audioCtx.currentTime);
        sirenOsc2.connect(sirenGain);

        // Low frequency oscillator to wobble/sweep the frequency (creating a distinct siren wail)
        const lfo = audioCtx.createOscillator();
        lfo.frequency.setValueAtTime(2.0, audioCtx.currentTime); // 2 wails per second
        
        const lfoGain = audioCtx.createGain();
        lfoGain.gain.setValueAtTime(140, audioCtx.currentTime); // swing amplitude +/- 140Hz

        lfo.connect(lfoGain);
        lfoGain.connect(sirenOsc1.frequency);
        lfoGain.connect(sirenOsc2.frequency);

        sirenOsc1.start();
        sirenOsc2.start();
        lfo.start();

        if (navigator.vibrate) {
          navigator.vibrate([400, 200, 400, 200, 400]);
          intervalId = setInterval(() => {
            navigator.vibrate([400, 200, 400, 200, 400]);
          }, 2000);
        }
      }
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
      if (sirenOsc1) {
        try { sirenOsc1.stop(); } catch (e) {}
      }
      if (sirenOsc2) {
        try { sirenOsc2.stop(); } catch (e) {}
      }
      if (audioCtx && audioCtx.state !== "closed") {
        audioCtx.close().catch(() => {});
      }
    };
  }, [dispatchStatus, isSoundOff]);

  // Auth Handler: Credentials Signup
  const handleSignup = async (e) => {
    e.preventDefault();
    setAuthError("");
    setAuthSuccess("");

    if (!authName || !authEmail || !authPassword) {
      setAuthError("All registration fields are required.");
      return;
    }

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: authName,
          email: authEmail,
          password: authPassword,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        setAuthError(data.error || "Signup procedure failed.");
        return;
      }

      setCurrentUser(data.user);
      setAuthSuccess(data.message);
    } catch (err) {
      setAuthError("Failed to establish server authentication node. Check your web container backend.");
    }
  };

  // Auth Handler: Credentials Login
  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError("");
    setAuthSuccess("");

    if (!authEmail || !authPassword) {
      setAuthError("Email and password fields are required.");
      return;
    }

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: authEmail,
          password: authPassword,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        setAuthError(data.error || "Login credentials rejected.");
        return;
      }

      setCurrentUser(data.user);
      setAuthSuccess(data.message);
    } catch (err) {
      setAuthError("Auth node connection error. Restarting server might resolve this.");
    }
  };

  // Auth Handler: Google interactive Single-Sign-On Simulation parameters
  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState(false);
  const [customGoogleEmail, setCustomGoogleEmail] = useState("");
  const [customGoogleName, setCustomGoogleName] = useState("");
  const [customGoogleError, setCustomGoogleError] = useState("");

  const handleGoogleLogin = () => {
    setCustomGoogleEmail("");
    setCustomGoogleName("");
    setCustomGoogleError("");
    setIsGoogleModalOpen(true);
  };

  const handleConfirmGoogleOAuth = async (email, name) => {
    setAuthError("");
    setAuthSuccess("");
    setCustomGoogleError("");

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setCustomGoogleError("Gmail address is required.");
      return;
    }

    if (!trimmedEmail.toLowerCase().endsWith("@gmail.com")) {
      setCustomGoogleError("Google Account Sync Failure: Address must use a valid @gmail.com domain.");
      return;
    }

    const trimmedName = name.trim() || trimmedEmail.split("@")[0];

    try {
      const response = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: trimmedEmail.toLowerCase(),
          name: trimmedName,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        setCustomGoogleError(data.error || "Google authentication rejected.");
        return;
      }

      setCurrentUser(data.user);
      setAuthSuccess(`Authorized securely inside SwiftRescue via Google SSO: ${data.user.email}`);
      setIsGoogleModalOpen(false);
    } catch (err) {
      setCustomGoogleError("SSO Connection to server failed.");
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setActivePatient(null);
    setDispatchStatus("IDLE");
    setAssignedAmbulance(null);
    localStorage.removeItem("smart_dispatch_user");
    localStorage.removeItem("smart_dispatch_patient");
    localStorage.removeItem("smart_dispatch_status");
  };

  const handlePatientSubmit = (e) => {
    e.preventDefault();
    if (!patientForm.name || !patientForm.contactNumber || patientForm.age <= 0) {
      alert("Please fill complete clinical details for intake file.");
      return;
    }
    setActivePatient(patientForm);
  };

  // SOS Activation Workflow (First triggers a 4-second electronic radar scanning phase)
  const handleSOSTrigger = () => {
    if (!activePatient) return;

    setDispatchStatus("SCANNING");
    setScanProgress(0);

    // Group of authentic clean Muslim names for searching candidates
    const muslimNames = [
      "Ahmed", "Ali", "Kamran", "Muhammad", "Bilal", "Hamza", "Tariq", "Yousuf",
      "Faisal", "Omar", "Zain", "Saad", "Mustafa", "Usman", "Kashif", "Sohail",
      "Nabeel", "Farhan", "Junaid", "Rizwan", "Imran"
    ];

    const pkrPlates = [
      "LHR-###-MED",
      "KHI-###-EMS",
      "ISL-###-RESC",
      "PES-###-LIFE",
      "MUL-###-ER"
    ];

    // Generate exactly 5 diverse candidates across different places on Nazimabad Karachi map grid
    const candidates = [];
    const usedNames = new Set();

    for (let c = 0; c < 5; c++) {
      let rName = muslimNames[Math.floor(Math.random() * muslimNames.length)];
      while (usedNames.has(rName)) {
        rName = muslimNames[Math.floor(Math.random() * muslimNames.length)];
      }
      usedNames.add(rName);

      const plateBase = pkrPlates[Math.floor(Math.random() * pkrPlates.length)];
      const plate = plateBase.replace("###", Math.floor(100 + Math.random() * 900).toString());
      const phone = "+92 3" + Math.floor(10 + Math.random() * 90) + " " + Math.floor(1000000 + Math.random() * 9500000);
      const speed = Math.floor(45 + Math.random() * 15);
      const rating = parseFloat((4.6 + Math.random() * 0.4).toFixed(1));

      // Distribute candidates beautifully to different zones on our 400x400 map
      let startX = 30;
      let startY = 50;
      if (c === 0) { startX = 60; startY = 70; }
      else if (c === 1) { startX = 310; startY = 80; }
      else if (c === 2) { startX = 50; startY = 280; }
      else if (c === 3) { startX = 220; startY = 60; }
      else if (c === 4) { startX = 330; startY = 320; }

      candidates.push({
        id: "amb_cand_" + c + "_" + Date.now(),
        plateNumber: plate,
        driverName: rName,
        driverPhone: phone,
        rating: rating,
        etaMinutes: Math.floor(5 + Math.random() * 8),
        currentSpeedKph: speed,
        latitude: startY,
        longitude: startX
      });
    }

    setSearchingAmbulances(candidates);

    scanIntervalRef.current = setInterval(() => {
      setScanProgress((prev) => {
        if (prev >= 100) {
          clearInterval(scanIntervalRef.current);
          return 100;
        }
        return prev + 2.5; // Reaches 100 in 40 intervals of 100ms (exactly 4000ms)
      });
    }, 100);

    scanTimeoutRef.current = setTimeout(() => {
      if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
      
      // Select one generated candidate randomly!
      const chosen = candidates[Math.floor(Math.random() * candidates.length)];
      
      setSearchingAmbulances([]);
      setAssignedAmbulance(chosen);
      setDispatchStatus("DISPATCHED");
    }, 4000);
  };

  const handleInstantEmergency = () => {
    // 1. Setup a precompiled high-fidelity patient form immediately bypass
    const quickPatient = {
      name: "Patient (Urgent Emergency Solo)",
      age: 28,
      bloodGroup: "O+",
      emergencyType: "Critical Hyper-Urgent SOS 🚨",
      contactNumber: "Immediate Response Bypass",
      additionalNotes: "Direct instant dispatcher activation. Bypass intake files form standard checks.",
    };
    setActivePatient(quickPatient);
    setIsPremiumEmergency(true);

    // 2. Clear previous intervals/timeouts
    if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
    if (scanTimeoutRef.current) clearTimeout(scanTimeoutRef.current);

    // 3. Immediately find nearest hospital (the one with minimum distanceKm)
    const sortedHospitals = [...hospitals].sort((a, b) => a.distanceKm - b.distanceKm);
    const nearestHospital = sortedHospitals[0] || hospitals[0];
    setSelectedHospital(nearestHospital);

    // 4. Start scanning animation state rapidly (takes 2 seconds to scan)
    setDispatchStatus("SCANNING");
    setScanProgress(0);

    const muslimNames = [
      "Ahmed", "Ali", "Kamran", "Muhammad", "Bilal", "Hamza", "Tariq", "Yousuf",
      "Faisal", "Omar", "Saad", "Mustafa", "Usman", "Kashif", "Sohail"
    ];

    const pkrPlates = [
      "LHR-###-MED", "KHI-###-EMS", "ISL-###-RESC", "PES-###-LIFE", "MUL-###-ER"
    ];

    const candidates = [];
    const usedNames = new Set();

    for (let c = 0; c < 5; c++) {
      let rName = muslimNames[Math.floor(Math.random() * muslimNames.length)];
      while (usedNames.has(rName)) {
        rName = muslimNames[Math.floor(Math.random() * muslimNames.length)];
      }
      usedNames.add(rName);

      const plateBase = pkrPlates[Math.floor(Math.random() * pkrPlates.length)];
      const plate = plateBase.replace("###", Math.floor(100 + Math.random() * 900).toString());
      const phone = "+92 3" + Math.floor(10 + Math.random() * 90) + " " + Math.floor(1000000 + Math.random() * 9500000);
      const speed = Math.floor(95 + Math.random() * 15); // extremely fast speed
      const rating = parseFloat((4.8 + Math.random() * 0.2).toFixed(1));

      // Zone positions inside map grid
      let startX = 30;
      let startY = 50;
      if (c === 0) { startX = 60; startY = 70; }
      else if (c === 1) { startX = 310; startY = 80; }
      else if (c === 2) { startX = 50; startY = 280; }
      else if (c === 3) { startX = 220; startY = 60; }
      else if (c === 4) { startX = 330; startY = 320; }

      candidates.push({
        id: "amb_cand_" + c + "_" + Date.now(),
        plateNumber: plate,
        driverName: rName,
        driverPhone: phone,
        rating: rating,
        etaMinutes: c === 0 ? 2 : Math.floor(c + 2), // nearest has 2 mins ETA
        currentSpeedKph: speed,
        latitude: startY,
        longitude: startX
      });
    }

    setSearchingAmbulances(candidates);

    // Speed scan
    scanIntervalRef.current = setInterval(() => {
      setScanProgress((prev) => {
        if (prev >= 100) {
          clearInterval(scanIntervalRef.current);
          return 100;
        }
        return prev + 5; // reaches 100 in exactly 2 seconds
      });
    }, 100);

    scanTimeoutRef.current = setTimeout(() => {
      if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
      // Select nearest with 2 mins ETA
      const chosen = candidates[0];
      setSearchingAmbulances([]);
      setAssignedAmbulance(chosen);
      setDispatchStatus("DISPATCHED");
    }, 2000);
  };

  // Click handler to manual-select any driver/candidate unit directly
  const handleSelectAmbulance = (chosen) => {
    if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
    if (scanTimeoutRef.current) clearTimeout(scanTimeoutRef.current);

    setScanProgress(100);
    setSearchingAmbulances([]);
    setAssignedAmbulance(chosen);
    setDispatchStatus("DISPATCHED");
  };

  // Callback when ambulance slowly navigates and reaches user (ETA hits 0)
  const handleAmbulanceArrival = () => {
    setDispatchStatus("ARRIVED_AT_PATIENT");
  };

  // Confirmation of arrival (user verifies driver)
  const handleConfirmArrival = () => {
    setIsSoundOff(true);
    setDispatchStatus("CONFIRMED_ARRIVAL");
    setTimeout(() => {
      setDispatchStatus("EN_ROUTE_TO_HOSPITAL");
    }, 450);
  };

  // Callback when ambulance completes transition user -> Selected nearest hospital
  const handleAmbulanceHospitalArrival = () => {
    setDispatchStatus("ARRIVED_AT_HOSPITAL");
    const baseFee = isPremiumEmergency ? 5000 : 1500;
    const distFee = parseFloat((selectedHospital.distanceKm * (isPremiumEmergency ? 500 : 250)).toFixed(2));
    const total = baseFee + distFee;
    const invoiceNum = `INV-${Math.floor(100000 + Math.random() * 900000)}`;
    const txNum = `TXN-${Math.floor(10000000 + Math.random() * 90000000)}`;
    setGeneratedSlip({
      invoiceId: invoiceNum,
      baseFare: baseFee,
      distanceFare: distFee,
      totalAmount: total,
      transactionId: txNum,
      timestamp: new Date().toLocaleString()
    });

    // PLAY 3-SEC DESTINATION COMPLETED CHIME IF SOUNDS ARE NOT OFF
    if (!isSoundOff) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        try {
          const audioCtx = new AudioContextClass();
          const mainGain = audioCtx.createGain();
          mainGain.gain.setValueAtTime(0.18, audioCtx.currentTime);
          mainGain.connect(audioCtx.destination);

          // Beautiful pleasant arpeggiated celebratory melody
          const osc1 = audioCtx.createOscillator();
          const osc2 = audioCtx.createOscillator();

          osc1.type = "triangle";
          osc1.frequency.setValueAtTime(261.63, audioCtx.currentTime); // C4
          osc1.frequency.setValueAtTime(329.63, audioCtx.currentTime + 0.3); // E4
          osc1.frequency.setValueAtTime(392.00, audioCtx.currentTime + 0.6); // G4
          osc1.frequency.setValueAtTime(523.25, audioCtx.currentTime + 0.9); // C5
          osc1.frequency.setValueAtTime(659.25, audioCtx.currentTime + 1.2); // E5
          osc1.frequency.setValueAtTime(783.99, audioCtx.currentTime + 1.5); // G5
          osc1.frequency.setValueAtTime(1046.50, audioCtx.currentTime + 1.8); // C6
          osc1.connect(mainGain);

          osc2.type = "sine";
          osc2.frequency.setValueAtTime(130.81, audioCtx.currentTime); // C3
          osc2.frequency.setValueAtTime(164.81, audioCtx.currentTime + 0.3); // E3
          osc2.frequency.setValueAtTime(196.00, audioCtx.currentTime + 0.6); // G3
          osc2.frequency.setValueAtTime(261.63, audioCtx.currentTime + 0.9); // C4
          osc2.frequency.setValueAtTime(329.63, audioCtx.currentTime + 1.2); // E4
          osc2.frequency.setValueAtTime(392.00, audioCtx.currentTime + 1.5); // G4
          osc2.frequency.setValueAtTime(523.25, audioCtx.currentTime + 1.8); // C5
          osc2.connect(mainGain);

          osc1.start();
          osc2.start();

          // Smoothly ramp down the gain to 0 near the end of the 3 seconds
          mainGain.gain.setValueAtTime(0.18, audioCtx.currentTime + 2.4);
          mainGain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 3.0);

          setTimeout(() => {
            try {
              osc1.stop();
              osc2.stop();
              audioCtx.close().catch(() => {});
            } catch (err) {}
          }, 3000);
        } catch (e) {
          console.error("Audio completion playing failed:", e);
        }
      }
    }
  };

  const handleAdmittedHospital = async (customInvoice) => {
    setDispatchStatus("ADMITTED");

    // Save trauma incident details to historical cases
    if (activePatient && assignedAmbulance) {
      const slipToSave = customInvoice || generatedSlip;

      let updatedSelectedHospital = { ...selectedHospital };
      // Decrement available beds of the selected hospital by 1 to make it live
      if (selectedHospital) {
        const nextBeds = Math.max(0, selectedHospital.availableBeds - 1);
        const nextIcuBeds = Math.max(0, selectedHospital.availableIcuBeds - (activePatient.emergencyType === "Cardiac Arrest" || isPremiumEmergency ? 1 : 0));
        updatedSelectedHospital = {
          ...selectedHospital,
          availableBeds: nextBeds,
          availableIcuBeds: nextIcuBeds,
        };
        setSelectedHospital(updatedSelectedHospital);

        setHospitals(prev => {
          const nextHospitals = prev.map(h => {
            if (h.id === selectedHospital.id) {
              return updatedSelectedHospital;
            }
            return h;
          });
          localStorage.setItem("smart_dispatch_hospitals", JSON.stringify(nextHospitals));
          return nextHospitals;
        });
      }

      const newCase = {
        id: `CASE_${Date.now()}`,
        patient: activePatient,
        status: "ADMITTED",
        currentLocation: {
          lat: 200,
          lng: 220,
          address: patientAddress,
        },
        ambulance: assignedAmbulance,
        hospital: updatedSelectedHospital,
        createdAt: new Date().toLocaleString(),
        invoiceDetails: slipToSave ? {
          invoiceId: slipToSave.invoiceId,
          totalAmount: slipToSave.totalAmount,
          baseFare: slipToSave.baseFare,
          distanceFare: slipToSave.distanceFare,
          transactionId: slipToSave.transactionId,
          timestamp: slipToSave.timestamp,
        } : undefined,
      };

      const updated = [newCase, ...pastCases];
      setPastCases(updated);
      localStorage.setItem("smart_dispatch_cases", JSON.stringify(updated));

      // Sync with server API (which synchronizes with local disk-files and live Supabase)
      try {
        await fetch("/api/cases", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newCase)
        });
      } catch (err) {
        console.error("DB Synchronization API failed:", err);
      }
    }
  };

  // Reset or clear active trauma event
  const handleStartNewEmergency = () => {
    setIsSoundOff(false);
    setActivePatient(null);
    setDispatchStatus("IDLE");
    setAssignedAmbulance(null);
    setIsPremiumEmergency(false);
    setPatientForm({
      name: "",
      age: 0,
      bloodGroup: "O+",
      emergencyType: "Cardiac Arrest",
      additionalNotes: "",
      contactNumber: "",
    });
    setPaymentForm({
      cardName: "",
      cardNumber: "",
      cardExpiry: "",
      cardCVV: "",
      walletNumber: "",
      walletName: "",
      walletPin: ""
    });
    setSelectedPaymentMethod("CREDIT_CARD");
    setIsPaying(false);
    setPaymentSuccess(false);
    setGeneratedSlip(null);
  };

  const loginBgUrl = swiftBg; // Swift branding background
  const appBgUrl = swiftBg;   // Unified background image related to this website

return (
    <div 
      id="smart-ambulance-app-root" 
      className={`min-h-screen ${isDarkMode ? "text-slate-100 dark-mode bg-transparent" : "text-slate-800 light-mode bg-transparent"} flex flex-col font-sans transition-all duration-300 relative`}
style={{
        backgroundImage: `linear-gradient(135deg, rgba(0, 0, 0, 0.45) 0%, rgba(0, 0, 0, 0.85) 100%), url(${appBgUrl})`,
        backgroundColor: 'transparent',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        backgroundRepeat: 'no-repeat'
      }}
    >
      
      {!isDarkMode && (
        <style>{`
          /* Ultimate Light Mode Styling Overrides */
          #smart-ambulance-app-root {
            color: #1e293b !important;
          }
          
          /* Header and controls styles */
          header {
            background-color: rgba(255, 255, 255, 0.9) !important;
            border-bottom: 2px solid #cbd5e1 !important;
          }
          header h1 {
            color: #0f172a !important;
          }
          header p {
            color: #475569 !important;
          }
          
          /* Nav bar */
          nav {
            background-color: #f1f5f9 !important;
            border-color: #cbd5e1 !important;
          }
          nav button {
            color: #475569 !important;
          }
          
          /* User Profile & Badge */
          .bg-slate-950\\/80, .bg-\\[\\#090e1a\\]\\/90 {
            background-color: rgba(255, 255, 255, 0.9) !important;
            border-color: #cbd5e1 !important;
          }
          
          /* Universal Overrides for Text */
          p, span, h1, h2, h3, h4, h5, h6, select, option {
            color: #1e293b;
          }
          
          /* Card containers overriding arbitrary backgrounds and dark colors */
          .bg-slate-900, 
          .bg-slate-900\\/80, 
          .bg-slate-950, 
          .bg-slate-950\\/80, 
          .bg-slate-950\\/90,
          .bg-slate-950\\/45,
          .bg-slate-950\\/40,
          .bg-slate-950\\/30,
          .bg-slate-950\\/75,
          .bg-slate-950\\/85,
          .bg-\\[\\#030712\\]\\/90, 
          .bg-\\[\\#030712\\],
          .bg-slate-950\\/95,
          .bg-slate-900\\/50,
          .bg-\\[\\#02050e\\] {
            background-color: #ffffff !important;
            border-color: #cbd5e1 !important;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05), inset 0 1px 0 rgba(255,255,255,0.8) !important;
          }
          
          /* Make sure child page titles are deeply dark */
          h1, h2, h3, h4, h5, h6 {
            color: #0d1727 !important;
          }
          
          /* Inputs, selects, textareas */
          input, select, textarea {
            background-color: #f8fafc !important;
            border-color: #cbd5e1 !important;
            color: #0f172a !important;
          }
          
          /* Border color overrides */
          .border-slate-800, 
          .border-slate-850, 
          .border-slate-900, 
          .border-slate-900\\/60, 
          .border-red-900\\/30,
          .border-red-900\\/40,
          .border-red-950 {
            border-color: #cbd5e1 !important;
          }
          
          /* Text slate colors */
          .text-slate-400, .text-slate-500, .text-slate-505, .text-slate-300, .text-slate-200 {
            color: #475569 !important;
          }
          
          /* Active menu items styles fallback */
          button.bg-red-950\\/50, div.bg-red-950\\/50 {
            background-color: #fee2e2 !important;
            border-color: #fca5a5 !important;
            color: #991b1b !important;
          }
          
          /* Sidebar active lines or text */
          .text-red-500, .text-rose-500, .text-red-400 {
            color: #dc2626 !important;
          }
          .text-emerald-500, .text-emerald-400 {
            color: #059669 !important;
          }
          
          /* Patient details custom container and tags */
          .bg-\\[\\#062014\\] {
            background-color: #d1fae5 !important;
            color: #065f46 !important;
            border-color: #a7f3d0 !important;
          }
          .text-emerald-450 {
            color: #047857 !important;
          }
          
          /* Chat Panel specific fixes */
          #ai-chat-panel, .bg-emerald-950\\/30 {
            background-color: #f0fdf4 !important;
            border-color: #bbf7d0 !important;
          }
          .bg-emerald-950\\/40 {
            background-color: #dcfce7 !important;
          }
          
          /* Live notification card */
          .bg-red-950\\/60 {
            background-color: #fef2f2 !important;
            border-color: #fecaca !important;
          }
          
          /* PDF Download, buttons */
          .from-emerald-600, .to-teal-600 {
            background-image: linear-gradient(to right, #059669, #0d9488) !important;
            color: white !important;
          }
          
          .bg-[radial-gradient(#1e293b_1.2px,transparent_1.2px)] {
            background-image: radial-gradient(#cbd5e1 1.2px, transparent 1.2px) !important;
          }
        `}</style>
      )}

      {/* Top Main Dynamic HUD Header */}
      <header className="sticky top-0 z-50 bg-[#090e1a]/90 backdrop-blur-xl border-b border-red-900/30 px-4 md:px-8 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-red-950/60 border border-red-800/80 rounded-xl shadow-[0_0_15px_rgba(239,68,68,0.4)] animate-pulse">
            <Siren className="w-5 h-5 text-red-500" />
          </div>
          <div className="flex items-center gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black font-sans tracking-wider text-white">
                  SWIFT<span className="text-red-500">RESCUE</span>
                </h1>
                {/* SVG Live Heartbeat Wave */}
                <svg className="w-12 h-6 text-red-500/80 hidden md:block" fill="none" viewBox="0 0 60 20" stroke="currentColor" strokeWidth="2">
                  <path d="M0,10 L15,10 L19,2 L24,18 L28,7 L31,13 L35,10 L60,10" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <p className="text-[9px] text-slate-400 font-mono tracking-wider font-extrabold uppercase">
                SMART MEDICAL DISPATCH & TRAUMA DISPATCH CONSOLE
              </p>
            </div>
          </div>
        </div>

        {/* Global Nav, User Badge & Theme Toggle */}
        <div className="flex items-center gap-4">
          {/* Light / Dark Mode Toggle Icon Button */}
          <button
            onClick={() => {
              const nextMode = !isDarkMode;
              setIsDarkMode(nextMode);
              localStorage.setItem("theme", nextMode ? "dark" : "light");
            }}
            id="theme-toggle-btn"
            className="p-1.5 px-3 rounded-xl bg-slate-950/80 hover:bg-slate-900/90 border border-slate-850 hover:border-slate-700 text-slate-350 hover:text-amber-400 transition-all cursor-pointer flex items-center gap-1.5 text-[9px] tracking-wider font-mono font-bold shadow-md h-8 uppercase"
            title={isDarkMode ? "Switch to Light Mode" : "Switch to Night Mode"}
          >
            {isDarkMode ? (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                <span className="hidden sm:inline text-slate-300">Light Mode</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-indigo-400" />
                <span className="hidden sm:inline text-slate-705">Night Mode</span>
              </>
            )}
          </button>

          {currentUser && (
            <div className="flex items-center gap-4">
              <nav className="hidden xl:flex bg-slate-950/80 p-0.5 rounded-lg border border-slate-850 text-[11px] font-mono">
                <button
                  className={`px-3 py-1 rounded-md font-medium transition-all cursor-pointer ${
                    activePage === "DISPATCH" ? "bg-red-950/50 border border-red-900/40 text-red-400 shadow-[0_0_10px_rgba(239,68,68,0.2)]" : "text-slate-400 hover:text-white"
                  }`}
                  onClick={() => setActivePage("DISPATCH")}
                >
                  🚨 SOS Console
                </button>
                <button
                  className={`px-3 py-1 rounded-md font-medium transition-all cursor-pointer ${
                    activePage === "HOSPITALS" ? "bg-red-950/50 border border-red-900/40 text-red-400 shadow-[0_0_10px_rgba(239,68,68,0.2)]" : "text-slate-400 hover:text-white"
                  }`}
                  onClick={() => setActivePage("HOSPITALS")}
                >
                  🏨 Hospitals
                </button>
                <button
                  className={`px-3 py-1 rounded-md font-medium transition-all cursor-pointer ${
                    activePage === "ANALYTICS" ? "bg-red-950/50 border border-red-900/40 text-red-400 shadow-[0_0_10px_rgba(239,68,68,0.2)]" : "text-slate-400 hover:text-white"
                  }`}
                  onClick={() => setActivePage("ANALYTICS")}
                >
                  📊 Fleet
                </button>
                <button
                  className={`px-3 py-1 rounded-md font-medium transition-all cursor-pointer ${
                    activePage === "ARCHIVES" ? "bg-red-950/50 border border-red-900/40 text-red-400 shadow-[0_0_10px_rgba(239,68,68,0.2)]" : "text-slate-400 hover:text-white"
                  }`}
                  onClick={() => setActivePage("ARCHIVES")}
                >
                  📂 Archives
                </button>
              </nav>

              <div className="flex items-center gap-3 bg-slate-950/80 px-3 py-1 rounded-xl border border-slate-850 font-mono text-[10px]">
                <div className="hidden sm:block text-left leading-none border-r border-slate-850 pr-3">
                  <span className="text-slate-500 block text-[8px] uppercase">OPERATOR</span>
                  <span className="font-bold text-slate-200 block truncate max-w-[100px]">{currentUser.name}</span>
                </div>
                <div className="flex items-center gap-1.5 leading-none">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                  <div>
                    <span className="text-slate-550 block text-[8px] uppercase">SYSTEM</span>
                    <span className="font-bold text-emerald-405 text-[9px] tracking-wider">SECURE ONLINE</span>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  title="Log Out"
                  className="hover:bg-slate-900 p-1 rounded-lg text-slate-400 hover:text-red-400 transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main Container Core */}
      <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto space-y-6">
        
        {/* LOGIN AND SIGNUP SCREEN (If No Active Session) */}
        {!currentUser ? (
          <div id="authentication-screen" className="max-w-md mx-auto my-12 bg-slate-950/40 backdrop-blur-3xl border border-white/10 p-8 rounded-3xl space-y-6 shadow-[0_24px_60px_-15px_rgba(0,0,0,0.8)] relative overflow-hidden transition-all duration-300">
            {/* Ambient Red Glow in backdrop */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-72 h-72 bg-red-600/15 rounded-full blur-3xl pointer-events-none animate-pulse" />

            {/* Brand Header */}
            <div className="text-center space-y-2 relative">
              <div className="w-12 h-12 bg-red-950/80 border border-red-900/60 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-bounce">
                <Siren className="w-6 h-6 text-red-500" />
              </div>
              <h2 className="text-xl font-bold font-sans text-slate-100">SwiftRescue Dispatch Portal</h2>
            </div>

            {/* Toggle tabs */}
            <div className="grid grid-cols-2 bg-slate-950/50 p-1 rounded-xl border border-white/5">
              <button
                className={`py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  authTab === "SIGNUP" ? "bg-red-600 text-white shadow-[0_0_15px_rgba(220,38,38,0.45)]" : "text-slate-400 hover:text-white"
                }`}
                onClick={() => {
                  setAuthTab("SIGNUP");
                  setAuthError("");
                }}
              >
                Create Account
              </button>
              <button
                className={`py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  authTab === "LOGIN" ? "bg-red-600 text-white shadow-[0_0_15px_rgba(220,38,38,0.45)]" : "text-slate-400 hover:text-white"
                }`}
                onClick={() => {
                  setAuthTab("LOGIN");
                  setAuthError("");
                }}
              >
                Login
              </button>
            </div>

            {/* Notification panels */}
            {authError && (
              <div className="p-3 bg-red-950/60 border border-red-900/40 rounded-xl text-xs text-red-400 font-mono">
                🛑 {authError}
              </div>
            )}
            {authSuccess && (
              <div className="p-3 bg-emerald-950/60 border border-emerald-900/40 rounded-xl text-xs text-emerald-400 font-mono">
                ✓ {authSuccess}
              </div>
            )}

            {/* Sign Up Form */}
            {authTab === "SIGNUP" ? (
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-mono font-bold text-slate-400 uppercase block">Operator Full Name</label>
                  <input
                    type="text"
                    value={authName}
                    onChange={(e) => setAuthName(e.target.value)}
                    placeholder="Samiuddin Ahmed"
                    required
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-950/65 border border-white/10 rounded-xl text-slate-200 focus:outline-none focus:border-red-500/80 placeholder-slate-500 transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-mono font-bold text-slate-400 uppercase block">Email Address</label>
                  <input
                    type="email"
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    placeholder="samiuddin2k5@gmail.com"
                    required
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-950/65 border border-white/10 rounded-xl text-slate-200 focus:outline-none focus:border-red-500/80 placeholder-slate-500 transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-mono font-bold text-slate-400 uppercase block">Secure Password</label>
                  <input
                    type="password"
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    placeholder="••••••••••••"
                    required
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-950/65 border border-white/10 rounded-xl text-slate-200 focus:outline-none focus:border-red-500/80 placeholder-slate-500 transition-all"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-red-600 hover:bg-red-500 text-white font-semibold py-2.5 rounded-xl border border-red-500/20 text-xs shadow-lg transition-colors cursor-pointer mt-2"
                >
                  Create
                </button>
              </form>
            ) : (
              // Login Form
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-mono font-bold text-slate-400 uppercase block">Email Address</label>
                  <input
                    type="email"
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    placeholder="samiuddin2k5@gmail.com"
                    required
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-950/65 border border-white/10 rounded-xl text-slate-200 focus:outline-none focus:border-red-500/80 placeholder-slate-500 transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-mono font-bold text-slate-400 uppercase block">Password</label>
                  <input
                    type="password"
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-950/65 border border-white/10 rounded-xl text-slate-200 focus:outline-none focus:border-red-500/80 placeholder-slate-500 transition-all"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-red-600 hover:bg-red-500 text-white font-semibold py-2.5 rounded-xl border border-red-500/20 text-xs shadow-lg transition-colors cursor-pointer mt-2"
                >
                  Sign In to Dispatch
                </button>
              </form>
            )}

            {/* Google Login 1-Click Divider */}
            <div className="relative pt-2">
              <div className="absolute inset-0 flex items-center" aria-hidden="true">
                <div className="w-full border-t border-white/10" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-[#0b0f19]/90 px-2 text-slate-500 font-mono text-[9px] tracking-widest">Or Google OAuth</span>
              </div>
            </div>

            {/* Google Signup Simulator Button */}
            <button
              onClick={handleGoogleLogin}
              type="button"
              className="w-full bg-slate-900/65 hover:bg-slate-900/95 text-slate-100 font-bold py-3 rounded-xl border border-white/10 hover:border-white/20 text-xs flex items-center justify-center gap-2.5 transition-all cursor-pointer shadow-lg animate-pulse"
            >
              <svg className="w-4 h-4 text-emerald-400" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M12.24 10.285V13.4h6.887c-.275 1.565-1.88 4.604-6.887 4.604-4.33 0-7.859-3.579-7.859-8s3.53-8 7.859-8c2.46 0 4.105 1.025 5.047 1.926l2.427-2.334C17.955 2.192 15.34 1 12.24 1 6.033 1 1 6.033 1 12.24s5.033 11.24 11.24 11.24c6.478 0 10.793-4.537 10.793-10.986 0-.74-.08-1.3-.176-1.854H12.24z"
                />
              </svg>
              <span>Connect with Gmail ID</span>
            </button>
            <p className="text-[10px] text-slate-500 font-mono text-center">
              💡 Standard login & registration natively accepts and logs all @gmail.com accounts too!
            </p>

            {/* INTERACTIVE GOOGLE SINGLE SIGN-ON ACCOUNTS PICKER MODAL */}
            {isGoogleModalOpen && (
              <div className="fixed inset-0 z-55 flex items-center justify-center p-4 bg-slate-950/45 backdrop-blur-md">
                <div className="w-full max-w-sm bg-slate-950/40 backdrop-blur-3xl text-slate-100 rounded-3xl p-6 shadow-[0_24px_60px_-15px_rgba(0,0,0,0.8)] space-y-5 border border-white/10 relative overflow-hidden text-left transition-all duration-300">
                  {/* Ambient Red Glow in backdrop */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-52 h-52 bg-red-600/15 rounded-full blur-3xl pointer-events-none animate-pulse" />

                  {/* Google Brand Header */}
                  <div className="text-center space-y-1.5 relative">
                    <div className="flex justify-center gap-1.5 mb-2">
                      <span className="w-3 h-3 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)] animate-pulse" />
                      <span className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)] animate-pulse deferred-delay-100" />
                      <span className="w-3 h-3 rounded-full bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.5)] animate-pulse deferred-delay-200" />
                      <span className="w-3 h-3 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)] animate-pulse deferred-delay-300" />
                    </div>
                    <h3 className="text-base font-bold text-white font-sans tracking-tight">Sign in with Google</h3>
                    <p className="text-xs text-slate-400">to continue to <span className="font-bold text-red-400">SwiftRescue</span></p>
                  </div>

                  {/* Inner Warning Feedback */}
                  {customGoogleError && (
                    <div className="p-2.5 bg-red-950/40 text-[10px] text-red-400 rounded-xl border border-red-900/50">
                      ⚠️ {customGoogleError}
                    </div>
                  )}

                  {/* Account Choices List */}
                  <div className="space-y-4 relative">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block pl-1">Choose Account</span>
                    
                    {/* Fast account picker 1 (Samiuddin Ahmed) */}
                    <button
                      type="button"
                      onClick={() => handleConfirmGoogleOAuth("samiuddin2k5@gmail.com", "Samiuddin Ahmed")}
                      className="w-full flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 active:bg-white/15 rounded-2xl border border-white/10 transition-all text-left cursor-pointer group"
                    >
                      <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 text-white font-black flex items-center justify-center text-xs font-mono shadow-sm">
                        S
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-200 group-hover:text-white transition-colors leading-none">Samiuddin Ahmed</p>
                        <p className="text-[10px] text-slate-400 truncate mt-1">samiuddin2k5@gmail.com</p>
                      </div>
                      <span className="text-[9px] bg-blue-500/10 text-blue-400 font-bold px-1.5 py-0.5 rounded border border-blue-500/25 uppercase">Primary</span>
                    </button>

                    {/* Choose and enter custom Google Mail info */}
                    <div className="border border-dashed border-white/10 p-4 rounded-2xl space-y-3 bg-white/5">
                      <div className="flex items-center gap-1.5 text-slate-300">
                        <span className="text-xs">👤</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Use custom Gmail ID instead</span>
                      </div>
                      
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-400 uppercase block pl-0.5">Google Email Address</label>
                        <input
                          type="email"
                          required
                          value={customGoogleEmail}
                          onChange={(e) => setCustomGoogleEmail(e.target.value)}
                          placeholder="muhammad.ahmed@gmail.com"
                          className="w-full px-3.5 py-2.5 text-xs bg-slate-950/65 border border-white/10 rounded-xl text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 placeholder-slate-500 shadow-inner transition-all"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-400 uppercase block pl-0.5">Operator Full Name</label>
                        <input
                          type="text"
                          required
                          value={customGoogleName}
                          onChange={(e) => setCustomGoogleName(e.target.value)}
                          placeholder="e.g. Muhammad Ahmed"
                          className="w-full px-3.5 py-2.5 text-xs bg-slate-950/65 border border-white/10 rounded-xl text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 placeholder-slate-500 transition-all"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => handleConfirmGoogleOAuth(customGoogleEmail, customGoogleName)}
                        className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-[10px] font-bold tracking-widest rounded-xl uppercase transition-all shadow-[0_0_15px_rgba(37,99,235,0.4)] cursor-pointer"
                      >
                        🚀 Authenticate & Sync Profile
                      </button>
                    </div>
                  </div>

                  {/* Footing link areas */}
                  <div className="flex justify-between items-center text-[10px] text-slate-500 pt-3 border-t border-white/10 relative">
                    <button type="button" onClick={() => setIsGoogleModalOpen(false)} className="hover:underline font-bold text-blue-400 hover:text-blue-300 transition-colors cursor-pointer">✕ Cancel Connect</button>
                    <div className="space-x-2 text-[9px] text-slate-600">
                      <span className="hover:underline cursor-not-allowed">Terms of Use</span>
                      <span className="hover:underline cursor-not-allowed">Privacy</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          
          /* ACTIVE USER SESSION PORTAL */
          <div className="space-y-6">

            {/* Mobile Nav Header */}
            <div className="flex flex-wrap md:hidden bg-slate-950/80 p-1 rounded-xl border border-slate-800 text-xs justify-around gap-1">
              <button
                className={`flex-1 min-w-[120px] py-1.5 rounded-lg font-bold transition-all ${
                  activePage === "DISPATCH" ? "bg-red-650 text-white shadow" : "text-slate-400"
                }`}
                onClick={() => setActivePage("DISPATCH")}
              >
                🚨 SOS Console
              </button>
              <button
                className={`flex-1 min-w-[120px] py-1.5 rounded-lg font-bold transition-all ${
                  activePage === "HOSPITALS" ? "bg-red-650 text-white shadow" : "text-slate-400"
                }`}
                onClick={() => setActivePage("HOSPITALS")}
              >
                🏨 Hospitals
              </button>
              <button
                className={`flex-1 min-w-[120px] py-1.5 rounded-lg font-bold transition-all ${
                  activePage === "ANALYTICS" ? "bg-red-650 text-white shadow" : "text-slate-400"
                }`}
                onClick={() => setActivePage("ANALYTICS")}
              >
                📊 Fleet
              </button>
              <button
                className={`flex-1 min-w-[120px] py-1.5 rounded-lg font-bold transition-all ${
                  activePage === "ARCHIVES" ? "bg-red-650 text-white shadow" : "text-slate-400"
                }`}
                onClick={() => setActivePage("ARCHIVES")}
              >
                📂 History
              </button>
            </div>

            {/* VIEW A: ANALYTICS FLOWER GRID */}
            {activePage === "ANALYTICS" && (
              <div className="bg-slate-950/40 p-6 border border-slate-800/80 rounded-3xl backdrop-blur-xl relative shadow-2xl">
                <AnalyticsDashboard />
              </div>
            )}

            {/* VIEW B: HOSPITAL DIRECTORY & BED STATUS */}
            {activePage === "HOSPITALS" && (
              <div className="bg-slate-950/40 p-6 border border-slate-800/80 rounded-3xl backdrop-blur-xl relative shadow-2xl space-y-6 animate-fade-in">
                <div className="border-b border-slate-800 pb-4">
                  <h3 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                    🏨 Interactive Hospital Directory & ICU Status
                  </h3>
                  <p className="text-xs text-slate-400 font-mono mt-1">
                    Live telemetry tracking of ICU room vacancies, duty specialists, and automated ambulance route distances.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {hospitals.map((h, i) => {
                    const queueLevels = ["Low (5 min wait)", "Moderate (12 min wait)", "Heavy (24 min wait)"];
                    const qLevel = queueLevels[i % 3];
                    const qColor = i % 3 === 0 ? "text-emerald-450 bg-emerald-950/30 border border-emerald-900/40" : i % 3 === 1 ? "text-yellow-400 bg-yellow-950/30 border border-yellow-900/40" : "text-red-400 bg-red-950/30 border border-red-900/40";

                    return (
                      <div key={h.id} className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden hover:border-slate-750 transition-all flex flex-col justify-between">
                        <div className="relative h-32 bg-slate-955 overflow-hidden">
                          <img src={h.imageUrl} alt={h.name} className="w-full h-full object-cover opacity-75" referrerPolicy="no-referrer" />
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-905 to-transparent" />
                          <div className="absolute top-2 right-2 text-[10px] font-mono bg-slate-950/80 border border-white/10 px-2 py-0.5 rounded text-yellow-550 font-bold flex items-center gap-1">
                            ★ {h.rating.toFixed(1)}
                          </div>
                        </div>

                        <div className="p-4 space-y-3 font-sans">
                          <div>
                            <span className="text-[10px] font-mono font-bold text-rose-500 uppercase">Emergency Provider</span>
                            <h4 className="text-sm font-bold text-slate-205 mt-0.5 line-clamp-1">{h.name}</h4>
                          </div>

                          <div className="space-y-1.5 text-xs text-slate-350 font-mono">
                            <div className="flex justify-between">
                              <span className="text-slate-500 uppercase text-[9px]">ICU Chambers</span>
                              <span className="text-emerald-400 font-bold">{h.availableIcuBeds} vacant</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500 uppercase text-[9px]">Total Vacant</span>
                              <span className="text-slate-350">{h.availableBeds} beds</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500 uppercase text-[9px]">Duty Doctor</span>
                              <span className="text-slate-200 font-sans font-medium">{h.onDutyDoctor}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500 uppercase text-[9px]">Assigned Room</span>
                              <span className="text-slate-250 truncate max-w-[120px]">{h.assignedRoom}</span>
                            </div>
                          </div>

                          {/* Interactive Hospital Focus and Setup */}
                          <div className="pt-2 border-t border-slate-850 flex items-center justify-between text-[11px] gap-2">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase ${qColor}`}>
                              {qLevel}
                            </span>
                            <button
                              onClick={() => {
                                setSelectedHospital(h);
                                if (dispatchStatus === "IDLE") {
                                  alert(`Linked dispatch destination: ${h.name}. Complete patient profile in 'Control Dispatch' page to activate.`);
                                } else {
                                  alert(`Destination swapped. Dynamic ambulance routing coordinates mapped to ${h.name}`);
                                }
                              }}
                              className="px-2.5 py-1 bg-red-650 hover:bg-red-550 text-white rounded font-bold transition-all text-[10px] cursor-pointer shrink-0"
                            >
                              Focus Unit
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* ICU capacity index bar */}
                <div className="pt-4 animate-fade-in">
                  <div className="bg-slate-900/40 p-5 rounded-2xl border border-slate-800 space-y-3">
                    <h4 className="text-sm font-bold text-slate-200 flex items-center gap-1.5">
                      🏥 Regional ICU Capacity Heatmap Index (Real-time Karachi Blocks)
                    </h4>
                    <p className="text-xs text-slate-400">
                      Smart dispatch automatically shifts incoming emergency sirens when available beds drop below 2 inside of high-congestion trauma blocks.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 pt-1 font-mono text-[11px]">
                      {hospitals.map((h) => {
                        const maxIcu = h.id === "hosp_nicvd" ? 12 : h.id === "hosp_jpmc" ? 10 : h.id === "hosp_aga_khan" ? 9 : 6;
                        const pctBeds = Math.min(100, Math.round((h.availableIcuBeds / maxIcu) * 100));
                        return (
                          <div key={h.id} className="space-y-1 bg-slate-950/20 p-2 rounded-lg border border-slate-900/40">
                            <div className="flex justify-between text-slate-400 text-[10px]">
                              <span className="truncate pr-2 font-medium">{h.name}</span>
                              <span className="text-emerald-400 font-bold shrink-0">{h.availableIcuBeds} / {maxIcu} Beds</span>
                            </div>
                            <div className="h-2 bg-slate-950 border border-slate-850 rounded-full overflow-hidden">
                              <div className="h-full bg-emerald-500 rounded-full animate-pulse" style={{ width: `${pctBeds}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* VIEW C: INCIDENT ARCHIVES & HISTORICAL CASUALTY DATABASE */}
            {activePage === "ARCHIVES" && (
              <div className="bg-[#0b0f19]/40 p-6 border border-slate-800/80 rounded-3xl backdrop-blur-xl relative shadow-2xl space-y-6 animate-fade-in">
                <div className="flex flex-wrap justify-between items-center gap-4 border-b border-slate-800 pb-4">
                  <div>
                    <h3 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                      📂 Historical Incident Archives
                    </h3>
                    <p className="text-xs text-slate-400 font-mono mt-1">
                      Secure encrypted logs of past registered dispatches and critical case outcomes.
                    </p>
                  </div>
                  <span className="bg-slate-900 border border-slate-800 text-slate-350 text-xs px-3 py-1 rounded-xl font-mono">
                    Total Locked: {pastCases.length} records
                  </span>
                </div>

                {/* Secure PDF Incident Report Exporter and Dynamic Day Filter */}
                {(() => {
                  const filteredCases = pastCases.filter((c) => {
                    if (!archiveDateFilter) return true;
                    try {
                      const d1 = new Date(c.createdAt);
                      const d2 = new Date(archiveDateFilter);
                      if (isNaN(d1.getTime()) || isNaN(d2.getTime())) {
                        return c.createdAt.includes(archiveDateFilter);
                      }
                      return (
                        d1.getFullYear() === d2.getFullYear() &&
                        d1.getMonth() === d2.getMonth() &&
                        d1.getDate() === d2.getDate()
                      );
                    } catch (err) {
                      return c.createdAt.includes(archiveDateFilter);
                    }
                  });

                  const generateArchivePDF = (casesToDownload, filterDate) => {
                    const doc = new jsPDF({
                      orientation: "portrait",
                      unit: "mm",
                      format: "a4"
                    });

                    const primaryColor = [220, 38, 38]; // Red 600
                    const secondaryColor = [30, 41, 59]; // Slate 800
                    const textColor = [51, 65, 85]; // Slate 600
                    const labelColor = [15, 23, 42]; // Slate 900

                    // Header strip red
                    doc.setFillColor(...primaryColor);
                    doc.rect(0, 0, 210, 15, "F");

                    doc.setTextColor(255, 255, 255);
                    doc.setFont("helvetica", "bold");
                    doc.setFontSize(12);
                    doc.text("SWIFTRESCUE DISPATCH CORPS — AUTOMATED HEALTH SYSTEM", 14, 10);

                    // Title
                    doc.setTextColor(...labelColor);
                    doc.setFontSize(18);
                    doc.text("INCIDENT DISPATCH & AMBULANCE REPORT", 14, 26);

                    // Meta details
                    doc.setFont("helvetica", "normal");
                    doc.setFontSize(9);
                    doc.setTextColor(...textColor);
                    
                    const displayDate = filterDate ? `Date Specific: ${filterDate}` : "All Recorded Dates (All-time)";
                    doc.text(`Scope of records: ${displayDate}`, 14, 32);
                    doc.text(`Generated on: ${new Date().toLocaleString()} UTC`, 14, 36);
                    doc.text(`Total Records Extracted: ${casesToDownload.length}`, 14, 40);

                    // Divider
                    doc.setDrawColor(203, 213, 225);
                    doc.setLineWidth(0.4);
                    doc.line(14, 43, 196, 43);

                    let y = 50;

                    if (casesToDownload.length === 0) {
                      doc.setFont("helvetica", "italic");
                      doc.setFontSize(11);
                      doc.text("No registered incident logs match the selected timeframe query.", 14, y);
                    } else {
                      casesToDownload.forEach((c, idx) => {
                        // Page boundary check
                        if (y > 230) {
                          doc.addPage();
                          // Header strip on new pages
                          doc.setFillColor(...primaryColor);
                          doc.rect(0, 0, 210, 8, "F");
                          doc.setTextColor(255, 255, 255);
                          doc.setFont("helvetica", "bold");
                          doc.setFontSize(8);
                          doc.text("SWIFTRESCUE DISPATCH CORPS — REPORT CONTINUED", 14, 5);
                          y = 16;
                        }

                        doc.setFillColor(248, 250, 252);
                        doc.rect(14, y, 182, 44, "F");
                        doc.setDrawColor(226, 232, 240);
                        doc.rect(14, y, 182, 44, "S");

                        doc.setTextColor(...primaryColor);
                        doc.setFont("helvetica", "bold");
                        doc.setFontSize(10);
                        doc.text(`ENTRY #${idx + 1} • REFERENCE: ${c.id}`, 18, y + 6);

                        doc.setTextColor(...textColor);
                        doc.setFont("helvetica", "normal");
                        doc.setFontSize(8);
                        doc.text(`Timestamp: ${c.createdAt}`, 134, y + 6);

                        // Divider
                        doc.setDrawColor(241, 245, 249);
                        doc.line(18, y + 9, 192, y + 9);

                        // Grid contents
                        doc.setTextColor(...labelColor);
                        doc.setFont("helvetica", "bold");
                        doc.text("Patient Name:", 18, y + 14);
                        doc.setFont("helvetica", "normal");
                        doc.text(`${c.patient?.name || "N/A"} (Age: ${c.patient?.age || "N/A"}, Blood: ${c.patient?.bloodGroup || "N/A"})`, 42, y + 14);

                        doc.setFont("helvetica", "bold");
                        doc.text("Emergency Category:", 18, y + 19);
                        doc.setFont("helvetica", "normal");
                        doc.setTextColor(220, 38, 38);
                        doc.text(`${c.patient?.emergencyType || "General Ambulance"}`, 53, y + 19);
                        doc.setTextColor(...labelColor);

                        doc.setFont("helvetica", "bold");
                        doc.text("Assigned Paramedic Pod:", 18, y + 24);
                        doc.setFont("helvetica", "normal");
                        doc.text(`${c.ambulance?.driverName || "N/A"} (${c.ambulance?.plateNumber || "N/A"})`, 58, y + 24);

                        doc.setFont("helvetica", "bold");
                        doc.text("Admitting Trauma Center:", 18, y + 29);
                        doc.setFont("helvetica", "normal");
                        doc.text(`${c.hospital?.name || "N/A"}`, 58, y + 29);

                        doc.setFont("helvetica", "bold");
                        doc.text("Fare & Transit Settle:", 18, y + 34);
                        doc.setFont("helvetica", "normal");
                        if (c.invoiceDetails) {
                          doc.setTextColor(5, 150, 105);
                          doc.text(`Paid: Rs. ${c.invoiceDetails.totalAmount?.toFixed(2)} (Bill ID: ${c.invoiceDetails.invoiceId}, Gateway Ref: ${c.invoiceDetails.transactionId?.substring(0, 20)})`, 53, y + 34);
                          doc.setTextColor(...labelColor);
                        } else {
                          doc.text("Paid: Free/Complimentary Dispatch Relief", 53, y + 34);
                        }

                        doc.setFont("helvetica", "italic");
                        doc.setTextColor(...textColor);
                        doc.text(`Notes: "${c.patient?.additionalNotes || ""}"`, 18, y + 39);

                        y += 48;
                      });
                    }

                    // Add footer to all pages
                    const count = doc.internal.getNumberOfPages();
                    for (let i = 1; i <= count; i++) {
                      doc.setPage(i);
                      doc.setDrawColor(203, 213, 225);
                      doc.line(14, 282, 196, 282);
                      doc.setFont("helvetica", "normal");
                      doc.setFontSize(7.5);
                      doc.setTextColor(148, 163, 184);
                      doc.text("SwiftRescue Automated HIPAA Log Archives. Handled securely by encrypted SSL protocols.", 14, 286);
                      doc.text(`Page ${i} of ${count}`, 180, 286);
                    }

                    doc.save(`swiftrescue-archive-report-${displayDate.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.pdf`);
                  };

                  return (
                    <div className="space-y-6">
                      <div className="bg-slate-950/80 border border-slate-800 p-6 rounded-3xl space-y-4 shadow-xl">
                        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-850">
                          <div>
                            <h4 className="text-xs font-mono text-amber-500 uppercase tracking-widest flex items-center gap-1.5 font-bold">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                              🎫 Secure PDF Incident Report Exporter
                            </h4>
                            <p className="text-[11px] text-slate-400 font-sans mt-1">
                              Select a target day to filter the archival system and download PDF reports instantly.
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                          <div className="space-y-1">
                            <label className="text-[10px] font-mono font-bold text-slate-400 uppercase block">Filter Day of Emergency</label>
                            <input
                              type="date"
                              className="w-full px-3.5 py-2.5 text-xs bg-slate-900 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-red-500 font-mono"
                              value={archiveDateFilter}
                              onChange={(e) => setArchiveDateFilter(e.target.value)}
                            />
                          </div>

                          <div className="bg-slate-900/40 border border-slate-850 px-4 py-2.5 rounded-xl text-xs font-mono space-y-1 leading-tight">
                            <div className="flex justify-between text-slate-400">
                              <span>Selected Filter:</span>
                              <span className="text-amber-400 font-bold truncate max-w-[120px]" title={archiveDateFilter || "All-time"}>
                                {archiveDateFilter || "All (All-time)"}
                              </span>
                            </div>
                            <div className="flex justify-between text-slate-400">
                              <span>Filtered Cases:</span>
                              <span className="text-white font-extrabold">{filteredCases.length} records</span>
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                generateArchivePDF(filteredCases, archiveDateFilter);
                              }}
                              className="flex-1 py-3 px-3.5 bg-gradient-to-r from-red-650 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-black text-xs rounded-xl transition-all shadow-md active:scale-95 cursor-pointer uppercase tracking-wider text-center flex items-center justify-center gap-1.5 border border-red-500/20"
                            >
                              📥 PDF report
                            </button>

                            {archiveDateFilter && (
                              <button
                                type="button"
                                onClick={() => setArchiveDateFilter("")}
                                className="px-3 py-3 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white font-bold text-xs rounded-xl transition-all cursor-pointer uppercase tracking-wider text-center"
                                title="Clear date filter"
                              >
                                Clear
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      {filteredCases.length === 0 ? (
                        <div className="p-12 border border-dashed border-slate-800 rounded-2xl text-center space-y-3 bg-slate-900/10">
                          <div className="w-12 h-12 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-center mx-auto text-slate-500 text-lg">
                            📁
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-400">No incident logs matched this criteria</p>
                            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                              Try clearing your day filter or choosing a date that contains completed ambulance dispatches.
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {filteredCases.map((c) => (
                            <div key={c.id} className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 space-y-4 hover:border-slate-750 transition-colors">
                              <div className="flex justify-between items-start border-b border-slate-800/60 pb-3">
                                <div>
                                  <span className="text-[10px] font-mono bg-emerald-950/30 text-emerald-450 border border-emerald-900/40 px-2 py-0.5 rounded-full font-black uppercase">
                                    ✔ Admitted & Settled
                                  </span>
                                  <span className="block text-sm font-bold text-slate-205 mt-1.5">{c.patient?.name || "Patient Record"}</span>
                                </div>
                                <span className="text-[10.5px] font-mono text-slate-550">{c.createdAt}</span>
                              </div>

                              <div className="grid grid-cols-2 gap-3 text-xs font-mono text-slate-400">
                                <div className="bg-slate-950/40 p-2.5 rounded-xl border border-slate-850">
                                  <span className="text-slate-500 block text-[9px] uppercase">Incident ID</span>
                                  <span className="text-slate-200 font-bold block mt-0.5">{c.id}</span>
                                </div>
                                <div className="bg-slate-950/40 p-2.5 rounded-xl border border-slate-850">
                                  <span className="text-slate-500 block text-[9px] uppercase">Clinical Type</span>
                                  <span className="text-red-400 font-bold block mt-0.5 truncate">{c.patient?.emergencyType || "Emergency"}</span>
                                </div>
                                <div className="bg-slate-950/40 p-2.5 rounded-xl border border-slate-850">
                                  <span className="text-slate-500 block text-[9px] uppercase">Ambulance Pod</span>
                                  <span className="text-slate-250 block mt-0.5 truncate">{c.ambulance?.driverName || "Driver Name"} ({c.ambulance?.plateNumber || "Plate"})</span>
                                </div>
                                <div className="bg-slate-950/40 p-2.5 rounded-xl border border-slate-850">
                                  <span className="text-slate-500 block text-[9px] uppercase">Admitting Hospital</span>
                                  <span className="text-teal-400 block mt-0.5 truncate">{c.hospital?.name || "Hospital"}</span>
                                </div>
                              </div>

                              <div className="text-xs text-slate-350 italic bg-slate-950/30 p-2.5 rounded-xl border border-slate-850">
                                Synopsis: "{c.patient?.additionalNotes || "No specific paramedic notes logged."}"
                              </div>

                              {c.invoiceDetails && (
                                <div className="bg-slate-950/80 border border-emerald-500/20 p-3 rounded-xl space-y-2 text-[10px] font-mono">
                                  <div className="flex justify-between text-emerald-400 font-bold border-b border-slate-905 pb-1">
                                    <span>💳 PAID FARE RECEIPT</span>
                                    <span>{c.invoiceDetails.invoiceId}</span>
                                  </div>
                                  <div className="grid grid-cols-2 gap-2 text-slate-400">
                                    <div>
                                      <span className="block text-[8px] uppercase text-slate-500">Total Transit Amount:</span>
                                      <span className="text-white font-bold">Rs. {c.invoiceDetails.totalAmount?.toFixed(2)}</span>
                                    </div>
                                    <div>
                                      <span className="block text-[8px] uppercase text-slate-500">Transaction ID:</span>
                                      <span className="text-slate-200 block truncate" title={c.invoiceDetails.transactionId}>
                                        {c.invoiceDetails.transactionId}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              )}

                              <div className="flex gap-2 justify-end text-[11px] font-sans">
                                <button
                                  onClick={() => {
                                    alert(`Copying HIPAA Medical Case File for Patient: ${c.patient?.name || "Patient"}\nIncident ID: ${c.id}\nEmergency: ${c.patient?.emergencyType}\nAmbulance: ${c.ambulance?.driverName}\nHospital: ${c.hospital?.name}\nInvoice Paid: ${c.invoiceDetails ? `Rs. ${c.invoiceDetails.totalAmount?.toFixed(2)} (${c.invoiceDetails.invoiceId})` : "N/A"}`);
                                  }}
                                  className="px-3 py-1.5 bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-350 hover:text-white rounded-lg transition-colors cursor-pointer font-bold"
                                >
                                  Copy PCR Log
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })()}}
              </div>
            )}

            {/* VIEW D: ACTIVE EMERGENCY DISPATCH PAGE */}
            {activePage === "DISPATCH" && (
              <div className="space-y-6">

                <HorizontalBentoDashboard
                  dispatchStatus={dispatchStatus}
                  assignedAmbulance={assignedAmbulance}
                  isPremiumEmergency={isPremiumEmergency}
                  selectedHospital={selectedHospital}
                  pastCasesCount={pastCases.length}
                />

                {!activePatient ? (
                  <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
                  
                  {/* LEFT PANE: PATIENT INTAKE FORM */}
                  <div className="xl:col-span-4 space-y-6 flex flex-col justify-start">
                    <PatientIntakeForm
                      patientForm={patientForm}
                      setPatientForm={setPatientForm}
                      patientAddress={patientAddress}
                      setPatientAddress={setPatientAddress}
                      selectedHospital={selectedHospital}
                      setSelectedHospital={setSelectedHospital}
                      mockHospitals={hospitals}
                      handlePatientSubmit={handlePatientSubmit}
                      handleInstantEmergency={handleInstantEmergency}
                      activePatient={activePatient}
                      handleCancelCase={handleStartNewEmergency}
                    />
                  </div>

                  {/* CENTER PANE: MAP CONSOLE & CONTROLS */}
                  <div className="xl:col-span-8 space-y-6">
                    {/* Telemetry HUD Status Row */}
                    <div className="bg-slate-950/80 border border-slate-900 rounded-3xl p-4 grid grid-cols-2 md:grid-cols-5 gap-3 font-mono text-[10px] text-slate-400">
                      <div className="bg-slate-900/40 p-2.5 rounded-xl border border-slate-900">
                        <span className="text-slate-505 block uppercase text-[8px]">INCIDENT ID</span>
                        <span className="text-rose-500 font-extrabold block text-xs">
                          TRM-{isPremiumEmergency ? "5250-0822" : "5250-0403"}
                        </span>
                      </div>
                      <div className="bg-slate-900/45 p-2.5 rounded-xl border border-slate-900">
                        <span className="text-slate-505 block uppercase text-[8px]">PRIORITY</span>
                        <span className={`font-extrabold block text-xs ${isPremiumEmergency ? "text-red-500" : "text-amber-500"}`}>
                          {isPremiumEmergency ? "PREMIUM SOS" : "STANDARD"}
                        </span>
                      </div>
                      <div className="bg-slate-900/40 p-2.5 rounded-xl border border-slate-900">
                        <span className="text-slate-505 block uppercase text-[8px]">FACILITY TARGET</span>
                        <span className="text-slate-200 font-bold block truncate text-xs" title={selectedHospital?.name}>
                          {selectedHospital?.name || "STANDBY"}
                        </span>
                      </div>
                      <div className="bg-slate-900/40 p-2.5 rounded-xl border border-slate-905">
                        <span className="text-slate-505 block uppercase text-[8px]">RADAR STATUS</span>
                        <span className={`font-black block uppercase text-[11px] ${dispatchStatus !== "IDLE" ? "text-emerald-405 animate-pulse" : "text-slate-650"}`}>
                          {dispatchStatus}
                        </span>
                      </div>
                      <div className="bg-slate-900/40 p-2.5 rounded-xl border border-slate-900">
                        <span className="text-slate-505 block uppercase text-[8px]">DISPATCH TIME</span>
                        <span className="text-slate-205 font-bold block text-xs">
                          {activePatient ? (isPremiumEmergency ? "10:24:10 AM" : "10:24:05 AM") : "STANDBY"}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center px-1">
                        <h3 className="text-xs font-mono font-black text-rose-500 flex items-center gap-1.5 uppercase tracking-wider">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                          Live Command Map Tracking Radar
                        </h3>
                        <span className="text-[9px] font-mono text-slate-500 uppercase">Interactive Leaflet Node</span>
                      </div>
                      <MapSimulation
                        status={dispatchStatus}
                        currentAddress={patientAddress}
                        ambulance={assignedAmbulance}
                        hospital={selectedHospital}
                        searchingAmbulances={searchingAmbulances}
                        onArrivedAtPatient={handleAmbulanceArrival}
                        onRouteCompleted={handleAmbulanceHospitalArrival}
                        onSelectAmbulance={handleSelectAmbulance}
                        isPremiumEmergency={isPremiumEmergency}
                      />
                    </div>

                    {/* Active Patient Vitals HUD Analyser displaying in place of Emergency Response */}
                    {dispatchStatus !== "IDLE" && dispatchStatus !== "SCANNING" && (
                      <div className="pt-2">
                        <VitalsMonitor status={dispatchStatus} isPremium={isPremiumEmergency} />
                      </div>
                    )}

                  </div>

                </div>
              ) : (
                
                /* FLOW PHASE 2: PATIENT PROFILE ACTIVE -> UNLOCKED EMERGENCY COMMAND CENTER */
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    
                    {/* LEFT AREA: Live Visual Dispatch Map & Hospital Smart Select (now wide inside order-2 on the right) */}
                    <div className="lg:col-span-8 lg:order-2 space-y-6">
                      
                      {/* Sub-Section 2A: Main Map tracking Canvas overlay */}
                      <div className="space-y-2">
                        <h3 className="text-xs font-mono font-black text-rose-500 flex items-center gap-1.5 uppercase tracking-wider">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                          Live Paramedic Navigation HUD
                        </h3>
                        <MapSimulation
                          status={dispatchStatus}
                          currentAddress={patientAddress}
                          ambulance={assignedAmbulance}
                          hospital={selectedHospital}
                          searchingAmbulances={searchingAmbulances}
                          onArrivedAtPatient={handleAmbulanceArrival}
                          onRouteCompleted={handleAmbulanceHospitalArrival}
                          onSelectAmbulance={handleSelectAmbulance}
                          isPremiumEmergency={isPremiumEmergency}
                        />
                      </div>

                      {/* Sub-Section 2B: Core Arrival Trigger Alert & SOS Pulsing system center focus */}
                      {dispatchStatus === "IDLE" && (
                        <div className="bg-slate-950/60 backdrop-blur-md border border-slate-800 p-5 rounded-2xl text-center space-y-4 relative overflow-hidden">
                          {/* Pulsing glow halos behind SOS */}
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="w-24 h-24 bg-red-600/10 rounded-full blur-xl animate-pulse" />
                          </div>

                          <div className="space-y-1 relative">
                            <h4 className="text-sm font-black font-sans text-slate-100 uppercase tracking-wider">
                              ACTIVATE AUTO-PRIORITY SOS DISPATCH
                            </h4>
                          </div>

                          {/* Giant pulsing glowing red SOS button - sized small */}
                          <button
                            id="glowing-sos-button"
                            onClick={handleSOSTrigger}
                            className="relative w-20 h-20 mx-auto rounded-full bg-gradient-to-b from-red-500 to-red-800 border-4 border-red-400 select-none cursor-pointer flex flex-col items-center justify-center shadow-[0_0_25px_rgba(239,68,68,0.6)] hover:scale-105 active:scale-95 transition-all outline-none duration-100 group"
                          >
                            {/* Visual heartbeat ripple borders */}
                            <span className="absolute inset-[-4px] rounded-full border border-red-500/40 animate-ping opacity-75" />
                            <span className="absolute inset-[-10px] rounded-full border border-red-500/20 animate-ping opacity-50 pointer-events-none" />

                            <Siren className="w-5 h-5 text-white mb-1 animate-pulse" />
                            <span className="text-base font-black text-white tracking-wider font-mono select-none leading-none">
                              SOS
                            </span>
                            <span className="text-[7px] font-mono font-bold text-red-200 mt-0.5 uppercase tracking-wider leading-none">
                              PULSE ACTIVE
                            </span>
                          </button>

                          <div className="text-[9px] text-slate-500 font-mono flex items-center justify-center gap-4">
                            <span>GPS: lat: 200, lng: 220</span>
                            <span>Target: {selectedHospital.name}</span>
                          </div>
                        </div>
                      )}

                      {/* SCANNING HOLOGRAM SATELLITE RADAR LOADER CARD */}
                      {dispatchStatus === "SCANNING" && (
                        <div className="bg-slate-950/85 border border-slate-800 p-8 rounded-3xl text-center space-y-6 relative overflow-hidden shadow-[0_0_30px_rgba(16,185,129,0.15)]">
                          {/* Pulsing light rings */}
                          <div className="absolute inset-0 bg-gradient-to-tr from-emerald-950/20 via-transparent to-teal-950/10 animate-pulse" />
                          
                          <div className="space-y-2.5 relative">
                            <h4 className="text-base font-extrabold font-sans text-emerald-400 tracking-wider flex items-center justify-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-emerald-505 animate-ping" />
                              SATELLITE EMERGENCY RADAR ACTIVE
                            </h4>
                            <p className="text-xs text-slate-400 font-mono">
                              Pinging local responder nodes & calculating real-time ICU bed balanced routings...
                            </p>
                          </div>

                          {/* Beautiful progress status bar node */}
                          <div className="relative max-w-md mx-auto h-2 bg-slate-900 border border-slate-800/80 rounded-full overflow-hidden">
                            <div 
                              className="absolute top-0 left-0 bottom-0 bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-100 ease-out"
                              style={{ width: `${scanProgress}%` }}
                            />
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 text-left font-mono text-[10px] text-slate-400 max-w-lg mx-auto relative z-10 font-sans">
                            <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-850">
                              <span className="text-slate-500 block uppercase">Signal Sync</span>
                              <span className="text-emerald-400 font-bold">{scanProgress > 25 ? "✓ SECURE" : "PENDING..."}</span>
                            </div>
                            <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-850">
                              <span className="text-slate-500 block uppercase">Sat Lock</span>
                              <span className="text-emerald-400 font-bold">{scanProgress > 50 ? "✓ LOCKED (4)" : "SCANNING..."}</span>
                            </div>
                            <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-850">
                              <span className="text-slate-500 block uppercase">ICU Reserves</span>
                              <span className="text-emerald-400 font-bold">{scanProgress > 75 ? "✓ CHOSEN" : "QUERYING..."}</span>
                            </div>
                            <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-850">
                              <span className="text-slate-550 block uppercase">Triangulation</span>
                              <span className="text-teal-400 font-bold">{scanProgress.toFixed(0)}%</span>
                            </div>
                          </div>

                          <div className="text-[9px] text-slate-500 font-mono flex items-center justify-center gap-3">
                            <span>GRID BLOCK: Sector 9 High-velocity</span>
                            <span>BANDWIDTH: 824.5 MHz</span>
                          </div>
                        </div>
                      )}

                      {/* DISPATCHED & EN ROUTE KEY TELEMETRY */}
                      {dispatchStatus === "DISPATCHED" && assignedAmbulance && (
                        <div className="bg-rose-950/20 border-2 border-red-500/50 p-6 rounded-3xl space-y-4 animate-pulse shadow-xl">
                          <div className="flex gap-4 items-center">
                            <div className="p-3 bg-red-650 rounded-2xl text-white">
                              <Siren className="w-6 h-6 animate-pulse" />
                            </div>
                            <div className="space-y-1">
                              <h4 className="text-base font-extrabold text-red-400 uppercase font-sans tracking-wide">
                                🚨 PARAMEDIC UNIT EN ROUTE
                              </h4>
                              <p className="text-xs text-slate-350">
                                Emergency responder vehicle <span className="font-mono font-black text-red-400 bg-red-950/50 border border-red-900/40 px-2 py-0.5 rounded-md">{assignedAmbulance.plateNumber}</span> has been dispatched. The medical crew is navigating the dynamic traffic route coordinates to your address.
                              </p>
                            </div>
                          </div>

                          <div className="bg-slate-950/80 border border-slate-800 p-3.5 rounded-xl text-xs font-mono grid grid-cols-2 md:grid-cols-4 gap-3">
                            <div>
                              <span className="text-slate-500 block text-[9px] uppercase">LANE RESPONDER</span>
                              <span className="text-slate-200 font-bold block">{assignedAmbulance.driverName}</span>
                            </div>
                            <div>
                              <span className="text-slate-500 block text-[9px] uppercase">CAR REGISTRATION</span>
                              <span className="text-yellow-450 font-bold block">{assignedAmbulance.plateNumber}</span>
                            </div>
                            <div>
                              <span className="text-slate-500 block text-[9px] uppercase">PHONE NO (CONTACT)</span>
                              <span className="text-emerald-405 font-bold block">{assignedAmbulance.driverPhone}</span>
                            </div>
                            <div>
                              <span className="text-slate-500 block text-[9px] uppercase">ESTIMATED TRANSIT</span>
                              <span className="text-emerald-400 font-bold block animate-pulse">~2 MINS (ACTIVE PATH)</span>
                            </div>
                          </div>

                          <div className="text-[10px] text-slate-400 font-mono flex items-center justify-between px-1">
                            <span className="flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping inline-block" />
                              Telemetry Syncing: ACTIVE
                            </span>
                            <span>ETA countdown runs dynamically on GPS map simulation.</span>
                          </div>
                        </div>
                      )}

                      {/* ARRIVED AT USER MESSAGE BANNER WITH CONFIRM WORKFLOW */}
                      {dispatchStatus === "ARRIVED_AT_PATIENT" && assignedAmbulance && (
                        <div className="bg-yellow-950/20 border-2 border-yellow-500/50 p-6 rounded-3xl animate-shake space-y-4 shadow-xl">
                          <div className="flex gap-4 items-center">
                            <div className="p-3 bg-yellow-500 rounded-2xl text-black">
                              <Siren className="w-6 h-6" />
                            </div>
                            <div className="space-y-1">
                              <h4 className="text-base font-bold text-yellow-550 uppercase font-sans">
                                🚑 Ambulance has arrived at your location
                              </h4>
                              <p className="text-xs text-slate-300">
                                Unit <span className="font-mono font-bold text-yellow-400">{assignedAmbulance.plateNumber}</span> driven by{" "}
                                <span className="font-bold text-white">{assignedAmbulance.driverName}</span> has safely pulled into coordinates.
                              </p>
                            </div>
                          </div>

                          <div className="bg-slate-950/80 border border-slate-800 p-3.5 rounded-xl text-xs font-mono grid grid-cols-2 md:grid-cols-4 gap-3">
                            <div>
                              <span className="text-slate-500 block text-[9px] uppercase">Plate Number</span>
                              <span className="text-yellow-400 font-bold">{assignedAmbulance.plateNumber}</span>
                            </div>
                            <div>
                              <span className="text-slate-500 block text-[9px] uppercase">Lead Paramedic</span>
                              <span className="text-slate-200 font-bold">{assignedAmbulance.driverName}</span>
                            </div>
                            <div>
                              <span className="text-slate-500 block text-[9px] uppercase">Driver Phone</span>
                              <span className="text-emerald-405 font-bold">{assignedAmbulance.driverPhone}</span>
                            </div>
                            <div>
                              <span className="text-slate-500 block text-[9px] uppercase">ETA Status</span>
                              <span className="text-emerald-400 font-bold font-sans">Arrived + Cleared</span>
                            </div>
                          </div>

                          <div className="flex flex-col sm:flex-row gap-3">
                            <button
                              onClick={handleConfirmArrival}
                              className="flex-1 py-3.5 bg-yellow-500 hover:bg-yellow-400 text-black text-xs font-bold rounded-2xl tracking-wider transition-all shadow-[0_4px_15px_rgba(234,179,8,0.3)] block uppercase cursor-pointer text-center font-sans border border-yellow-400/20"
                            >
                              ✔ Confirm Ambulance Arrival & Start Clinical Navigation
                            </button>
                            <button
                              onClick={() => setIsSoundOff(!isSoundOff)}
                              className={`px-4 py-3.5 rounded-2xl text-xs font-bold tracking-wider font-sans border transition-all cursor-pointer ${
                                isSoundOff 
                                  ? "bg-slate-800 border-slate-700 text-slate-400 hover:text-white font-black"
                                  : "bg-red-950/40 border-red-900/60 text-red-500 hover:bg-red-900/40 font-black animate-pulse"
                              }`}
                            >
                              {isSoundOff ? "🔈 Siren Off" : "🔇 Mute Siren"}
                            </button>
                          </div>
                        </div>
                      )}

                      {/* EN ROUTE TO HOSPITAL MESSAGE */}
                      {(dispatchStatus === "CONFIRMED_ARRIVAL" || dispatchStatus === "EN_ROUTE_TO_HOSPITAL") && (
                        <div className="bg-blue-950/20 border-2 border-blue-500/50 p-6 rounded-3xl space-y-4 animate-pulse">
                          <div className="flex gap-4 items-center">
                            <div className="p-3 bg-blue-600 rounded-2xl text-white">
                              <HospitalIcon className="w-6 h-6" />
                            </div>
                            <div className="space-y-1">
                              <h4 className="text-base font-bold text-blue-400 uppercase font-sans">
                                🏥 Clinical Navigation Engaged to Hospital
                              </h4>
                              <p className="text-xs text-slate-355">
                                Trapping trauma incident coordinates. Transporting path to{" "}
                                <span className="font-bold text-white">{selectedHospital.name}</span>. ICU bay reserves activated.
                              </p>
                            </div>
                          </div>

                          <div className="bg-slate-950/80 border border-slate-800 p-3.5 rounded-xl text-xs font-mono grid grid-cols-2 md:grid-cols-4 gap-3">
                            <div>
                              <span className="text-slate-500 block text-[9px] uppercase">Destination Hospital</span>
                              <span className="text-blue-400 font-bold truncate block">{selectedHospital.name}</span>
                            </div>
                            <div>
                              <span className="text-slate-500 block text-[9px] uppercase">Doctor on duty</span>
                              <span className="text-slate-200 font-bold">{selectedHospital.onDutyDoctor}</span>
                            </div>
                            <div>
                              <span className="text-slate-500 block text-[9px] uppercase">Assigned Room</span>
                              <span className="text-slate-200 font-bold">{selectedHospital.assignedRoom}</span>
                            </div>
                            <div>
                              <span className="text-slate-500 block text-[9px] uppercase">Transit Distance</span>
                              <span className="text-amber-500 font-bold">{selectedHospital.distanceKm} km (Longroute)</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* ARRIVED AT HOSPITAL PAYMENT SETTLEMENT CHECKOUT */}
                      {dispatchStatus === "ARRIVED_AT_HOSPITAL" && activePatient && assignedAmbulance && (
                        <div className="bg-slate-950 border-2 border-amber-500/50 p-6 md:p-8 rounded-3xl space-y-6 shadow-2xl animate-fade-in relative overflow-hidden">
                          <div className="absolute top-0 left-0 right-0 h-[3.5px] bg-gradient-to-r from-amber-500 via-rose-500 to-red-500" />
                          
                          <div className="flex gap-4 items-center border-b border-slate-800 pb-4">
                            <div className="p-3 bg-amber-950/40 border border-amber-500/30 rounded-2xl text-amber-500 animate-pulse">
                              <DollarSign className="w-6 h-6" />
                            </div>
                            <div>
                              <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-widest block">AMBULANCE DISPATCH MILEAGE TARIFF</span>
                              <h4 className="text-base md:text-lg font-bold font-sans text-slate-100 uppercase">
                                💳 Secure Fare Payment Settlement
                              </h4>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Fare Details calculation box */}
                            <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-850 space-y-3 flex flex-col justify-between">
                              <div className="space-y-3">
                                <h5 className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Fare Calculation breakdown</h5>
                                
                                <div className="space-y-2 text-xs">
                                  <div className="flex justify-between text-slate-305">
                                    <span className="text-slate-400">Base Emergency Service Rate:</span>
                                    <span className="font-mono font-bold text-slate-200">Rs. {generatedSlip?.baseFare.toFixed(2) || (isPremiumEmergency ? "5000.00" : "1500.00")}</span>
                                  </div>
                                  <div className="flex justify-between text-slate-305">
                                    <span className="text-slate-400">GPS Mileage Distance:</span>
                                    <span className="font-mono font-bold text-amber-400">{selectedHospital.distanceKm} km</span>
                                  </div>
                                  <div className="flex justify-between text-slate-305">
                                    <span className="text-slate-400">GPS Mileage Tariff ({isPremiumEmergency ? "Premium Rs. 500/km" : "Rs. 250/km"}):</span>
                                    <span className="font-mono font-bold text-slate-200">Rs. {generatedSlip?.distanceFare.toFixed(2)}</span>
                                  </div>
                                  
                                  <div className="border-t border-slate-800/85 pt-3.5 flex justify-between text-slate-100 font-extrabold text-sm">
                                    <span>TOTAL FARE OUTSTANDING:</span>
                                    <span className="font-mono text-emerald-405 font-black text-rose-400 text-base">
                                      Rs. {generatedSlip?.totalAmount.toFixed(2)}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-xl text-[10px] text-slate-400 font-mono space-y-1">
                                <div><span className="text-slate-550 uppercase">Patient Name: </span><span className="text-slate-200">{activePatient.name}</span></div>
                                <div><span className="text-slate-550 uppercase">Emergency Category: </span><span className="text-red-400">{activePatient.emergencyType}</span></div>
                                <div><span className="text-slate-550 uppercase">Transit Destination: </span><span className="text-blue-400 truncate block md:inline">{selectedHospital.name}</span></div>
                              </div>
                            </div>

                            {/* Payment checkout form or billing receipt */}
                            {!paymentSuccess ? (
                              <div className="space-y-4">
                                <h5 className="text-[11px] font-mono text-amber-400 uppercase tracking-widest">Select Online Payment Method</h5>
                                
                                {/* Tabs for Online Payment Methods */}
                                <div className="grid grid-cols-4 gap-1.5 bg-slate-900/60 p-2 rounded-2xl border border-slate-800">
                                  <button
                                    type="button"
                                    onClick={() => setSelectedPaymentMethod("CREDIT_CARD")}
                                    className={`py-3 px-1 text-[10px] font-extrabold rounded-xl transition-all flex flex-col items-center gap-1.5 cursor-pointer ${
                                      selectedPaymentMethod === "CREDIT_CARD"
                                        ? "bg-slate-800 text-blue-400 border border-blue-500/55 shadow-[0_0_15px_rgba(37,99,235,0.25)]"
                                        : "text-slate-400 hover:text-white hover:bg-slate-800/40 border border-transparent"
                                    }`}
                                  >
                                    <CreditCard className="w-4 h-4 text-blue-400" />
                                    <span>Card</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setSelectedPaymentMethod("EASYPAISA")}
                                    className={`py-3 px-1 text-[10px] font-extrabold rounded-xl transition-all flex flex-col items-center gap-1.5 cursor-pointer ${
                                      selectedPaymentMethod === "EASYPAISA"
                                        ? "bg-slate-800 text-emerald-400 border border-emerald-500/55 shadow-[0_0_15px_rgba(16,185,129,0.25)]"
                                        : "text-slate-400 hover:text-white hover:bg-slate-800/40 border border-transparent"
                                    }`}
                                  >
                                    <span className="w-5 h-5 bg-emerald-950 font-black text-[9px] text-emerald-400 flex items-center justify-center rounded-full border border-emerald-500/40">EP</span>
                                    <span>Easypaisa</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setSelectedPaymentMethod("JAZZCASH")}
                                    className={`py-3 px-1 text-[10px] font-extrabold rounded-xl transition-all flex flex-col items-center gap-1.5 cursor-pointer ${
                                      selectedPaymentMethod === "JAZZCASH"
                                        ? "bg-slate-800 text-amber-400 border border-yellow-500/55 shadow-[0_0_15px_rgba(245,158,11,0.25)]"
                                        : "text-slate-400 hover:text-white hover:bg-slate-800/40 border border-transparent"
                                    }`}
                                  >
                                    <span className="w-5 h-5 bg-yellow-950 font-black text-[9px] text-amber-500 flex items-center justify-center rounded-full border border-yellow-500/40">JC</span>
                                    <span>JazzCash</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setSelectedPaymentMethod("SADAPAY")}
                                    className={`py-3 px-1 text-[10px] font-extrabold rounded-xl transition-all flex flex-col items-center gap-1.5 cursor-pointer ${
                                      selectedPaymentMethod === "SADAPAY"
                                        ? "bg-slate-800 text-cyan-400 border border-cyan-500/55 shadow-[0_0_15px_rgba(6,182,212,0.25)]"
                                        : "text-slate-400 hover:text-white hover:bg-slate-800/40 border border-transparent"
                                    }`}
                                  >
                                    <span className="w-5 h-5 bg-teal-950 font-black text-[9px] text-cyan-400 flex items-center justify-center rounded-full border border-cyan-505/40">SP</span>
                                    <span>SadaPay</span>
                                  </button>
                                </div>

                                <form 
                                  onSubmit={(e) => {
                                    e.preventDefault();
                                    setIsPaying(true);
                                    setTimeout(() => {
                                      setIsPaying(false);
                                      setPaymentSuccess(true);
                                    }, 1800);
                                  }}
                                  className="space-y-4"
                                >
                                  {/* Dynamic Fields according to payment type */}
                                  {selectedPaymentMethod === "CREDIT_CARD" && (
                                    <div className="space-y-3 animate-fade-in">
                                      <div className="space-y-1">
                                        <label className="text-[9px] font-mono text-slate-500 uppercase block font-bold">Cardholder Name</label>
                                        <input
                                          type="text"
                                          required={selectedPaymentMethod === "CREDIT_CARD"}
                                          placeholder="Samiuddin Ahmed"
                                          value={paymentForm.cardName}
                                          onChange={(e) => setPaymentForm({ ...paymentForm, cardName: e.target.value })}
                                          className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-800 rounded-xl text-slate-205 focus:outline-none focus:border-amber-500 placeholder-slate-600 transition-all"
                                        />
                                      </div>

                                      <div className="space-y-1">
                                        <label className="text-[9px] font-mono text-slate-505 uppercase block font-bold">Secure Credit Card Number</label>
                                        <input
                                          type="text"
                                          required={selectedPaymentMethod === "CREDIT_CARD"}
                                          placeholder="4111 2222 3333 4444"
                                          maxLength={19}
                                          value={paymentForm.cardNumber}
                                          onChange={(e) => {
                                            let val = e.target.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
                                            let parts = [];
                                            for (let i = 0; i < val.length; i += 4) {
                                              parts.push(val.substring(i, i + 4));
                                            }
                                            setPaymentForm({ ...paymentForm, cardNumber: parts.join(' ') });
                                          }}
                                          className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-800 rounded-xl text-slate-205 font-mono focus:outline-none focus:border-amber-500 placeholder-slate-600 transition-all"
                                        />
                                      </div>

                                      <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                          <label className="text-[9px] font-mono text-slate-505 uppercase block font-bold">Expiry Date</label>
                                          <input
                                            type="text"
                                            required={selectedPaymentMethod === "CREDIT_CARD"}
                                            maxLength={5}
                                            placeholder="MM/YY"
                                            value={paymentForm.cardExpiry}
                                            onChange={(e) => {
                                              let val = e.target.value.replace(/[^0-9]/g, '');
                                              if (val.length >= 2) {
                                                val = val.substring(0, 2) + '/' + val.substring(2, 4);
                                              }
                                              setPaymentForm({ ...paymentForm, cardExpiry: val });
                                            }}
                                            className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-800 rounded-xl text-slate-205 text-center font-mono focus:outline-none focus:border-amber-500 placeholder-slate-600 transition-all"
                                          />
                                        </div>
                                        <div className="space-y-1">
                                          <label className="text-[9px] font-mono text-slate-505 uppercase block font-bold">CVV Code</label>
                                          <input
                                            type="password"
                                            required={selectedPaymentMethod === "CREDIT_CARD"}
                                            maxLength={3}
                                            placeholder="***"
                                            value={paymentForm.cardCVV}
                                            onChange={(e) => setPaymentForm({ ...paymentForm, cardCVV: e.target.value.replace(/[^0-9]/g, '') })}
                                            className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-800 rounded-xl text-slate-205 text-center font-mono focus:outline-none focus:border-amber-500 placeholder-slate-600 transition-all"
                                          />
                                        </div>
                                      </div>
                                    </div>
                                  )}

                                  {selectedPaymentMethod === "EASYPAISA" && (
                                    <div className="space-y-3 animate-fade-in border-l-2 border-emerald-500 pl-3">
                                      <div className="space-y-1">
                                        <label className="text-[9px] font-mono text-emerald-450 uppercase block font-bold">Easypaisa Mobile Number (Pakistan)</label>
                                        <input
                                          type="tel"
                                          required={selectedPaymentMethod === "EASYPAISA"}
                                          placeholder="03001234567"
                                          maxLength={11}
                                          value={paymentForm.walletNumber}
                                          onChange={(e) => setPaymentForm({ ...paymentForm, walletNumber: e.target.value.replace(/[^0-9]/g, '') })}
                                          className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-800 rounded-xl text-slate-200 font-mono focus:outline-none focus:border-emerald-500 placeholder-slate-600"
                                        />
                                      </div>

                                      <div className="space-y-1">
                                        <label className="text-[9px] font-mono text-slate-400 uppercase block font-bold">Registered Account Name</label>
                                        <input
                                          type="text"
                                          required={selectedPaymentMethod === "EASYPAISA"}
                                          placeholder="Samiuddin Ahmed"
                                          value={paymentForm.walletName}
                                          onChange={(e) => setPaymentForm({ ...paymentForm, walletName: e.target.value })}
                                          className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-emerald-500 placeholder-slate-600"
                                        />
                                      </div>

                                      <div className="space-y-1">
                                        <label className="text-[9px] font-mono text-slate-500 uppercase block font-bold">5-Digit Secure Wallet PIN</label>
                                        <input
                                          type="password"
                                          required={selectedPaymentMethod === "EASYPAISA"}
                                          placeholder="•••••"
                                          maxLength={5}
                                          value={paymentForm.walletPin}
                                          onChange={(e) => setPaymentForm({ ...paymentForm, walletPin: e.target.value.replace(/[^0-9]/g, '') })}
                                          className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-800 rounded-xl text-slate-200 text-center font-mono tracking-widest focus:outline-none focus:border-emerald-500 placeholder-slate-600"
                                        />
                                      </div>
                                    </div>
                                  )}

                                  {selectedPaymentMethod === "JAZZCASH" && (
                                    <div className="space-y-3 animate-fade-in border-l-2 border-amber-500 pl-3">
                                      <div className="space-y-1">
                                        <label className="text-[9px] font-mono text-amber-500 uppercase block font-bold">JazzCash Mobile Number (Pakistan)</label>
                                        <input
                                          type="tel"
                                          required={selectedPaymentMethod === "JAZZCASH"}
                                          placeholder="03011234567"
                                          maxLength={11}
                                          value={paymentForm.walletNumber}
                                          onChange={(e) => setPaymentForm({ ...paymentForm, walletNumber: e.target.value.replace(/[^0-9]/g, '') })}
                                          className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-800 rounded-xl text-slate-200 font-mono focus:outline-none focus:border-amber-500 placeholder-slate-600"
                                        />
                                      </div>

                                      <div className="space-y-1">
                                        <label className="text-[9px] font-mono text-slate-400 uppercase block font-bold">Account Title Holder Name</label>
                                        <input
                                          type="text"
                                          required={selectedPaymentMethod === "JAZZCASH"}
                                          placeholder="Samiuddin Ahmed"
                                          value={paymentForm.walletName}
                                          onChange={(e) => setPaymentForm({ ...paymentForm, walletName: e.target.value })}
                                          className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-800 rounded-xl text-slate-205 focus:outline-none focus:border-amber-500 placeholder-slate-600"
                                        />
                                      </div>

                                      <div className="space-y-1">
                                        <label className="text-[9px] font-mono text-slate-500 uppercase block font-bold">4-Digit Wallet Secure MPIN</label>
                                        <input
                                          type="password"
                                          required={selectedPaymentMethod === "JAZZCASH"}
                                          placeholder="••••"
                                          maxLength={4}
                                          value={paymentForm.walletPin}
                                          onChange={(e) => setPaymentForm({ ...paymentForm, walletPin: e.target.value.replace(/[^0-9]/g, '') })}
                                          className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-800 rounded-xl text-slate-205 text-center font-mono tracking-widest focus:outline-none focus:border-amber-500 placeholder-slate-600"
                                        />
                                      </div>
                                    </div>
                                  )}

                                  {selectedPaymentMethod === "SADAPAY" && (
                                    <div className="space-y-3 animate-fade-in border-l-2 border-teal-500 pl-3">
                                      <div className="space-y-1">
                                        <label className="text-[9px] font-mono text-teal-400 uppercase block font-bold">SadaPay Registered Mobile Number</label>
                                        <input
                                          type="tel"
                                          required={selectedPaymentMethod === "SADAPAY"}
                                          placeholder="03331234567"
                                          maxLength={11}
                                          value={paymentForm.walletNumber}
                                          onChange={(e) => setPaymentForm({ ...paymentForm, walletNumber: e.target.value.replace(/[^0-9]/g, '') })}
                                          className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-800 rounded-xl text-slate-205 font-mono focus:outline-none focus:border-teal-500 placeholder-slate-600"
                                        />
                                      </div>

                                      <div className="space-y-1">
                                        <label className="text-[9px] font-mono text-slate-400 uppercase block font-bold">Full Name on SadaPay</label>
                                        <input
                                          type="text"
                                          required={selectedPaymentMethod === "SADAPAY"}
                                          placeholder="Samiuddin Ahmed"
                                          value={paymentForm.walletName}
                                          onChange={(e) => setPaymentForm({ ...paymentForm, walletName: e.target.value })}
                                          className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-800 rounded-xl text-slate-205 focus:outline-none focus:border-teal-500 placeholder-slate-600"
                                        />
                                      </div>

                                      <div className="space-y-1">
                                        <label className="text-[9px] font-mono text-slate-500 uppercase block font-bold">SadaPay Secure Passcode</label>
                                        <input
                                          type="password"
                                          required={selectedPaymentMethod === "SADAPAY"}
                                          placeholder="••••"
                                          maxLength={4}
                                          value={paymentForm.walletPin}
                                          onChange={(e) => setPaymentForm({ ...paymentForm, walletPin: e.target.value.replace(/[^0-9]/g, '') })}
                                          className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-800 rounded-xl text-slate-205 text-center font-mono tracking-widest focus:outline-none focus:border-teal-500 placeholder-slate-600"
                                        />
                                      </div>
                                    </div>
                                  )}

                                  <button
                                    type="submit"
                                    disabled={isPaying}
                                    className="w-full mt-3 py-3 bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-black font-black text-xs rounded-2xl tracking-wider uppercase transition-all shadow-[0_4px_15px_rgba(245,158,11,0.2)] cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 border border-amber-500/20"
                                  >
                                    {isPaying ? (
                                      <>
                                        <span className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin inline-block" />
                                        <span>SECURELY AUTHORIZING WITH {selectedPaymentMethod.replace("_", " ")} GATEWAY...</span>
                                      </>
                                    ) : (
                                      <>
                                        <CreditCard className="w-4 h-4" />
                                        <span>CONFIRM & PAY FARE: Rs. {generatedSlip?.totalAmount.toFixed(2)}</span>
                                      </>
                                    )}
                                  </button>
                                </form>
                              </div>
                            ) : (
                              /* PRINTABLE RECEIPT / SLIP CONTAINER ON SUCCESSFUL PAYMENT */
                              <div className="bg-slate-900/90 border-2 border-emerald-500 p-5 rounded-2xl space-y-4 relative select-text font-mono text-[11px] text-slate-300">
                                <div className="absolute top-2 right-2 bg-emerald-950/60 border border-emerald-800 text-emerald-400 px-2.5 py-1 rounded-xl text-[9px] font-bold uppercase tracking-wider flex items-center gap-1.5 animate-pulse">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-ping"></span>
                                  ✓ PAID SUCCESSFUL
                                </div>

                                <div className="border-b border-dashed border-slate-800 pb-3">
                                  <h6 className="text-emerald-400 font-extrabold text-xs uppercase text-center tracking-widest">OFFICIAL TRANSACTION RECEIPT</h6>
                                  <p className="text-[9px] text-slate-500 text-center mt-1">SWIFTRESCUE DISPATCH CORPS — PAKISTAN</p>
                                </div>

                                <div className="space-y-1.5">
                                  <div className="flex justify-between font-sans">
                                    <span className="text-slate-500 font-mono text-[10px]">PAYMENT ROUTELINE:</span>
                                    <span className="text-slate-200 font-bold font-mono text-[10px]">
                                      {selectedPaymentMethod === "CREDIT_CARD" && "💳 Credit / Debit Card Gate"}
                                      {selectedPaymentMethod === "EASYPAISA" && "🟢 Easypaisa Mobile Wallet"}
                                      {selectedPaymentMethod === "JAZZCASH" && "🟡 JazzCash Mobile Money"}
                                      {selectedPaymentMethod === "SADAPAY" && "🔵 SadaPay Digital Account"}
                                    </span>
                                  </div>
                                  <div className="flex justify-between font-sans">
                                    <span className="text-slate-500 font-mono text-[10px]">INVOICE NO:</span>
                                    <span className="text-slate-200 font-bold font-mono text-[10px]">{generatedSlip?.invoiceId}</span>
                                  </div>
                                  <div className="flex justify-between font-sans">
                                    <span className="text-slate-500 font-mono text-[10px]">TRANSACTION ID:</span>
                                    <span className="text-amber-400 font-bold truncate max-w-[150px] font-mono text-[10px]">{generatedSlip?.transactionId}</span>
                                  </div>
                                  <div className="flex justify-between font-sans">
                                    <span className="text-slate-500 font-mono text-[10px]">TIMESTAMP:</span>
                                    <span className="text-slate-250 font-bold font-mono text-[10px]">{generatedSlip?.timestamp}</span>
                                  </div>
                                  <div className="flex justify-between gap-1 border-y border-slate-850 py-2.5 my-2.5">
                                    <span className="text-slate-500 block text-[10px]">ACCOUNT HOLDER:</span>
                                    <span className="text-white uppercase font-bold truncate max-w-[150px] text-[10px]">
                                      {selectedPaymentMethod === "CREDIT_CARD" ? (paymentForm.cardName || "Valued Customer") : (paymentForm.walletName || "Wallet User")}
                                    </span>
                                  </div>
                                  
                                  {/* Render Masked Account info */}
                                  <div className="flex justify-between font-sans">
                                    <span className="text-slate-500 font-mono text-[10px]">ACC / CARD REFERENCE:</span>
                                    <span className="text-slate-250 font-bold font-mono text-[10px]">
                                      {selectedPaymentMethod === "CREDIT_CARD" 
                                        ? `Card ending in **** ${paymentForm.cardNumber?.slice(-4) || '4242'}`
                                        : `Wallet (03${paymentForm.walletNumber ? paymentForm.walletNumber.slice(-4) : '******345'})`
                                      }
                                    </span>
                                  </div>

                                  <div className="space-y-1 pt-1">
                                    <div className="flex justify-between">
                                      <span className="text-slate-550 text-[10px]">Base Emergency Fee:</span>
                                      <span className="text-slate-350">Rs. {generatedSlip?.baseFare.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-slate-555 text-[10px]">GPS Mileage Surcharge:</span>
                                      <span className="text-slate-350">Rs. {generatedSlip?.distanceFare.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between border-t border-slate-800 pt-1.5 font-bold text-emerald-400">
                                      <span>TOTAL TARIFF PAID ONLINE:</span>
                                      <span className="text-sm font-black text-emerald-405">Rs. {generatedSlip?.totalAmount.toFixed(2)}</span>
                                    </div>
                                  </div>
                                </div>

                                <button
                                  onClick={() => {
                                    handleAdmittedHospital();
                                  }}
                                  className="w-full mt-3 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-md transition-all uppercase cursor-pointer text-center flex items-center justify-center gap-2 font-sans"
                                >
                                  <span>Admit Patient inside Destination ER Ward Room</span>
                                  <ArrowRight className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* ADMITTED CLINICAL DISCHARGE WRAP-UP */}
                      {dispatchStatus === "ADMITTED" && (
                        <div className="bg-emerald-950/20 border-2 border-emerald-500/50 p-6 rounded-3xl space-y-4 font-sans">
                          <div className="flex gap-4 items-center">
                            <div className="p-3 bg-emerald-600 rounded-2xl text-white">
                              <UserCheck2 className="w-6 h-6" />
                            </div>
                            <div className="space-y-1 col-span-3">
                              <h4 className="text-base font-bold text-emerald-400 uppercase font-sans">
                                🎉 Patient Admitted & Fully Handled
                              </h4>
                              <p className="text-xs text-slate-300">
                                Incident complete of patient <span className="font-bold font-sans">{activePatient.name}</span>. Registered trauma profiles successfully synchronized inside core healthcare telemetry.
                              </p>
                            </div>
                          </div>

                          <button
                            onClick={handleStartNewEmergency}
                            className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-2xl shadow-lg transition-all tracking-wider block cursor-pointer text-center font-sans border border-emerald-500/30"
                          >
                            REGISTER NEW INTAKE CASE PATIENT
                          </button>
                        </div>
                      )}

                      {/* Hospital Smart Selection details panel */}
                      <div className="bg-slate-950 border border-slate-800 p-6 rounded-3xl space-y-4">
                        <div className="border-b border-slate-800/80 pb-3 flex justify-between items-center">
                          <div>
                            <span className="text-[10px] font-mono text-red-400 font-bold uppercase tracking-widest block">Active Destination Unit</span>
                            <h4 className="text-base font-bold text-slate-100 font-sans mt-0.5">Selected Hospital details</h4>
                          </div>
                          <span className="text-[11px] bg-slate-900 border border-slate-800 text-slate-400 px-2.5 py-0.5 rounded font-mono">
                            Auto Load Balance Active
                          </span>
                        </div>

                        {/* Hospital info details card */}
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
                          <div className="md:col-span-4 h-28 rounded-xl overflow-hidden border border-slate-800 relative bg-slate-905">
                            <img
                              src={selectedHospital.imageUrl}
                              alt={selectedHospital.name}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover opacity-80"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 to-transparent" />
                            <div className="absolute bottom-2 left-2 text-[9px] font-mono bg-slate-950 px-1.5 py-0.5 rounded animate-pulse">
                              SECURE PHOTO INTEGRITY
                            </div>
                          </div>

                          <div className="md:col-span-8 grid grid-cols-2 gap-4 font-sans text-xs">
                            <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-850">
                              <span className="text-slate-500 block text-[9px] font-mono uppercase">Hospital Facility</span>
                              <span className="text-slate-205 font-bold block mt-0.5">{selectedHospital.name}</span>
                            </div>
                            <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-850">
                              <span className="text-slate-500 block text-[9px] font-mono uppercase">Emergency Room Doctor</span>
                              <span className="text-red-400 font-bold block mt-0.5">{selectedHospital.onDutyDoctor}</span>
                            </div>
                            <div className="bg-slate-905 p-2.5 rounded-xl border border-slate-850">
                              <span className="text-slate-505 block text-[9px] font-mono uppercase">ICU Bed Chambers</span>
                              <span className="text-emerald-400 font-mono font-bold block mt-0.5">
                                {selectedHospital.availableIcuBeds} Beds vacant
                              </span>
                            </div>
                            <div className="bg-slate-905 p-2.5 rounded-xl border border-slate-850">
                              <span className="text-slate-505 block text-[9px] font-mono uppercase">Allotted Complex Ward</span>
                              <span className="text-slate-200 font-mono block mt-0.5">{selectedHospital.assignedRoom}</span>
                            </div>
                          </div>
                        </div>

                        {/* Interactive Hospital Search Selection List */}
                        {dispatchStatus === "IDLE" && (
                          <div className="pt-2">
                            <span className="text-[10px] font-mono text-slate-400 block mb-2">
                              Change Trauma hospital (Distance coordinates updates dynamically):
                            </span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {hospitals.map((h) => (
                                <button
                                  key={h.id}
                                  onClick={() => setSelectedHospital(h)}
                                  className={`p-2.5 rounded-xl border transition-all text-left flex justify-between items-center cursor-pointer ${
                                    selectedHospital.id === h.id
                                      ? "bg-red-950/20 border-red-500 text-white"
                                      : "bg-slate-900/60 border-slate-800 text-slate-450 hover:border-slate-700 hover:text-slate-200"
                                  }`}
                                >
                                  <div>
                                    <span className="text-xs font-bold block">{h.name}</span>
                                    <span className="text-[10px] text-slate-505 block">Doctor: {h.onDutyDoctor}</span>
                                  </div>
                                  <span className="text-[10px] font-mono bg-slate-950 px-1.5 py-0.5 rounded text-amber-500">
                                    {h.distanceKm} km
                                  </span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                    </div>

                  {/* RIGHT AREA: Chat Panel Advisory & Patient Trauma Profile details (now inside order-1 on the left) */}
                  <div className="lg:col-span-4 lg:order-1 space-y-6">
                    
                    {/* Active Patient detailed file wrapper */}
                    <div className="bg-slate-950 border border-slate-800 rounded-3xl p-5 space-y-4">
                      <div className="border-b border-slate-850 pb-3 flex justify-between items-center">
                        <h4 className="text-xs font-bold text-slate-200 uppercase flex items-center gap-1">
                          <ClipboardList className="w-4 h-4 text-red-500" />
                          Clinical intake Sheet
                        </h4>
                        <span className="text-[9px] font-mono bg-rose-950 border border-rose-900/40 text-rose-400 px-1.5 py-0.5 rounded">
                          ACTIVE DOSSIER
                        </span>
                      </div>

                      <div className="space-y-3 font-sans text-xs">
                        <div className="grid grid-cols-2 gap-2">
                          <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-850">
                            <span className="text-slate-505 block text-[9px] font-mono uppercase">Full Name</span>
                            <span className="font-bold text-slate-200">{activePatient.name}</span>
                          </div>
                          <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-850">
                            <span className="text-slate-505 block text-[9px] font-mono uppercase">Age Indicator</span>
                            <span className="font-bold text-slate-200">{activePatient.age} yrs</span>
                          </div>
                          <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-850">
                            <span className="text-slate-505 block text-[9px] font-mono uppercase">Blood Group</span>
                            <span className="font-bold text-red-400 font-mono">{activePatient.bloodGroup}</span>
                          </div>
                          <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-850">
                            <span className="text-slate-505 block text-[9px] font-mono uppercase">Emergency Type</span>
                            <span className="font-bold text-slate-200">{activePatient.emergencyType}</span>
                          </div>
                        </div>

                        <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-850">
                          <span className="text-slate-500 block text-[9px] font-mono uppercase">GPS Address node</span>
                          <div className="flex gap-1 items-start mt-1">
                            <MapPin className="w-3.5 h-3.5 text-red-400 shrink-0" />
                            <span className="text-slate-300 font-mono text-[10px] leading-relaxed">{patientAddress}</span>
                          </div>
                        </div>

                        {activePatient.additionalNotes && (
                          <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-850">
                            <span className="text-slate-505 block text-[9px] font-mono uppercase">Incident Synopsis</span>
                            <span className="text-slate-305 block mt-1 italic">"{activePatient.additionalNotes}"</span>
                          </div>
                        )}

                        {/* Quick first aid guides based on emergency category */}
                          <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl space-y-2">
                            <span className="text-[10px] font-mono font-bold text-red-405 block uppercase tracking-wide">
                              CPR & FIRST AID ESSENTIAL CHECKLIST
                            </span>
                            <div className="space-y-1.5 pt-1">
                              {FIRST_AID_SUGGESTIONS[activePatient.emergencyType]?.map((s, idx) => (
                                <div key={idx} className="flex gap-2 items-start text-[11px] text-slate-300">
                                  <span className="text-red-500 shrink-0 text-sm leading-none">•</span>
                                  <span>{s}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Patient Vitals (Live) */}
                      <PatientVitalsCard status={dispatchStatus} isPremium={isPremiumEmergency} />

                      {/* Invoice Summary Section - Shown below Patient Vitals and above Hospital Capacity */}
                      <InvoiceSummarySection
                        isPremium={isPremiumEmergency}
                        generatedSlip={generatedSlip}
                        distanceKm={selectedHospital.distanceKm}
                        isPaid={paymentSuccess}
                      />

                      {/* Hospital Capacity Cards */}
                      <HospitalCapacityCard hospital={selectedHospital} />

                      {/* Chat with Driver - Shown below Hospital Capacity */}
                      {assignedAmbulance && (
                        <div id="driver-chat-card" className="bg-slate-950 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-2xl animate-fade-in text-left">
                          <div className="border-b border-slate-850 pb-3 flex justify-between items-center">
                            <h4 className="text-xs font-bold text-slate-200 uppercase flex items-center gap-1.5 font-sans">
                              <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse inline-block" />
                              Driver Chat: {assignedAmbulance.driverName}
                            </h4>
                            <span className="text-[9px] font-mono text-emerald-450 border border-emerald-900/50 bg-emerald-950/40 px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">
                              Live Contact
                            </span>
                          </div>

                          {/* Quick driver specifications holding phone */}
                          <div className="bg-slate-900/50 p-2.5 rounded-xl border border-slate-850/80 text-xs flex justify-between items-center text-slate-300">
                            <div>
                              <span className="text-[9.5px] font-mono text-slate-505 block">📞 CONTACT PHONE</span>
                              <span className="font-bold font-mono text-emerald-405">{assignedAmbulance.driverPhone}</span>
                            </div>
                            <a
                              href={`tel:${assignedAmbulance.driverPhone}`}
                              className="px-2.5 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-450 rounded-xl border border-emerald-500/20 text-[10px] font-semibold transition-colors flex items-center gap-1 cursor-pointer font-sans"
                            >
                              <span>📞 Call Driver</span>
                            </a>
                          </div>

                          {/* Chat Messages Log Area */}
                          <div className="h-44 overflow-y-auto space-y-2 border border-slate-900/40 bg-slate-900/20 p-3 rounded-2xl flex flex-col font-sans text-xs">
                            {driverChatMessages.map((msg) => (
                              <div
                                key={msg.id}
                                className={`flex flex-col ${
                                  msg.sender === "user" ? "items-end" : "items-start"
                                }`}
                              >
                                <div className="text-[8px] font-mono text-slate-505 mb-0.5 px-1.5">
                                  {msg.sender === "user" ? "Operator (You)" : `Paramedic: ${assignedAmbulance.driverName}`}
                                </div>
                                <div
                                  className={`max-w-[85%] rounded-2xl px-3 py-2 text-[11px] leading-relaxed shadow-sm ${
                                    msg.sender === "user"
                                      ? "bg-red-650 text-white rounded-tr-none"
                                      : "bg-slate-850 text-slate-200 border border-slate-800 rounded-tl-none"
                                  }`}
                                >
                                  {msg.text}
                                </div>
                                <span className="text-[8px] font-mono text-slate-600 mt-0.5 px-1.5">{msg.timestamp}</span>
                              </div>
                            ))}

                            {isDriverTyping && (
                              <div className="flex items-center gap-1 text-[10px] font-mono text-slate-400 italic pl-1 py-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce" />
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce delay-100" />
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce delay-200" />
                                <span>{assignedAmbulance.driverName} is typing...</span>
                              </div>
                            )}
                          </div>

                          {/* Suggested speed fast responses */}
                          <div className="flex flex-wrap gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleSendDriverChat("where are u and status?")}
                              className="text-[10px] bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-450 hover:text-white px-2 py-0.5 rounded-lg transition-all cursor-pointer font-mono"
                            >
                              📍 Where are you?
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSendDriverChat("how much time will it take?")}
                              className="text-[10px] bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-450 hover:text-white px-2 py-0.5 rounded-lg transition-all cursor-pointer font-mono"
                            >
                              ⏱ How much time?
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSendDriverChat("Emergency! Please hurry up!")}
                              className="text-[10px] bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-450 hover:text-white px-2 py-0.5 rounded-lg transition-all cursor-pointer font-mono"
                            >
                              ⚡ Please hurry!
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSendDriverChat("The patient is conscious and breathing.")}
                              className="text-[10px] bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-450 hover:text-white px-2 py-0.5 rounded-lg transition-all cursor-pointer font-mono"
                            >
                              🫁 Patient is conscious
                            </button>
                          </div>

                          {/* Input message box inside driver-chat-card */}
                          <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                handleSendDriverChat();
                            }}
                            className="flex gap-2"
                          >
                            <input
                              type="text"
                              required
                              value={driverChatInput}
                              onChange={(e) => setDriverChatInput(e.target.value)}
                              placeholder={`Type dispatch instructions...`}
                              className="flex-1 px-3 py-2 text-xs bg-slate-900 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-red-500 placeholder-slate-500 transition-all font-sans"
                            />
                            <button
                              type="submit"
                              className="px-3 bg-red-650 hover:bg-red-500 text-white rounded-xl border border-red-500/20 flex items-center justify-center transition-colors cursor-pointer"
                            >
                              <Send className="w-3.5 h-3.5" />
                            </button>
                          </form>
                        </div>
                      )}

                    </div>
                  </div>
                  )}

                </div>
              )}

            </div>
          )}

      </main>

      {/* FLOATING SUPPORT CHATBOT CUSTOMER GUIDE PANEL */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
        {supportOpen ? (
          <div className="w-80 md:w-96 h-[460px] bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-fade-in backdrop-blur-xl">
            {/* Chat header */}
            <div className="bg-red-950/45 border-b border-slate-800 p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
                <div>
                  <h4 className="text-xs font-bold text-slate-100 tracking-wide font-sans">SwiftRescue Platform Assistant</h4>
                  <span className="text-[9px] font-mono text-slate-400">Customer Support & User Guide</span>
                </div>
              </div>
              <button
                onClick={() => setSupportOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Chat history list */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 font-sans text-xs">
              {supportMessages.map((m) => (
                <div
                  key={m.id}
                  className={`flex flex-col ${
                    m.sender === "user" ? "items-end" : "items-start"
                  }`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-3 py-2.5 leading-normal ${
                      m.sender === "user"
                        ? "bg-red-650 text-white rounded-tr-none"
                        : "bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none whitespace-pre-wrap"
                    }`}
                  >
                    {m.text}
                  </div>
                  <span className="text-[8px] text-slate-550 font-mono mt-1 px-1">{m.timestamp}</span>
                </div>
              ))}
              {isSupportTyping && (
                <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-2xl px-3 py-2 text-[10px] text-slate-400 w-max font-mono animate-pulse">
                  <span>Assistant is researching...</span>
                </div>
              )}
            </div>

            {/* Hint Suggestion Chips */}
            <div className="px-4 py-2 border-t border-slate-900 bg-slate-950 flex flex-wrap gap-1.5 shrink-0">
              <button
                onClick={() => handleSendSupport("How do I perform CPR and First-Aid instructions?")}
                className="text-[9px] font-mono bg-slate-900 border border-slate-850 hover:bg-slate-800 text-slate-300 px-2 py-0.5 rounded transition-all cursor-pointer"
                type="button"
              >
                🏥 First-Aid Guide
              </button>
              <button
                onClick={() => handleSendSupport("Can you explain how the ambulance radar works?")}
                className="text-[9px] font-mono bg-slate-900 border border-slate-850 hover:bg-slate-800 text-slate-300 px-2 py-0.5 rounded transition-all cursor-pointer"
                type="button"
              >
                ⚡ Radar Search
              </button>
              <button
                onClick={() => handleSendSupport("Where is the website map based?")}
                className="text-[9px] font-mono bg-slate-900 border border-slate-850 hover:bg-slate-800 text-slate-300 px-2 py-0.5 rounded transition-all cursor-pointer"
                type="button"
              >
                🗺️ Nazimabad Karachi Map
              </button>
            </div>

            {/* Input message form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendSupport();
              }}
              className="border-t border-slate-900 p-3 bg-slate-900/60 flex items-center gap-2"
            >
              <input
                type="text"
                value={supportInput}
                onChange={(e) => setSupportInput(e.target.value)}
                placeholder="Ask about website and guide details..."
                className="flex-1 bg-slate-950 border border-slate-800 rounded-lg py-1.5 px-3 text-xs text-white focus:outline-none focus:border-red-500 font-mono"
              />
              <button
                type="submit"
                className="bg-red-650 hover:bg-red-600 text-white p-2 rounded-lg transition-colors cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        ) : (
          <button
            onClick={() => setSupportOpen(true)}
            className="bg-red-650 hover:bg-red-550 hover:scale-105 active:scale-95 text-white font-bold px-4 py-3 rounded-full shadow-2xl transition-all cursor-pointer flex items-center gap-2 group hover:shadow-[0_0_15px_rgba(239,68,68,0.4)]"
            type="button"
          >
            <MessageCircle className="w-5 h-5 text-white animate-bounce" />
            <span className="text-white text-xs font-sans tracking-wide">How to use? Support Chat</span>
          </button>
        )}
      </div>

      {/* Footer System labels */}
      <footer className="mt-12 bg-slate-950 py-6 border-t border-slate-900 shrink-0">
        <div className="max-w-7xl mx-auto px-4 text-center space-y-2 text-[10px] font-mono text-slate-500">
          <p>© 2026 Emergency Health Grid Coordination Inc. All clinical records certified under HIPAA encryption criteria.</p>
          <p>Verified node connection address: Sector 9 High-Velocity Ambulance Grid.</p>
        </div>
      </footer>

    </div>
  );
}
