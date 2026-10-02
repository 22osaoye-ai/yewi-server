import { buildBudgetHtml, exportBudgetPdf, BudgetPdfExportData } from '@/services/budgetPdfService';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

jest.mock('expo-print', () => ({
  printToFileAsync: jest.fn().mockResolvedValue({ uri: 'file:///mock/budget.pdf' }),
  printAsync: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('expo-sharing', () => ({
  isAvailableAsync: jest.fn().mockResolvedValue(true),
  shareAsync: jest.fn().mockResolvedValue(undefined),
}));

describe('budgetPdfService - Budget PDF Export Resilience', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const baseData: BudgetPdfExportData = {
    title: 'Reforma Integral de Cocina',
    items: [
      {
        id: '1',
        title: 'Demolición y desescombro',
        unit: 'm²',
        quantity: 15,
        unitPrice: 25,
        subtotal: 375,
        laborPercent: 70,
        materialPercent: 30,
      },
      {
        id: '2',
        title: 'Alicatado cerámico rectificado',
        unit: 'm²',
        quantity: 30,
        unitPrice: 42,
        subtotal: 1260,
        laborPercent: 60,
        materialPercent: 40,
      },
    ],
    province: 'Zaragoza',
    validityDays: 30,
    estimatedDays: 14,
    vatRate: 10,
    laborTotal: 1018.5,
    materialTotal: 616.5,
    baseTotal: 1635,
    vatTotal: 163.5,
    grandTotal: 1798.5,
    tradeTip: 'Revisar tomas de fontanería antes de alicatar',
    professionalName: 'Carlos Gómez',
    professionalBusiness: 'Reformas Gómez',
    professionalPhone: '+34600112233',
    professionalEmail: 'carlos@reformasgomez.es',
  };

  it('buildBudgetHtml generates valid HTML without throwing', () => {
    const html = buildBudgetHtml(baseData);
    expect(html).toContain('Reforma Integral de Cocina');
    expect(html).toContain('Reformas Gómez');
    expect(html).toContain('1635.00 €');
    expect(html).toContain('1798.50 €');
    expect(html).toContain('Demolición y desescombro');
  });

  it('handles string numbers in items and totals without throwing TypeError (.toFixed)', () => {
    const stringData: any = {
      ...baseData,
      laborTotal: '1018.50',
      materialTotal: '616.50',
      baseTotal: '1635.00',
      vatTotal: '163.50',
      grandTotal: '1798.50',
      items: [
        {
          id: '1',
          title: 'Fontanería completa',
          unit: 'ud',
          quantity: '2',
          unitPrice: '150.00',
          subtotal: '300.00',
        },
      ],
    };

    expect(() => {
      const html = buildBudgetHtml(stringData);
      expect(html).toContain('150.00 €');
      expect(html).toContain('300.00 €');
    }).not.toThrow();
  });

  it('handles empty items array gracefully without crashing', () => {
    const emptyData: BudgetPdfExportData = {
      ...baseData,
      items: [],
      laborTotal: 0,
      materialTotal: 0,
      baseTotal: 0,
      vatTotal: 0,
      grandTotal: 0,
    };

    const html = buildBudgetHtml(emptyData);
    expect(html).toContain('No hay partidas especificadas');
  });

  it('escapes HTML characters in user input to prevent layout disruption', () => {
    const maliciousData: BudgetPdfExportData = {
      ...baseData,
      title: 'Obra <script>alert("xss")</script> & Remates "Especiales"',
      items: [
        {
          id: '1',
          title: 'Partida <img src="x" onerror="fail" /> & test',
          unit: 'ud',
          quantity: 1,
          unitPrice: 50,
          subtotal: 50,
        },
      ],
    };

    const html = buildBudgetHtml(maliciousData);
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
    expect(html).toContain('&amp; Remates');
    expect(html).not.toContain('<img src="x"');
  });

  it('exportBudgetPdf invokes printToFileAsync and sharing successfully on native', async () => {
    const uri = await exportBudgetPdf(baseData);
    expect(Print.printToFileAsync).toHaveBeenCalledTimes(1);
    expect(Sharing.shareAsync).toHaveBeenCalledTimes(1);
    expect(uri).toBeTruthy();
  });

  it('exportBudgetPdf does not throw when user dismisses or cancels native share sheet', async () => {
    (Sharing.shareAsync as jest.Mock).mockRejectedValueOnce(new Error('User cancelled'));
    await expect(exportBudgetPdf(baseData)).resolves.toBeTruthy();
  });
});
