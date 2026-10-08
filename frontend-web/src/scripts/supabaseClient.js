// Cliente Supabase + métodos de busca. Credenciais lidas do .env (exige servidor local, ex.: `npx serve`).
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

async function carregarEnv() {
  const txt = await (await fetch('../.env')).text();
  return Object.fromEntries(txt.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('#'))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, '')]; }));
}
const env = await carregarEnv();
export const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);

const SEL = '*, goleiro(*), linha(*)';
const um = x => (Array.isArray(x) ? x[0] : x) ?? null;
const normaliza = j => ({ ...j, goleiro: um(j.goleiro), linha: um(j.linha) });
const ok = ({ data, error }) => { if (error) throw error; return data; };

export const getTimes = async () => ok(await supabase.from('time').select('*').order('nome'));
export const getTime = async nome => ok(await supabase.from('time').select('*').eq('nome', nome).single());
export const getElenco = async time => (ok(await supabase.from('jogador').select(SEL).eq('time_nome', time))).map(normaliza);
