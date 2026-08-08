"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Delete, PhoneCall } from "lucide-react";
import { cn } from "@/lib/utils";

const keys = [
  ["1", ""], ["2", "ABC"], ["3", "DEF"],
  ["4", "GHI"], ["5", "JKL"], ["6", "MNO"],
  ["7", "PQRS"], ["8", "TUV"], ["9", "WXYZ"],
  ["*", ""], ["0", "+"], ["#", ""],
];

interface Props {
  onCall: (number: string) => void;
}

export function Dialer({ onCall }: Props) {
  const [number, setNumber] = useState("");

  const press = (digit: string) => setNumber((prev) => prev + digit);
  const backspace = () => setNumber((prev) => prev.slice(0, -1));

  return (
    <div className="flex flex-col items-center gap-4 rounded-xl border border-border bg-card px-6 py-6 shadow-card w-72">
      <h3 className="font-display text-sm font-semibold text-muted-foreground uppercase tracking-wider">New Call</h3>

      {/* Number display */}
      <div className="relative flex w-full items-center justify-center">
        <span className={cn("font-mono text-2xl font-semibold tracking-widest min-h-[36px]", !number && "text-muted-foreground")}>
          {number || "+1 (555) …"}
        </span>
        {number && (
          <button onClick={backspace} className="absolute right-0 p-1 text-muted-foreground hover:text-foreground">
            <Delete className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Keypad */}
      <div className="grid grid-cols-3 gap-2 w-full">
        {keys.map(([digit, sub]) => (
          <button
            key={digit + sub}
            onClick={() => press(digit)}
            className="flex flex-col items-center justify-center h-12 rounded-lg border border-border bg-background hover:bg-muted transition-colors active:scale-95"
          >
            <span className="text-base font-semibold">{digit}</span>
            {sub && <span className="text-[8px] font-medium text-muted-foreground tracking-widest">{sub}</span>}
          </button>
        ))}
      </div>

      {/* Call button */}
      <Button
        className="w-full gap-2 bg-success hover:bg-success/90 text-success-foreground"
        onClick={() => number && onCall(number)}
        disabled={!number}
      >
        <PhoneCall className="h-4 w-4" />
        Call
      </Button>
    </div>
  );
}
