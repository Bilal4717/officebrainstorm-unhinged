import { cn } from "@/lib/utils";
import { Character } from "@/lib/characters";
import { Check } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface CharacterCardProps {
  character: Character;
  isSelected: boolean;
  onSelect: (characterId: string) => void;
  disabled?: boolean;
}

export function CharacterCard({ character, isSelected, onSelect, disabled }: CharacterCardProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              "border-2 rounded-lg p-4 cursor-pointer transition-all hover:shadow-md relative bg-office-white",
              isSelected
                ? "border-office-orange bg-office-orange-light/20 shadow-lg"
                : "border-office-gray-light hover:border-office-orange hover:shadow-lg",
              disabled && "opacity-50 cursor-not-allowed hover:border-office-gray-light hover:shadow-none"
            )}
            onClick={() => !disabled && onSelect(character.id)}
          >
            <img
              src={character.avatar}
              alt={character.name}
              className="w-16 h-16 rounded-full mx-auto mb-2 object-cover border-2 border-office-gray-light"
            />
            <h3 className="text-center font-semibold text-office-black font-office-body">{character.name}</h3>
            <p className="text-center text-xs text-office-gray font-office-body">{character.role}</p>
            
            {isSelected && (
              <div className="absolute top-2 right-2">
                <div className="w-6 h-6 bg-office-black rounded-full flex items-center justify-center shadow-sm">
                  <Check className="w-4 h-4 text-office-white" />
                </div>
              </div>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs p-3 bg-office-black text-office-white text-sm">
          <p className="leading-relaxed">{character.personality}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
