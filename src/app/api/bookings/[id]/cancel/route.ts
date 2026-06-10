import { NextResponse } from "next/server";
import { sendCancellationEmails } from "@/lib/email";
import { cancelBooking } from "@/lib/storage";

type CancelRequestBody = {
  token?: string;
};

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const body = (await request.json()) as CancelRequestBody;
  const token = body.token?.trim();

  if (!token) {
    return NextResponse.json(
      { message: "Cancellation token is required." },
      { status: 400 }
    );
  }

  try {
    const { booking, alreadyCancelled } = await cancelBooking(id, token);
    const emailStatus = alreadyCancelled
      ? {
          status: "skipped",
          message: "Cancellation email already handled for this booking."
        }
      : await sendCancellationEmails(booking);

    return NextResponse.json({
      booking,
      emailStatus,
      message: alreadyCancelled
        ? "This booking was already cancelled."
        : "Your booking has been cancelled."
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to cancel this booking.";

    return NextResponse.json(
      { message },
      {
        status:
          message === "Booking not found or cancellation link is invalid."
            ? 404
            : 500
      }
    );
  }
}
