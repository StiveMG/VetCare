// src/screens/RegisterScreen.tsx
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
  ScrollView,
} from "react-native";
import { supabase } from "../../utils/supabase";
import { Ionicons } from "@expo/vector-icons";

export default function RegisterScreen({ navigation }: any) {
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [mostrarPassword, setMostrarPassword] = useState(false);

  const handleRegister = async () => {
    if (!nombre || !email || !password)
      return Alert.alert("Aviso", "Por favor, llena todos los campos.");
    if (password.length < 6)
      return Alert.alert(
        "Aviso",
        "La contraseña debe tener al menos 6 caracteres.",
      );

    setLoading(true);
    try {
      const { error: authError } = await supabase.auth.signUp({
        email,
        password,
      });
      if (authError) throw authError;

      const { error: dbError } = await supabase
        .from("USUARIOS")
        .insert([
          { nombre, email, rol: "CLIENTE", password_hash: "Manejado por Auth" },
        ]);
      if (dbError) throw new Error(dbError.message);
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerContainer}>
          <TouchableOpacity
            style={styles.botonAtras}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={28} color="#2C3E50" />
          </TouchableOpacity>
          <Text style={styles.titulo}>Crear Cuenta</Text>
          <Text style={styles.subtitulo}>
            Únete a nuestra comunidad clínica
          </Text>
        </View>

        <View style={styles.formContainer}>
          <View style={styles.inputWrapper}>
            <Ionicons
              name="person-outline"
              size={20}
              color="#7F8C8D"
              style={styles.icon}
            />
            <TextInput
              style={styles.input}
              placeholder="Nombre completo"
              value={nombre}
              onChangeText={setNombre}
              placeholderTextColor="#BDC3C7"
            />
          </View>

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
              placeholder="Contraseña (mín. 6 caracteres)"
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
                color="#27AE60"
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.boton}
            onPress={handleRegister}
            disabled={loading}
          >
            <Text style={styles.textoBoton}>
              {loading ? "Creando cuenta..." : "Registrarse"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    paddingVertical: 40,
  },
  headerContainer: { paddingHorizontal: 30, marginBottom: 30 },
  botonAtras: { marginBottom: 20 },
  titulo: { fontSize: 36, fontWeight: "bold", color: "#2C3E50" },
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  icon: { marginRight: 10 },
  input: { flex: 1, paddingVertical: 15, fontSize: 16, color: "#2C3E50" },
  boton: {
    backgroundColor: "#27AE60",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
    shadowColor: "#27AE60",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 4,
  },
  textoBoton: { color: "#FFF", fontSize: 18, fontWeight: "bold" },
});
