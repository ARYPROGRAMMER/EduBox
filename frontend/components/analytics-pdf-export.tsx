"use client";

import React, { useRef } from "react";
import { PDFExport } from "@progress/kendo-react-pdf";
import { Button } from "@progress/kendo-react-buttons";
import { Download } from "lucide-react";

interface AnalyticsPDFExportProps {
  children: React.ReactNode;
  fileName?: string;
}

const AnalyticsPDFExport: React.FC<AnalyticsPDFExportProps> = ({
  children,
  fileName = `analytics-report-${new Date().toISOString().split('T')[0]}.pdf`,
}) => {
  const pdfExportRef = useRef<PDFExport>(null);

  const handleExport = () => {
    if (pdfExportRef.current) {
      pdfExportRef.current.save();
    }
  };

  return (
    <div className="space-y-6">
      <div className="mb-4 flex justify-end">
        <Button
          onClick={handleExport}
          themeColor="primary"
          className="flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          Export PDF
        </Button>
      </div>
      
      {/* Visible charts on the page */}
      <div className="space-y-6">
        {children}
      </div>
      
      {/* Hidden charts for PDF export */}
      <div style={{ position: "absolute", left: "-9999px", top: "-9999px" }}>
        <div style={{ width: "800px", height: "1200px" }}>
          <PDFExport
            ref={pdfExportRef}
            paperSize="A4"
            fileName={fileName}
            margin="1cm"
            scale={0.7}
            forcePageBreak=".page-break"
          >
            <div className="pdf-content" style={{ fontFamily: 'Arial, sans-serif', color: '#000', width: '100%', minHeight: '1000px' }}>
              <h1 className="text-2xl font-bold mb-6 text-center">
                EduBox Analytics Report
              </h1>
              <p className="text-sm text-gray-600 mb-8 text-center">
                Generated on {new Date().toLocaleDateString()}
              </p>
              <div style={{ pageBreakInside: 'avoid' }}>
                {children}
              </div>
            </div>
          </PDFExport>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPDFExport;