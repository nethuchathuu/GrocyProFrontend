
import React, { useState } from 'react';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  MoreHorizontal,
  ChevronDown,
  Filter,
  Download
} from 'lucide-react';
import { Product, QuantityType } from '../types';


interface InventorySystemProps {
  products: Product[];
  onAdd: (product: Product) => void;
  onUpdate: (product: Product) => void;
  onDelete: (id: string) => void;
}

const InventorySystem: React.FC<InventorySystemProps> = ({ products, onAdd, onUpdate, onDelete }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const productData: Product = {
      id: editingProduct ? editingProduct.id : Math.random().toString(36).substring(2, 11),
      code: formData.get('code') as string,
      name: formData.get('name') as string,
      type: formData.get('type') as QuantityType,
      quantity: Number(formData.get('quantity')),
      minQuantity: Number(formData.get('minQuantity')),
      pricePerUnit: Number(formData.get('pricePerUnit')),
    };

    if (editingProduct) {
      onUpdate(productData);
    } else {
      onAdd(productData);
    }
    
    setIsModalOpen(false);
    setEditingProduct(null);
  };

  const handleExportCSV = () => {
    const headers = ['Product ID', 'Product Name', 'Unit Type', 'Unit Price (Rs.)', 'Current Stock', 'Min Alert Stock'];
    
    // Table
    const tableData = products.map((p) => [
      p.code,
      p.name,
      p.type,
      p.pricePerUnit.toFixed(2),
      p.quantity.toString(),
      p.minQuantity.toString(),
    ]);

    const csvContent = [
      headers.join(','),
      ...tableData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const now = new Date();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Inventory_Report_${now.toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      {/* Search and Action Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search products by code or name..."
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border-0 focus:ring-2 focus:ring-primary-500 rounded-xl text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-2 w-full md:w-auto">
          <button onClick={handleExportCSV} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 text-sm font-bold text-white bg-primary hover:bg-primary-700 rounded-xl shadow-lg shadow-primary-200 transition-all active:scale-95">
            <Download className="w-4 h-4" /> Export
          </button>
          <button 
            onClick={() => { setEditingProduct(null); setIsModalOpen(true); }}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2 text-sm font-bold text-white bg-primary hover:bg-primary-700 rounded-xl shadow-lg shadow-primary-200 transition-all active:scale-95"
          >
            <Plus className="w-5 h-5" /> Add Product
          </button>
        </div>
      </div>

      {/* Product Grid/Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 text-[11px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100">
                <th className="px-6 py-4">Product Info</th>
                <th className="px-6 py-4">Unit Type</th>
                <th className="px-6 py-4">Current Stock</th>
                <th className="px-6 py-4">Min. Alert</th>
                <th className="px-6 py-4">Price/Unit</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredProducts.map((p) => {
                const isLow = p.quantity <= p.minQuantity;
                return (
                  <tr key={p.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-primary-700 ${isLow ? 'bg-red-100 text-red-700' : 'bg-primary-100'}`}>
                          {p.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-800">{p.name}</p>
                          <p className="text-[11px] font-medium text-gray-400 uppercase">{p.code}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-medium px-2.5 py-1 bg-gray-100 text-gray-600 rounded-lg">
                        {p.type}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-sm font-bold ${isLow ? 'text-red-600' : 'text-gray-700'}`}>
                        {p.quantity}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-500">
                      {p.minQuantity}
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-gray-800">
                      Rs. {p.pricePerUnit.toFixed(2)}
                    </td>
                    <td className="px-6 py-4">
                      {isLow ? (
                        <span className="flex items-center gap-1.5 text-[10px] font-bold text-red-600 bg-red-50 px-2 py-1 rounded-full border border-red-100">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse"></span>
                          LOW STOCK
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-[10px] font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full border border-green-100">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-600"></span>
                          HEALTHY
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => { setEditingProduct(p); setIsModalOpen(true); }}
                          className="p-1.5 text-gray-400 hover:text-primary hover:bg-primary-50 rounded-lg transition-all"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => onDelete(p.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50">
              <div>
                <h3 className="text-xl font-bold text-gray-800">{editingProduct ? 'Edit Product' : 'Add New Product'}</h3>
                <p className="text-sm text-gray-500">Enter product specifications below</p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-gray-400 hover:bg-white rounded-xl transition-colors shadow-sm"
              >
                <Plus className="w-6 h-6 rotate-45" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Product Code</label>
                  <input
                    name="code"
                    required
                    defaultValue={editingProduct?.code}
                    placeholder="e.g. PRD-001"
                    className="w-full px-4 py-3 bg-gray-50 border-0 focus:ring-2 focus:ring-primary-500 rounded-xl text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Product Name</label>
                  <input
                    name="name"
                    required
                    defaultValue={editingProduct?.name}
                    placeholder="e.g. Red Apples"
                    className="w-full px-4 py-3 bg-gray-50 border-0 focus:ring-2 focus:ring-primary-500 rounded-xl text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Quantity Type</label>
                  <select
                    name="type"
                    required
                    defaultValue={editingProduct?.type || 'unit'}
                    className="w-full px-4 py-3 bg-gray-50 border-0 focus:ring-2 focus:ring-primary-500 rounded-xl text-sm appearance-none"
                  >
                    <option value="kg">Kilograms (kg)</option>
                    <option value="packet">Packets</option>
                    <option value="bottle">Bottles</option>
                    <option value="box">Boxes</option>
                    <option value="unit">Units/Pieces</option>
                    <option value="liter">Liters</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Price per Unit (Rs.)</label>
                  <input
                    name="pricePerUnit"
                    type="number"
                    step="0.01"
                    required
                    defaultValue={editingProduct?.pricePerUnit}
                    placeholder="0.00"
                    className="w-full px-4 py-3 bg-gray-50 border-0 focus:ring-2 focus:ring-primary-500 rounded-xl text-sm font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Initial Stock</label>
                  <input
                    name="quantity"
                    type="number"
                    required
                    defaultValue={editingProduct?.quantity}
                    placeholder="0"
                    className="w-full px-4 py-3 bg-gray-50 border-0 focus:ring-2 focus:ring-primary-500 rounded-xl text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Min. stock Alert</label>
                  <input
                    name="minQuantity"
                    type="number"
                    required
                    defaultValue={editingProduct?.minQuantity}
                    placeholder="5"
                    className="w-full px-4 py-3 bg-gray-50 border-0 focus:ring-2 focus:ring-primary-500 rounded-xl text-sm"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-6 py-3 text-sm font-bold text-gray-500 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-2 px-6 py-3 text-sm font-bold text-white bg-primary hover:bg-primary-700 rounded-xl shadow-lg shadow-primary-200 transition-all"
                >
                  {editingProduct ? 'Update Product' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventorySystem;
