import { NextRequest } from "next/server";
import { writeFile, readFile } from "fs/promises";
import path from "path";

const CONFIG_PATH = path.join(process.cwd(), "public", "game-config.json");

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { answer, hints } = body as {
    answer?: string;
    hints?: Record<string, string>;
  };

  const config = JSON.parse(await readFile(CONFIG_PATH, "utf-8"));

  if (typeof answer === "string" && answer.trim()) {
    config.answer = answer.trim().toLowerCase();
  }

  if (hints && typeof hints === "object") {
    for (const level of config.levels) {
      if (typeof hints[level.key] === "string") {
        level.hint = hints[level.key];
      }
    }
  }

  await writeFile(CONFIG_PATH, JSON.stringify(config, null, 2));

  return Response.json({ success: true });
}
