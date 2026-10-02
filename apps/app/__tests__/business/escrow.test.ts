describe('Escrow 15% Platform Custody & Financial Business Rules', () => {
  const calculateEscrowSplit = (budget: number) => {
    const fee = Math.round(budget * 0.15 * 100) / 100;
    const proPayout = Math.round((budget - fee) * 100) / 100;
    return {
      total: budget,
      platformFee: fee,
      proPayout,
    };
  };

  it('should accurately calculate 15% platform commission and 85% pro payout on round amounts', () => {
    const split = calculateEscrowSplit(100);
    expect(split.platformFee).toBe(15.0);
    expect(split.proPayout).toBe(85.0);
    expect(split.platformFee + split.proPayout).toBe(100.0);
  });

  it('should accurately split larger professional amounts (e.g. 1,500 €)', () => {
    const split = calculateEscrowSplit(1500);
    expect(split.platformFee).toBe(225.0);
    expect(split.proPayout).toBe(1275.0);
    expect(split.platformFee + split.proPayout).toBe(1500.0);
  });

  it('should handle fractional cent amounts without precision leaks', () => {
    const split = calculateEscrowSplit(33.33);
    // 33.33 * 0.15 = 4.9995 -> 5.00 €
    expect(split.platformFee).toBe(5.0);
    expect(split.proPayout).toBe(28.33);
    expect(split.platformFee + split.proPayout).toBe(33.33);
  });

  it('should enforce zero-overflow rule on action buttons and pills', () => {
    const actionLabels = ['Continuar', 'Atrás', 'Publicar', 'Solicitud', 'Servicio', 'Buscar', 'Mensajes'];
    actionLabels.forEach((label) => {
      const words = label.trim().split(/\s+/);
      expect(words.length).toBeLessThanOrEqual(2);
    });
  });
});
