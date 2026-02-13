import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

// Tela inicial do app, onde o professor pode iniciar o processo de escaneamento do QR code para acessar a tela do aluno.
export default function HomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      <Text style={styles.title}>SAECTA-Professor</Text>
      <Text style={styles.subtitle}>Gestão de Provas</Text>

      <TouchableOpacity 
        style={styles.button} 
        onPress={() => router.push('/scanner')}
      >
        <Text style={styles.buttonText}>📷 Escanear QR Code</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' },
  title: { fontSize: 28, fontWeight: 'bold', color: '#333', marginBottom: 10 },
  subtitle: { fontSize: 18, color: '#666', marginBottom: 50 },
  button: { backgroundColor: '#2196F3', paddingVertical: 15, paddingHorizontal: 30, borderRadius: 10 },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});