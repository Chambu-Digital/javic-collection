"use client";

import { useState, useEffect, useRef } from "react";

const WHATSAPP_NUMBER = "254723277306";

const QUICK_REPLIES = [
  { label: "Innerwear",    text: "Hi! I'd like to browse your innerwear collection 👙" },
  { label: "Baby Clothing",text: "Hi! I'm looking for baby clothing 👶" },
  { label: "Sleepwear",    text: "Hi! Tell me about your sleepwear options 🌙" },
  { label: "Delivery",     text: "Hi! What are your delivery options? 🚚" },
];

type ChatState = "idle" | "typing" | "greeted" | "redirecting";

export default function WhatsAppFloat() {
  const [isOpen, setIsOpen]       = useState(false);
  const [chatState, setChatState] = useState<ChatState>("idle");
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && chatState === "idle") {
      setChatState("typing");
      const t = setTimeout(() => setChatState("greeted"), 1800);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && chatState === "greeted") {
      inputRef.current?.focus();
    }
  }, [isOpen, chatState]);

  const openWhatsApp = (text: string) => {
    setChatState("redirecting");
    const encoded = encodeURIComponent(text);
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encoded}`, "_blank");
    setTimeout(() => {
      setIsOpen(false);
      setChatState("idle");
      setInputValue("");
    }, 1200);
  };

  const handleSend = () => {
    const text = inputValue.trim();
    if (!text) return;
    openWhatsApp(text);
  };

  const now = new Date();
  const timeStr = `${now.getHours()}:${String(now.getMinutes()).padStart(2, "0")}`;

  return (
    <>
      <style>{`
        @keyframes wa-bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30%            { transform: translateY(-5px); }
        }
        @keyframes wa-pulse {
          0%, 100% { transform: scale(1); }
          50%       { transform: scale(1.15); }
        }
        @keyframes wa-fade-up {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .wa-dot { animation: wa-bounce 1.2s infinite; }
        .wa-dot:nth-child(2) { animation-delay: 0.2s; }
        .wa-dot:nth-child(3) { animation-delay: 0.4s; }
        .wa-pulse   { animation: wa-pulse 2s infinite; }
        .wa-fade-up { animation: wa-fade-up 0.3s ease forwards; }
        .wa-input:focus { outline: none; }
        .wa-qr:hover  { background: #fff0f6 !important; border-color: #FF0080 !important; color: #CC0066 !important; }
        .wa-fab:hover { transform: scale(1.08) !important; box-shadow: 0 6px 20px rgba(255,0,128,0.5) !important; }
      `}</style>

      <div style={{
        position: "fixed", bottom: "24px", right: "24px", zIndex: 9999,
        display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "12px",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}>

        {/* Chat popup */}
        {isOpen && (
          <div className="wa-fade-up" style={{
            width: "320px", borderRadius: "16px", overflow: "hidden",
            boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
            border: "0.5px solid rgba(0,0,0,0.08)", background: "#fff",
          }}>
            {/* Header */}
            <div style={{
              background: "linear-gradient(135deg, #990044, #FF0080)",
              padding: "14px 16px", display: "flex", alignItems: "center", gap: "12px",
            }}>
              <div style={{
                width: "42px", height: "42px", borderRadius: "50%", overflow: "hidden",
                flexShrink: 0, border: "2px solid rgba(255,255,255,0.3)",
              }}>
                <img src="/javic-logo1.png" alt="Javic" style={{ width: "100%", height: "100%", objectFit: "contain" }}
                  onError={(e) => { (e.target as HTMLImageElement).src = "/javiclogo.png" }} />
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ color: "#fff", fontSize: "15px", fontWeight: 600, margin: 0, letterSpacing: "0.05em" }}>JAVIC COLLECTION</p>
                <p style={{ color: "rgba(255,255,255,0.75)", fontSize: "12px", margin: 0 }}>
                  {chatState === "redirecting" ? "Opening WhatsApp..." : "Typically replies instantly"}
                </p>
              </div>
              <button onClick={() => setIsOpen(false)} style={{
                background: "none", border: "none", cursor: "pointer",
                color: "rgba(255,255,255,0.8)", fontSize: "18px", padding: "4px", lineHeight: 1,
              }}>✕</button>
            </div>

            {/* Chat body */}
            <div style={{ background: "#f9f0f4", padding: "16px 12px 12px", minHeight: "160px" }}>

              {/* Typing indicator */}
              {chatState === "typing" && (
                <div style={{
                  background: "#fff", borderRadius: "8px 8px 8px 2px",
                  padding: "10px 14px", display: "inline-flex", gap: "5px",
                  alignItems: "center", boxShadow: "0 1px 2px rgba(0,0,0,0.12)",
                }}>
                  {[0, 1, 2].map(i => (
                    <div key={i} className="wa-dot" style={{
                      width: "7px", height: "7px", borderRadius: "50%", background: "#CC0066",
                    }} />
                  ))}
                </div>
              )}

              {/* Greeting + actions */}
              {(chatState === "greeted" || chatState === "redirecting") && (
                <>
                  <div className="wa-fade-up" style={{
                    background: "#fff", borderRadius: "8px 8px 8px 2px",
                    padding: "10px 12px", maxWidth: "85%", display: "inline-block",
                    boxShadow: "0 1px 2px rgba(0,0,0,0.12)", marginBottom: "10px",
                  }}>
                    <p style={{ fontSize: "11px", fontWeight: 700, color: "#CC0066", margin: "0 0 4px", letterSpacing: "0.08em" }}>JAVIC COLLECTION</p>
                    <p style={{ fontSize: "14px", color: "#303030", margin: 0, lineHeight: 1.5 }}>
                      Hello! Welcome to Javic Collection 👗<br />
                      How may I help you today?
                    </p>
                    <p style={{ fontSize: "11px", color: "#aaa", textAlign: "right", margin: "4px 0 0" }}>{timeStr}</p>
                  </div>

                  {/* Quick reply chips */}
                  {chatState === "greeted" && (
                    <div className="wa-fade-up" style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                      {QUICK_REPLIES.map(qr => (
                        <button key={qr.label} className="wa-qr" onClick={() => openWhatsApp(qr.text)} style={{
                          background: "#fff", border: "1px solid #FF0080",
                          color: "#990044", borderRadius: "16px",
                          padding: "6px 12px", fontSize: "12px",
                          cursor: "pointer", transition: "all 0.15s",
                        }}>
                          {qr.label}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Redirecting */}
                  {chatState === "redirecting" && (
                    <div className="wa-fade-up" style={{
                      display: "flex", alignItems: "center", gap: "8px",
                      background: "#fff", borderRadius: "8px", padding: "10px 12px",
                      boxShadow: "0 1px 2px rgba(0,0,0,0.08)", fontSize: "13px", color: "#555",
                    }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="#25D366">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                        <path d="M11.999 2C6.477 2 2 6.477 2 12c0 1.99.574 3.844 1.564 5.408L2 22l4.737-1.522A9.963 9.963 0 0012 22c5.523 0 10-4.477 10-10S17.522 2 11.999 2zm0 18a7.963 7.963 0 01-4.065-1.115l-.29-.173-3.014.968.997-2.932-.19-.301A7.96 7.96 0 014 12c0-4.418 3.582-8 8-8s8 3.582 8 8-3.582 8-8 8z"/>
                      </svg>
                      Opening WhatsApp for you...
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Input row */}
            <div style={{
              background: "#f0e6ec", padding: "8px 10px",
              display: "flex", alignItems: "center", gap: "8px",
            }}>
              <input
                ref={inputRef}
                className="wa-input"
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSend()}
                placeholder={
                  chatState === "redirecting" ? "Continuing on WhatsApp..." :
                  chatState === "typing"      ? "Just a moment..."          :
                  "Type a message..."
                }
                disabled={chatState !== "greeted"}
                style={{
                  flex: 1, border: "none", borderRadius: "20px",
                  padding: "9px 14px", fontSize: "14px",
                  background: chatState === "greeted" ? "#fff" : "#e8d8e0",
                  color: "#303030", transition: "background 0.2s",
                }}
              />
              <button onClick={handleSend} disabled={chatState !== "greeted"} style={{
                width: "38px", height: "38px", borderRadius: "50%",
                background: chatState === "greeted" ? "linear-gradient(135deg, #CC0066, #FF0080)" : "#ccc",
                border: "none", cursor: chatState === "greeted" ? "pointer" : "default",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0, transition: "background 0.2s",
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                  <path d="M2 21l21-9L2 3v7l15 2-15 2z"/>
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* FAB button */}
        <div style={{ position: "relative" }}>
          <button
            className="wa-fab"
            onClick={() => setIsOpen(prev => !prev)}
            aria-label="Chat with Javic Collection on WhatsApp"
            style={{
              width: "60px", height: "60px", borderRadius: "50%",
              background: "linear-gradient(135deg, #CC0066, #FF0080)",
              border: "none", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 4px 16px rgba(255,0,128,0.45)",
              transition: "transform 0.2s, box-shadow 0.2s",
            }}
          >
            <svg width="30" height="30" viewBox="0 0 24 24" fill="white">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
              <path d="M11.999 2C6.477 2 2 6.477 2 12c0 1.99.574 3.844 1.564 5.408L2 22l4.737-1.522A9.963 9.963 0 0012 22c5.523 0 10-4.477 10-10S17.522 2 11.999 2zm0 18a7.963 7.963 0 01-4.065-1.115l-.29-.173-3.014.968.997-2.932-.19-.301A7.96 7.96 0 014 12c0-4.418 3.582-8 8-8s8 3.582 8 8-3.582 8-8 8z"/>
            </svg>
          </button>

          {/* Notification dot */}
          {!isOpen && chatState === "idle" && (
            <div className="wa-pulse" style={{
              position: "absolute", top: "-4px", right: "-4px",
              width: "18px", height: "18px", borderRadius: "50%",
              background: "#E8C87A", color: "#1a0010",
              fontSize: "11px", fontWeight: 700,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>1</div>
          )}
        </div>
      </div>
    </>
  );
}
