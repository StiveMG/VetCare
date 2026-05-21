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
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import { supabase } from "../../../utils/supabase";
import { useUser } from "../../context/UserContext";

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

export default function CitasDoctor() {
  const { usuario } = useUser();
  const navigation = useNavigation();

  const [misCitas, setMisCitas] = useState<any[]>([]);
  const [mascotas, setMascotas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDatos();
  }, [usuario?.id]);

  const fetchDatos = async () => {
    if (!usuario?.id) return;
    setLoading(true);

    const { data: mascotasData } = await supabase
      .from("MASCOTAS")
      .select("id, nombre");
    if (mascotasData) setMascotas(mascotasData);

    const { data: citasData } = await supabase
      .from("CITAS_MEDICAS")
      .select("*")
      .eq("doctor_id", usuario.id)
      .in("estado", ["CONFIRMADA", "PENDIENTE"]) // El doctor no necesita ver las canceladas o completadas
      .order("fecha_hora", { ascending: true });

    if (citasData) setMisCitas(citasData);
    setLoading(false);
  };

  const handleCancelarReasignar = async (cita: any) => {
    Alert.alert(
      "Reasignar Cita",
      "¿No puedes atender esta cita? El sistema intentará pasarla a otro doctor disponible.",
      [
        { text: "Volver", style: "cancel" },
        {
          text: "Sí, reasignar",
          style: "destructive",
          onPress: async () => {
            setLoading(true);
            const { data: otrosDoctores } = await supabase
              .from("USUARIOS")
              .select("id, nombre")
              .ilike("rol", "doctor")
              .neq("id", usuario?.id);

            if (!otrosDoctores || otrosDoctores.length === 0) {
              setLoading(false);
              return Alert.alert(
                "Aviso",
                "Eres el único doctor registrado. Habla con el administrador para cancelar.",
              );
            }

            const { data: citasOcupadas } = await supabase
              .from("CITAS_MEDICAS")
              .select("doctor_id")
              .eq("fecha_hora", cita.fecha_hora);
            const doctoresOcupadosIds =
              citasOcupadas?.map((c) => c.doctor_id) || [];
            const doctorDisponible = otrosDoctores.find(
              (doc) => !doctoresOcupadosIds.includes(doc.id),
            );

            if (doctorDisponible) {
              const { error } = await supabase
                .from("CITAS_MEDICAS")
                .update({ doctor_id: doctorDisponible.id })
                .eq("id", cita.id);
              setLoading(false);
              if (error) Alert.alert("Error", error.message);
              else {
                Alert.alert(
                  "Cita Reasignada",
                  `La cita fue reasignada al Dr(a). ${doctorDisponible.nombre}.`,
                );
                fetchDatos();
              }
            } else {
              setLoading(false);
              Alert.alert(
                "Sin disponibilidad",
                "Todos los demás doctores están ocupados a esa hora.",
              );
            }
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={["#27AE60", "#2C3E50"]}
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
        <Text style={styles.tituloHeader}>Mi Agenda Médica</Text>
        <View style={{ width: 28 }} />
      </LinearGradient>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#27AE60" />
        </View>
      ) : (
        <View style={styles.listaContainer}>
          <Text style={styles.seccionTitulo}>Próximos Pacientes</Text>
          <FlatList
            data={misCitas}
            keyExtractor={(item) => item.id.toString()}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 30 }}
            renderItem={({ item }) => {
                //console.log("Buscando mascota:", item.mascota_id, "en lista:", mascotas);
              const nombreMascota =
                mascotas.find((m) => String(m.id) === String(item.mascota_id))?.nombre ||
                "Paciente";
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

              // Lógica visual dinámica
              const isVet = item.motivo === "Veterinario";
              const iconMotivo = isVet ? "stethoscope" : "shower";
              const colorMotivo = isVet ? "#27AE60" : "#9B59B6";

              return (
                <View style={styles.ticketCard}>
                  <View
                    style={[styles.ticketBorde, { backgroundColor: "#3498DB" }]}
                  />
                  <View style={styles.ticketContenido}>
                    <View style={styles.ticketHeader}>
                      <View>
                        <View style={styles.rowAlign}>
                          <MaterialCommunityIcons
                            name="paw"
                            size={18}
                            color="#3498DB"
                          />
                          <Text style={styles.ticketMascota}>
                            {nombreMascota}
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
                      <View style={styles.badgeTicket}>
                        <Text style={styles.badgeTicketTexto}>ASIGNADA</Text>
                      </View>
                    </View>

                    <View style={styles.lineaPunteada} />

                    <View style={styles.ticketFooter}>
                      <View style={styles.infoRow}>
                        <Ionicons
                          name="time-outline"
                          size={18}
                          color="#2C3E50"
                        />
                        <Text style={styles.citaFecha}>
                          {fechaCorta} | {horarioMapeado}
                        </Text>
                      </View>
                      <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={() => handleCancelarReasignar(item)}
                        style={styles.btnTicketCancelar}
                      >
                        <Ionicons
                          name="arrow-undo-outline"
                          size={16}
                          color="#E74C3C"
                        />
                        <Text style={styles.txtTicketCancelar}>Reasignar</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              );
            }}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <MaterialCommunityIcons
                  name="coffee-outline"
                  size={70}
                  color="#E2E8F0"
                />
                <Text style={styles.emptyText}>
                  No tienes citas asignadas. ¡Disfruta tu café!
                </Text>
              </View>
            }
          />
        </View>
      )}
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
  seccionTitulo: {
    fontSize: 17,
    fontWeight: "800",
    color: "#2C3E50",
    marginBottom: 15,
  },
  emptyContainer: { alignItems: "center", marginTop: 60 },
  emptyText: {
    color: "#95A5A6",
    marginTop: 15,
    fontSize: 16,
    textAlign: "center",
  },

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
  ticketBorde: { width: 8 },
  ticketContenido: { flex: 1, padding: 18 },
  ticketHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  rowAlign: { flexDirection: "row", alignItems: "center" },
  ticketMascota: {
    fontSize: 19,
    fontWeight: "900",
    color: "#2C3E50",
    marginLeft: 6,
  },
  ticketMotivo: {
    fontSize: 14,
    color: "#7F8C8D",
    marginLeft: 6,
    fontWeight: "600",
  },
  badgeTicket: {
    backgroundColor: "#E1F0FA",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  badgeTicketTexto: {
    fontSize: 11,
    fontWeight: "900",
    color: "#3498DB",
    letterSpacing: 0.5,
  },
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
  citaFecha: {
    marginLeft: 6,
    color: "#2C3E50",
    fontWeight: "800",
    fontSize: 15,
  },
  btnTicketCancelar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF0F0",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#FADBD8",
  },
  txtTicketCancelar: {
    color: "#E74C3C",
    fontWeight: "bold",
    fontSize: 13,
    marginLeft: 4,
  },
});
