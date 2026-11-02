import React, { useState, useEffect } from 'react';
import { Plus, Search, Package, Pen, Trash2, AlertTriangle, Filter, Check } from 'lucide-react';
import { Medicine, MedicineFormData } from '../types';
import { api } from '../services/api';

interface MedicinesViewProps {
  storeId: string;
  initialFilter?: 'all' | 'low-stock' | 'expiring-soon';
}

export const MedicinesView: React.FC<MedicinesViewProps> = ({ storeId, initialFilter = 'all' }) => {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'all' | 'low-stock' | 'expiring-soon'>(initialFilter);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingMedicine, setEditingMedicine] = useState<Medicine | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Category inline addition state
  const [isAddingNewCategory, setIsAddingNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [addingCategoryLoading, setAddingCategoryLoading] = useState(false);

  const [formData, setFormData] = useState<MedicineFormData>({
    name: '',
    category: '',
    price: '',
    stock: '',
    expiryDate: '',
    description: '',
  });

  useEffect(() => {
    setActiveFilter(initialFilter);
  }, [initialFilter]);

  useEffect(() => {
    fetchMedicinesAndCategories();
  }, [storeId]);

  const fetchMedicinesAndCategories = async () => {
    try {
      setLoading(true);
      const [medsData, catsData] = await Promise.all([
        api.getMedicines(storeId),
        api.getCategories(storeId),
      ]);
      setMedicines(medsData || []);
      setCategories(catsData || []);
    } catch (err) {
      console.error('Fetch medicines/categories error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNewCategory = async () => {
    if (!newCategoryName.trim()) return;
    setAddingCategoryLoading(true);
    try {
      const res = await api.createCategory(storeId, newCategoryName.trim());
      if (res.success && res.category) {
        if (!categories.includes(res.category)) {
          setCategories([...categories, res.category].sort());
        }
        setFormData({ ...formData, category: res.category });
        setIsAddingNewCategory(false);
        setNewCategoryName('');
      } else {
        alert(res.error || 'Failed to create category');
      }
    } catch (err) {
      console.error('Create category error:', err);
      alert('Failed to add category');
    } finally {
      setAddingCategoryLoading(false);
    }
  };

  const handleAddMedicine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.category) {
      alert('Please select or add a category');
      return;
    }
    try {
      const res = await api.addMedicine(storeId, formData);
      if (res.success && res.medicine) {
        setMedicines([...medicines, res.medicine]);
        setShowAddModal(false);
        resetForm();
      } else {
        alert(res.error || 'Failed to add medicine');
      }
    } catch (err) {
      console.error('Add medicine error:', err);
      alert('Failed to add medicine');
    }
  };

  const handleEditMedicine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMedicine) return;
    if (!formData.category) {
      alert('Please select or add a category');
      return;
    }
    try {
      const res = await api.updateMedicine(storeId, editingMedicine.id, formData);
      if (res.success && res.medicine) {
        setMedicines(
          medicines.map((m) => (m.id === editingMedicine.id ? res.medicine! : m))
        );
        setShowEditModal(false);
        setEditingMedicine(null);
        resetForm();
      } else {
        alert(res.error || 'Failed to update medicine');
      }
    } catch (err) {
      console.error('Edit medicine error:', err);
      alert('Failed to update medicine');
    }
  };

  const handleDeleteMedicine = async (id: string) => {
    if (confirm('Are you sure you want to delete this medicine?')) {
      try {
        const res = await api.deleteMedicine(storeId, id);
        if (res.success) {
          setMedicines(medicines.filter((m) => m.id !== id));
        } else {
          alert(res.error || 'Failed to delete medicine');
        }
      } catch (err) {
        console.error('Delete medicine error:', err);
        alert('Failed to delete medicine');
      }
    }
  };

  const openEditModal = (med: Medicine) => {
    setEditingMedicine(med);
    setFormData({
      name: med.name,
      category: med.category,
      price: med.price.toString(),
      stock: med.stock.toString(),
      expiryDate: med.expiryDate,
      description: med.description || '',
    });
    setIsAddingNewCategory(false);
    setShowEditModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      category: categories[0] || 'Tablet',
      price: '',
      stock: '',
      expiryDate: '',
      description: '',
    });
    setIsAddingNewCategory(false);
    setNewCategoryName('');
  };

  const isExpiringSoon = (expiryDateStr: string) => {
    const expiry = new Date(expiryDateStr);
    const in30Days = new Date();
    in30Days.setDate(in30Days.getDate() + 30);
    return expiry <= in30Days;
  };

  // Counts for filter pills
  const lowStockCount = medicines.filter((m) => m.stock < 10).length;
  const expiringSoonCount = medicines.filter((m) => isExpiringSoon(m.expiryDate)).length;

  // Filter application
  const filteredMedicines = medicines.filter((med) => {
    const matchesSearch =
      med.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      med.category.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory =
      selectedCategory === 'all' || med.category.toLowerCase() === selectedCategory.toLowerCase();

    let matchesStatus = true;
    if (activeFilter === 'low-stock') {
      matchesStatus = med.stock < 10;
    } else if (activeFilter === 'expiring-soon') {
      matchesStatus = isExpiringSoon(med.expiryDate);
    }

    return matchesSearch && matchesCategory && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Top Search & Filter Bar */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Medicine Inventory</h2>
            <p className="text-sm text-gray-500">Manage medicine stocks, prices, categories, and expiry alerts</p>
          </div>
          <button
            onClick={() => {
              resetForm();
              setShowAddModal(true);
            }}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Plus className="size-4" />
            Add Medicine
          </button>
        </div>

        {/* Filter Pills: All, Low Stock, Expiring Soon, Category */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-100">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
              activeFilter === 'all'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All Medicines ({medicines.length})
          </button>

          <button
            onClick={() => setActiveFilter('low-stock')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition ${
              activeFilter === 'low-stock'
                ? 'bg-red-600 text-white shadow-sm'
                : 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
            }`}
          >
            <AlertTriangle className="size-3.5" />
            Low Stock ({lowStockCount})
          </button>

          <button
            onClick={() => setActiveFilter('expiring-soon')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition ${
              activeFilter === 'expiring-soon'
                ? 'bg-orange-600 text-white shadow-sm'
                : 'bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-200'
            }`}
          >
            <AlertTriangle className="size-3.5" />
            Expiring Soon ({expiringSoonCount})
          </button>

          {/* Category Dropdown Filter */}
          <div className="flex items-center gap-1 ml-auto">
            <Filter className="size-4 text-gray-400" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg bg-white text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              <option value="all">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search medicines by name or category..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
          />
        </div>
      </div>

      {/* Grid of Medicines */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading medicines...</div>
      ) : filteredMedicines.length === 0 ? (
        <div className="bg-white p-12 rounded-xl shadow-sm border border-gray-200 text-center">
          <Package className="size-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">
            {searchTerm || activeFilter !== 'all' || selectedCategory !== 'all'
              ? 'No medicines match the selected filter criteria'
              : 'No medicines in inventory. Add your first medicine!'}
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMedicines.map((med) => (
            <div
              key={med.id}
              className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1 mr-2">
                    <h3 className="text-lg font-bold text-gray-900 mb-1">{med.name}</h3>
                    <span className="inline-block px-2.5 py-0.5 text-xs font-medium bg-blue-50 text-blue-700 rounded-full">
                      {med.category}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => openEditModal(med)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                      title="Edit medicine"
                    >
                      <Pen className="size-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteMedicine(med.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                      title="Delete medicine"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Price:</span>
                    <span className="text-sm font-semibold text-gray-900">
                      Rs {med.price.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Stock:</span>
                    <span
                      className={`text-sm font-bold ${
                        med.stock < 10 ? 'text-red-600' : 'text-gray-900'
                      }`}
                    >
                      {med.stock} units
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Expiry Date:</span>
                    <span
                      className={`text-sm font-medium ${
                        isExpiringSoon(med.expiryDate)
                          ? 'text-orange-600 font-bold'
                          : 'text-gray-900'
                      }`}
                    >
                      {new Date(med.expiryDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {med.description && (
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">{med.description}</p>
                )}
              </div>

              <div className="flex gap-2 flex-wrap pt-2 border-t border-gray-100">
                {med.stock < 10 && (
                  <span className="flex items-center gap-1 px-2 py-1 bg-red-50 text-red-700 text-xs font-semibold rounded">
                    <AlertTriangle className="size-3" />
                    Low Stock
                  </span>
                )}
                {isExpiringSoon(med.expiryDate) && (
                  <span className="flex items-center gap-1 px-2 py-1 bg-orange-50 text-orange-700 text-xs font-semibold rounded">
                    <AlertTriangle className="size-3" />
                    Expiring Soon
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Medicine Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Add New Medicine</h2>
            <form onSubmit={handleAddMedicine}>
              <div className="grid md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Medicine Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                    placeholder="e.g. Paracetamol 500mg"
                    required
                  />
                </div>

                {/* Category Dropdown with "Add Category" option */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
                  {!isAddingNewCategory ? (
                    <div className="space-y-2">
                      <select
                        value={formData.category}
                        onChange={(e) => {
                          if (e.target.value === '__ADD_NEW__') {
                            setIsAddingNewCategory(true);
                          } else {
                            setFormData({ ...formData, category: e.target.value });
                          }
                        }}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition bg-white"
                        required
                      >
                        <option value="" disabled>Select a category</option>
                        {categories.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                        <option value="__ADD_NEW__" className="font-bold text-blue-600">
                          + Add New Category...
                        </option>
                      </select>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        placeholder="New category name"
                        className="flex-1 px-4 py-2 border border-blue-400 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={handleAddNewCategory}
                        disabled={addingCategoryLoading || !newCategoryName.trim()}
                        className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium disabled:opacity-50"
                      >
                        <Check className="size-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsAddingNewCategory(false)}
                        className="px-3 py-2 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Price (Rs ) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Stock Quantity *
                  </label>
                  <input
                    type="number"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Expiry Date *
                  </label>
                  <input
                    type="date"
                    value={formData.expiryDate}
                    onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                    placeholder="Optional description"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    resetForm();
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                >
                  Add Medicine
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Medicine Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Edit Medicine</h2>
            <form onSubmit={handleEditMedicine}>
              <div className="grid md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Medicine Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                    required
                  />
                </div>

                {/* Category Dropdown */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
                  {!isAddingNewCategory ? (
                    <select
                      value={formData.category}
                      onChange={(e) => {
                        if (e.target.value === '__ADD_NEW__') {
                          setIsAddingNewCategory(true);
                        } else {
                          setFormData({ ...formData, category: e.target.value });
                        }
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition bg-white"
                      required
                    >
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                      <option value="__ADD_NEW__" className="font-bold text-blue-600">
                        + Add New Category...
                      </option>
                    </select>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        placeholder="New category name"
                        className="flex-1 px-4 py-2 border border-blue-400 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={handleAddNewCategory}
                        disabled={addingCategoryLoading || !newCategoryName.trim()}
                        className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium disabled:opacity-50"
                      >
                        <Check className="size-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsAddingNewCategory(false)}
                        className="px-3 py-2 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Price (Rs ) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Stock Quantity *
                  </label>
                  <input
                    type="number"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Expiry Date *
                  </label>
                  <input
                    type="date"
                    value={formData.expiryDate}
                    onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingMedicine(null);
                    resetForm();
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                >
                  Update Medicine
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
