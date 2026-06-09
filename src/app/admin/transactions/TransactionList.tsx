"use client";

import { useRef, useState } from "react";
import { format } from "date-fns";
import { QRCodeCanvas } from "qrcode.react";
import { CheckCircle, Copy, Download, Edit, ExternalLink, QrCode, Save, Trash2, X, XCircle } from "lucide-react";

export type TransactionListItem = {
  id: string;
  orderId: string;
  customerName: string;
  customerPhone: string | null;
  amount: number;
  purpose: string | null;
  upiTarget: string;
  status: string;
  utrNumber: string | null;
  paymentDate: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

type EditableTransaction = Omit<TransactionListItem, "amount"> & {
  amount: string;
};

export default function TransactionList({
  initialData,
  publicBaseUrl,
  businessProfile,
}: {
  initialData: TransactionListItem[];
  publicBaseUrl: string;
  businessProfile: {
    name: string;
    phone?: string | null;
  };
}) {
  const [transactions, setTransactions] = useState(initialData);
  const [filter, setFilter] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [editingTransaction, setEditingTransaction] = useState<EditableTransaction | null>(null);
  const [qrTransaction, setQrTransaction] = useState<TransactionListItem | null>(null);
  const qrCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const filteredData = transactions.filter((tx) => {
    const matchesFilter = filter === "ALL" || tx.status === filter;
    const matchesSearch = 
      tx.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.orderId.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    let utrNumber = "";
    if (newStatus === "PAID") {
      utrNumber = prompt("Enter UTR Number for verification (optional):") || "";
    }

    try {
      const res = await fetch(`/api/transactions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, utrNumber }),
      });

      if (!res.ok) {
        const err = await res.text();
        alert(`Error: ${err}`);
        return;
      }

      const updated = await res.json();
      setTransactions((prev) => prev.map((t) => (t.id === id ? updated : t)));
    } catch {
      alert("Failed to update status");
    }
  };

  const handleSaveEdit = async () => {
    if (!editingTransaction) return;

    try {
      const res = await fetch(`/api/transactions/${editingTransaction.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: editingTransaction.customerName,
          customerPhone: editingTransaction.customerPhone,
          amount: editingTransaction.amount,
          purpose: editingTransaction.purpose,
          status: editingTransaction.status,
          utrNumber: editingTransaction.utrNumber,
        }),
      });

      if (!res.ok) {
        const err = await res.text();
        alert(`Error: ${err}`);
        return;
      }

      const updated = await res.json();
      setTransactions((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      setEditingTransaction(null);
    } catch {
      alert("Failed to edit transaction");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this transaction permanently?")) return;

    try {
      const res = await fetch(`/api/transactions/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const err = await res.text();
        alert(`Error: ${err}`);
        return;
      }

      setTransactions((prev) => prev.filter((tx) => tx.id !== id));
    } catch {
      alert("Failed to delete transaction");
    }
  };

  const handleDeleteVisible = async () => {
    if (filteredData.length === 0) return;
    if (!confirm(`Delete ${filteredData.length} visible transaction(s) permanently?`)) return;

    const ids = filteredData.map((tx) => tx.id);
    await Promise.all(ids.map((id) => fetch(`/api/transactions/${id}`, { method: "DELETE" })));
    setTransactions((prev) => prev.filter((tx) => !ids.includes(tx.id)));
  };

  const makePaymentLink = (id: string) => `${publicBaseUrl}/pay/${id}`;

  const copyLink = (id: string) => {
    const link = makePaymentLink(id);
    navigator.clipboard.writeText(link);
    alert("Payment link copied!");
  };

  const downloadQrCard = () => {
    if (!qrTransaction || !qrCanvasRef.current) return;

    const canvas = document.createElement("canvas");
    canvas.width = 1080;
    canvas.height = 1400;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const amount = Number(qrTransaction.amount || 0).toFixed(2);
    const businessName = businessProfile.name || "Axienta Business Consulting";

    ctx.fillStyle = "#f8fafc";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const drawRoundRect = (x: number, y: number, width: number, height: number, radius: number) => {
      ctx.beginPath();
      ctx.moveTo(x + radius, y);
      ctx.lineTo(x + width - radius, y);
      ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
      ctx.lineTo(x + width, y + height - radius);
      ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
      ctx.lineTo(x + radius, y + height);
      ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
      ctx.lineTo(x, y + radius);
      ctx.quadraticCurveTo(x, y, x + radius, y);
      ctx.closePath();
    };

    const wrapText = (text: string, x: number, y: number, maxWidth: number, lineHeight: number, maxLines = 2) => {
      const words = text.split(" ");
      let line = "";
      let lines = 0;

      words.forEach((word, index) => {
        const testLine = line ? `${line} ${word}` : word;
        if (ctx.measureText(testLine).width > maxWidth && line) {
          if (lines < maxLines) ctx.fillText(line, x, y + lines * lineHeight);
          lines += 1;
          line = word;
        } else {
          line = testLine;
        }

        if (index === words.length - 1 && lines < maxLines) {
          ctx.fillText(line, x, y + lines * lineHeight);
        }
      });
    };

    const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
    gradient.addColorStop(0, "#2563eb");
    gradient.addColorStop(1, "#0f172a");
    ctx.fillStyle = gradient;
    drawRoundRect(70, 70, 940, 1260, 46);
    ctx.fill();

    ctx.fillStyle = "#ffffff";
    drawRoundRect(110, 110, 860, 1180, 36);
    ctx.fill();

    ctx.fillStyle = "#dbeafe";
    drawRoundRect(150, 150, 780, 150, 26);
    ctx.fill();

    ctx.fillStyle = "#1d4ed8";
    ctx.font = "700 42px Arial";
    ctx.textAlign = "center";
    wrapText(businessName, 540, 215, 700, 48, 2);

    ctx.fillStyle = "#64748b";
    ctx.font = "500 26px Arial";
    ctx.fillText("Secure Payment QR", 540, 275);

    ctx.fillStyle = "#0f172a";
    ctx.font = "800 84px Arial";
    ctx.fillText(`Rs. ${amount}`, 540, 405);

    ctx.fillStyle = "#475569";
    ctx.font = "500 30px Arial";
    ctx.fillText(`Order: ${qrTransaction.orderId}`, 540, 455);

    ctx.fillStyle = "#ffffff";
    ctx.shadowColor = "rgba(15, 23, 42, 0.14)";
    ctx.shadowBlur = 34;
    ctx.shadowOffsetY = 18;
    drawRoundRect(225, 515, 630, 630, 34);
    ctx.fill();
    ctx.shadowColor = "transparent";
    ctx.drawImage(qrCanvasRef.current, 285, 575, 510, 510);

    ctx.fillStyle = "#0f172a";
    ctx.font = "700 34px Arial";
    ctx.fillText("Scan to open payment link", 540, 1210);

    ctx.fillStyle = "#64748b";
    ctx.font = "500 24px Arial";
    wrapText(`Customer: ${qrTransaction.customerName}`, 540, 1252, 760, 30, 1);
    if (qrTransaction.purpose) {
      wrapText(`Note: ${qrTransaction.purpose}`, 540, 1288, 760, 30, 1);
    } else if (businessProfile.phone) {
      wrapText(`Contact: ${businessProfile.phone}`, 540, 1288, 760, 30, 1);
    }

    const linkElement = document.createElement("a");
    linkElement.href = canvas.toDataURL("image/png");
    linkElement.download = `payment-qr-${qrTransaction.orderId || qrTransaction.id}.png`;
    linkElement.click();
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
      <div className="p-4 border-b flex flex-col md:flex-row justify-between gap-4">
        <input
          type="text"
          placeholder="Search by name or Order ID..."
          className="px-4 py-2 border rounded-lg md:w-80 outline-none focus:ring-2 focus:ring-blue-500"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <select
          className="px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="ALL">All Status</option>
          <option value="PENDING">Pending</option>
          <option value="PAID">Paid</option>
          <option value="FAILED">Failed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
        <button
          onClick={handleDeleteVisible}
          disabled={filteredData.length === 0}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Trash2 size={16} /> Delete Visible
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3">Order ID / Link</th>
              <th className="px-6 py-3">Customer Info</th>
              <th className="px-6 py-3">Amount</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3">Date</th>
              <th className="px-6 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map((tx) => (
              <tr key={tx.id} className="border-b last:border-0 hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="font-medium text-gray-900">{tx.orderId}</div>
                  <div className="mt-1 text-[11px] font-medium uppercase tracking-wide text-gray-400">
                    {tx.upiTarget === "PERSONAL" ? "Personal UPI" : "Merchant UPI"}
                  </div>
                  <div className="flex gap-2 mt-1">
                    <button onClick={() => copyLink(tx.id)} className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-xs">
                      <Copy size={12} /> Copy Link
                    </button>
                    <button onClick={() => setQrTransaction(tx)} className="text-emerald-600 hover:text-emerald-800 flex items-center gap-1 text-xs">
                      <QrCode size={12} /> QR Code
                    </button>
                    <a href={makePaymentLink(tx.id)} target="_blank" className="text-gray-600 hover:text-gray-800 flex items-center gap-1 text-xs">
                      <ExternalLink size={12} /> View
                    </a>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="font-medium">{tx.customerName}</div>
                  <div className="text-gray-500 text-xs">{tx.customerPhone}</div>
                  {tx.purpose && <div className="text-gray-400 text-xs mt-1 truncate max-w-[150px]">{tx.purpose}</div>}
                </td>
                <td className="px-6 py-4 font-bold">₹{tx.amount.toFixed(2)}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    tx.status === 'PAID' ? 'bg-green-100 text-green-700' :
                    tx.status === 'PENDING' ? 'bg-orange-100 text-orange-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {tx.status}
                  </span>
                  {tx.utrNumber && <div className="text-[10px] text-gray-500 mt-1">UTR: {tx.utrNumber}</div>}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {tx.createdAt ? format(new Date(tx.createdAt), 'dd MMM yyyy, HH:mm') : "N/A"}
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-2">
                    {tx.status === 'PENDING' && (
                      <>
                      <button 
                        onClick={() => handleUpdateStatus(tx.id, 'PAID')}
                        className="p-1.5 bg-green-50 text-green-600 rounded hover:bg-green-100" title="Mark as Paid"
                      >
                        <CheckCircle size={18} />
                      </button>
                      <button 
                        onClick={() => handleUpdateStatus(tx.id, 'CANCELLED')}
                        className="p-1.5 bg-red-50 text-red-600 rounded hover:bg-red-100" title="Cancel"
                      >
                        <XCircle size={18} />
                      </button>
                      </>
                    )}
                    <button
                      onClick={() => setEditingTransaction({ ...tx, amount: tx.amount.toString() })}
                      className="p-1.5 bg-blue-50 text-blue-600 rounded hover:bg-blue-100"
                      title="Edit"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(tx.id)}
                      className="p-1.5 bg-red-50 text-red-600 rounded hover:bg-red-100"
                      title="Delete"
                    >
                      <Trash2 size={18} />
                    </button>
                    {tx.status === 'PAID' && (
                      <a href={`/receipt/${tx.id}`} target="_blank" className="text-sm text-blue-600 hover:underline">
                        View Receipt
                      </a>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {filteredData.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                  No transactions found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {editingTransaction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-xl rounded-lg bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Edit Transaction</h2>
              <button
                onClick={() => setEditingTransaction(null)}
                className="rounded p-1 text-gray-500 hover:bg-gray-100"
              >
                <X size={20} />
              </button>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <label className="text-sm font-medium text-gray-700">
                Customer Name
                <input
                  className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                  value={editingTransaction.customerName || ""}
                  onChange={(e) => setEditingTransaction({ ...editingTransaction, customerName: e.target.value })}
                />
              </label>
              <label className="text-sm font-medium text-gray-700">
                Customer Phone
                <input
                  className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                  value={editingTransaction.customerPhone || ""}
                  onChange={(e) => setEditingTransaction({ ...editingTransaction, customerPhone: e.target.value })}
                />
              </label>
              <label className="text-sm font-medium text-gray-700">
                Amount
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                  value={editingTransaction.amount || ""}
                  onChange={(e) => setEditingTransaction({ ...editingTransaction, amount: e.target.value })}
                />
              </label>
              <label className="text-sm font-medium text-gray-700">
                Status
                <select
                  className="mt-1 w-full rounded-md border bg-white px-3 py-2 text-sm"
                  value={editingTransaction.status || "PENDING"}
                  onChange={(e) => setEditingTransaction({ ...editingTransaction, status: e.target.value })}
                >
                  <option value="PENDING">Pending</option>
                  <option value="PAID">Paid</option>
                  <option value="FAILED">Failed</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </label>
              <label className="text-sm font-medium text-gray-700 md:col-span-2">
                UTR Number
                <input
                  className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                  value={editingTransaction.utrNumber || ""}
                  onChange={(e) => setEditingTransaction({ ...editingTransaction, utrNumber: e.target.value })}
                />
              </label>
              <label className="text-sm font-medium text-gray-700 md:col-span-2">
                Purpose / Note
                <textarea
                  className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                  rows={3}
                  value={editingTransaction.purpose || ""}
                  onChange={(e) => setEditingTransaction({ ...editingTransaction, purpose: e.target.value })}
                />
              </label>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setEditingTransaction(null)}
                className="inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                <X size={16} /> Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                <Save size={16} /> Save
              </button>
            </div>
          </div>
        </div>
      )}
      {qrTransaction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Professional QR Code</h2>
                <p className="text-sm text-gray-500">Download and send this payment QR to your client.</p>
              </div>
              <button
                onClick={() => setQrTransaction(null)}
                className="rounded p-1 text-gray-500 hover:bg-gray-100"
                title="Close"
              >
                <X size={20} />
              </button>
            </div>

            <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 text-center">
              <p className="text-sm font-semibold text-gray-900">{businessProfile.name}</p>
              <p className="mt-1 text-3xl font-extrabold text-blue-700">Rs. {Number(qrTransaction.amount || 0).toFixed(2)}</p>
              <p className="mt-1 text-xs text-gray-500">Order: {qrTransaction.orderId}</p>
              <div className="mx-auto mt-4 flex w-fit rounded-xl bg-white p-3 shadow-sm">
                <QRCodeCanvas
                  ref={qrCanvasRef}
                  value={makePaymentLink(qrTransaction.id)}
                  size={260}
                  level="H"
                  marginSize={4}
                />
              </div>
              <p className="mt-3 text-xs text-gray-500">Client scans this QR to open the secure payment page.</p>
            </div>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <button
                onClick={() => copyLink(qrTransaction.id)}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-md border px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                <Copy size={16} /> Copy Link
              </button>
              <button
                onClick={downloadQrCard}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                <Download size={16} /> Download PNG
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
