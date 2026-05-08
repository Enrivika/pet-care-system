import { toast } from 'sonner';

interface DeletePetModalProps {
  isOpen: boolean;
  onClose: () => void;
  petName: string;
  onConfirm: () => void;
  isLoading?: boolean;
}

const DeletePetModal = ({ isOpen, onClose, petName, onConfirm, isLoading = false }: DeletePetModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]">
      <div className="bg-white rounded-3xl w-full max-w-sm p-8 shadow-xl text-center">
        <div className="text-6xl mb-4">🗑️</div>
        
        <h2 className="text-2xl font-bold text-red-600 mb-3">Удалить питомца?</h2>
        
        <p className="text-gray-600 mb-6">
          Это действие нельзя отменить.<br />
          Питомец <span className="font-semibold">"{petName}"</span> будет удалён навсегда.
        </p>

        <div className="flex gap-3">
          <button 
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 py-3 border border-gray-300 rounded-2xl font-medium hover:bg-gray-50 disabled:opacity-50"
          >
            Отмена
          </button>
          <button 
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 py-3 bg-red-500 text-white rounded-2xl font-medium hover:bg-red-600 disabled:opacity-70"
          >
            {isLoading ? 'Удаление...' : 'Удалить'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeletePetModal;