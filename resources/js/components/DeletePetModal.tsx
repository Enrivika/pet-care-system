interface DeletePetModalProps {
  isOpen: boolean;
  onClose: () => void;
  petName: string;
  onConfirm: () => void;
  isLoading?: boolean;
}

const DeletePetModal = ({
  isOpen,
  onClose,
  petName,
  onConfirm,
  isLoading = false,
}: DeletePetModalProps) => {
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 z-[100] px-4 py-4 sm:py-6 flex items-center justify-center"
      onClick={handleBackdropClick}
      style={{ fontFamily: 'Inter, sans-serif' }}
    >
      <div
        className="
          bg-white w-full max-w-md sm:max-w-lg
          rounded-3xl shadow-2xl relative
          p-5 sm:p-7 md:p-8
          max-h-[85dvh] overflow-auto
        "
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Удалить питомца"
      >
        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-red-600 text-center mb-2 sm:mb-3 tracking-[-0.02em]">
          Удалить питомца?
        </h2>

        {/* Единый размер текста для всей модалки */}
        <div className="text-sm sm:text-base leading-relaxed tracking-[-0.02em]">
          <p className="text-gray-700 text-center">
            Вы собираетесь удалить питомца
            <span className="font-semibold text-gray-900"> {petName}</span>.
          </p>
          <p className="text-gray-600 text-center mb-4 sm:mb-6">
            Это действие нельзя отменить.
          </p>

          {/* Плашка со списком */}
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 sm:p-5 mb-4 sm:mb-6">            
            <p className="text-gray-800 mb-2">Также будут навсегда удалены:</p>

            <ul className="text-gray-700 space-y-1.5">
              <li className="flex gap-2 before:content-['-'] before:text-gray-400 before:shrink-0">
                <span>Все запланированные задачи.</span>
              </li>
              <li className="flex gap-2 before:content-['-'] before:text-gray-400 before:shrink-0">
                <span>Все выполненные задачи.</span>
              </li>
              <li className="flex gap-2 before:content-['-'] before:text-gray-400 before:shrink-0">
                <span>Все медицинские записи.</span>
              </li>
            </ul>
          </div>

          <p className="text-red-600 text-center font-semibold mb-5 sm:mb-7">
            Никакие данные о питомце не останутся в системе!
          </p>
        </div>

        <div className="flex gap-3 sm:gap-4">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="
              flex-1
              py-3 sm:py-3.5 md:py-4
              border border-gray-300
              rounded-2xl font-semibold
              hover:bg-gray-50 transition-colors
              disabled:opacity-50
              text-sm sm:text-base tracking-[-0.02em]
              text-gray-700
            "
            type="button"
          >
            Отмена
          </button>

          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="
              flex-1
              py-3 sm:py-3.5 md:py-4
              bg-red-600 text-white
              rounded-2xl font-semibold
              hover:bg-red-700 transition-colors
              disabled:opacity-70
              text-sm sm:text-base tracking-[-0.02em]
            "
            type="button"
          >
            {isLoading ? 'Удаление...' : 'Удалить'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeletePetModal;