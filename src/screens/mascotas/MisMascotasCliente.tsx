import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  TextInput,
  ScrollView,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import { supabase } from "../../../utils/supabase";
import { useUser } from "../../context/UserContext";

// Opciones visuales para la especie
const ESPECIES = [
  { id: "Perro", icon: "dog", color: "#3498DB" },
  { id: "Gato", icon: "cat", color: "#E67E22" },
  { id: "Otro", icon: "paw", color: "#9B59B6" },
];

export default function MisMascotasCliente() {
  const { usuario } = useUser();
  const navigation = useNavigation();

  const [mascotas, setMascotas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados del Modal (Formulario)
  const [modalVisible, setModalVisible] = useState(false);
  const [guardando, setGuardando] = useState(false);

  // Campos del formulario
  const [idEditando, setIdEditando] = useState<number | null>(null);
  const [nombre, setNombre] = useState("");
  const [especie, setEspecie] = useState<"Perro" | "Gato" | "Otro">("Perro");
  const [raza, setRaza] = useState("");
  const [peso, setPeso] = useState("");

  useEffect(() => {
    fetchMascotas();
  }, [usuario?.id]);

  const fetchMascotas = async () => {
    if (!usuario?.id) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("MASCOTAS")
      .select("*")
      .eq("dueño_id", usuario.id)
      .order("created_at", { ascending: false });

    if (!error && data) setMascotas(data);
    setLoading(false);
  };

  const abrirModalNuevo = () => {
    setIdEditando(null);
    setNombre("");
    setEspecie("Perro");
    setRaza("");
    setPeso("");
    setModalVisible(true);
  };

  const abrirModalEditar = (mascota: any) => {
    setIdEditando(mascota.id);
    setNombre(mascota.nombre);
    setEspecie((mascota.especie as any) || "Otro");
    setRaza(mascota.raza || "");
    setPeso(mascota.peso ? String(mascota.peso) : "");
    setModalVisible(true);
  };

  const cerrarModal = () => setModalVisible(false);

  const guardarMascota = async () => {
    if (!nombre.trim())
      return Alert.alert("Aviso", "El nombre de la mascota es obligatorio.");

    setGuardando(true);
    const pesoLimpio = peso.replace(",", ".");
    const pesoNumerico = parseFloat(pesoLimpio);

    const mascotaData = {
      nombre: nombre.trim(),
      especie: especie,
      raza: raza.trim() || null,
      peso: isNaN(pesoNumerico) ? null : pesoNumerico,
      dueño_id: usuario?.id,
    };

    if (idEditando) {
      // Editar existente
      const { error } = await supabase
        .from("MASCOTAS")
        .update(mascotaData)
        .eq("id", idEditando);
      if (error) Alert.alert("Error", error.message);
      else {
        Alert.alert("Éxito", "Mascota actualizada correctamente.");
        cerrarModal();
        fetchMascotas();
      }
    } else {
      // Crear nueva
      const { error } = await supabase.from("MASCOTAS").insert([mascotaData]);
      if (error) Alert.alert("Error", error.message);
      else {
        Alert.alert(
          "¡Bienvenido!",
          `${nombre} ha sido registrado exitosamente.`,
        );
        cerrarModal();
        fetchMascotas();
      }
    }
    setGuardando(false);
  };

  const eliminarMascota = (id: number, nombreMascota: string) => {
    Alert.alert(
      "Eliminar Mascota",
      `¿Estás seguro de que deseas eliminar a ${nombreMascota}? Esta acción no se puede deshacer.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            const { error } = await supabase
              .from("MASCOTAS")
              .delete()
              .eq("id", id);
            if (error) Alert.alert("Error", error.message);
            else fetchMascotas();
          },
        },
      ],
    );
  };

  const getEspecieUI = (tipo: string) => {
    return ESPECIES.find((e) => e.id === tipo) || ESPECIES[2]; // Por defecto 'Otro'
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={["#3498DB", "#2C3E50"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <TouchableOpacity
          style={styles.botonVolver}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={28} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.tituloHeader}>Mis Mascotas</Text>
        <TouchableOpacity
          onPress={abrirModalNuevo}
          style={styles.btnHeaderAgregar}
        >
          <Ionicons name="add" size={24} color="#3498DB" />
        </TouchableOpacity>
      </LinearGradient>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#3498DB" />
        </View>
      ) : (
        <FlatList
          data={mascotas}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listaContainer}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const ui = getEspecieUI(item.especie);

            return (
              <View style={styles.ticketCard}>
                <View
                  style={[styles.ticketBorde, { backgroundColor: ui.color }]}
                />
                <View style={styles.ticketContenido}>
                  <View style={styles.ticketHeader}>
                    <View style={styles.rowAlign}>
                      <MaterialCommunityIcons
                        name={ui.icon as any}
                        size={24}
                        color={ui.color}
                      />
                      <Text style={styles.ticketNombre}>{item.nombre}</Text>
                    </View>
                    <View style={styles.accionesRow}>
                      <TouchableOpacity
                        onPress={() => abrirModalEditar(item)}
                        style={styles.btnAccion}
                      >
                        <Ionicons name="pencil" size={18} color="#7F8C8D" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => eliminarMascota(item.id, item.nombre)}
                        style={[styles.btnAccion, { marginLeft: 8 }]}
                      >
                        <Ionicons name="trash" size={18} color="#E74C3C" />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.lineaPunteada} />

                  <View style={styles.ticketFooter}>
                    <View style={styles.infoColumna}>
                      <Text style={styles.labelInfo}>Raza</Text>
                      <Text style={styles.textoInfo}>
                        {item.raza || "No especificada"}
                      </Text>
                    </View>
                    <View style={styles.infoColumna}>
                      <Text style={styles.labelInfo}>Peso</Text>
                      <Text style={styles.textoInfo}>
                        {item.peso ? `${item.peso} kg` : "N/A"}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons
                name="dog-side"
                size={80}
                color="#E2E8F0"
              />
              <Text style={styles.emptyText}>
                Aún no tienes mascotas registradas.
              </Text>
              <TouchableOpacity
                style={styles.btnAgregarVacio}
                onPress={abrirModalNuevo}
              >
                <Text style={styles.txtBtnAgregarVacio}>
                  Agregar mi primera mascota
                </Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={cerrarModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitulo}>
                {idEditando ? "Editar Mascota" : "Nueva Mascota"}
              </Text>
              <TouchableOpacity onPress={cerrarModal}>
                <Ionicons name="close-circle" size={32} color="#BDC3C7" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
             
              <Text style={styles.inputLabel}>Especie</Text>
              <View style={styles.especiesRow}>
                {ESPECIES.map((esp) => (
                  <TouchableOpacity
                    key={esp.id}
                    activeOpacity={0.7}
                    style={[
                      styles.especieBoton,
                      especie === esp.id && {
                        backgroundColor: esp.color,
                        borderColor: esp.color,
                      },
                    ]}
                    onPress={() => setEspecie(esp.id as any)}
                  >
                    <MaterialCommunityIcons
                      name={esp.icon as any}
                      size={24}
                      color={especie === esp.id ? "#FFF" : "#7F8C8D"}
                    />
                    <Text
                      style={[
                        styles.especieTexto,
                        especie === esp.id && { color: "#FFF" },
                      ]}
                    >
                      {esp.id}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>Nombre de la mascota *</Text>
              <View style={styles.inputContainer}>
                <Ionicons
                  name="text"
                  size={20}
                  color="#95A5A6"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.textInput}
                  placeholder="Ej. Firulais"
                  placeholderTextColor="#BDC3C7"
                  value={nombre}
                  onChangeText={setNombre}
                />
              </View>

              <Text style={styles.inputLabel}>Raza (Opcional)</Text>
              <View style={styles.inputContainer}>
                <MaterialCommunityIcons
                  name="dna"
                  size={20}
                  color="#95A5A6"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.textInput}
                  placeholder="Ej. Golden Retriever"
                  placeholderTextColor="#BDC3C7"
                  value={raza}
                  onChangeText={setRaza}
                />
              </View>

              <Text style={styles.inputLabel}>Peso en Kg (Opcional)</Text>
              <View style={styles.inputContainer}>
                <MaterialCommunityIcons
                  name="weight-kilogram"
                  size={20}
                  color="#95A5A6"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.textInput}
                  placeholder="Ej. 15.5"
                  placeholderTextColor="#BDC3C7"
                  keyboardType="decimal-pad"
                  value={peso}
                  onChangeText={setPeso}
                />
              </View>

              <TouchableOpacity
                activeOpacity={0.8}
                style={styles.btnGuardar}
                onPress={guardarMascota}
                disabled={guardando}
              >
                {guardando ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.txtBtnGuardar}>Guardar Mascota</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F4F7F6" },
  centerContainer: { flex: 1, justifyContent: "center", alignItems: "center" },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 25,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  botonVolver: {
    padding: 5,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 12,
  },
  tituloHeader: {
    fontSize: 20,
    fontWeight: "800",
    color: "#FFF",
    letterSpacing: 0.5,
  },
  btnHeaderAgregar: { backgroundColor: "#FFF", padding: 5, borderRadius: 12 },

  // Lista y Cards
  listaContainer: { padding: 20, paddingBottom: 40 },
  ticketCard: {
    flexDirection: "row",
    backgroundColor: "#FFF",
    borderRadius: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 4,
    overflow: "hidden",
  },
  ticketBorde: { width: 8 },
  ticketContenido: { flex: 1, padding: 18 },
  ticketHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  rowAlign: { flexDirection: "row", alignItems: "center" },
  ticketNombre: {
    fontSize: 20,
    fontWeight: "900",
    color: "#2C3E50",
    marginLeft: 8,
  },
  accionesRow: { flexDirection: "row" },
  btnAccion: {
    padding: 6,
    backgroundColor: "#F8FAFC",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  lineaPunteada: {
    height: 1,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderStyle: "dashed",
    marginVertical: 15,
    borderRadius: 1,
  },
  ticketFooter: { flexDirection: "row", justifyContent: "space-between" },
  infoColumna: { flex: 1 },
  labelInfo: {
    fontSize: 12,
    color: "#95A5A6",
    fontWeight: "bold",
    textTransform: "uppercase",
    marginBottom: 4,
  },
  textoInfo: { fontSize: 15, color: "#34495E", fontWeight: "700" },

  // Estado Vacío
  emptyContainer: { alignItems: "center", marginTop: 60 },
  emptyText: {
    color: "#95A5A6",
    marginTop: 15,
    fontSize: 16,
    textAlign: "center",
    paddingHorizontal: 40,
  },
  btnAgregarVacio: {
    marginTop: 25,
    backgroundColor: "#3498DB",
    paddingHorizontal: 25,
    paddingVertical: 15,
    borderRadius: 15,
    shadowColor: "#3498DB",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 4,
  },
  txtBtnAgregarVacio: { color: "#FFF", fontWeight: "bold", fontSize: 16 },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#F8FAFC",
    borderTopLeftRadius: 35,
    borderTopRightRadius: 35,
    padding: 25,
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 25,
  },
  modalTitulo: { fontSize: 24, fontWeight: "900", color: "#2C3E50" },

  inputLabel: {
    fontSize: 14,
    fontWeight: "800",
    color: "#34495E",
    marginBottom: 8,
    marginLeft: 4,
    marginTop: 15,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    borderRadius: 15,
    paddingHorizontal: 15,
    height: 55,
  },
  inputIcon: { marginRight: 10 },
  textInput: { flex: 1, color: "#2C3E50", fontSize: 16, fontWeight: "600" },

  especiesRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  especieBoton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    borderRadius: 15,
    paddingVertical: 15,
  },
  especieTexto: {
    marginTop: 8,
    fontWeight: "bold",
    color: "#7F8C8D",
    fontSize: 14,
  },

  btnGuardar: {
    backgroundColor: "#27AE60",
    padding: 20,
    borderRadius: 15,
    alignItems: "center",
    marginTop: 35,
    marginBottom: 20,
    shadowColor: "#27AE60",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 4,
  },
  txtBtnGuardar: {
    color: "#FFF",
    fontWeight: "900",
    fontSize: 16,
    letterSpacing: 0.5,
  },
});
