import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';

export default function StudentScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [gabaritoImg, setGabaritoImg] = useState<string | null>(null);
  const [discursivaImg, setDiscursivaImg] = useState<string | null>(null);

  const takePhoto = async (type: 'gabarito' | 'discursiva') => {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      if (type === 'gabarito') {
        setGabaritoImg(result.assets[0].uri);
      } else {
        setDiscursivaImg(result.assets[0].uri);
      }
    }
  };

  const handleSave = () => {
    Alert.alert("Sucesso", "Dados salvos localmente!");
    router.push('/');
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Aluno: {id}</Text>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>1. Gabarito</Text>
        {gabaritoImg && <Image source={{ uri: gabaritoImg }} style={styles.preview} />}
        <TouchableOpacity style={styles.cameraButton} onPress={() => takePhoto('gabarito')}>
          <Text style={styles.cameraButtonText}>Fotografar Gabarito</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>2. Discursivas</Text>
        {discursivaImg && <Image source={{ uri: discursivaImg }} style={styles.preview} />}
        <TouchableOpacity style={styles.cameraButton} onPress={() => takePhoto('discursiva')}>
          <Text style={styles.cameraButtonText}>Fotografar Discursivas</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>Finalizar</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 20, backgroundColor: '#fff' },
  header: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  section: { marginBottom: 20, alignItems: 'center' },
  sectionTitle: { fontSize: 18, marginBottom: 10 },
  preview: { width: 200, height: 200, borderRadius: 8, marginBottom: 10, borderWidth: 1, borderColor: '#ddd' },
  cameraButton: { backgroundColor: '#4CAF50', padding: 10, borderRadius: 5, width: '100%', alignItems: 'center' },
  cameraButtonText: { color: '#fff', fontWeight: 'bold' },
  saveButton: { backgroundColor: '#2196F3', padding: 15, borderRadius: 8, marginTop: 20, alignItems: 'center' },
  saveButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});