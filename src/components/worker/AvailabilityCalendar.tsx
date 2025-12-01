import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, Info } from "lucide-react";
import { format } from "date-fns";

interface AvailabilityCalendarProps {
  availableFrom: Date | null;
  blockedDates: string[]; // ISO date strings
  onAvailableFromChange: (date: Date | null) => void;
  onBlockedDatesChange: (dates: string[]) => void;
}

export const AvailabilityCalendar = ({
  availableFrom,
  blockedDates,
  onAvailableFromChange,
  onBlockedDatesChange,
}: AvailabilityCalendarProps) => {
  const [showCalendar, setShowCalendar] = useState(false);

  const toggleBlockedDate = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    if (blockedDates.includes(dateStr)) {
      onBlockedDatesChange(blockedDates.filter((d) => d !== dateStr));
    } else {
      onBlockedDatesChange([...blockedDates, dateStr]);
    }
  };

  const isBlocked = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    return blockedDates.includes(dateStr);
  };

  return (
    <div className="space-y-4">
      {/* Available From Date */}
      <div className="space-y-2">
        <Label>When do you become available for new work?</Label>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setShowCalendar(!showCalendar)}
            className="w-full justify-start text-left font-normal"
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {availableFrom ? format(availableFrom, "PPP") : "Available immediately"}
          </Button>
          {availableFrom && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onAvailableFromChange(null)}
            >
              Clear
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          Set a future date if you're not available immediately
        </p>
      </div>

      {/* Calendar for selecting available from date */}
      {showCalendar && (
        <div className="border rounded-lg p-4 bg-card">
          <Calendar
            mode="single"
            selected={availableFrom || undefined}
            onSelect={(date) => {
              onAvailableFromChange(date || null);
              setShowCalendar(false);
            }}
            disabled={(date) => date < new Date()}
            className="pointer-events-auto"
          />
        </div>
      )}

      {/* Blocked Dates Section */}
      <div className="space-y-2">
        <Label>Unavailable Dates (Optional)</Label>
        <p className="text-xs text-muted-foreground mb-3">
          Mark specific dates when you're unavailable (holidays, commitments, etc.)
        </p>
        
        <div className="border rounded-lg p-4 bg-card">
          <Calendar
            mode="multiple"
            selected={blockedDates.map((d) => new Date(d))}
            onSelect={(dates) => {
              if (!dates) {
                onBlockedDatesChange([]);
                return;
              }
              const dateStrs = dates.map((d) => format(d, "yyyy-MM-dd"));
              onBlockedDatesChange(dateStrs);
            }}
            disabled={(date) => date < new Date()}
            className="pointer-events-auto"
          />
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 p-3 bg-muted rounded-md text-xs">
          <Info className="h-4 w-4 text-muted-foreground" />
          <div className="space-x-4">
            <span className="inline-flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-primary"></div>
              Selected dates unavailable
            </span>
          </div>
        </div>

        {/* Blocked Dates Summary */}
        {blockedDates.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Unavailable on ({blockedDates.length} dates):</p>
            <div className="flex flex-wrap gap-1">
              {blockedDates.slice(0, 10).map((date) => (
                <Badge key={date} variant="secondary" className="text-xs">
                  {format(new Date(date), "MMM d")}
                </Badge>
              ))}
              {blockedDates.length > 10 && (
                <Badge variant="outline" className="text-xs">
                  +{blockedDates.length - 10} more
                </Badge>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
