
import React, { useState, useRef, useMemo, useEffect } from 'react';
import { 
  ShoppingCart, 
  Search, 
  Trash2, 
  Plus, 
  Minus, 
  CheckCircle,
  FileText,
  Scan,
  CreditCard,
  User
} from 'lucide-react';
import { Product, Sale, SaleItem } from '../types';
import html2canvas from 'html2canvas';
import { API_BASE_URL } from '../src/api/config';

interface SalesSystemProps {
  products: Product[];
  onSale: (sale: Sale) => void;
}

const SalesSystem: React.FC<SalesSystemProps> = ({ products, onSale }) => {
  const [cart, setCart] = useState<SaleItem[]>([]);
  const [searchCode, setSearchCode] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [lastReceipt, setLastReceipt] = useState<Sale | null>(null);

  // Discount & Tax State
  const [discountCode, setDiscountCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState<any>(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [taxInput, setTaxInput] = useState('');
  const [taxAmount, setTaxAmount] = useState(0);
  const [finalTotal, setFinalTotal] = useState(0);
  const [discountError, setDiscountError] = useState('');
  
  const [availableDiscounts, setAvailableDiscounts] = useState<any[]>([]);
  const [showDiscountSuggestions, setShowDiscountSuggestions] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const receiptRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/discounts`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setAvailableDiscounts(data.filter((d: any) => d.status === 'Active'));
        }
      })
      .catch(err => console.error('Failed to load discounts:', err));
  }, []);

  const discountSuggestions = useMemo(() => {
    if (!showDiscountSuggestions || !discountCode) return [];
    return availableDiscounts
      .filter(d => d.discount_code.toLowerCase().includes(discountCode.toLowerCase()))
      .slice(0, 5);
  }, [discountCode, availableDiscounts, showDiscountSuggestions]);

  const handlePrintReceipt = async () => {
    if (!receiptRef.current || !lastReceipt) return;
    try {
      const canvas = await html2canvas(receiptRef.current, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
        onclone: (clonedDoc) => {
          // Remove all stylesheets to avoid oklch() colors from Tailwind CSS
          clonedDoc.querySelectorAll('style, link[rel="stylesheet"]').forEach(el => el.remove());
        },
      });
      const link = document.createElement('a');
      link.download = `receipt_${lastReceipt.id}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      setLastReceipt(null);
    } catch (err) {
      console.error('Failed to generate receipt image:', err);
    }
  };

  const suggestions = useMemo(() => {
    if (!searchCode) return [];
    return products.filter(p => 
      p.code.toLowerCase().includes(searchCode.toLowerCase()) ||
      p.name.toLowerCase().includes(searchCode.toLowerCase())
    ).slice(0, 5);
  }, [searchCode, products]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.productCode === product.code);
      if (existing) {
        if (existing.quantitySold + 1 > product.quantity) {
          alert('Not enough stock available!');
          return prev;
        }
        return prev.map(item => 
          item.productCode === product.code 
            ? { ...item, quantitySold: item.quantitySold + 1, subTotal: (item.quantitySold + 1) * item.pricePerUnit } 
            : item
        );
      }
      return [...prev, {
        productId: product.id,
        productCode: product.code,
        productName: product.name,
        quantitySold: 1,
        pricePerUnit: product.pricePerUnit,
        subTotal: product.pricePerUnit,
        type: product.type
      }];
    });
    setSearchCode('');
    setShowSuggestions(false);
  };

  const updateQuantity = (code: string, delta: number) => {
    const product = products.find(p => p.code === code);
    if (!product) return;

    setCart(prev => prev.map(item => {
      if (item.productCode === code) {
        const step = ['kg', 'liter'].includes(item.type) ? 0.1 : 1;
        const newQty = Math.max(step, parseFloat((item.quantitySold + delta).toFixed(2)));
        if (newQty > product.quantity) {
          alert('Maximum stock reached!');
          return item;
        }
        return { ...item, quantitySold: newQty, subTotal: parseFloat((newQty * item.pricePerUnit).toFixed(2)) };
      }
      return item;
    }));
  };

  const setQuantity = (code: string, value: string) => {
    const product = products.find(p => p.code === code);
    if (!product) return;

    setCart(prev => prev.map(item => {
      if (item.productCode === code) {
        // Allow empty or partial input while typing (e.g. "2." or "")
        if (value === '' || value === '.' || value.endsWith('.')) {
          return { ...item, _inputValue: value } as any;
        }
        const parsed = parseFloat(value);
        if (isNaN(parsed) || parsed <= 0) return item;
        if (parsed > product.quantity) {
          alert('Maximum stock reached!');
          return item;
        }
        const newQty = parseFloat(parsed.toFixed(2));
        return { ...item, quantitySold: newQty, subTotal: parseFloat((newQty * item.pricePerUnit).toFixed(2)), _inputValue: undefined };
      }
      return item;
    }));
  };

  const removeFromCart = (code: string) => {
    setCart(prev => prev.filter(item => item.productCode !== code));
  };

  const totalAmount = cart.reduce((acc, item) => acc + item.subTotal, 0);

  // Recalculate discount & tax whenever totalAmount, cart, appliedDiscount, or taxInput changes
  useEffect(() => {
    let currentDiscount = 0;
    if (appliedDiscount) {
      const type = appliedDiscount.discount_type;
      const calculateItemDiscount = (): number => {
        if (appliedDiscount.scope === 'Product Level' && appliedDiscount.product_code) {
          const item = cart.find(i => i.productCode === appliedDiscount.product_code);
          if (!item) return 0;
          if (type === 'Percentage Discount') {
            return item.subTotal * ((appliedDiscount.percentage || 0) / 100);
          } else if (type === 'Fixed Amount Discount') {
            return Math.min(appliedDiscount.fixed_amount || 0, item.subTotal);
          } else if (type === 'Bulk Discount') {
            if (item.quantitySold >= (appliedDiscount.bulk_min_quantity || 0)) {
              return item.subTotal * ((appliedDiscount.bulk_discount_value || 0) / 100);
            }
          }
          return 0;
        } else {
          // Scope is Cart / Bill Level
          if (appliedDiscount.cart_limit && totalAmount < appliedDiscount.cart_limit) {
            return 0;
          }
          if (type === 'Percentage Discount') {
            return totalAmount * ((appliedDiscount.percentage || 0) / 100);
          } else if (type === 'Fixed Amount Discount') {
            return appliedDiscount.fixed_amount || 0;
          }
          return 0;
        }
      };

      currentDiscount = calculateItemDiscount();
      // Ensure discount doesn't exceed total
      currentDiscount = Math.min(currentDiscount, totalAmount);
      setDiscountAmount(currentDiscount);
    } else {
      setDiscountAmount(0);
    }

    // Tax calculation
    const discAmt = currentDiscount || 0;
    let currentTax = 0;
    const taxNum = parseFloat(taxInput);
    if (!isNaN(taxNum)) {
      currentTax = (totalAmount - discAmt) * (taxNum / 100);
    }
    setTaxAmount(currentTax);

    setFinalTotal(Math.max(0, totalAmount - discAmt + currentTax));
  }, [totalAmount, cart, appliedDiscount, taxInput]);

  const handleApplyDiscount = async () => {
    setDiscountError('');
    if (!discountCode) {
      setAppliedDiscount(null);
      return;
    }
    try {
      const res = await fetch(`${API_BASE_URL}/api/discounts`);
      const data = await res.json();
      const match = data.find((d: any) => d.discount_code === discountCode && d.status === 'Active');
      if (!match) {
        setDiscountError('Invalid or inactive code');
        setAppliedDiscount(null);
        return;
      }
      
      // Basic date check mapping
      if (match.start_date || match.end_date) {
        const today = new Date().getTime();
        const start = match.start_date ? new Date(match.start_date).getTime() : 0;
        const end = match.end_date ? new Date(match.end_date).getTime() + 86400000 : Infinity;
        if (today < start || today > end) {
          setDiscountError('Discount expired or not started');
          setAppliedDiscount(null);
          return;
        }
      }

      setAppliedDiscount(match);
    } catch (err) {
      setDiscountError('Error valid discount');
      setAppliedDiscount(null);
    }
  };

  const handleCheckout = () => {
    if (cart.length === 0) return;
    
    const newSale: Sale = {
      id: `INV-${Date.now()}`,
      date: new Date().toISOString(),
      items: [...cart],
      totalAmount,
      discountAmount,
      taxAmount,
      finalTotal,
      discountCode: appliedDiscount?.discount_code || undefined,
      customerName: customerName || 'Unknown Customer'
    };

    onSale(newSale);
    setLastReceipt(newSale);
    setCart([]);
    setCustomerName('');
    setDiscountCode('');
    setAppliedDiscount(null);
    setTaxInput('');
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 h-[calc(100vh-140px)] animate-in slide-in-from-right-4 duration-500">
      {/* Search and Product Section */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 mb-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-primary-100 flex items-center justify-center text-primary">
              <Scan className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">New Sale</h2>
              <p className="text-sm text-gray-500">Search product code or name to add to cart</p>
            </div>
          </div>

          <div className="relative" ref={searchRef}>
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-primary-500 transition-colors" />
              <input
                type="text"
                placeholder="Enter Product Code (e.g. PRD-001)"
                className="w-full pl-12 pr-4 py-4 bg-gray-50 border-0 focus:ring-2 focus:ring-primary-500 rounded-2xl text-lg font-medium placeholder:font-normal"
                value={searchCode}
                onChange={(e) => {
                  setSearchCode(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
              />
            </div>

            {/* Suggestions Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-[60] animate-in fade-in slide-in-from-top-2">
                {suggestions.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => addToCart(p)}
                    className="w-full p-4 flex items-center justify-between hover:bg-primary-50 transition-colors text-left border-b last:border-0"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center font-bold text-gray-600">
                        {p.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-gray-800">{p.name}</p>
                        <p className="text-xs text-gray-400 uppercase tracking-tighter">{p.code} • {p.quantity} {p.type} left</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-primary">Rs. {p.pricePerUnit}</p>
                      <p className="text-[10px] text-gray-400">per {p.type}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Cart List */}
        <div className="flex-1 bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-primary" />
              Cart Items ({cart.length})
            </h3>
            <button 
              onClick={() => setCart([])}
              className="text-xs font-bold text-red-500 hover:text-red-700 transition-colors"
            >
              CLEAR ALL
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-50 space-y-4">
                <ShoppingCart className="w-16 h-16" />
                <p className="font-medium">No items in cart</p>
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.productCode} className="flex items-center justify-between p-4 rounded-2xl border border-gray-100 hover:border-primary-200 hover:bg-primary-50/10 transition-all group">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center text-primary-700 font-bold">
                      {item.productName.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-800">{item.productName}</h4>
                      <p className="text-xs text-gray-400 uppercase">{item.productCode} • Rs. {item.pricePerUnit}/{item.type}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="flex items-center bg-white rounded-xl border border-gray-200 shadow-sm p-1">
                      <button
                        onClick={() => updateQuantity(item.productCode, ['kg', 'liter'].includes(item.type) ? -0.1 : -1)}
                        className="p-1 hover:text-primary transition-colors"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <input
                        type="text"
                        inputMode="decimal"
                        className="w-16 text-center font-bold text-gray-700 bg-transparent border-0 focus:outline-none focus:ring-0 p-0"
                        value={(item as any)._inputValue !== undefined ? (item as any)._inputValue : item.quantitySold}
                        onChange={(e) => setQuantity(item.productCode, e.target.value)}
                        onBlur={() => {
                          // Reset partial input on blur
                          if ((item as any)._inputValue !== undefined) {
                            setQuantity(item.productCode, String(item.quantitySold));
                          }
                        }}
                      />
                      <button
                        onClick={() => updateQuantity(item.productCode, ['kg', 'liter'].includes(item.type) ? 0.1 : 1)}
                        className="p-1 hover:text-primary transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <div className="w-24 text-right">
                      <p className="font-bold text-gray-800">Rs. {item.subTotal.toFixed(2)}</p>
                    </div>

                    <button 
                      onClick={() => removeFromCart(item.productCode)}
                      className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Checkout Sidebar */}
      <div className="w-full lg:w-[400px] flex flex-col gap-6 overflow-y-auto custom-scrollbar pb-6 pr-2">
        {/* Customer Info */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-primary" />
            Customer Info
          </h3>
          <input
            type="text"
            placeholder="Customer Name (Optional)"
            className="w-full px-4 py-3 bg-gray-50 border-0 focus:ring-2 focus:ring-primary-500 rounded-xl text-sm"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
          />
        </div>

        {/* Summary Card */}
        <div className="bg-emerald-900 text-white p-8 rounded-3xl shadow-2xl relative overflow-visible flex flex-col flex-shrink-0">
          <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none overflow-hidden rounded-3xl">
            <CreditCard className="w-32 h-32 rotate-12" />
          </div>
          
          <div className="relative z-10 flex flex-col h-full">
            <h3 className="text-emerald-300 font-bold uppercase tracking-widest text-xs mb-8">Billing Summary</h3>
            
            <div className="space-y-4 mb-4">
              <div className="flex justify-between items-center">
                <span className="text-emerald-100/60 font-medium">Subtotal</span>
                <span className="font-bold">Rs. {totalAmount.toFixed(2)}</span>
              </div>
              
              <div className="bg-emerald-800/40 p-4 rounded-2xl border border-emerald-700/50 space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-emerald-300 uppercase tracking-wider">Discount Code</label>
                  <div className="relative">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Enter code..."
                        value={discountCode}
                        onChange={e => {
                          setDiscountCode(e.target.value);
                          setShowDiscountSuggestions(true);
                        }}
                        onFocus={() => setShowDiscountSuggestions(true)}
                        onBlur={() => setTimeout(() => setShowDiscountSuggestions(false), 200)}
                        className="flex-1 bg-emerald-900/50 text-white placeholder-emerald-100/30 border-0 focus:ring-1 focus:ring-emerald-400 rounded-xl px-4 py-2 text-sm"
                      />
                      <button onClick={handleApplyDiscount} className="bg-emerald-600 hover:bg-emerald-500 px-4 py-2 rounded-xl text-sm font-bold transition-colors">
                        Apply
                      </button>
                    </div>
                    {discountSuggestions.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-white text-gray-800 rounded-xl overflow-hidden shadow-xl z-50 border border-gray-100">
                        {discountSuggestions.map(d => (
                          <div 
                            key={d.discount_id} 
                            className="px-4 py-2.5 hover:bg-emerald-50 cursor-pointer text-sm flex justify-between items-center transition-colors"
                            onClick={() => {
                              setDiscountCode(d.discount_code);
                              setShowDiscountSuggestions(false);
                            }}
                          >
                            <span className="font-bold text-emerald-700">{d.discount_code}</span>
                            <span className="text-gray-500 text-xs font-medium">{d.discount_type === 'Percentage Discount' ? `${d.percentage}% OFF` : d.discount_type === 'Fixed Amount Discount' ? `Rs. ${d.fixed_amount} OFF` : d.discount_type}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {discountError && <span className="text-red-400 text-xs uppercase font-bold block mt-1">{discountError}</span>}
                </div>

                <div className="h-px bg-emerald-700/50"></div>

                <div className="flex items-center justify-between gap-4">
                  <label className="text-xs font-bold text-emerald-300 uppercase tracking-wider">Tax Percentage (%)</label>
                  <input
                    type="number"
                    placeholder="e.g. 5"
                    min="0"
                    value={taxInput}
                    onChange={e => setTaxInput(e.target.value)}
                    className="w-24 bg-emerald-900/50 text-white placeholder-emerald-100/30 border-0 focus:ring-1 focus:ring-emerald-400 rounded-xl px-3 py-1.5 text-right text-sm font-bold"
                  />
                </div>
              </div>

              {appliedDiscount && (
                <div className="flex justify-between items-center text-emerald-300 text-sm mt-4 bg-emerald-800/30 px-4 py-2 rounded-lg">
                  <span className="font-medium">Discount applied ({appliedDiscount.discount_code})</span>
                  <span className="font-bold tracking-tight">- Rs. {discountAmount.toFixed(2)}</span>
                </div>
              )}
              {taxAmount > 0 && (
                <div className="flex justify-between items-center text-emerald-300 text-sm mt-2 px-4 py-2">
                  <span>Tax Amount</span>
                  <span className="font-bold tracking-tight">+ Rs. {taxAmount.toFixed(2)}</span>
                </div>
              )}

              <div className="h-px bg-emerald-800 my-4"></div>
              <div className="flex justify-between items-center text-xl mb-6">
                <span className="font-bold">Total Pay</span>
                <span className="text-3xl font-black text-white tracking-tight">Rs. {finalTotal.toFixed(2)}</span>
              </div>
            </div>

            <button
              onClick={handleCheckout}
              disabled={cart.length === 0}
              className={`
                w-full py-5 rounded-2xl font-black text-lg transition-all flex items-center justify-center gap-3 mt-auto
                ${cart.length > 0 
                  ? 'bg-emerald-400 text-emerald-950 hover:bg-emerald-300 shadow-xl shadow-black/20' 
                  : 'bg-emerald-800 text-emerald-700 cursor-not-allowed opacity-50'}
              `}
            >
              <CheckCircle className="w-6 h-6" />
              CONFIRM ORDER
            </button>
          </div>
        </div>

        {/* Receipt Section */}
        {lastReceipt && (
          <div className="bg-amber-50 border border-amber-200 p-6 rounded-3xl flex flex-col items-center gap-4 animate-in zoom-in-95">
            <FileText className="w-10 h-10 text-amber-600" />
            <div className="text-center">
              <h4 className="font-bold text-amber-900">Order Completed</h4>
              <p className="text-xs text-amber-700 mt-1">{lastReceipt.id}</p>
            </div>
            <button
              className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl transition-colors shadow-lg shadow-amber-200"
              onClick={handlePrintReceipt}
            >
              PRINT RECEIPT
            </button>
          </div>
        )}
      </div>

      {/* Hidden Receipt Template for html2canvas */}
      {lastReceipt && (
        <div style={{ position: 'fixed', left: '-9999px', top: 0 }}>
          <div
            ref={receiptRef}
            style={{
              width: '300px',
              padding: '24px 20px',
              backgroundColor: '#ffffff',
              fontFamily: "'Courier New', Courier, monospace",
              fontSize: '12px',
              color: '#000000',
            }}
          >
            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: '0 0 4px 0' }}>GrocyPro Supermarket</h2>
              <p style={{ margin: '2px 0', fontSize: '10px', color: '#666' }}>Your Trusted Grocery Partner</p>
              <p style={{ margin: '2px 0', fontSize: '10px', color: '#666' }}>Tel: +94 11 234 5678</p>
            </div>

            <div style={{ borderTop: '1px dashed #000', margin: '8px 0' }} />

            <div style={{ marginBottom: '8px', fontSize: '11px' }}>
              <p style={{ margin: '2px 0' }}>Invoice: {lastReceipt.id}</p>
              <p style={{ margin: '2px 0' }}>Date: {new Date(lastReceipt.date).toLocaleDateString()}</p>
              <p style={{ margin: '2px 0' }}>Time: {new Date(lastReceipt.date).toLocaleTimeString()}</p>
              <p style={{ margin: '2px 0' }}>Customer: {lastReceipt.customerName}</p>
            </div>

            <div style={{ borderTop: '1px dashed #000', margin: '8px 0' }} />

            <table style={{ width: '100%', fontSize: '11px', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '4px 0 8px 0', fontWeight: 'bold', borderBottom: '1px solid #000' }}>Item</th>
                  <th style={{ textAlign: 'center', padding: '4px 0 8px 0', fontWeight: 'bold', borderBottom: '1px solid #000' }}>Qty</th>
                  <th style={{ textAlign: 'right', padding: '4px 0 8px 0', fontWeight: 'bold', borderBottom: '1px solid #000' }}>Price (Rs.)</th>
                  <th style={{ textAlign: 'right', padding: '4px 0 8px 0', fontWeight: 'bold', borderBottom: '1px solid #000' }}>Total (Rs.)</th>
                </tr>
              </thead>
              <tbody>
                {lastReceipt.items.map((item, i) => (
                  <tr key={i} style={{ borderBottom: '1px dotted #ccc' }}>
                    <td style={{ padding: '4px 0', maxWidth: '100px', wordBreak: 'break-word' }}>{item.productName}</td>
                    <td style={{ textAlign: 'center', padding: '4px 0' }}>{item.quantitySold}</td>
                    <td style={{ textAlign: 'right', padding: '4px 0' }}>{item.pricePerUnit.toFixed(2)}</td>
                    <td style={{ textAlign: 'right', padding: '4px 0' }}>{item.subTotal.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{ borderTop: '1px dashed #000', margin: '8px 0' }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', margin: '4px 0' }}>
              <span>Subtotal</span>
              <span>Rs. {lastReceipt.totalAmount.toFixed(2)}</span>
            </div>

            {(lastReceipt.discountAmount || 0) > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', margin: '4px 0', color: '#666' }}>
                <span>Discount {lastReceipt.discountCode ? `(${lastReceipt.discountCode})` : ''}</span>
                <span>-Rs. {(lastReceipt.discountAmount || 0).toFixed(2)}</span>
              </div>
            )}

            {(lastReceipt.taxAmount || 0) > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', margin: '4px 0', color: '#666' }}>
                <span>Tax</span>
                <span>+Rs. {(lastReceipt.taxAmount || 0).toFixed(2)}</span>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '14px', margin: '8px 0' }}>
              <span>TOTAL</span>
              <span>Rs. {(lastReceipt.finalTotal || lastReceipt.totalAmount).toFixed(2)}</span>
            </div>

            <div style={{ borderTop: '1px dashed #000', margin: '8px 0' }} />

            <div style={{ textAlign: 'center', fontSize: '10px', color: '#666', marginTop: '12px' }}>
              <p style={{ margin: '2px 0' }}>Thank you for shopping with us!</p>
              <p style={{ margin: '2px 0' }}>Goods once sold will not be returned.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesSystem;
