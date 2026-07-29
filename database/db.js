import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import pg from "pg";

dotenv.config();

// In-Memory & File-Backed database structure for persistent Signup, Login, and Case synchronization
export const DB_FILE = path.join(process.cwd(), "database", "db_data.json");

export let db = { users: [], cases: [], config: {} };

// Initialize database
export function loadDb() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, "utf-8");
      db = JSON.parse(data);
      if (!db.users) db.users = [];
      if (!db.cases) db.cases = [];
      if (!db.config) db.config = {};
    } else {
      db = { users: [], cases: [], config: {} };
      saveDb();
    }
  } catch (err) {
    console.error("Failed to load local DB: ", err);
  }
}

export function saveDb() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to save local DB: ", err);
  }
}

// Load initial state
loadDb();

// Initialize Supabase configuration with automatic self-healing capabilities
export function repairSupabaseUrl(url) {
  if (!url) return "";
  let clean = url.trim();
  
  // 1. If user pasted their project dashboard studio page instead of API endpoint
  const dashboardRegex = /supabase\.com\/dashboard\/project\/([a-zA-Z0-9_-]+)/i;
  const match = clean.match(dashboardRegex);
  if (match && match[1]) {
    const projectId = match[1];
    const repaired = `https://${projectId}.supabase.co`;
    console.log(`🔧 Cleaned up dashboard Studio URL into valid REST API Endpoint: ${repaired}`);
    return repaired;
  }

  // 2. Erase trailing slashes
  clean = clean.replace(/\/+$/, "");

  // 3. Promote http to https
  if (clean.startsWith("http://")) {
    clean = "https://" + clean.substring(7);
  }

  // 4. Convert single alphanumeric project code (e.g. 'qazxswedcvfr') directly to endpoint
  if (!clean.includes(".") && !clean.includes("/") && clean.length >= 10 && clean.length <= 30) {
    clean = `https://${clean}.supabase.co`;
  }

  // 5. Prepend https protocol if absent completely
  if (!clean.startsWith("https://") && !clean.startsWith("http://")) {
    clean = "https://" + clean;
  }

  // 6. Append secure suffix if domain remains undefined
  if (clean.startsWith("https://") && !clean.includes(".")) {
    clean = clean + ".supabase.co";
  }

  return clean;
}

export function switchToSandboxFallback() {
  if (!isSandboxActive) {
    isSandboxActive = true;
    supabaseClient = new MockSupabaseClient();
    console.log("🎮 Missing database tables in live Supabase. Seamlessly activated local virtual Sandbox Database fallback.");
  }
}

export function cleanErrorMessage(msg) {
  if (!msg) return "Unknown error";
  const str = String(msg);
  if (str.includes("<!DOCTYPE") || str.includes("<html") || str.includes("<body") || str.length > 500) {
    switchToSandboxFallback();
    return "Received HTML response (Studio dashboard page instead of REST API). Reverted to Sandbox Database.";
  }

  // Handle "Could not find table" / "schema cache" mismatch gracefully
  if (
    str.includes("Could not find the table") ||
    str.includes("schema cache") ||
    str.includes("does not exist") ||
    (str.includes("relation") && str.includes("does not exist"))
  ) {
    switchToSandboxFallback();
    return "Missing required database tables. Reverted to Sandbox Local Database. Please execute SQL schema script in your Supabase compiler.";
  }

  return str;
}

// Standard JSON-backed in-memory database sync helper classes
export class MockSupabaseTable {
  constructor(tableName) {
    this.tableName = tableName;
  }

  select(columnsOrConfig, config) {
    const countRequest = config && config.count !== undefined;
    let resultData = [];

    if (this.tableName === "swiftrescue_users") {
      resultData = db.users.map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        password_hash: u.passwordHash
      }));
    } else if (this.tableName === "swiftrescue_cases") {
      resultData = db.cases.map(c => ({
        id: c.id,
        patient_name: c.patient?.name || "Anonymous Patient",
        patient_age: c.patient?.age || 0,
        blood_group: c.patient?.bloodGroup || "O+",
        emergency_type: c.patient?.emergencyType || "Other",
        contact_number: c.patient?.contactNumber || "",
        notes: c.patient?.additionalNotes || "",
        status: c.status,
        ambulance_driver: c.ambulance?.driverName || "",
        ambulance_plate: c.ambulance?.plateNumber || "",
        hospital_name: c.hospital?.name || "",
        distance_km: c.hospital?.distanceKm || 0,
        amount: c.invoiceDetails?.totalAmount || 0,
        transaction_id: c.invoiceDetails?.transactionId || "",
        address: c.currentLocation?.address || "",
        created_at: c.createdAt || new Date().toISOString(),
        raw_payload: c
      }));
    }

    const self = this;
    const chainObj = {
      data: resultData,
      error: null,
      eq: function(field, val) {
        chainObj.data = chainObj.data.filter((item) => {
          if (typeof item[field] === "string" && typeof val === "string") {
            return item[field].toLowerCase() === val.toLowerCase();
          }
          return item[field] === val;
        });
        return this;
      },
      limit: function(num) {
        chainObj.data = chainObj.data.slice(0, num);
        return this;
      },
      order: function(field, opts) {
        return this;
      },
      count: resultData.length,
      then: function(onfulfilled) {
        if (countRequest) {
          onfulfilled({ data: null, error: null, count: chainObj.data.length });
        } else {
          onfulfilled({ data: chainObj.data, error: null });
        }
      }
    };
    return chainObj;
  }

  async upsert(row) {
    if (this.tableName === "swiftrescue_users") {
      const idx = db.users.findIndex(u => u.id === row.id || u.email.toLowerCase() === row.email.toLowerCase());
      const newUser = {
        id: row.id,
        name: row.name,
        email: row.email,
        passwordHash: row.password_hash || "oauth_generated",
        isVerified: true
      };
      if (idx >= 0) {
        db.users[idx] = { ...db.users[idx], ...newUser };
      } else {
        db.users.push(newUser);
      }
      saveDb();
    } else if (this.tableName === "swiftrescue_cases") {
      const idx = db.cases.findIndex(c => c.id === row.id);
      const newCase = row.raw_payload || {
        id: row.id,
        patient: {
          name: row.patient_name,
          age: row.patient_age,
          bloodGroup: row.blood_group,
          emergency_type: row.emergency_type,
          contactNumber: row.contact_number,
          additionalNotes: row.notes,
        },
        status: row.status,
        currentLocation: { address: row.address },
        ambulance: { driverName: row.ambulance_driver, plateNumber: row.ambulance_plate },
        hospital: { name: row.hospital_name, distanceKm: row.distance_km }
      };
      if (idx >= 0) {
        db.cases[idx] = newCase;
      } else {
        db.cases.unshift(newCase);
      }
      saveDb();
    }
    return { data: row, error: null };
  }
}

export class MockSupabaseClient {
  from(tableName) {
    return new MockSupabaseTable(tableName);
  }
}

export let supabaseClient = null;
export let isSandboxActive = false;
export let activeSupabaseUrl = "";
export let activeSupabaseKey = "";
export let activePostgresConnectionString = "";

export function reconfigureSupabase(url, key) {
  if (!db.config) db.config = {};
  if (!url || !key || url.trim() === "" || key.trim() === "") {
    isSandboxActive = true;
    activeSupabaseUrl = "";
    activeSupabaseKey = "";
    db.config.supabaseUrl = "";
    db.config.supabaseKey = "";
  } else {
    isSandboxActive = false;
    activeSupabaseUrl = repairSupabaseUrl(url);
    activeSupabaseKey = key;
    db.config.supabaseUrl = activeSupabaseUrl;
    db.config.supabaseKey = activeSupabaseKey;
  }
  saveDb();
  initializeSupabaseClient();
  setTimeout(() => {
    syncLocalDataToSupabase().catch((err) => {
      console.warn("Background sync error ignored:", err.message);
    });
  }, 1000);
}

export async function syncLocalDataToSupabase() {
  if (isSandboxActive || !supabaseClient) return;
  console.log("🔄 Starting local data synchronization to Supabase...");
  
  // Sync Users
  if (db.users && db.users.length > 0) {
    for (const u of db.users) {
      try {
        const { error } = await supabaseClient
          .from("swiftrescue_users")
          .upsert({
            id: u.id,
            name: u.name,
            email: u.email.toLowerCase(),
            password_hash: u.passwordHash || "oauth_generated"
          });
        if (error) {
          cleanErrorMessage(error.message);
          console.warn(`[Sync] Fail to sync user ${u.email}:`, error.message);
        }
      } catch (err) {
        cleanErrorMessage(err.message);
        console.warn(`[Sync] Fail to sync user ${u.email}:`, err.message);
      }
    }
  }

  // Sync Cases
  if (db.cases && db.cases.length > 0) {
    for (const caseData of db.cases) {
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
          created_at: caseData.createdAt || new Date().toISOString(),
          raw_payload: caseData
        };
        const { error } = await supabaseClient
          .from("swiftrescue_cases")
          .upsert(dbRow);
        if (error) {
          cleanErrorMessage(error.message);
          console.warn(`[Sync] Fail to sync case ${caseData.id}:`, error.message);
        }
      } catch (err) {
        cleanErrorMessage(err.message);
        console.warn(`[Sync] Fail to sync case ${caseData.id}:`, err.message);
      }
    }
  }
  console.log("✅ Local data synchronization to Supabase complete.");
}

export function reconfigurePostgres(connectionString) {
  if (!db.config) db.config = {};
  activePostgresConnectionString = connectionString ? connectionString.trim() : "";
  db.config.postgresConnectionString = activePostgresConnectionString;
  saveDb();
}

export function initializeSupabaseClient() {
  if (isSandboxActive) {
    supabaseClient = new MockSupabaseClient();
    console.log("🎮 Automatically initialized plug-and-play local virtual Sandbox Database.");
  } else {
    try {
      supabaseClient = createClient(activeSupabaseUrl, activeSupabaseKey);
      console.log("🚀 Custom cloud database initialized successfully with URL:", activeSupabaseUrl);
    } catch (err) {
      console.error("❌ Custom database failed to load. Defaulting back to local sandbox:", err.message);
      supabaseClient = new MockSupabaseClient();
      isSandboxActive = true;
    }
  }
}

// Initial initialization loading from saved file configuration OR environment fallback
let rawSupabaseUrl = db.config?.supabaseUrl || process.env.SUPABASE_URL || "";
activeSupabaseUrl = repairSupabaseUrl(rawSupabaseUrl);
activeSupabaseKey = db.config?.supabaseKey || process.env.SUPABASE_ANON_KEY || "";
activePostgresConnectionString = db.config?.postgresConnectionString || process.env.SUPABASE_POSTGRES_URL || "";

isSandboxActive = !activeSupabaseUrl || activeSupabaseUrl.trim() === "" || activeSupabaseUrl.includes("YOUR_SUPABASE_URL") || activeSupabaseUrl.includes("YOUR_SUPABASE_URL_HERE");

initializeSupabaseClient();
