import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useBagStore } from '../store/bagStore';
import type { Bag, BagDisc } from '../types/disc';

function mapRow(row: Record<string, unknown>): BagDisc {
  return {
    bagDiscId: row.id as string,
    bagId: row.bag_id as string,
    id: `${row.trydiscs_brand}:${row.trydiscs_disc}`,
    brand: row.trydiscs_brand as string,
    name: row.trydiscs_disc as string,
    category: row.category as BagDisc['category'],
    speed: Number(row.speed),
    glide: Number(row.glide),
    turn: Number(row.turn),
    fade: Number(row.fade),
    nickname: row.nickname as string | undefined,
    plastic: row.plastic as string | undefined,
    weightGrams: row.weight as number | undefined,
    color: row.color as string | undefined,
    isWorn: Boolean(row.is_worn),
  };
}

export function useBags(userId: string | null) {
  const setBags = useBagStore((s) => s.setBags);

  return useQuery({
    queryKey: ['bags', userId],
    queryFn: async (): Promise<Bag[]> => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from('bags')
        .select('*, bag_discs(*)')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const bags: Bag[] = (data ?? []).map((row: Record<string, unknown>) => ({
        id: row.id as string,
        userId: row.user_id as string,
        name: row.name as string,
        isDefault: Boolean(row.is_default),
        discs: ((row.bag_discs as Record<string, unknown>[]) ?? []).map(mapRow),
      }));

      setBags(bags);
      return bags;
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useAddDiscToBag() {
  const queryClient = useQueryClient();
  const addDisc = useBagStore((s) => s.addDisc);

  return useMutation({
    mutationFn: async ({
      bagId,
      disc,
    }: {
      bagId: string;
      disc: Omit<BagDisc, 'bagDiscId'>;
    }) => {
      const { data, error } = await supabase
        .from('bag_discs')
        .insert({
          bag_id: bagId,
          trydiscs_brand: disc.brand,
          trydiscs_disc: disc.name,
          category: disc.category,
          speed: disc.speed,
          glide: disc.glide,
          turn: disc.turn,
          fade: disc.fade,
          nickname: disc.nickname ?? null,
          plastic: disc.plastic ?? null,
          weight: disc.weightGrams ?? null,
          color: disc.color ?? null,
          is_worn: disc.isWorn ?? false,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data, { bagId, disc }) => {
      addDisc(bagId, { ...disc, bagDiscId: data.id });
      queryClient.invalidateQueries({ queryKey: ['bags'] });
    },
  });
}

export function useRemoveDiscFromBag() {
  const queryClient = useQueryClient();
  const removeDisc = useBagStore((s) => s.removeDisc);

  return useMutation({
    mutationFn: async ({ bagId, bagDiscId }: { bagId: string; bagDiscId: string }) => {
      const { error } = await supabase.from('bag_discs').delete().eq('id', bagDiscId);
      if (error) throw error;
    },
    onSuccess: (_, { bagId, bagDiscId }) => {
      removeDisc(bagId, bagDiscId);
      queryClient.invalidateQueries({ queryKey: ['bags'] });
    },
  });
}
