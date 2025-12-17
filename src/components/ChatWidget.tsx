// src/components/ChatWidget.tsx
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X } from "lucide-react";
import ChatAssistant from "./ChatAssistant";

type Props = {
  initialSystemPrompt?: string;
  // optional: startOpen prop if you want widget open by default
  startOpen?: boolean;
};

export default function ChatWidget({ initialSystemPrompt = "", startOpen = false }: Props) {
  const [open, setOpen] = useState<boolean>(startOpen);

  // prevent body scroll when chat open on small screens
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <>
      {/* Floating bubble */}
      <button
        aria-label={open ? "Close chat" : "Open chat"}
        onClick={() => setOpen((s) => !s)}
        className="chat-bubble fixed z-[60] right-5 bottom-5 w-14 h-14 rounded-full shadow-lg flex items-center justify-center bg-gradient-to-br from-indigo-600 to-indigo-400 text-white ring-2 ring-white/20 hover:scale-105 active:scale-95 focus:outline-none focus:ring-4 focus:ring-indigo-300"
      >
        <AnimatePresence initial={false}>
          {!open ? (
            <motion.span key="open" initial={{ rotate: -10, scale: 0.9 }} animate={{ rotate: 0, scale: 1 }} exit={{ opacity: 0 }} >
              <MessageCircle className="w-6 h-6" />
            </motion.span>
          ) : (
            <motion.span key="close" initial={{ rotate: 10, scale: 0.9 }} animate={{ rotate: 0, scale: 1 }} exit={{ opacity: 0 }}>
              <X className="w-6 h-6" />
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      {/* Panel */}
      <AnimatePresence>
        {open && (
          <motion.aside
            initial={{ opacity: 0, y: 30, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.98 }}
            transition={{ duration: 0.18 }}
            className="chat-panel fixed z-[60] right-5 bottom-20 w-[360px] max-w-[92vw] md:w-[420px] bg-white rounded-xl shadow-2xl overflow-hidden"
            role="dialog"
            aria-modal="false"
            aria-label="Chat assistant"
          >
            <div className="flex items-center justify-between px-3 py-2 border-b">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-indigo-600" />
                <div className="text-sm font-medium">Assistant</div>
              </div>
              <div>
                <button
                  onClick={() => setOpen(false)}
                  aria-label="Close chat"
                  className="p-1 rounded hover:bg-slate-100"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-3" style={{ height: "420px", maxHeight: "70vh", boxSizing: "border-box" }}>
              <ChatAssistant initialSystemPrompt={initialSystemPrompt} />
            </div>

            {/* small footer (optional quick links) */}
            <div className="px-3 py-2 border-t text-xs text-slate-500">
              Tip: ask the assistant to explain the diagnosis or request home care tips.
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}

