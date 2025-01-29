import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { FoodSafetyChecklistCompletion, ChecklistItemCompletion } from '../types/kitchen';

export const generateChecklistPDF = async (completion: FoodSafetyChecklistCompletion): Promise<Blob> => {
  const doc = new jsPDF();
  
  // Add Logo/Header
  doc.setFillColor(228, 0, 43); // #E4002B
  doc.rect(0, 0, doc.internal.pageSize.width, 40, 'F');
  
  doc.setFontSize(24);
  doc.setTextColor(255, 255, 255);
  doc.text('Food Safety Checklist Report', 105, 25, { align: 'center' });

  // Add Completion Details Box
  doc.setFillColor(248, 248, 248);
  doc.rect(10, 50, doc.internal.pageSize.width - 20, 40, 'F');
  
  doc.setFontSize(12);
  doc.setTextColor(51, 51, 51);
  doc.text('Checklist Details', 20, 60);
  
  doc.setFontSize(10);
  doc.text(`Completed By: ${completion.completedBy}`, 20, 70);
  doc.text(`Date: ${new Date(completion.completedAt).toLocaleDateString()}`, 20, 77);
  
  // Add Score and Status with colored boxes
  const statusColors = {
    pass: [76, 175, 80],
    warning: [255, 152, 0],
    fail: [244, 67, 54]
  };
  
  doc.setFillColor(...(statusColors[completion.overallStatus] || [102, 102, 102]));
  doc.roundedRect(doc.internal.pageSize.width - 80, 60, 60, 20, 3, 3, 'F');
  doc.setTextColor(255, 255, 255);
  doc.text(`${completion.score}%`, doc.internal.pageSize.width - 65, 72);
  doc.text(completion.overallStatus.toUpperCase(), doc.internal.pageSize.width - 70, 77);

  // Add Items Table with enhanced styling
  const tableData = completion.items.map((item: ChecklistItemCompletion) => [
    item.item,
    item.value.toString(),
    {
      content: item.status.toUpperCase(),
      styles: {
        fillColor: statusColors[item.status] || [102, 102, 102],
        textColor: [255, 255, 255],
        halign: 'center'
      }
    },
    item.notes || ''
  ]);

  doc.autoTable({
    startY: 100,
    head: [['Item', 'Value', 'Status', 'Notes']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [228, 0, 43],
      textColor: [255, 255, 255],
      fontSize: 12,
      fontStyle: 'bold',
      halign: 'center'
    },
    styles: {
      fontSize: 10,
      cellPadding: 5
    },
    columnStyles: {
      0: { cellWidth: 60 },
      1: { cellWidth: 30, halign: 'center' },
      2: { cellWidth: 30 },
      3: { cellWidth: 'auto' }
    }
  });

  // Add Notes Section with styled box if present
  if (completion.notes) {
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFillColor(248, 248, 248);
    doc.roundedRect(10, finalY, doc.internal.pageSize.width - 20, 30, 3, 3, 'F');
    
    doc.setTextColor(51, 51, 51);
    doc.setFontSize(12);
    doc.text('Overall Notes:', 20, finalY + 10);
    doc.setFontSize(10);
    doc.text(completion.notes, 20, finalY + 20);
  }

  // Add Review Section with styled box if reviewed
  if (completion.reviewedBy) {
    const finalY = (doc as any).lastAutoTable.finalY + (completion.notes ? 50 : 10);
    doc.setFillColor(248, 248, 248);
    doc.roundedRect(10, finalY, doc.internal.pageSize.width - 20, 40, 3, 3, 'F');
    
    doc.setTextColor(51, 51, 51);
    doc.setFontSize(12);
    doc.text('Review Details:', 20, finalY + 10);
    doc.setFontSize(10);
    doc.text(`Reviewed By: ${completion.reviewedBy}`, 20, finalY + 20);
    doc.text(`Review Date: ${new Date(completion.reviewedAt!).toLocaleDateString()}`, 20, finalY + 27);
    if (completion.reviewNotes) {
      doc.text('Review Notes:', 20, finalY + 34);
      doc.text(completion.reviewNotes, 30, finalY + 41);
    }
  }

  // Add Footer
  const pageCount = doc.internal.getNumberOfPages();
  doc.setFontSize(8);
  doc.setTextColor(128, 128, 128);
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.text(
      `Page ${i} of ${pageCount} | Generated on ${new Date().toLocaleString()}`,
      doc.internal.pageSize.width / 2,
      doc.internal.pageSize.height - 10,
      { align: 'center' }
    );
  }

  return new Blob([doc.output('blob')], { type: 'application/pdf' });
}; 