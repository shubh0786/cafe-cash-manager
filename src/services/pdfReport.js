import html2canvas from 'html2canvas-pro';
import { jsPDF } from 'jspdf';

const OWNER_WHATSAPP = '64226229364';

export async function generatePDF(elementId) {
  const el = document.getElementById(elementId);
  if (!el) return null;

  const canvas = await html2canvas(el, {
    scale: 2,
    backgroundColor: '#ffffff',
    useCORS: true,
    logging: false,
  });

  const imgData = canvas.toDataURL('image/png');
  const imgWidth = 190;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  const pdf = new jsPDF('p', 'mm', 'a4');
  pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);

  return pdf;
}

export async function downloadPDF(elementId, filename) {
  const pdf = await generatePDF(elementId);
  if (pdf) pdf.save(filename);
}

export function shareToWhatsApp(message) {
  const phone = OWNER_WHATSAPP;
  const encoded = encodeURIComponent(message);
  const url = `https://api.whatsapp.com/send?phone=${phone}&text=${encoded}`;

  const a = document.createElement('a');
  a.href = url;
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
