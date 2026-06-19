import { motion } from "framer-motion";
import { Timer, MapPin, Flame, Pencil, Trash2 } from "lucide-react";
import type { CardioEntry } from "@/lib/cardioStore";

interface CardioCardProps {
  entry: CardioEntry;
  index: number;
  onDelete: (id: string) => void;
  onEdit?: (entry: CardioEntry) => void;
}

export default function CardioCard({ entry, index, onDelete, onEdit }: CardioCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className="glass-card rounded-lg p-4"
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-display font-semibold text-foreground">{entry.name}</h3>
        <div className="flex items-center gap-1">
          {onEdit && (
            <button
              onClick={() => onEdit(entry)}
              className="p-1.5 rounded-full hover:bg-secondary"
            >
              <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          )}
          <button
            onClick={() => {
              if (!confirm(`Delete "${entry.name}"?`)) return;
              onDelete(entry.id);
            }}
            aria-label="Delete cardio session"
            className="p-1.5 rounded-full hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      <div className="flex gap-4 text-sm text-muted-foreground">
        <span className="flex items-center gap-1">
          <Timer className="w-3.5 h-3.5" /> {entry.duration} min
        </span>
        {entry.distance && (
          <span className="flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5" /> {entry.distance} km
          </span>
        )}
        {entry.calories && (
          <span className="flex items-center gap-1">
            <Flame className="w-3.5 h-3.5" /> {entry.calories} cal
          </span>
        )}
      </div>
    </motion.div>
  );
}
