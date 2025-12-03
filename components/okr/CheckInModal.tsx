import React, { useState } from 'react';
import { KeyResult } from '../../types';
import { X } from 'lucide-react';

interface CheckInModalProps {
  kr: KeyResult;
  onClose: () => void;
  onSave: (krId: string, newProgress: number, comment?: string) => void;
}

const CheckInModal: React.FC<CheckInModalProps> = ({ kr, onClose, onSave }) => {
  const [progress, setProgress] = useState(kr.progress);
  const [comment, setComment] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(kr.id, Number(progress), comment);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md p-6 border border-slate-200/50 dark:border-slate-700/50">
        <button onClick={onClose} className="absolute top-4 right-4 p-1 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700">
          <X size={20}/>
        </button>
        <h2 className="text-xl font-bold mb-2">Update Progress</h2>
        <p className="text-sm text-slate-600 dark:text-slate-300 mb-6 line-clamp-2">{kr.title}</p>
        
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="progress" className="block text-sm font-medium mb-2 text-center">Progress</label>
              <div className="flex items-center gap-4">
                <span className="text-sm font-mono">0%</span>
                <input
                  id="progress"
                  type="range"
                  min="0"
                  max="100"
                  value={progress}
                  onChange={(e) => setProgress(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer dark:bg-slate-700"
                />
                <span className="text-sm font-mono">100%</span>
              </div>
              <div className="text-center font-bold text-2xl mt-2 text-brand-600 dark:text-brand-300">{progress}%</div>
            </div>
            <div>
              <label htmlFor="comment" className="block text-sm font-medium mb-1">Comment (optional)</label>
              <textarea
                id="comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                className="w-full p-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 rounded-md"
                placeholder="Add notes about this update..."
              />
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-semibold bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 transition">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 rounded-lg text-sm font-semibold bg-brand-500 text-white hover:bg-brand-600 transition">
              Save Update
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CheckInModal;
