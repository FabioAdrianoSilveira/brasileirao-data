import os
import asyncpg
from dotenv import load_dotenv

load_dotenv()

CREATE_TABLES_SQL = """
CREATE TABLE IF NOT EXISTS time (
    nome VARCHAR(100) PRIMARY KEY,
    total_partidas INT NOT NULL,
    vitorias INT NOT NULL,
    empates INT NOT NULL,
    derrotas INT NOT NULL,
    gols_marcados INT NOT NULL,
    gols_sofridos INT NOT NULL
);

CREATE TABLE IF NOT EXISTS jogador (
    id SERIAL PRIMARY KEY,
    time_nome VARCHAR(100) REFERENCES time(nome) ON DELETE CASCADE,
    nome VARCHAR(150) NOT NULL,
    nacionalidade VARCHAR(3) NOT NULL,
    posicao TEXT[] NOT NULL,
    media_partidas DOUBLE PRECISION NOT NULL,
    cartao_amarelo INT NOT NULL,
    cartao_vermelho INT NOT NULL,
    segundo_cartao_amarelo INT NOT NULL,
    faltas_cometidas INT NOT NULL,
    faltas_sofridas INT NOT NULL,
    tipo_jogador VARCHAR(10) NOT NULL
);

CREATE TABLE IF NOT EXISTS goleiro (
    jogador_id INT PRIMARY KEY REFERENCES jogador(id) ON DELETE CASCADE,
    gols_sofridos INT,
    chutes_sofridos INT,
    defesas INT,
    porcentagem_defesa DOUBLE PRECISION,
    jogos_sem_sofrer_gols INT,
    penaltis_disputados INT,
    gols_sofridos_penalti INT,
    defesas_penalti INT,
    porcentagem_defesa_penalti DOUBLE PRECISION
);

CREATE TABLE IF NOT EXISTS linha (
    jogador_id INT PRIMARY KEY REFERENCES jogador(id) ON DELETE CASCADE,
    impedimentos INT,
    cruzamentos INT,
    interceptacoes INT,
    desarmes INT,
    gols INT,
    assistencias INT,
    chutes INT,
    chutes_no_gol INT,
    gols_penalti INT,
    tentativas_penalti INT
);
"""

class Database:
    def __init__(self, db_url: str | None = None):
        if db_url is None:
            user = os.getenv("DB_USER", "postgres")
            password = os.getenv("DB_PASSWORD", "postgres")
            host = os.getenv("DB_HOST", "localhost")
            port = os.getenv("DB_PORT", "5432")
            name = os.getenv("DB_NAME", "postgres")
            self.db_url = f"postgresql://{user}:{password}@{host}:{port}/{name}"
        else:
            self.db_url = db_url

        self.pool = None

    async def connect(self):
        self.pool = await asyncpg.create_pool(
            self.db_url,
            min_size=1,
            max_size=5,
            ssl="require" if "supabase" in self.db_url else None
        )
        async with self.pool.acquire() as conn:
            await conn.execute(CREATE_TABLES_SQL)

    async def close(self):
        if self.pool:
            await self.pool.close()