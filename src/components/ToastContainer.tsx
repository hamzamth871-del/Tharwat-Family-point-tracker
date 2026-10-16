import React from 'react';
import { useFamily } from '../context/FamilyContext';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, dismissToast } = useFamily();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 left-4 sm:left-auto sm:w-96 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map(toast => {
        const isSuccess = toast.type === 'success';
        const isError = toast.type === 'error';

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl shadow-2xl border text-sm transition-all transform animate-in fade-in slide-in-from-top-2 duration-200 ${
              isSuccess
                ? 'bg-[#15231c] border-[#2f5e41] text-[#f6f7f6]'
                : isError
                ? 'bg-[#291717] border-[#6b2c2c] text-[#fde8e8]'
                : 'bg-[#1a231e] border-[#24332a] text-[#f6f7f6]'
            }`}
          >
            {isSuccess && <CheckCircle2 className="w-5 h-5 text-[#43b879] shrink-0 mt-0.5" />}
            {isError && <AlertCircle className="w-5 h-5 text-[#f87171] shrink-0 mt-0.5" />}
            {!isSuccess && !isError && <Info className="w-5 h-5 text-[#60a5fa] shrink-0 mt-0.5" />}

            <div className="flex-1 font-medium leading-relaxed">{toast.message}</div>

            <button
              onClick={() => dismissToast(toast.id)}
              className="text-[#a6aea9] hover:text-white shrink-0 p-1 rounded-md"
              aria-label="Close notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
