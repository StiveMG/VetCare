import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  FlatList,
} from "react-native";
import { Calendar, LocaleConfig } from "react-native-calendars";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { supabase } from "../../../utils/supabase";
import { useUser } from "../../context/UserContext";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";

LocaleConfig.locales["es"] = {
  monthNames: [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ],
  monthNamesShort: [
    "Ene",
    "Feb",
    "Mar",
    "Abr",
    "May",
    "Jun",
    "Jul",
    "Ago",
    "Sep",
    "Oct",
    "Nov",
    "Dic",
  ],
  dayNames: [
    "Domingo",
    "Lunes",
    "Martes",
    "Miércoles",
    "Jueves",
    "Viernes",
    "Sábado",
  ],
  dayNamesShort: ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"],
  today: "Hoy",
};
LocaleConfig.defaultLocale = "es";

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

export default function CitasCliente() {
  const { usuario } = useUser();
  const navigation = useNavigation();

  const [tabActiva, setTabActiva] = useState<"AGENDAR" | "HISTORIAL">(
    "AGENDAR",
  );
  const [mascotas, setMascotas] = useState<any[]>([]);
  const [doctores, setDoctores] = useState<any[]>([]);
  const [misCitas, setMisCitas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [mascotaSeleccionada, setMascotaSeleccionada] = useState<number | null>(
    null,
  );
  const [motivoSeleccionado, setMotivoSeleccionado] = useState<
    "Veterinario" | "Estética" | null
  >(null);
  const [fechaSeleccionada, setFechaSeleccionada] = useState<string>("");
  const [horaSeleccionada, setHoraSeleccionada] = useState<string>("");

  useEffect(() => {
    fetchDatos();
  }, [usuario?.id]);

  const fetchDatos = async () => {
    if (!usuario?.id) return;
    setLoading(true);
    const { data: mData } = await supabase
      .from("MASCOTAS")
      .select("id, nombre")
      .eq("dueño_id", usuario.id);
    if (mData) setMascotas(mData);
    const { data: dData } = await supabase
      .from("USUARIOS")
      .select("id, nombre")
      .ilike("rol", "doctor");
    if (dData) setDoctores(dData);
    const { data: cData } = await supabase
      .from("CITAS_MEDICAS")
      .select("*")
      .eq("cliente_id", usuario.id)
      .order("fecha_hora", { ascending: false });
    if (cData) setMisCitas(cData);
    setLoading(false);
  };

  const handleAgendarCita = async () => {
    if (
      !mascotaSeleccionada ||
      !motivoSeleccionado ||
      !fechaSeleccionada ||
      !horaSeleccionada
    )
      return Alert.alert("Aviso", "Completa todos los campos.");
    setSaving(true);
    const fechaHoraFinal = `${fechaSeleccionada}T${horaSeleccionada}:00`;
    try {
      const { data: listaDoctores } = await supabase
        .from("USUARIOS")
        .select("id, nombre")
        .ilike("rol", "doctor");
      const { data: citasOcupadas } = await supabase
        .from("CITAS_MEDICAS")
        .select("doctor_id")
        .eq("fecha_hora", fechaHoraFinal);
      const idsOcupados = citasOcupadas?.map((c) => c.doctor_id) || [];
      const doctorDisponible = listaDoctores?.find(
        (doc) => !idsOcupados.includes(doc.id),
      );
      if (!doctorDisponible) {
        setSaving(false);
        return Alert.alert("Horario Ocupado", "No hay doctores disponibles.");
      }
      await supabase.from("CITAS_MEDICAS").insert([
        {
          cliente_id: usuario?.id,
          mascota_id: mascotaSeleccionada,
          motivo: motivoSeleccionado,
          fecha_hora: fechaHoraFinal,
          doctor_id: doctorDisponible.id,
          estado: "CONFIRMADA",
        },
      ]);
      Alert.alert(
        "¡Cita Confirmada!",
        `Con el Dr(a). ${doctorDisponible.nombre}.`,
      );
      setMascotaSeleccionada(null);
      setMotivoSeleccionado(null);
      setFechaSeleccionada("");
      setHoraSeleccionada("");
      await fetchDatos();
      setTabActiva("HISTORIAL");
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCancelarCita = (citaId: number) => {
    Alert.alert("Cancelar Cita", "¿Anular esta cita?", [
      { text: "No", style: "cancel" },
      {
        text: "Sí",
        style: "destructive",
        onPress: async () => {
          await supabase
            .from("CITAS_MEDICAS")
            .update({ estado: "CANCELADA" })
            .eq("id", citaId);
          fetchDatos();
        },
      },
    ]);
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

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={["#3498DB", "#2C3E50"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={28} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.tituloHeader}>Mis Citas</Text>
        <View style={{ width: 28 }} />
      </LinearGradient>

      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, tabActiva === "AGENDAR" && styles.tabActiva]}
          onPress={() => setTabActiva("AGENDAR")}
        >
          <Text
            style={[
              styles.tabTexto,
              tabActiva === "AGENDAR" && styles.tabTextoActiva,
            ]}
          >
            Agendar
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tabActiva === "HISTORIAL" && styles.tabActiva]}
          onPress={() => setTabActiva("HISTORIAL")}
        >
          <Text
            style={[
              styles.tabTexto,
              tabActiva === "HISTORIAL" && styles.tabTextoActiva,
            ]}
          >
            Historial
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#3498DB" />
      ) : tabActiva === "AGENDAR" ? (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.seccionTitulo}>1. ¿Quién tiene cita?</Text>
          <View style={styles.opcionesRow}>
            {mascotas.map((m) => (
              <TouchableOpacity
                key={m.id}
                style={[
                  styles.pill,
                  mascotaSeleccionada === m.id && styles.pillSelected,
                ]}
                onPress={() => setMascotaSeleccionada(m.id)}
              >
                <MaterialCommunityIcons
                  name="paw"
                  size={18}
                  color={mascotaSeleccionada === m.id ? "#FFF" : "#3498DB"}
                />
                <Text
                  style={[
                    styles.pillText,
                    mascotaSeleccionada === m.id && styles.pillTextSelected,
                  ]}
                >
                  {m.nombre}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={[styles.seccionTitulo, { marginTop: 25 }]}>
            2. Motivo
          </Text>
          <View style={styles.opcionesRow}>
            {["Veterinario", "Estética"].map((motivo) => (
              <TouchableOpacity
                key={motivo}
                style={[
                  styles.cardOpcion,
                  motivoSeleccionado === motivo && styles.cardOpcionSelected,
                ]}
                onPress={() => setMotivoSeleccionado(motivo as any)}
              >
                <MaterialCommunityIcons
                  name={motivo === "Veterinario" ? "stethoscope" : "shower"}
                  size={32}
                  color={motivoSeleccionado === motivo ? "#FFF" : "#2C3E50"}
                />
                <Text
                  style={[
                    styles.cardTexto,
                    motivoSeleccionado === motivo && styles.cardTextoSelected,
                  ]}
                >
                  {motivo}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={[styles.seccionTitulo, { marginTop: 25 }]}>
            3. Fecha y Hora
          </Text>
          <View style={styles.calendarContainer}>
            <Calendar
              onDayPress={(day: any) => setFechaSeleccionada(day.dateString)}
              markedDates={{
                [fechaSeleccionada]: {
                  selected: true,
                  selectedColor: "#3498DB",
                },
              }}
              minDate={new Date().toISOString().split("T")[0]}
            />
          </View>
          {fechaSeleccionada && (
            <ScrollView
              horizontal
              style={{ marginTop: 15 }}
              showsHorizontalScrollIndicator={false}
            >
              {HORARIOS_DISPONIBLES.map((h) => (
                <TouchableOpacity
                  key={h.value}
                  style={[
                    styles.horaPill,
                    horaSeleccionada === h.value && styles.horaPillSelected,
                  ]}
                  onPress={() => setHoraSeleccionada(h.value)}
                >
                  <Text
                    style={[
                      styles.horaTexto,
                      horaSeleccionada === h.value && styles.horaTextoSelected,
                    ]}
                  >
                    {h.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
          <TouchableOpacity
            style={[
              styles.botonAgendar,
              !horaSeleccionada && styles.botonDeshabilitado,
            ]}
            onPress={handleAgendarCita}
            disabled={saving}
          >
            <Text style={styles.textoBoton}>Confirmar Cita</Text>
          </TouchableOpacity>
        </ScrollView>
      ) : (
        <FlatList
          data={misCitas}
          contentContainerStyle={{ padding: 20 }}
          renderItem={({ item }) => {
            const m = mascotas.find((x) => x.id === item.mascota_id);
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
                  style={[styles.ticketBorde, { backgroundColor: colorEstado }]}
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
                        <Text style={styles.ticketMascota}>
                          {m?.nombre || "Paciente"}
                        </Text>
                      </View>
                      <View style={styles.rowAlign}>
                        <MaterialCommunityIcons
                          name={
                            item.motivo === "Veterinario"
                              ? "stethoscope"
                              : "shower"
                          }
                          size={16}
                          color={
                            item.motivo === "Veterinario"
                              ? "#27AE60"
                              : "#9B59B6"
                          }
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
                    <View>
                      <View style={styles.infoRow}>
                        <Ionicons name="calendar" size={16} color="#7F8C8D" />
                        <Text style={styles.textoInfo}>
                          {item.fecha_hora.split("T")[0]} |{" "}
                          {
                            HORARIOS_DISPONIBLES.find(
                              (h) =>
                                h.value ===
                                item.fecha_hora.split("T")[1].substring(0, 5),
                            )?.label
                          }
                        </Text>
                      </View>
                      <View style={styles.infoRow}>
                        <MaterialCommunityIcons
                          name="doctor"
                          size={16}
                          color="#7F8C8D"
                        />
                        <Text style={styles.textoInfo}>
                          {doctores.find((d) => d.id === item.doctor_id)
                            ?.nombre || "Por asignar"}
                        </Text>
                      </View>
                    </View>
                    {!isCancelada && item.estado !== "COMPLETADA" && (
                      <TouchableOpacity
                        style={styles.btnTicketCancelar}
                        onPress={() => handleCancelarCita(item.id)}
                      >
                        <Ionicons name="close" size={16} color="#E74C3C" />
                        <Text style={styles.txtTicketCancelar}>Anular</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </View>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F4F7F6" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 25,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  tituloHeader: { fontSize: 20, fontWeight: "800", color: "#FFF" },
  tabsContainer: {
    flexDirection: "row",
    marginHorizontal: 20,
    marginTop: 20,
    backgroundColor: "#E2E8F0",
    borderRadius: 15,
    padding: 5,
  },
  tab: { flex: 1, paddingVertical: 12, alignItems: "center", borderRadius: 12 },
  tabActiva: { backgroundColor: "#FFF", elevation: 3 },
  tabTexto: { color: "#7F8C8D", fontWeight: "bold" },
  tabTextoActiva: { color: "#2C3E50", fontWeight: "900" },
  scrollContent: { padding: 20 },
  seccionTitulo: {
    fontSize: 16,
    fontWeight: "800",
    color: "#2C3E50",
    marginBottom: 10,
  },
  opcionesRow: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  pillSelected: { backgroundColor: "#3498DB", borderColor: "#3498DB" },
  pillText: { marginLeft: 5, color: "#7F8C8D", fontWeight: "bold" },
  pillTextSelected: { color: "#FFF" },
  cardOpcion: {
    flex: 1,
    backgroundColor: "#FFF",
    padding: 20,
    borderRadius: 15,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  cardOpcionSelected: { backgroundColor: "#2C3E50", borderColor: "#2C3E50" },
  cardTexto: { marginTop: 8, color: "#7F8C8D", fontWeight: "bold" },
  cardTextoSelected: { color: "#FFF" },
  calendarContainer: { borderRadius: 15, overflow: "hidden", elevation: 3 },
  horaPill: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 10,
    marginRight: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#FFF",
  },
  horaPillSelected: { backgroundColor: "#3498DB", borderColor: "#3498DB" },
  horaTexto: { color: "#34495E", fontWeight: "bold" },
  horaTextoSelected: { color: "#FFF" },
  botonAgendar: {
    backgroundColor: "#27AE60",
    padding: 18,
    borderRadius: 15,
    alignItems: "center",
    marginTop: 20,
  },
  botonDeshabilitado: { backgroundColor: "#BDC3C7" },
  textoBoton: { color: "#FFF", fontWeight: "900" },
  ticketCard: {
    flexDirection: "row",
    backgroundColor: "#FFF",
    borderRadius: 15,
    marginBottom: 15,
    overflow: "hidden",
    elevation: 3,
  },
  ticketCancelado: { opacity: 0.6 },
  ticketBorde: { width: 6 },
  ticketContenido: { flex: 1, padding: 15 },
  ticketHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  rowAlign: { flexDirection: "row", alignItems: "center" },
  ticketMascota: {
    fontSize: 16,
    fontWeight: "900",
    color: "#2C3E50",
    marginLeft: 5,
  },
  ticketMotivo: {
    fontSize: 13,
    color: "#7F8C8D",
    marginLeft: 5,
    fontWeight: "600",
  },
  badgeTicket: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeTicketTexto: { fontSize: 10, fontWeight: "900" },
  lineaPunteada: {
    height: 1,
    borderWidth: 0.5,
    borderColor: "#E2E8F0",
    borderStyle: "dashed",
    marginVertical: 12,
  },
  ticketFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  infoRow: { flexDirection: "row", alignItems: "center", marginBottom: 2 },
  textoInfo: {
    marginLeft: 5,
    color: "#34495E",
    fontWeight: "600",
    fontSize: 13,
  },
  btnTicketCancelar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF0F0",
    padding: 8,
    borderRadius: 8,
  },
  txtTicketCancelar: {
    color: "#E74C3C",
    fontWeight: "bold",
    fontSize: 12,
    marginLeft: 4,
  },
});
