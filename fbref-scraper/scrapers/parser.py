import pandas as pd
from models.goleiro import Goleiro
from models.jogador import Jogador
from models.linha import Linha
from models.time import Time


def safe_int(val, default: int = 0) -> int:
    """Converte valores com segurança para int, tratando NaNs, vazios e hífens do FBref."""
    try:
        if pd.isna(val) or val == "" or val == "-":
            return default
        return int(float(val))
    except (ValueError, TypeError):
        return default


def safe_float(val, default: float = 0.0) -> float:
    """Converte valores com segurança para float, tratando NaNs, vazios e hífens do FBref."""
    try:
        if pd.isna(val) or val == "" or val == "-":
            return default
        return float(val)
    except (ValueError, TypeError):
        return default


def sanitize_and_flatten(df: pd.DataFrame) -> pd.DataFrame:
    """Achata colunas MultiIndex das tabelas extraídas pelo Pandas."""
    df_copy = df.copy()
    if isinstance(df_copy.columns, pd.MultiIndex):
        df_copy.columns = ['_'.join(col).strip() for col in df_copy.columns.values]
    return df_copy


def parse_times(tables: list[pd.DataFrame]) -> list[Time]:
    """Processa a tabela principal de times da Série A."""
    if not tables:
        return []

    df = sanitize_and_flatten(tables[0])
    times = []

    for _, row in df.iterrows():
        nome_time = str(row.iloc[1]).strip()

        if not nome_time or nome_time.lower() in ["squad", "clube", "equipe", "squad total"]:
            continue

        time = Time(
            nome=nome_time,
            totalPartidas=safe_int(row.iloc[2]),
            vitorias=safe_int(row.iloc[3]),
            empates=safe_int(row.iloc[4]),
            derrotas=safe_int(row.iloc[5]),
            golsMarcados=safe_int(row.iloc[6]),
            golsSofridos=safe_int(row.iloc[7]),
        )
        times.append(time)

    return times


def parse_jogadores_times(tables: list[pd.DataFrame], time_nome: str) -> list[Jogador]:
    """Processa as tabelas do clube e retorna a lista de instâncias de Goleiro e Linha."""
    if not tables:
        return []

    flattened_tables = [sanitize_and_flatten(t) for t in tables]

    tab1 = None  # Geral (Gols e Assistências)
    tab3 = None  # Goleiros
    tab4 = None  # Chutes
    tab6 = None  # Disciplina / Extras

    # Busca dinâmica das tabelas por conteúdo de cabeçalho
    for df in flattened_tables:
        cols_str = " ".join([str(c).lower() for c in df.columns])
        
        if "player" in cols_str or "jogador" in cols_str:
            if ("gls" in cols_str or "gols" in cols_str) and tab1 is None:
                tab1 = df.iloc[:-2]
            elif ("ga" in cols_str or "sota" in cols_str or "save%" in cols_str) and tab3 is None:
                tab3 = df.iloc[:-2]
            elif ("sh" in cols_str or "so t" in cols_str or "chutes" in cols_str) and tab4 is None:
                tab4 = df.iloc[:-2]
            elif ("crdy" in cols_str or "fls" in cols_str or "fld" in cols_str) and tab6 is None:
                tab6 = df.iloc[:-2]

    # Fallback se a busca dinâmica não identificar por nome de coluna
    if tab6 is None and len(flattened_tables) >= 6:
        tab1 = flattened_tables[0].iloc[:-2]
        tab3 = flattened_tables[2].iloc[:-2]
        tab4 = flattened_tables[3].iloc[:-2]
        tab6 = flattened_tables[5].iloc[:-2]

    if tab6 is None:
        print(f"[ERRO PARSER] Não foi possível localizar a tabela principal de jogadores para {time_nome}.")
        return []

    jogadores = []

    for _, row in tab6.iterrows():
        nome = str(row.iloc[0]).strip()

        # Descarta linhas vazias, cabeçalhos repetidos e totais
        if not nome or nome.lower() in ["player", "jogador", "squad total", "opponent stats"]:
            continue

        # Nacionalidade: Extrai apenas os 3 últimos caracteres (ex: 'br BRA' -> 'BRA')
        nac_str = str(row.iloc[1]).strip()
        nacionalidade = nac_str[-3:] if len(nac_str) >= 3 else nac_str

        # Posições divididas em array
        pos_raw = str(row.iloc[2]).strip()
        posicoes = [p.strip() for p in pos_raw.split(",") if p.strip() and p.lower() != "nan"]

        # Atributos base extraídos da tabela principal (tab6)
        media_partidas = safe_float(row.iloc[4])
        cartao_amarelo = safe_int(row.iloc[5])
        cartao_vermelho = safe_int(row.iloc[6])
        segundo_amarelo = safe_int(row.iloc[7])
        faltas_cometidas = safe_int(row.iloc[8])
        faltas_sofridas = safe_int(row.iloc[9])

        is_goleiro = "GK" in posicoes

        if is_goleiro and tab3 is not None:
            # Busca do atleta na Tabela 3 com busca flexível de nome (contains)
            row_t3 = tab3[tab3.iloc[:, 0].astype(str).str.contains(nome, regex=False, case=False)]

            gol = Goleiro(
                id=None,
                time_nome=time_nome,
                nome=nome,
                nacionalidade=nacionalidade,
                posicao=posicoes,
                mediaPartidas=media_partidas,
                cartaoAmarelo=cartao_amarelo,
                cartaoVermelho=cartao_vermelho,
                segundoCartaoAmarelo=segundo_amarelo,
                faltasCometidas=faltas_cometidas,
                faltasSofridas=faltas_sofridas,
                golsSofridos=safe_int(row_t3.iloc[0, 8]) if not row_t3.empty and row_t3.shape[1] > 8 else 0,
                chutesSofridos=safe_int(row_t3.iloc[0, 10]) if not row_t3.empty and row_t3.shape[1] > 10 else 0,
                defesas=safe_int(row_t3.iloc[0, 11]) if not row_t3.empty and row_t3.shape[1] > 11 else 0,
                porcentagemDefesa=safe_float(row_t3.iloc[0, 12]) if not row_t3.empty and row_t3.shape[1] > 12 else 0.0,
                jogosSemSofrerGols=safe_int(row_t3.iloc[0, 16]) if not row_t3.empty and row_t3.shape[1] > 16 else 0,
                penaltisDisputados=safe_int(row_t3.iloc[0, 18]) if not row_t3.empty and row_t3.shape[1] > 18 else 0,
                golsSofridosPenalti=safe_int(row_t3.iloc[0, 19]) if not row_t3.empty and row_t3.shape[1] > 19 else 0,
                defesasPenalti=safe_int(row_t3.iloc[0, 20]) if not row_t3.empty and row_t3.shape[1] > 20 else 0,
                porcentagemDefesaPenalti=safe_float(row_t3.iloc[0, 22]) if not row_t3.empty and row_t3.shape[1] > 22 else 0.0,
            )
            jogadores.append(gol)
        else:
            # Busca do atleta nas Tabelas 1 (Geral) e 4 (Chutes) com busca flexível de nome
            row_t1 = tab1[tab1.iloc[:, 0].astype(str).str.contains(nome, regex=False, case=False)] if tab1 is not None else pd.DataFrame()
            row_t4 = tab4[tab4.iloc[:, 0].astype(str).str.contains(nome, regex=False, case=False)] if tab4 is not None else pd.DataFrame()

            lin = Linha(
                id=None,
                time_nome=time_nome,
                nome=nome,
                nacionalidade=nacionalidade,
                posicao=posicoes,
                mediaPartidas=media_partidas,
                cartaoAmarelo=cartao_amarelo,
                cartaoVermelho=cartao_vermelho,
                segundoCartaoAmarelo=segundo_amarelo,
                faltasCometidas=faltas_cometidas,
                faltasSofridas=faltas_sofridas,
                impedimentos=safe_int(row.iloc[10]),
                cruzamentos=safe_int(row.iloc[11]),
                interceptacoes=safe_int(row.iloc[12]),
                desarmes=safe_int(row.iloc[13]),
                gols=safe_int(row_t1.iloc[0, 8]) if not row_t1.empty and row_t1.shape[1] > 8 else 0,
                assistencias=safe_int(row_t1.iloc[0, 9]) if not row_t1.empty and row_t1.shape[1] > 9 else 0,
                chutes=safe_int(row_t4.iloc[0, 6]) if not row_t4.empty and row_t4.shape[1] > 6 else 0,
                chutesNoGol=safe_int(row_t4.iloc[0, 7]) if not row_t4.empty and row_t4.shape[1] > 7 else 0,
                golsPenalti=safe_int(row_t4.iloc[0, 13]) if not row_t4.empty and row_t4.shape[1] > 13 else 0,
                tentativasPenalti=safe_int(row_t4.iloc[0, 14]) if not row_t4.empty and row_t4.shape[1] > 14 else 0,
            )
            jogadores.append(lin)

    print(f"[PARSER SUCESSO] {len(jogadores)} jogadores processados para {time_nome}")
    return jogadores