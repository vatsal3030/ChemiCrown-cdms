import React, { useRef } from 'react';
import { X, Printer } from 'lucide-react';
import GHSLabel from './GHSLabel';
import { useReactToPrint } from 'react-to-print';

export default function PrintGHSModal({ isOpen, onClose, product }) {
  const componentRef = useRef();

  // We only print the GHS label area, not the modal backdrop
  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: `GHS_Label_${product?.casNumber || product?.name}`,
  });

  if (!isOpen || !product) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-card w-full max-w-3xl rounded-xl shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-xl font-bold">Print GHS Label</h2>
          <div className="flex items-center gap-2">
            <button 
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <Printer size={18} /> Print
            </button>
            <button onClick={onClose} className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
              <X size={20} />
            </button>
          </div>
        </div>
        
        {/* Content (Scrollable) */}
        <div className="p-6 overflow-y-auto bg-background flex-1">
          <div ref={componentRef} className="print-wrapper bg-white shadow-sm mx-auto">
            {/* The component itself handles standard GHS sizing */}
            <GHSLabel product={product} />
          </div>
        </div>
      </div>
    </div>
  );
}
