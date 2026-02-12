import React, { useState, useEffect } from 'react';
import { View, Text, Image, Button, StyleSheet, Platform } from 'react-native';
import DocumentScanner from 'react-native-document-scanner-plugin';

export default function ScannerPro() {
  const [scannedImage, setScannedImage] = useState<string | null>(null);

  const scanDocument = async () => {
    // Inicia o scanner nativo com a interface de recorte
    try {
      const { scannedImages } = await DocumentScanner.scanDocument({
        maxNumDocuments: 1,
        croppedImageQuality: 100,
        letUserAdjustCrop: true //  A mágica: permite ajustar os 4 cantos!
      });
  
      if (scannedImages && scannedImages.length > 0) {
        // Pega a primeira imagem processada
        setScannedImage(scannedImages[0]);
      }
    } catch (error) {
      console.log("Usuário cancelou ou erro no scanner:", error);
    }
  };

  return (
    <View style={styles.container}>
      {scannedImage ? (
        <View style={styles.previewContainer}>
          <Image 
            source={{ uri: scannedImage }} 
            style={styles.image} 
            resizeMode="contain" 
          />
          <View style={styles.buttons}>
            <Button title="Tirar Outra" onPress={scanDocument} />
            <Button title="Usar Essa Foto" onPress={() => alert('Enviando para backend...')} color="green" />
          </View>
        </View>
      ) : (
        <View style={styles.startContainer}>
          <Text style={styles.instruction}>Toque abaixo para digitalizar</Text>
          <Button title="Abrir Scanner" onPress={scanDocument} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f2f2f2', justifyContent: 'center' },
  startContainer: { alignItems: 'center' },
  instruction: { marginBottom: 20, fontSize: 16 },
  previewContainer: { flex: 1, alignItems: 'center', padding: 20, paddingTop: 50 },
  image: { width: '100%', height: '80%', marginBottom: 20, borderRadius: 8, borderWidth: 1, borderColor: '#ddd' },
  buttons: { flexDirection: 'row', gap: 10 }
});