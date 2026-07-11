import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUserFromRequest, handleAPIAuthError } from "@/lib/api-auth";
import { contactLinkSchema } from "@/lib/validations";

const normalizePhone = (v: string) => v.replace(/\D/g, "").slice(-10);
const normalizeEmail = (v: string) => v.trim().toLowerCase();

// Upsert a provenance-tagged BIRTHDAY from the linked card. Same rules as
// reach fields: refresh in place, remove when the card loses it, and defer to
// a hand-entered birthday if one exists.
async function syncBirthday(
  contactId: string,
  source: string,
  birthday: { day: number; month: number; year?: number | null } | null | undefined
) {
  const existing = await prisma.importantDate.findMany({
    where: { contactId, dateType: "BIRTHDAY" },
  });
  const sourced = existing.find((d) => d.source === source);
  const manual = existing.some((d) => d.source !== source);

  if (!birthday || manual) {
    if (sourced) {
      await prisma.importantDate.delete({ where: { id: sourced.id } });
    }
    return;
  }

  const data = { day: birthday.day, month: birthday.month, year: birthday.year ?? null };
  if (sourced) {
    if (sourced.day !== data.day || sourced.month !== data.month || sourced.year !== data.year) {
      await prisma.importantDate.update({ where: { id: sourced.id }, data });
    }
  } else {
    await prisma.importantDate.create({
      data: { contactId, dateType: "BIRTHDAY", source, ...data },
    });
  }
}

// Copy the link's reach snapshot into provenance-tagged ContactFields so the
// web has phone/email too. Refreshed in place on re-link; source-tagged rows
// are removed when the linked contact no longer has that value. Skips values
// the user already entered by hand (no duplicates).
async function syncReachFields(
  contactId: string,
  source: string,
  reach: { phone?: string | null; email?: string | null }
) {
  const existing = await prisma.contactField.findMany({ where: { contactId } });

  const specs = [
    { fieldType: "PHONE", value: reach.phone, protocol: "tel:", normalize: normalizePhone },
    { fieldType: "EMAIL", value: reach.email, protocol: "mailto:", normalize: normalizeEmail },
  ] as const;

  for (const spec of specs) {
    const sourced = existing.find(
      (f) => f.fieldType === spec.fieldType && f.source === source
    );

    if (!spec.value) {
      // Linked contact has no such value — a stale copy shouldn't linger
      if (sourced) {
        await prisma.contactField.delete({ where: { id: sourced.id } });
      }
      continue;
    }

    const manualDuplicate = existing.some(
      (f) =>
        f.fieldType === spec.fieldType &&
        f.source !== source &&
        spec.normalize(f.value) === spec.normalize(spec.value!)
    );
    if (manualDuplicate) {
      if (sourced) {
        await prisma.contactField.delete({ where: { id: sourced.id } });
      }
      continue;
    }

    if (sourced) {
      if (sourced.value !== spec.value) {
        await prisma.contactField.update({
          where: { id: sourced.id },
          data: { value: spec.value },
        });
      }
    } else {
      await prisma.contactField.create({
        data: {
          contactId,
          fieldType: spec.fieldType,
          value: spec.value,
          protocol: spec.protocol,
          source,
        },
      });
    }
  }
}

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

    await syncReachFields(id, data.source, { phone: data.phone, email: data.email });
    await syncBirthday(id, data.source, data.birthday);

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

    // Copied reach fields and dates are derived from the link — remove them with it
    await prisma.contactField.deleteMany({
      where: { contactId: id, source },
    });
    await prisma.importantDate.deleteMany({
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
