import { TimeController } from '../../controllers/timeController.js';

export class MainScript {
  constructor() {
    this.controller = new TimeController();
  }

  async init() {
    await this.carregarSelectTimes();
    this.configurarEventos();
  }

  async carregarSelectTimes() {
    const select = document.getElementById('select-time');
    const times = await this.controller.obterTodosOsTimes();

    if (!select) return;

    select.innerHTML = '<option value="" selected disabled>Escolha um time...</option>';
    times.forEach(t => {
      const option = document.createElement('option');
      option.value = t.nome;
      option.textContent = t.nome;
      select.appendChild(option);
    });
  }

  configurarEventos() {
    const select = document.getElementById('select-time');
    if (select) {
      select.addEventListener('change', async (e) => {
        const timeNome = e.target.value;
        if (timeNome) {
          await this.carregarTabelas(timeNome);
        }
      });
    }
  }

  async carregarTabelas(timeNome) {
    const [goleiros, jogadoresLinha] = await Promise.all([
      this.controller.obterGoleirosPorTime(timeNome),
      this.controller.obterJogadoresLinhaPorTime(timeNome)
    ]);

    this.renderizarTabelaGoleiros(goleiros);
    this.renderizarTabelaLinha(jogadoresLinha);
  }

  renderizarTabelaGoleiros(goleiros) {
    const tbody = document.querySelector('#tabela-goleiros tbody');
    if (!tbody) return;

    if (goleiros.length === 0) {
      tbody.innerHTML = '<tr><td colspan="9" class="text-center">Nenhum goleiro encontrado.</td></tr>';
      return;
    }

    tbody.innerHTML = goleiros.map(g => `
      <tr>
        <td class="fw-bold">${g.nome}</td>
        <td><span class="badge bg-secondary">${g.nacionalidade}</span></td>
        <td class="fw-bold text-custom-primary">${Number(g.media_partidas).toFixed(2)}</td>
        <td>${g.defesas}</td>
        <td>${Number(g.porcentagem_defesa).toFixed(1)}%</td>
        <td>${g.gols_sofridos}</td>
        <td>${g.jogos_sem_sofrer_gols}</td>
        <td><span class="badge bg-warning text-dark">${g.cartao_amarelo}</span></td>
        <td><span class="badge bg-danger">${g.cartao_vermelho}</span></td>
      </tr>
    `).join('');
  }

  renderizarTabelaLinha(jogadores) {
    const tbody = document.querySelector('#tabela-linha tbody');
    if (!tbody) return;

    if (jogadores.length === 0) {
      tbody.innerHTML = '<tr><td colspan="11" class="text-center">Nenhum jogador de linha encontrado.</td></tr>';
      return;
    }

    tbody.innerHTML = jogadores.map(j => {
      const posicoesBadges = Array.isArray(j.posicao) 
        ? j.posicao.map(p => `<span class="badge bg-light text-dark border me-1">${p}</span>`).join('')
        : `<span class="badge bg-light text-dark border me-1">${j.posicao}</span>`;

      return `
        <tr>
          <td class="fw-bold">${j.nome}</td>
          <td>${posicoesBadges}</td>
          <td><span class="badge bg-secondary">${j.nacionalidade}</span></td>
          <td class="fw-bold text-custom-primary">${Number(j.media_partidas).toFixed(2)}</td>
          <td class="fw-bold text-success">${j.gols}</td>
          <td>${j.assistencias}</td>
          <td>${j.chutes} (${j.chutes_no_gol} no gol)</td>
          <td>${j.desarmes}</td>
          <td>${j.cruzamentos}</td>
          <td><span class="badge bg-warning text-dark">${j.cartao_amarelo}</span></td>
          <td><span class="badge bg-danger">${j.cartao_vermelho}</span></td>
        </tr>
      `;
    }).join('');
  }
}