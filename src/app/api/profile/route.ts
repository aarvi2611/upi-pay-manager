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

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

async function saveProfileToPrisma(profile: ProfileInput) {
  const existing = await prisma.businessProfile.findFirst();

  if (existing) {
    return prisma.businessProfile.update({
      where: { id: existing.id },
      data: profile,
    });
  }

  return prisma.businessProfile.create({
    data: profile,
  });
}

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
    if (profile) {
      try {
        const db = getFirestore();
        await db.collection("settings").doc(profileDocId).set(
          {
            name: profile.name,
            upiId: profile.upiId,
            personalUpiId: profile.personalUpiId || null,
            phone: profile.phone || null,
            address: profile.address || null,
            updatedAt: profile.updatedAt.toISOString(),
          },
          { merge: true }
        );
      } catch (error) {
        console.error("Failed to mirror Prisma business profile to Firestore", error);
      }
    }
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
    let savedProfile: any = profile;
    let saved = false;
    const failures: string[] = [];

    try {
      const db = getFirestore();
      await db.collection("settings").doc(profileDocId).set(
        {
          ...profile,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
      saved = true;

    } catch (error) {
      console.error("Failed to save Firestore business profile", error);
      failures.push(`Firestore: ${errorMessage(error)}`);
    }

    try {
      savedProfile = await saveProfileToPrisma(profile);
      saved = true;
    } catch (error) {
      console.error("Failed to save Prisma business profile", error);
      failures.push(`Database: ${errorMessage(error)}`);
    }

    if (!saved) {
      return NextResponse.json(
        {
          error: "Failed to save business profile",
          details: failures,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(savedProfile);
  } catch (error) {
    return new NextResponse("Internal Error", { status: 500 });
  }
}
