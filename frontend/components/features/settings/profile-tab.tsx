"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Camera, Save } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion } from "framer-motion";
import { staggerContainer, staggerChild, tapProps } from "@/lib/motion";

const languages = ["English (US)", "English (UK)", "Spanish", "French", "German", "Japanese", "Turkish", "Arabic"];
const timezones = ["UTC", "UTC+1 (CET)", "UTC+3 (IST)", "UTC+5:30 (India)", "UTC+8 (CST)", "UTC+9 (JST)", "UTC-5 (EST)", "UTC-8 (PST)"];

const MotionButton = motion(Button);

export function ProfileTab() {
  const [name, setName] = useState("Kishore R.");
  const [email, setEmail] = useState("kishore@globalreach.io");
  const [lang, setLang] = useState("English (US)");
  const [tz, setTz] = useState("UTC+5:30 (India)");
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="space-y-6 max-w-lg"
    >
      {/* Avatar */}
      <motion.div variants={staggerChild} className="flex items-center gap-4">
        <div className="relative">
          <Avatar className="h-16 w-16">
            <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">KR</AvatarFallback>
          </Avatar>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-background shadow-subtle hover:bg-muted transition-colors"
          >
            <Camera className="h-3.5 w-3.5 text-muted-foreground" />
          </motion.button>
        </div>
        <div>
          <p className="text-sm font-semibold">{name}</p>
          <p className="text-xs text-muted-foreground">Admin · GlobalReach Org</p>
        </div>
      </motion.div>

      <motion.div variants={staggerChild} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">Display name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">Email address</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">Language</label>
          <Select value={lang} onValueChange={setLang}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {languages.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">Timezone</label>
          <Select value={tz} onValueChange={setTz}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {timezones.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </motion.div>

      <motion.div variants={staggerChild} className="flex items-center gap-3">
        <MotionButton onClick={handleSave} className="gap-2" {...tapProps}>
          <Save className="h-3.5 w-3.5" />
          {saved ? "Saved!" : "Save changes"}
        </MotionButton>
        {saved && <p className="text-xs text-success animate-fade-in">Your profile has been updated.</p>}
      </motion.div>
    </motion.div>
  );
}
