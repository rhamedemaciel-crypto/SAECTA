# SAECTA - Sistema de Correção Automática (OMR)

Este projeto é uma ferramenta de Visão Computacional integrada a um aplicativo mobile para a correção automática de cartões-resposta (Gabaritos).

## 🚀 Tecnologias
* **Backend:** Python 3.12, FastAPI (Uvicorn), OpenCV, NumPy.
* **Mobile:** React Native, Expo, TypeScript.
* **Arquitetura:** Monorepo.

## 🧠 Funcionalidades
- **Leitura Óptica (OMR):** Processamento de imagem para identificar marcações em gabaritos.
- **Scanner Mobile:** Interface para captura de imagem via câmera do celular.
- **Processamento em Tempo Real:** Comunicação via API entre o App e o servidor Python.

## 🛠️ Como rodar o projeto
### Backend
```bash
cd saecta-server
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
