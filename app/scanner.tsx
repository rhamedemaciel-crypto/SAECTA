import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Button, Alert, Image, Vibration, ScrollView, TouchableOpacity } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import DocumentScanner from 'react-native-document-scanner-plugin';

type Step = 'QR_CODE' | 'SCAN_GABARITO' | 'SCAN_QUESTAO' | 'REVIEW';

export default function ScannerFlow() {
  const [step, setStep] = useState<Step>('QR_CODE');
  const [permission, requestPermission] = useCameraPermissions();
  
  // TRAVA DE SEGURANÇA 🔒
  const [scanned, setScanned] = useState(false);

  // Dados capturados
  const [studentData, setStudentData] = useState<string | null>(null);
  const [gabaritoImg, setGabaritoImg] = useState<string | null>(null);
  
  // MUDANÇA: Agora aceita múltiplas páginas para a questão 📸📸
  const [questaoPages, setQuestaoPages] = useState<string[]>([]);

  useEffect(() => {
    if (!permission?.granted) requestPermission();
  }, []);

  // --- LÓGICA 1: QR CODE ---
  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (scanned) return; 
    setScanned(true);
    Vibration.vibrate();
    setStudentData(data);

    Alert.alert(
      "Aluno Identificado!", 
      `Dados: ${data}`, 
      [
        { 
          text: "Escanear Provas", 
          onPress: () => setStep('SCAN_GABARITO') 
        },
        {
          text: "Tentar Novamente",
          onPress: () => {
            setScanned(false);
            setStudentData(null);
          },
          style: "cancel"
        }
      ]
    );
  };

  // --- LÓGICA 2: SCANNER DE DOCUMENTO ---
  const scanDocument = async (target: 'gabarito' | 'questao') => {
    try {
      // Configuração do Scanner
      const { scannedImages } = await DocumentScanner.scanDocument({
        maxNumDocuments: 1, // Escaneia 1 folha por vez
        croppedImageQuality: 100 // Qualidade máxima
      });

      if (scannedImages && scannedImages.length > 0) {
        if (target === 'gabarito') {
          setGabaritoImg(scannedImages[0]);
          setStep('SCAN_QUESTAO'); 
        } else {
          // LÓGICA DE LISTA: Adiciona a nova página na lista de questões
          setQuestaoPages(prev => [...prev, scannedImages[0]]);
        }
      }
    } catch (e) {
      console.log("Scanner cancelado", e);
    }
  };

  const resetFlow = () => {
    setStep('QR_CODE');
    setScanned(false);
    setStudentData(null);
    setGabaritoImg(null);
    setQuestaoPages([]); // Limpa a lista
  };

  if (!permission) return <View />;
  if (!permission.granted) return (
    <View style={styles.centerParams}>
      <Text>Precisamos da permissão da câmera</Text>
      <Button title="Conceder Permissão" onPress={requestPermission} />
    </View>
  );

  return (
    <View style={styles.container}>
      
      {/* ETAPA 1: QR CODE */}
      {step === 'QR_CODE' && (
        <View style={styles.fullScreen}>
          <CameraView
            style={styles.camera}
            onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
            barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
          >
            <View style={styles.overlay}>
              <Text style={styles.headerText}>1. Escaneie o QR Code do Aluno</Text>
              <View style={styles.scanFrame} />
            </View>
          </CameraView>
        </View>
      )}

      {/* ETAPA 2: GABARITO */}
      {step === 'SCAN_GABARITO' && (
        <View style={styles.centerParams}>
          <Text style={styles.title}>2. Foto do Gabarito</Text>
          <Text style={styles.studentLabel}>Aluno: {studentData}</Text>
          
          <TouchableOpacity style={styles.btnBig} onPress={() => scanDocument('gabarito')}>
            <Text style={styles.btnText}>📸 Escanear Gabarito</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ETAPA 3: QUESTÃO (Múltiplas Páginas) */}
      {step === 'SCAN_QUESTAO' && (
        <View style={styles.centerParams}>
          <Text style={styles.title}>3. Foto da Questão</Text>
          <Text style={styles.statusLabel}>Gabarito Salvo ✅</Text>
          
          {/* Visualizador de páginas capturadas */}
          <View style={styles.pagesContainer}>
            <Text style={styles.counterText}>Páginas da questão: {questaoPages.length}</Text>
            <ScrollView horizontal style={styles.scrollPreview}>
               {questaoPages.length === 0 && (
                 <View style={styles.placeholder}>
                    <Text style={{color: '#aaa', textAlign: 'center'}}>Nenhuma página ainda</Text>
                 </View>
               )}
               {questaoPages.map((img, index) => (
                 <Image key={index} source={{ uri: img }} style={styles.smallThumb} />
               ))}
            </ScrollView>
          </View>

          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.btnBig} onPress={() => scanDocument('questao')}>
              <Text style={styles.btnText}>📸 Adicionar Página</Text>
            </TouchableOpacity>

            {/* Só mostra finalizar se tiver pelo menos 1 página */}
            {questaoPages.length > 0 && (
              <TouchableOpacity style={styles.btnFinish} onPress={() => setStep('REVIEW')}>
                <Text style={styles.btnText}>✅ Finalizar Questão</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {/* ETAPA 4: REVISÃO E ENVIO */}
      {step === 'REVIEW' && (
        <ScrollView contentContainerStyle={styles.reviewContainer}>
          <Text style={styles.title}>Conferência</Text>
          
          <Text style={styles.label}>Aluno:</Text>
          <Text style={styles.data}>{studentData}</Text>

          <Text style={styles.sectionHeader}>Gabarito:</Text>
          <Image source={{ uri: gabaritoImg! }} style={styles.largeThumb} />

          <Text style={styles.sectionHeader}>Questão ({questaoPages.length} págs):</Text>
          <ScrollView horizontal>
            {questaoPages.map((img, index) => (
              <View key={index} style={{marginRight: 10, alignItems: 'center'}}>
                 <Text style={{marginBottom: 5, fontWeight: 'bold'}}>Pág {index + 1}</Text>
                 <Image source={{ uri: img }} style={styles.mediumThumb} />
              </View>
            ))}
          </ScrollView>

          <View style={styles.footerButtons}>
            <Button title="✅ Enviar Avaliação" onPress={() => {
                Alert.alert("Sucesso", "Dados enviados para o servidor!");
                resetFlow();
            }} />
            <View style={{marginTop: 10}}>
              <Button title="Cancelar" color="red" onPress={resetFlow} />
            </View>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  fullScreen: { flex: 1 },
  camera: { flex: 1 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  headerText: { color: '#fff', fontSize: 20, fontWeight: 'bold', marginBottom: 50, marginTop: -50 },
  scanFrame: { width: 250, height: 250, borderWidth: 2, borderColor: '#00ff00', backgroundColor: 'transparent' },
  
  centerParams: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 10, color: '#333' },
  studentLabel: { fontSize: 16, fontWeight: 'bold', color: '#007AFF', marginBottom: 30 },
  statusLabel: { fontSize: 16, color: 'green', marginBottom: 10 },
  
  placeholder: { width: 100, height: 140, backgroundColor: '#e1e1e1', justifyContent: 'center', alignItems: 'center', borderRadius: 5, borderStyle: 'dashed', borderWidth: 1, borderColor: '#999' },
  
  reviewContainer: { padding: 20, paddingBottom: 50, alignItems: 'center' },
  label: { fontSize: 14, color: '#888' },
  data: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  
  sectionHeader: { fontSize: 18, fontWeight: 'bold', marginTop: 20, marginBottom: 10, width: '100%', borderBottomWidth: 1, borderColor: '#ddd' },
  largeThumb: { width: '100%', height: 300, resizeMode: 'contain', backgroundColor: '#ddd', borderRadius: 8 },
  mediumThumb: { width: 150, height: 200, resizeMode: 'contain', backgroundColor: '#fff', borderRadius: 8, borderWidth: 1, borderColor: '#ddd' },
  smallThumb: { width: 80, height: 110, marginRight: 10, borderRadius: 5, borderWidth: 1, borderColor: '#ddd' },
  
  footerButtons: { width: '100%', marginTop: 30 },
  
  // Estilos novos para botões e lista
  pagesContainer: { height: 160, marginBottom: 20, width: '100%', alignItems: 'center' },
  scrollPreview: { flexGrow: 0 },
  counterText: { marginBottom: 5, color: '#666' },
  actionButtons: { width: '100%', gap: 10 },
  btnBig: { backgroundColor: '#007AFF', padding: 15, borderRadius: 10, width: '100%', alignItems: 'center' },
  btnFinish: { backgroundColor: '#34C759', padding: 15, borderRadius: 10, width: '100%', alignItems: 'center' },
  btnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});