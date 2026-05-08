import { useState, useEffect } from 'react';
import { toast } from 'sonner';

interface EditPetModalProps {
  isOpen: boolean;
  onClose: () => void;
  pet: any;
  onSave: (updatedPet: any) => void;
}

const EditPetModal = ({ isOpen, onClose, pet, onSave }: EditPetModalProps) => {
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const [currentPhoto, setCurrentPhoto] = useState<string | null>(null);

  // Заполняем форму при открытии модалки
  useEffect(() => {
    if (pet && isOpen) {
      setName(pet.name || '');
      setAge(pet.age ? String(pet.age) : '');
      setCurrentPhoto(pet.photo_url || null);
      setPhoto(null);
    }
  }, [pet, isOpen]);

  if (!isOpen || !pet) return null;

  const handleSave = () => {
    if (!name.trim()) {
      toast.error('Введите имя питомца');
      return;
    }

    const updatedPet = {
      ...pet,
      name: name.trim(),
      age: age ? parseInt(age) : null,
      photo: photo, // новая фотография (если выбрана)
    };

    onSave(updatedPet);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[200] p-4">
      <div className="bg-white rounded-3xl w-full max-w-md p-8">
        <h2 className="text-2xl font-bold text-center mb-6">Редактирование питомца</h2>

        <div className="space-y-5">
          {/* Текущая аватарка */}
          {currentPhoto && (
            <div className="flex justify-center mb-4">
              <div className="w-24 h-24 rounded-3xl overflow-hidden border-4 border-white shadow-md">
                <img 
                  src={currentPhoto} 
                  alt="Текущая фотография" 
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          )}

          {/* Имя питомца */}
          <div>
            <label className="block text-sm font-medium mb-2">Имя питомца *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 border rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>

          {/* Возраст */}
          <div>
            <label className="block text-sm font-medium mb-2">Возраст</label>
            <input
              type="number"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              className="w-full px-4 py-3 border rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="Введите возраст"
            />
          </div>

          {/* Смена фото */}
          <div>
            <label className="block text-sm font-medium mb-2">Сменить фото</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setPhoto(e.target.files?.[0] || null)}
              className="w-full px-4 py-3 border rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <p className="text-xs text-gray-500 mt-1">Оставьте пустым, чтобы сохранить текущую фотографию</p>
          </div>
        </div>

        <div className="flex gap-4 mt-8">
          <button
            onClick={onClose}
            className="flex-1 py-3 border border-gray-300 rounded-2xl hover:bg-gray-50"
          >
            Отмена
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-3 bg-emerald-500 text-white rounded-2xl hover:bg-emerald-600"
          >
            Сохранить изменения
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditPetModal;