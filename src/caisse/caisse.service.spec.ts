import { CaisseService } from './caisse.service';

describe('CaisseService', () => {
  const prisma = {
    session: {
      findFirst: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
      findMany: jest.fn(),
    },
    transaction: {
      findMany: jest.fn(),
      create: jest.fn(),
      count: jest.fn(),
    },
    entree: {
      findMany: jest.fn(),
    },
    sortie: {
      findMany: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const gateway = {
    emitTransaction: jest.fn(),
    emitSessionClosed: jest.fn(),
  };

  let service: CaisseService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new CaisseService(prisma as never, gateway as never);
  });

  it('opens session when none active', async () => {
    prisma.session.findFirst.mockResolvedValue(null);
    prisma.session.create.mockResolvedValue({ id: 's1', statut: 'OUVERTE' });

    const result = await service.openSession(
      { montantOuverture: '1000.00' },
      'u1',
    );
    expect(result).toEqual({ id: 's1', statut: 'OUVERTE' });
  });

  it('throws when no active session on transaction creation', async () => {
    prisma.session.findFirst.mockResolvedValue(null);
    await expect(
      service.createTransaction({ montant: '5000.00', modePaiement: 'CASH' }),
    ).rejects.toThrow();
  });
});
