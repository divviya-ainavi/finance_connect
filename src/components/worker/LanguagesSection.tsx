import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Plus } from "lucide-react";
import { useState } from "react";

const COMMON_LANGUAGES = [
  "English",
  "Spanish",
  "French",
  "German",
  "Italian",
  "Portuguese",
  "Polish",
  "Romanian",
  "Arabic",
  "Mandarin",
  "Hindi",
  "Other",
];

const PROFICIENCY_LEVELS = ["basic", "intermediate", "fluent", "native"];

interface Language {
  name: string;
  written: string;
  spoken: string;
}

interface LanguagesSectionProps {
  languages: Language[];
  onLanguageAdd: (language: Language) => void;
  onLanguageRemove: (index: number) => void;
  onLanguageChange: (index: number, field: keyof Language, value: string) => void;
}

export const LanguagesSection = ({
  languages,
  onLanguageAdd,
  onLanguageRemove,
  onLanguageChange,
}: LanguagesSectionProps) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newLanguage, setNewLanguage] = useState<Language>({
    name: "",
    written: "basic",
    spoken: "basic",
  });

  const handleAddLanguage = () => {
    if (newLanguage.name) {
      onLanguageAdd(newLanguage);
      setNewLanguage({ name: "", written: "basic", spoken: "basic" });
      setShowAddForm(false);
    }
  };

  return (
    <div className="space-y-4">
      {languages.map((language, index) => (
        <div key={index} className="p-4 border rounded-lg space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">{language.name}</h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onLanguageRemove(index)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm">Written Proficiency</Label>
              <Select
                value={language.written}
                onValueChange={(value) => onLanguageChange(index, "written", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PROFICIENCY_LEVELS.map((level) => (
                    <SelectItem key={level} value={level}>
                      {level.charAt(0).toUpperCase() + level.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm">Spoken Proficiency</Label>
              <Select
                value={language.spoken}
                onValueChange={(value) => onLanguageChange(index, "spoken", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PROFICIENCY_LEVELS.map((level) => (
                    <SelectItem key={level} value={level}>
                      {level.charAt(0).toUpperCase() + level.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      ))}

      {showAddForm ? (
        <div className="p-4 border rounded-lg space-y-3">
          <Label>Select Language</Label>
          <Select
            value={newLanguage.name}
            onValueChange={(value) => setNewLanguage({ ...newLanguage, name: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Choose a language" />
            </SelectTrigger>
            <SelectContent>
              {COMMON_LANGUAGES.map((lang) => (
                <SelectItem key={lang} value={lang}>
                  {lang}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm">Written Proficiency</Label>
              <Select
                value={newLanguage.written}
                onValueChange={(value) =>
                  setNewLanguage({ ...newLanguage, written: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PROFICIENCY_LEVELS.map((level) => (
                    <SelectItem key={level} value={level}>
                      {level.charAt(0).toUpperCase() + level.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm">Spoken Proficiency</Label>
              <Select
                value={newLanguage.spoken}
                onValueChange={(value) =>
                  setNewLanguage({ ...newLanguage, spoken: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PROFICIENCY_LEVELS.map((level) => (
                    <SelectItem key={level} value={level}>
                      {level.charAt(0).toUpperCase() + level.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleAddLanguage}>Add Language</Button>
            <Button variant="outline" onClick={() => setShowAddForm(false)}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <Button variant="outline" onClick={() => setShowAddForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Language
        </Button>
      )}
    </div>
  );
};
