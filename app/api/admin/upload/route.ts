import { NextRequest } from "next/server";
import { writeFile, readFile } from "fs/promises";
import path from "path";

const ALLOWED_LEVELS = ["level1", "level2", "level3", "level4"];
const CONFIG_PATH = path.join(process.cwd(), "public", "game-config.json");

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const level = formData.get("level") as string;
  const file = formData.get("file") as File;

  if (!level || !ALLOWED_LEVELS.includes(level)) {
    return Response.json({ error: "Invalid level" }, { status: 400 });
  }

  if (!file || !file.type.startsWith("image/")) {
    return Response.json({ error: "Invalid file" }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const filename = `${level}.jpeg`;
  const filePath = path.join(process.cwd(), "public", filename);
  await writeFile(filePath, buffer);

  const config = JSON.parse(await readFile(CONFIG_PATH, "utf-8"));
  const v = Date.now();
  const idx = config.levels.findIndex((l: { key: string }) => l.key === level);
  if (idx !== -1) {
    config.levels[idx].image = `/${filename}?v=${v}`;
  }
  await writeFile(CONFIG_PATH, JSON.stringify(config, null, 2));

  return Response.json({ success: true, filename, version: v });
}
