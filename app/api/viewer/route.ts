import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const DB_PATH = path.join(process.cwd(), ".updates.json");

function readUpdates(): Record<string, any[]> {
  try {
    if (fs.existsSync(DB_PATH)) {
      const data = fs.readFileSync(DB_PATH, "utf-8");
      return JSON.parse(data);
    }
  } catch (e) {
    console.error("Error reading updates file:", e);
  }
  return {};
}

function writeUpdates(updates: Record<string, any[]>) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(updates, null, 2));
  } catch (e) {
    console.error("Error writing updates file:", e);
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { code, update } = body;

  const updates = readUpdates();

  if (!updates[code]) {
    updates[code] = [];
  }

  updates[code].unshift(update);
  writeUpdates(updates);

  return NextResponse.json({ success: true });
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");

  if (!code) {
    return NextResponse.json({ updates: [] });
  }

  const updates = readUpdates();

  if (!updates[code]) {
    return NextResponse.json({ updates: [] });
  }

  return NextResponse.json({ updates: updates[code] });
}