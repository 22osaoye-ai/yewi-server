import { Platform } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { BudgetItemModel } from '@/services/proToolsApi';

export interface BudgetPdfExportData {
  title: string;
  items: BudgetItemModel[];
  province: string;
  validityDays: number;
  estimatedDays: number;
  vatRate: number;
  laborTotal: number;
  materialTotal: number;
  baseTotal: number;
  vatTotal: number;
  grandTotal: number;
  tradeTip?: string;
  professionalName?: string;
  professionalBusiness?: string;
  professionalPhone?: string;
  professionalEmail?: string;
}

function escapeHtml(str: string): string {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatCurrency(val: any): string {
  const num = typeof val === 'number' ? val : parseFloat(String(val ?? 0).replace(',', '.')) || 0;
  return isNaN(num) ? '0.00' : num.toFixed(2);
}

/**
 * Builds clean, high-resolution HTML template for professional construction quotes in Spain
 */
export function buildBudgetHtml(data: BudgetPdfExportData): string {
  const currentDate = new Date().toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
  const budgetRefNumber = `YEWI-${Date.now().toString().slice(-6)}`;

  const laborTotalFormatted = formatCurrency(data.laborTotal);
  const materialTotalFormatted = formatCurrency(data.materialTotal);
  const baseTotalFormatted = formatCurrency(data.baseTotal);
  const vatTotalFormatted = formatCurrency(data.vatTotal);
  const grandTotalFormatted = formatCurrency(data.grandTotal);
  const vatRateFormatted = Number(data.vatRate) || 0;

  const itemsList = data.items || [];
  const itemsRowsHtml = itemsList.length > 0
    ? itemsList
        .map((item, index) => {
          const unitPriceFormatted = formatCurrency(item.unitPrice);
          const subtotalFormatted = formatCurrency(item.subtotal);
          const laborPct = item.laborPercent ?? 65;
          const matPct = item.materialPercent ?? 35;
          const quantityFormatted = typeof item.quantity === 'number' ? item.quantity : parseFloat(String(item.quantity).replace(',', '.')) || 0;

          return `
            <tr style="border-bottom: 1px solid #E2E8F0;">
              <td style="padding: 10px 8px; text-align: center; color: #64748B; font-weight: 600; font-size: 12px;">${index + 1}</td>
              <td style="padding: 10px 8px;">
                <div style="font-weight: 700; color: #0F172A; font-size: 13px; margin-bottom: 3px;">${escapeHtml(item.title)}</div>
                <div style="font-size: 11px; color: #64748B;">Mano de obra: ${laborPct}% · Materiales: ${matPct}%</div>
              </td>
              <td style="padding: 10px 8px; text-align: center; font-weight: 600; font-size: 13px; color: #1E293B;">${quantityFormatted}</td>
              <td style="padding: 10px 8px; text-align: center; font-weight: 600; font-size: 12px; color: #475569;">${escapeHtml(item.unit || 'ud')}</td>
              <td style="padding: 10px 8px; text-align: right; font-weight: 600; font-size: 13px; color: #1E293B;">${unitPriceFormatted} €</td>
              <td style="padding: 10px 8px; text-align: right; font-weight: 800; font-size: 13px; color: #0F172A;">${subtotalFormatted} €</td>
            </tr>
          `;
        })
        .join('')
    : `
        <tr>
          <td colspan="6" style="padding: 16px; text-align: center; color: #64748B; font-style: italic;">
            No hay partidas especificadas en este presupuesto.
          </td>
        </tr>
      `;

  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="utf-8">
      <title>${escapeHtml(data.title)} - Presupuesto Oficial</title>
      <style>
        @page {
          size: A4;
          margin: 15mm;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          color: #0F172A;
          margin: 0;
          padding: 0;
          font-size: 13px;
          line-height: 1.5;
          background: #FFFFFF;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          border-bottom: 2px solid #0284C7;
          padding-bottom: 16px;
          margin-bottom: 20px;
        }
        .brand-badge {
          display: inline-block;
          background: #0284C7;
          color: #FFFFFF;
          padding: 4px 10px;
          border-radius: 6px;
          font-weight: 800;
          font-size: 12px;
          letter-spacing: 0.5px;
          margin-bottom: 6px;
        }
        .company-title {
          font-size: 20px;
          font-weight: 800;
          color: #0F172A;
          margin: 0;
        }
        .company-subtitle {
          font-size: 12px;
          color: #64748B;
          margin: 2px 0 0 0;
        }
        .doc-meta {
          text-align: right;
        }
        .doc-meta-title {
          font-size: 16px;
          font-weight: 800;
          color: #0284C7;
          margin: 0 0 4px 0;
        }
        .doc-meta-item {
          font-size: 11.5px;
          color: #475569;
          margin: 1px 0;
        }
        .info-grid {
          display: flex;
          justify-content: space-between;
          background: #F8FAFC;
          border: 1px solid #E2E8F0;
          border-radius: 8px;
          padding: 14px;
          margin-bottom: 20px;
        }
        .info-col {
          flex: 1;
        }
        .info-label {
          font-size: 10px;
          font-weight: 700;
          color: #64748B;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 2px;
        }
        .info-val {
          font-size: 13px;
          font-weight: 700;
          color: #0F172A;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
        }
        th {
          background: #0F172A;
          color: #FFFFFF;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          padding: 8px;
        }
        .summary-container {
          display: flex;
          justify-content: flex-end;
          margin-bottom: 20px;
        }
        .summary-card {
          width: 320px;
          background: #F8FAFC;
          border: 1px solid #E2E8F0;
          border-radius: 8px;
          padding: 14px;
        }
        .summary-row {
          display: flex;
          justify-content: space-between;
          padding: 4px 0;
          font-size: 12.5px;
          color: #475569;
        }
        .summary-total {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          border-top: 2px solid #0284C7;
          margin-top: 8px;
          padding-top: 8px;
        }
        .total-label {
          font-size: 14px;
          font-weight: 800;
          color: #0F172A;
        }
        .total-amount {
          font-size: 20px;
          font-weight: 900;
          color: #0284C7;
        }
        .terms-box {
          background: #F1F5F9;
          border-left: 4px solid #0284C7;
          padding: 10px 14px;
          border-radius: 4px;
          font-size: 11px;
          color: #475569;
          margin-bottom: 24px;
        }
        .signature-row {
          display: flex;
          justify-content: space-between;
          margin-top: 30px;
          padding-top: 10px;
        }
        .signature-box {
          width: 220px;
          border-top: 1px dashed #94A3B8;
          text-align: center;
          font-size: 11px;
          color: #64748B;
          padding-top: 6px;
        }
        .footer {
          margin-top: 30px;
          text-align: center;
          font-size: 10px;
          color: #94A3B8;
          border-top: 1px solid #E2E8F0;
          padding-top: 10px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <div class="brand-badge">YEWI PRO · OFICIAL</div>
          <h1 class="company-title">${escapeHtml(data.professionalBusiness || 'Profesional de Construcción y Reformas')}</h1>
          <p class="company-subtitle">${escapeHtml(data.professionalName || 'Servicios Homologados')} · Zona: ${escapeHtml(data.province)}</p>
        </div>
        <div class="doc-meta">
          <div class="doc-meta-title">PRESUPUESTO</div>
          <div class="doc-meta-item"><strong>Nº Ref:</strong> ${budgetRefNumber}</div>
          <div class="doc-meta-item"><strong>Fecha:</strong> ${currentDate}</div>
          <div class="doc-meta-item"><strong>Validez:</strong> ${Number(data.validityDays) || 30} días</div>
        </div>
      </div>

      <div class="info-grid">
        <div class="info-col">
          <div class="info-label">Proyecto / Obra</div>
          <div class="info-val">${escapeHtml(data.title)}</div>
        </div>
        <div class="info-col" style="text-align: center;">
          <div class="info-label">Plazo Estimado</div>
          <div class="info-val">${Number(data.estimatedDays) || 0} días laborables</div>
        </div>
        <div class="info-col" style="text-align: right;">
          <div class="info-label">Provincia Calibrada</div>
          <div class="info-val">${escapeHtml(data.province)} (Costes 2026)</div>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th style="width: 30px;">#</th>
            <th style="text-align: left;">Descripción de la Partida</th>
            <th style="width: 50px; text-align: center;">Cant.</th>
            <th style="width: 50px; text-align: center;">Ud.</th>
            <th style="width: 90px; text-align: right;">Precio Ud.</th>
            <th style="width: 95px; text-align: right;">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          ${itemsRowsHtml}
        </tbody>
      </table>

      <div class="summary-container">
        <div class="summary-card">
          <div class="summary-row">
            <span>Mano de obra estimada:</span>
            <span>${laborTotalFormatted} €</span>
          </div>
          <div class="summary-row">
            <span>Materiales estimados:</span>
            <span>${materialTotalFormatted} €</span>
          </div>
          <div class="summary-row" style="font-weight: 700; color: #0F172A; border-top: 1px dashed #CBD5E1; margin-top: 4px; padding-top: 4px;">
            <span>Base Imponible:</span>
            <span>${baseTotalFormatted} €</span>
          </div>
          <div class="summary-row">
            <span>IVA (${vatRateFormatted}%):</span>
            <span>${vatTotalFormatted} €</span>
          </div>
          <div class="summary-total">
            <span class="total-label">TOTAL PRESUPUESTO:</span>
            <span class="total-amount">${grandTotalFormatted} €</span>
          </div>
        </div>
      </div>

      <div class="terms-box">
        <strong>Condiciones y forma de pago:</strong>
        <br>
        1. 40% a la firma del contrato y replanteo inicial.
        <br>
        2. 40% a mitad de los trabajos ejecutados.
        <br>
        3. 20% a la finalización, remate y entrega con conformidad del cliente.
        <br>
        ${data.tradeTip ? `<em>Nota técnica: ${escapeHtml(data.tradeTip)}</em>` : ''}
      </div>

      <div class="signature-row">
        <div class="signature-box">
          Firma y NIF del Profesional
        </div>
        <div class="signature-box">
          Conformidad y Firma del Cliente
        </div>
      </div>

      <div class="footer">
        Generado con el motor de presupuestos oficiales Yewi Pro · Precios de referencia calibrados por provincia
      </div>
    </body>
    </html>
  `;
}

let isSharingMutexActive = false;

/**
 * Generates official PDF file and triggers native export / share dialog
 */
export async function exportBudgetPdf(data: BudgetPdfExportData): Promise<string> {
  if (isSharingMutexActive) {
    return 'in_progress';
  }
  isSharingMutexActive = true;

  try {
    const html = buildBudgetHtml(data);

    // Web platform: printToFileAsync is not supported on web. Use browser print preview or printAsync
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined') {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(html);
          printWindow.document.close();
          printWindow.focus();
          setTimeout(() => {
            try {
              printWindow.print();
            } catch {
              // print dialog error ignored
            }
          }, 300);
          return 'web_printed';
        }
      }
      await Print.printAsync({ html });
      return 'web_printed';
    }

    // Native (iOS & Android)
    const result = await Print.printToFileAsync({
      html,
      base64: false,
    });

    const uri = result?.uri;
    if (!uri) {
      throw new Error('No se pudo generar el archivo PDF.');
    }

    // Sanitize title for filename / dialog
    const safeTitle = (data.title || 'Presupuesto')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .replace(/_+/g, '_')
      .slice(0, 40);

    const fileName = `Presupuesto_${safeTitle || 'Obra'}.pdf`;

    let shareUri = uri;
    try {
      const FileSystem = await import('expo-file-system/legacy').catch(() => null);
      if (FileSystem?.cacheDirectory) {
        const targetPath = `${FileSystem.cacheDirectory}${fileName}`;
        if (targetPath !== uri) {
          await FileSystem.deleteAsync(targetPath, { idempotent: true }).catch(() => {});
          await FileSystem.copyAsync({
            from: uri,
            to: targetPath,
          });
          shareUri = targetPath;
        }
      }
    } catch {
      shareUri = uri;
    }

    const isAvailable = await Sharing.isAvailableAsync().catch(() => false);
    if (isAvailable) {
      try {
        await Sharing.shareAsync(shareUri, {
          mimeType: 'application/pdf',
          dialogTitle: `Presupuesto ${safeTitle || 'Obra'}`,
          UTI: '.pdf',
        });
        return shareUri;
      } catch (shareErr: any) {
        // If Sharing.shareAsync rejects (e.g. user canceled, chooser already open, or intent failed),
        // fallback gracefully to Print.printAsync preview so the user can still view, save or print the PDF.
        console.warn('Sharing.shareAsync rejected, falling back to printAsync:', shareErr?.message);
        try {
          await Print.printAsync({ uri: shareUri });
        } catch {
          // Both share and print handled; return shareUri without throwing an unhandled rejection
        }
        return shareUri;
      }
    } else {
      // In environments without native share intent (e.g. emulator), fallback to print preview
      await Print.printAsync({ uri: shareUri }).catch(() => {});
      return shareUri;
    }
  } finally {
    setTimeout(() => {
      isSharingMutexActive = false;
    }, 600);
  }
}
