"use client";

import { useCallback, useEffect, useState } from "react";
import { TasteProfile } from "@/components/taste-profile";
import { NoteSwiper } from "@/components/note-swiper";

interface NotePreferenceItem {
  noteId: number;
  preference: string;
  note: { id: number; name: string; category: string | null };
}

interface NoteItem {
  id: number;
  name: string;
  category: string | null;
}

export default function ProfilePage() {
  const [preferences, setPreferences] = useState<NotePreferenceItem[]>([]);
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [stats, setStats] = useState({ total: 0, own: 0, tried: 0, want: 0 });
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [prefsRes, collectionRes] = await Promise.all([
        fetch("/api/preferences"),
        fetch("/api/collection"),
      ]);

      if (prefsRes.ok) {
        const prefs = await prefsRes.json();
        setPreferences(prefs);
      }

      let collectionNotes: NoteItem[] = [];

      if (collectionRes.ok) {
        const coll = await collectionRes.json();
        setStats({
          total: coll.length,
          own: coll.filter((c: { status: string }) => c.status === "own").length,
          tried: coll.filter((c: { status: string }) => c.status === "tried").length,
          want: coll.filter((c: { status: string }) => c.status === "want").length,
        });

        // Extract unique notes from collection
        const noteMap = new Map<number, NoteItem>();
        for (const item of coll) {
          for (const fn of item.fragrance?.notes ?? []) {
            if (!noteMap.has(fn.note.id)) {
              noteMap.set(fn.note.id, {
                id: fn.note.id,
                name: fn.note.name,
                category: fn.note.category,
              });
            }
          }
        }
        collectionNotes = [...noteMap.values()];
      }

      // Cold start: if collection has few notes, fetch popular notes so the
      // swiper always has something for new users to rate
      if (collectionNotes.length < 10) {
        const notesRes = await fetch("/api/notes");
        if (notesRes.ok) {
          const popular: NoteItem[] = await notesRes.json();
          const existing = new Set(collectionNotes.map((n) => n.id));
          for (const n of popular) {
            if (!existing.has(n.id)) {
              collectionNotes.push(n);
              existing.add(n.id);
            }
          }
        }
      }

      setNotes(collectionNotes);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handlePreferenceSet = async (noteId: number, preference: string) => {
    const res = await fetch("/api/preferences", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ noteId, preference }),
    });
    if (res.ok) {
      const pref = await res.json();
      setPreferences((prev) => {
        const filtered = prev.filter((p) => p.noteId !== noteId);
        return [...filtered, pref];
      });
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brown">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-cream-200 border-t-brown-light" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brown pt-[54px] text-cream-50">
      <div
        className="grid min-h-[calc(100vh-54px)]"
        style={{ gridTemplateColumns: "1.1fr 0.9fr" }}
      >
        <div className="border-r border-white/[0.06] p-[52px] pr-12">
          <TasteProfile preferences={preferences} stats={stats} />
        </div>
        <div className="p-[52px] pl-12">
          <NoteSwiper
            notes={notes}
            existingPreferences={preferences}
            onPreferenceSet={handlePreferenceSet}
          />
        </div>
      </div>
    </div>
  );
}
