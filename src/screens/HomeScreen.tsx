// src/screens/HomeScreen.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { supabase } from "../../utils/supabase";

export default function HomeScreen() {
  const [servicios, setServicios] = useState<any[]>([]);

  useEffect(() => {
    const fetchServicios = async () => {
      const { data, error } = await supabase.from("SERVICIOS").select("*");
      if (!error && data) {
        setServicios(data);
      }
    };
    fetchServicios();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const moduloEnConstruccion = (nombreModulo: string) => {
    Alert.alert(
      "Fase 2",
      `El módulo de "${nombreModulo}" estará funcional en la próxima entrega.`,
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.saludo}>Bienvenido a</Text>
          <Text style={styles.titulo}>VetCare App</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.botonSalir}>
          <Text style={styles.salir}>Cerrar Sesión</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.menuContainer}>
        <Text style={styles.seccionTitulo}>Módulos Principales</Text>
        <View style={styles.grid}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => moduloEnConstruccion("Mis Mascotas")}
          >
            <Text style={styles.icono}>🐾</Text>
            <Text style={styles.menuTexto}>Mascotas</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => moduloEnConstruccion("Agendar Cita")}
          >
            <Text style={styles.icono}>📅</Text>
            <Text style={styles.menuTexto}>Citas</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => moduloEnConstruccion("Historial Médico")}
          >
            <Text style={styles.icono}>📋</Text>
            <Text style={styles.menuTexto}>Historial</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => moduloEnConstruccion("Mi Perfil")}
          >
            <Text style={styles.icono}>👤</Text>
            <Text style={styles.menuTexto}>Perfil</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
            style={styles.menuItem}
            onPress={() => moduloEnConstruccion("Productos")}
          >
            <Text style={styles.icono}>🛒</Text>
            <Text style={styles.menuTexto}>Productos</Text>
          </TouchableOpacity>
      </View>

      <View style={styles.listaContainer}>
        <Text style={styles.seccionTitulo}>
          Catálogo de Servicios (En vivo)
        </Text>
        <FlatList
          data={servicios}
          keyExtractor={(item) => item.id.toString()}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.nombreServicio}>{item.nombre}</Text>
              <Text style={styles.precio}>${item.precio}</Text>
            </View>
          )}
          ListEmptyComponent={
            <Text style={styles.empty}>Cargando catálogo...</Text>
          }
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F7FA" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E6ED",
    marginTop: 30,
  },
  saludo: { fontSize: 14, color: "#7F8C8D" },
  titulo: { fontSize: 24, fontWeight: "bold", color: "#2C3E50" },
  botonSalir: {
    backgroundColor: "#FDECED",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  salir: { color: "#E74C3C", fontWeight: "bold" },

  menuContainer: { padding: 20 },
  seccionTitulo: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#34495E",
    marginBottom: 15,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  menuItem: {
    backgroundColor: "#FFF",
    width: "48%",
    padding: 20,
    borderRadius: 15,
    alignItems: "center",
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  icono: { fontSize: 32, marginBottom: 10 },
  menuTexto: { fontSize: 14, fontWeight: "600", color: "#2C3E50" },

  listaContainer: { flex: 1, paddingHorizontal: 20, paddingBottom: 20 },
  card: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FFF",
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  nombreServicio: { fontSize: 16, fontWeight: "bold", color: "#34495E" },
  precio: { fontSize: 16, fontWeight: "bold", color: "#27AE60" },
  empty: { textAlign: "center", marginTop: 20, color: "#7F8C8D" },
});
