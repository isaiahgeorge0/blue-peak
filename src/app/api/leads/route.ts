import { NextResponse } from "next/server";
import { sendNewLeadEmail } from "@/lib/send-new-lead-email";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

type LeadBody = {
  name?: unknown;
  phone?: unknown;
  email?: unknown;
  postcode?: unknown;
  service_type?: unknown;
  message?: unknown;
};

function asTrimmedString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: Request) {
  try {
    let body: LeadBody;
    try {
      body = (await request.json()) as LeadBody;
    } catch {
      return NextResponse.json(
        { error: "Invalid request body." },
        { status: 400 },
      );
    }

    const name = asTrimmedString(body.name);
    const phone = asTrimmedString(body.phone);
    const email = asTrimmedString(body.email);
    const postcode = asTrimmedString(body.postcode);
    const serviceType = asTrimmedString(body.service_type);
    const message = asTrimmedString(body.message);

    if (!name || !phone) {
      return NextResponse.json(
        { error: "Name and phone are required." },
        { status: 400 },
      );
    }

    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.SUPABASE_SERVICE_ROLE_KEY
    ) {
      console.error("leads API: missing Supabase admin environment variables");
      return NextResponse.json(
        {
          error:
            "Unable to submit your enquiry right now. Please try again later.",
        },
        { status: 500 },
      );
    }

    const { error } = await getSupabaseAdmin().from("leads").insert({
      name,
      phone,
      email: email || null,
      postcode: postcode || null,
      service_type: serviceType || null,
      message: message || null,
      source: "website",
      status: "new",
    });

    if (error) {
      console.error("leads API: insert failed", error.message);
      return NextResponse.json(
        {
          error:
            "Unable to submit your enquiry right now. Please try again later.",
        },
        { status: 500 },
      );
    }

    try {
      await sendNewLeadEmail({
        name,
        phone,
        email,
        postcode,
        serviceType,
        message,
      });
    } catch (notifyError) {
      console.error(
        "leads API: Resend notification failed",
        notifyError instanceof Error ? notifyError.message : notifyError,
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("leads API: unexpected error", error);
    return NextResponse.json(
      {
        error:
          "Unable to submit your enquiry right now. Please try again later.",
      },
      { status: 500 },
    );
  }
}
