import { useFamilyStore } from '../familyStore';
import {
  fetchUserFamilies,
  fetchFamilyBabies,
  createFamily,
  createBaby,
  joinFamilyByCode,
} from '@/lib/sync';
import type { Family, Baby } from '@/types';

// Mock sync functions
jest.mock('@/lib/sync', () => ({
  fetchUserFamilies: jest.fn(),
  fetchFamilyBabies: jest.fn(),
  createFamily: jest.fn(),
  createBaby: jest.fn(),
  joinFamilyByCode: jest.fn(),
}));

const mockFamily: Family = {
  id: 'family-123',
  name: 'Test Family',
  invite_code: 'ABC123',
  created_at: '2024-01-01T00:00:00Z',
};

const mockFamily2: Family = {
  id: 'family-456',
  name: 'Another Family',
  invite_code: 'XYZ789',
  created_at: '2024-01-02T00:00:00Z',
};

const mockBaby: Baby = {
  id: 'baby-123',
  name: 'Test Baby',
  birthdate: '2024-01-01',
  family_id: 'family-123',
};

const mockBaby2: Baby = {
  id: 'baby-456',
  name: 'Another Baby',
  birthdate: '2024-01-15',
  family_id: 'family-123',
};

describe('familyStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset store state
    useFamilyStore.setState({
      families: [],
      babies: [],
      currentFamilyId: null,
      currentBabyId: null,
      loading: false,
      error: null,
    });
  });

  describe('fetchFamilies', () => {
    it('should fetch families successfully', async () => {
      (fetchUserFamilies as jest.Mock).mockResolvedValue([mockFamily]);
      (fetchFamilyBabies as jest.Mock).mockResolvedValue([mockBaby]);

      await useFamilyStore.getState().fetchFamilies();

      expect(fetchUserFamilies).toHaveBeenCalled();
      expect(useFamilyStore.getState().families).toEqual([mockFamily]);
      expect(useFamilyStore.getState().loading).toBe(false);
      expect(useFamilyStore.getState().error).toBeNull();
    });

    it('should auto-select single family', async () => {
      (fetchUserFamilies as jest.Mock).mockResolvedValue([mockFamily]);
      (fetchFamilyBabies as jest.Mock).mockResolvedValue([]);

      await useFamilyStore.getState().fetchFamilies();

      expect(useFamilyStore.getState().currentFamilyId).toBe('family-123');
      expect(fetchFamilyBabies).toHaveBeenCalledWith('family-123');
    });

    it('should not auto-select when multiple families', async () => {
      (fetchUserFamilies as jest.Mock).mockResolvedValue([mockFamily, mockFamily2]);

      await useFamilyStore.getState().fetchFamilies();

      expect(useFamilyStore.getState().currentFamilyId).toBeNull();
    });

    it('should handle fetch error', async () => {
      (fetchUserFamilies as jest.Mock).mockRejectedValue(new Error('Network error'));

      await useFamilyStore.getState().fetchFamilies();

      expect(useFamilyStore.getState().error).toBe('Network error');
      expect(useFamilyStore.getState().loading).toBe(false);
    });
  });

  describe('fetchBabies', () => {
    it('should fetch babies successfully', async () => {
      (fetchFamilyBabies as jest.Mock).mockResolvedValue([mockBaby]);

      await useFamilyStore.getState().fetchBabies('family-123');

      expect(fetchFamilyBabies).toHaveBeenCalledWith('family-123');
      expect(useFamilyStore.getState().babies).toEqual([mockBaby]);
      expect(useFamilyStore.getState().loading).toBe(false);
    });

    it('should auto-select single baby', async () => {
      (fetchFamilyBabies as jest.Mock).mockResolvedValue([mockBaby]);

      await useFamilyStore.getState().fetchBabies('family-123');

      expect(useFamilyStore.getState().currentBabyId).toBe('baby-123');
    });

    it('should not auto-select when multiple babies', async () => {
      (fetchFamilyBabies as jest.Mock).mockResolvedValue([mockBaby, mockBaby2]);

      await useFamilyStore.getState().fetchBabies('family-123');

      expect(useFamilyStore.getState().currentBabyId).toBeNull();
    });

    it('should handle fetch error', async () => {
      (fetchFamilyBabies as jest.Mock).mockRejectedValue(new Error('Database error'));

      await useFamilyStore.getState().fetchBabies('family-123');

      expect(useFamilyStore.getState().error).toBe('Database error');
      expect(useFamilyStore.getState().loading).toBe(false);
    });
  });

  describe('createFamily', () => {
    it('should create family successfully', async () => {
      (createFamily as jest.Mock).mockResolvedValue(mockFamily);
      (fetchFamilyBabies as jest.Mock).mockResolvedValue([]);

      const result = await useFamilyStore.getState().createFamily('Test Family');

      expect(result).toEqual(mockFamily);
      expect(useFamilyStore.getState().families).toContainEqual(mockFamily);
      expect(useFamilyStore.getState().currentFamilyId).toBe('family-123');
    });

    it('should handle creation failure', async () => {
      (createFamily as jest.Mock).mockResolvedValue(null);

      const result = await useFamilyStore.getState().createFamily('Test Family');

      expect(result).toBeNull();
      expect(useFamilyStore.getState().error).toBe('Failed to create family');
    });

    it('should handle creation error', async () => {
      (createFamily as jest.Mock).mockRejectedValue(new Error('Server error'));

      const result = await useFamilyStore.getState().createFamily('Test Family');

      expect(result).toBeNull();
      expect(useFamilyStore.getState().error).toBe('Server error');
    });
  });

  describe('joinFamily', () => {
    it('should join family successfully', async () => {
      (joinFamilyByCode as jest.Mock).mockResolvedValue(mockFamily);
      (fetchFamilyBabies as jest.Mock).mockResolvedValue([mockBaby]);

      const result = await useFamilyStore.getState().joinFamily('ABC123');

      expect(result).toEqual(mockFamily);
      expect(useFamilyStore.getState().families).toContainEqual(mockFamily);
      expect(useFamilyStore.getState().currentFamilyId).toBe('family-123');
      expect(fetchFamilyBabies).toHaveBeenCalledWith('family-123');
    });

    it('should handle invalid invite code', async () => {
      (joinFamilyByCode as jest.Mock).mockResolvedValue(null);

      const result = await useFamilyStore.getState().joinFamily('INVALID');

      expect(result).toBeNull();
      expect(useFamilyStore.getState().error).toBe('Invalid invite code or family not found');
    });

    it('should handle join error', async () => {
      (joinFamilyByCode as jest.Mock).mockRejectedValue(new Error('Network error'));

      const result = await useFamilyStore.getState().joinFamily('ABC123');

      expect(result).toBeNull();
      expect(useFamilyStore.getState().error).toBe('Network error');
    });
  });

  describe('createBaby', () => {
    it('should create baby successfully', async () => {
      (createBaby as jest.Mock).mockResolvedValue(mockBaby);

      const result = await useFamilyStore.getState().createBaby(
        'family-123',
        'Test Baby',
        '2024-01-01',
        'male'
      );

      expect(result).toEqual(mockBaby);
      expect(useFamilyStore.getState().babies).toContainEqual(mockBaby);
      expect(useFamilyStore.getState().currentBabyId).toBe('baby-123');
    });

    it('should not auto-select when not first baby', async () => {
      // Set existing baby
      useFamilyStore.setState({
        babies: [mockBaby],
        currentBabyId: 'baby-123',
      });

      (createBaby as jest.Mock).mockResolvedValue(mockBaby2);

      await useFamilyStore.getState().createBaby(
        'family-123',
        'Another Baby',
        '2024-01-15'
      );

      expect(useFamilyStore.getState().currentBabyId).toBe('baby-123');
      expect(useFamilyStore.getState().babies).toHaveLength(2);
    });

    it('should handle creation failure', async () => {
      (createBaby as jest.Mock).mockResolvedValue(null);

      const result = await useFamilyStore.getState().createBaby(
        'family-123',
        'Test Baby',
        '2024-01-01'
      );

      expect(result).toBeNull();
      expect(useFamilyStore.getState().error).toBe('Failed to create baby');
    });

    it('should handle creation error', async () => {
      (createBaby as jest.Mock).mockRejectedValue(new Error('Database error'));

      const result = await useFamilyStore.getState().createBaby(
        'family-123',
        'Test Baby',
        '2024-01-01'
      );

      expect(result).toBeNull();
      expect(useFamilyStore.getState().error).toBe('Database error');
    });
  });

  describe('setCurrentFamily', () => {
    it('should set current family and fetch babies', async () => {
      (fetchFamilyBabies as jest.Mock).mockResolvedValue([mockBaby]);

      useFamilyStore.getState().setCurrentFamily('family-123');

      expect(useFamilyStore.getState().currentFamilyId).toBe('family-123');
      expect(fetchFamilyBabies).toHaveBeenCalledWith('family-123');
    });
  });

  describe('setCurrentBaby', () => {
    it('should set current baby', () => {
      useFamilyStore.getState().setCurrentBaby('baby-123');

      expect(useFamilyStore.getState().currentBabyId).toBe('baby-123');
    });
  });

  describe('reset', () => {
    it('should reset store to initial state', () => {
      // Set some state
      useFamilyStore.setState({
        families: [mockFamily],
        babies: [mockBaby],
        currentFamilyId: 'family-123',
        currentBabyId: 'baby-123',
        error: 'Some error',
      });

      useFamilyStore.getState().reset();

      expect(useFamilyStore.getState()).toEqual({
        families: [],
        babies: [],
        currentFamilyId: null,
        currentBabyId: null,
        loading: false,
        error: null,
        fetchFamilies: expect.any(Function),
        fetchBabies: expect.any(Function),
        createFamily: expect.any(Function),
        joinFamily: expect.any(Function),
        createBaby: expect.any(Function),
        setCurrentFamily: expect.any(Function),
        setCurrentBaby: expect.any(Function),
        reset: expect.any(Function),
      });
    });
  });
});
