import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import PaymentView from "./PaymentView";

export default async function PaymentPage({ params }: { params: { id: string } }) {
  const transaction = await prisma.transaction.findUnique({
    where: { id: params.id }
  });

  if (!transaction) notFound();

  const businessProfile = await prisma.businessProfile.findFirst();
  if (!businessProfile) notFound();

  // Construct UPI URL string
  // upi://pay?pa=upiId&pn=BusinessName&tr=orderId&tn=purpose&am=amount&cu=INR
  const upiUrl = `upi://pay?pa=${encodeURIComponent(businessProfile.upiId)}&pn=${encodeURIComponent(businessProfile.name)}&tr=${encodeURIComponent(transaction.orderId)}&tn=${encodeURIComponent(transaction.purpose || "Payment")}&am=${transaction.amount}&cu=INR`;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 py-12">
      <PaymentView 
        transaction={transaction} 
        businessProfile={businessProfile} 
        upiUrl={upiUrl}
      />
    </div>
  );
}
