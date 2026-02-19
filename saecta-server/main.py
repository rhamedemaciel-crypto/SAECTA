from fastapi import FastAPI, UploadFile, File, Form
from typing import List
import os
import cv2
import numpy as np

app = FastAPI()

# Pasta onde as fotos reais do scanner serão salvas
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# ---------------------------------------------------------
# CÉREBRO DA VISÃO COMPUTACIONAL (OPENCV) - VERSÃO FINAL
# ---------------------------------------------------------
def extrair_dados_gabarito(caminho_imagem):
    print(f"\n🧠 OpenCV: Iniciando a leitura do gabarito {caminho_imagem}...")
    
    img = cv2.imread(caminho_imagem)
    if img is None: return "Erro: Imagem não encontrada."

    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    blur = cv2.GaussianBlur(gray, (5, 5), 0)
    # Filtro adaptativo para achar as âncoras mesmo com luz ruim
    thresh = cv2.adaptiveThreshold(blur, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY_INV, 51, 15)
    
    # RETR_EXTERNAL para pegar apenas os contornos de fora dos quadrados
    contornos, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    quadrados_encontrados = []
    
    for c in contornos:
        perimetro = cv2.arcLength(c, True)
        aproximacao = cv2.approxPolyDP(c, 0.04 * perimetro, True)
        if len(aproximacao) == 4:
            x, y, w, h = cv2.boundingRect(aproximacao)
            proporcao = float(w) / h
            area = cv2.contourArea(c)
            # Filtra âncoras por tamanho e formato quadrado
            if 0.7 <= proporcao <= 1.3 and area > 300:
                quadrados_encontrados.append(c)
                
    quadrados_encontrados = sorted(quadrados_encontrados, key=cv2.contourArea, reverse=True)
    
    if len(quadrados_encontrados) >= 4:
        ancoras_finais = quadrados_encontrados[:4]
        pontos = []
        for c in ancoras_finais:
            M = cv2.moments(c)
            if M['m00'] != 0:
                # Usa o centro de massa da âncora para precisão
                pontos.append([int(M['m10'] / M['m00']), int(M['m01'] / M['m00'])])
                
        if len(pontos) == 4:
            pontos = np.array(pontos, dtype="float32")
            # Ordena os 4 cantos: Topo-Esq, Topo-Dir, Baixo-Dir, Baixo-Esq
            s = pontos.sum(axis=1)
            diff = np.diff(pontos, axis=1)
            pontos_ordenados = np.array([
                pontos[np.argmin(s)], pontos[np.argmin(diff)], 
                pontos[np.argmax(s)], pontos[np.argmax(diff)]
            ], dtype="float32")
            
            # Dimensões finais da imagem achatada (Baseado no A4 do gerador)
            largura, altura = 800, 1130
            destino = np.array([[0, 0], [largura - 1, 0], [largura - 1, altura - 1], [0, altura - 1]], dtype="float32")
            
            # Realiza a transformação de perspectiva (achata a imagem)
            matriz = cv2.getPerspectiveTransform(pontos_ordenados, destino)
            img_achatada = cv2.warpPerspective(img, matriz, (largura, altura))
            
            # =========================================================
            # LEITURA (OMR) - FILTRO DE TINTA E SUPER-VISÃO
            # =========================================================
            gray_alinhado = cv2.cvtColor(img_achatada, cv2.COLOR_BGR2GRAY)
            
            # 1. Filtro Adaptativo (ignora sombras na foto e pega bolinhas apagadas)
            thresh_alinhado = cv2.adaptiveThreshold(gray_alinhado, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY_INV, 51, 15)
            
            # 2. "Engorda" as linhas de impressão fracas para não perder contornos
            kernel = np.ones((3,3), np.uint8)
            thresh_formas = cv2.morphologyEx(thresh_alinhado, cv2.MORPH_CLOSE, kernel)
            thresh_formas = cv2.dilate(thresh_formas, kernel, iterations=1)
            
            img_resultado = img_achatada.copy()
            contornos_bolinhas, _ = cv2.findContours(thresh_formas, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            
            bolinhas_validas = []
            for c in contornos_bolinhas:
                x, y, w, h = cv2.boundingRect(c)
                proporcao = w / float(h)
                area = cv2.contourArea(c)
                
                # 🔥 CORREÇÃO CRÍTICA: Área mínima subiu de 100 para 180 para ignorar pontos finais.
                # Ignora laterais (x<50, x>750) e cabeçalho (y>100)
                if 0.5 <= proporcao <= 1.8 and 180 < area < 1500 and 50 < x < 750 and y > 100:
                    bolinhas_validas.append(c)
            
            print(f"🎯 OpenCV: Encontrei {len(bolinhas_validas)} formas candidatas.")

            if not bolinhas_validas:
                return "Falha: Nenhuma bolinha legível encontrada."

            # =========================================================
            # A MATRIZ DE RESPOSTAS (GEOMETRIA ABSOLUTA)
            # =========================================================
            
            # Agrupamento visual por linha (para desenhar os resultados depois)
            bolinhas_validas = sorted(bolinhas_validas, key=lambda c: cv2.boundingRect(c)[1] + (cv2.boundingRect(c)[3] // 2))
            linhas_de_questoes = []
            linha_atual = []
            y_anterior = -1
            for c in bolinhas_validas:
                x, y, w, h = cv2.boundingRect(c)
                cy = y + (h // 2) 
                if y_anterior == -1:
                    linha_atual.append(c)
                    y_anterior = cy
                elif abs(cy - y_anterior) < 15: linha_atual.append(c)
                else:
                    linhas_de_questoes.append(linha_atual)
                    linha_atual = [c]
                    y_anterior = cy
            if linha_atual: linhas_de_questoes.append(linha_atual)
                
            respostas_aluno = {}
            opcoes_letras = ['A', 'B', 'C', 'D', 'E']
            
            # OS SEGREDOS DO UNIVERSO (Coordenadas calculadas pelo PDF Gerador 800x1130)
            # Se o layout do PDF mudar, estes números precisam ser ajustados.
            colunas_x_teoricas = [150, 210, 270, 330, 390] # X exato de A, B, C, D, E
            y_questao_1 = 137.0                            # Altura exata do centro da Q1
            espaco_y_entre_questoes = 41.2                 # Distância exata entre cada linha
            
            for linha in linhas_de_questoes:
                # Descobre o número da questão PELA ALTURA (Imune a linhas em branco!)
                media_cy = np.mean([cv2.boundingRect(c)[1] + cv2.boundingRect(c)[3]//2 for c in linha])
                num_questao = int(round((media_cy - y_questao_1) / espaco_y_entre_questoes)) + 1
                
                if num_questao < 1: continue # Ignora sujeira no cabeçalho
                    
                marcada = None
                maior_tinta = 0
                contorno_marcado = None
                
                # Analisa as bolinhas que encontrou nesta linha (pode ser 1, pode ser 5)
                for c in linha:
                    x, y, w, h = cv2.boundingRect(c)
                    cx = x + (w // 2)
                    
                    # Usa o threshold LIMPO (sem engordar) para contar a tinta real
                    mask = np.zeros(thresh_alinhado.shape, dtype="uint8")
                    cv2.drawContours(mask, [c], -1, 255, -1)
                    tinta_dentro = cv2.countNonZero(cv2.bitwise_and(thresh_alinhado, thresh_alinhado, mask=mask))
                    area_bolinha = cv2.contourArea(c)
                    
                    # Se tiver mais de 45% de tinta...
                    if tinta_dentro > (area_bolinha * 0.45) and tinta_dentro > maior_tinta:
                        maior_tinta = tinta_dentro
                        contorno_marcado = c
                        
                        # MÁGICA: Descobre a letra pela proximidade da coluna teórica X
                        distancias = [abs(cx - col_x) for col_x in colunas_x_teoricas]
                        marcada = opcoes_letras[distancias.index(min(distancias))]
                
                # Se o aluno marcou de verdade, registra.
                if marcada:
                    respostas_aluno[str(num_questao)] = marcada
                    cv2.drawContours(img_resultado, [contorno_marcado], -1, (0, 255, 0), 4)
                    x, y, w, h = cv2.boundingRect(contorno_marcado)
                    cv2.putText(img_resultado, f"Q{num_questao}:{marcada}", (x - 60, y + 15), 
                                cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 255), 2)
            
            print(f"✅ OpenCV: Respostas extraídas: {respostas_aluno}")
            
            caminho_final = caminho_imagem.replace(".jpg", "_resultado.jpg")
            cv2.imwrite(caminho_final, img_resultado)
            print(f"👁️ Veja as respostas no arquivo: {caminho_final}")
            
            return respostas_aluno
            
    return "Falha ao alinhar. Faltam âncoras."

# ---------------------------------------------------------
# ROTAS DA API
# ---------------------------------------------------------
@app.get("/")
async def root():
    return {"message": "Servidor SAECTA Online"}

@app.post("/api/avaliar")
async def receber_avaliacao(
    aluno_id: str = Form(...),
    gabarito: UploadFile = File(...),
    questoes: List[UploadFile] = File(...)
):
    print(f"\n📥 SAECTA: Recebendo dados do Aluno {aluno_id}")
    
    caminho_gabarito = os.path.join(UPLOAD_DIR, f"{aluno_id}_gabarito.jpg")
    with open(caminho_gabarito, "wb") as f:
        f.write(await gabarito.read())
    print(f"✅ Gabarito salvo: {caminho_gabarito}")
    
    resultado_visao = extrair_dados_gabarito(caminho_gabarito)
        
    for i, file in enumerate(questoes):
        caminho_q = os.path.join(UPLOAD_DIR, f"{aluno_id}_questao_p{i+1}.jpg")
        with open(caminho_q, "wb") as f:
            f.write(await file.read())
        print(f"✅ Página {i+1} salva: {caminho_q}")

    return {
        "status": "sucesso",
        "aluno": aluno_id,
        "arquivos_recebidos": len(questoes) + 1,
        "respostas_gabarito": resultado_visao
    }