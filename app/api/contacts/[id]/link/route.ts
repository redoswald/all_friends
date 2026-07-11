import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUserFromRequest, handleAPIAuthError } from "@/lib/api-auth";
import { contactLinkSchema } from "@/lib/validations";

// Create or replace this contact's link to an external address-book entry.
// One link per source (APPLE/GOOGLE) — re-linking overwrites.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUserFromRequest(request);
    const { id } = await params;
    const body = await request.json();
    const data = contactLinkSchema.parse(body);

    const contact = await prisma.contact.findFirst({
      where: { id, userId: user.id, deletedAt: null },
    });

    if (!contact) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    }

    const link = await prisma.contactLink.upsert({
      where: { contactId_source: { contactId: id, source: data.source } },
      create: {
        contactId: id,
        source: data.source,
        externalId: data.externalId,
        fingerprint: data.fingerprint ?? null,
      },
      update: {
        externalId: data.externalId,
        fingerprint: data.fingerprint ?? null,
      },
    });

    return NextResponse.json(link, { status: 201 });
  } catch (error) {
    console.error("Error linking contact:", error);
    const authResponse = handleAPIAuthError(error);
    if (authResponse) return authResponse;
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Failed to link contact" },
      { status: 500 }
    );
  }
}

// Remove a link by source: DELETE /api/contacts/[id]/link?source=APPLE
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUserFromRequest(request);
    const { id } = await params;
    const source = request.nextUrl.searchParams.get("source");

    if (source !== "APPLE" && source !== "GOOGLE") {
      return NextResponse.json({ error: "Invalid source" }, { status: 400 });
    }

    const contact = await prisma.contact.findFirst({
      where: { id, userId: user.id, deletedAt: null },
    });

    if (!contact) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    }

    await prisma.contactLink.deleteMany({
      where: { contactId: id, source },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error unlinking contact:", error);
    const authResponse = handleAPIAuthError(error);
    if (authResponse) return authResponse;
    return NextResponse.json(
      { error: "Failed to unlink contact" },
      { status: 500 }
    );
  }
}
