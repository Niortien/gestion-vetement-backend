import { RapportsService } from './rapports.service';

describe('RapportsService', () => {
  const prisma = {
    transaction: {
      findMany: jest.fn(),
    },
    variante: {
      findMany: jest.fn(),
    },
    ligneSortie: {
      findMany: jest.fn(),
    },
    sortie: {
      findMany: jest.fn(),
    },
  };

  let service: RapportsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new RapportsService(prisma as never);
  });

  it('computes stock value using Decimal', async () => {
    prisma.variante.findMany.mockResolvedValue([
      {
        quantiteStock: 2,
        produit: { prixAchat: { toString: () => '100.00' } },
      },
      { quantiteStock: 1, produit: { prixAchat: { toString: () => '50.00' } } },
    ]);

    const result = await service.stockValeur();
    expect(result).toEqual({ valeurStock: '250.00' });
  });
});
