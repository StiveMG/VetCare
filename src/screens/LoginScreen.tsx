// src/screens/LoginScreen.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { supabase } from "../../utils/supabase";

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [mostrarPassword, setMostrarPassword] = useState(false); // Nuevo estado

  const traducirError = (mensajeIngles: string) => {
    if (mensajeIngles.includes("Invalid login credentials"))
      return "Correo o contraseña incorrectos.";
    if (mensajeIngles.includes("Email not confirmed"))
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
      email: email,
      password: password,
    });

    if (error) {
      Alert.alert("Error al iniciar sesión", traducirError(error.message));
      setLoading(false);
    } else {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>VetCare</Text>
      <Text style={styles.subtitulo}>Ingreso al sistema</Text>

      <TextInput
        style={styles.input}
        placeholder="Correo electrónico"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <View style={styles.passwordContainer}>
        <TextInput
          style={styles.passwordInput}
          placeholder="Contraseña"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!mostrarPassword} // Aquí se aplica la magia
        />
        <TouchableOpacity onPress={() => setMostrarPassword(!mostrarPassword)}>
          <Text style={styles.textoVer}>
            {mostrarPassword ? "Ocultar" : "Ver"}
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.boton}
        onPress={handleLogin}
        disabled={loading}
      >
        <Text style={styles.textoBoton}>
          {loading ? "Ingresando..." : "Iniciar Sesión"}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.botonSecundario}
        onPress={() => navigation.navigate("Register")}
      >
        <Text style={styles.textoBotonSecundario}>
          ¿No tienes cuenta? Regístrate aquí
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
    backgroundColor: "#F5F7FA",
  },
  titulo: {
    fontSize: 40,
    fontWeight: "bold",
    color: "#2C3E50",
    textAlign: "center",
  },
  subtitulo: {
    fontSize: 16,
    color: "#7F8C8D",
    textAlign: "center",
    marginBottom: 40,
  },
  input: {
    backgroundColor: "#FFF",
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#E0E6ED",
  },
  passwordContainer: {
    flexDirection: "row",
    backgroundColor: "#FFF",
    borderRadius: 10,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#E0E6ED",
    alignItems: "center",
    paddingRight: 15,
  },
  passwordInput: { flex: 1, padding: 15 },
  textoVer: { color: "#3498DB", fontWeight: "bold" },
  boton: {
    backgroundColor: "#3498DB",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  textoBoton: { color: "#FFF", fontSize: 16, fontWeight: "bold" },
  botonSecundario: { marginTop: 15, alignItems: "center", padding: 10 },
  textoBotonSecundario: { color: "#2C3E50", fontSize: 14 },
});
