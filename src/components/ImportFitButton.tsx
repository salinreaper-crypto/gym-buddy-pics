import { useRef, useState } from "react";
import { Upload, Loader2 } from "lucide-react";
import { importFitFile } from "@/lib/fitImport";
import { toast } from "@/hooks/use-toast";

interface Props {
  onImported?: () => void;
  className?: string;
}

export default function ImportFitButton({ onImported, className = "" }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setBusy(true);
    let totalCardio = 0;
    let totalWorkouts = 0;
    try {
      for (const f of Array.from(files)) {
        if (!/\.fit$/i.test(f.name)) {
          toast({ title: `Skipped ${f.name}`, description: "Not a .fit file", variant: "destructive" });
          continue;
        }
        try {
          const r = await importFitFile(f);
          totalCardio += r.cardioAdded;
          totalWorkouts += r.workoutsAdded;
        } catch (e: any) {
          toast({ title: `Failed: ${f.name}`, description: e?.message ?? "Invalid file", variant: "destructive" });
        }
      }
      if (totalCardio + totalWorkouts > 0) {
        toast({
          title: "Garmin import complete",
          description: `Added ${totalCardio} cardio · ${totalWorkouts} workout${totalWorkouts === 1 ? "" : "s"}`,
        });
        onImported?.();
      }
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept=".fit"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      <button
        type="button"
        disabled={busy}
        onClick={() => inputRef.current?.click()}
        className={`h-12 px-4 rounded-xl bg-secondary text-foreground font-display font-semibold text-sm flex items-center justify-center gap-2 active:scale-[0.99] transition-transform disabled:opacity-60 ${className}`}
      >
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
        {busy ? "Importing…" : "Import .fit (Garmin)"}
      </button>
    </>
  );
}
