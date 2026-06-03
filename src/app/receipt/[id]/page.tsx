import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import ReceiptView from "./ReceiptView";

export default async function ReceiptPage({ params }: { params: { id: string } }) {
  const transaction = await prisma.transaction.findUnique({
    where: { id: params.id }
  });

  if (!transaction || transaction.status !== "PAID") notFound();

  const businessProfile = await prisma.businessProfile.findFirst();
  if (!businessProfile) notFound();

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 py-12">
      <ReceiptView transaction={transaction} businessProfile={businessProfile} />
    </div>
  );
}
