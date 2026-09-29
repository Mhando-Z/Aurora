import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/mail";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    const { orderId } = await request.json();

    // TODO: Verify the caller's authorization and load
    // the actual order from Supabase using orderId.
    // Do not trust customer details sent from the browser.

    if (!orderId) {
      return NextResponse.json(
        { error: "Order ID is required" },
        { status: 400 },
      );
    }

    // Example notification to the company administrator.
    await sendEmail({
      to: process.env.ADMIN_EMAIL,
      subject: `New order notification`,
      text: `An order requires attention: ${orderId}`,
    });

    return NextResponse.json({
      success: true,
      message: "Email sent successfully",
    });
  } catch (error) {
    console.error("Email error:", error);

    return NextResponse.json(
      { error: "Email could not be sent" },
      { status: 500 },
    );
  }
}
