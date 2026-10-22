import { getTimes, getElenco } from './supabaseClient.js';
import { isGoleiro, pos, setoresPt } from './utils.js';

/**
 * Lista de estatísticas exibidas para um jogador do Comparador de Jogadores (mesmos status da página de Estatísticas Individuais).
 * Cada item: {chave, rotulo, valor (número p/ comparação), texto (exibição), menorMelhor (true quando menor é melhor: cartões e gols sofridos)}.
 */
function estatisticasJogador(j) {
  const g = j.goleiro ?? {}, l = j.linha ?? {};
  const d = v => Number(v) || 0, i = v => Math.round(d(v));
  const S = (chave, rotulo, valor, texto = String(valor), menorMelhor = false) => ({ chave, rotulo, valor, texto, menorMelhor });
  const partidas = S('partidas', 'Partidas Jogadas', d(j.media_partidas), d(j.media_partidas).toFixed(1));
  const cartoes = [
    S('amarelos', 'Cartões Amarelos', i(j.cartao_amarelo), undefined, true),
    S('segundos_amarelos', 'Segundos Amarelos', i(j.segundo_cartao_amarelo), undefined, true),
    S('vermelhos', 'Cartões Vermelhos', i(j.cartao_vermelho), undefined, true),
  ];
  if (isGoleiro(j)) return [partidas, S('defesas', 'Defesas Feitas', i(g.defesas)), S('gols_sofridos', 'Gols Sofridos', i(g.gols_sofridos), undefined, true),
    S('pct_defesa', '% de Defesas', d(g.porcentagem_defesa), d(g.porcentagem_defesa).toFixed(1) + '%'),
    S('jogos_sem_sofrer', 'Jogos sem Sofrer Gols', i(g.jogos_sem_sofrer_gols)), ...cartoes];
  return [partidas, S('gols', 'Gols', i(l.gols)), S('assistencias', 'Assistências', i(l.assistencias)), S('chutes', 'Chutes', i(l.chutes)),
    S('chutes_no_gol', 'Chutes no Gol', i(l.chutes_no_gol)), S('desarmes', 'Desarmes', i(l.desarmes)), S('cruzamentos', 'Cruzamentos', i(l.cruzamentos)), ...cartoes];
}

const SETORES = { defesa: 'DF', meio: 'MF', ataque: 'FW' };
const porNome = (a, b) => a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity: 'base' });
const cacheElenco = new Map(); // evita refazer a consulta ao trocar filtros
const elencoDe = t => (cacheElenco.has(t) || cacheElenco.set(t, getElenco(t)), cacheElenco.get(t));
const $ = id => document.getElementById(id);
const selP = $('selPos'), selS = $('selSetor'), lblS = $('lblSetor');
const times = await getTimes();
const lados = {};

/** Posição (e setor, se Linha) são compartilhados: a comparação só ocorre entre jogadores da mesma posição. */
const filtroComumCompleto = () => selP.value && (selP.value !== 'linha' || selS.value);

/** Cada lado tem time + jogador; a lista de jogadores respeita a posição/setor comuns. */
function montaLado(id) {
  const raiz = $(id), q = s => raiz.querySelector(s);
  const selT = q('.selTime'), selJ = q('.selJog'), corpo = q('.corpo');
  const lado = { raiz, jogador: null, lista: [], atualiza };
  times.forEach(t => selT.add(new Option(t.nome, t.nome)));

  async function atualiza() {
    selJ.length = 1; selJ.disabled = true; corpo.innerHTML = ''; lado.jogador = null; lado.lista = [];
    if (selT.value && filtroComumCompleto()) {
      const linha = selP.value === 'linha';
      let l = (await elencoDe(selT.value)).filter(j => isGoleiro(j) === !linha);
      if (linha) l = l.filter(j => pos(j).includes(SETORES[selS.value])); // multi-posição entra em todos os setores dela
      lado.lista = l.sort(porNome);
      lado.lista.forEach(j => selJ.add(new Option(j.nome, j.id)));
      selJ.disabled = false;
    }
    comparar();
  }
  function mostra() {
    const j = lado.jogador = lado.lista.find(x => String(x.id) === selJ.value) ?? null;
    corpo.innerHTML = j ? `<div class="perfil-j"><small>${(isGoleiro(j) ? 'Goleiro' : setoresPt(j)).toUpperCase()}</small><h2>${j.nome}</h2><div>Nacionalidade: ${j.nacionalidade ?? '—'}</div></div>
      <div class="linhas">${estatisticasJogador(j).map(s => `<div><span>${s.rotulo}</span><span class="val" data-k="${s.chave}">${s.texto}</span></div>`).join('')}</div>` : '';
    comparar();
  }
  selT.onchange = atualiza;
  selJ.onchange = mostra;
  return lado;
}
lados.A = montaLado('ladoA');
lados.B = montaLado('ladoB');

// Mudou posição/setor: limpa e recarrega os jogadores dos dois lados.
const aoMudarFiltro = () => { lblS.hidden = selP.value !== 'linha'; lados.A.atualiza(); lados.B.atualiza(); };
selP.onchange = () => { selS.value = ''; aoMudarFiltro(); };
selS.onchange = aoMudarFiltro;

/** Negrito no melhor valor de cada estatística: maior vence; nos cartões, menor vence. Empate = ninguém. */
function comparar() {
  document.querySelectorAll('.val.melhor').forEach(e => e.classList.remove('melhor'));
  const A = lados.A.jogador, B = lados.B.jogador;
  if (!A || !B) return;
  const statsB = new Map(estatisticasJogador(B).map(s => [s.chave, s]));
  for (const a of estatisticasJogador(A)) {
    const b = statsB.get(a.chave);
    if (!b || a.valor === b.valor) continue;
    const venceA = a.menorMelhor ? a.valor < b.valor : a.valor > b.valor;
    lados[venceA ? 'A' : 'B'].raiz.querySelector(`.val[data-k="${a.chave}"]`)?.classList.add('melhor');
  }
}