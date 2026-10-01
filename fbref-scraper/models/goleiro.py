from dataclasses import dataclass
from models.jogador import Jogador

# Notação que cria alguns métodos padrões "por baixo dos panos", nesse contexto é útil pelo método construtor
@dataclass
# Classe "filha" de Jogador
class Goleiro(Jogador):
    golsSofridos: int = 0
    chutesSofridos: int = 0
    defesas: int = 0
    porcentagemDefesa: float = 0.0
    jogosSemSofrerGols: int = 0
    penaltisDisputados: int = 0
    golsSofridosPenalti: int = 0
    defesasPenalti: int = 0
    porcentagemDefesaPenalti: float = 0.0