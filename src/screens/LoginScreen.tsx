// src/screens/LoginScreen.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { supabase } from "../../utils/supabase";
import { Ionicons } from "@expo/vector-icons";

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [mostrarPassword, setMostrarPassword] = useState(false);

  const traducirError = (mensaje: string) => {
    if (mensaje.includes("Invalid login credentials"))
      return "Correo o contraseña incorrectos.";
    if (mensaje.includes("Email not confirmed"))
      return "Debes confirmar tu correo.";
    return "Ocurrió un error inesperado. Intenta de nuevo.";
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Aviso", "Por favor, ingresa tu correo y contraseña.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) Alert.alert("Error", traducirError(error.message));
    setLoading(false);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <View style={styles.headerContainer}>
        <Ionicons name="paw" size={80} color="#3498DB" />
        <Text style={styles.titulo}>VetCare</Text>
        <Text style={styles.subtitulo}>Cuidando a tus mejores amigos</Text>
      </View>

      <View style={styles.formContainer}>
        <View style={styles.inputWrapper}>
          <Ionicons
            name="mail-outline"
            size={20}
            color="#7F8C8D"
            style={styles.icon}
          />
          <TextInput
            style={styles.input}
            placeholder="Correo electrónico"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholderTextColor="#BDC3C7"
          />
        </View>

        <View style={styles.inputWrapper}>
          <Ionicons
            name="lock-closed-outline"
            size={20}
            color="#7F8C8D"
            style={styles.icon}
          />
          <TextInput
            style={styles.input}
            placeholder="Contraseña"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!mostrarPassword}
            placeholderTextColor="#BDC3C7"
          />
          <TouchableOpacity
            onPress={() => setMostrarPassword(!mostrarPassword)}
          >
            <Ionicons
              name={mostrarPassword ? "eye-off-outline" : "eye-outline"}
              size={24}
              color="#3498DB"
            />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.boton}
          onPress={handleLogin}
          disabled={loading}
        >
          <Text style={styles.textoBoton}>
            {loading ? "Verificando..." : "Iniciar Sesión"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.botonSecundario}
          onPress={() => navigation.navigate("Register")}
        >
          <Text style={styles.textoBotonSecundario}>
            ¿Eres nuevo?{" "}
            <Text style={styles.textoResaltado}>Regístrate aquí</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC", justifyContent: "center" },
  headerContainer: { alignItems: "center", marginBottom: 40 },
  titulo: {
    fontSize: 42,
    fontWeight: "900",
    color: "#2C3E50",
    marginTop: 10,
    letterSpacing: 1,
  },
  subtitulo: { fontSize: 16, color: "#7F8C8D", marginTop: 5 },
  formContainer: { paddingHorizontal: 30 },

  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    // Sombras sutiles
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  icon: { marginRight: 10 },
  input: { flex: 1, paddingVertical: 15, fontSize: 16, color: "#2C3E50" },

  boton: {
    backgroundColor: "#3498DB",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
    shadowColor: "#3498DB",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 4,
  },
  textoBoton: { color: "#FFF", fontSize: 18, fontWeight: "bold" },
  botonSecundario: { marginTop: 25, alignItems: "center" },
  textoBotonSecundario: { color: "#7F8C8D", fontSize: 15 },
  textoResaltado: { color: "#3498DB", fontWeight: "bold" },
});
