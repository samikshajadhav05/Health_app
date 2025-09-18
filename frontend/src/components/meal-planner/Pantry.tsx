// frontend/src/components/Pantry.tsx
import React, { useState, useMemo } from 'react';

// Define the type for a grocery item
interface GroceryItem {
  _id: string;
  name: string;
  status: 'in_stock' | 'to_buy';
}

interface PantryProps {
  items: GroceryItem[];
  onToggleItem: (id: string, currentStatus: 'in_stock' | 'to_buy') => void;
  onAddItem: (name: string, status: 'in_stock' | 'to_buy') => void;
}

const Pantry: React.FC<PantryProps> = ({ items, onToggleItem, onAddItem }) => {
  const [newItemName, setNewItemName] = useState('');
  const [addingTo, setAddingTo] = useState<'in_stock' | 'to_buy'>('in_stock');
  
  const inStockItems = useMemo(() => items.filter(item => item.status === 'in_stock'), [items]);
  const toBuyItems = useMemo(() => items.filter(item => item.status === 'to_buy'), [items]);

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;
    onAddItem(newItemName, addingTo);
    setNewItemName('');
  };

  return (
    <div className="relative h-full flex flex-col rounded-[28px] p-6 bg-white/25 backdrop-blur-xl border border-white/60 shadow-[0_8px_30px_rgba(0,0,0,0.08)] text-[#3B0764]">
      <h2 className="text-xl font-semibold mb-4 text-center">My Pantry</h2>
      
      {/* Add Item Form */}
      <form onSubmit={handleAddItem} className="flex gap-2 mb-4">
        <input
          type="text"
          value={newItemName}
          onChange={(e) => setNewItemName(e.target.value)}
          placeholder="New item name..."
          className="flex-1 p-2 rounded-xl bg-white/50 border border-white/70 focus:outline-none focus:ring-2 focus:ring-[#DDD6FE]"
        />
        <select value={addingTo} onChange={(e) => setAddingTo(e.target.value as any)} className="p-2 rounded-xl bg-white/50 border border-white/70 focus:outline-none">
          <option value="in_stock">In Stock</option>
          <option value="to_buy">To Buy</option>
        </select>
        <button type="submit" className="px-4 py-2 rounded-xl font-semibold bg-gradient-to-r from-[#FDE68A] to-[#FBCFE8] text-[#3B0764]">Add</button>
      </form>

      {/* Item Lists */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 overflow-y-auto">
        <div>
          <h3 className="font-semibold mb-2">In Stock</h3>
          <ul className="space-y-2">
            {inStockItems.map(item => (
              <li key={item._id} onClick={() => onToggleItem(item._id, item.status)} className="cursor-pointer p-2 rounded-lg hover:bg-white/40 flex items-center gap-2">
                <span className="w-4 h-4 rounded-full bg-green-400 border-2 border-white"></span>
                {item.name}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="font-semibold mb-2">Shopping List</h3>
          <ul className="space-y-2">
            {toBuyItems.map(item => (
              <li key={item._id} onClick={() => onToggleItem(item._id, item.status)} className="cursor-pointer p-2 rounded-lg hover:bg-white/40 flex items-center gap-2">
                <span className="w-4 h-4 rounded-full bg-yellow-400 border-2 border-white"></span>
                {item.name}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Pantry;