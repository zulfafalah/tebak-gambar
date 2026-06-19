import { NextRequest } from "next/server";
import { readConfig, saveConfig } from "@/lib/game-config";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { answer, hints } = body as {
    answer?: string;
    hints?: Record<string, string>;
  };

  const config = await readConfig();

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

  await saveConfig(config);

  return Response.json({ success: true });
}
