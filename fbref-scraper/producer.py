import asyncio

class TaskProducer:
    """Produtor responsável por injetar tarefas padronizadas na fila em memória."""
    def __init__(self, queue: asyncio.Queue):
        self.queue = queue

    async def produce_team_task(self, url: str):
        await self.queue.put({"type": "TIME", "url": url})

    async def produce_player_tasks(self, player_links: list):
        for link, time_nome in player_links:
            await self.queue.put({
                "type": "JOGADOR",
                "url": link,
                "time_nome": time_nome.strip()
            })