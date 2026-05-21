import React from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { useUser } from '../../context/UserContext';
import MisMascotasCliente from './MisMascotasCliente';
import MascotasAdmin from './MascotasAdmin';

export default function GestorMascotasScreen() {
  const { role, loading } = useUser();

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#3498DB" />
      </View>
    );
  }

  if (role === 'ADMIN') {
    return <MascotasAdmin />;
  }

  if (role === 'DOCTOR') {
    return (
      <View style={styles.centerContainer}>
        <Text style={{ fontSize: 18, color: '#7F8C8D' }}>Vista de Mascotas para Doctor (Próximamente)</Text>
      </View>
    );
  }

  return <MisMascotasCliente />;
}

const styles = StyleSheet.create({
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F4F7F6' }
});