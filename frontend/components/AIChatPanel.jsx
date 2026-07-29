import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, HelpCircle, Activity } from "lucide-react";

export default function AIChatPanel() {
  const [messages, setMessages] = useState([
    {
      id: "init",
      sender: "bot",
      text: "👋 Welcome to the SwiftRescue Paramedic Assistant. I am equipped with clinical first-aid guidelines. Ask me any medical procedures or check your current ambulance state! \n\n*Quick tip: Click any category preset below for immediate steps.*",
      timestamp: new Date().toLocaleTimeString(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef(null);

  const presets = [
    { label: "Cardiac Arrest 💔", prompt: "What should I do in a cardiac arrest? Give me step-by-step CPR instructions." },
    { label: "Stop Bleeding 🔴", prompt: "How to stop heavy blood loss from a severe leg laceration?" },
    { label: "Identify Stroke 🧠", prompt: "F.A.S.T. stroke assessment procedure guide." },
    { label: "Car Accident 🚗", prompt: "A road accident just happened. How do I secure the scene and help victims safely?" },
  ];

  // Auto-scroll chat body
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async (textToSend) => {
    if (!textToSend.trim()) return;

    const userMsg = {
      id: `usr_${Date.now()}`,
      sender: "user",
      text: textToSend,
      timestamp: new Date().toLocaleTimeString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);
    setInputValue("");

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: textToSend,
          history: messages.map((m) => ({ sender: m.sender, text: m.text })),
        }),
      });

      if (!response.ok) {
        throw new Error("API server returned non-200 state");
      }

      const data = await response.json();
      const botMsg = {
        id: `bot_${Date.now()}`,
        sender: "bot",
        text: data.text || "I was unable to synthesize a medical response. Please request ambulance dispatch immediately.",
        timestamp: new Date().toLocaleTimeString(),
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      console.error(err);
      const errMsg = {
        id: `bot_err_${Date.now()}`,
        sender: "bot",
        text: "⚠️ **Network Alert**: Connection to server AI node timed out. Please execute standard CPR and wait for the live ambulance crew en route.",
        timestamp: new Date().toLocaleTimeString(),
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  // Crude parser for basic markdown bold, highlights, headers and bullet formatting
  const renderMessageText = (text) => {
    return text.split("\n").map((line, idx) => {
      let content = line;
      let lineClass = "text-slate-300 leading-relaxed text-xs";

      // Match red emoji highlights or warnings
      if (line.includes("🚨") || line.includes("🔴") || line.includes("⚠️")) {
        lineClass += " border-l-2 border-red-500 pl-2 py-0.5 bg-red-950/20 rounded-r text-red-100";
      }

      // Check for markdown sub-headers
      if (line.startsWith("###") || line.startsWith("**")) {
        content = line.replace(/^[#\*\s]+|[#\*\s]+$/g, "");
        lineClass = "text-slate-100 font-bold text-xs mt-2.5 mb-1 flex items-center gap-1.5";
        return (
          <div key={idx} className={lineClass}>
            <Activity className="w-3.5 h-3.5 text-red-500 inline shrink-0" />
            {content}
          </div>
        );
      }

      // Format bullet lists
      if (line.startsWith("*") || line.startsWith("-") || /^\d+\./.test(line)) {
        content = line.replace(/^[\*\-\s\d\.\s]+/, "");
        lineClass = "text-slate-300 text-xs pl-4 relative my-1.5 list-disc";
        return (
          <div key={idx} className={lineClass}>
            <span className="absolute left-1.5 text-red-500">•</span>
            {content.replace(/\*\*/g, "")}
          </div>
        );
      }

      return (
        <p key={idx} className={`${lineClass} my-1`}>
          {content.replace(/\*\*/g, "")}
        </p>
      );
    });
  };

  return (
    <div id="ai-chatbot-panel" className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden flex flex-col h-[550px] shadow-2xl transition-all duration-300">
      {/* Bot Header info */}
      <div className="bg-slate-900 border-b border-slate-800 p-4 shrink-0 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-red-950/60 border border-red-900/40 rounded-xl relative">
            <Bot className="w-5 h-5 text-red-400" />
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-slate-900 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-100 font-sans">AI Medical Advisory Node</span>
              <span className="text-[9px] font-mono bg-red-955 text-red-404 px-1.5 py-0.2 rounded font-black border border-red-900/60 uppercase">
                Failsafe Active
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono block">Powered by Gemini 3.5 Flash API</span>
          </div>
        </div>

        <HelpCircle className="w-4 h-4 text-slate-500 hover:text-slate-400 transition-colors cursor-pointer" />
      </div>

      {/* Main chat dialogue scroll */}
      <div ref={scrollRef} className="flex-1 p-4 overflow-y-auto space-y-4 scrollbar-thin scrollbar-thumb-slate-800 bg-[#070b13]">
        {messages.map((m) => {
          const isBot = m.sender === "bot";
          return (
            <div
              key={m.id}
              className={`flex items-start gap-3 max-w-[85%] ${
                isBot ? "mr-auto" : "ml-auto flex-row-reverse"
              }`}
            >
              <div
                className={`p-2 rounded-lg shrink-0 border ${
                  isBot
                    ? "bg-slate-900 text-slate-200 border-slate-800"
                    : "bg-red-950/40 text-red-100 border-red-900/30"
                }`}
              >
                {isBot ? <Bot className="w-4 h-4 text-red-400" /> : <User className="w-4 h-4 text-slate-300" />}
              </div>

              <div
                className={`p-3.5 rounded-2xl relative shadow-md ${
                  isBot
                    ? "bg-slate-900/50 border border-slate-800/80 rounded-tl-none font-sans"
                    : "bg-red-500/10 border border-red-500/20 rounded-tr-none font-sans"
                }`}
              >
                {/* Custom Line text formatting */}
                <div className="space-y-1">{renderMessageText(m.text)}</div>
                
                <span className="block text-[9px] text-slate-500 mt-2 font-mono text-right font-light">
                  {m.timestamp}
                </span>
              </div>
            </div>
          );
        })}

        {/* Typing Dots element */}
        {isTyping && (
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-slate-900 text-slate-200 border border-slate-800 shrink-0">
              <Bot className="w-4 h-4 text-red-400 animate-bounce" />
            </div>
            <div className="p-3.5 bg-slate-900/40 border border-slate-800 rounded-2xl rounded-tl-none flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-bounce delay-100" />
              <span className="w-1.5 h-1.5 bg-red-400 rounded-full animate-bounce delay-200" />
              <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-bounce delay-300" />
              <span className="text-[10px] text-slate-400 font-mono pl-1">Consulting medical files...</span>
            </div>
          </div>
        )}
      </div>

      {/* Preset Emergency Prompt Chips list */}
      <div className="px-4 py-2 bg-slate-950 border-t border-slate-900 shrink-0">
        <span className="text-[10px] font-mono text-slate-400 block mb-1">Click category for quick aid:</span>
        <div className="flex flex-wrap gap-1.5">
          {presets.map((p, i) => (
            <button
              key={i}
              type="button"
              className="px-2.5 py-1 text-[11px] font-sans font-medium rounded-full bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-red-955/30 hover:border-red-900/50 transition-all duration-200 cursor-pointer"
              onClick={() => handleSend(p.prompt)}
              disabled={isTyping}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Bottom Text Submit Form box */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend(inputValue);
        }}
        className="p-3 bg-slate-900 border-t border-slate-800 shrink-0 flex items-center gap-2"
      >
        <input
          id="chatbot-msg-input"
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Type symptoms or ask: 'how to stop bleeding?'"
          className="flex-1 px-3 py-2 text-xs text-slate-100 bg-slate-950 rounded-xl border border-slate-800 focus:outline-none focus:border-red-500 placeholder-slate-500 font-sans"
          disabled={isTyping}
        />
        <button
          id="chatbot-msg-send-btn"
          type="submit"
          className="p-2 rounded-xl bg-red-600 hover:bg-red-500 text-white border border-red-500/40 cursor-pointer transition-colors"
          disabled={isTyping || !inputValue.trim()}
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
