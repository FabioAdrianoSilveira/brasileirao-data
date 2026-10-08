// Utilitários: mapeamentos, score por setor e modelo de Poisson.
export const SETOR = { GK: 'Goleiro', DF: 'Defesa', MF: 'Meio-Campo', FW: 'Ataque' };
export const pos = j => (Array.isArray(j.posicao) ? j.posicao : String(j.posicao ?? '').replace(/[{}"]/g, '').split(',')).map(s => s.trim()).filter(Boolean);
export const isGoleiro = j => pos(j).includes('GK');
export const setoresPt = j => pos(j).map(p => SETOR[p] ?? p).join(' / ');

const div = (a, b) => (b ? a / b : 0);
const num = v => Number(v) || 0;
/** Valor de uma métrica do jogador (junta jogador + goleiro + linha). */
const m = (j, k) => num(j[k] ?? j.goleiro?.[k] ?? j.linha?.[k]);

/**
 * Melhor jogador do setor ('GK'|'DF'|'MF'|'FW') num elenco -> jogador (objeto) ou null.
 * 1) filtro: >=20% das partidas do time; 2) normaliza por max do elenco elegível (0-100);
 * 3) fórmula do setor; 4) penalidade 0.5*amarelos/90s + 2.5*vermelhos/90s (media_partidas = nº de "90s").
 */
export function melhorDoSetor(elenco, setor, totalPartidas) {
  const el = elenco.filter(j => pos(j).includes(setor) && num(j.media_partidas) >= 0.2 * totalPartidas);
  if (!el.length) return null;
  const mx = k => Math.max(...el.map(j => m(j, k)), 0);
  const n = (j, k) => div(m(j, k), mx(k)) * 100;
  const mxAtk = Math.max(...el.map(j => m(j, 'gols') + m(j, 'assistencias')), 0);
  const base = {
    GK: j => 0.7 * n(j, 'porcentagem_defesa') + 0.3 * n(j, 'jogos_sem_sofrer_gols'),
    DF: j => 0.5 * n(j, 'desarmes') + 0.3 * n(j, 'assistencias') + 0.2 * n(j, 'gols'),
    MF: j => 0.4 * n(j, 'assistencias') + 0.35 * n(j, 'desarmes') + 0.25 * n(j, 'chutes_no_gol'),
    FW: j => 0.5 * div(m(j, 'gols') + m(j, 'assistencias'), mxAtk) * 100
           + 0.3 * div(m(j, 'gols'), m(j, 'chutes_no_gol')) * 100
           + 0.2 * div(m(j, 'chutes_no_gol'), m(j, 'chutes')) * 100,
  }[setor];
  return el.map(j => {
    const p90 = Math.max(num(j.media_partidas), 1e-9);
    const pen = 0.5 * (num(j.cartao_amarelo) / p90) + 2.5 * (num(j.cartao_vermelho) / p90);
    return { jogador: j, score: base(j) - pen };
  }).sort((a, b) => b.score - a.score)[0].jogador; // score só serve para ordenar
}

const fat = k => (k <= 1 ? 1 : k * fat(k - 1));
const poisson = (l, k) => (Math.exp(-l) * l ** k) / fat(k);

/** Probabilidades (%) de vitória A / empate / vitória B (Poisson, placares 0..6, normalizado a 100%). */
export function probabilidades(A, B) {
  const atq = t => div(t.gols_marcados, t.total_partidas), def = t => div(t.gols_sofridos, t.total_partidas);
  const lA = (atq(A) + def(B)) / 2, lB = (atq(B) + def(A)) / 2;
  let a = 0, e = 0, b = 0;
  for (let x = 0; x <= 6; x++) for (let y = 0; y <= 6; y++) {
    const p = poisson(lA, x) * poisson(lB, y);
    x > y ? (a += p) : x === y ? (e += p) : (b += p);
  }
  const s = a + e + b;
  const pa = Math.round((a / s) * 1000) / 10, pb = Math.round((b / s) * 1000) / 10;
  return { a: pa, e: Math.round((100 - pa - pb) * 10) / 10, b: pb };
}
