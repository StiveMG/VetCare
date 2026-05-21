import React from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import GestorCitasScreen from "./src/screens/citas/GestorCitasScreen";
import GestorProductosScreen from "./src/screens/productos/GestorProductosScreen";
import ProductosClienteScreen from "./src/screens/productos/ProductosClienteScreen";
import LoginScreen from "./src/screens/LoginScreen";
import RegisterScreen from "./src/screens/RegisterScreen";
import HomeScreen from "./src/screens/HomeScreen";
import { UserProvider, useUser } from "./src/context/UserContext";

const Stack = createNativeStackNavigator();

function LoadingScreen() {
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#3498DB" />
      <Text style={styles.loadingText}>Cargando perfil...</Text>
    </View>
  );
}

function RootNavigator() {
  const { session, loading } = useUser();

  if (loading) return <LoadingScreen />;

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!session ? (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="GestorCitas" component={GestorCitasScreen} />
            <Stack.Screen name="GestorProductos" component={GestorProductosScreen} />
            <Stack.Screen name="ProductosCliente" component={ProductosClienteScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <UserProvider>
      <RootNavigator />
    </UserProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8FAFC",
  },
  loadingText: {
    color: "#2C3E50",
    fontSize: 16,
    fontWeight: "700",
    marginTop: 12,
  },
});
