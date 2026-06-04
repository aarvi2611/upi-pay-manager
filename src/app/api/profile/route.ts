import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getFirestore } from "@/lib/firebaseAdmin";

export const dynamic = "force-dynamic";

const profileDocId = "business-profile";

type ProfileInput = {
  name: string;
  upiId: string;
  personalUpiId?: string | null;
  phone?: string | null;
  address?: string | null;
};

export async function GET() {
  try {
    const db = getFirestore();
    const doc = await db.collection("settings").doc(profileDocId).get();
    if (doc.exists) return NextResponse.json(doc.data());
  } catch (error) {
    console.error("Failed to load Firestore business profile", error);
  }

  try {
    const profile = await prisma.businessProfile.findFirst();
    return NextResponse.json(profile || {});
  } catch (error) {
    console.error("Failed to load business profile", error);
    return NextResponse.json({});
  }
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return new NextResponse("Unauthorized", { status: 401 });

  try {
    const body = await req.json();
    const profile: ProfileInput = {
      name: body.name,
      upiId: body.upiId,
      personalUpiId: body.personalUpiId || null,
      phone: body.phone || null,
      address: body.address || null,
    };

    try {
      const db = getFirestore();
      await db.collection("settings").doc(profileDocId).set(
        {
          ...profile,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );

      return NextResponse.json(profile);
    } catch (error) {
      console.error("Failed to save Firestore business profile", error);
    }

    try {
      const existing = await prisma.businessProfile.findFirst();

      if (existing) {
        const updated = await prisma.businessProfile.update({
          where: { id: existing.id },
          data: profile,
        });
        return NextResponse.json(updated);
      } else {
        const created = await prisma.businessProfile.create({
          data: profile,
        });
        return NextResponse.json(created);
      }
    } catch (error) {
      console.error("Failed to save Prisma business profile", error);
      return NextResponse.json(profile);
    }
  } catch (error) {
    return new NextResponse("Internal Error", { status: 500 });
  }
}
