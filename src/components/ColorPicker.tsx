import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Plus } from "lucide-react";

interface ColorPickerProps {
  colors: string[];
  onChange: (colors: string[]) => void;
}

export const ColorPicker = ({ colors, onChange }: ColorPickerProps) => {
  const [newColor, setNewColor] = useState("#000000");

  const addColor = () => {
    if (!colors.includes(newColor)) {
      onChange([...colors, newColor]);
    }
  };

  const removeColor = (colorToRemove: string) => {
    onChange(colors.filter(c => c !== colorToRemove));
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Input
          type="color"
          value={newColor}
          onChange={(e) => setNewColor(e.target.value)}
          className="w-20 h-10 cursor-pointer"
        />
        <Button type="button" onClick={addColor} size="sm">
          <Plus className="w-4 h-4 mr-1" />
          Agregar Color
        </Button>
      </div>
      
      <div className="flex flex-wrap gap-2">
        {colors.map((color, index) => (
          <div
            key={index}
            className="relative group"
          >
            <div
              className="w-12 h-12 rounded-lg border-2 border-border shadow-sm"
              style={{ backgroundColor: color }}
            />
            <Button
              type="button"
              size="icon"
              variant="destructive"
              className="absolute -top-2 -right-2 w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => removeColor(color)}
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};