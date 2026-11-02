import React, { useState, useEffect } from 'react';
import { Search, Plus, ShoppingCart, Trash2 } from 'lucide-react';
import { Medicine, BillItem, Bill } from '../types';
import { api } from '../services/api';

interface BillingViewProps {
  storeId: string;
}

export const BillingView: React.FC<BillingViewProps> = ({ storeId }) => {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [cart, setCart] = useState<BillItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'upi'>('cash');
  const [searchTerm, setSearchTerm] = useState('');
  const [creating, setCreating] = useState(false);

  const activeStoreRaw = localStorage.getItem('activeStore');
  const currentStoreName = activeStoreRaw
    ? JSON.parse(activeStoreRaw).name || 'MediPOS Store'
    : 'MediPOS Store';

  useEffect(() => {
    fetchMedicines();
  }, [storeId]);

  const fetchMedicines = async () => {
    try {
      const data = await api.getMedicines(storeId);
      setMedicines(data || []);
    } catch (err) {
      console.error('Fetch medicines error:', err);
    }
  };

  const handleAddToCart = (medicine: Medicine) => {
    const existing = cart.find((item) => item.medicineId === medicine.id);
    if (existing) {
      if (existing.quantity >= medicine.stock) {
        alert('Cannot add more than available stock');
        return;
      }
      setCart(
        cart.map((item) =>
          item.medicineId === medicine.id
            ? {
                ...item,
                quantity: item.quantity + 1,
                subtotal: (item.quantity + 1) * item.price,
              }
            : item
        )
      );
    } else {
      if (medicine.stock < 1) {
        alert('Medicine out of stock');
        return;
      }
      setCart([
        ...cart,
        {
          medicineId: medicine.id,
          name: medicine.name,
          quantity: 1,
          price: medicine.price,
          subtotal: medicine.price,
        },
      ]);
    }
  };

  const handleUpdateQuantity = (medicineId: string, quantity: number) => {
    const medicine = medicines.find((m) => m.id === medicineId);
    if (quantity < 1) {
      handleRemoveItem(medicineId);
      return;
    }
    if (medicine && quantity > medicine.stock) {
      alert('Cannot exceed available stock');
      return;
    }
    setCart(
      cart.map((item) =>
        item.medicineId === medicineId
          ? {
              ...item,
              quantity,
              subtotal: quantity * item.price,
            }
          : item
      )
    );
  };

  const handleRemoveItem = (medicineId: string) => {
    setCart(cart.filter((item) => item.medicineId !== medicineId));
  };

  const calculateTotal = () => {
    return cart.reduce((total, item) => total + item.subtotal, 0);
  };

  // Generate Bill - Customer Name and Phone Number are BOTH OPTIONAL
  const handleCreateBill = async () => {
    if (cart.length === 0) {
      alert('Please add at least one medicine to the bill');
      return;
    }

    setCreating(true);
    try {
      const finalCustomerName = customerName.trim() || 'Walk-in Customer';
      const finalCustomerPhone = customerPhone.trim() || '';

      const res = await api.createBill({
        storeId,
        customerName: finalCustomerName,
        customerPhone: finalCustomerPhone,
        items: cart,
        total: calculateTotal(),
        paymentMethod,
      });

      if (res.success && res.bill) {
        alert('Bill created successfully!');
        printBill(res.bill);
        setCart([]);
        setCustomerName('');
        setCustomerPhone('');
        setPaymentMethod('cash');
        fetchMedicines(); // Refresh updated stock
      } else {
        alert(res.error || 'Failed to create bill');
      }
    } catch (err) {
      console.error('Create bill error:', err);
      alert('Failed to create bill');
    } finally {
      setCreating(false);
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
              background-color: #2563eb;
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
              <span>${bill.customerName || 'Walk-in Customer'}</span>
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
            <p>Wishing you good health and a speedy recovery.</p>
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

  const filteredMedicines = medicines.filter(
    (med) =>
      med.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      med.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      {/* Left Column: Medicine Catalog */}
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Select Medicines</h2>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search medicines by name or category..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
            />
          </div>

          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {filteredMedicines.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">No medicines available</p>
            ) : (
              filteredMedicines.map((med) => (
                <div
                  key={med.id}
                  className="flex justify-between items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{med.name}</p>
                    <p className="text-xs text-gray-500">
                      {med.category} • Available Stock:{' '}
                      <span className={med.stock < 10 ? 'text-red-600 font-bold' : 'text-gray-700'}>
                        {med.stock}
                      </span>
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="text-sm font-semibold text-gray-900">
                      Rs {med.price.toFixed(2)}
                    </p>
                    <button
                      onClick={() => handleAddToCart(med)}
                      disabled={med.stock < 1}
                      className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                      title="Add to bill"
                    >
                      <Plus className="size-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Right Column: Active Bill & Cart */}
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Current Bill</h2>

          {/* Customer Details Form - BOTH OPTIONAL */}
          <div className="space-y-4 mb-6">
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-medium text-gray-700">Customer Name</label>
                <span className="text-xs text-gray-400">Optional (Defaults to Walk-in)</span>
              </div>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                placeholder="Walk-in Customer"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                <span className="text-xs text-gray-400">Optional</span>
              </div>
              <input
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                placeholder="e.g. +1 555-1234"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Method
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              >
                <option value="cash">Cash</option>
                <option value="card">Card</option>
                <option value="upi">UPI</option>
              </select>
            </div>
          </div>

          {/* Cart Items List */}
          <div className="border-t border-gray-200 pt-4 mb-4">
            {cart.length === 0 ? (
              <div className="text-center py-8">
                <ShoppingCart className="size-12 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No items in bill yet. Select from the medicine catalog.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[300px] overflow-y-auto">
                {cart.map((item) => (
                  <div
                    key={item.medicineId}
                    className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex-1 mr-2">
                      <p className="text-sm font-semibold text-gray-900">{item.name}</p>
                      <p className="text-xs text-gray-500">Rs {item.price.toFixed(2)} each</p>
                    </div>

                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) =>
                          handleUpdateQuantity(item.medicineId!, parseInt(e.target.value) || 1)
                        }
                        className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      />
                      <p className="text-sm font-semibold text-gray-900 w-20 text-right">
                        Rs {item.subtotal.toFixed(2)}
                      </p>
                      <button
                        onClick={() => handleRemoveItem(item.medicineId!)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Remove item"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Total & Action */}
          <div className="border-t border-gray-200 pt-4 mb-4">
            <div className="flex justify-between items-center">
              <span className="text-lg font-bold text-gray-900">Total:</span>
              <span className="text-2xl font-bold text-gray-900">
                Rs {calculateTotal().toFixed(2)}
              </span>
            </div>
          </div>

          <button
            onClick={handleCreateBill}
            disabled={creating || cart.length === 0}
            className="w-full py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            {creating ? 'Creating Bill...' : 'Create & Print Bill'}
          </button>
        </div>
      </div>
    </div>
  );
};
