import React from "react";
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useUser } from "../context/UserContext";

export type DashboardAction = {
  title: string;
  description: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
  color: string;
  backgroundColor: string;
  status?: string;
};

type RoleDashboardProps = {
  roleLabel: string;
  actions: DashboardAction[];
};

export default function RoleDashboard({
  roleLabel,
  actions,
}: RoleDashboardProps) {
  const { usuario, signOut } = useUser();

  const handleAction = (action: DashboardAction) => {
    Alert.alert(
      action.title,
      action.status ?? action.description ?? "Este modulo estara listo pronto.",
    );
  };

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
            <Text style={styles.saludo}>
              Hola, {usuario?.nombre ?? "Bienvenido"}
            </Text>
            <Text style={styles.titulo}>VetCare</Text>
          </View>
        </View>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={signOut}
          style={styles.botonSalir}
        >
          <Ionicons name="log-out-outline" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </LinearGradient>

      <View style={styles.categoriasContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.categoriaPill}>
            <Text style={styles.categoriaTexto}>{roleLabel}</Text>
          </View>
          <View style={styles.categoriaPill}>
            <Text style={styles.categoriaTexto}>VetCare</Text>
          </View>
        </ScrollView>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.menuContainer}>
          <Text style={styles.seccionTitulo}>Panel Rapido</Text>
          <View style={styles.grid}>
            {actions.map((action) => (
              <TouchableOpacity
                key={action.title}
                activeOpacity={0.7}
                style={styles.menuItem}
                onPress={() => handleAction(action)}
              >
                <View
                  style={[
                    styles.iconBox,
                    { backgroundColor: action.backgroundColor },
                  ]}
                >
                  <MaterialCommunityIcons
                    name={action.icon}
                    size={32}
                    color={action.color}
                  />
                </View>
                <Text style={styles.menuTexto}>{action.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
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
  perfilInfo: { flexDirection: "row", alignItems: "center", flex: 1 },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#FFFFFF",
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
  titulo: { fontSize: 24, fontWeight: "bold", color: "#FFFFFF" },
  botonSalir: {
    padding: 10,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 12,
    marginLeft: 12,
  },
  categoriasContainer: { marginTop: 15, paddingLeft: 20 },
  categoriaPill: {
    backgroundColor: "#FFFFFF",
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
  scrollContent: { paddingBottom: 30 },
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
    minHeight: 132,
    paddingVertical: 20,
    paddingHorizontal: 10,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
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
  menuTexto: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#34495E",
    textAlign: "center",
  },
});
