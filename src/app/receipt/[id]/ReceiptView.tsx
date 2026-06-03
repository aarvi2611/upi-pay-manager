"use client";

import { format } from "date-fns";
import { Download, CheckCircle, Store } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function ReceiptView({ transaction, businessProfile }: any) {
  const handleDownload = () => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(22);
    doc.setTextColor(40);
    doc.text(businessProfile.name, 14, 22);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    if (businessProfile.address) doc.text(businessProfile.address, 14, 30);
    if (businessProfile.phone) doc.text(`Phone: ${businessProfile.phone}`, 14, 35);
    doc.text(`UPI ID: ${businessProfile.upiId}`, 14, 40);

    // Title
    doc.setFontSize(16);
    doc.setTextColor(0);
    doc.text("PAYMENT RECEIPT", 105, 55, { align: "center" });
    
    doc.setFontSize(10);
    doc.text(`Receipt Date: ${format(new Date(), 'dd MMM yyyy HH:mm')}`, 14, 65);
    
    autoTable(doc, {
      startY: 75,
      head: [['Description', 'Details']],
      body: [
        ['Order ID', transaction.orderId],
        ['Payment Date', transaction.paymentDate ? format(new Date(transaction.paymentDate), 'dd MMM yyyy HH:mm') : format(new Date(), 'dd MMM yyyy HH:mm')],
        ['Customer Name', transaction.customerName],
        ['Customer Phone', transaction.customerPhone || 'N/A'],
        ['Purpose/Note', transaction.purpose || 'N/A'],
        ['Status', 'PAID (Verified)'],
        ['UTR / Ref No.', transaction.utrNumber || 'N/A'],
      ],
      theme: 'grid',
      headStyles: { fillColor: [41, 128, 185], textColor: 255 },
      styles: { fontSize: 10, cellPadding: 5 },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 60 } }
    });

    const finalY = (doc as any).lastAutoTable.finalY || 150;
    
    doc.setFontSize(14);
    doc.text(`Total Paid: Rs. ${transaction.amount.toFixed(2)}`, 14, finalY + 15);
    
    doc.setFontSize(10);
    doc.setTextColor(150);
    doc.text("Thank you for your business!", 105, finalY + 35, { align: "center" });

    doc.save(`Receipt-${transaction.orderId}.pdf`);
  };

  return (
    <div className="max-w-lg w-full">
      <div className="bg-white p-8 rounded-t-2xl shadow-lg border-b-2 border-dashed border-gray-200 relative">
        <div className="absolute top-0 left-0 w-full h-2 bg-blue-600 rounded-t-2xl"></div>
        
        <div className="flex justify-between items-start mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Store className="text-blue-600" size={24} />
              <h1 className="text-xl font-bold text-gray-900">{businessProfile.name}</h1>
            </div>
            {businessProfile.address && <p className="text-sm text-gray-500 max-w-[200px]">{businessProfile.address}</p>}
            <p className="text-sm text-gray-500 mt-1">UPI: {businessProfile.upiId}</p>
          </div>
          <div className="text-right">
            <h2 className="text-2xl font-black text-gray-200 tracking-wider uppercase">Receipt</h2>
            <p className="text-sm font-medium text-gray-500 mt-2">#{transaction.orderId}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-green-50 p-4 rounded-xl mb-8">
          <CheckCircle className="text-green-500" size={24} />
          <div>
            <p className="text-sm font-semibold text-green-800">Payment Successful</p>
            <p className="text-xs text-green-600">{transaction.paymentDate ? format(new Date(transaction.paymentDate), 'dd MMM yyyy, HH:mm') : format(new Date(transaction.updatedAt), 'dd MMM yyyy, HH:mm')}</p>
          </div>
        </div>

        <div className="space-y-4 text-sm">
          <div className="flex justify-between border-b border-gray-100 pb-3">
            <span className="text-gray-500">Customer</span>
            <span className="font-medium text-gray-900">{transaction.customerName}</span>
          </div>
          {transaction.customerPhone && (
            <div className="flex justify-between border-b border-gray-100 pb-3">
              <span className="text-gray-500">Phone</span>
              <span className="font-medium text-gray-900">{transaction.customerPhone}</span>
            </div>
          )}
          {transaction.purpose && (
            <div className="flex justify-between border-b border-gray-100 pb-3">
              <span className="text-gray-500">Purpose</span>
              <span className="font-medium text-gray-900">{transaction.purpose}</span>
            </div>
          )}
          {transaction.utrNumber && (
            <div className="flex justify-between border-b border-gray-100 pb-3">
              <span className="text-gray-500">UTR No.</span>
              <span className="font-medium text-gray-900">{transaction.utrNumber}</span>
            </div>
          )}
        </div>

        <div className="mt-8 pt-4 border-t-2 border-gray-900 flex justify-between items-center">
          <span className="font-bold text-gray-900">Amount Paid</span>
          <span className="text-2xl font-bold text-blue-600">₹{transaction.amount.toFixed(2)}</span>
        </div>
      </div>
      
      <div className="bg-gray-50 p-6 rounded-b-2xl shadow-lg flex justify-center gap-4">
        <button 
          onClick={handleDownload}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors w-full justify-center"
        >
          <Download size={18} /> Download PDF
        </button>
      </div>
    </div>
  );
}
