import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Plus } from "lucide-react";
import { useState } from "react";

const QUALIFICATION_TYPES = [
  { value: "aat_level_2", label: "AAT Level 2" },
  { value: "aat_level_3", label: "AAT Level 3" },
  { value: "aat_level_4", label: "AAT Level 4" },
  { value: "acca_part_qualified", label: "ACCA (Part-Qualified)" },
  { value: "acca_qualified", label: "ACCA (Qualified)" },
  { value: "cima_part_qualified", label: "CIMA (Part-Qualified)" },
  { value: "cima_qualified", label: "CIMA (Qualified)" },
  { value: "aca_part_qualified", label: "ACA (Part-Qualified)" },
  { value: "aca_qualified", label: "ACA (Qualified)" },
  { value: "degree", label: "Degree" },
  { value: "masters", label: "Masters" },
  { value: "other", label: "Other" },
];

interface Qualification {
  type: string;
  details: string;
  year: number | null;
}

interface QualificationsSectionProps {
  qualifications: Qualification[];
  onQualificationAdd: (qualification: Qualification) => void;
  onQualificationRemove: (index: number) => void;
}

export const QualificationsSection = ({
  qualifications,
  onQualificationAdd,
  onQualificationRemove,
}: QualificationsSectionProps) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newQualification, setNewQualification] = useState<Qualification>({
    type: "",
    details: "",
    year: null,
  });

  const handleAddQualification = () => {
    if (newQualification.type) {
      onQualificationAdd(newQualification);
      setNewQualification({ type: "", details: "", year: null });
      setShowAddForm(false);
    }
  };

  const getQualificationLabel = (type: string) => {
    return QUALIFICATION_TYPES.find((q) => q.value === type)?.label || type;
  };

  return (
    <div className="space-y-4">
      {qualifications.map((qualification, index) => (
        <div key={index} className="p-4 border rounded-lg">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <h4 className="font-medium">{getQualificationLabel(qualification.type)}</h4>
              {qualification.details && (
                <p className="text-sm text-muted-foreground">{qualification.details}</p>
              )}
              {qualification.year && (
                <p className="text-sm text-muted-foreground">Obtained: {qualification.year}</p>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onQualificationRemove(index)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}

      {showAddForm ? (
        <div className="p-4 border rounded-lg space-y-4">
          <div className="space-y-2">
            <Label>Qualification Type</Label>
            <Select
              value={newQualification.type}
              onValueChange={(value) =>
                setNewQualification({ ...newQualification, type: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select qualification type" />
              </SelectTrigger>
              <SelectContent>
                {QUALIFICATION_TYPES.map((qual) => (
                  <SelectItem key={qual.value} value={qual.value}>
                    {qual.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Details (optional)</Label>
            <Input
              placeholder="e.g., Institution name, specialization"
              value={newQualification.details}
              onChange={(e) =>
                setNewQualification({ ...newQualification, details: e.target.value })
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Year Obtained (optional)</Label>
            <Input
              type="number"
              placeholder="e.g., 2020"
              min="1950"
              max={new Date().getFullYear()}
              value={newQualification.year || ""}
              onChange={(e) =>
                setNewQualification({
                  ...newQualification,
                  year: e.target.value ? parseInt(e.target.value) : null,
                })
              }
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={handleAddQualification}>Add Qualification</Button>
            <Button variant="outline" onClick={() => setShowAddForm(false)}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <Button variant="outline" onClick={() => setShowAddForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Qualification
        </Button>
      )}
    </div>
  );
};
