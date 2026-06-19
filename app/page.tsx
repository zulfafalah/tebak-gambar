"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import confetti from "canvas-confetti";

type GameState = "playing" | "won" | "lost";

interface LevelConfig {
  level: number;
  key: string;
  image: string;
  hint: string;
}

const FALLBACK_LEVELS: LevelConfig[] = [
  { level: 1, key: "level1", image: "/level1.jpeg", hint: "ini orang terdekatmu 🫶" },
  { level: 2, key: "level2", image: "/level2.jpeg", hint: "Namanya ada huruf 'S' di awal 🔤" },
  { level: 3, key: "level3", image: "/level3.jpeg", hint: "Nama lengkapnya 7 huruf ✌️" },
  { level: 4, key: "level4", image: "/level4.jpeg", hint: "Petunjuk terakhir: S-O-L-I-K-I-N 🎯" },
];
const FALLBACK_ANSWER = "solikin";

function fireConfetti() {
  const duration = 3000;
  const end = Date.now() + duration;

  const frame = () => {
    confetti({
      particleCount: 6,
      angle: 60,
      spread: 55,
      origin: { x: 0 },
      colors: ["#f97316", "#facc15", "#22c55e", "#3b82f6", "#ec4899"],
    });
    confetti({
      particleCount: 6,
      angle: 120,
      spread: 55,
      origin: { x: 1 },
      colors: ["#f97316", "#facc15", "#22c55e", "#3b82f6", "#ec4899"],
    });
    if (Date.now() < end) requestAnimationFrame(frame);
  };
  frame();
}

export default function Home() {
  const [levels, setLevels] = useState<LevelConfig[]>(FALLBACK_LEVELS);
  const [answer, setAnswer] = useState(FALLBACK_ANSWER);
  const [currentLevel, setCurrentLevel] = useState(0);
  const [input, setInput] = useState("");
  const [gameState, setGameState] = useState<GameState>("playing");
  const [showHint, setShowHint] = useState(false);
  const [wrongAnim, setWrongAnim] = useState(false);
  const [showName, setShowName] = useState(false);
  const confettiFired = useRef(false);

  useEffect(() => {
    fetch(`/game-config.json?_=${Date.now()}`)
      .then((r) => r.json())
      .then((data) => {
        setLevels(data.levels);
        if (data.answer) setAnswer(data.answer);
      })
      .catch(() => {});
  }, []);

  const level = levels[currentLevel];

  useEffect(() => {
    if (gameState === "won" && !confettiFired.current) {
      confettiFired.current = true;
      fireConfetti();
      setTimeout(() => setShowName(true), 400);
    }
  }, [gameState]);

  function handleGuess() {
    if (!input.trim()) return;

    if (input.trim().toLowerCase() === answer) {
      setGameState("won");
    } else {
      setWrongAnim(true);
      setTimeout(() => setWrongAnim(false), 600);

      if (currentLevel < levels.length - 1) {
        setShowHint(true);
        setTimeout(() => {
          setCurrentLevel((prev) => prev + 1);
          setShowHint(false);
          setInput("");
        }, 2000);
      } else {
        setGameState("lost");
      }
    }
  }

  function handleReset() {
    setCurrentLevel(0);
    setInput("");
    setGameState("playing");
    setShowHint(false);
    setWrongAnim(false);
    setShowName(false);
    confettiFired.current = false;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-yellow-50 to-orange-50 flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-orange-600">🎮 Tebak Gambar</h1>
          <p className="text-gray-500 text-sm mt-1">Siapa orang ini?</p>
        </div>

        <div className="flex gap-2 justify-center mb-4">
          {levels.map((l, i) => (
            <div
              key={l.level}
              className={`h-2 flex-1 rounded-full transition-all ${
                i < currentLevel
                  ? "bg-gray-300"
                  : i === currentLevel
                  ? "bg-orange-500"
                  : "bg-orange-200"
              }`}
            />
          ))}
        </div>
        <p className="text-center text-xs text-gray-400 mb-4">
          Level {currentLevel + 1} / {levels.length}
        </p>

        {gameState === "playing" && (
          <>
            <div
              className={`w-full rounded-2xl overflow-hidden shadow-lg mb-4 transition-transform ${
                wrongAnim ? "animate-shake border-4 border-red-400" : "border-4 border-orange-200"
              }`}
            >
              <Image
                src={level.image}
                alt={`Level ${level.level}`}
                width={800}
                height={800}
                className="w-full h-auto object-contain"
                priority
                unoptimized
              />
            </div>

            {showHint && (
              <div className="bg-yellow-100 border border-yellow-300 rounded-xl px-4 py-3 mb-4 text-center text-sm text-yellow-800 font-medium animate-pulse">
                💡 Petunjuk: {level.hint}
              </div>
            )}

            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleGuess()}
                placeholder="Ketik jawabanmu..."
                className="flex-1 border-2 border-orange-300 rounded-xl px-4 py-3 text-base outline-none focus:border-orange-500 bg-white"
              />
              <button
                onClick={handleGuess}
                className="bg-orange-500 hover:bg-orange-600 active:scale-95 text-white font-bold px-5 py-3 rounded-xl transition-all"
              >
                Tebak
              </button>
            </div>

            <p className="text-center text-xs text-gray-400 mt-3">
              Salah? Gambar berganti & dapat petunjuk 😉
            </p>
          </>
        )}

        {gameState === "won" && (
          <div className="text-center">
            <div className="w-full rounded-2xl overflow-hidden shadow-lg mb-5 border-4 border-green-400">
              <Image
                src={level.image}
                alt="Winner"
                width={800}
                height={800}
                className="w-full h-auto object-contain"
                unoptimized
              />
            </div>

            <div className={`transition-all duration-700 ${showName ? "opacity-100 scale-100" : "opacity-0 scale-50"}`}>
              <p className="text-6xl mb-2 animate-bounce">🎉</p>
              <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-500 via-yellow-400 to-green-500 mb-1 animate-pulse">
                YEYYYY!!!
              </h2>
              <p className="text-xl font-bold text-gray-700 mt-3">
                Namanya adalah
              </p>
              <p className="text-5xl font-black text-orange-600 tracking-widest mt-1 animate-bounce">
                {answer.toUpperCase()}
              </p>
              <p className="text-gray-500 text-sm mt-3">
                ✅ Berhasil di Level {currentLevel + 1}
              </p>
            </div>

            <button
              onClick={handleReset}
              className="mt-6 bg-orange-500 hover:bg-orange-600 active:scale-95 text-white font-bold px-8 py-3 rounded-xl transition-all w-full text-lg"
            >
              Main Lagi 🔄
            </button>
          </div>
        )}

        {gameState === "lost" && (
          <div className="text-center">
            <div className="w-full rounded-2xl overflow-hidden shadow-lg mb-6 border-4 border-red-400">
              <Image
                src={levels[3].image}
                alt="Lost"
                width={800}
                height={800}
                className="w-full h-auto object-contain"
                unoptimized
              />
            </div>
            <div className="bg-red-100 border border-red-300 rounded-2xl p-6">
              <p className="text-5xl mb-3">😅</p>
              <h2 className="text-2xl font-bold text-red-600 mb-1">Salah Semua!</h2>
              <p className="text-gray-600 text-sm mt-1">
                Jawabannya adalah{" "}
                <span className="font-bold text-red-700 uppercase">{answer}</span>
              </p>
            </div>
            <button
              onClick={handleReset}
              className="mt-5 bg-orange-500 hover:bg-orange-600 text-white font-bold px-8 py-3 rounded-xl transition-all w-full"
            >
              Coba Lagi
            </button>
          </div>
        )}
      </div>

      <style jsx global>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-8px); }
          40% { transform: translateX(8px); }
          60% { transform: translateX(-6px); }
          80% { transform: translateX(6px); }
        }
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
      `}</style>
    </div>
  );
}
