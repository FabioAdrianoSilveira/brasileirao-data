from dataclasses import dataclass
from models.jogador import Jogador

# Notação que cria alguns métodos padrões "por baixo dos panos", nesse contexto é útil pelo método construtor
@dataclass
# Classe "filha" de Jogador
class Linha(Jogador):
    impedimentos: int = 0
    cruzamentos: int = 0
    interceptacoes: int = 0
    desarmes: int = 0
    gols: int = 0
    assistencias: int = 0
    chutes: int = 0
    chutesNoGol: int = 0
    golsPenalti: int = 0
    tentativasPenalti: int = 0