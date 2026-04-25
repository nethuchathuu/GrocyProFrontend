import React, { useState } from 'react';
import { Plus, Search, Edit2, Trash2, Download, Tag, X, Calendar, Clock } from 'lucide-react';
import { Discount } from '../types';

interface DiscountSystemProps {
  discounts: Discount[];
  onAdd: (discount: Discount) => void;
  onUpdate: (discount: Discount) => void;
  onDelete: (id: string) => void;
}

const DiscountSystem: React.FC<DiscountSystemProps> = ({ discounts, onAdd, onUpdate, onDelete }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState<Discount | null>(null);

  // Form states matching fields
  const [discountType, setDiscountType] = useState('Percentage Discount');
  const [discountScope, setDiscountScope] = useState('Product Level');
  const [productLevelType, setProductLevelType] = useState('All Products');
  const [specificDays, setSpecificDays] = useState<string[]>([]);

  const filteredDiscounts = discounts.filter(d =>
    d.discount_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.discount_type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const resetForm = () => {
    setDiscountType('Percentage Discount');
    setDiscountScope('Product Level');
    setProductLevelType('All Products');
    setSpecificDays([]);
  };

  const handleOpenModal = (discount?: Discount) => {
    if (discount) {
      setEditingDiscount(discount);
      setDiscountType(discount.discount_type);
      setDiscountScope(discount.scope);
      if (discount.scope === 'Product Level') {
        setProductLevelType(discount.product_code ? 'Single Product' : 'All Products');
      }
      setSpecificDays(discount.specific_days || []);
    } else {
      setEditingDiscount(null);
      resetForm();
    }
    setIsModalOpen(true);
  };

  const toggleDay = (day: string) => {
    setSpecificDays(prev => 
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const newDiscount: Discount = {
      discount_id: editingDiscount ? editingDiscount.discount_id : Math.random().toString(36).substr(2, 9),
      discount_code: formData.get('discount_code') as string || `DIS-${Math.floor(Math.random() * 1000)}`,
      discount_type: discountType as any,
      scope: discountScope as any,
      status: 'Active',
      
      percentage: Number(formData.get('percentage')) || undefined,
      fixed_amount: Number(formData.get('fixed_amount')) || undefined,
      bulk_min_quantity: Number(formData.get('bulk_min_quantity')) || undefined,
      bulk_discount_value: Number(formData.get('bulk_discount_value')) || undefined,
      
      product_code: discountScope === 'Product Level' && productLevelType === 'Single Product' ? formData.get('product_code') as string : undefined,
      cart_limit: discountScope === 'Cart / Bill Level' ? Number(formData.get('cart_limit')) || undefined : undefined,
      
      start_date: formData.get('start_date') as string,
      end_date: formData.get('end_date') as string,
      specific_days: specificDays.length > 0 ? specificDays : undefined,
      time_start: formData.get('time_start') as string,
      time_end: formData.get('time_end') as string,
      
      min_purchase_amount: Number(formData.get('min_purchase_amount')) || undefined,
      min_quantity: Number(formData.get('min_quantity')) || undefined,
      required_products: formData.get('required_products') as string || undefined,
    };

    if (editingDiscount) {
      onUpdate(newDiscount);
    } else {
      onAdd(newDiscount);
    }
    setIsModalOpen(false);
  };

  const handleExportCSV = () => {
    const headers = ['Discount Code', 'Type', 'Scope', 'Value Detail', 'Start Date', 'End Date', 'Status'];
    
    const tableData = discounts.map(d => {
      let valueDetail = '';
      if (d.discount_type === 'Percentage Discount') valueDetail = `${d.percentage || 0}%`;
      else if (d.discount_type === 'Fixed Amount Discount') valueDetail = `Rs. ${d.fixed_amount || 0}`;
      else if (d.discount_type === 'Bulk Discount') valueDetail = `Qty ${d.bulk_min_quantity} -> ${d.bulk_discount_value}%`;
      
      return [
        d.discount_code,
        d.discount_type,
        d.scope,
        valueDetail,
        d.start_date ? new Date(d.start_date).toLocaleDateString('en-GB') : '-',
        d.end_date ? new Date(d.end_date).toLocaleDateString('en-GB') : '-',
        d.status
      ];
    });

    const csvContent = [
      headers.join(','),
      ...tableData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const now = new Date();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Discount_Report_${now.toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const getDiscountValueDisplay = (d: Discount) => {
    if (d.discount_type === 'Percentage Discount') return `${d.percentage || 0}%`;
    if (d.discount_type === 'Fixed Amount Discount') return `Rs. ${d.fixed_amount || 0}`;
    if (d.discount_type === 'Bulk Discount') return `Min ${d.bulk_min_quantity} qty (${d.bulk_discount_value || 0}%)`;
    return 'Custom';
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-GB'); // DD/MM/YYYY format commonly used in Sri Lanka
    } catch {
      return dateString;
    }
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      {/* Search and Action Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search discount code or type..."
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
            onClick={() => handleOpenModal()}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2 text-sm font-bold text-white bg-primary hover:bg-primary-700 rounded-xl shadow-lg shadow-primary-200 transition-all active:scale-95"
          >
            <Plus className="w-5 h-5" /> Add Discount
          </button>
        </div>
      </div>

      {/* Discount Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50/50 text-[11px] font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">
              <tr>
                <th className="px-6 py-4">Discount Code</th>
                <th className="px-6 py-4">Discount Type</th>
                <th className="px-6 py-4">Scope</th>
                <th className="px-6 py-4">Value</th>
                <th className="px-6 py-4">Duration</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredDiscounts.map((discount) => (
                <tr key={discount.discount_id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center flex-shrink-0">
                        <Tag className="w-4 h-4" />
                      </div>
                      <span className="font-bold text-gray-800">{discount.discount_code}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium text-gray-600">{discount.discount_type}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-500">{discount.scope}</span>
                  </td>
                  <td className="px-6 py-4 font-semibold text-gray-700">
                    {getDiscountValueDisplay(discount)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-xs text-gray-500 flex flex-col gap-1">
                      <div className="flex items-center gap-1"><Calendar className="w-3 h-3"/> {formatDate(discount.start_date)} to {formatDate(discount.end_date)}</div>
                      {(discount.time_start || discount.time_end) && (
                        <div className="flex items-center gap-1"><Clock className="w-3 h-3"/> {discount.time_start || '00:00'} - {discount.time_end || '23:59'}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider
                      ${discount.status === 'Active' ? 'bg-emerald-50 text-emerald-600' : 
                        discount.status === 'Scheduled' ? 'bg-primary-50 text-primary-600' : 'bg-gray-100 text-gray-500'}`}
                    >
                      {discount.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleOpenModal(discount)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-primary-600 transition-colors">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => onDelete(discount.discount_id)} className="p-2 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredDiscounts.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-400 bg-gray-50/30">
                    <Tag className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p className="font-medium text-gray-500">No discounts found</p>
                    <p className="text-sm mt-1">Try turning down filters or add a new discount.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal - Add / Edit Discount */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/20 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden max-h-[90vh] flex flex-col border border-gray-100 animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary-100 text-primary-600 flex items-center justify-center">
                  <Tag className="w-4 h-4" />
                </div>
                {editingDiscount ? 'Edit Discount' : 'Create New Discount'}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-gray-200 rounded-xl text-gray-400 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto custom-scrollbar">
              <form id="discountForm" onSubmit={handleSubmit} className="space-y-8">
                
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Discount Code</label>
                    <input 
                      type="text" 
                      name="discount_code"
                      required
                      defaultValue={editingDiscount?.discount_code}
                      placeholder="e.g. DIS-001"
                      className="w-full px-4 py-2.5 bg-gray-50 border-0 focus:ring-2 focus:ring-primary-500 rounded-xl text-sm font-medium"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Discount Type</label>
                    <select
                      name="discount_type"
                      value={discountType}
                      onChange={(e) => setDiscountType(e.target.value)}
                      className="w-full px-4 py-2.5 bg-gray-50 border-0 focus:ring-2 focus:ring-primary-500 rounded-xl text-sm font-medium text-gray-700"
                    >
                      <option value="Percentage Discount">Percentage Discount</option>
                      <option value="Fixed Amount Discount">Fixed Amount Discount</option>
                      <option value="Bulk Discount">Bulk Discount</option>
                    </select>
                  </div>
                </div>

                {/* Dynamic Value Fields */}
                <div className="bg-primary-50/50 p-5 rounded-2xl border border-primary-100 flex flex-col gap-4">
                  {discountType === 'Percentage Discount' && (
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-primary-800 uppercase tracking-wider">Discount Percentage (%)</label>
                      <input type="number" name="percentage" min="0" max="100" defaultValue={editingDiscount?.percentage} placeholder="Enter % value" className="w-full md:w-1/2 px-4 py-2.5 bg-white border border-primary-200 focus:ring-2 focus:ring-primary-500 rounded-xl text-sm" />
                    </div>
                  )}
                  {discountType === 'Fixed Amount Discount' && (
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-primary-800 uppercase tracking-wider">Fixed Discount Amount (Rs.)</label>
                      <input type="number" name="fixed_amount" min="0" defaultValue={editingDiscount?.fixed_amount} placeholder="Enter amount" className="w-full md:w-1/2 px-4 py-2.5 bg-white border border-primary-200 focus:ring-2 focus:ring-primary-500 rounded-xl text-sm" />
                    </div>
                  )}
                  {discountType === 'Bulk Discount' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-primary-800 uppercase tracking-wider">Minimum Quantity</label>
                        <input type="number" name="bulk_min_quantity" min="1" defaultValue={editingDiscount?.bulk_min_quantity} placeholder="e.g. 5" className="w-full px-4 py-2.5 bg-white border border-primary-200 focus:ring-2 focus:ring-primary-500 rounded-xl text-sm" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-primary-800 uppercase tracking-wider">Discount Percentage (%)</label>
                        <input type="number" min="0" max="100" name="bulk_discount_value" defaultValue={editingDiscount?.bulk_discount_value} placeholder="e.g. 5" className="w-full px-4 py-2.5 bg-white border border-primary-200 focus:ring-2 focus:ring-primary-500 rounded-xl text-sm" />
                      </div>
                    </div>
                  )}
                </div>

                <div className="h-px bg-gray-100" />

                {/* Scope */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Discount Scope</label>
                    <select
                      value={discountScope}
                      onChange={(e) => setDiscountScope(e.target.value)}
                      className="w-full px-4 py-2.5 bg-gray-50 border-0 focus:ring-2 focus:ring-primary-500 rounded-xl text-sm font-medium"
                    >
                      <option value="Product Level">Product Level</option>
                      <option value="Cart / Bill Level">Cart / Bill Level</option>
                    </select>
                  </div>
                  
                  {discountScope === 'Product Level' && (
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Target Products</label>
                      <select 
                        value={productLevelType}
                        onChange={(e) => setProductLevelType(e.target.value)}
                        className="w-full px-4 py-2.5 bg-gray-50 border-0 focus:ring-2 focus:ring-primary-500 rounded-xl text-sm font-medium"
                      >
                        <option value="All Products">All Products</option>
                        <option value="Single Product">Specific Single Product</option>
                      </select>
                    </div>
                  )}
                  {discountScope === 'Cart / Bill Level' && (
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Minimum Bill Amount (Rs.)</label>
                      <input type="number" name="cart_limit" defaultValue={editingDiscount?.cart_limit} placeholder="e.g. 5000" className="w-full px-4 py-2.5 bg-gray-50 border-0 focus:ring-2 focus:ring-primary-500 rounded-xl text-sm" />
                    </div>
                  )}
                  {discountScope === 'Product Level' && productLevelType === 'Single Product' && (
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Target Product Code</label>
                      <input type="text" name="product_code" defaultValue={editingDiscount?.product_code} placeholder="Enter product code" className="w-full px-4 py-2.5 bg-gray-50 border-0 focus:ring-2 focus:ring-primary-500 rounded-xl text-sm" />
                    </div>
                  )}
                </div>

                <div className="h-px bg-gray-100" />

                {/* Validity */}
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-gray-800">Validity & Schedule</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Start Date</label>
                      <input type="date" name="start_date" defaultValue={editingDiscount?.start_date} className="w-full px-4 py-2.5 bg-gray-50 border-0 focus:ring-2 focus:ring-primary-500 rounded-xl text-sm" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">End Date</label>
                      <input type="date" name="end_date" defaultValue={editingDiscount?.end_date} className="w-full px-4 py-2.5 bg-gray-50 border-0 focus:ring-2 focus:ring-primary-500 rounded-xl text-sm" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Time Start</label>
                      <input type="time" name="time_start" defaultValue={editingDiscount?.time_start} className="w-full px-4 py-2.5 bg-gray-50 border-0 focus:ring-2 focus:ring-primary-500 rounded-xl text-sm" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Time End</label>
                      <input type="time" name="time_end" defaultValue={editingDiscount?.time_end} className="w-full px-4 py-2.5 bg-gray-50 border-0 focus:ring-2 focus:ring-primary-500 rounded-xl text-sm" />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Specific Active Days</label>
                    <div className="flex flex-wrap gap-2">
                      {DAYS.map(day => (
                        <button
                          key={day}
                          type="button"
                          onClick={() => toggleDay(day)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all
                            ${specificDays.includes(day) 
                              ? 'bg-primary-100 text-primary-700 ring-2 ring-primary-500 shadow-sm' 
                              : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}
                        >
                          {day}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="h-px bg-gray-100" />
                
                {/* Additional Conditions */}
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-gray-800">Additional Conditions</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Min Purchase Amount (overall)</label>
                      <input type="number" name="min_purchase_amount" defaultValue={editingDiscount?.min_purchase_amount} className="w-full px-4 py-2.5 bg-gray-50 border-0 focus:ring-2 focus:ring-primary-500 rounded-xl text-sm" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Min General Cart Quantity</label>
                      <input type="number" name="min_quantity" defaultValue={editingDiscount?.min_quantity} className="w-full px-4 py-2.5 bg-gray-50 border-0 focus:ring-2 focus:ring-primary-500 rounded-xl text-sm" />
                    </div>
                    <div className="space-y-1.5 md:col-span-2">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Required Product Codes (comma separated)</label>
                      <input type="text" name="required_products" defaultValue={editingDiscount?.required_products} placeholder="e.g. MILK01, BREAD02" className="w-full px-4 py-2.5 bg-gray-50 border-0 focus:ring-2 focus:ring-primary-500 rounded-xl text-sm" />
                    </div>
                  </div>
                </div>

              </form>
            </div>
            
            <div className="p-4 border-t border-gray-100 bg-gray-50/80 flex items-center justify-end gap-3 flex-shrink-0">
              <button 
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-6 py-2.5 text-sm font-bold text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 hover:text-gray-900 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button 
                type="submit"
                form="discountForm"
                className="px-8 py-2.5 text-sm font-bold text-white bg-primary hover:bg-primary-700 rounded-xl shadow-lg shadow-primary-200 transition-all active:scale-95"
              >
                {editingDiscount ? 'Save Changes' : 'Create Discount'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default DiscountSystem;