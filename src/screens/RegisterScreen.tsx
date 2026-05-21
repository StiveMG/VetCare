import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../../utils/supabase";

/**
 * RegisterScreen
 * -------------------------------------------------------
 *  ANTES: el usuario elegía su rol (CLIENTE, DOCTOR, ADMIN)
 *         al registrarse. CUALQUIERA podía auto-asignarse ADMIN.
 *
 *  AHORA:  TODOS se registran como "CLIENTE" por defecto.
 *          Solo un ADMIN puede cambiar roles después, desde
 *          la pantalla "GestorUsuarios".
 *
 *  ¿Por qué?
 *    - Seguridad: evita que un usuario malicioso se registre
 *      como ADMIN y tenga control total.
 *    - Control: el administrador decide quién es CLIENTE,
 *      DOCTOR o ADMIN después de revisar cada caso.
 * -------------------------------------------------------
 */

export default function RegisterScreen({ navigation }: any) {
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [mostrarPassword, setMostrarPassword] = useState(false);

  const handleRegister = async () => {
    const cleanName = nombre.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanName || !cleanEmail || !password) {
      Alert.alert("Aviso", "Por favor, llena todos los campos.");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Aviso", "La contrasena debe tener al menos 6 caracteres.");
      return;
    }

    setLoading(true);

    try {
      // 🔒 SIEMPRE se registra como CLIENTE.
      // El rol solo lo puede cambiar un ADMIN después.
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            nombre: cleanName,
            rol: "CLIENTE",
          },
        },
      });

      if (error) throw error;

      Alert.alert(
        "Cuenta creada",
        data.session
          ? "Tu cuenta fue creada correctamente."
          : "Tu cuenta fue creada. Si Supabase pide confirmacion, revisa tu correo antes de iniciar sesion.",
        [{
          text: "OK",
          // Si ya hay sesión → va al Home (stack autenticado).
          // Si no → va al Login (stack invitado).
          onPress: () => navigation.navigate(data.session ? "Home" : "Login"),
        }],
      );
    } catch (error: any) {
      Alert.alert("Error", error.message ?? "No se pudo crear la cuenta.");
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
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerContainer}>
          <TouchableOpacity
            activeOpacity={0.75}
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={28} color="#2C3E50" />
          </TouchableOpacity>
          <Text style={styles.title}>Crear cuenta</Text>
          <Text style={styles.subtitle}>Registra el perfil de acceso</Text>
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
              placeholder="Correo electronico"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
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
              placeholder="Contrasena (min. 6 caracteres)"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!mostrarPassword}
              placeholderTextColor="#BDC3C7"
            />
            <TouchableOpacity
              activeOpacity={0.75}
              onPress={() => setMostrarPassword((visible) => !visible)}
            >
              <Ionicons
                name={mostrarPassword ? "eye-off-outline" : "eye-outline"}
                size={24}
                color="#27AE60"
              />
            </TouchableOpacity>
          </View>

          {/* ⚠️  El selector de rol fue ELIMINADO.
              Todos se registran como CLIENTE automáticamente.
              Solo un ADMIN puede cambiar roles después desde
              GestorUsuarios. */}

          <TouchableOpacity
            activeOpacity={0.8}
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
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
  headerContainer: { paddingHorizontal: 30, marginBottom: 28 },
  backButton: { marginBottom: 20, width: 42 },
  title: { fontSize: 36, fontWeight: "800", color: "#2C3E50" },
  subtitle: { fontSize: 16, color: "#7F8C8D", marginTop: 5 },
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
  button: {
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
  buttonDisabled: { opacity: 0.65 },
  buttonText: { color: "#FFFFFF", fontSize: 18, fontWeight: "800" },
});
