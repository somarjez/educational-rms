import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export const exportElementToPdf = async ({
  element,
  fileName = 'report.pdf',
  marginMm = 10,
}) => {
  if (!element) {
    throw new Error('Nothing to export');
  }

  const canvas = await html2canvas(element, {
    scale: Math.max(2, window.devicePixelRatio || 1),
    useCORS: true,
    backgroundColor: '#ffffff',
    logging: false,
  });

  const imageData = canvas.toDataURL('image/png');
  const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const usableWidth = pageWidth - marginMm * 2;
  const usableHeight = pageHeight - marginMm * 2;

  const imageWidth = usableWidth;
  const imageHeight = (canvas.height * imageWidth) / canvas.width;

  let heightLeft = imageHeight;
  let position = marginMm;

  pdf.addImage(imageData, 'PNG', marginMm, position, imageWidth, imageHeight, undefined, 'FAST');
  heightLeft -= usableHeight;

  while (heightLeft > 0) {
    pdf.addPage();
    position = marginMm - (imageHeight - heightLeft);
    pdf.addImage(imageData, 'PNG', marginMm, position, imageWidth, imageHeight, undefined, 'FAST');
    heightLeft -= usableHeight;
  }

  pdf.save(fileName);
};

export default exportElementToPdf;
