import { desc, eq } from "drizzle-orm";
import { getChatGPTUser } from "../../chatgpt-auth";
import { getDb } from "../../../db";
import { runs } from "../../../db/schema";
import { z } from "zod";

const runSchema = z.object({ id: z.string().uuid(), mode: z.enum(["en", "th", "javascript", "python"]), stage: z.number().int().min(1).max(5), score: z.number().int().min(0).max(100000), wpm: z.number().int().min(0).max(1000), accuracy: z.number().int().min(0).max(100), cleared: z.boolean() });

export async function GET() {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: "กรุณาเข้าสู่ระบบเพื่อดูประวัติ" }, { status: 401 });
  try {
    const history = await getDb().select().from(runs).where(eq(runs.userId, user.userId)).orderBy(desc(runs.createdAt)).limit(100);
    return Response.json({ runs: history }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ error: "โหลดประวัติไม่สำเร็จ ลองอีกครั้ง" }, { status: 503 });
  }
}

export async function POST(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: "เซสชันหมดอายุ กรุณาเข้าสู่ระบบอีกครั้ง" }, { status: 401 });
  if (request.headers.get("origin") !== new URL(request.url).origin) return Response.json({ error: "Invalid origin" }, { status: 403 });
  const parsed = runSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "ข้อมูลการเล่นไม่ถูกต้อง" }, { status: 400 });
  }
  const body = parsed.data;
  try {
    await getDb().insert(runs).values({ id: body.id, userId: user.userId, mode: body.mode, stage: body.stage, score: body.score, wpm: body.wpm, accuracy: body.accuracy, cleared: body.cleared, createdAt: Date.now() }).onConflictDoNothing();
    return Response.json({ saved: true });
  } catch {
    return Response.json({ error: "บันทึกไม่สำเร็จ โปรดลองอีกครั้ง" }, { status: 503 });
  }
}
