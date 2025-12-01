import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

interface RateExpectationsProps {
  rateMin: number;
  rateMax: number;
  negotiable: boolean;
  onRateMinChange: (value: number) => void;
  onRateMaxChange: (value: number) => void;
  onNegotiableChange: (value: boolean) => void;
}

export const RateExpectations = ({
  rateMin,
  rateMax,
  negotiable,
  onRateMinChange,
  onRateMaxChange,
  onNegotiableChange,
}: RateExpectationsProps) => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Minimum Hourly Rate (£)</Label>
          <Input
            type="number"
            min="0"
            step="0.5"
            value={rateMin || ""}
            onChange={(e) => onRateMinChange(parseFloat(e.target.value))}
            placeholder="e.g. 18"
          />
        </div>
        <div className="space-y-2">
          <Label>Maximum Hourly Rate (£)</Label>
          <Input
            type="number"
            min="0"
            step="0.5"
            value={rateMax || ""}
            onChange={(e) => onRateMaxChange(parseFloat(e.target.value))}
            placeholder="e.g. 25"
          />
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <Switch
          checked={negotiable}
          onCheckedChange={onNegotiableChange}
          id="rate-negotiable"
        />
        <Label htmlFor="rate-negotiable">Rate is negotiable</Label>
      </div>
      {rateMin > 0 && rateMax > 0 && (
        <p className="text-sm text-muted-foreground">
          Businesses will see: £{rateMin}–£{rateMax}/hr {negotiable && "(negotiable)"}
        </p>
      )}
    </div>
  );
};
