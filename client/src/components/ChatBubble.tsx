import { motion } from "framer-motion";
import { format } from "date-fns";
import type { Translation } from "@shared/schema";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bot, User } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

interface ChatBubbleProps {
  data: Translation;
}

export function ChatBubble({ data }: ChatBubbleProps) {
  const { user } = useAuth();

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 mb-8"
    >
      {/* User Message */}
      <div className="flex items-end justify-end gap-3">
        <div className="max-w-[80%] md:max-w-[70%]">
          <div className="bg-gradient-to-br from-primary to-primary/90 text-primary-foreground p-4 rounded-2xl rounded-tr-sm shadow-lg shadow-primary/20">
            <p className="text-sm md:text-base leading-relaxed">{data.originalText}</p>
          </div>
          <div className="flex justify-end mt-1">
            <span className="text-[10px] text-muted-foreground/60 font-medium">
              {format(new Date(data.createdAt), "HH:mm")}
            </span>
          </div>
        </div>
        <Avatar className="w-8 h-8 md:w-10 md:h-10 border-2 border-background shadow-sm order-last">
          <AvatarImage src={user?.profileImageUrl || undefined} />
          <AvatarFallback className="bg-secondary text-secondary-foreground">
            <User className="w-4 h-4" />
          </AvatarFallback>
        </Avatar>
      </div>

      {/* AI Response */}
      <div className="flex items-end justify-start gap-3">
        <Avatar className="w-8 h-8 md:w-10 md:h-10 border-2 border-background shadow-sm">
          <AvatarFallback className="bg-accent text-accent-foreground">
            <Bot className="w-4 h-4" />
          </AvatarFallback>
        </Avatar>
        <div className="max-w-[90%] md:max-w-[80%] w-full">
          <div className="bg-card border border-border/50 p-0 rounded-2xl rounded-tl-sm shadow-sm overflow-hidden">
            {/* Japanese Section */}
            <div className="p-4 bg-secondary/20 border-b border-border/50">
              <span className="text-xs font-bold text-primary/70 uppercase tracking-wider mb-1 block">Japanese</span>
              <p className="text-lg md:text-xl font-medium jp-text text-foreground">{data.japanese}</p>
            </div>
            
            {/* Romaji Section */}
            <div className="px-4 py-3 bg-card border-b border-border/50">
              <span className="text-xs font-bold text-muted-foreground/70 uppercase tracking-wider mb-1 block">Romaji</span>
              <p className="text-sm md:text-base font-mono text-muted-foreground">{data.romaji}</p>
            </div>

            {/* English Section */}
            <div className="p-4 bg-card">
              <span className="text-xs font-bold text-accent/70 uppercase tracking-wider mb-1 block">English</span>
              <p className="text-sm md:text-base text-foreground leading-relaxed">{data.english}</p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
