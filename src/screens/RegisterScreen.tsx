// src/screens/RegisterScreen.tsx
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

export default function RegisterScreen({ navigation }: any) {
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [mostrarPassword, setMostrarPassword] = useState(false);

  const traducirError = (mensajeIngles: string) => {
    if (mensajeIngles.includes("User already registered"))
      return "Este correo ya está registrado.";
    if (mensajeIngles.includes("Password should be at least"))
      return "La contraseña es muy débil.";
    return "Error al registrar. Verifica tus datos.";
  };

  const handleRegister = async () => {
    if (!nombre || !email || !password) {
      Alert.alert("Aviso", "Por favor, llena todos los campos.");
      return;
    }
    if (password.length < 6) {
      Alert.alert("Aviso", "La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    setLoading(true);

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email,
        password: password,
      });

      if (authError) throw authError;

      // 2. Guarda en tu tabla
      const { error: dbError } = await supabase
        .from("USUARIOS")
        .insert([
          {
            nombre: nombre,
            email: email,
            rol: "CLIENTE",
            password_hash: "Manejado por Auth",
          },
        ]);

      if (dbError) {
        throw new Error(dbError.message);
      }
    } catch (error: any) {
      Alert.alert("Error técnico BD:", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Crear Cuenta</Text>

      <TextInput
        style={styles.input}
        placeholder="Nombre completo"
        value={nombre}
        onChangeText={setNombre}
      />
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
          placeholder="Contraseña (mínimo 6 caracteres)"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!mostrarPassword}
        />
        <TouchableOpacity onPress={() => setMostrarPassword(!mostrarPassword)}>
          <Text style={styles.textoVer}>
            {mostrarPassword ? "Ocultar" : "Ver"}
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.boton}
        onPress={handleRegister}
        disabled={loading}
      >
        <Text style={styles.textoBoton}>
          {loading ? "Registrando..." : "Registrarse"}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.botonSecundario}
        onPress={() => navigation.navigate("Login")}
      >
        <Text style={styles.textoBotonSecundario}>
          ¿Ya tienes cuenta? Inicia sesión
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
    fontSize: 32,
    fontWeight: "bold",
    color: "#2C3E50",
    textAlign: "center",
    marginBottom: 30,
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
  textoVer: { color: "#27AE60", fontWeight: "bold" },
  boton: {
    backgroundColor: "#27AE60",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  textoBoton: { color: "#FFF", fontSize: 16, fontWeight: "bold" },
  botonSecundario: { marginTop: 15, alignItems: "center", padding: 10 },
  textoBotonSecundario: { color: "#3498DB", fontSize: 14, fontWeight: "bold" },
});
