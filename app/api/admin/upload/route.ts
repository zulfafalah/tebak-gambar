import { NextRequest } from "next/server";
import { put } from "@vercel/blob";
import { writeFile } from "fs/promises";
import path from "path";
import { readConfig, saveConfig } from "@/lib/game-config";

const ALLOWED_LEVELS = ["level1", "level2", "level3", "level4"];
const IS_VERCEL = !!process.env.BLOB_READ_WRITE_TOKEN;

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
  let imageUrl: string;

  if (IS_VERCEL) {
    const blob = await put(filename, buffer, {
      access: "public",
      addRandomSuffix: false,
      contentType: "image/jpeg",
    });
    imageUrl = blob.url;
  } else {
    const filePath = path.join(process.cwd(), "public", filename);
    await writeFile(filePath, buffer);
    imageUrl = `/${filename}?v=${Date.now()}`;
  }

  const config = await readConfig();
  const idx = config.levels.findIndex((l) => l.key === level);
  if (idx !== -1) config.levels[idx].image = imageUrl;
  await saveConfig(config);

  return Response.json({ success: true, imageUrl });
}
