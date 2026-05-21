import React from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { useUser } from "../../context/UserContext";

// Importamos las tres vistas
import CitasCliente from "./CitasCliente";
import CitasDoctor from "./CitasDoctor";
import CitasAdmin from "./CitasAdmin";

export default function GestorCitasScreen() {
  
  const { role, loading } = useUser();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498DB" />
      </View>
    );
  }

  if (role === "DOCTOR") {
    return <CitasDoctor />;
  }

  if (role === "ADMIN") {
    return <CitasAdmin />;
  }

  return <CitasCliente />;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
  },
});
