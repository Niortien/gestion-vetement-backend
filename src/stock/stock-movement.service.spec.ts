import { StockMovementService } from './stock-movement.service';

describe('StockMovementService', () => {
  const prisma = {
    variante: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    mouvementStock: {
      create: jest.fn(),
    },
  };

  const queue = {
    add: jest.fn(),
  };

  let service: StockMovementService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new StockMovementService(prisma as never);
  });

  it('creates movement and updates stock', async () => {
    prisma.variante.findUnique.mockResolvedValue({
      id: 'v1',
      quantiteStock: 10,
      seuilAlerte: 3,
    });

    await service.createMovement({
      varianteId: 'v1',
      type: 'SORTIE',
      quantite: 3,
      userId: 'u1',
    });

    expect(prisma.variante.update).toHaveBeenCalledWith({
      where: { id: 'v1' },
      data: { quantiteStock: 7 },
    });
    expect(prisma.mouvementStock.create).toHaveBeenCalled();
  });
});
