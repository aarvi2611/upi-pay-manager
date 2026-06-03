"use client";

import { QRCodeSVG } from "qrcode.react";
import { CheckCircle, AlertCircle, Copy, Check } from "lucide-react";
import { useState } from "react";

export default function PaymentView({ transaction, businessProfile, upiUrl }: any) {
  const [copied, setCopied] = useState(false);

  const copyUpiId = () => {
    navigator.clipboard.writeText(businessProfile.upiId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (transaction.status === "PAID") {
    return (
      <div className="bg-white p-8 rounded-2xl shadow-lg max-w-md w-full text-center border-t-8 border-green-500">
        <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle size={32} />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h2>
        <p className="text-gray-500 mb-6">Thank you, {transaction.customerName}. Your payment has been received.</p>
        
        <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-500 text-sm">Amount Paid</span>
            <span className="font-bold text-gray-900">₹{transaction.amount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500 text-sm">Order ID</span>
            <span className="font-medium text-gray-900">{transaction.orderId}</span>
          </div>
          {transaction.utrNumber && (
            <div className="flex justify-between">
              <span className="text-gray-500 text-sm">UTR/Ref No.</span>
              <span className="font-medium text-gray-900">{transaction.utrNumber}</span>
            </div>
          )}
        </div>

        <a 
          href={`/receipt/${transaction.id}`} 
          className="block w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          View Receipt
        </a>
      </div>
    );
  }

  if (transaction.status === "CANCELLED" || transaction.status === "FAILED") {
    return (
      <div className="bg-white p-8 rounded-2xl shadow-lg max-w-md w-full text-center border-t-8 border-red-500">
        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertCircle size={32} />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment {transaction.status === "CANCELLED" ? "Cancelled" : "Failed"}</h2>
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
        <p className="text-4xl font-extrabold">₹{transaction.amount.toFixed(2)}</p>
      </div>

      <div className="flex flex-col items-center mb-8">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 inline-block">
          <QRCodeSVG 
            value={upiUrl} 
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
            <p className="font-medium text-gray-900 text-sm">{businessProfile.upiId}</p>
          </div>
          <button 
            onClick={copyUpiId}
            className="p-2 text-gray-500 hover:text-blue-600 transition-colors bg-white rounded-md shadow-sm border border-gray-100"
          >
            {copied ? <Check size={16} className="text-green-500"/> : <Copy size={16} />}
          </button>
        </div>

        <a 
          href={upiUrl}
          className="flex items-center justify-center w-full py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors md:hidden"
        >
          Pay Now on Mobile
        </a>
      </div>

      <div className="mt-8 pt-6 border-t border-gray-100 text-sm text-gray-500">
        <div className="flex justify-between mb-2">
          <span>Order ID:</span>
          <span className="font-medium text-gray-900">{transaction.orderId}</span>
        </div>
        <div className="flex justify-between">
          <span>Customer:</span>
          <span className="font-medium text-gray-900">{transaction.customerName}</span>
        </div>
        {transaction.purpose && (
          <div className="flex justify-between mt-2">
            <span>Note:</span>
            <span className="font-medium text-gray-900 text-right truncate max-w-[200px]">{transaction.purpose}</span>
          </div>
        )}
      </div>
      
      <div className="mt-6 text-center text-xs text-gray-400">
        Status will update once the merchant verifies the payment.
      </div>
    </div>
  );
}
