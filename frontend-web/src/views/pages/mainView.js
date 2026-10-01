export function renderMainPage() {
  return `
    <nav class="navbar bg-custom-primary mb-4 shadow">
      <div class="container-fluid">
        <span class="navbar-brand mb-0 h1 text-white fw-bold">
          Dashboard Brasileirão Data
        </span>
      </div>
    </nav>

    <div class="container my-4">
      <!-- Filtro de Seleção -->
      <div class="row justify-content-center mb-5">
        <div class="col-md-6">
          <div class="card card-custom p-3 shadow-sm">
            <label for="select-time" class="form-label fw-bold text-custom-primary fs-5">
              Selecione o Time:
            </label>
            <select id="select-time" class="form-select border-custom-primary form-select-lg">
              <option value="" selected disabled>Carregando times...</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Tabela de Goleiros -->
      <div class="row mb-5">
        <div class="col-12">
          <h3 class="text-custom-primary border-bottom border-custom-primary pb-2 fw-bold">
            Goleiros
          </h3>
          <div class="table-responsive shadow-sm rounded">
            <table class="table table-striped table-hover align-middle mb-0" id="tabela-goleiros">
              <thead class="table-custom-header">
                <tr>
                  <th>Nome</th>
                  <th>Nac.</th>
                  <th>Média Partidas</th>
                  <th>Defesas</th>
                  <th>% Defesa</th>
                  <th>Gols Sofridos</th>
                  <th>Jogos sem Sofrer Gols</th>
                  <th>Amarelos</th>
                  <th>Vermelhos</th>
                </tr>
              </thead>
              <tbody>
                <tr><td colspan="9" class="text-center text-muted">Selecione um time para carregar os dados.</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Tabela de Jogadores de Linha -->
      <div class="row mb-5">
        <div class="col-12">
          <h3 class="text-custom-primary border-bottom border-custom-primary pb-2 fw-bold">
            Jogadores de Linha
          </h3>
          <div class="table-responsive shadow-sm rounded">
            <table class="table table-striped table-hover align-middle mb-0" id="tabela-linha">
              <thead class="table-custom-header">
                <tr>
                  <th>Nome</th>
                  <th>Posição</th>
                  <th>Nac.</th>
                  <th>Média Partidas</th>
                  <th>Gols</th>
                  <th>Assistências</th>
                  <th>Chutes</th>
                  <th>Desarmes</th>
                  <th>Cruzamentos</th>
                  <th>Amarelos</th>
                  <th>Vermelhos</th>
                </tr>
              </thead>
              <tbody>
                <tr><td colspan="11" class="text-center text-muted">Selecione um time para carregar os dados.</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `;
}