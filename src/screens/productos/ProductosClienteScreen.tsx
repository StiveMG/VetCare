/**
 * ============================================================
 *  PRODUCTOS CLIENTE SCREEN  (solo CLIENTE puede ver)
 *  ============================================================
 *  Propósito: El cliente ve los productos que el ADMIN agregó
 *  a la tienda. Solo lectura — NO puede crear, editar ni borrar.
 *
 *  ¿Cómo llegan los productos acá?
 *    El ADMIN los agrega desde GestorProductosScreen (CRUD).
 *    Quedan guardados en la tabla PRODUCTOS de Supabase.
 *    El cliente solo hace SELECT desde esta pantalla.
 *
 *  TABLA EN POSTGRESQL:
 *    PRODUCTOS (id, nombre, descripcion, precio, stock, categoria, activo)
 *
 *  DIFERENCIAS con GestorProductosScreen (la del admin):
 *    - NO tiene botón "+" para crear
 *    - NO tiene modal de edición
 *    - NO tiene botón "Editar" en las tarjetas
 *    - NO tiene búsqueda en API Open Food Facts
 *    - NO puede eliminar productos
 *    - SOLO muestra productos con activo = true
 *    - SOLO muestra productos con stock > 0
 * ============================================================
 */

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import { supabase } from "../../../utils/supabase";

/**
 * getColorPorCategoria: misma función que en GestorProductosScreen.
 * Asigna un color a cada categoría para mantener consistencia visual.
 */
function getColorPorCategoria(categoria: string): string {
  switch (categoria) {
    case "Alimento":   return "#27AE60";
    case "Medicina":   return "#3498DB";
    case "Higiene":    return "#9B59B6";
    case "Accesorios": return "#E67E22";
    default:           return "#95A5A6";
  }
}

export default function ProductosClienteScreen() {
  const navigation = useNavigation();

  // -------------------------------------------------------
  //  Estado: productos disponibles (activos y con stock)
  // -------------------------------------------------------
  const [productos, setProductos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // -------------------------------------------------------
  //  Carga inicial: SOLO productos activos CON stock
  //  El admin decide qué productos están disponibles.
  // -------------------------------------------------------
  useEffect(() => {
    fetchProductos();
  }, []);

  // -------------------------------------------------------
  //  fetchProductos: SELECT de productos disponibles.
  //  Filtros:
  //    activo = true  → el admin no los ocultó
  //    stock > 0      → hay unidades disponibles
  //  Orden: por nombre alfabéticamente.
  // -------------------------------------------------------
  const fetchProductos = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("PRODUCTOS")
      .select("*")
      .eq("activo", true)
      .gt("stock", 0)
      .order("nombre", { ascending: true });
    if (data) setProductos(data);
    setLoading(false);
  };

  // ==========================================================
  //  RENDER
  // ==========================================================
  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER con gradiente (mismo estilo que toda la app) */}
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
        <Text style={styles.tituloHeader}>Productos Disponibles</Text>
        <View style={{ width: 28 }} />
      </LinearGradient>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#3498DB" />
        </View>
      ) : (
        <View style={styles.listaContainer}>
          <FlatList
            data={productos}
            keyExtractor={(item) => item.id.toString()}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 30 }}
            renderItem={({ item }) => {
              const colorCategoria = getColorPorCategoria(item.categoria);
              const sinStock = (item.stock ?? 0) <= 0;

              return (
                <View style={styles.ticketCard}>
                  {/* Barra lateral de color según categoría */}
                  <View style={[styles.ticketBorde, { backgroundColor: colorCategoria }]} />

                  <View style={styles.ticketContenido}>
                    {/* Header: nombre + badge categoría */}
                    <View style={styles.ticketHeader}>
                      <View>
                        <View style={styles.rowAlign}>
                          <MaterialCommunityIcons
                            name="package-variant-closed"
                            size={20}
                            color="#2C3E50"
                          />
                          <Text style={styles.ticketNombre}>{item.nombre}</Text>
                        </View>
                        {/* Descripción si existe */}
                        {item.descripcion ? (
                          <View style={[styles.rowAlign, { marginTop: 4 }]}>
                            <MaterialCommunityIcons
                              name="text-box-outline"
                              size={14}
                              color="#7F8C8D"
                            />
                            <Text style={styles.ticketDescripcion}>
                              {item.descripcion}
                            </Text>
                          </View>
                        ) : null}
                      </View>
                      {/* Badge de categoría */}
                      <View style={[styles.badgeTicket, { backgroundColor: colorCategoria + "20" }]}>
                        <Text style={[styles.badgeTicketTexto, { color: colorCategoria }]}>
                          {item.categoria ?? "General"}
                        </Text>
                      </View>
                    </View>

                    {/* Línea punteada separadora */}
                    <View style={styles.lineaPunteada} />

                    {/* Footer: precio + stock */}
                    <View style={styles.ticketFooter}>
                      <View style={styles.rowAlign}>
                        <Ionicons name="cash-outline" size={18} color="#27AE60" />
                        <Text style={styles.textoPrecio}>${item.precio ?? 0}</Text>
                      </View>
                      <View style={styles.rowAlign}>
                        <MaterialCommunityIcons
                          name="package-variant"
                          size={16}
                          color={sinStock ? "#E74C3C" : "#7F8C8D"}
                        />
                        <Text style={[styles.textoStock, sinStock && { color: "#E74C3C" }]}>
                          {sinStock ? "Agotado" : `Stock: ${item.stock}`}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              );
            }}
            // Mensaje cuando no hay productos disponibles
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <MaterialCommunityIcons
                  name="store-off-outline"
                  size={70}
                  color="#E2E8F0"
                />
                <Text style={styles.emptyText}>
                  No hay productos disponibles por el momento.{'\n'}
                  Vuelve mas tarde o consulta con el administrador.
                </Text>
              </View>
            }
          />
        </View>
      )}
    </SafeAreaView>
  );
}

// ==============================================================
//  ESTILOS
//  Reciclados de GestorProductosScreen.tsx (que a su vez los
//  recicló de CitasAdmin.tsx). Misma identidad visual.
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
  emptyContainer: { alignItems: "center", marginTop: 60 },
  emptyText: {
    color: "#95A5A6",
    marginTop: 15,
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
  },
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
  ticketDescripcion: {
    fontSize: 13,
    color: "#7F8C8D",
    marginLeft: 6,
    fontWeight: "400",
    flexShrink: 1,
    marginTop: 2,
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
    alignItems: "center",
  },
  textoPrecio: {
    marginLeft: 6,
    color: "#27AE60",
    fontWeight: "900",
    fontSize: 18,
  },
  textoStock: {
    marginLeft: 4,
    color: "#7F8C8D",
    fontWeight: "600",
    fontSize: 13,
  },
});
