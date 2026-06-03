import prisma from "@/lib/prisma";
import { getFirestore } from "@/lib/firebaseAdmin";
import { notFound } from "next/navigation";
import ReceiptView from "./ReceiptView";

export default async function ReceiptPage({ params }: { params: { id: string } }) {
  let transaction: any = null;
  let businessProfile: any = null;

  try {
    const db = getFirestore();
    const transactionDoc = await db.collection("transactions").doc(params.id).get();
    if (transactionDoc.exists) {
      transaction = { id: transactionDoc.id, ...transactionDoc.data() };
    }

    const profileDoc = await db.collection("settings").doc("business-profile").get();
    if (profileDoc.exists) {
      businessProfile = profileDoc.data();
    }
  } catch (error) {
    console.error("Failed to load Firestore receipt data", error);
  }

  if (!transaction) {
    transaction = await prisma.transaction.findUnique({
      where: { id: params.id }
    }).catch((error) => {
      console.error("Failed to load Prisma transaction", error);
      return null;
    });
  }

  if (!transaction || transaction.status !== "PAID") notFound();

  if (!businessProfile) {
    businessProfile = await prisma.businessProfile.findFirst().catch((error) => {
      console.error("Failed to load Prisma business profile", error);
      return null;
    });
  }

  businessProfile = businessProfile || {
    name: "My Store",
    upiId: "merchant@upi",
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 py-12">
      <ReceiptView transaction={transaction} businessProfile={businessProfile} />
    </div>
  );
}
