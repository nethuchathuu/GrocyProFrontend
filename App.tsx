
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  LayoutDashboard, 
  Store, 
  ShoppingCart, 
  BarChart3, 
  Bell, 
  Package,
  Menu,
  X,
  UserCircle,
  Tag
} from 'lucide-react';
import { AppMode, Product, Sale, Seller, Discount } from './types';
import Dashboard from './components/Dashboard';
import InventorySystem from './components/InventorySystem';
import SalesSystem from './components/SalesSystem';
import Reports from './components/Reports';
import CalendarComponent from './components/Calendar';
import NotificationSystem from './components/NotificationSystem';
import SellerProfile from './components/SellerProfile';
import DiscountSystem from './components/DiscountSystem';
import { getProducts, addProduct as apiAddProduct, updateProduct as apiUpdateProduct, deleteProduct as apiDeleteProduct } from './src/api/productApi';
import { createSale as apiCreateSale, getSales } from './src/api/salesApi';
import { getSeller } from './src/api/sellerApi';
import { fetchDiscounts, createDiscount, updateDiscount, deleteDiscount } from './src/api/discountApi';
import { warmUpServer } from './src/api/config';

const App: React.FC = () => {
  const [activeMode, setActiveMode] = useState<AppMode>(AppMode.DASHBOARD);
  const [products, setProducts] = useState<Product[]>([]);
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [seller, setSeller] = useState<Seller | null>(null);

  const refreshSeller = useCallback(() => {
    getSeller().then(setSeller).catch(() => {});
  }, []);

  // Load products, sales, and seller from backend on mount
  useEffect(() => {
    const init = async () => {
      await warmUpServer();
      // Give server a bit of time to spin up if it was asleep
      await new Promise(resolve => setTimeout(resolve, 2000));

      getProducts()
        .then(data => setProducts(data))
        .catch(err => console.error("Failed to load products:", err));

      getSales()
        .then(data => setSales(data))
        .catch(err => console.error("Failed to load sales:", err));

      fetchDiscounts()
        .then(data => setDiscounts(data))
        .catch(err => console.error("Failed to load discounts:", err));

      refreshSeller();
    };

    init();
  }, [refreshSeller]);

  const lowStockProducts = useMemo(() =>
    products.filter(p => p.quantity <= p.minQuantity),
  [products]);

  const addProduct = async (product: Product) => {
    try {
      await apiAddProduct(product);
      setProducts(prev => [...prev, product]);
    } catch (err) {
      console.error("Failed to add product:", err);
    }
  };

  const updateProduct = async (updated: Product) => {
    try {
      await apiUpdateProduct(updated.id, updated);
      setProducts(prev => prev.map(p => p.id === updated.id ? updated : p));
    } catch (err) {
      console.error("Failed to update product:", err);
    }
  };

  const deleteProduct = async (id: string) => {
    try {
      await apiDeleteProduct(id);
      setProducts(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      console.error("Failed to delete product:", err);
    }
  };

  const addDiscount = async (discount: Discount) => {
    try {
      const res = await createDiscount(discount);
      if (res.discount) {
        setDiscounts(prev => [...prev, res.discount]);
      }
    } catch (err) {
      console.error("Failed to add discount:", err);
    }
  };

  const updateDiscountHandler = async (discount: Discount) => {
    try {
      await updateDiscount(discount.discount_id, discount);
      setDiscounts(prev => prev.map(d => d.discount_id === discount.discount_id ? discount : d));
    } catch (err) {
      console.error("Failed to update discount:", err);
    }
  };

  const deleteDiscountHandler = async (id: string) => {
    try {
      await deleteDiscount(id);
      setDiscounts(prev => prev.filter(d => d.discount_id !== id));
    } catch (err) {
      console.error("Failed to delete discount:", err);
    }
  };

  const processSale = async (sale: Sale) => {
    try {
      await apiCreateSale(sale);
      // Update local inventory state
      setProducts(prev => prev.map(p => {
        const soldItem = sale.items.find(item => item.productCode === p.code);
        if (soldItem) {
          return { ...p, quantity: Math.max(0, p.quantity - soldItem.quantitySold) };
        }
        return p;
      }));
      // Record sale locally
      setSales(prev => [sale, ...prev]);
    } catch (err) {
      console.error("Failed to process sale:", err);
    }
  };

  const navItems = [
    { id: AppMode.DASHBOARD, label: 'Dashboard', icon: LayoutDashboard },
    { id: AppMode.SALES, label: 'Sales System', icon: ShoppingCart },
    { id: AppMode.STORE, label: 'Store System', icon: Store },
    { id: AppMode.REPORTS, label: 'Reports', icon: BarChart3 },
    { id: AppMode.DISCOUNT, label: 'Discount System', icon: Tag },
  ];

  return (
    <div className="min-h-screen flex bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-gradient-to-b from-primary-700 via-primary-800 to-primary-900 transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:inset-0
      `}>
        <div className="h-full flex flex-col">
          <div className="p-6 flex items-center gap-3">
            <img src="/grocyProLogo.png" alt="GrocyPro Logo" className="w-10 h-10 rounded-lg object-contain" />
            <span className="font-bold text-xl tracking-tight text-white">GrocyPro</span>
          </div>

          <nav className="flex-1 px-4 space-y-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => { setActiveMode(item.id); setSidebarOpen(false); }}
                className={`
                  w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all
                  ${activeMode === item.id 
                    ? 'bg-primary-600 text-white shadow-md' 
                    : 'text-primary-100 hover:bg-primary-700 hover:text-white'}
                `}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </button>
            ))}
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 relative">
        {/* Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <button 
              className="lg:hidden p-2 -ml-2 text-gray-500 hover:bg-gray-100 rounded-lg"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-lg font-semibold text-gray-800">
              {navItems.find(i => i.id === activeMode)?.label}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveMode(AppMode.PROFILE)}
              className="w-10 h-10 rounded-full overflow-hidden border border-gray-200 shadow-sm hover:ring-2 hover:ring-primary-400 transition-all flex items-center justify-center"
              title="Seller Profile"
            >
              {seller?.profile_picture ? (
                <img
                  src={seller.profile_picture}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="flex items-center justify-center w-full h-full bg-gray-100">
                  <UserCircle className="w-5 h-5 text-gray-500" />
                </span>
              )}
            </button>
            <div className="relative group">
              <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-full relative transition-colors">
                <Bell className="w-5 h-5" />
                {lowStockProducts.length > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full animate-pulse"></span>
                )}
              </button>
              
              {/* Notification Dropdown */}
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 hidden group-hover:block transition-all z-50">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                  <h3 className="font-semibold text-gray-800">Notifications</h3>
                  <span className="text-[10px] uppercase font-bold text-gray-400">Inventory Alerts</span>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {lowStockProducts.length === 0 ? (
                    <div className="p-8 text-center text-gray-400">
                      <Package className="w-8 h-8 mx-auto mb-2 opacity-20" />
                      <p className="text-sm">All stock levels normal</p>
                    </div>
                  ) : (
                    lowStockProducts.map(p => (
                      <div key={p.id} className="p-4 hover:bg-red-50 transition-colors border-b border-gray-50 last:border-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-700">{p.name}</p>
                          <span className="text-[10px] px-1.5 py-0.5 bg-red-100 text-red-600 rounded-md font-bold">LOW STOCK</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Current: {p.quantity} {p.type} / Min: {p.minQuantity} {p.type}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          {activeMode === AppMode.DASHBOARD && (
            <Dashboard products={products} sales={sales} />
          )}
          {activeMode === AppMode.STORE && (
            <InventorySystem 
              products={products} 
              onAdd={addProduct} 
              onUpdate={updateProduct} 
              onDelete={deleteProduct} 
            />
          )}
          {activeMode === AppMode.SALES && (
            <SalesSystem 
              products={products} 
              onSale={processSale} 
            />
          )}
          {activeMode === AppMode.REPORTS && (
            <Reports products={products} sales={sales} onOpenCalendar={() => setActiveMode(AppMode.CALENDAR)} />
          )}
          {activeMode === AppMode.CALENDAR && (
            <CalendarComponent onBack={() => setActiveMode(AppMode.REPORTS)} />
          )}
          {activeMode === AppMode.PROFILE && (
            <SellerProfile onBack={() => setActiveMode(AppMode.DASHBOARD)} onProfileUpdated={refreshSeller} />
          )}
          {activeMode === AppMode.DISCOUNT && (
            <DiscountSystem
              discounts={discounts}
              onAdd={addDiscount}
              onUpdate={updateDiscountHandler}
              onDelete={deleteDiscountHandler}
            />
          )}
        </div>
      </main>

      {/* Low Stock Alerts */}
      <NotificationSystem products={products} />
    </div>
  );
};

export default App;
