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


## 🗺️ Roadmap e Arquitetura do Projeto

Abaixo está o fluxograma detalhado do ecossistema SAECTA, separando o que já foi construído da nossa esteira de próximos passos:

```mermaid
graph TD
    %% --- FASE 1: FUNDAÇÃO E AMBIENTE (CONCLUÍDO) ---
    subgraph FASE 1: Fundação & Ambiente Linux
        A1(✅ Setup do Ambiente Linux/Docker) --> A2(✅ Estrutura do Monorepo Criada)
        A2 --> A3(✅ Git Flow Definido)
        A3 --> A4(✅ Protótipo Mobile - scanner.tsx)
        A3 --> A5(✅ Protótipo Backend - main.py OMR Básico)
    end

    %% --- FASE 2: PERSISTÊNCIA E DADOS (IMEDIATO) ---
    subgraph FASE 2: O Alicerce de Dados
        A5 --> B1(🔄 Configurar Docker Compose para MongoDB)
        B1 --> B2(🔄 Instalar Motor/Beanie no FastAPI - Driver Async)
        B2 --> B3(🔄 Criar Script de Teste de Conexão Python -> Mongo)
        B3 --> B5(Marco: Backend Conectado ao Banco)
    end

    %% --- FASE 3: MÓDULO DE GESTÃO CRUD (CURTO PRAZO) ---
    subgraph FASE 3: Núcleo de Gestão Acadêmica
        B5 --> C1(⬜ Definir Modelos Pydantic - Users, Students, Subjects)
        C1 --> C2(⬜ Criar Roteadores FastAPI - APIRouter)
        C2 --> C3(⬜ Implementar Endpoints CRUD Básicos)
        C3 --> C5(Marco: API de Gestão Operacional)
    end

    %% --- FASE 4: MOTOR DE PROCESSAMENTO HÍBRIDO (MÉDIO PRAZO) ---
    subgraph FASE 4: Motores de Geração e Visão
        C5 --> D1_Draft
        subgraph Geração
            D1_Draft(🧠 Criar Gerador de PDF Dinâmico)
            D1_Draft --> D2_Draft(🧠 Implementar Geração de QR Code Único)
            D2_Draft --> D3_Draft(🧠 Definir Layout Híbrido - Bolinhas + Caixa Discursiva)
        end
        
        D3_Draft --> D4_Vision
        subgraph Visão Computacional Híbrida
            D4_Vision(🧠 Refinar OpenCV - Detecção Robusta de QR Code)
            D4_Vision --> D5_Vision(🧠 Pipeline de Recorte OMR/OCR)
            D5_Vision --> D6A_OMR(🧠 Leitura OMR - Mapear Bolinhas)
            D5_Vision --> D6B_OCR(🧠 Integração Tesseract OCR no Docker)
        end
    end

    %% --- FASE 5: INTELIGÊNCIA ARTIFICIAL (LONGO PRAZO) ---
    subgraph FASE 5: Camada de IA
        D6B_OCR --> E1(🧠 Setup de LLM Local - Ollama/Llama no Docker)
        E1 --> E2(🧠 Criar Prompt de Correção Semântica - Texto + Rubrica)
        D6A_OMR & E2 --> E3(🧠 Consolidador de Notas - Híbrido)
    end

    %% --- FASE 6: INTEGRAÇÃO FINAL (ENTREGA) ---
    subgraph FASE 6: Integração Mobile & Deploy
        E3 --> F1(⬜ Mobile: Finalizar Captura de Foto em Alta Resolução)
        F1 --> F2(⬜ Backend: Endpoint Final /upload)
        F2 --> F3(⬜ Teste Ponta a Ponta)
    end
    
    F3 --> G(🚀 SAECTA V1.0 EM PRODUÇÃO)'''
