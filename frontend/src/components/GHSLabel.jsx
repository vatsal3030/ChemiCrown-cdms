import React from 'react';
import { AlertTriangle, Flame, Skull, Zap } from 'lucide-react';

// Map hazard classes to standard GHS pictograms (simplified for demonstration)
// In a full system, you would use standard GHS SVG icons.
const getHazardIcon = (hazardClass) => {
  const lc = hazardClass.toLowerCase();
  if (lc.includes('flammable') || lc.includes('class 3')) return <Flame size={48} className="text-red-600" />;
  if (lc.includes('toxic') || lc.includes('poison') || lc.includes('class 6')) return <Skull size={48} className="text-red-900" />;
  if (lc.includes('corrosive') || lc.includes('class 8')) return <Zap size={48} className="text-yellow-600" />;
  return <AlertTriangle size={48} className="text-amber-500" />;
};

export default function GHSLabel({ product, onPrint }) {
  if (!product) return null;

  const hazardClasses = Array.isArray(product.hazardClasses) 
    ? product.hazardClasses 
    : (typeof product.hazardClasses === 'string' ? JSON.parse(product.hazardClasses) : []);

  const signalWord = hazardClasses.some(h => h.toLowerCase().includes('toxic') || h.toLowerCase().includes('danger') || h.toLowerCase().includes('flammable'))
    ? 'DANGER'
    : (hazardClasses.length > 0 ? 'WARNING' : '');

  return (
    <div className="bg-white text-black p-8 max-w-2xl mx-auto border-4 border-red-600" id="printable-ghs-label" style={{ fontFamily: 'Arial, sans-serif' }}>
      
      {/* Product Identifier */}
      <div className="border-b-4 border-red-600 pb-4 mb-4">
        <h1 className="text-4xl font-black uppercase text-center mb-2 tracking-tight">{product.name}</h1>
        <div className="flex justify-between text-sm font-bold text-gray-700">
          <span>CAS: {product.casNumber || 'N/A'}</span>
          <span>UN No: {product.unNumber || 'N/A'}</span>
        </div>
      </div>

      {/* Signal Word & Pictograms */}
      {(signalWord || hazardClasses.length > 0) && (
        <div className="flex flex-col items-center mb-6 border-b-2 border-gray-300 pb-6">
          <div className="flex gap-4 mb-4">
            {hazardClasses.map((hc, idx) => (
              <div key={idx} className="w-24 h-24 border-4 border-red-600 rotate-45 flex items-center justify-center bg-white shadow-sm overflow-hidden">
                <div className="-rotate-45">
                  {getHazardIcon(hc)}
                </div>
              </div>
            ))}
            {hazardClasses.length === 0 && signalWord && (
              <div className="w-24 h-24 border-4 border-red-600 rotate-45 flex items-center justify-center bg-white shadow-sm overflow-hidden">
                <div className="-rotate-45">
                  <AlertTriangle size={48} className="text-red-600" />
                </div>
              </div>
            )}
          </div>
          {signalWord && <h2 className="text-4xl font-black text-red-600 tracking-widest">{signalWord}</h2>}
        </div>
      )}

      {/* Hazard Statements */}
      <div className="mb-6 border-b-2 border-gray-300 pb-6">
        <h3 className="text-lg font-bold mb-2 uppercase">Hazard Statements:</h3>
        <ul className="list-disc pl-5 font-medium text-sm space-y-1">
          {hazardClasses.map((hc, idx) => (
            <li key={idx}>Contains {hc} materials.</li>
          ))}
          {product.safetyNotes && <li>{product.safetyNotes}</li>}
          {!product.safetyNotes && hazardClasses.length === 0 && <li>No specific hazard statements provided.</li>}
        </ul>
      </div>

      {/* Precautionary Statements */}
      <div className="mb-6 border-b-2 border-gray-300 pb-6">
        <h3 className="text-lg font-bold mb-2 uppercase">Precautionary Statements:</h3>
        <p className="font-medium text-sm leading-relaxed">
          {product.storageInstructions || "Store in a well-ventilated place. Keep container tightly closed. Wear protective gloves/protective clothing/eye protection/face protection. In case of fire: Use appropriate extinguishing media."}
        </p>
      </div>

      {/* Supplier Identification */}
      <div className="flex justify-between items-end">
        <div className="text-xs font-medium text-gray-600">
          <p className="font-bold text-sm text-black mb-1">ChemiCrown CDMS</p>
          <p>123 Industrial Estate, Sector 4</p>
          <p>Mumbai, Maharashtra, India</p>
          <p>Emergency Contact: +91 98765 43210</p>
        </div>
        
        {/* Packing Group */}
        {product.packingGroup && (
          <div className="text-right">
            <p className="text-xs font-bold uppercase text-gray-500">Packing Group</p>
            <p className="text-2xl font-black">{product.packingGroup}</p>
          </div>
        )}
      </div>

      {onPrint && (
        <div className="mt-8 text-center print:hidden">
          <button 
            onClick={onPrint}
            className="px-6 py-2 bg-slate-900 text-white font-bold rounded-lg shadow-md hover:bg-slate-800 transition-colors"
          >
            Print Label
          </button>
        </div>
      )}
    </div>
  );
}
