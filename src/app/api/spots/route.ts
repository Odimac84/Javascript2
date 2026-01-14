import { NextResponse } from "next/server";
import { getHomepageSpots } from "@/lib/repo/spots.repo";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json(getHomepageSpots(3));
}
