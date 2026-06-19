"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import AdminGate from "@/components/AdminGate";

const LEVEL_KEYS = ["level1", "level2", "level3", "level4"];
const LEVEL_LABELS: Record<string, string> = {
  level1: "Level 1",
  level2: "Level 2",
  level3: "Level 3",
  level4: "Level 4",
};

type UploadStatus = "idle" | "uploading" | "success" | "error";

interface LevelState {
  status: UploadStatus;
  preview: string | null;
  uploadMessage: string;
  currentImage: string;
  hint: string;
}

export default function AdminPage() {
  return (
    <AdminGate>
      <AdminPanel />
    </AdminGate>
  );
}

function AdminPanel() {
  const [levelStates, setLevelStates] = useState<Record<string, LevelState>>(
    Object.fromEntries(
      LEVEL_KEYS.map((k) => [
        k,
        { status: "idle", preview: null, uploadMessage: "", currentImage: `/${k}.jpeg`, hint: "" },
      ])
    )
  );
  const [answer, setAnswer] = useState("");
  const [textSaving, setTextSaving] = useState(false);
  const [textMessage, setTextMessage] = useState("");
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    fetch(`/api/config?_=${Date.now()}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.answer) setAnswer(data.answer);
        setLevelStates((prev) => {
          const next = { ...prev };
          for (const lvl of data.levels) {
            if (next[lvl.key]) {
              next[lvl.key] = {
                ...next[lvl.key],
                currentImage: lvl.image,
                hint: lvl.hint ?? "",
              };
            }
          }
          return next;
        });
      })
      .catch(() => {});
  }, []);

  function setLevelState(level: string, patch: Partial<LevelState>) {
    setLevelStates((prev) => ({
      ...prev,
      [level]: { ...prev[level], ...patch },
    }));
  }

  function handleFileChange(level: string, file: File | null) {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setLevelState(level, { preview: url, status: "idle", uploadMessage: "" });
  }

  async function handleUpload(level: string) {
    const input = fileInputRefs.current[level];
    const file = input?.files?.[0];
    if (!file) {
      setLevelState(level, { uploadMessage: "Pilih file dulu" });
      return;
    }

    setLevelState(level, { status: "uploading", uploadMessage: "" });

    const formData = new FormData();
    formData.append("level", level);
    formData.append("file", file);

    const res = await fetch("/api/admin/upload", { method: "POST", body: formData });

    if (res.ok) {
      const data = await res.json();
      setLevelState(level, {
        status: "success",
        uploadMessage: "Gambar tersimpan!",
        currentImage: data.imageUrl,
        preview: null,
      });
      if (input) input.value = "";
    } else {
      const data = await res.json().catch(() => ({}));
      setLevelState(level, { status: "error", uploadMessage: data.error || "Gagal upload" });
    }
  }

  async function handleSaveText() {
    setTextSaving(true);
    setTextMessage("");

    const hints: Record<string, string> = {};
    for (const k of LEVEL_KEYS) {
      hints[k] = levelStates[k].hint;
    }

    const res = await fetch("/api/admin/config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answer, hints }),
    });

    setTextSaving(false);
    setTextMessage(res.ok ? "Tersimpan!" : "Gagal simpan");
    if (res.ok) setTimeout(() => setTextMessage(""), 3000);
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white px-4 py-8">
      <div className="max-w-2xl mx-auto flex flex-col gap-8">
        <div>
          <h1 className="text-2xl font-bold text-orange-400 mb-1">🔧 Admin Panel</h1>
          <p className="text-gray-500 text-sm">Ganti gambar, petunjuk, dan jawaban</p>
        </div>

        {/* Answer + Hints */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 flex flex-col gap-5">
          <p className="font-bold text-white text-base">Teks & Jawaban</p>

          <div>
            <label className="text-xs text-orange-300 font-semibold mb-1 block">Jawaban Final</label>
            <input
              type="text"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="contoh: solikin"
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-orange-500 text-white"
            />
            <p className="text-xs text-gray-500 mt-1">Disimpan lowercase, case-insensitive saat menebak</p>
          </div>

          {LEVEL_KEYS.map((k) => (
            <div key={k}>
              <label className="text-xs text-orange-300 font-semibold mb-1 block">
                Petunjuk {LEVEL_LABELS[k]}
              </label>
              <input
                type="text"
                value={levelStates[k].hint}
                onChange={(e) => setLevelState(k, { hint: e.target.value })}
                placeholder={`Petunjuk untuk ${LEVEL_LABELS[k]}...`}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-orange-500 text-white"
              />
            </div>
          ))}

          <div className="flex items-center gap-3">
            <button
              onClick={handleSaveText}
              disabled={textSaving}
              className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-all"
            >
              {textSaving ? "Menyimpan..." : "Simpan Teks"}
            </button>
            {textMessage && (
              <p className={`text-sm font-medium ${textMessage === "Tersimpan!" ? "text-green-400" : "text-red-400"}`}>
                {textMessage}
              </p>
            )}
          </div>
        </div>

        {/* Image upload per level */}
        <div className="flex flex-col gap-4">
          <p className="font-bold text-white text-base">Gambar per Level</p>
          {LEVEL_KEYS.map((k) => {
            const state = levelStates[k];
            return (
              <div key={k} className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                <p className="font-semibold text-orange-300 mb-3">{LEVEL_LABELS[k]}</p>

                <div className="flex gap-4 items-start">
                  <div className="shrink-0">
                    <p className="text-xs text-gray-500 mb-1">Sekarang</p>
                    <div className="w-24 h-24 rounded-xl overflow-hidden border border-gray-700 bg-gray-800">
                      <Image
                        src={state.currentImage}
                        alt={LEVEL_LABELS[k]}
                        width={96}
                        height={96}
                        className="w-full h-full object-cover"
                        unoptimized
                      />
                    </div>
                  </div>

                  {state.preview && (
                    <div className="shrink-0">
                      <p className="text-xs text-gray-500 mb-1">Preview</p>
                      <div className="w-24 h-24 rounded-xl overflow-hidden border border-orange-700 bg-gray-800">
                        <img src={state.preview} alt="preview" className="w-full h-full object-cover" />
                      </div>
                    </div>
                  )}

                  <div className="flex-1 flex flex-col gap-2">
                    <input
                      ref={(el) => { fileInputRefs.current[k] = el; }}
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange(k, e.target.files?.[0] ?? null)}
                      className="text-sm text-gray-300 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:bg-orange-600 file:text-white file:cursor-pointer hover:file:bg-orange-700"
                    />
                    <button
                      onClick={() => handleUpload(k)}
                      disabled={state.status === "uploading"}
                      className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm px-4 py-2 rounded-lg transition-all w-fit"
                    >
                      {state.status === "uploading" ? "Mengupload..." : "Simpan Gambar"}
                    </button>
                    {state.uploadMessage && (
                      <p className={`text-xs font-medium ${state.status === "success" ? "text-green-400" : "text-red-400"}`}>
                        {state.uploadMessage}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
