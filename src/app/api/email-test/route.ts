import { NextResponse } from "next/server";
import { getEmailEnvStatus, sendEmailTest } from "@/lib/email";

export const dynamic = "force-dynamic";

function canUseEmailTest(request: Request) {
  if (process.env.NODE_ENV !== "production") {
    return true;
  }

  const { searchParams } = new URL(request.url);
  const expectedSecret = process.env.EMAIL_TEST_SECRET?.trim();
  const providedSecret = searchParams.get("secret")?.trim();

  return Boolean(expectedSecret && providedSecret === expectedSecret);
}

export async function GET(request: Request) {
  if (!canUseEmailTest(request)) {
    return NextResponse.json(
      { message: "Email test is not available." },
      { status: 403 }
    );
  }

  const emailStatus = getEmailEnvStatus();

  if (!emailStatus.configured) {
    return NextResponse.json({
      status: "skipped",
      message: "Email is not configured.",
      missing: emailStatus.missing
    });
  }

  const result = await sendEmailTest();

  return NextResponse.json({
    status: result.status,
    message: result.message
  });
}
