import React from 'react';
import { useFarcaster } from '../services/farcaster';

interface FarcasterShareProps {
  counterValue: string;
}

export const FarcasterShare: React.FC<FarcasterShareProps> = ({ counterValue }) => {
  const { actions } = useFarcaster();

  const handleShare = () => {
    actions.composeCast({
      text: `I just incremented the Monad Counter to ${counterValue}! 🚀 Try it yourself on the Monad blockchain.`
    });
  };

  return (
    <button 
      onClick={handleShare}
      className="bg-[#9747FF] hover:bg-[#8A32FF] text-white px-4 py-3 rounded-lg flex items-center justify-center gap-2 w-full text-base font-medium"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
      </svg>
      Share on Farcaster
    </button>
  );
};

export const FarcasterAdd: React.FC = () => {
  const { actions } = useFarcaster();

  const handleAdd = () => {
    actions.addFrame();
  };

  return (
    <button 
      onClick={handleAdd}
      className="bg-[#624DE3] hover:bg-[#5341D2] text-white px-4 py-3 rounded-lg flex items-center justify-center gap-2 w-full text-base font-medium"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
        <polyline points="17 21 17 13 7 13 7 21"></polyline>
        <polyline points="7 3 7 8 15 8"></polyline>
      </svg>
      Add to Farcaster
    </button>
  );
};

export const FarcasterActionButtons: React.FC<FarcasterShareProps> = ({ counterValue }) => {
  return (
    <div className="flex flex-col gap-3 w-full max-w-sm px-4 my-6 mx-auto">
      <FarcasterShare counterValue={counterValue} />
      <FarcasterAdd />
    </div>
  );
}; 