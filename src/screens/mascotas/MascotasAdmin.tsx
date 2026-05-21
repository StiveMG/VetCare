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

// Opciones visuales
const ESPECIES = [
  { id: "Perro", icon: "dog", color: "#3498DB" },
  { id: "Gato", icon: "cat", color: "#E67E22" },
  { id: "Otro", icon: "paw", color: "#9B59B6" },
];

export default function MascotasAdmin() {
  const navigation = useNavigation();

  const [todasLasMascotas, setTodasLasMascotas] = useState<any[]>([]);
  const [usuarios, setUsuarios] = useState<any[]>([]); // Para buscar los nombres de los dueños
  const [loading, setLoading] = useState(true);

  const [modalVisible, setModalVisible] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const [mascotaEditando, setMascotaEditando] = useState<any>(null);
  const [nombre, setNombre] = useState("");
  const [especie, setEspecie] = useState<"Perro" | "Gato" | "Otro">("Perro");
  const [raza, setRaza] = useState("");
  const [peso, setPeso] = useState("");

  useEffect(() => {
    fetchDatosGlobales();
  }, []);

  const fetchDatosGlobales = async () => {
    setLoading(true);

    // 1. Traer todos los usuarios (para saber quién es el dueño)
    const { data: usuariosData } = await supabase
      .from("USUARIOS")
      .select("id, nombre");
    if (usuariosData) setUsuarios(usuariosData);

    // 2. Traer todas las mascotas del sistema
    const { data: mascotasData } = await supabase
      .from("MASCOTAS")
      .select("*")
      .order("created_at", { ascending: false });

    if (mascotasData) setTodasLasCitas(mascotasData);
    setLoading(false);
  };

  const setTodasLasCitas = setTodasLasMascotas;

  const abrirModalEditar = (mascota: any) => {
    setMascotaEditando(mascota);
    setNombre(mascota.nombre);
    setEspecie((mascota.especie as any) || "Otro");
    setRaza(mascota.raza || "");
    setPeso(mascota.peso ? String(mascota.peso) : "");
    setModalVisible(true);
  };

  const cerrarModal = () => {
    setModalVisible(false);
    setMascotaEditando(null);
  };

  const guardarCambios = async () => {
    if (!nombre.trim())
      return Alert.alert("Aviso", "El nombre no puede estar vacío.");

    setGuardando(true);
    const pesoLimpio = peso.replace(",", ".");
    const pesoNumerico = parseFloat(pesoLimpio);

    const { error } = await supabase
      .from("MASCOTAS")
      .update({
        nombre: nombre.trim(),
        especie: especie,
        raza: raza.trim() || null,
        peso: isNaN(pesoNumerico) ? null : pesoNumerico,
      })
      .eq("id", mascotaEditando.id);

    setGuardando(false);

    if (error) {
      Alert.alert("Error", error.message);
    } else {
      Alert.alert("Éxito", "Los datos del paciente han sido actualizados.");
      cerrarModal();
      fetchDatosGlobales();
    }
  };

  const eliminarMascota = () => {
    Alert.alert(
      "Eliminar Registro",
      `¿Borrar permanentemente a ${mascotaEditando.nombre} del sistema?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            const { error } = await supabase
              .from("MASCOTAS")
              .delete()
              .eq("id", mascotaEditando.id);
            if (error) Alert.alert("Error", error.message);
            else {
              cerrarModal();
              fetchDatosGlobales();
            }
          },
        },
      ],
    );
  };

  const getEspecieUI = (tipo: string) =>
    ESPECIES.find((e) => e.id === tipo) || ESPECIES[2];

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={["#2C3E50", "#000000"]}
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
        <Text style={styles.tituloHeader}>Directorio de Pacientes</Text>
        <View style={{ width: 28 }} />
      </LinearGradient>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#3498DB" />
          <Text style={{ marginTop: 10, color: "#7F8C8D" }}>
            Cargando expedientes...
          </Text>
        </View>
      ) : (
        <View style={styles.listaContainer}>
          <FlatList
            data={todasLasMascotas}
            keyExtractor={(item) => item.id.toString()}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 40 }}
            renderItem={({ item }) => {
              const ui = getEspecieUI(item.especie);

              const nombreDueño =
                usuarios.find((u) => String(u.id) === String(item.dueño_id))
                  ?.nombre || "Cliente Desconocido";

              return (
                <View style={styles.ticketCard}>
                  <View
                    style={[styles.ticketBorde, { backgroundColor: ui.color }]}
                  />
                  <View style={styles.ticketContenido}>
                    <View style={styles.ticketHeader}>
                      <View>
                        <View style={styles.rowAlign}>
                          <MaterialCommunityIcons
                            name={ui.icon as any}
                            size={22}
                            color={ui.color}
                          />
                          <Text style={styles.ticketNombre}>{item.nombre}</Text>
                        </View>
                        <Text style={styles.txtDueño}>
                          Dueño:{" "}
                          <Text
                            style={{ fontWeight: "bold", color: "#34495E" }}
                          >
                            {nombreDueño}
                          </Text>
                        </Text>
                      </View>

                      <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={() => abrirModalEditar(item)}
                        style={styles.btnGestionar}
                      >
                        <Ionicons
                          name="settings-outline"
                          size={16}
                          color="#FFF"
                        />
                        <Text style={styles.txtGestionar}>Gestionar</Text>
                      </TouchableOpacity>
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
                        <Text style={styles.labelInfo}>Peso Registrado</Text>
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
                  name="folder-open-outline"
                  size={70}
                  color="#E2E8F0"
                />
                <Text style={styles.emptyText}>
                  No hay mascotas registradas en la clínica.
                </Text>
              </View>
            }
          />
        </View>
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
              <Text style={styles.modalTitulo}>Expediente Clínico</Text>
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

              <Text style={styles.inputLabel}>Nombre del Paciente</Text>
              <View style={styles.inputContainer}>
                <Ionicons
                  name="text"
                  size={20}
                  color="#95A5A6"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.textInput}
                  value={nombre}
                  onChangeText={setNombre}
                />
              </View>

              <Text style={styles.inputLabel}>Raza</Text>
              <View style={styles.inputContainer}>
                <MaterialCommunityIcons
                  name="dna"
                  size={20}
                  color="#95A5A6"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.textInput}
                  value={raza}
                  onChangeText={setRaza}
                />
              </View>

              <Text style={styles.inputLabel}>Peso en Kg (Actualizar)</Text>
              <View style={styles.inputContainer}>
                <MaterialCommunityIcons
                  name="weight-kilogram"
                  size={20}
                  color="#95A5A6"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.textInput}
                  keyboardType="decimal-pad"
                  value={peso}
                  onChangeText={setPeso}
                />
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={styles.btnGuardarModal}
                  onPress={guardarCambios}
                  disabled={guardando}
                >
                  {guardando ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <Text style={styles.txtBotonBlanco}>
                      Guardar Expediente
                    </Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.btnEliminarModal}
                  onPress={eliminarMascota}
                >
                  <Ionicons name="trash-outline" size={20} color="#E74C3C" />
                  <Text style={styles.txtEliminarModal}>
                    Eliminar del Sistema
                  </Text>
                </TouchableOpacity>
              </View>
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
  listaContainer: { flex: 1, paddingHorizontal: 20, paddingTop: 20 },

  // Ticket Card
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
    alignItems: "flex-start",
  },
  rowAlign: { flexDirection: "row", alignItems: "center" },
  ticketNombre: {
    fontSize: 20,
    fontWeight: "900",
    color: "#2C3E50",
    marginLeft: 8,
  },
  txtDueño: { fontSize: 13, color: "#7F8C8D", marginTop: 4, marginLeft: 2 },
  btnGestionar: {
    flexDirection: "row",
    backgroundColor: "#3498DB",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: "center",
  },
  txtGestionar: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 12,
    marginLeft: 4,
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
    fontSize: 11,
    color: "#95A5A6",
    fontWeight: "bold",
    textTransform: "uppercase",
    marginBottom: 4,
  },
  textoInfo: { fontSize: 15, color: "#34495E", fontWeight: "700" },

  emptyContainer: { alignItems: "center", marginTop: 60 },
  emptyText: {
    color: "#95A5A6",
    marginTop: 15,
    fontSize: 16,
    textAlign: "center",
    paddingHorizontal: 40,
  },

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

  modalActions: {
    marginTop: 30,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
  },
  btnGuardarModal: {
    backgroundColor: "#2C3E50",
    padding: 20,
    borderRadius: 15,
    alignItems: "center",
    marginBottom: 15,
    shadowColor: "#2C3E50",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 4,
  },
  txtBotonBlanco: {
    color: "#FFF",
    fontWeight: "900",
    fontSize: 16,
    letterSpacing: 0.5,
  },
  btnEliminarModal: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    padding: 18,
    backgroundColor: "#FFF",
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#FADBD8",
  },
  txtEliminarModal: {
    color: "#E74C3C",
    fontWeight: "bold",
    marginLeft: 8,
    fontSize: 15,
  },
});
