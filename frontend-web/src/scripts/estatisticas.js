import { getTimes, getElenco } from './supabaseClient.js';
import { isGoleiro, pos, setoresPt } from './utils.js';

const $ = id => document.getElementById(id);
const selT = $('selTime'), selP = $('selPosicao'), selJ = $('selJogador'), out = $('resultado');
let elenco = [];
const f1 = v => Number(v ?? 0).toFixed(1);
const int = v => Math.round(Number(v ?? 0));

const ORDEM_POSICAO = { DF: 0, MF: 1, FW: 2 };
const porNome = (a, b) => a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity: 'base' });
/** Ordem de posição pela 1ª posição do array (DF > MF > FW); desconhecidas vão ao final. */
const rankPosicao = j => ORDEM_POSICAO[pos(j)[0]] ?? 99;

/** Goleiros: A-Z. Linha: agrupados por posição (DF > MF > FW) e, dentro de cada grupo, A-Z. */
const ordenar = (lista, goleiro) =>
  [...lista].sort(goleiro ? porNome : (a, b) => rankPosicao(a) - rankPosicao(b) || porNome(a, b));

(await getTimes()).forEach(t => selT.add(new Option(t.nome, t.nome)));

async function atualizaJogadores() {
  selJ.length = 1; selJ.disabled = true; out.className = 'vazio';
  out.textContent = 'Selecione um time, uma posição e um jogador para exibir as estatísticas.';
  if (!selT.value || !selP.value) return;
  elenco = await getElenco(selT.value);
  const goleiro = selP.value === 'goleiro';
  ordenar(elenco.filter(j => isGoleiro(j) === goleiro), goleiro)
    .forEach(j => selJ.add(new Option(j.nome, j.id)));
  selJ.disabled = false;
}

function mostra() {
  const j = elenco.find(x => String(x.id) === selJ.value);
  if (!j) return;
  const g = j.goleiro ?? {}, l = j.linha ?? {};
  const cartoes = [['Cartões Amarelos', int(j.cartao_amarelo)], ['Segundos Amarelos', int(j.segundo_cartao_amarelo)], ['Cartões Vermelhos', int(j.cartao_vermelho)]];
  const stats = isGoleiro(j)
    ? [['Partidas Jogadas', f1(j.media_partidas)], ['Defesas Feitas', int(g.defesas)], ['Gols Sofridos', int(g.gols_sofridos)],
       ['% de Defesas', f1(g.porcentagem_defesa) + '%'], ['Jogos sem Sofrer Gols', int(g.jogos_sem_sofrer_gols)], ...cartoes]
    : [['Partidas Jogadas', f1(j.media_partidas)], ['Gols', int(l.gols)], ['Assistências', int(l.assistencias)], ['Chutes', int(l.chutes)],
       ['Chutes no Gol', int(l.chutes_no_gol)], ['Desarmes', int(l.desarmes)], ['Cruzamentos', int(l.cruzamentos)], ...cartoes];
  const setor = isGoleiro(j) ? 'Goleiro' : setoresPt(j);
  out.className = '';
  out.innerHTML = `<div class="perfil"><small>${setor.toUpperCase()}</small><h2>${j.nome}</h2><div>Nacionalidade: ${j.nacionalidade ?? '—'}</div></div>
    <h3 class="t">Estatísticas de jogo</h3><div class="grade">${stats.map(([k, v]) => `<div class="stat"><span>${k}</span><strong>${v}</strong></div>`).join('')}</div>`;
}
selT.onchange = selP.onchange = atualizaJogadores;
selJ.onchange = mostra;