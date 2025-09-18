// src/components/meal-planner/ManualMealModal.tsx
import React, { useState } from 'react';

interface ManualMealModalProps {
  onClose: () => void;
  onSubmit: (text: string) => void;
}

const ManualMealModal: React.FC<ManualMealModalProps> = ({ onClose, onSubmit }) => {
  const [text, setText] = useState("");

  const handleSubmit = () => {
    if (!text.trim()) return onClose();
    onSubmit(text);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full">
        <h2 className="text-2xl font-bold text-[#6B21A8] mb-6 text-center">Enter Meal Manually</h2>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="w-full h-28 px-4 py-3 border border-gray-300 rounded-lg bg-white/50"
          placeholder='e.g., "2 ragi dosa with sambar"'
        />
        <div className="flex gap-4 mt-6">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-300 py-2 rounded-lg text-black"
          >
            Cancel
          </button>
          <button onClick={handleSubmit} className="flex-1 bg-gradient-to-r from-[#FDE68A] via-[#FBCFE8] to-[#DDD6FE] text-[#3B0764] py-2 rounded-lg">
            Analyze & Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default ManualMealModal;