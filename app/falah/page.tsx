"use client";

import { useEffect, useState } from "react";
import AdminGate from "@/components/AdminGate";

interface GameConfig {
  answer: string;
  levels: {
    level: number;
    key: string;
    image: string;
    hint: string;
  }[];
}

function ConfigView() {
  const [config, setConfig] = useState<GameConfig | null>(null);

  useEffect(() => {
    fetch(`/api/config?_=${Date.now()}`)
      .then((r) => r.json())
      .then(setConfig)
      .catch(() => {});
  }, []);

  if (!config) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <p className="text-gray-400 text-sm">Memuat...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-orange-400 mb-1">📄 Game Config</h1>
        <p className="text-gray-500 text-sm mb-6">/falah — live config</p>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 mb-6">
          <p className="text-xs text-orange-300 font-semibold mb-1">Jawaban</p>
          <p className="text-white font-mono text-lg">{config.answer}</p>
        </div>

        <div className="flex flex-col gap-4">
          {config.levels.map((l) => (
            <div key={l.key} className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
              <p className="text-orange-300 font-semibold mb-3">Level {l.level}</p>
              <div className="flex flex-col gap-1 text-sm">
                <div className="flex gap-2">
                  <span className="text-gray-500 w-16 shrink-0">key</span>
                  <span className="text-gray-200 font-mono">{l.key}</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-gray-500 w-16 shrink-0">image</span>
                  <span className="text-blue-400 font-mono break-all">{l.image}</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-gray-500 w-16 shrink-0">hint</span>
                  <span className="text-gray-200">{l.hint}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <details className="mt-6">
          <summary className="text-gray-500 text-xs cursor-pointer hover:text-gray-300">Raw JSON</summary>
          <pre className="mt-2 bg-gray-900 border border-gray-800 rounded-xl p-4 text-xs text-green-400 overflow-x-auto">
            {JSON.stringify(config, null, 2)}
          </pre>
        </details>
      </div>
    </div>
  );
}

export default function FalahPage() {
  return (
    <AdminGate>
      <ConfigView />
    </AdminGate>
  );
}
