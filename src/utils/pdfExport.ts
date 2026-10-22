import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface PdfExportOptions {
  fileName?: string;
  reportTitle?: string;
  candidateName?: string;
  onProgress?: (status: string) => void;
}

/**
 * Calculates optimal page split positions in canvas pixels
 * to avoid splitting cards or text blocks in half.
 */
function findCleanPageSplits(
  clone: HTMLElement,
  scale: number,
  maxPageCanvasHeight: number,
  totalCanvasHeight: number
): number[] {
  const cloneRect = clone.getBoundingClientRect();
  const splits: number[] = [0];
  let currentY = 0;

  // Identify all cards and block containers that shouldn't be sliced awkwardly
  const cards = Array.from(
    clone.querySelectorAll<HTMLElement>(
      '.print-avoid-break, .bg-white, section, .p-6, .p-5, .rounded-2xl'
    )
  );

  while (currentY + maxPageCanvasHeight < totalCanvasHeight) {
    const idealSplit = currentY + maxPageCanvasHeight;
    let adjustedSplit = idealSplit;

    // Search for a card crossing the ideal split boundary
    for (const card of cards) {
      const rect = card.getBoundingClientRect();
      const cardTopCanvas = (rect.top - cloneRect.top) * scale;
      const cardBottomCanvas = (rect.bottom - cloneRect.top) * scale;

      // Card crosses the boundary
      if (cardTopCanvas < idealSplit && cardBottomCanvas > idealSplit) {
        // Only adjust if the card top leaves at least 25% of the page height used
        if (cardTopCanvas > currentY + maxPageCanvasHeight * 0.25) {
          adjustedSplit = Math.floor(cardTopCanvas - 6 * scale);
          break;
        }
      }
    }

    // Fallback: If adjustment didn't leave enough room or moved backward, use ideal
    if (adjustedSplit <= currentY + maxPageCanvasHeight * 0.2) {
      adjustedSplit = idealSplit;
    }

    splits.push(adjustedSplit);
    currentY = adjustedSplit;
  }

  splits.push(totalCanvasHeight);
  return splits;
}

/**
 * Exports the specified HTML element (e.g. #printable-career-report) to a high-quality multi-page PDF.
 */
export async function exportReportToPdf(
  elementId: string,
  options: PdfExportOptions = {}
): Promise<void> {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error(`Report element with id "${elementId}" was not found.`);
  }

  options.onProgress?.('Preparing report structure for PDF export...');

  // Create isolated clone for pristine rendering
  const clone = element.cloneNode(true) as HTMLElement;

  // Establish consistent width & styling
  clone.id = 'pdf-render-clone';
  clone.style.width = '980px';
  clone.style.maxWidth = '980px';
  clone.style.padding = '36px';
  clone.style.backgroundColor = '#ffffff';
  clone.style.position = 'fixed';
  clone.style.left = '-9999px';
  clone.style.top = '0';
  clone.style.zIndex = '-9999';
  clone.style.boxSizing = 'border-box';

  // Reveal print-only executive summary header
  const printOnlyElements = clone.querySelectorAll<HTMLElement>(
    '.print\\:block, [class*="print:block"]'
  );
  printOnlyElements.forEach((el) => {
    el.style.display = 'block';
  });

  // Hide interactive buttons & web-only navigation from the PDF
  const nonPrintElements = clone.querySelectorAll<HTMLElement>(
    '.print\\:hidden, [class*="print:hidden"], button'
  );
  nonPrintElements.forEach((el) => {
    el.style.display = 'none';
  });

  // Ensure all text is crisp black/zinc
  clone.style.color = '#18181b';

  document.body.appendChild(clone);

  try {
    options.onProgress?.('Rendering high-resolution vector canvas...');

    const scale = 2; // High-DPI 2x scale for sharp typography & vectors
    const canvas = await html2canvas(clone, {
      scale,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: 1024,
    });

    options.onProgress?.('Formatting PDF pages...');

    // A4 dimensions in mm
    const pdf = new jsPDF({
      orientation: 'p',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    const pageWidth = 210;
    const pageHeight = 297;
    const marginX = 12;
    const marginY = 12;
    const footerSpace = 10;
    const printableWidth = pageWidth - marginX * 2; // 186mm
    const printableHeight = pageHeight - marginY * 2 - footerSpace; // 263mm

    // Convert printable height to canvas pixels
    const maxPageCanvasHeight = (printableHeight * canvas.width) / printableWidth;

    // Determine smart page breaks without slicing cards
    const splits = findCleanPageSplits(
      clone,
      scale,
      maxPageCanvasHeight,
      canvas.height
    );
    const totalPages = splits.length - 1;

    for (let i = 0; i < totalPages; i++) {
      if (i > 0) {
        pdf.addPage();
      }

      const startY = splits[i];
      const endY = splits[i + 1];
      const sliceHeight = endY - startY;

      // Create a temporary canvas for this specific page slice
      const pageCanvas = document.createElement('canvas');
      pageCanvas.width = canvas.width;
      pageCanvas.height = sliceHeight;

      const ctx = pageCanvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
        ctx.drawImage(
          canvas,
          0,
          startY,
          canvas.width,
          sliceHeight,
          0,
          0,
          canvas.width,
          sliceHeight
        );
      }

      const sliceHeightMm = (sliceHeight * printableWidth) / canvas.width;
      const imgData = pageCanvas.toDataURL('image/jpeg', 0.98);

      pdf.addImage(
        imgData,
        'JPEG',
        marginX,
        marginY,
        printableWidth,
        sliceHeightMm,
        undefined,
        'FAST'
      );

      // Running top mini-header for continuation pages
      if (i > 0) {
        pdf.setFontSize(7.5);
        pdf.setTextColor(150, 150, 160);
        pdf.text('CareerMatch AI • Comprehensive Career & Upskilling Report', marginX, 8);
        pdf.setDrawColor(230, 230, 235);
        pdf.setLineWidth(0.2);
        pdf.line(marginX, 9.5, pageWidth - marginX, 9.5);
      }

      // Elegant bottom footer on every page
      pdf.setDrawColor(230, 230, 235);
      pdf.setLineWidth(0.2);
      pdf.line(marginX, pageHeight - 10, pageWidth - marginX, pageHeight - 10);

      pdf.setFontSize(7.5);
      pdf.setTextColor(130, 130, 140);
      pdf.text(
        'Verified against Canada.ca Designated Learning Framework & Coursera Skills Graph',
        marginX,
        pageHeight - 5.5
      );

      const pageNumText = `Page ${i + 1} of ${totalPages}`;
      const pageNumWidth = pdf.getTextWidth(pageNumText);
      pdf.text(pageNumText, pageWidth - marginX - pageNumWidth, pageHeight - 5.5);
    }

    const today = new Date().toISOString().slice(0, 10);
    const fileName =
      options.fileName ||
      `CareerMatch_AI_Report_${today}.pdf`;

    options.onProgress?.('Saving PDF file...');
    pdf.save(fileName);
  } finally {
    // Always clean up detached DOM clone
    if (document.body.contains(clone)) {
      document.body.removeChild(clone);
    }
  }
}
