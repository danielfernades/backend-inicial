# Motor de Renderização Profissional (Backend)

Este diretório contém a arquitetura completa do backend em Python solicitada para processamento de vídeo profissional.

## Stack Utilizada
- **Python 3.11 + FastAPI**
- **FFmpeg** (Processamento de vídeo e áudio)
- **faster-whisper** (Transcrição e alinhamento)
- **Celery + Redis** (Fila de processamento)
- **PyDub** (Análise de waveform)

## Arquivos
- `processor.py`: Contém a classe `VideoProcessor` com todos os estágios de renderização (Decode, Transcrição, Suavização de Cortes, Finishing e Exportação).
- `api.py`: Endpoints FastAPI (`POST /jobs` e `WS /jobs/{id}/progress`).
- `requirements.txt`: Dependências do projeto.

## Como Executar em Produção
1. Instale as dependências do sistema: `ffmpeg`, `redis-server`.
2. Instale as dependências do Python: `pip install -r requirements.txt`
3. Inicie o Redis: `redis-server`
4. Inicie o Celery: `celery -A worker worker --loglevel=info`
5. Inicie a API: `uvicorn api:app --reload`

*Nota: O ambiente de preview web atual roda em Node.js e não suporta a execução direta deste backend Python pesado. Você deve exportar o projeto e rodar este backend na sua própria infraestrutura (AWS, GCP, etc).*
