import { create } from 'zustand';
import type { Bag, BagDisc } from '../types/disc';

interface BagState {
  bags: Bag[];
  activeBagId: string | null;
  setBags: (bags: Bag[]) => void;
  setActiveBag: (bagId: string) => void;
  getActiveBag: () => Bag | undefined;
  addDisc: (bagId: string, disc: BagDisc) => void;
  removeDisc: (bagId: string, bagDiscId: string) => void;
  updateDisc: (bagId: string, bagDiscId: string, updates: Partial<BagDisc>) => void;
}

export const useBagStore = create<BagState>((set, get) => ({
  bags: [],
  activeBagId: null,

  setBags: (bags) => {
    const defaultBag = bags.find((b) => b.isDefault);
    set({ bags, activeBagId: defaultBag?.id ?? bags[0]?.id ?? null });
  },

  setActiveBag: (bagId) => set({ activeBagId: bagId }),

  getActiveBag: () => {
    const { bags, activeBagId } = get();
    return bags.find((b) => b.id === activeBagId);
  },

  addDisc: (bagId, disc) => {
    set((state) => ({
      bags: state.bags.map((bag) =>
        bag.id === bagId ? { ...bag, discs: [...bag.discs, disc] } : bag
      ),
    }));
  },

  removeDisc: (bagId, bagDiscId) => {
    set((state) => ({
      bags: state.bags.map((bag) =>
        bag.id === bagId
          ? { ...bag, discs: bag.discs.filter((d) => d.bagDiscId !== bagDiscId) }
          : bag
      ),
    }));
  },

  updateDisc: (bagId, bagDiscId, updates) => {
    set((state) => ({
      bags: state.bags.map((bag) =>
        bag.id === bagId
          ? {
              ...bag,
              discs: bag.discs.map((d) =>
                d.bagDiscId === bagDiscId ? { ...d, ...updates } : d
              ),
            }
          : bag
      ),
    }));
  },
}));
