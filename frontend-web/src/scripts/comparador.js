import { getTimes, getTime, getElenco } from './supabaseClient.js';
import { melhorDoSetor, probabilidades } from './utils.js';

const $ = id => document.getElementById(id);
const SETORES = [['Goleiro', 'GK'], ['Defensor', 'DF'], ['Meio-Campo', 'MF'], ['Atacante', 'FW']];
const dados = {};

const times = await getTimes();
for (const id of ['selA', 'selB']) times.forEach(t => $(id).add(new Option(t.nome, t.nome)));

async function lado(sel, box, key) {
  const nome = $(sel).value;
  if (!nome) { dados[key] = null; box.innerHTML = ''; return; }
  const [t, elenco] = await Promise.all([getTime(nome), getElenco(nome)]);
  dados[key] = t;
  const L = [['Total de Partidas Jogadas', t.total_partidas, 'total_partidas'], ['Vitórias', t.vitorias, 'vitorias'], ['Empates', t.empates, 'empates'],
    ['Derrotas', t.derrotas, 'derrotas'], ['Total de Gols Marcados', t.gols_marcados, 'gols_marcados'], ['Total de Gols Sofridos', t.gols_sofridos, 'gols_sofridos']];
  const linhas = SETORES.map(([rot, s]) => {
    const r = melhorDoSetor(elenco, s, t.total_partidas);
    return `<tr><td>${rot}</td><td>${r ? r.nome : '—'}</td></tr>`;
  }).join('');
  box.innerHTML = `<h2>${t.nome}</h2><div class="linhas">${L.map(([r, v, k]) => `<div><span>${r}</span><span class="val" data-k="${k}">${v}</span></div>`).join('')}</div>
    <table><tr><th>Setor</th><th>Destaque</th></tr>${linhas}</table>`;
}

// Critério de "melhor" por estatística: 'max' = maior valor vence, 'min' = menor valor vence.
const CRITERIOS = { vitorias: 'max', derrotas: 'min', gols_marcados: 'max', gols_sofridos: 'min' };

/** Destaca em negrito o melhor valor de cada critério. Em caso de empate, ninguém é destacado. */
function destacar() {
  document.querySelectorAll('.val.melhor').forEach(e => e.classList.remove('melhor'));
  if (!(dados.A && dados.B)) return;
  for (const [k, tipo] of Object.entries(CRITERIOS)) {
    const a = dados.A[k], b = dados.B[k];
    if (a === b) continue;
    const venceA = tipo === 'max' ? a > b : a < b;
    document.querySelector(`#${venceA ? 'ladoA' : 'ladoB'} .val[data-k="${k}"]`)?.classList.add('melhor');
  }
}

function chances() {
  destacar();
  const { A, B } = dados, box = $('chances');
  box.hidden = !(A && B);
  if (!(A && B)) return;
  const p = probabilidades(A, B);
  $('pA').textContent = p.a + '%'; $('pE').textContent = p.e + '%'; $('pB').textContent = p.b + '%';
  $('nA').textContent = 'Vitória ' + A.nome; $('nB').textContent = 'Vitória ' + B.nome;
  $('bA').style.width = p.a + '%'; $('bE').style.width = p.e + '%'; $('bB').style.width = p.b + '%';
}
$('selA').onchange = async () => { await lado('selA', document.querySelector('#ladoA .corpo'), 'A'); chances(); };
$('selB').onchange = async () => { await lado('selB', document.querySelector('#ladoB .corpo'), 'B'); chances(); };