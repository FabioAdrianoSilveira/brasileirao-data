import { supabase } from '../models/supabaseClient.js';

export class TimeController {
  // Busca todos os times para preencher o selection box
  async obterTodosOsTimes() {
    const { data, error } = await supabase
      .from('time')
      .select('nome')
      .order('nome', { ascending: true });

    if (error) {
      console.error('Erro ao buscar times:', error);
      return [];
    }
    return data || [];
  }

  // Busca goleiros do time ordenados por media_partidas DESC
  async obterGoleirosPorTime(timeNome) {
    const { data, error } = await supabase
      .from('jogador')
      .select(`
        *,
        goleiro!inner(*)
      `)
      .eq('time_nome', timeNome)
      .eq('tipo_jogador', 'GOLEIRO')
      .order('media_partidas', { ascending: false });

    if (error) {
      console.error('Erro ao buscar goleiros:', error);
      return [];
    }

    return data.map(item => ({
      ...item,
      ...item.goleiro
    }));
  }

  // Busca jogadores de linha ordenados por media_partidas DESC
  async obterJogadoresLinhaPorTime(timeNome) {
    const { data, error } = await supabase
      .from('jogador')
      .select(`
        *,
        linha!inner(*)
      `)
      .eq('time_nome', timeNome)
      .eq('tipo_jogador', 'LINHA')
      .order('media_partidas', { ascending: false });

    if (error) {
      console.error('Erro ao buscar jogadores de linha:', error);
      return [];
    }

    return data.map(item => ({
      ...item,
      ...item.linha
    }));
  }
}