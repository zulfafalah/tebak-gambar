import { put, list } from "@vercel/blob";
import { readFile, writeFile } from "fs/promises";
import path from "path";

const LOCAL_PATH = path.join(process.cwd(), "public", "game-config.json");
const USE_BLOB = !!(process.env.BLOB_STORE_ID || process.env.BLOB_READ_WRITE_TOKEN);

export interface LevelConfig {
  level: number;
  key: string;
  image: string;
  hint: string;
}

export interface GameConfig {
  answer: string;
  levels: LevelConfig[];
}

const DEFAULT_CONFIG: GameConfig = {
  answer: "solikin",
  levels: [
    { level: 1, key: "level1", image: "/level1.jpeg", hint: "ini orang terdekatmu 🫶" },
    { level: 2, key: "level2", image: "/level2.jpeg", hint: "Namanya ada huruf 'S' di awal 🔤" },
    { level: 3, key: "level3", image: "/level3.jpeg", hint: "Nama lengkapnya 7 huruf ✌️" },
    { level: 4, key: "level4", image: "/level4.jpeg", hint: "Petunjuk terakhir: S-O-L-I-K-I-N 🎯" },
  ],
};

export async function readConfig(): Promise<GameConfig> {
  if (USE_BLOB) {
    try {
      const { blobs } = await list({ prefix: "game-config" });
      const blob = blobs.find((b) => b.pathname === "game-config.json");
      if (!blob) return DEFAULT_CONFIG;
      const res = await fetch(blob.url + "?t=" + Date.now());
      return res.json();
    } catch {
      return DEFAULT_CONFIG;
    }
  }
  try {
    return JSON.parse(await readFile(LOCAL_PATH, "utf-8"));
  } catch {
    return DEFAULT_CONFIG;
  }
}

export async function saveConfig(config: GameConfig): Promise<void> {
  const body = JSON.stringify(config, null, 2);
  if (USE_BLOB) {
    await put("game-config.json", body, {
      access: "public",
      addRandomSuffix: false,
      contentType: "application/json",
    });
  } else {
    await writeFile(LOCAL_PATH, body);
  }
}
