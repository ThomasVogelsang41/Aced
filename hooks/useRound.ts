import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { Round } from '../types/round';

export function useRoundHistory(userId: string | null) {
  return useQuery({
    queryKey: ['rounds', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from('rounds')
        .select('*, scores(*)')
        .eq('user_id', userId)
        .not('finished_at', 'is', null)
        .order('started_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!userId,
    staleTime: 2 * 60 * 1000,
  });
}

export function useSaveRound() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (round: Round & { userId: string }) => {
      // Insert round
      const { data: roundData, error: roundError } = await supabase
        .from('rounds')
        .insert({
          user_id: round.userId,
          course_id: round.courseId,
          course_name: round.courseName,
          layout_id: round.layoutId ?? null,
          layout_name: round.layoutName ?? null,
          started_at: round.startedAt,
          finished_at: round.finishedAt ?? new Date().toISOString(),
          total_score: round.totalScore ?? null,
          total_par: round.totalPar ?? null,
          weather_snapshot: round.weatherSnapshot ?? null,
        })
        .select()
        .single();

      if (roundError) throw roundError;

      // Insert scores
      const scoresToInsert = round.scores
        .filter((s) => s.strokes > 0)
        .map((s) => ({
          round_id: roundData.id,
          hole_number: s.holeNumber,
          par: s.par,
          strokes: s.strokes,
          disc_used: s.discUsed ?? null,
          notes: s.notes ?? null,
        }));

      if (scoresToInsert.length > 0) {
        const { error: scoresError } = await supabase
          .from('scores')
          .insert(scoresToInsert);
        if (scoresError) throw scoresError;
      }

      return roundData;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['rounds', variables.userId] });
    },
  });
}
