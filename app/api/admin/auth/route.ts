import { NextRequest } from "next/server";

const PASSWORD = "semoga falah kaya raya";

export async function POST(request: NextRequest) {
  const { password } = await request.json();

  if (password !== PASSWORD) {
    return Response.json({ error: "Password salah" }, { status: 401 });
  }

  return Response.json({ success: true });
}
