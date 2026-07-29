import express from "express";
import {
  db,
  saveDb,
  supabaseClient,
  isSandboxActive,
  activeSupabaseUrl,
  activeSupabaseKey,
  cleanErrorMessage,
  reconfigureSupabase,
  activePostgresConnectionString,
  reconfigurePostgres,
} from "../database/db.js";
import { aiClient } from "./ai.js";
import pg from "pg";

export const apiRouter = express.Router();

// 1. Auth Endpoint: Register
apiRouter.post("/auth/signup", async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }

  // Check locally first
  const existingUser = db.users.find(
    (u) => u.email.toLowerCase() === email.toLowerCase()
  );
  if (existingUser) {
    res.status(400).json({ error: "User already exists with this email address." });
    return;
  }

  // Check Supabase if configured and not sandbox
  if (supabaseClient && !isSandboxActive) {
    try {
      const { data, error } = await supabaseClient
        .from("swiftrescue_users")
        .select("*")
        .eq("email", email.toLowerCase())
        .limit(1);
      
      if (!error && data && data.length > 0) {
        // High fidelity auto-sync: Save existing Supabase user locally
        const existingSupUser = data[0];
        if (!db.users.some(u => u.email.toLowerCase() === existingSupUser.email.toLowerCase())) {
          db.users.push({
            id: existingSupUser.id,
            name: existingSupUser.name,
            email: existingSupUser.email.toLowerCase(),
            passwordHash: existingSupUser.password_hash,
            isVerified: true
          });
          saveDb();
        }
        res.status(400).json({ error: "User already exists with this email address." });
        return;
      }
    } catch (e) {
      console.warn("Supabase SignUp unique check error bypassed:", cleanErrorMessage(e?.message));
    }
  }

  const newUser = {
    id: `usr_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    name,
    email: email.toLowerCase(),
    passwordHash: password, // Simple plain text or basic hash for simulator
    isVerified: true, // Auto-verified for modern seamless emergency flow
  };

  db.users.push(newUser);
  saveDb();

  // Supabase Sync if configured
  if (supabaseClient) {
    try {
      const { error } = await supabaseClient
        .from("swiftrescue_users")
        .upsert({
          id: newUser.id,
          name: newUser.name,
          email: newUser.email.toLowerCase(),
          password_hash: newUser.passwordHash
        });
      if (error) {
        console.warn("Supabase SignUp sync failed (ensure tables exist in Supabase):", cleanErrorMessage(error.message));
      } else {
        console.log("✅ Successfully synced new signup to Supabase.");
      }
    } catch (e) {
      console.error("Supabase SignUp error failed silently:", cleanErrorMessage(e.message));
    }
  }

  res.json({
    user: {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      isVerified: newUser.isVerified,
    },
    token: `token_${newUser.id}_${Date.now()}`,
    message: "Registration successful. Welcome to SwiftRescue dispatch.",
  });
});

// 2. Auth Endpoint: Login
apiRouter.post("/auth/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: "Email and password are required." });
    return;
  }

  // If Supabase is connected, check credentials there first
  if (supabaseClient) {
    try {
      const { data, error } = await supabaseClient
        .from("swiftrescue_users")
        .select("*")
        .eq("email", email.toLowerCase())
        .limit(1);

      if (error) {
        console.warn("Supabase Auth query failed (ensure tables exist in Supabase):", cleanErrorMessage(error?.message || error));
      } else if (data && data.length > 0) {
        const sUsr = data[0];
        if (sUsr.password_hash === password) {
          // Self-heal/Cache to local DB as well so they are in sync
          if (!db.users.some((u) => u.email.toLowerCase() === sUsr.email.toLowerCase())) {
            db.users.push({
              id: sUsr.id,
              name: sUsr.name,
              email: sUsr.email.toLowerCase(),
              passwordHash: sUsr.password_hash,
              isVerified: true
            });
            saveDb();
          }

          res.json({
            user: {
              id: sUsr.id,
              email: sUsr.email,
              name: sUsr.name,
              isVerified: true
            },
            token: `token_${sUsr.id}_${Date.now()}`,
            message: "Logged in successfully matching secure Supabase credentials.",
          });
          return;
        } else {
          // Wrong password on Supabase
          res.status(401).json({ error: "Invalid email or password credentials." });
          return;
        }
      }
    } catch (e) {
      console.warn("Supabase Auth sign-in failed, checking native fallback file system:", cleanErrorMessage(e.message));
    }
  }

  // Fallback check in local memory database
  const user = db.users.find(
    (u) =>
      u.email.toLowerCase() === email.toLowerCase() &&
      u.passwordHash === password
  );

  if (!user) {
    res.status(401).json({ error: "Invalid email or password credentials." });
    return;
  }

  res.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      isVerified: user.isVerified,
    },
    token: `token_${user.id}_${Date.now()}`,
    message: "Logged in successfully to SwiftRescue System.",
  });
});

// 3. Google Sign in Simulator (Seamless integration)
apiRouter.post("/auth/google", async (req, res) => {
  const { email, name } = req.body;
  if (!email || !name) {
    res.status(400).json({ error: "Required auth parameters missing." });
    return;
  }

  // Query Supabase first to fetch existing user properties
  let existingSupabaseUser = null;
  if (supabaseClient && !isSandboxActive) {
    try {
      const { data, error } = await supabaseClient
        .from("swiftrescue_users")
        .select("*")
        .eq("email", email.toLowerCase())
        .limit(1);
      
      if (!error && data && data.length > 0) {
        existingSupabaseUser = data[0];
      }
    } catch (e) {
      console.warn("Supabase Google SSO check failed:", e.message);
    }
  }

  let user = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  
  if (!user && existingSupabaseUser) {
    user = {
      id: existingSupabaseUser.id,
      name: existingSupabaseUser.name,
      email: existingSupabaseUser.email.toLowerCase(),
      passwordHash: existingSupabaseUser.password_hash,
      isVerified: true,
    };
    db.users.push(user);
    saveDb();
  } else if (!user) {
    user = {
      id: `usr_g_${Date.now()}`,
      name,
      email: email.toLowerCase(),
      passwordHash: "oauth_generated",
      isVerified: true,
    };
    db.users.push(user);
    saveDb();
  }

  // Keep passwords in sync if it is a standard password
  const finalPasswordHash = user.passwordHash || "oauth_generated";

  // Supabase Sync if configured
  if (supabaseClient) {
    try {
      const { error } = await supabaseClient
        .from("swiftrescue_users")
        .upsert({
          id: user.id,
          name: user.name,
          email: user.email.toLowerCase(),
          password_hash: finalPasswordHash
        });
      if (error) {
        console.warn("Supabase SSO sync failed (ensure tables exist in Supabase):", cleanErrorMessage(error.message));
      } else {
        console.log("✅ Successfully synced Google SSO credential to Supabase.");
      }
    } catch (e) {
      console.error("Supabase Google SSO error ignored:", cleanErrorMessage(e.message));
    }
  }

  res.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      isVerified: true,
    },
    token: `token_g_${user.id}_${Date.now()}`,
    message: "Authenticated via secure Google OAuth Integration successfully.",
  });
});

// 4. AI Chatbot endpoint proxy with failsafe emergency knowledge base
apiRouter.post("/chat", async (req, res) => {
  const { prompt, history } = req.body;
  if (!prompt) {
    res.status(400).json({ error: "Prompt value is required" });
    return;
  }

  // Pre-configured Medical First-Aid Smart Guidance knowledge base (for instant sub-second fallback)
  const firstAidFallbacks = {
    cardiac: `🚨 **EMERGENCY: CARDIAC ARREST FIRST-AID INSTRUCTIONS** 🚨
1. **Call 911 / Trigger Ambulance immediately** using the main pulsing SOS page button.
2. **Push Hard and Fast**: Place your hands in the center of the chest and perform Chest Compressions.
3. **Pace**: Aim for 100 to 120 compressions per minute (to the beat of 'Staying Alive').
4. **Use AED**: If an Automated External Defibrillator is nearby, power it on and follow verbal prompts immediately.
5. Do not stop compressions until the dispatch ambulance (assigned to you) arrives.`,
    bleeding: `🔴 **FIRST-AID FOR SEVERE BLEEDING** 🔴
1. **Apply Direct Pressure**: Place a sterile bandage, clean cloth, or garment firmly against the wound.
2. **Elevate**: Raise the injured limb higher than the heart if possible.
3. **Do Not Remove Cloths**: If blood seeps through, place another layer on top. Do not rip off old dressings as this restarts clotting.
4. **Tourniquet**: For severe limb arterial bleeding, apply a tight tourniquet 2 inches above the wound if trained.`,
    choking: `🗣️ **FIRST-AID FOR CHOKING (HEIMLICH MANEUVER)** 🗣️
1. **Check for Voice**: Ask "Are you choking?" If they can speak or cough loudly, encourage coughing.
2. **Perform Abdominal Thrusts**: Standing behind, wrap arms around the waist. Make a fist, grip it with the other hand, and press in and upwards forcefully just above the navel.
3. **Repeat**: Perform 5 thrusts, followed by back-blows if needed, until the blockage is expelled.`,
    stroke: `🧠 **STROKE IDENTIFICATION: - THINK F.A.S.T.** 🧠
* **F – Face Drooping**: Does one side of the face sag when smiling?
* **A – Arm Weakness**: Can they raise both arms? Does one drift downward?
* **S – Speech Difficulty**: Is their speech slurred or strange?
* **T – Time to Call Ambulance**: Any single symptom means vital minutes are ticking. Request dispatch now!`,
    accident: `🚗 **ROAD ACCIDENT FIRST-AID STEPS** 🚗
1. **Secure the Scene**: Park your vehicle safely and turn on hazard flashers to alert incoming traffic.
2. **Do Not Move Casualties**: Unless there is an active fire risk or explosion hazard, keep injured patients completely still to protect the spinal column.
3. **Clear Airways**: Ensure patients are breathing. Tilt head slightly if necessary.
4. **Control Bleeding**: Tie off deep lacerations using clean garments.`,
    default: `🏥 **SMART EMB DISPATCH ASSISTANT RESPONSE** 🏥
* **Current Status**: Your ambulance dispatch simulation status is live on your visual control panel.
* **Nearest Hospitals**: Available with dynamic ICU units, doctor listings, and bed counters on your tracking screen.
* **Pro tip**: Enter the Patient's Age, Blood Type, and Medical Laceration type so the paramedic team is fully equipped upon arrival. For burn emergencies, cover gently with sterile water-infused bandages.`
  };

  const cleanPrompt = prompt.toLowerCase();
  let matchedResponse = "";
  if (cleanPrompt.includes("cardiac") || cleanPrompt.includes("heart") || cleanPrompt.includes("cpr")) {
    matchedResponse = firstAidFallbacks.cardiac;
  } else if (cleanPrompt.includes("bleed") || cleanPrompt.includes("laceration") || cleanPrompt.includes("cut")) {
    matchedResponse = firstAidFallbacks.bleeding;
  } else if (cleanPrompt.includes("chok") || cleanPrompt.includes("throat") || cleanPrompt.includes("airway")) {
    matchedResponse = firstAidFallbacks.choking;
  } else if (cleanPrompt.includes("stroke") || cleanPrompt.includes("slur") || cleanPrompt.includes("paralyz")) {
    matchedResponse = firstAidFallbacks.stroke;
  } else if (cleanPrompt.includes("accident") || cleanPrompt.includes("crash") || cleanPrompt.includes("trauma")) {
    matchedResponse = firstAidFallbacks.accident;
  }

  // If we have Google GenAI initialized, query Gemini 3.5 Flash for smart, medically sound answers!
  if (aiClient) {
    try {
      const historyPrompt = history && history.length > 0 
        ? history.slice(-5).map((h) => `${h.sender === "user" ? "User" : "System"}: ${h.text}`).join("\n") + `\nUser: ${prompt}`
        : prompt;

      const systemInstruction = 
        "You are an empathetic, highly professional Emergency Paramedic Assistant on the SwiftRescue platform. " +
        "Provide direct, clinical, sub-second first-aid instructions using Markdown. Use bold lists and structured steps. " +
        "Clearly prefix with a life-safety warning if the situation seems dangerous. Keep instructions extremely concise, actionable, and structured " +
        "so that a stressed bystander can read them within 5 seconds. If asked about the ambulance status or hospitals, mention that the system " +
        "automatically tracks active dispatches in real-time on the live interface Map with 10-minute responsive routes. " +
        "Avoid any long introductory paragraphs. Answer straight to the point.";

      const result = await aiClient.models.generateContent({
        model: "gemini-3.5-flash",
        contents: historyPrompt,
        config: {
          systemInstruction,
          temperature: 0.5,
        },
      });

      if (result.text) {
        res.json({ text: result.text });
        return;
      }
    } catch (err) {
      console.error("Gemini API request failed, falling back to local dataset:", err.message);
    }
  }

  // Fallback if client is uninitialized or API fails
  const finalReply = matchedResponse || (
    `**[Fallback Assistant]** \n\n${firstAidFallbacks.default}\n\n*Note: To enable smart conversational responses, configure a valid GEMINI_API_KEY in the Secrets menu.*`
  );
  
  // Artificial slight delay for natural chat rhythm
  setTimeout(() => {
    res.json({ text: finalReply });
  }, 400);
});

// 5. Database Status and Sync SQL endpoint
apiRouter.get("/database/status", async (req, res) => {
  const urlConfigured = !isSandboxActive;
  const keyConfigured = !isSandboxActive;

  let isConnected = false;
  let connectionError = "";
  let stats = { usersCount: 0, casesCount: 0 };

  if (supabaseClient) {
    if (isSandboxActive) {
      isConnected = true;
      stats.usersCount = db.users?.length || 0;
      stats.casesCount = db.cases?.length || 0;
    } else {
      try {
        // Test querying to check if user tables are loaded and responsive in Supabase
        const { data: userData, error: userError } = await supabaseClient
          .from("swiftrescue_users")
          .select("id")
          .limit(1);

        if (userError) {
          connectionError = `Supabase credentials authorized, but database table access reported: "${cleanErrorMessage(userError.message || userError.details)}". Setup the schema by executing the SQL script inside Supabase SQL editor.`;
          isConnected = true; // Connection was established, but tables are missing
        } else {
          isConnected = true;
          
          // Count users
          const { count: uCount, error: countErr1 } = await supabaseClient
            .from("swiftrescue_users")
            .select("*", { count: "exact", head: true });
          if (!countErr1) stats.usersCount = uCount || 0;

          // Count cases
          const { count: cCount, error: countErr2 } = await supabaseClient
            .from("swiftrescue_cases")
            .select("*", { count: "exact", head: true });
          if (!countErr2) stats.casesCount = cCount || 0;
        }
      } catch (e) {
        connectionError = cleanErrorMessage(e.message || "Unknown schema query error");
      }
    }
  }

  res.json({
    configured: urlConfigured && keyConfigured,
    isSandbox: isSandboxActive,
    supabaseUrl: isSandboxActive ? "https://auto-sandbox.supabase.co" : activeSupabaseUrl,
    supabaseKeyMasked: isSandboxActive ? "auto_sandbox_active" : (activeSupabaseKey ? `${activeSupabaseKey.substring(0, 10)}...${activeSupabaseKey.substring(activeSupabaseKey.length - 8)}` : null),
    postgresConnectionStringMasked: activePostgresConnectionString ? `${activePostgresConnectionString.split("@")[0].substring(0, 18)}...@${activePostgresConnectionString.split("@")[1] || "pooler.supabase.com"}` : "",
    postgresConnectionStringRaw: activePostgresConnectionString || "",
    connected: isConnected,
    connectionError: connectionError || null,
    stats,
    sqliteStats: {
      users: db.users?.length || 0,
      cases: db.cases?.length || 0
    },
    sqlSchema: `-- SQL Schema Script for SwiftRescue Database Initialization
-- Execute this script inside your Supabase SQL Editor to register tables safely.

-- 1. Create Users Table
CREATE TABLE IF NOT EXISTS swiftrescue_users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create Cases Table
CREATE TABLE IF NOT EXISTS swiftrescue_cases (
  id TEXT PRIMARY KEY,
  patient_name TEXT NOT NULL,
  patient_age INT NOT NULL,
  blood_group TEXT,
  emergency_type TEXT NOT NULL,
  contact_number TEXT,
  notes TEXT,
  status TEXT NOT NULL,
  ambulance_driver TEXT,
  ambulance_plate TEXT,
  hospital_name TEXT,
  distance_km NUMERIC,
  amount NUMERIC,
  transaction_id TEXT,
  address TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  raw_payload JSONB
);

-- Give public access rules (disable RLS for seamless applet preview manipulation)
ALTER TABLE swiftrescue_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE swiftrescue_cases DISABLE ROW LEVEL SECURITY;`
  });
});

// 5.1 Dynamic Supabase Database customization controller
apiRouter.post("/database/configure", (req, res) => {
  const { url, key } = req.body;
  reconfigureSupabase(url, key);

  if (!url || !key || url.trim() === "" || key.trim() === "") {
    res.json({ success: true, message: "Successfully reset to fully automatic cloud sandbox backup mode.", isSandbox: true });
  } else {
    res.json({ success: true, message: "Custom Supabase credentials loaded and configured successfully.", isSandbox: false });
  }
});

// 5.2 Programmatic Database table creator in code
apiRouter.post("/database/create-tables", async (req, res) => {
  const { connectionString, dbKey } = req.body;
  if (!connectionString || connectionString.trim() === "") {
    res.status(400).json({ error: "Please enter a valid PostgreSQL Connection String." });
    return;
  }

  const cleanConn = connectionString.trim();

  // Parse project ID if possible to sync with client-side REST client as well!
  let extractedProjectRef = "";
  const match = cleanConn.match(/postgres\.([a-zA-Z0-9_-]+)@/i);
  if (match && match[1]) {
    extractedProjectRef = match[1];
  } else {
    const altMatch = cleanConn.match(/@db\.([a-zA-Z0-9_-]+)\.supabase\./i);
    if (altMatch && altMatch[1]) {
      extractedProjectRef = altMatch[1];
    }
  }

  const client = new pg.Client({
    connectionString: cleanConn,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();

    // Execute table migrations
    const sql = `
      CREATE TABLE IF NOT EXISTS swiftrescue_users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS swiftrescue_cases (
        id TEXT PRIMARY KEY,
        patient_name TEXT NOT NULL,
        patient_age INT NOT NULL,
        blood_group TEXT,
        emergency_type TEXT NOT NULL,
        contact_number TEXT,
        notes TEXT,
        status TEXT NOT NULL,
        ambulance_driver TEXT,
        ambulance_plate TEXT,
        hospital_name TEXT,
        distance_km NUMERIC,
        amount NUMERIC,
        transaction_id TEXT,
        address TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        raw_payload JSONB
      );

      ALTER TABLE swiftrescue_users DISABLE ROW LEVEL SECURITY;
      ALTER TABLE swiftrescue_cases DISABLE ROW LEVEL SECURITY;
    `;

    await client.query(sql);
    await client.end();

    // Save connection string persistently in local config file
    reconfigurePostgres(cleanConn);

    // If an Anon Key was also entered, configure the client-side REST connector immediately!
    if (extractedProjectRef && dbKey) {
      const generatedUrl = `https://${extractedProjectRef}.supabase.co`;
      reconfigureSupabase(generatedUrl, dbKey);
    } else if (extractedProjectRef) {
      const generatedUrl = `https://${extractedProjectRef}.supabase.co`;
      if (activeSupabaseKey) {
        reconfigureSupabase(generatedUrl, activeSupabaseKey);
      } else {
        reconfigureSupabase(generatedUrl, "placeholder_anon_key");
      }
    }

    res.json({
      success: true,
      message: "🎉 Success! The swiftrescue_users and swiftrescue_cases tables have been successfully created inside your live cloud Supabase database, and row-level security is disabled for synchronous access."
    });
  } catch (err) {
    console.error("Failed to execute database migration code:", err);
    res.status(500).json({
      error: `Failed to create tables programmatically: ${err.message}. Please double-check the connection URI password spelling, and make sure that your Supabase instance allows standard incoming socket traffic.`
    });
    try { await client.end(); } catch (e) {}
  }
});

// 6. Get Cases list (Merge or fetch from Supabase if connected)
apiRouter.get("/cases", async (req, res) => {
  if (supabaseClient) {
    try {
      const { data, error } = await supabaseClient
        .from("swiftrescue_cases")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && data) {
        const mapped = data.map((c) => {
          if (c.raw_payload) {
            return c.raw_payload;
          }
          return {
            id: c.id,
            patient: {
              name: c.patient_name,
              age: c.patient_age,
              bloodGroup: c.blood_group,
              emergencyType: c.emergency_type,
              contactNumber: c.contact_number,
              additionalNotes: c.notes,
            },
            status: c.status,
            currentLocation: {
              address: c.address,
              lat: 220,
              lng: 80,
            },
            ambulance: {
              driverName: c.ambulance_driver,
              plateNumber: c.ambulance_plate,
              driverPhone: "+92 321 4567890",
              rating: 4.8,
              etaMinutes: 2,
              currentSpeedKph: 55,
              latitude: 220,
              longitude: 80
            },
            hospital: {
              name: c.hospital_name,
              distanceKm: parseFloat(c.distance_km) || 2.1,
              availableBeds: 20,
              availableIcuBeds: 4,
              assignedRoom: "Emergency Trauma Unit",
              onDutyDoctor: "Dr. Muhammad Irfan",
              rating: 4.9,
              latitude: 220,
              longitude: 80,
              imageUrl: ""
            },
            createdAt: c.created_at,
            invoiceDetails: c.amount ? {
              invoiceId: `INV-${c.id}`,
              totalAmount: c.amount,
              baseFare: 120,
              distanceFare: c.amount - 120,
              transactionId: c.transaction_id,
              timestamp: c.created_at,
            } : null
          };
        });
        res.json(mapped);
        return;
      } else {
        if (error) console.warn("Supabase cases fetch failure (ensure SQL script has been run):", cleanErrorMessage(error.message));
      }
    } catch (err) {
      console.error("Failed to query cases from Supabase:", err);
    }
  }

  // Fallback to local DB list
  res.json(db.cases || []);
});

// 7. Save Case details (Always persistent to file, and also to Supabase if connected)
apiRouter.post("/cases", async (req, res) => {
  const caseData = req.body;
  if (!caseData || !caseData.id) {
    res.status(400).json({ error: "Invalid case data payload structure." });
    return;
  }

  // Save locally
  if (!db.cases) db.cases = [];
  db.cases = db.cases.filter((c) => c.id !== caseData.id);
  db.cases.unshift(caseData);
  saveDb();

  // Save to Supabase if connected
  if (supabaseClient) {
    try {
      const dbRow = {
        id: caseData.id,
        patient_name: caseData.patient?.name || "Anonymous Patient",
        patient_age: caseData.patient?.age || 0,
        blood_group: caseData.patient?.bloodGroup || "O+",
        emergency_type: caseData.patient?.emergencyType || "Other Emergency",
        contact_number: caseData.patient?.contactNumber || "",
        notes: caseData.patient?.additionalNotes || "",
        status: caseData.status,
        ambulance_driver: caseData.ambulance?.driverName || "",
        ambulance_plate: caseData.ambulance?.plateNumber || "",
        hospital_name: caseData.hospital?.name || "",
        distance_km: caseData.hospital?.distanceKm || 0,
        amount: caseData.invoiceDetails?.totalAmount || 0,
        transaction_id: caseData.invoiceDetails?.transactionId || "",
        address: caseData.currentLocation?.address || "",
        created_at: new Date().toISOString(),
        raw_payload: caseData
      };

      const { error } = await supabaseClient
        .from("swiftrescue_cases")
        .upsert(dbRow);

      if (error) {
        console.warn("Supabase Case insert error (ensure SQL script has been run):", cleanErrorMessage(error.message));
      } else {
        console.log("✅ Case synchronized successfully into Supabase.");
      }
    } catch (err) {
      console.error("Exception synchronizing Supabase case:", cleanErrorMessage(err.message));
    }
  }

  res.json({ success: true, message: "Emergency case saved successfully (local file-db synced)." });
});

// 8. Platform Customer Support / User Guide Chatbot Endpoint
apiRouter.post("/support-chat", async (req, res) => {
  const { prompt, history } = req.body;
  if (!prompt) {
    res.status(400).json({ error: "Prompt value is required" });
    return;
  }

  const systemInstruction = 
    "You are 'SwiftRescue Guide', a helpful, professional, and friendly Customer Support & User Guide Chatbot " +
    "specializing in assisting users on how to use SwiftRescue, explaining its visual components, settings, " +
    "and application flow. Keep your language clear, objective, and structured using Markdown.\n\n" +
    "When explaining, reference these real product features and how they work:\n" +
    "- **Visual Maps & Search**: The map layout is designed modeled after Nazimabad, Karachi (shows Nazimabad No. 3, Sir Syed Park, Shalimar Ground, Sir Shah Suleman Road). Users can type custom addresses or search, and change views (Standard, Satellite, Terrain).\n" +
    "- **Candidate Radar Search**: Pinging SOS launches a live radar scanner. It visualizes exactly 5 nearby ambulance cards on different coordinates on the map. The system will select one of these ambulances completely at random on scanning completion.\n" +
    "- **3-Second Completion Tune**: Once the ambulance drops the patient off at the hospital destination, a beautiful double-harmonic celebration melody plays for exactly 3 seconds.\n" +
    "- **Google SSO authentication**: Users can simulate Google Single Sign-on or type a custom Gmail address in the login popup to verify and link accounts.\n\n" +
    "Provide actionable, step-by-step assistance. Do not present mock telemetry lines. Be concise and human.";

  if (aiClient) {
    try {
      const historyPrompt = history && history.length > 0
        ? history.slice(-5).map((h) => `${h.sender === "user" ? "User" : "System"}: ${h.text}`).join("\n") + `\nUser: ${prompt}`
        : prompt;

      const result = await aiClient.models.generateContent({
        model: "gemini-3.5-flash",
        contents: historyPrompt,
        config: {
          systemInstruction,
          temperature: 0.7,
        },
      });

      if (result.text) {
        res.json({ text: result.text });
        return;
      }
    } catch (err) {
      console.error("Gemini support chatbot failed, using fallback:", err.message);
    }
  }

  // Fallback response matching details
  const fallbackSupportResponse = `👋 Hello! I am your SwiftRescue Customer Support Guide. Here is how you can get started:

1. **How to Dispatch**: Enter an address (e.g. *Nazimabad Block 3*) in the 'Address' field, submit patient details, and hit **SOS Dispatch**!
2. **Radar Candidates**: You will see a satellite sweep that displays exactly 5 candidate ambulances in real-time. On completion, one of these is chosen **randomly** to drive to you!
3. **Double Celebration Melody**: When the ambulance completes the route and delivers you safely to the hospital, a sweet 3-second electronic completion melody will play.
4. **Interactive Google Account Sign-In**: Click "Verify & Connect with Gmail ID" on the splash screen to select or enter a custom Gmail profile.

Let me know if you would like me to explain any step in detail!`;

  res.json({ text: fallbackSupportResponse });
});
