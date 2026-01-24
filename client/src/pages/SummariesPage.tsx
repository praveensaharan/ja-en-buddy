import { useSummaries, useGenerateSummary } from "@/hooks/use-summaries";
import { SummaryCard } from "@/components/SummaryCard";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, Sparkles, BookOpenCheck } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

export default function SummariesPage() {
  const { data: summaries, isLoading } = useSummaries();
  const { mutate: generate, isPending: isGenerating } = useGenerateSummary();
  const { toast } = useToast();

  const handleGenerate = () => {
    generate(undefined, {
      onSuccess: () => {
        toast({
          title: "Summary Generated!",
          description: "Your daily learning summary is ready.",
        });
      },
      onError: (err) => {
        toast({
          title: "Generation Failed",
          description: err.message,
          variant: "destructive",
        });
      }
    });
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold font-display bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
            Daily Summaries
          </h2>
          <p className="text-muted-foreground mt-1">Review your progress and vocabulary</p>
        </div>
        <Button 
          onClick={handleGenerate} 
          disabled={isGenerating}
          size="lg"
          className="rounded-xl shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300"
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-5 w-5" />
              Generate Today's Summary
            </>
          )}
        </Button>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading your summaries...</p>
        </div>
      ) : summaries?.length === 0 ? (
        <div className="text-center py-24 bg-card border border-dashed border-border rounded-3xl">
          <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center mx-auto mb-6">
            <BookOpenCheck className="w-10 h-10 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold mb-2">No summaries yet</h3>
          <p className="text-muted-foreground max-w-sm mx-auto mb-6">
            Start chatting to generate your first learning summary. We'll extract vocabulary and grammar points for you.
          </p>
          <Button variant="outline" onClick={handleGenerate} disabled={isGenerating}>
            Try Generating Now
          </Button>
        </div>
      ) : (
        <motion.div 
          variants={container}
          initial="hidden"
          animate="show"
          className="grid gap-6"
        >
          {summaries?.map((summary) => (
            <motion.div key={summary.id} variants={item}>
              <SummaryCard summary={summary} />
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
