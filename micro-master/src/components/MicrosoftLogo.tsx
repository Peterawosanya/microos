// src/components/MicrosoftLogo.tsx
import React from 'react';

const MicrosoftLogo: React.FC = () => (
  <div className="flex items-center space-x-2">
    <div className="grid grid-cols-2 gap-[1px]">
      <div className="w-3 h-3 bg-[#F25022]" /> {/* Red */}
      <div className="w-3 h-3 bg-[#7FBA00]" /> {/* Green */}
      <div className="w-3 h-3 bg-[#00A4EF]" /> {/* Blue */}
      <div className="w-3 h-3 bg-[#FFB900]" /> {/* Yellow */}
    </div>
    <span className="text-base font-normal text-gray-900 tracking-tight">
      Microsoft
    </span>
  </div>
);

export default MicrosoftLogo;
