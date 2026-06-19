import { readConfig } from "@/lib/game-config";

export async function GET() {
  const config = await readConfig();
  return Response.json(config);
}
