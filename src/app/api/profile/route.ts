import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
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
    const { name, upiId, phone, address } = body;

    const existing = await prisma.businessProfile.findFirst();

    if (existing) {
      const updated = await prisma.businessProfile.update({
        where: { id: existing.id },
        data: { name, upiId, phone, address },
      });
      return NextResponse.json(updated);
    } else {
      const created = await prisma.businessProfile.create({
        data: { name, upiId, phone, address },
      });
      return NextResponse.json(created);
    }
  } catch (error) {
    return new NextResponse("Internal Error", { status: 500 });
  }
}
