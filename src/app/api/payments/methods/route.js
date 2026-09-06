import { NextResponse } from "next/server";
import { getAvailablePaymentMethods } from "@/lib/payments";

export async function GET() {
  return NextResponse.json(getAvailablePaymentMethods());
}
