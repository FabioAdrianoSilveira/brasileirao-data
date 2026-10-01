import asyncio
import pandas as pd
from models.goleiro import Goleiro
from scrapers.extractor import fetch_and_parse_tables
from scrapers.parser import parse_jogadores_times, parse_times


class TaskConsumer:
    def __init__(self, queue: asyncio.Queue, db, browser):
        self.queue = queue
        self.db = db
        self.browser = browser

    async def start(self):
        while True:
            task = await self.queue.get()
            if task is None:
                self.queue.task_done()
                break

            try:
                await self.process_task(task)
            except Exception as e:
                print(f"[ERRO CONSUMER] Falha ao processar {task}: {e}")
            finally:
                self.queue.task_done()

    async def process_task(self, task: dict):
        task_type = task.get("type", "TIME")
        url = task.get("url")

        print(f"\n[CONSUMER] Processando [{task_type}]: {url}")

        page = await self.browser.get(url)
        
        tables = await fetch_and_parse_tables(page)

        if not tables:
            print(f"[ALERTA CONSUMER] Nenhuma tabela extraída da URL: {url}")
            return

        async with self.db.pool.acquire() as conn:
            async with conn.transaction():
                if task_type == "TIME":
                    times = parse_times(tables)
                    print(f"[CONSUMER] Inserindo {len(times)} times no Supabase...")
                    for t in times:
                        await conn.execute(
                            """
                            INSERT INTO time (nome, total_partidas, vitorias, empates, derrotas, gols_marcados, gols_sofridos)
                            VALUES ($1, $2, $3, $4, $5, $6, $7)
                            ON CONFLICT (nome) DO UPDATE SET
                                total_partidas = EXCLUDED.total_partidas,
                                vitorias = EXCLUDED.vitorias,
                                empates = EXCLUDED.empates,
                                derrotas = EXCLUDED.derrotas,
                                gols_marcados = EXCLUDED.gols_marcados,
                                gols_sofridos = EXCLUDED.gols_sofridos
                            """,
                            t.nome, t.totalPartidas, t.vitorias, t.empates, t.derrotas, t.golsMarcados, t.golsSofridos,
                        )

                elif task_type == "JOGADOR":
                    time_nome = task.get("time_nome")
                    jogadores = parse_jogadores_times(tables, time_nome)

                    if not jogadores:
                        print(f"[ALERTA CONSUMER] Nenhum jogador extraído para {time_nome}")
                        return

                    await conn.execute(
                        """
                        INSERT INTO time (nome, total_partidas, vitorias, empates, derrotas, gols_marcados, gols_sofridos)
                        VALUES ($1, 0, 0, 0, 0, 0, 0)
                        ON CONFLICT (nome) DO NOTHING;
                        """,
                        time_nome,
                    )

                    print(f"[CONSUMER] Inserindo {len(jogadores)} jogadores para {time_nome}...")
                    for j in jogadores:
                        tipo_jogador = "GOLEIRO" if isinstance(j, Goleiro) else "LINHA"

                        jogador_id = await conn.fetchval(
                            """
                            INSERT INTO jogador (
                                time_nome, nome, nacionalidade, posicao, media_partidas,
                                cartao_amarelo, cartao_vermelho, segundo_cartao_amarelo,
                                faltas_cometidas, faltas_sofridas, tipo_jogador
                            )
                            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                            RETURNING id
                            """,
                            j.time_nome, j.nome, j.nacionalidade, j.posicao, j.mediaPartidas,
                            j.cartaoAmarelo, j.cartaoVermelho, j.segundoCartaoAmarelo,
                            j.faltasCometidas, j.faltasSofridas, tipo_jogador,
                        )

                        if isinstance(j, Goleiro):
                            await conn.execute(
                                """
                                INSERT INTO goleiro (
                                    jogador_id, gols_sofridos, chutes_sofridos, defesas,
                                    porcentagem_defesa, jogos_sem_sofrer_gols, penaltis_disputados,
                                    gols_sofridos_penalti, defesas_penalti, porcentagem_defesa_penalti
                                )
                                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                                """,
                                jogador_id, j.golsSofridos, j.chutesSofridos, j.defesas,
                                j.porcentagemDefesa, j.jogosSemSofrerGols, j.penaltisDisputados,
                                j.golsSofridosPenalti, j.defesasPenalti, j.porcentagemDefesaPenalti,
                            )
                        else:
                            await conn.execute(
                                """
                                INSERT INTO linha (
                                    jogador_id, impedimentos, cruzamentos, interceptacoes, desarmes,
                                    gols, assistencias, chutes, chutes_no_gol, gols_penalti, tentativas_penalti
                                )
                                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                                """,
                                jogador_id, j.impedimentos, j.cruzamentos, j.interceptacoes, j.desarmes,
                                j.gols, j.assistencias, j.chutes, j.chutesNoGol, j.golsPenalti, j.tentativasPenalti,
                            )

        print(f"[CONSUMER SUCESSO] {url} processado e gravado no Supabase.")