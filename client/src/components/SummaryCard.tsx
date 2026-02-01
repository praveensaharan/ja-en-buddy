import { useState } from "react";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import type { Summary } from "@shared/schema";
import { Calendar, ChevronDown, ChevronUp, Book } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface SummaryCardProps {
  summary: Summary;
}

export function SummaryCard({ summary }: SummaryCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const vocabList = summary.vocab as any[] | null;

  return (
    <Card className="overflow-hidden border-border/60 shadow-sm hover:shadow-md transition-shadow duration-300">
      <div 
        className="p-5 flex items-center justify-between cursor-pointer hover:bg-secondary/30 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">
              Learning Summary
            </h3>
            <p className="text-muted-foreground text-sm">
              {format(new Date(summary.date), "MMMM do, yyyy")}
            </p>
          </div>
        </div>
        <button className="text-muted-foreground hover:text-foreground transition-colors p-2">
          {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </button>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="p-6 pt-0 border-t border-border/50">
              <div className="prose prose-sm md:prose-base dark:prose-invert max-w-none mt-6 prose-headings:font-display prose-headings:text-primary">
                <ReactMarkdown>{summary.content}</ReactMarkdown>
              </div>

              {vocabList && vocabList.length > 0 && (
                <div className="mt-8 bg-secondary/30 rounded-xl p-5 border border-border/50">
                  <div className="flex items-center gap-2 mb-4">
                    <Book className="w-4 h-4 text-accent" />
                    <h4 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Key Vocabulary</h4>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {vocabList.map((item, idx) => (
                      <Badge 
                        key={idx} 
                        variant="secondary" 
                        className="text-sm py-1 px-3 bg-background border border-border/50 hover:border-primary/50 transition-colors"
                      >
                        {typeof item === 'string' ? item : `${item.word} (${item.reading}) - ${item.meaning}`}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}
