// src/components/meal-planner/AddPantryItemModal.tsx
import React, { useState } from 'react';

interface NewItem {
  name: string;
  qty: string;
  category: string;
  unit: string;
  toBuy: boolean;
}

interface AddPantryItemModalProps {
  onClose: () => void;
  onAddItem: (item: NewItem) => void;
}

const ALLOWED_UNITS = ["kg", "g", "l", "ml", "pcs", "dozen", "packet"] as const;

const AddPantryItemModal: React.FC<AddPantryItemModalProps> = ({ onClose, onAddItem }) => {
  const [newItem, setNewItem] = useState<NewItem>({
    name: "",
    qty: "",
    category: "Fresh Produce",
    unit: "kg",
    toBuy: false,
  });

  const handleSubmit = () => {
    if (!newItem.name.trim()) return alert("Please enter an item name.");
    onAddItem(newItem);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
        <h2 className="text-2xl font-bold text-[#6B21A8] mb-6 text-center">Add New Item</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm mb-2 text-[#6B21A8]">Item Name</label>
            <input
              type="text"
              value={newItem.name}
              onChange={(e) => setNewItem((prev) => ({ ...prev, name: e.target.value }))}
              className="w-full border px-3 py-2 rounded-lg bg-white/50"
            />
          </div>
          <div>
            <label className="block text-sm mb-2 text-[#6B21A8]">Quantity</label>
            <input
              type="text"
              value={newItem.qty}
              onChange={(e) => setNewItem((prev) => ({ ...prev, qty: e.target.value }))}
              className="w-full border px-3 py-2 rounded-lg bg-white/50"
              disabled={newItem.toBuy}
            />
          </div>
          <div>
             <label className="block text-sm mb-2 text-[#6B21A8]">Category</label>
             <select
               value={newItem.category}
               onChange={(e) => setNewItem((prev) => ({ ...prev, category: e.target.value }))}
               className="w-full border px-3 py-2 rounded-lg bg-white/50"
             >
               <option value="Fresh Produce">Fresh Produce</option>
               <option value="Dairy">Dairy</option>
               <option value="Grains & Pulses">Grains & Pulses</option>
               <option value="Drinks & Snacks">Drinks & Snacks</option>
               <option value="Misc">Misc</option>
             </select>
           </div>
           <div>
             <label className="block text-sm mb-2 text-[#6B21A8]">Unit</label>
             <select
               value={newItem.unit}
               onChange={(e) => setNewItem((prev) => ({ ...prev, unit: e.target.value }))}
               className="w-full border px-3 py-2 rounded-lg bg-white/50"
             >
               {ALLOWED_UNITS.map((u) => (
                 <option key={u} value={u}>
                   {u}
                 </option>
               ))}
             </select>
           </div>
           <div className="flex items-center gap-2">
             <input
               id="toBuy"
               type="checkbox"
               checked={newItem.toBuy}
               onChange={(e) => setNewItem((prev) => ({ ...prev, toBuy: e.target.checked }))}
             />
             <label htmlFor="toBuy" className="text-sm">
               Add to <b>To buy</b> (mark as out of stock)
             </label>
           </div>
        </div>
        <div className="flex gap-4 mt-6">
          <button onClick={onClose} className="flex-1 bg-gray-300 py-2 rounded-lg text-black">
            Cancel
          </button>
          <button onClick={handleSubmit} className="flex-1 bg-gradient-to-r from-[#FDE68A] via-[#FBCFE8] to-[#DDD6FE] text-[#3B0764] py-2 rounded-lg">
            Add Item
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddPantryItemModal;