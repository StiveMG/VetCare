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
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { supabase } from "../../utils/supabase";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

export default function HomeScreen() {
  const [servicios, setServicios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const categorias = [
    "🐶 Perros",
    "🐱 Gatos",
    "🦜 Aves",
    "🐢 Exóticos",
    "🐰 Roedores",
  ];

  useEffect(() => {
    const fetchServicios = async () => {
      const { data, error } = await supabase.from("SERVICIOS").select("*");
      if (!error && data) setServicios(data);
      setLoading(false);
    };
    fetchServicios();
  }, []);

  const moduloEnConstruccion = (nombre: string) =>
    Alert.alert("Fase 2", `El módulo "${nombre}" estará listo pronto.`);

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={["#3498DB", "#2C3E50"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.perfilInfo}>
          <View style={styles.avatarPlaceholder}>
            <Ionicons name="person" size={24} color="#3498DB" />
          </View>
          <View>
            <Text style={styles.saludo}>Hola, Bienvenido a</Text>
            <Text style={styles.titulo}>VetCare</Text>
          </View>
        </View>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => supabase.auth.signOut()}
          style={styles.botonSalir}
        >
          <Ionicons name="log-out-outline" size={24} color="#FFF" />
        </TouchableOpacity>
      </LinearGradient>

      <View style={styles.categoriasContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {categorias.map((categoria, index) => (
            <TouchableOpacity
              key={index}
              style={styles.categoriaPill}
              activeOpacity={0.7}
            >
              <Text style={styles.categoriaTexto}>{categoria}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.menuContainer}>
        <Text style={styles.seccionTitulo}>Panel Rápido</Text>
        <View style={styles.grid}>
          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.menuItem}
            onPress={() => moduloEnConstruccion("Mis Mascotas")}
          >
            <View style={[styles.iconBox, { backgroundColor: "#E1F0FA" }]}>
              <MaterialCommunityIcons name="dog" size={32} color="#3498DB" />
            </View>
            <Text style={styles.menuTexto}>Mascotas</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.menuItem}
            onPress={() => moduloEnConstruccion("Citas")}
          >
            <View style={[styles.iconBox, { backgroundColor: "#E8F6EF" }]}>
              <MaterialCommunityIcons
                name="calendar-heart"
                size={32}
                color="#27AE60"
              />

              <View style={styles.badge}>
                <Text style={styles.badgeText}>2</Text>
              </View>
            </View>
            <Text style={styles.menuTexto}>Citas</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.menuItem}
            onPress={() => moduloEnConstruccion("Historial")}
          >
            <View style={[styles.iconBox, { backgroundColor: "#FEF0F0" }]}>
              <MaterialCommunityIcons
                name="clipboard-text-outline"
                size={32}
                color="#E74C3C"
              />
            </View>
            <Text style={styles.menuTexto}>Historial</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.menuItem}
            onPress={() => moduloEnConstruccion("Perfil")}
          >
            <View style={[styles.iconBox, { backgroundColor: "#F3F0FF" }]}>
              <MaterialCommunityIcons
                name="account-cog-outline"
                size={32}
                color="#9B59B6"
              />
            </View>
            <Text style={styles.menuTexto}>Perfil</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.listaContainer}>
        <Text style={styles.seccionTitulo}>Servicios de la Clínica</Text>
        {loading ? (
          <ActivityIndicator
            size="large"
            color="#3498DB"
            style={{ marginTop: 20 }}
          />
        ) : (
          <FlatList
            data={servicios}
            keyExtractor={(item) => item.id.toString()}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <TouchableOpacity activeOpacity={0.8} style={styles.card}>
                <View style={styles.cardInfo}>
                  <View style={styles.cardIconoBg}>
                    <MaterialCommunityIcons
                      name="stethoscope"
                      size={24}
                      color="#3498DB"
                    />
                  </View>
                  <View>
                    <Text style={styles.nombreServicio}>{item.nombre}</Text>
                    <Text style={styles.descripcionServicio}>
                      Duración: {item.duracion_minutos || 30} min
                    </Text>
                  </View>
                </View>
                <View style={styles.precioTag}>
                  <Text style={styles.precio}>${item.precio}</Text>
                </View>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <Text style={styles.empty}>No hay servicios disponibles.</Text>
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 25,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
  },
  perfilInfo: { flexDirection: "row", alignItems: "center" },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#FFF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  saludo: {
    fontSize: 13,
    color: "#E1F0FA",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  titulo: { fontSize: 24, fontWeight: "bold", color: "#FFF" },
  botonSalir: {
    padding: 10,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 12,
  },

  // Categorías Horizontales
  categoriasContainer: { marginTop: 15, paddingLeft: 20 },
  categoriaPill: {
    backgroundColor: "#FFF",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  categoriaTexto: { fontSize: 14, fontWeight: "bold", color: "#2C3E50" },

  // Menú Dashboard
  menuContainer: { paddingHorizontal: 20, paddingTop: 20 },
  seccionTitulo: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2C3E50",
    marginBottom: 12,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  menuItem: {
    backgroundColor: "#FFFFFF",
    width: "47%",
    paddingVertical: 20,
    borderRadius: 16,
    alignItems: "center",
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  iconBox: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  menuTexto: { fontSize: 15, fontWeight: "bold", color: "#34495E" },

  // Estilo del Badge (El puntito rojo de notificaciones)
  badge: {
    position: "absolute",
    top: -5,
    right: -5,
    backgroundColor: "#E74C3C",
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFF",
  },
  badgeText: { color: "#FFF", fontSize: 10, fontWeight: "bold" },

  // Lista de Servicios
  listaContainer: { flex: 1, paddingHorizontal: 20, paddingTop: 5 },
  card: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 12,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardInfo: { flexDirection: "row", alignItems: "center", flex: 1 },
  cardIconoBg: {
    backgroundColor: "#F8FAFC",
    padding: 10,
    borderRadius: 12,
    marginRight: 12,
  },
  nombreServicio: { fontSize: 16, fontWeight: "bold", color: "#2C3E50" },
  descripcionServicio: { fontSize: 13, color: "#7F8C8D", marginTop: 2 },
  precioTag: {
    backgroundColor: "#E8F6EF",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  precio: { fontSize: 15, fontWeight: "bold", color: "#27AE60" },
  empty: {
    textAlign: "center",
    marginTop: 20,
    color: "#7F8C8D",
    fontStyle: "italic",
  },
});
