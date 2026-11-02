import React, { useState, useEffect } from 'react';
import { Search, FileText, Eye, Download, X } from 'lucide-react';
import { Bill } from '../types';
import { api } from '../services/api';

interface BillsViewProps {
  storeId: string;
}

export const BillsView: React.FC<BillsViewProps> = ({ storeId }) => {
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);

  const activeStoreRaw = localStorage.getItem('activeStore');
  const currentStoreName = activeStoreRaw
    ? JSON.parse(activeStoreRaw).name || 'MediPOS Store'
    : 'MediPOS Store';

  useEffect(() => {
    fetchBills();
  }, [storeId]);

  const fetchBills = async () => {
    try {
      setLoading(true);
      const data = await api.getBills(storeId);
      setBills(data || []);
    } catch (err) {
      console.error('Fetch bills error:', err);
    } finally {
      setLoading(false);
    }
  };

  const printBill = (bill: Bill) => {
    const printWindow = window.open('', '', 'width=800,height=600');
    if (!printWindow) return;

    const receiptHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Bill - ${bill.id}</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
              padding: 24px;
              max-width: 800px;
              margin: 0 auto;
              color: #111827;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              border-bottom: 2px solid #111827;
              padding-bottom: 20px;
            }
            .header h1 {
              margin: 0 0 8px 0;
              font-size: 28px;
              color: #1d4ed8;
            }
            .header p {
              margin: 0;
              color: #4b5563;
              font-family: monospace;
              font-size: 14px;
            }
            .info {
              margin-bottom: 24px;
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 8px 16px;
            }
            .info-row {
              display: flex;
              justify-content: space-between;
              font-size: 14px;
              border-bottom: 1px dashed #e5e7eb;
              padding-bottom: 4px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 20px 0;
            }
            th, td {
              border: 1px solid #e5e7eb;
              padding: 12px;
              text-align: left;
              font-size: 14px;
            }
            th {
              background-color: #f9fafb;
              font-weight: 600;
            }
            .total {
              text-align: right;
              font-size: 20px;
              margin-top: 20px;
              padding-top: 10px;
              border-top: 2px solid #111827;
              font-weight: bold;
            }
            .footer {
              margin-top: 40px;
              text-align: center;
              color: #6b7280;
              font-size: 13px;
            }
            .buttons {
              text-align: center;
              margin-top: 24px;
            }
            button {
              padding: 10px 24px;
              font-size: 15px;
              cursor: pointer;
              border-radius: 6px;
              border: none;
              font-weight: 500;
            }
            .btn-print {
              background-color: #16a34a;
              color: white;
            }
            .btn-close {
              background-color: #f3f4f6;
              color: #374151;
              margin-left: 10px;
            }
            @media print {
              .buttons {
                display: none;
              }
              body {
                padding: 0;
              }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${currentStoreName}</h1>
            <p>Bill ID: ${bill.id}</p>
          </div>
          
          <div class="info">
            <div class="info-row">
              <strong>Customer Name:</strong>
              <span>${bill.customerName}</span>
            </div>
            <div class="info-row">
              <strong>Phone:</strong>
              <span>${bill.customerPhone || 'N/A'}</span>
            </div>
            <div class="info-row">
              <strong>Date:</strong>
              <span>${new Date(bill.createdAt).toLocaleString()}</span>
            </div>
            <div class="info-row">
              <strong>Payment Method:</strong>
              <span>${bill.paymentMethod.toUpperCase()}</span>
            </div>
          </div>
          
          <table>
            <thead>
              <tr>
                <th>Medicine</th>
                <th>Quantity</th>
                <th>Price</th>
                <th>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${bill.items
                .map(
                  (item) => `
                <tr>
                  <td>${item.name}</td>
                  <td>${item.quantity}</td>
                  <td>Rs ${item.price.toFixed(2)}</td>
                  <td>Rs ${item.subtotal.toFixed(2)}</td>
                </tr>
              `
                )
                .join('')}
            </tbody>
          </table>
          
          <div class="total">
            Total: Rs ${bill.total.toFixed(2)}
          </div>
          
          <div class="footer">
            <p>Thank you for choosing ${currentStoreName}!</p>
            <p>We appreciate your business.</p>
          </div>
          
          <div class="buttons">
            <button class="btn-print" onclick="window.print()">Print Bill</button>
            <button class="btn-close" onclick="window.close()">Close</button>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(receiptHtml);
    printWindow.document.close();
  };

  const filteredBills = bills.filter(
    (bill) =>
      (bill.customerName || 'Walk-in Customer').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (bill.customerPhone && bill.customerPhone.toLowerCase().includes(searchTerm.toLowerCase())) ||
      bill.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by customer name, phone, or bill ID..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
          />
        </div>
      </div>

      {/* Bill History Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Bill History</h2>
          <p className="text-sm text-gray-600 mt-1">Total: {filteredBills.length} bills</p>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading bills...</div>
        ) : filteredBills.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="size-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">
              {searchTerm ? 'No bills found matching your search' : 'No bills yet'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Bill ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Items
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Payment
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredBills.map((bill) => (
                  <tr key={bill.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm text-gray-900 font-mono">
                      {bill.id.substring(0, 12)}...
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{bill.customerName}</div>
                        <div className="text-sm text-gray-500">{bill.customerPhone || 'N/A'}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {bill.items.length} item{bill.items.length !== 1 ? 's' : ''}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                      Rs {bill.total.toFixed(2)}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded uppercase">
                        {bill.paymentMethod}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(bill.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => setSelectedBill(bill)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="View details"
                        >
                          <Eye className="size-4" />
                        </button>
                        <button
                          onClick={() => printBill(bill)}
                          className="p-2 text-green-600 hover:bg-green-50 rounded transition-colors"
                          title="Print/Download"
                        >
                          <Download className="size-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Bill Details Modal */}
      {selectedBill && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Bill Details</h2>
                <p className="text-sm text-gray-600 mt-1 font-mono">ID: {selectedBill.id}</p>
              </div>
              <button
                onClick={() => setSelectedBill(null)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div>
                <p className="text-sm text-gray-600">Customer Name</p>
                <p className="text-gray-900 font-semibold">{selectedBill.customerName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Phone Number</p>
                <p className="text-gray-900 font-semibold">{selectedBill.customerPhone || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Payment Method</p>
                <p className="text-gray-900 font-semibold uppercase">
                  {selectedBill.paymentMethod}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Date</p>
                <p className="text-gray-900 font-semibold">
                  {new Date(selectedBill.createdAt).toLocaleString()}
                </p>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Items</h3>
              <div className="space-y-3">
                {selectedBill.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{item.name}</p>
                      <p className="text-xs text-gray-500">
                        Quantity: {item.quantity} × Rs {item.price.toFixed(2)}
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-gray-900">
                      Rs {item.subtotal.toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-gray-200 mt-6 pt-6 flex justify-between items-center">
              <span className="text-lg font-bold text-gray-900">Total</span>
              <span className="text-2xl font-bold text-gray-900">
                Rs {selectedBill.total.toFixed(2)}
              </span>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setSelectedBill(null)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => printBill(selectedBill)}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
              >
                Print Bill
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
