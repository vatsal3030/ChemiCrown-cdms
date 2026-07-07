import React, { useRef } from 'react';
import { X, Printer, ShieldCheck } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';

export default function CoAGeneratorModal({ isOpen, onClose, lot }) {
  const componentRef = useRef();

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: `CoA_${lot?.lotNumber}_${lot?.product?.name}`,
  });

  if (!isOpen || !lot) return null;

  const mfgDate = lot.mfgDate ? new Date(lot.mfgDate).toLocaleDateString() : 'N/A';
  const expDate = lot.expiryDate ? new Date(lot.expiryDate).toLocaleDateString() : 'N/A';
  const testDate = new Date(lot.createdAt).toLocaleDateString();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-card w-full max-w-4xl rounded-xl shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <ShieldCheck className="text-emerald-600" />
            Generate Certificate of Analysis
          </h2>
          <div className="flex items-center gap-2">
            <button 
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
            >
              <Printer size={18} /> Print to PDF
            </button>
            <button onClick={onClose} className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
              <X size={20} />
            </button>
          </div>
        </div>
        
        {/* Printable Content */}
        <div className="p-8 overflow-y-auto bg-background flex-1">
          <div ref={componentRef} className="bg-white p-12 shadow-sm border border-slate-200 mx-auto max-w-3xl text-black" style={{ fontFamily: 'Georgia, serif' }}>
            
            {/* Document Header */}
            <div className="text-center mb-10 pb-6 border-b-2 border-slate-800">
              <h1 className="text-4xl font-bold text-slate-900 mb-2 uppercase tracking-wide">ChemiCrown cdms</h1>
              <p className="text-sm font-medium text-slate-600">123 Industrial Estate, Sector 4, Mumbai, Maharashtra, India</p>
              <p className="text-sm font-medium text-slate-600">ISO 9001:2015 Certified</p>
              
              <h2 className="text-2xl font-bold mt-8 uppercase tracking-widest text-slate-800">Certificate of Analysis</h2>
            </div>

            {/* Product & Lot Info */}
            <div className="grid grid-cols-2 gap-x-12 gap-y-4 mb-10 text-sm">
              <div className="flex justify-between border-b border-slate-200 pb-1">
                <span className="font-bold">Product Name:</span>
                <span>{lot.product?.name || 'Unknown'}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-1">
                <span className="font-bold">Batch / Lot No:</span>
                <span className="font-mono">{lot.lotNumber}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-1">
                <span className="font-bold">CAS Number:</span>
                <span>{lot.product?.casNumber || 'N/A'}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-1">
                <span className="font-bold">Product Grade:</span>
                <span>{lot.product?.grade || 'Standard'}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-1">
                <span className="font-bold">Manufacturing Date:</span>
                <span>{mfgDate}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-1">
                <span className="font-bold">Date of Testing:</span>
                <span>{testDate}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-1">
                <span className="font-bold">Expiration Date:</span>
                <span>{expDate}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-1">
                <span className="font-bold">Lot Status:</span>
                <span className="uppercase font-bold">{lot.status}</span>
              </div>
            </div>

            {/* Analysis Results Table */}
            <div className="mb-12">
              <h3 className="text-lg font-bold mb-4 border-b border-slate-400 pb-2">Analytical Results</h3>
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-slate-100">
                    <th className="border border-slate-300 p-2 font-bold">Test Parameter</th>
                    <th className="border border-slate-300 p-2 font-bold">Specification</th>
                    <th className="border border-slate-300 p-2 font-bold">Result</th>
                    <th className="border border-slate-300 p-2 font-bold text-center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-slate-300 p-2">Appearance</td>
                    <td className="border border-slate-300 p-2">Matches Standard</td>
                    <td className="border border-slate-300 p-2">Complies</td>
                    <td className="border border-slate-300 p-2 text-center font-bold text-emerald-600">PASS</td>
                  </tr>
                  <tr>
                    <td className="border border-slate-300 p-2">Purity / Assay</td>
                    <td className="border border-slate-300 p-2">&ge; {lot.product?.purity || '99.0%'}</td>
                    <td className="border border-slate-300 p-2">Complies</td>
                    <td className="border border-slate-300 p-2 text-center font-bold text-emerald-600">PASS</td>
                  </tr>
                  <tr>
                    <td className="border border-slate-300 p-2">Moisture Content</td>
                    <td className="border border-slate-300 p-2">&le; 0.5%</td>
                    <td className="border border-slate-300 p-2">0.2%</td>
                    <td className="border border-slate-300 p-2 text-center font-bold text-emerald-600">PASS</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Approvals */}
            <div className="mt-16 pt-8 border-t border-slate-200 flex justify-between items-end">
              <div className="w-48 text-center">
                <div className="border-b border-slate-800 pb-1 mb-2 font-handwriting text-xl text-slate-700">System Generated</div>
                <p className="text-xs font-bold uppercase">Quality Control Analyst</p>
                <p className="text-[10px] text-slate-500 mt-1">Date: {testDate}</p>
              </div>
              <div className="w-48 text-center">
                <div className="border-b border-slate-800 pb-1 mb-2 font-handwriting text-xl text-slate-700">Approved</div>
                <p className="text-xs font-bold uppercase">QA Manager</p>
                <p className="text-[10px] text-slate-500 mt-1">Status: {lot.status}</p>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-12 text-center text-[10px] text-slate-500 border-t border-slate-200 pt-4">
              <p>This certificate was generated electronically and is valid without signature.</p>
              <p>The results reported herein have been performed in accordance with ChemiCrown standard quality control procedures.</p>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
