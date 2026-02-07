import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Calendar, MessageSquare, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChatBubble } from "@/components/ChatBubble";

export default function HistoryPage() {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const { data: history, isLoading: isLoadingHistory } = useQuery({
    queryKey: ["/api/translations/history"],
    queryFn: async () => {
      const res = await fetch("/api/translations/history", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch history");
      return res.json() as Promise<{ date: string; count: number }[]>;
    },
  });

  const { data: dayTranslations, isLoading: isLoadingDay } = useQuery({
    queryKey: ["/api/translations/date", selectedDate],
    queryFn: async () => {
      if (!selectedDate) return [];
      const res = await fetch(`/api/translations/date/${selectedDate}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch translations");
      return res.json();
    },
    enabled: !!selectedDate,
  });

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] md:h-[calc(100vh-6rem)]">
      <div className="mb-6">
        <h2 className="text-2xl font-bold font-display">Translation History</h2>
        <p className="text-muted-foreground">View your past conversations by day</p>
      </div>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 overflow-hidden">
        {/* Calendar/List View */}
        <Card className="md:col-span-1 p-4 overflow-hidden flex flex-col">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Select a Day
          </h3>
          
          <ScrollArea className="flex-1">
            {isLoadingHistory ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : history?.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No history yet</p>
            ) : (
              <div className="space-y-2">
                {history?.map((day) => (
                  <button
                    key={day.date}
                    onClick={() => setSelectedDate(day.date)}
                    className={`w-full text-left p-3 rounded-lg border transition-all ${
                      selectedDate === day.date
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-secondary/50 hover:bg-secondary border-border"
                    }`}
                  >
                    <div className="font-medium">
                      {format(new Date(day.date), "MMM dd, yyyy")}
                    </div>
                    <div className="text-xs opacity-80 flex items-center gap-1 mt-1">
                      <MessageSquare className="w-3 h-3" />
                      {day.count} translation{day.count !== 1 ? "s" : ""}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </Card>

        {/* Chat View */}
        <Card className="md:col-span-2 p-6 overflow-hidden flex flex-col">
          {!selectedDate ? (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Select a day to view translations</p>
              </div>
            </div>
          ) : isLoadingDay ? (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <div className="mb-4 pb-4 border-b">
                <h3 className="font-semibold text-lg">
                  {format(new Date(selectedDate), "EEEE, MMMM dd, yyyy")}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {dayTranslations?.length || 0} translation{dayTranslations?.length !== 1 ? "s" : ""}
                </p>
              </div>
              
              <ScrollArea className="flex-1">
                <div className="space-y-6 pr-4">
                  {dayTranslations?.map((t: any) => (
                    <ChatBubble key={t.id} data={t} />
                  ))}
                </div>
              </ScrollArea>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
