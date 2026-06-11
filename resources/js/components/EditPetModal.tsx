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
    <div
      className="
        fixed inset-0 bg-black/60 z-[200]
        flex items-center justify-center
        max-[325px]:items-end
      "
      style={{
        padding:
          'max(12px, env(safe-area-inset-top)) max(12px, env(safe-area-inset-right)) max(12px, env(safe-area-inset-bottom)) max(12px, env(safe-area-inset-left))',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="
          bg-white w-full
          max-w-[480px] sm:max-w-[560px] md:max-w-3xl lg:max-w-4xl
          rounded-3xl shadow-2xl overflow-hidden
          max-h-[calc(100vh-24px)]
          max-[325px]:max-h-[calc(100vh-16px)]
        "
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="p-5 sm:p-6 md:p-8 overflow-y-auto"
          style={{ maxHeight: 'calc(100vh - 24px)', fontFamily: 'Inter, sans-serif' }}
        >
          {/* Заголовок */}
          <h2 className="text-2xl md:text-3xl font-bold text-[#1F2421] mb-6 text-center">
            Редактирование питомца
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] lg:grid-cols-[340px_1fr] gap-6 md:gap-10">
            {/* Левая колонка — фото (как в добавлении), но показываем текущее фото питомца */}
            <div className="flex flex-col items-center md:items-stretch">
              <label className="w-full cursor-pointer md:max-w-none max-w-[240px]">
                <div
                  className="
                    w-full
                    bg-[#E9F5ED]
                    border border-[#D7EBDD]
                    overflow-hidden
                    rounded-3xl
                    rounded-b-[4rem] sm:rounded-b-[4.5rem] md:rounded-b-[5rem] lg:rounded-b-[6rem]
                    h-40 sm:h-44 md:h-48 lg:h-52
                    flex items-center justify-center
                  "
                >
                  <img
  src={
    photo
      ? URL.createObjectURL(photo)
      : (currentPhoto || '/images/Cat_and_dog.png')
  }
  alt="Фото питомца"
  className="w-full h-full object-cover"
/>
                </div>

                <div className="text-center mt-4">
                  <span className="text-[#4BBB71] font-semibold text-sm">Сменить фото</span>
                </div>

                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setPhoto(e.target.files?.[0] || null)}
                  className="hidden"
                />
              </label>

              {photo && (
                <button
                  type="button"
                  onClick={() => setPhoto(null)}
                  className="mt-2 text-xs text-red-500 hover:text-red-600 self-center md:self-start"
                >
                  Убрать фото
                </button>
              )}
            </div>

            {/* Правая колонка — форма */}
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-[#1F2421] mb-2">
                  Имя питомца <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Введите имя питомца..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#4BBB71]"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#1F2421] mb-2">
                  Возраст
                </label>
                <input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="Введите возраст питомца..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#4BBB71]"
                />
              </div>

              {/* Кнопки */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3 border border-gray-300 rounded-2xl hover:bg-gray-50 font-medium"
                >
                  Отмена
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  className="flex-1 py-3 bg-[#4BBB71] hover:bg-[#3DA35E] text-white rounded-2xl font-medium"
                >
                  Сохранить изменения
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditPetModal;