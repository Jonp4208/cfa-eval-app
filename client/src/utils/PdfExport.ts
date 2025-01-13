import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

export const generatePDF = async (evaluation: any): Promise<Blob> => {
  const doc = new jsPDF();
  
  // Add Header
  doc.setFontSize(20);
  doc.setTextColor(220, 38, 38);
  doc.text('Performance Evaluation', 105, 15, { align: 'center' });
  // ... rest of the PDF generation code ...

  return new Blob([doc.output('blob')], { type: 'application/pdf' });
}; 