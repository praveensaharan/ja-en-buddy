import { useState, useRef, useEffect } from "react";
import { useTranslations, useCreateTranslation } from "@/hooks/use-translations";
import { ChatBubble } from "@/components/ChatBubble";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Sparkles, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function ChatPage() {
  const { data: translations, isLoading: isLoadingHistory } = useTranslations();
  const { mutate: sendMessage, isPending: isSending } = useCreateTranslation();
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [translations, isSending]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isSending) return;
    
    sendMessage(input, {
      onSuccess: () => setInput(""),
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] md:h-[calc(100vh-6rem)] relative">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold font-display">Translation Chat</h2>
          <p className="text-muted-foreground">Practice your Japanese with AI assistance</p>
        </div>
        <div className="hidden md:flex items-center gap-2 text-xs font-medium bg-secondary px-3 py-1.5 rounded-full text-muted-foreground border border-border/50">
          <Sparkles className="w-3 h-3 text-accent" />
          <span>AI Powered Translations</span>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-hidden bg-white/50 dark:bg-slate-950/30 rounded-3xl border border-white/20 shadow-inner flex flex-col relative backdrop-blur-sm">
        <ScrollArea className="flex-1 p-4 md:p-6">
          {isLoadingHistory ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary/50" />
              <p className="text-muted-foreground text-sm">Loading history...</p>
            </div>
          ) : translations?.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 py-20 opacity-50">
              <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center">
                <Sparkles className="w-10 h-10 text-muted-foreground" />
              </div>
              <div className="text-center max-w-xs">
                <h3 className="font-semibold text-lg">No messages yet</h3>
                <p className="text-sm text-muted-foreground mt-1">Start typing in English or Japanese to begin your learning journey.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-6 pb-4">
              {translations?.map((t) => (
                <ChatBubble key={t.id} data={t} />
              ))}
              {isSending && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }} 
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-end gap-3 opacity-70"
                >
                  <div className="bg-muted p-4 rounded-2xl rounded-tr-sm">
                    <p className="text-sm">{input}</p>
                  </div>
                  <div className="flex items-end">
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s] mx-1" />
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
                  </div>
                </motion.div>
              )}
              <div ref={scrollRef} />
            </div>
          )}
        </ScrollArea>

        {/* Input Area */}
        <div className="p-4 bg-background/80 backdrop-blur-md border-t border-border/50">
          <form onSubmit={handleSubmit} className="relative flex items-end gap-2 max-w-3xl mx-auto">
            <div className="relative flex-1">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type in English or Japanese..."
                className="min-h-[60px] max-h-[180px] w-full resize-none rounded-2xl pl-4 pr-4 py-3 bg-secondary/50 border-border focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all scrollbar-hide"
                disabled={isSending}
              />
            </div>
            <Button 
              type="submit" 
              size="icon" 
              disabled={!input.trim() || isSending}
              className={`
                h-[60px] w-[60px] rounded-2xl shrink-0 transition-all duration-300
                ${input.trim() ? 'bg-primary shadow-lg shadow-primary/25 translate-y-0' : 'bg-muted text-muted-foreground shadow-none'}
              `}
            >
              {isSending ? <Loader2 className="w-6 h-6 animate-spin" /> : <Send className="w-6 h-6" />}
            </Button>
          </form>
          <p className="text-[10px] text-center text-muted-foreground mt-2">
            Press Enter to send, Shift + Enter for new line
          </p>
        </div>
      </div>
    </div>
  );
}
