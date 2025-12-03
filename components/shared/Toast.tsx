import React, { useEffect } from 'react';
import { CheckCircle, XCircle, X } from 'lucide-react';

interface ToastProps {
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor = type === 'success' ? 'bg-green-500' : 'bg-red-500';
  const Icon = type === 'success' ? CheckCircle : XCircle;

  return (
    <div className={`fixed top-5 right-5 z-50 flex items-center p-4 rounded-lg shadow-lg text-white ${bgColor}`}>
      <Icon className="w-6 h-6 mr-3" />
      <div className="text-sm font-medium">{message}</div>
      <button onClick={onClose} className="ml-4 -mr-2 p-1 rounded-md hover:bg-white/20 focus:outline-none">
        <X className="w-5 h-5" />
      </button>
    </div>
  );
};

export default Toast;