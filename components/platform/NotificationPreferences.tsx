"use client";

import { useState, useEffect, useCallback } from "react";

type Preferences = {
  email_deliverable: boolean;
  email_timesheet: boolean;
  email_project: boolean;
  email_assignment: boolean;
  push_enabled: boolean;
};

const TOGGLE_ITEMS: { key: keyof Preferences; label: string; sub: string }[] = [
  {
    key: "email_deliverable",
    label: "Deliverable updates",
    sub: "When a deliverable is submitted, reviewed, or approved",
  },
  {
    key: "email_timesheet",
    label: "Timesheet notifications",
    sub: "When your time entries are approved or flagged",
  },
  {
    key: "email_project",
    label: "Project updates",
    sub: "Status changes, milestones, and risk alerts",
  },
  {
    key: "email_assignment",
    label: "Assignment notifications",
    sub: "New assignments and staffing requests",
  },
  {
    key: "push_enabled",
    label: "Push notifications",
    sub: "Browser push notifications for urgent items",
  },
];

const DEFAULT_PREFS: Preferences = {
  email_deliverable: true,
  email_timesheet: true,
  email_project: true,
  email_assignment: true,
  push_enabled: false,
};

export default function NotificationPreferences() {
  const [prefs, setPrefs] = useState<Preferences>(DEFAULT_PREFS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/settings/notifications")
      .then((r) => (r.ok ? r.json() : DEFAULT_PREFS))
      .then((data: Preferences) => setPrefs(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const toggle = useCallback(
    async (key: keyof Preferences) => {
      const newValue = !prefs[key];
      setPrefs((p) => ({ ...p, [key]: newValue }));
      setSaving(key);
      try {
        const res = await fetch("/api/settings/notifications", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ [key]: newValue }),
        });
        if (res.ok) {
          const updated = await res.json();
          setPrefs(updated);
        } else {
          setPrefs((p) => ({ ...p, [key]: !newValue }));
        }
      } catch {
        setPrefs((p) => ({ ...p, [key]: !newValue }));
      } finally {
        setSaving(null);
      }
    },
    [prefs],
  );

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center justify-between py-2">
            <div className="space-y-1">
              <div className="h-4 w-36 rounded bg-gray-100 animate-pulse" />
              <div className="h-3 w-52 rounded bg-gray-50 animate-pulse" />
            </div>
            <div className="w-9 h-5 rounded-full bg-gray-100 animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {TOGGLE_ITEMS.map((item) => {
        const on = prefs[item.key];
        const isSaving = saving === item.key;
        return (
          <div
            key={item.key}
            className="flex items-center justify-between py-2 border-b last:border-b-0"
            style={{ borderColor: "#F3F4F6" }}
          >
            <div>
              <p className="text-sm text-gray-700">{item.label}</p>
              <p className="text-xs text-gray-400 mt-0.5">{item.sub}</p>
            </div>
            <button
              onClick={() => toggle(item.key)}
              disabled={isSaving}
              className="w-9 h-5 rounded-full relative transition-colors shrink-0"
              style={{
                background: on ? "#10B981" : "#D1D5DB",
                opacity: isSaving ? 0.6 : 1,
              }}
              aria-label={`Toggle ${item.label}`}
            >
              <div
                className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-all"
                style={{ left: on ? "calc(100% - 18px)" : "2px" }}
              />
            </button>
          </div>
        );
      })}
    </div>
  );
}
