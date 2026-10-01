from dataclasses import dataclass, field
from typing import List

# Notação que cria alguns métodos padrões "por baixo dos panos", nesse contexto é útil pelo método construtor
@dataclass
class Jogador:
    id: int | None
    time_nome: str
    nome: str
    nacionalidade: str
    posicao: List[str] = field(default_factory=list)
    mediaPartidas: float = 0.0
    cartaoAmarelo: int = 0
    cartaoVermelho: int = 0
    segundoCartaoAmarelo: int = 0
    faltasCometidas: int = 0
    faltasSofridas: int = 0