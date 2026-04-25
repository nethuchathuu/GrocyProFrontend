
import React, { useState, useEffect } from 'react';
import { AlertCircle, X, Package } from 'lucide-react';
import { Product } from '../types';

interface NotificationSystemProps {
  products: Product[];
}

const NotificationSystem: React.FC<NotificationSystemProps> = ({ products }) => {
  const [alerts, setAlerts] = useState<Product[]>([]);
  const [closedIds, setClosedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Check for low stock products that haven't been dismissed
    const lowStock = products.filter(p => p.quantity <= p.minQuantity && !closedIds.has(p.id));
    setAlerts(lowStock.slice(0, 3)); // Show top 3 alerts
  }, [products, closedIds]);

  const dismissAlert = (id: string) => {
    setClosedIds(prev => new Set([...Array.from(prev), id]));
  };

  if (alerts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
      {alerts.map((p) => (
        <div 
          key={p.id}
          className="w-80 bg-white border-l-4 border-red-500 p-4 shadow-2xl rounded-2xl flex items-start gap-3 pointer-events-auto animate-in slide-in-from-right-8 duration-300"
        >
          <div className="p-2 bg-red-50 text-red-500 rounded-xl">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-gray-800 text-sm">Low Stock Alert</h4>
              <button 
                onClick={() => dismissAlert(p.id)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-gray-600 mt-1">
              <span className="font-bold text-gray-700">{p.name}</span> is running low. Current stock: <span className="font-bold text-red-600">{p.quantity} {p.type}</span>.
            </p>
            <div className="flex items-center gap-2 mt-3">
              <button className="text-[10px] font-bold text-primary hover:text-primary-700 flex items-center gap-1">
                <Package className="w-3 h-3" /> RESTOCK NOW
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default NotificationSystem;
