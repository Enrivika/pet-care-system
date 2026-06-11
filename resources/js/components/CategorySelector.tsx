import React from 'react';
import { CATEGORIES } from '../utils/categories';

type CategoryItem = { name: string; color: string };

interface CategorySelectorProps {
  selected: string;
  onSelect: (category: string) => void;
  isMedical?: boolean;
  onIsMedicalChange?: (value: boolean) => void;
  showMedicalCheckbox?: boolean; // показывать чекбокс только когда выбрано "Другое"
  categoriesOverride?: CategoryItem[]; // ← NEW: если передан — используем его вместо CATEGORIES
}

const CategorySelector: React.FC<CategorySelectorProps> = ({
  selected,
  onSelect,
  isMedical = false,
  onIsMedicalChange,
  showMedicalCheckbox = true,
  categoriesOverride,
}) => {
  const categories = categoriesOverride ?? CATEGORIES;

  return (
    <div>
      <div className="grid grid-cols-2 min-[380px]:grid-cols-3 md:grid-cols-4 gap-2">
        {categories.map((cat) => {
          const isSelected = selected === cat.name;
          return (
            <button
              key={cat.name}
              type="button"
              onClick={() => onSelect(cat.name)}
              className={`flex items-center justify-center gap-1.5 px-3 py-2 sm:px-4 sm:py-2.5 rounded-2xl text-xs sm:text-sm font-medium transition-all ${
                isSelected ? 'ring-2 ring-[#4BBB71] scale-[1.02] bg-white' : ''
              }`}
              style={
                isSelected
                  ? { color: cat.color, borderColor: cat.color, borderWidth: 1 }
                  : { backgroundColor: `${cat.color}25`, color: cat.color }
              }
            >
              <img
                src={`/images/${cat.name}.png`}
                alt={cat.name}
                className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0"
              />
              <span>{cat.name}</span>
            </button>
          );
        })}
      </div>

      {/* Чекбокс "Является ли задача медицинской?" только для "Другое" */}
      {showMedicalCheckbox && selected === 'Другое' && onIsMedicalChange && (
        <div className="mt-3 flex items-center gap-2">
          <input
            type="checkbox"
            id="isMedical"
            checked={isMedical}
            onChange={(e) => onIsMedicalChange(e.target.checked)}
            className="w-4 h-4 rounded accent-[#1F2421]"
          />
          <label htmlFor="isMedical" className="text-sm text-gray-600">
            Является ли задача медицинской?
          </label>
        </div>
      )}
    </div>
  );
};

export default CategorySelector;