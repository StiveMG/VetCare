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
  ScrollView,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import { supabase } from "../../../utils/supabase";

const ESTADOS_CITA = ["PENDIENTE", "CONFIRMADA", "COMPLETADA", "CANCELADA"];
const HORARIOS_DISPONIBLES = [
  { label: "06:00 AM", value: "06:00" },
  { label: "07:00 AM", value: "07:00" },
  { label: "08:00 AM", value: "08:00" },
  { label: "09:00 AM", value: "09:00" },
  { label: "10:00 AM", value: "10:00" },
  { label: "11:00 AM", value: "11:00" },
  { label: "12:00 PM", value: "12:00" },
  { label: "01:00 PM", value: "13:00" },
  { label: "02:00 PM", value: "14:00" },
  { label: "03:00 PM", value: "15:00" },
  { label: "04:00 PM", value: "16:00" },
  { label: "05:00 PM", value: "17:00" },
  { label: "06:00 PM", value: "18:00" },
];

export default function CitasAdmin() {
  const navigation = useNavigation();

  const [todasLasCitas, setTodasLasCitas] = useState<any[]>([]);
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [mascotas, setMascotas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [modalVisible, setModalVisible] = useState(false);
  const [citaEditando, setCitaEditando] = useState<any>(null);
  const [nuevoDoctorId, setNuevoDoctorId] = useState<number | null>(null);
  const [nuevoEstado, setNuevoEstado] = useState<string>("");
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    fetchDatosGlobales();
  }, []);

  const fetchDatosGlobales = async () => {
    setLoading(true);
    const { data: usuariosData } = await supabase
      .from("USUARIOS")
      .select("id, nombre, rol");
    if (usuariosData) setUsuarios(usuariosData);

    const { data: mascotasData } = await supabase
      .from("MASCOTAS")
      .select("id, nombre");
    if (mascotasData) setMascotas(mascotasData);

    const { data: citasData } = await supabase
      .from("CITAS_MEDICAS")
      .select("*")
      .order("fecha_hora", { ascending: false });
    if (citasData) setTodasLasCitas(citasData);
    setLoading(false);
  };

  const abrirModalEdicion = (cita: any) => {
    setCitaEditando(cita);
    setNuevoDoctorId(cita.doctor_id);
    setNuevoEstado(cita.estado);
    setModalVisible(true);
  };

  const cerrarModal = () => {
    setModalVisible(false);
    setCitaEditando(null);
  };

  const handleGuardarCambios = async () => {
    setGuardando(true);
    const { error } = await supabase
      .from("CITAS_MEDICAS")
      .update({ doctor_id: nuevoDoctorId, estado: nuevoEstado })
      .eq("id", citaEditando.id);
    setGuardando(false);
    if (error) Alert.alert("Error", error.message);
    else {
      Alert.alert("Éxito", "Cita actualizada.");
      cerrarModal();
      fetchDatosGlobales();
    }
  };

  const handleEliminarCita = () => {
    Alert.alert(
      "Eliminar Definitivamente",
      "Esto borrará la cita de la base de datos. ¿Continuar?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            const { error } = await supabase
              .from("CITAS_MEDICAS")
              .delete()
              .eq("id", citaEditando.id);
            if (!error) {
              cerrarModal();
              fetchDatosGlobales();
            }
          },
        },
      ],
    );
  };

  const getColorPorEstado = (estado: string) => {
    switch (estado) {
      case "CONFIRMADA":
        return "#27AE60";
      case "PENDIENTE":
        return "#F1C40F";
      case "CANCELADA":
        return "#E74C3C";
      case "COMPLETADA":
        return "#3498DB";
      default:
        return "#95A5A6";
    }
  };

  const listaDoctores = usuarios.filter(
    (u) => u.rol?.toUpperCase() === "DOCTOR",
  );

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
        <Text style={styles.tituloHeader}>Control de Citas</Text>
        <View style={{ width: 28 }} />
      </LinearGradient>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#3498DB" />
        </View>
      ) : (
        <View style={styles.listaContainer}>
          <FlatList
            data={todasLasCitas}
            keyExtractor={(item) => item.id.toString()}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 30 }}
            renderItem={({ item }) => {
              const nombreCliente =
                usuarios.find((u) => u.id === item.cliente_id)?.nombre ||
                "Desconocido";
              const nombreMascota =
                mascotas.find((m) => m.id === item.mascota_id)?.nombre ||
                "Sin Mascota";
              const nombreDoctor = item.doctor_id
                ? usuarios.find((u) => u.id === item.doctor_id)?.nombre ||
                  "Dr. Asignado"
                : "Por asignar";

              const fechaObj = item.fecha_hora
                ? new Date(item.fecha_hora)
                : null;
              const fechaCorta = fechaObj
                ? item.fecha_hora.split("T")[0]
                : "Sin fecha";
              const horaCorta = fechaObj
                ? item.fecha_hora.split("T")[1].substring(0, 5)
                : "";
              const horarioMapeado =
                HORARIOS_DISPONIBLES.find((h) => h.value === horaCorta)
                  ?.label || horaCorta;

              const isVet = item.motivo === "Veterinario";
              const iconMotivo = isVet ? "stethoscope" : "shower";
              const colorMotivo = isVet ? "#27AE60" : "#9B59B6";
              const colorEstado = getColorPorEstado(item.estado);
              const isCancelada = item.estado === "CANCELADA";

              return (
                <View
                  style={[
                    styles.ticketCard,
                    isCancelada && styles.ticketCancelado,
                  ]}
                >
                  <View
                    style={[
                      styles.ticketBorde,
                      { backgroundColor: colorEstado },
                    ]}
                  />
                  <View style={styles.ticketContenido}>
                    <View style={styles.ticketHeader}>
                      <View>
                        <View style={styles.rowAlign}>
                          <MaterialCommunityIcons
                            name="paw"
                            size={18}
                            color="#2C3E50"
                          />
                          <Text
                            style={[
                              styles.ticketMascota,
                              isCancelada && styles.textoTachado,
                            ]}
                          >
                            {nombreMascota}{" "}
                            <Text style={styles.txtDueño}>
                              (De: {nombreCliente})
                            </Text>
                          </Text>
                        </View>
                        <View style={[styles.rowAlign, { marginTop: 4 }]}>
                          <MaterialCommunityIcons
                            name={iconMotivo}
                            size={16}
                            color={colorMotivo}
                          />
                          <Text style={styles.ticketMotivo}>{item.motivo}</Text>
                        </View>
                      </View>
                      <View
                        style={[
                          styles.badgeTicket,
                          { backgroundColor: colorEstado + "20" },
                        ]}
                      >
                        <Text
                          style={[
                            styles.badgeTicketTexto,
                            { color: colorEstado },
                          ]}
                        >
                          {item.estado}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.lineaPunteada} />

                    <View style={styles.ticketFooter}>
                      <View style={{ flex: 1 }}>
                        <View style={styles.infoRow}>
                          <Ionicons name="calendar" size={16} color="#7F8C8D" />
                          <Text
                            style={[
                              styles.textoInfo,
                              isCancelada && styles.textoTachado,
                            ]}
                          >
                            {fechaCorta} | {horarioMapeado}
                          </Text>
                        </View>
                        <View style={[styles.infoRow, { marginTop: 6 }]}>
                          <MaterialCommunityIcons
                            name="doctor"
                            size={16}
                            color="#7F8C8D"
                          />
                          <Text style={styles.textoInfo}>{nombreDoctor}</Text>
                        </View>
                      </View>

                      <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={() => abrirModalEdicion(item)}
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
                  </View>
                </View>
              );
            }}
          />
        </View>
      )}

      {/* MODAL MÁS LIMPIO */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={cerrarModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitulo}>Ajustes de Cita</Text>
              <TouchableOpacity onPress={cerrarModal}>
                <Ionicons name="close-circle" size={32} color="#BDC3C7" />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.seccionTitulo}>Cambiar Estado:</Text>
              <View style={styles.opcionesRow}>
                {ESTADOS_CITA.map((estado) => (
                  <TouchableOpacity
                    key={estado}
                    style={[
                      styles.pill,
                      nuevoEstado === estado && {
                        backgroundColor: getColorPorEstado(estado),
                        borderColor: getColorPorEstado(estado),
                      },
                    ]}
                    onPress={() => setNuevoEstado(estado)}
                  >
                    <Text
                      style={[
                        styles.pillText,
                        nuevoEstado === estado && styles.pillTextSelected,
                      ]}
                    >
                      {estado}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.seccionTitulo, { marginTop: 25 }]}>
                Asignar Doctor:
              </Text>
              <View style={styles.opcionesRow}>
                {listaDoctores.map((doc) => (
                  <TouchableOpacity
                    key={doc.id}
                    style={[
                      styles.pill,
                      nuevoDoctorId === doc.id && styles.pillDoctorSelected,
                    ]}
                    onPress={() => setNuevoDoctorId(doc.id)}
                  >
                    <MaterialCommunityIcons
                      name="doctor"
                      size={16}
                      color={nuevoDoctorId === doc.id ? "#FFF" : "#7F8C8D"}
                      style={{ marginRight: 6 }}
                    />
                    <Text
                      style={[
                        styles.pillText,
                        nuevoDoctorId === doc.id && styles.pillTextSelected,
                      ]}
                    >
                      {doc.nombre}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={styles.btnGuardarModal}
                  onPress={handleGuardarCambios}
                  disabled={guardando}
                >
                  {guardando ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <Text style={styles.txtBotonBlanco}>Actualizar Cita</Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.btnEliminarModal}
                  onPress={handleEliminarCita}
                >
                  <Ionicons name="trash-outline" size={20} color="#E74C3C" />
                  <Text style={styles.txtEliminarModal}>
                    Eliminar Definitivamente
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

  // Estilos Ticket Premium
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
  ticketCancelado: { opacity: 0.65 },
  ticketBorde: { width: 8 },
  ticketContenido: { flex: 1, padding: 18 },
  ticketHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  rowAlign: { flexDirection: "row", alignItems: "center" },
  ticketMascota: {
    fontSize: 18,
    fontWeight: "900",
    color: "#2C3E50",
    marginLeft: 6,
  },
  txtDueño: { fontSize: 13, fontWeight: "normal", color: "#7F8C8D" },
  textoTachado: { textDecorationLine: "line-through", color: "#95A5A6" },
  ticketMotivo: {
    fontSize: 14,
    color: "#7F8C8D",
    marginLeft: 6,
    fontWeight: "600",
  },
  badgeTicket: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  badgeTicketTexto: { fontSize: 11, fontWeight: "900", letterSpacing: 0.5 },
  lineaPunteada: {
    height: 1,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderStyle: "dashed",
    marginVertical: 15,
    borderRadius: 1,
  },
  ticketFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  infoRow: { flexDirection: "row", alignItems: "center" },
  textoInfo: {
    marginLeft: 6,
    color: "#34495E",
    fontWeight: "700",
    fontSize: 14,
  },

  btnGestionar: {
    flexDirection: "row",
    backgroundColor: "#3498DB",
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#3498DB",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  txtGestionar: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 13,
    marginLeft: 6,
  },

  // Modal Premium
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
    maxHeight: "85%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitulo: { fontSize: 24, fontWeight: "900", color: "#2C3E50" },
  seccionTitulo: {
    fontSize: 16,
    fontWeight: "800",
    color: "#34495E",
    marginBottom: 15,
  },

  opcionesRow: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
  },
  pillDoctorSelected: { backgroundColor: "#2C3E50", borderColor: "#2C3E50" },
  pillText: { color: "#7F8C8D", fontWeight: "bold", fontSize: 14 },
  pillTextSelected: { color: "#FFF" },

  modalActions: { marginTop: 35, paddingTop: 20 },
  btnGuardarModal: {
    backgroundColor: "#27AE60",
    padding: 20,
    borderRadius: 15,
    alignItems: "center",
    marginBottom: 15,
    shadowColor: "#27AE60",
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
