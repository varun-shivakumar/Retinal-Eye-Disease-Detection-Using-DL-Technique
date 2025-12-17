import React, { useState } from 'react';
import { ThumbsUp, ThumbsDown, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export const Feedback = () => {
  const [voted, setVoted] = useState<boolean>(false);

  const handleVote = (isCorrect: boolean) => {
    setVoted(true);
    // In a real app, you would send this to your backend here
    if (isCorrect) {
      toast.success("Thanks! Feedback recorded.");
    } else {
      toast("Thanks! We've flagged this for review.", { icon: '📝' });
    }
  };

  if (voted) {
    return (
      <div className="flex items-center justify-center gap-2 text-green-600 text-sm font-medium mt-4 animate-fade-in">
        <CheckCircle size={16} /> Feedback Received
      </div>
    );
  }

  return (
    <div className="mt-6 border-t border-gray-100 pt-4 text-center">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
        Is this diagnosis accurate?
      </p>
      <div className="flex justify-center gap-3">
        <button 
          onClick={() => handleVote(true)}
          className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-full hover:bg-green-100 transition-colors text-sm font-medium border border-green-200"
        >
          <ThumbsUp size={16} /> Yes
        </button>
        <button 
          onClick={() => handleVote(false)}
          className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 rounded-full hover:bg-red-100 transition-colors text-sm font-medium border border-red-200"
        >
          <ThumbsDown size={16} /> No
        </button>
      </div>
    </div>
  );
};