import io
import nodriver as uc
import pandas as pd


async def fetch_and_parse_tables(page: uc.Tab) -> list[pd.DataFrame]:
    """Extrai o HTML renderizado da página ativa do Nodriver, remove comentários

    HTML para expor tabelas secundárias do FBref e as converte para DataFrames
    via Pandas.
    """
    # Aguarda 6 segundos para contornar Cloudflare e garantir carregamento completo das tabelas
    await page.sleep(6)

    html_content = await page.get_content()
    html_limpo = html_content.replace("<!--", "").replace("-->", "")

    try:
        tables = pd.read_html(io.StringIO(html_limpo))
        return tables
    except Exception as e:
        print(f"[ERRO EXTRACTOR] Falha ao processar tabelas HTML: {e}")
        return []