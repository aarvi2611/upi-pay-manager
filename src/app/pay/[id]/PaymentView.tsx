"use client";

import { QRCodeSVG } from "qrcode.react";
import { AlertCircle, Check, CheckCircle, Copy, CreditCard, ExternalLink, Smartphone } from "lucide-react";
import { useEffect, useState } from "react";

export default function PaymentView({ transaction, businessProfile, upiUrl, personalUpiUrl }: any) {
  const [copied, setCopied] = useState(false);
  const [currentTransaction, setCurrentTransaction] = useState(transaction);
  const [paymentTarget, setPaymentTarget] = useState<"merchant" | "personal">("merchant");
  const fallbackUpiId = businessProfile.personalUpiId;
  const hasFallbackUpi = Boolean(fallbackUpiId && personalUpiUrl);
  const activeUpiId = paymentTarget === "personal" && hasFallbackUpi ? fallbackUpiId : businessProfile.upiId;
  const activeUpiUrl = paymentTarget === "personal" && hasFallbackUpi ? personalUpiUrl : upiUrl;

  useEffect(() => {
    if (currentTransaction.status !== "PENDING") return;

    const refreshTransaction = async () => {
      try {
        const res = await fetch(`/api/transactions/${transaction.id}`, {
          cache: "no-store",
        });
        if (!res.ok) return;

        const updated = await res.json();
        setCurrentTransaction(updated);
      } catch (error) {
        console.error("Failed to refresh transaction status", error);
      }
    };

    const intervalId = window.setInterval(refreshTransaction, 3000);
    refreshTransaction();

    return () => window.clearInterval(intervalId);
  }, [currentTransaction.status, transaction.id]);

  const copyUpiId = () => {
    navigator.clipboard.writeText(activeUpiId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const upiApps = [
    { label: "UPI App", icon: Smartphone, className: "bg-green-600 hover:bg-green-700 text-white" },
    { label: "Google Pay", icon: CreditCard, className: "bg-blue-600 hover:bg-blue-700 text-white" },
    { label: "PhonePe", icon: CreditCard, className: "bg-purple-600 hover:bg-purple-700 text-white" },
    { label: "Paytm", icon: CreditCard, className: "bg-sky-600 hover:bg-sky-700 text-white" },
  ];
  const isHighValuePayment = currentTransaction.amount >= 2000;

  if (currentTransaction.status === "PAID") {
    return (
      <div className="bg-white p-8 rounded-2xl shadow-lg max-w-md w-full text-center border-t-8 border-green-500">
        <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle size={32} />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h2>
        <p className="text-gray-500 mb-6">Thank you, {currentTransaction.customerName}. Your payment has been received.</p>

        <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-500 text-sm">Amount Paid</span>
            <span className="font-bold text-gray-900">₹{currentTransaction.amount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500 text-sm">Order ID</span>
            <span className="font-medium text-gray-900">{currentTransaction.orderId}</span>
          </div>
          {currentTransaction.utrNumber && (
            <div className="flex justify-between">
              <span className="text-gray-500 text-sm">UTR/Ref No.</span>
              <span className="font-medium text-gray-900">{currentTransaction.utrNumber}</span>
            </div>
          )}
        </div>

        <a
          href={`/receipt/${currentTransaction.id}`}
          className="block w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          View Receipt
        </a>
      </div>
    );
  }

  if (currentTransaction.status === "CANCELLED" || currentTransaction.status === "FAILED") {
    return (
      <div className="bg-white p-8 rounded-2xl shadow-lg max-w-md w-full text-center border-t-8 border-red-500">
        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertCircle size={32} />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment {currentTransaction.status === "CANCELLED" ? "Cancelled" : "Failed"}</h2>
        <p className="text-gray-500 mb-6">This payment request is no longer active.</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-xl max-w-md w-full">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{businessProfile.name}</h1>
        <p className="text-gray-500 text-sm mt-1">Payment Request</p>
      </div>

      <div className="bg-blue-50 text-blue-900 p-4 rounded-xl text-center mb-8">
        <p className="text-sm opacity-80 mb-1">Amount to pay</p>
        <p className="text-4xl font-extrabold">₹{currentTransaction.amount.toFixed(2)}</p>
      </div>

      {isHighValuePayment && (
        <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          For payments of Rs. 2000 or more, scan the QR from your UPI app if direct app opening shows a safety warning.
        </div>
      )}

      {hasFallbackUpi && (
        <div className="mb-6 grid grid-cols-2 gap-2 rounded-lg border border-gray-200 bg-gray-50 p-1">
          <button
            type="button"
            onClick={() => setPaymentTarget("merchant")}
            className={`rounded-md px-3 py-2 text-sm font-semibold transition-colors ${
              paymentTarget === "merchant" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-900"
            }`}
          >
            Merchant UPI
          </button>
          <button
            type="button"
            onClick={() => setPaymentTarget("personal")}
            className={`rounded-md px-3 py-2 text-sm font-semibold transition-colors ${
              paymentTarget === "personal" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-900"
            }`}
          >
            Personal UPI
          </button>
        </div>
      )}

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {upiApps.map((app) => {
          const Icon = app.icon;
          return (
            <a
              key={app.label}
              href={activeUpiUrl}
              className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-lg px-3 py-2 text-center text-xs font-semibold transition-colors ${app.className}`}
            >
              <Icon size={18} />
              <span>{app.label}</span>
            </a>
          );
        })}
      </div>

      <div className="flex flex-col items-center mb-8">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 inline-block">
          <QRCodeSVG
            value={activeUpiUrl}
            size={220}
            level="H"
            includeMargin={true}
          />
        </div>
        <p className="mt-4 text-sm text-gray-500 flex items-center gap-2">
          Scan to pay using any UPI app
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
          <div>
            <p className="text-xs text-gray-500">UPI ID</p>
            <p className="font-medium text-gray-900 text-sm">{activeUpiId}</p>
          </div>
          <button
            onClick={copyUpiId}
            className="p-2 text-gray-500 hover:text-blue-600 transition-colors bg-white rounded-md shadow-sm border border-gray-100"
          >
            {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
          </button>
        </div>

        <a
          href={activeUpiUrl}
          className="flex items-center justify-center gap-2 w-full py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors"
        >
          <ExternalLink size={18} /> Open Payment Link
        </a>
      </div>

      <div className="mt-8 pt-6 border-t border-gray-100 text-sm text-gray-500">
        <div className="flex justify-between mb-2">
          <span>Order ID:</span>
          <span className="font-medium text-gray-900">{currentTransaction.orderId}</span>
        </div>
        <div className="flex justify-between">
          <span>Customer:</span>
          <span className="font-medium text-gray-900">{currentTransaction.customerName}</span>
        </div>
        {currentTransaction.purpose && (
          <div className="flex justify-between mt-2">
            <span>Note:</span>
            <span className="font-medium text-gray-900 text-right truncate max-w-[200px]">{currentTransaction.purpose}</span>
          </div>
        )}
      </div>

      <div className="mt-6 text-center text-xs text-gray-400">
        Status will update automatically once the merchant verifies the payment.
      </div>
    </div>
  );
}
