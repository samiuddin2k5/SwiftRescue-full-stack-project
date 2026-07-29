import { useState, useEffect } from "react";

export const DatabaseStatusConsole = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Form states
  const [urlInput, setUrlInput] = useState("");
  const [keyInput, setKeyInput] = useState("");
  const [postgresInput, setPostgresInput] = useState("");
  const [dbKeyInput, setDbKeyInput] = useState(""); // optional anon key for dual setup
  
  const [activeTab, setActiveTab] = useState("auto"); // "auto" or "credentials"
  const [configuring, setConfiguring] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [configMessage, setConfigMessage] = useState(null);
  const [installMessage, setInstallMessage] = useState(null);
  const [showSql, setShowSql] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/database/status");
      if (res.ok) {
        const statsData = await res.json();
        setData(statsData);
        if (!statsData.isSandbox && statsData.supabaseUrl) {
          setUrlInput(statsData.supabaseUrl);
        }
        if (statsData.postgresConnectionStringRaw) {
          setPostgresInput(statsData.postgresConnectionStringRaw);
        }
      } else {
        throw new Error("Unable to retrieve live database statuses.");
      }
    } catch (err) {
      setError(err?.message || "Failed to reach backend database controller.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleConfigure = async (e) => {
    e.preventDefault();
    setConfiguring(true);
    setConfigMessage(null);

    try {
      const res = await fetch("/api/database/configure", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: urlInput,
          key: keyInput,
        }),
      });

      const body = await res.json();
      if (body.success) {
        setConfigMessage({
          status: "success",
          text: body.message || "Database configuration initialized successfully.",
        });
        setKeyInput(""); // clear key for safety
        await fetchStatus();
      } else {
        throw new Error(body.message || "Configuration rejected by backend.");
      }
    } catch (err) {
      setConfigMessage({
        status: "error",
        text: err?.message || "Communication with database controller failed.",
      });
    } finally {
      setConfiguring(false);
    }
  };

  const handleInstallTables = async (e) => {
    e.preventDefault();
    setInstalling(true);
    setInstallMessage(null);

    try {
      const res = await fetch("/api/database/create-tables", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          connectionString: postgresInput,
          dbKey: dbKeyInput || undefined
        }),
      });

      const body = await res.json();
      if (res.ok && body.success) {
        setInstallMessage({
          status: "success",
          text: body.message || "Tables successfully created dynamically in code!",
        });
        setDbKeyInput(""); // clear key
        await fetchStatus();
      } else {
        throw new Error(body.error || "Dynamic table creation failed.");
      }
    } catch (err) {
      setInstallMessage({
        status: "error",
        text: err?.message || "Database node ran into error installing tables.",
      });
    } finally {
      setInstalling(false);
    }
  };

  const copyToClipboard = () => {
    if (!data?.sqlSchema) return;
    navigator.clipboard.writeText(data.sqlSchema);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  if (loading && !data) {
    return (
      <div className="p-8 text-center bg-slate-900/40 border border-slate-800 rounded-2xl animate-pulse">
        <span className="text-xs font-mono text-slate-400">Pinging Database Status Controllers...</span>
      </div>
    );
  }

  return (
    <div className="bg-slate-950/40 border border-slate-800/80 rounded-2xl p-5 space-y-6">
      <div className="flex flex-wrap justify-between items-start gap-3 pb-3 border-b border-slate-800">
        <div>
          <h4 className="text-sm font-bold text-white flex items-center gap-2">
            🔌 Programmatic Supabase & SQLite Dispatch Database Console
          </h4>
          <p className="text-[11px] text-slate-400 font-mono mt-0.5">
            Automated server-side self-healing database node state and credentials creator.
          </p>
        </div>
        <button
          onClick={fetchStatus}
          className="text-[10px] font-mono bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 px-2 py-1 rounded-lg transition-colors cursor-pointer"
        >
          🔄 Refresh Node Status
        </button>
      </div>

      {error && (
        <div className="bg-red-950/20 border border-red-500/20 p-3 rounded-xl text-xs text-red-400 font-mono">
          🚨 Connection Error: {error}
        </div>
      )}

      {data && (
        <div className="space-y-4">
          {/* Main Status Badge Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
              <span className="text-[9px] font-mono uppercase text-slate-500 block">Database Mode:</span>
              <div className="flex items-center gap-2 mt-1">
                {data.isSandbox ? (
                  <>
                    <span className="w-2.5 h-2.5 rounded-full bg-yellow-500 timeline-pulse" />
                    <span className="text-xs font-bold text-yellow-500 font-mono">Sandboxed (Local SQLite)</span>
                  </>
                ) : (
                  <>
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span className="text-xs font-bold text-emerald-400 font-mono">Live Sync (Supabase)</span>
                  </>
                )}
              </div>
            </div>

            <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 col-span-1 sm:col-span-1 md:col-span-2">
              <span className="text-[9px] font-mono uppercase text-slate-500 block">Active Endpoint Address:</span>
              <span className="text-[11px] font-mono text-slate-300 break-all block mt-1" title={data.supabaseUrl}>
                {data.supabaseUrl}
              </span>
            </div>
          </div>

          {/* Missing Table Warning Block */}
          {data.connectionError && (
            <div className="bg-rose-955/20 border border-red-500/20 p-4 rounded-xl space-y-3">
              <div className="flex items-start gap-2.5">
                <span className="text-lg">⚠️</span>
                <div className="space-y-1">
                  <p className="text-xs font-bold text-red-400">Supabase Table Mismatch Detected (Self-Healed Fallback Active)</p>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Connecting to your custom Supabase was successful, but the required database tables do not exist in your schema cache yet.
                    To prevent applet errors, <strong>the system has automatically fallen back to the local Sandboxed Database</strong> to handle all login and emergency files flawlessly. 
                  </p>
                  <p className="text-[10px] text-slate-450 font-mono italic">
                    Reason: {data.connectionError}
                  </p>
                </div>
              </div>
              <div className="flex justify-between items-center flex-wrap gap-2 pt-1 border-t border-red-950/10">
                <span className="text-[10px] text-amber-500 font-mono font-medium">💡 Solution: Use the 1-Click Auto Table Installer tab below to create them instantly from code!</span>
                <button
                  type="button"
                  onClick={() => setShowSql(!showSql)}
                  className="text-[10px] font-mono select-none px-3 py-1.5 bg-red-950/30 hover:bg-red-900/30 border border-red-500/30 text-rose-300 rounded-lg transition-colors cursor-pointer"
                >
                  {showSql ? "Hide SQL Preview" : "Show SQL Preview"}
                </button>
              </div>
            </div>
          )}

          {/* SQL Schema helper copy block */}
          {showSql && (
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden space-y-2 animate-fade-in">
              <div className="flex justify-between items-center bg-slate-950 px-3.5 py-2 border-b border-slate-850">
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">
                  SQL generated in code
                </span>
                <button
                  type="button"
                  onClick={copyToClipboard}
                  className="text-[9px] font-bold bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1 rounded transition-colors cursor-pointer"
                >
                  {copied ? "✓ Copied" : "Copy SQL Code"}
                </button>
              </div>
              <pre className="p-3.5 overflow-x-auto text-[10px] font-mono text-slate-300 leading-normal max-h-56 overflow-y-auto">
                {data.sqlSchema}
              </pre>
            </div>
          )}

          {/* Connected stats review */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
            <div className="bg-slate-900/35 border border-slate-800/80 p-2.5 rounded-xl">
              <span className="text-[8px] uppercase text-slate-500 block">Cloud Users (Supabase)</span>
              <span className="text-sm font-bold text-white font-mono block mt-0.5">{data.stats?.usersCount || 0}</span>
            </div>
            <div className="bg-slate-900/35 border border-slate-800/80 p-2.5 rounded-xl">
              <span className="text-[8px] uppercase text-slate-500 block">Cloud Cases (Supabase)</span>
              <span className="text-sm font-bold text-white font-mono block mt-0.5">{data.stats?.casesCount || 0}</span>
            </div>
            <div className="bg-slate-900/35 border border-slate-800/80 p-2.5 rounded-xl">
              <span className="text-[8px] uppercase text-slate-500 block">Disk Users (SQLite)</span>
              <span className="text-sm font-bold text-blue-400 font-mono block mt-0.5">{data.sqliteStats?.users || 0}</span>
            </div>
            <div className="bg-slate-900/35 border border-slate-800/80 p-2.5 rounded-xl">
              <span className="text-[8px] uppercase text-slate-500 block">Disk Cases (SQLite)</span>
              <span className="text-sm font-bold text-blue-400 font-mono block mt-0.5">{data.sqliteStats?.cases || 0}</span>
            </div>
          </div>
        </div>
      )}

      {/* Tabs Selection Bar */}
      <div className="border-t border-slate-850 pt-5 space-y-4">
        <div className="flex gap-2 p-1 bg-slate-950/60 rounded-xl border border-slate-900 max-w-sm">
          <button
            onClick={() => setActiveTab("auto")}
            className={`flex-1 py-1.5 px-3 text-xs font-mono rounded-lg transition-all ${
              activeTab === "auto"
                ? "bg-blue-600 text-white font-bold"
                : "text-slate-400 hover:text-white"
            }`}
          >
            ⚡ In-Code Setup
          </button>
          <button
            onClick={() => setActiveTab("credentials")}
            className={`flex-1 py-1.5 px-3 text-xs font-mono rounded-lg transition-all ${
              activeTab === "credentials"
                ? "bg-blue-600 text-white font-bold"
                : "text-slate-400 hover:text-white"
            }`}
          >
            🔌 API Overrides
          </button>
        </div>

        {activeTab === "auto" ? (
          <div className="space-y-3">
            <div className="bg-blue-950/10 border border-blue-500/10 p-3 rounded-xl">
              <h6 className="text-[11px] font-bold text-blue-400 flex items-center gap-1.5">
                ⚡ Why do tables show error/not show in code?
              </h6>
              <p className="text-[10px] text-slate-300 leading-relaxed mt-1">
                Supabase database tables live inside their cloud PostgreSQL server, not on regional files. Traditionally you would have to manually execute SQL code inside their dashboard. 
                With this <strong>In-Code Setup</strong>, paste your Postgres database URL and the backend will run a direct Pg transaction to create the tables natively for you!
              </p>
            </div>

            <form onSubmit={handleInstallTables} className="space-y-3">
              <div className="space-y-1">
                <label className="text-[9px] font-mono font-bold text-slate-400 block">
                  SUPABASE POSTGRES CONNECTION STRING
                </label>
                <input
                  type="text"
                  required
                  placeholder="postgresql://postgres.xxx:PASSWORD@aws-0-xyz.pooler.supabase.com:6543/postgres?sslmode=require"
                  className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-blue-500 font-mono"
                  value={postgresInput}
                  onChange={(e) => setPostgresInput(e.target.value)}
                />
                <span className="text-[9px] text-slate-500 block mt-0.5">
                  Get yours in Supabase: Settings &gt; Database &gt; Connection string &gt; URI
                </span>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-mono font-bold text-slate-400 block">
                  SUPABASE ANON KEY (OPTIONAL - FOR CLIENT SYNC)
                </label>
                <input
                  type="password"
                  placeholder="Paste your anon public key to synchronize REST API on completion"
                  className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-blue-500"
                  value={dbKeyInput}
                  onChange={(e) => setDbKeyInput(e.target.value)}
                />
              </div>

              {installMessage && (
                <div
                  className={`p-3 rounded-xl text-xs leading-relaxed font-mono ${
                    installMessage.status === "success"
                      ? "bg-emerald-950/20 border border-emerald-500/20 text-emerald-400"
                      : "bg-red-950/20 border border-red-500/20 text-red-400"
                  }`}
                >
                  {installMessage.text}
                </div>
              )}

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  disabled={installing}
                  className="text-[11px] font-mono bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-5 py-2 rounded-xl font-bold transition-all shadow cursor-pointer flex items-center gap-1.5"
                >
                  {installing ? (
                    <>
                      <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Creating Tables in Cloud...
                    </>
                  ) : (
                    "🚀 Create Tables inside Supabase Code"
                  )}
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-[11px] text-slate-400">
              Customize standard REST endpoint URLs and Keys manually without using direct Postgres socket credentials.
            </p>

            <form onSubmit={handleConfigure} className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-mono font-bold text-slate-400 block">SUPABASE API URL</label>
                  <input
                    type="text"
                    required
                    placeholder="https://xyzprojectcode.supabase.co"
                    className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-blue-500"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-mono font-bold text-slate-400 block">SUPABASE ANON KEY</label>
                  <input
                    type="password"
                    required
                    placeholder="Paste your public service token"
                    className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-blue-500"
                    value={keyInput}
                    onChange={(e) => setKeyInput(e.target.value)}
                  />
                </div>
              </div>

              {configMessage && (
                <div
                  className={`p-2.5 rounded-xl text-[11px] font-mono ${
                    configMessage.status === "success"
                      ? "bg-emerald-950/20 border border-emerald-500/20 text-emerald-400"
                      : "bg-red-950/20 border border-red-500/20 text-red-400"
                  }`}
                >
                  {configMessage.text}
                </div>
              )}

              <div className="flex justify-between items-center flex-wrap gap-2 pt-1 border-t border-slate-900">
                <button
                  type="button"
                  onClick={async () => {
                    setUrlInput("");
                    setKeyInput("");
                    const res = await fetch("/api/database/configure", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ url: "", key: "" }),
                    });
                    const body = await res.json();
                    setConfigMessage({ status: "success", text: body.message });
                    fetchStatus();
                  }}
                  className="text-[10px] text-slate-400 hover:text-white hover:underline transition-colors cursor-pointer"
                >
                  Reset to Auto Sandbox Backup Mode
                </button>
                <button
                  type="submit"
                  disabled={configuring}
                  className="text-[11px] font-mono bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-5 py-2 rounded-xl font-bold transition-all shadow cursor-pointer"
                >
                  {configuring ? "Syncing Secrets..." : "💾 Update API Credentials"}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
