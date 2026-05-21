/**
 * ============================================================
 *  GESTOR USUARIOS SCREEN
 *  ============================================================
 *  ¿Qué hace esta pantalla?
 *
 *  Si eres ADMIN:
 *    - Ves una lista de TODOS los usuarios de la clínica.
 *    - Puedes tocar cualquier usuario para abrir un modal
 *      y CAMBIARLE EL ROL (CLIENTE, DOCTOR, ADMIN).
 *    - También puedes editar su nombre, apellido, teléfono.
 *
 *  Si eres CLIENTE o DOCTOR:
 *    - Ves solo TU PROPIO perfil.
 *    - Puedes editar tu nombre, apellido y teléfono.
 *    - NO puedes cambiar tu rol (solo el admin puede).
 *
 *  ¿Por qué separamos las vistas?
 *    - Por seguridad: un CLIENTE no debe ver los datos de
 *      otros usuarios ni mucho menos cambiar roles.
 *    - Un ADMIN necesita control total sobre los permisos.
 *
 *  ESTILOS: reciclados de CitasAdmin.tsx (ticket cards,
 *  modal, pills para roles, etc.). Misma identidad visual.
 * ============================================================
 */

import React, { useState, useEffect, useCallback } from "react";
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
  TextInput,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import { supabase } from "../../../utils/supabase";
import { useUser } from "../../context/UserContext";

// -------------------------------------------------------
//  ROLES disponibles en el sistema.
//  Coinciden 1 a 1 con la columna "rol" de la tabla USUARIOS.
// -------------------------------------------------------
const ROLES_DISPONIBLES = ["CLIENTE", "DOCTOR", "ADMIN"];

export default function GestorUsuariosScreen() {
  const navigation = useNavigation();
  const { role: miRol, usuario: miUsuario, refreshUsuario } = useUser();

  // -------------------------------------------------------
  //  ESTADO: lista de usuarios (solo para ADMIN)
  // -------------------------------------------------------
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // -------------------------------------------------------
  //  ESTADO: modal de edición
  // -------------------------------------------------------
  const [modalVisible, setModalVisible] = useState(false);
  const [usuarioEditando, setUsuarioEditando] = useState<any>(null);
  const [editNombre, setEditNombre] = useState("");
  const [editApellido, setEditApellido] = useState("");
  const [editTelefono, setEditTelefono] = useState("");
  const [editRol, setEditRol] = useState<string>("");
  const [guardando, setGuardando] = useState(false);

  // -------------------------------------------------------
  //  Carga inicial: si es ADMIN, trae todos los usuarios
  // -------------------------------------------------------
  useEffect(() => {
    if (miRol === "ADMIN") {
      fetchUsuarios();
    } else {
      setLoading(false);
    }
  }, [miRol]);

  // -------------------------------------------------------
  //  fetchUsuarios: SELECT * FROM USUARIOS ORDER BY nombre
  //  Solo los ADMIN pueden ver la lista completa.
  // -------------------------------------------------------
  const fetchUsuarios = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("USUARIOS")
      .select("*")
      .order("nombre", { ascending: true });
    if (data) setUsuarios(data);
    setLoading(false);
  };

  // -------------------------------------------------------
  //  abrirModalEdicion (ADMIN): prepara el modal con los
  //  datos del usuario seleccionado.
  // -------------------------------------------------------
  const abrirModalEdicion = (usuario: any) => {
    setUsuarioEditando(usuario);
    setEditNombre(usuario.nombre ?? "");
    setEditApellido(usuario.apellido ?? "");
    setEditTelefono(usuario.telefono ?? "");
    setEditRol(usuario.rol ?? "CLIENTE");
    setModalVisible(true);
  };

  // -------------------------------------------------------
  //  abrirMiPerfil (CLIENTE / DOCTOR): prepara el modal
  //  con los datos del usuario actual (sin selector de rol).
  // -------------------------------------------------------
  const abrirMiPerfil = () => {
    if (!miUsuario) return;
    setUsuarioEditando(miUsuario);
    setEditNombre(miUsuario.nombre ?? "");
    setEditApellido(miUsuario.apellido ?? "");
    setEditTelefono(miUsuario.telefono ?? "");
    setEditRol(miUsuario.rol ?? "CLIENTE");
    setModalVisible(true);
  };

  const cerrarModal = () => {
    setModalVisible(false);
    setUsuarioEditando(null);
  };

  // -------------------------------------------------------
  //  handleGuardar: UPDATE en la tabla USUARIOS.
  //
  //  Si eres ADMIN: puedes cambiar nombre, apellido,
  //  teléfono Y ROL.
  //
  //  Si eres CLIENTE/DOCTOR: solo cambias nombre,
  //  apellido y teléfono (tu propio perfil).
  //  El rol NO se envía (se mantiene el actual).
  // -------------------------------------------------------
  const handleGuardar = async () => {
    if (!editNombre.trim()) {
      Alert.alert("Aviso", "El nombre es obligatorio.");
      return;
    }
    setGuardando(true);

    // Construimos el payload según el rol del que edita
    const payload: any = {
      nombre: editNombre.trim(),
      apellido: editApellido.trim(),
      telefono: editTelefono.trim(),
    };

    // 🔒 Solo ADMIN puede cambiar el rol
    if (miRol === "ADMIN") {
      payload.rol = editRol;
    }

    const { error } = await supabase
      .from("USUARIOS")
      .update(payload)
      .eq("id", usuarioEditando.id);

    setGuardando(false);
    if (error) {
      Alert.alert("Error", error.message);
    } else {
      Alert.alert("Exito", "Usuario actualizado.");
      cerrarModal();
      // Si estamos editando nuestro propio perfil, refrescamos
      if (usuarioEditando.id === miUsuario?.id) {
        await refreshUsuario();
      }
      if (miRol === "ADMIN") {
        fetchUsuarios();
      }
    }
  };

  // -------------------------------------------------------
  //  handleEliminarUsuario: DELETE de la tabla USUARIOS.
  //  Solo visible para ADMIN y SOLO si NO está editando
  //  su propio perfil (no puede eliminarse a sí mismo).
  // -------------------------------------------------------
  const handleEliminarUsuario = () => {
    if (usuarioEditando.id === miUsuario?.id) {
      Alert.alert("Error", "No puedes eliminar tu propia cuenta.");
      return;
    }
    Alert.alert(
      "Eliminar Definitivamente",
      `Se borrara a "${usuarioEditando.nombre}" de la base de datos. Continuar?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            const { error } = await supabase
              .from("USUARIOS")
              .delete()
              .eq("id", usuarioEditando.id);
            if (error) {
              Alert.alert("Error al eliminar", error.message);
            } else {
              Alert.alert("Eliminado", "Usuario eliminado.");
              cerrarModal();
              fetchUsuarios();
            }
          },
        },
      ],
    );
  };

  // -------------------------------------------------------
  //  getColorPorRol: cada rol tiene su color distintivo
  //  para la barra lateral de la tarjeta (ticketBorde).
  // -------------------------------------------------------
  const getColorPorRol = (rol: string) => {
    switch (rol?.toUpperCase()) {
      case "ADMIN":   return "#E74C3C";
      case "DOCTOR":  return "#3498DB";
      case "CLIENTE": return "#27AE60";
      default:        return "#95A5A6";
    }
  };

  // ============================================================
  //  RENDER: depende del rol del usuario actual
  // ============================================================
  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER con gradiente oscuro (reciclado de CitasAdmin) */}
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
        <Text style={styles.tituloHeader}>
          {miRol === "ADMIN" ? "Usuarios y Roles" : "Mi Perfil"}
        </Text>
        <View style={{ width: 28 }} />
      </LinearGradient>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#3498DB" />
        </View>
      ) : miRol === "ADMIN" ? (
        /* ======================================================
           VISTA ADMIN: lista de todos los usuarios
           ====================================================== */
        <View style={styles.listaContainer}>
          <FlatList
            data={usuarios}
            keyExtractor={(item) => item.id.toString()}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 30 }}
            renderItem={({ item }) => {
              const colorRol = getColorPorRol(item.rol);
              return (
                <View style={styles.ticketCard}>
                  <View style={[styles.ticketBorde, { backgroundColor: colorRol }]} />
                  <View style={styles.ticketContenido}>
                    <View style={styles.ticketHeader}>
                      <View style={{ flex: 1 }}>
                        <View style={styles.rowAlign}>
                          <MaterialCommunityIcons
                            name={item.rol === "ADMIN" ? "shield-account" : item.rol === "DOCTOR" ? "doctor" : "account"}
                            size={18}
                            color="#2C3E50"
                          />
                          <Text style={styles.ticketNombre} numberOfLines={1}>
                            {item.nombre} {item.apellido ?? ""}
                          </Text>
                        </View>
                        {item.email ? (
                          <View style={[styles.rowAlign, { marginTop: 4 }]}>
                            <Ionicons name="mail-outline" size={14} color="#7F8C8D" />
                            <Text style={styles.ticketEmail}>{item.email}</Text>
                          </View>
                        ) : null}
                      </View>
                      <View style={[styles.badgeTicket, { backgroundColor: colorRol + "20" }]}>
                        <Text style={[styles.badgeTicketTexto, { color: colorRol }]}>
                          {item.rol}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.lineaPunteada} />

                    <View style={styles.ticketFooter}>
                      {item.telefono ? (
                        <View style={styles.infoRow}>
                          <Ionicons name="call-outline" size={14} color="#7F8C8D" />
                          <Text style={styles.textoInfo}>{item.telefono}</Text>
                        </View>
                      ) : <View />}
                      <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={() => abrirModalEdicion(item)}
                        style={styles.btnGestionar}
                      >
                        <Ionicons name="settings-outline" size={16} color="#FFF" />
                        <Text style={styles.txtGestionar}>Editar</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              );
            }}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <MaterialCommunityIcons name="account-off" size={70} color="#E2E8F0" />
                <Text style={styles.emptyText}>No hay usuarios registrados.</Text>
              </View>
            }
          />
        </View>
      ) : (
        /* ======================================================
           VISTA CLIENTE/DOCTOR: solo su propio perfil
           ====================================================== */
        <View style={styles.perfilContainer}>
          <View style={styles.avatarGrande}>
            <Ionicons
              name={miRol === "DOCTOR" ? "medical" : "person"}
              size={50}
              color="#3498DB"
            />
          </View>
          <Text style={styles.perfilNombre}>
            {miUsuario?.nombre} {miUsuario?.apellido ?? ""}
          </Text>
          <View style={[styles.badgeRol, { backgroundColor: getColorPorRol(miRol ?? "") + "20" }]}>
            <Text style={[styles.badgeTextoRol, { color: getColorPorRol(miRol ?? "") }]}>
              {miRol}
            </Text>
          </View>
          {miUsuario?.email ? (
            <Text style={styles.perfilEmail}>{miUsuario.email}</Text>
          ) : null}
          {miUsuario?.telefono ? (
            <Text style={styles.perfilTelefono}>{miUsuario.telefono}</Text>
          ) : null}

          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.btnEditarPerfil}
            onPress={abrirMiPerfil}
          >
            <Ionicons name="create-outline" size={20} color="#FFF" />
            <Text style={styles.txtEditarPerfil}>Editar mi perfil</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ============================================================
          MODAL: Editar usuario (ADMIN) / Editar perfil (CLIENTE/DOCTOR)
          Reciclado de CitasAdmin.tsx (mismo estilo).
          ============================================================ */}
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
                {miRol === "ADMIN" ? "Editar Usuario" : "Mi Perfil"}
              </Text>
              <TouchableOpacity onPress={cerrarModal}>
                <Ionicons name="close-circle" size={32} color="#BDC3C7" />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Campo: nombre */}
              <Text style={styles.seccionTitulo}>Nombre</Text>
              <TextInput
                style={styles.input}
                placeholder="Nombre"
                value={editNombre}
                onChangeText={setEditNombre}
                placeholderTextColor="#BDC3C7"
              />

              {/* Campo: apellido */}
              <Text style={[styles.seccionTitulo, { marginTop: 20 }]}>Apellido</Text>
              <TextInput
                style={styles.input}
                placeholder="Apellido"
                value={editApellido}
                onChangeText={setEditApellido}
                placeholderTextColor="#BDC3C7"
              />

              {/* Campo: teléfono */}
              <Text style={[styles.seccionTitulo, { marginTop: 20 }]}>Telefono</Text>
              <TextInput
                style={styles.input}
                placeholder="Telefono"
                value={editTelefono}
                onChangeText={setEditTelefono}
                keyboardType="phone-pad"
                placeholderTextColor="#BDC3C7"
              />

              {/* 🔒 Selector de rol: SOLO visible para ADMIN */}
              {miRol === "ADMIN" && (
                <>
                  <Text style={[styles.seccionTitulo, { marginTop: 20 }]}>Rol</Text>
                  <View style={styles.opcionesRow}>
                    {ROLES_DISPONIBLES.map((rol) => (
                      <TouchableOpacity
                        key={rol}
                        style={[
                          styles.pill,
                          editRol === rol && {
                            backgroundColor: getColorPorRol(rol),
                            borderColor: getColorPorRol(rol),
                          },
                        ]}
                        onPress={() => setEditRol(rol)}
                      >
                        <Text
                          style={[
                            styles.pillText,
                            editRol === rol && styles.pillTextSelected,
                          ]}
                        >
                          {rol}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}

              {/* Botón guardar */}
              <View style={styles.modalActions}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={styles.btnGuardarModal}
                  onPress={handleGuardar}
                  disabled={guardando}
                >
                  {guardando ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <Text style={styles.txtBotonBlanco}>Guardar Cambios</Text>
                  )}
                </TouchableOpacity>

                {/* 🔴 Eliminar usuario: SOLO admin y NO puede eliminarse a sí mismo */}
                {miRol === "ADMIN" && usuarioEditando?.id !== miUsuario?.id && (
                  <TouchableOpacity
                    style={styles.btnEliminarModal}
                    onPress={handleEliminarUsuario}
                  >
                    <Ionicons name="trash-outline" size={20} color="#E74C3C" />
                    <Text style={styles.txtEliminarModal}>
                      Eliminar Definitivamente
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ==============================================================
//  ESTILOS
//  Reciclados de CitasAdmin.tsx (ticket cards, modal, pills).
//  Misma identidad visual para toda la app.
// ==============================================================
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
  // ---- Ticket cards (reciclado de CitasAdmin.tsx) ----
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
    fontSize: 18,
    fontWeight: "900",
    color: "#2C3E50",
    marginLeft: 6,
    flexShrink: 1,
  },
  ticketEmail: {
    fontSize: 13,
    color: "#7F8C8D",
    marginLeft: 6,
    fontWeight: "400",
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
  // ---- Perfil (vista CLIENTE/DOCTOR) ----
  perfilContainer: {
    flex: 1,
    alignItems: "center",
    paddingTop: 40,
    paddingHorizontal: 30,
  },
  avatarGrande: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#E1F0FA",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
    shadowColor: "#3498DB",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  perfilNombre: {
    fontSize: 24,
    fontWeight: "900",
    color: "#2C3E50",
    textAlign: "center",
  },
  badgeRol: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 8,
  },
  badgeTextoRol: {
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  perfilEmail: {
    fontSize: 16,
    color: "#7F8C8D",
    marginTop: 12,
    fontWeight: "600",
  },
  perfilTelefono: {
    fontSize: 16,
    color: "#7F8C8D",
    marginTop: 6,
    fontWeight: "600",
  },
  btnEditarPerfil: {
    flexDirection: "row",
    backgroundColor: "#3498DB",
    paddingHorizontal: 25,
    paddingVertical: 14,
    borderRadius: 15,
    alignItems: "center",
    marginTop: 30,
    shadowColor: "#3498DB",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 4,
  },
  txtEditarPerfil: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 16,
    marginLeft: 8,
  },
  emptyContainer: { alignItems: "center", marginTop: 60 },
  emptyText: { color: "#95A5A6", marginTop: 15, fontSize: 16, textAlign: "center" },
  // ---- Modal (reciclado de CitasAdmin.tsx) ----
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
    marginBottom: 10,
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    color: "#2C3E50",
    borderWidth: 1,
    borderColor: "#E2E8F0",
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
  pillText: { color: "#7F8C8D", fontWeight: "bold", fontSize: 14 },
  pillTextSelected: { color: "#FFF" },
  modalActions: { marginTop: 35, paddingTop: 20, marginBottom: 30 },
  btnGuardarModal: {
    backgroundColor: "#27AE60",
    padding: 20,
    borderRadius: 15,
    alignItems: "center",
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
  // ---- Botón eliminar (reciclado de CitasAdmin.tsx) ----
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
