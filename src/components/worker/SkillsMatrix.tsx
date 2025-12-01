import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";

const SKILL_CATEGORIES = {
  bookkeeping: [
    "Bank reconciliations",
    "Ledger maintenance",
    "AP/AR cycles",
  ],
  payroll: [
    "PAYE, NI, statutory payments",
    "Pensions, auto-enrolment",
  ],
  management_accounting: [
    "Month-end close",
    "Accruals & prepayments",
    "Budgeting & forecasting",
    "Board pack reporting",
  ],
  credit_control: [
    "Debt chasing",
    "Credit checks",
  ],
  controller_fc: [
    "Group consolidation",
    "Cashflow forecasting",
    "Financial modelling",
  ],
};

const SKILL_LABELS = ["No experience", "Basic", "Intermediate", "Proficient", "Expert"];

interface SkillsMatrixProps {
  skills: Record<string, number>;
  onSkillChange: (skillName: string, level: number) => void;
}

export const SkillsMatrix = ({ skills, onSkillChange }: SkillsMatrixProps) => {
  return (
    <div className="space-y-6">
      {Object.entries(SKILL_CATEGORIES).map(([category, skillList]) => (
        <div key={category} className="space-y-4">
          <h4 className="font-medium text-sm uppercase text-muted-foreground">
            {category.replace(/_/g, " ")}
          </h4>
          {skillList.map((skill) => (
            <div key={skill} className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm">{skill}</Label>
                <span className="text-sm font-medium">
                  {SKILL_LABELS[skills[skill] || 0]}
                </span>
              </div>
              <Slider
                value={[skills[skill] || 0]}
                onValueChange={(value) => onSkillChange(skill, value[0])}
                max={4}
                step={1}
                className="w-full"
              />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};
