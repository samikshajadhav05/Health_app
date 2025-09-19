// frontend/src/components/meal-planner/Pantry.tsx
import React, { useState, useMemo } from 'react';

// Define the type for a grocery item, which we'll get from the parent
export interface PantryItem {
  _id: string;
  name: string;
  status: 'in_stock' | 'to_buy';
}

interface PantryProps {
  items: PantryItem[];
  onAddItem: (name: string, status: 'in_stock' | 'to_buy') => void;
  onDeleteItem: (id: string) => void;
}

// A reusable sub-component for each list section
const PantryList: React.FC<{
  title: string;
  items: PantryItem[];
  status: 'in_stock' | 'to_buy';
  onAddItem: (name: string, status: 'in_stock' | 'to_buy') => void;
  onDeleteItem: (id: string) => void;
}> = ({ title, items, status, onAddItem, onDeleteItem }) => {
  const [newItemName, setNewItemName] = useState('');

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;
    onAddItem(newItemName, status);
    setNewItemName('');
  };

  const bgColor = status === 'in_stock' ? 'bg-green-100/80' : 'bg-yellow-100/80';
  const textColor = status === 'in_stock' ? 'text-green-800' : 'text-yellow-800';

  return (
    <div className={`p-4 rounded-2xl ${bgColor} border border-white/60`}>
      <h3 className={`font-semibold mb-3 text-lg ${textColor}`}>{title}</h3>
      
      {/* Add Item Form */}
      <form onSubmit={handleAddItem} className="flex gap-2 mb-3">
        <input
          type="text"
          value={newItemName}
          onChange={(e) => setNewItemName(e.target.value)}
          placeholder="Add an item..."
          className="flex-1 px-3 py-2 rounded-lg bg-white/70 border border-white/80 focus:outline-none focus:ring-2 focus:ring-violet-400 text-sm"
        />
        <button type="submit" className="px-4 py-2 rounded-lg font-semibold bg-white/80 hover:bg-white shadow text-sm text-violet-700">Add</button>
      </form>

      {/* Item List */}
      <ul className="space-y-2 h-48 overflow-y-auto pr-2">
        {items.map(item => (
          <li key={item._id} className="flex items-center justify-between bg-white/60 p-2 rounded-lg shadow-sm">
            <span className="text-sm text-gray-800">{item.name}</span>
            <button 
              onClick={() => onDeleteItem(item._id)} 
              className="px-2 py-1 text-xs font-bold text-red-600 hover:bg-red-100 rounded-md"
              aria-label={`Delete ${item.name}`}
            >
              DELETE
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};


const Pantry: React.FC<PantryProps> = ({ items, onAddItem, onDeleteItem }) => {
  const inStockItems = useMemo(() => items.filter(item => item.status === 'in_stock'), [items]);
  const toBuyItems = useMemo(() => items.filter(item => item.status === 'to_buy'), [items]);

  return (
    <div className="relative h-full flex flex-col rounded-[28px] p-6 bg-white/25 backdrop-blur-xl border border-white/60 shadow-lg text-[#3B0764]">
      <h2 className="text-xl font-semibold mb-4 text-center">My Pantry</h2>
      
      <div className="grid grid-cols-1 gap-4 flex-1">
        <PantryList 
          title="In Stock"
          items={inStockItems}
          status="in_stock"
          onAddItem={onAddItem}
          onDeleteItem={onDeleteItem}
        />
        <PantryList 
          title="Shopping List (To Buy)"
          items={toBuyItems}
          status="to_buy"
          onAddItem={onAddItem}
          onDeleteItem={onDeleteItem}
        />
      </div>
    </div>
  );
};

export default Pantry;
