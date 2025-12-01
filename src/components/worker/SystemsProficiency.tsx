import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Plus } from "lucide-react";
import { useState } from "react";

const COMMON_SYSTEMS = [
  "Xero",
  "Sage 50",
  "Sage 200",
  "SAP",
  "Oracle NetSuite",
  "QuickBooks",
  "Excel (Advanced)",
  "BrightPay",
];

const PROFICIENCY_LABELS = ["None", "Basic", "Intermediate", "Proficient", "Expert"];

interface SystemsProficiencyProps {
  systems: Record<string, number>;
  onSystemChange: (systemName: string, level: number) => void;
  onSystemRemove: (systemName: string) => void;
}

export const SystemsProficiency = ({
  systems,
  onSystemChange,
  onSystemRemove,
}: SystemsProficiencyProps) => {
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customSystem, setCustomSystem] = useState("");

  const handleAddCustomSystem = () => {
    if (customSystem.trim() && !systems[customSystem]) {
      onSystemChange(customSystem.trim(), 1);
      setCustomSystem("");
      setShowCustomInput(false);
    }
  };

  const allSystems = [
    ...COMMON_SYSTEMS,
    ...Object.keys(systems).filter((s) => !COMMON_SYSTEMS.includes(s)),
  ];

  return (
    <div className="space-y-4">
      {allSystems.map((system) => {
        const level = systems[system] || 0;
        if (level === 0 && !COMMON_SYSTEMS.includes(system)) return null;

        return (
          <div key={system} className="space-y-2 p-3 border rounded-lg">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">{system}</Label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {PROFICIENCY_LABELS[level]}
                </span>
                {!COMMON_SYSTEMS.includes(system) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onSystemRemove(system)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
            <Slider
              value={[level]}
              onValueChange={(value) => onSystemChange(system, value[0])}
              max={4}
              step={1}
              className="w-full"
            />
          </div>
        );
      })}

      {showCustomInput ? (
        <div className="flex gap-2">
          <Input
            placeholder="Enter system name"
            value={customSystem}
            onChange={(e) => setCustomSystem(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleAddCustomSystem()}
          />
          <Button onClick={handleAddCustomSystem}>Add</Button>
          <Button variant="outline" onClick={() => setShowCustomInput(false)}>
            Cancel
          </Button>
        </div>
      ) : (
        <Button variant="outline" onClick={() => setShowCustomInput(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Custom System
        </Button>
      )}
    </div>
  );
};
