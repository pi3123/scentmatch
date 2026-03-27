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
      <div className="flex justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-cream-300 border-t-warm-600" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold text-warm-800">
        My Taste Profile
      </h1>
      <p className="mt-1 text-sm text-warm-600">
        Your preferences shape how we score fragrances for you.
      </p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_300px]">
        <TasteProfile preferences={preferences} stats={stats} />
        <div>
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
