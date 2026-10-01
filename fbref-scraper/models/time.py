from dataclasses import dataclass

# Notação que cria alguns métodos padrões "por baixo dos panos", nesse contexto é útil pelo método construtor
@dataclass
class Time:
    nome: str
    totalPartidas: int
    vitorias: int
    empates: int
    derrotas: int
    golsMarcados: int
    golsSofridos: int