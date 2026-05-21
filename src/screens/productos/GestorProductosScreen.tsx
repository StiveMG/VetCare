/**
 * ============================================================
 *  GESTOR PRODUCTOS SCREEN  (solo ADMIN)
 *  CRUD completo sobre la tabla PRODUCTOS en Supabase.
 *  Busca e importa productos desde la API pública
 *  Open Pet Food Facts, exclusiva para mascotas.
 *
 *  TABLA EN POSTGRESQL (esquema real):
 *    CREATE TABLE public."PRODUCTOS" (
 *      id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
 *      nombre character varying,
 *      descripcion character varying,
 *      precio bigint,
 *      stock bigint,
 *      categoria character varying,
 *      activo boolean,
 *      created_at timestamp with time zone NOT NULL DEFAULT now(),
 *      CONSTRAINT "PRODUCTOS_pkey" PRIMARY KEY (id)
 *    );
 *
 *  CAMPOS que usamos:
 *    nombre     → nombre del producto
 *    descripcion→ descripción corta
 *    precio     → precio en cents (bigint, ej: 1500 = $15.00)
 *    stock      → unidades disponibles
 *    categoria  → Alimento | Medicina | Higiene | Accesorios
 *    activo     → true/false (para ocultar sin borrar)
 * ============================================================
 *
 *  API PÚBLICA INTEGRADA: Open Pet Food Facts
 *  -------------------------------------------------------
 *  URL base: https://world.openpetfoodfacts.org/
 *  Autenticación: NINGUNA — es gratuita y abierta.
 *  Endpoints:
 *    - Búsqueda: /cgi/search.pl?search_terms=...&json=1
 *    - Código barras: /api/v2/product/{codigo}.json
 *
 *  ¿Por qué Open Pet Food Facts y no otra?
 *  - Es UNA BASE DE DATOS EXCLUSIVA DE ALIMENTO PARA MASCOTAS
 *    (no devuelve comida humana como Open Pet Food Facts)
 *  - No requiere API key
 *  - Datos abiertos (Open Data)
 *  - Incluye imágenes de productos
 *  - Misma API que Open Pet Food Facts (cambio de dominio)
 * ============================================================
 */

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Image,
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

// -------------------------------------------------------
//  CATEGORIAS: son las que existen en la tabla PRODUCTOS.
//  Coinciden 1 a 1 con los colores de getColorPorCategoria().
// -------------------------------------------------------
const CATEGORIAS = ["Alimento", "Medicina", "Higiene", "Accesorios"];

/**
 * inferirCategoria: recibe el texto de categorías de Open Pet Food Facts
 * y devuelve una de nuestras 4 categorías locales.
 *
 * @param categories - string con categorías de la API (ej: "Dog food, Pet food")
 * @returns "Alimento" | "Medicina" | "Higiene" | "Accesorios"
 *
 *  LÓGICA PARA DUMMIES:
 *    Si la API dice "Dog", "Cat" o "Pet" → es Alimento.
 *    Si dice "medic", "health" → es Medicina.
 *    Si dice "shampoo", "hygiene" → es Higiene.
 *    Si no sabemos → Accesorios (categoría genérica).
 */
function inferirCategoria(categories?: string): string {
  if (!categories) return "Accesorios";
  const c = categories.toLowerCase();
  if (c.includes("dog") || c.includes("cat") || c.includes("pet") || c.includes("alimento")) return "Alimento";
  if (c.includes("medic") || c.includes("health") || c.includes("vitamin")) return "Medicina";
  if (c.includes("hygiene") || c.includes("shampoo") || c.includes("clean")) return "Higiene";
  return "Accesorios";
}

export default function GestorProductosScreen() {
  const navigation = useNavigation();

  // -------------------------------------------------------
  //  1. ESTADO: productos locales (los que están en Supabase)
  // -------------------------------------------------------
  const [productos, setProductos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // -------------------------------------------------------
  //  2. ESTADO: modal de crear/editar producto
  // -------------------------------------------------------
  const [modalVisible, setModalVisible] = useState(false);
  const [productoEditando, setProductoEditando] = useState<any>(null);
  const [nuevoNombre, setNuevoNombre] = useState("");
  const [nuevaDescripcion, setNuevaDescripcion] = useState("");
  const [nuevoPrecio, setNuevoPrecio] = useState("");
  const [nuevoStock, setNuevoStock] = useState("");
  const [nuevaCategoria, setNuevaCategoria] = useState("");
  const [codigoBarras, setCodigoBarras] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [modoCrear, setModoCrear] = useState(false);

  // -------------------------------------------------------
  //  3. ESTADO: búsqueda en Open Pet Food Facts
  // -------------------------------------------------------
  const [buscandoApi, setBuscandoApi] = useState(false);
  const [terminoBusqueda, setTerminoBusqueda] = useState("");
  const [resultadosApi, setResultadosApi] = useState<any[]>([]);
  const [buscando, setBuscando] = useState(false);

  // -------------------------------------------------------
  //  4. CARGA INICIAL: trae todos los productos de Supabase
  // -------------------------------------------------------
  useEffect(() => {
    fetchProductos();
  }, []);

  // -------------------------------------------------------
  //  fetchProductos: SELECT * FROM PRODUCTOS ORDER BY nombre
  //  Esto llama a la API REST de Supabase automáticamente:
  //    GET https://xxx.supabase.co/rest/v1/PRODUCTOS?order=nombre.asc
  // -------------------------------------------------------
  const fetchProductos = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("PRODUCTOS")
      .select("*")
      .order("nombre", { ascending: true });
    if (data) setProductos(data);
    setLoading(false);
  };

  // -------------------------------------------------------
  //  5. BUSCAR EN OPEN PET FOOD FACTS (SOLO MASCOTAS)
  //
  //  A diferencia de Open Pet Food Facts (que mezcla comida humana
  //  y mascotas), Open Pet Food Facts SOLO tiene productos
  //  para mascotas. Por eso NO necesitamos el filtro
  //  tag_0=pet+food — ya viene implícito en la base de datos.
  //
  //  Endpoint:
  //    GET /cgi/search.pl?search_terms={query}&json=1&page_size=20
  //  -------------------------------------------------------
  const buscarEnApi = async () => {
    if (!terminoBusqueda.trim()) {
      Alert.alert("Aviso", "Escribe un termino de busqueda (ej: dog food, cat treats).");
      return;
    }
    setBuscando(true);
    setBuscandoApi(true);
    try {
      // Open Pet Food Facts = solo mascotas, sin filtros extra
      const resp = await fetch(
        `https://world.openpetfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(terminoBusqueda)}&json=1&page_size=20`
      );
      const data = await resp.json();
      if (data.products && data.products.length > 0) {
        setResultadosApi(data.products);
      } else {
        setResultadosApi([]);
        Alert.alert("Sin resultados", "No se encontraron productos. Intenta con: dog, cat, pet.");
      }
    } catch {
      Alert.alert("Error", "No se pudo conectar con Open Pet Food Facts.");
      setResultadosApi([]);
    }
    setBuscando(false);
  };

  // -------------------------------------------------------
  //  importarDeApi: INSERT del producto desde Open Pet Food Facts
  //  a la tabla PRODUCTOS de Supabase.
  //
  //  Mapeo de campos (API → nuestra DB):
  //    API: product_name       → nuestra DB: nombre
  //    API: generic_name       → nuestra DB: descripcion
  //    API: product_quantity   → nuestra DB: precio (estimado)
  //    API: categories         → nuestra DB: categoria (inferida)
  //    (no existe en API)      → nuestra DB: stock (default 10)
  //    (no existe en API)      → nuestra DB: activo (default true)
  // -------------------------------------------------------
  const importarDeApi = async (product: any) => {
    const nombre = product.product_name || "Producto sin nombre";
    const descripcion = product.generic_name || product.categories || "";
    const categoria = inferirCategoria(product.categories);
    // El precio se estima: cantidad del producto * 50 cents
    // Ej: 2000g → $1000 (puede editarse después)
    const precio = product.product_quantity ? Math.round(product.product_quantity * 50) : 100;
    const stock = 10;

    const { error } = await supabase.from("PRODUCTOS").insert([{
      nombre,
      descripcion,
      precio,
      stock,
      categoria,
      activo: true,
    }]);

    if (error) {
      Alert.alert("Error", error.message);
    } else {
      Alert.alert("Importado", `"${nombre}" agregado al inventario local.`);
      fetchProductos();
    }
  };

  // -------------------------------------------------------
  //  6. FUNCIONES DEL MODAL (Crear / Editar)
  // -------------------------------------------------------
  const abrirModalCrear = () => {
    setProductoEditando(null);
    setNuevoNombre("");
    setNuevaDescripcion("");
    setNuevoPrecio("");
    setNuevoStock("");
    setNuevaCategoria("");
    setCodigoBarras("");
    setModoCrear(true);
    setModalVisible(true);
  };

  const abrirModalEdicion = (producto: any) => {
    setProductoEditando(producto);
    setNuevoNombre(producto.nombre ?? "");
    setNuevaDescripcion(producto.descripcion ?? "");
    setNuevoPrecio(producto.precio?.toString() ?? "");
    setNuevoStock(producto.stock?.toString() ?? "");
    setNuevaCategoria(producto.categoria ?? "");
    setCodigoBarras("");
    setModoCrear(false);
    setModalVisible(true);
  };

  const cerrarModal = () => {
    setModalVisible(false);
    setProductoEditando(null);
  };

  // -------------------------------------------------------
  //  buscarPorCodigo: autocompleta el formulario con datos
  //  desde Open Pet Food Facts usando código de barras.
  //  Endpoint: /api/v2/product/{barcode}.json
  // -------------------------------------------------------
  const buscarPorCodigo = async () => {
    if (!codigoBarras) return;
    try {
      const resp = await fetch(
        `https://world.openpetfoodfacts.org/api/v2/product/${codigoBarras}.json`
      );
      const data = await resp.json();
      if (data.status === 1) {
        setNuevoNombre(data.product.product_name || "");
        setNuevaDescripcion(data.product.generic_name || "");
        Alert.alert("Producto encontrado", "Datos autocompletados desde Open Pet Food Facts.");
      } else {
        Alert.alert("No encontrado", "Ese codigo de barras no existe.");
      }
    } catch {
      Alert.alert("Error", "No se pudo conectar con Open Pet Food Facts.");
    }
  };

  // -------------------------------------------------------
  //  handleGuardar: INSERT (crear) o UPDATE (editar)
  //  Depende de la variable "modoCrear".
  // -------------------------------------------------------
  const handleGuardar = async () => {
    if (!nuevoNombre) {
      Alert.alert("Aviso", "El nombre del producto es obligatorio.");
      return;
    }
    setGuardando(true);
    const payload = {
      nombre: nuevoNombre,
      descripcion: nuevaDescripcion,
      precio: nuevoPrecio ? parseInt(nuevoPrecio, 10) : null,
      stock: nuevoStock ? parseInt(nuevoStock, 10) : 0,
      categoria: nuevaCategoria,
      activo: true,
    };

    if (modoCrear) {
      // INSERT: POST /rest/v1/PRODUCTOS
      const { error } = await supabase.from("PRODUCTOS").insert([payload]);
      setGuardando(false);
      if (error) Alert.alert("Error", error.message);
      else {
        Alert.alert("Exito", "Producto creado.");
        cerrarModal();
        fetchProductos();
      }
    } else {
      // UPDATE: PATCH /rest/v1/PRODUCTOS?id=eq.{id}
      const { error } = await supabase
        .from("PRODUCTOS")
        .update(payload)
        .eq("id", productoEditando.id);
      setGuardando(false);
      if (error) Alert.alert("Error", error.message);
      else {
        Alert.alert("Exito", "Producto actualizado.");
        cerrarModal();
        fetchProductos();
      }
    }
  };

  // -------------------------------------------------------
  //  handleEliminar: DELETE /rest/v1/PRODUCTOS?id=eq.{id}
  // -------------------------------------------------------
  const handleEliminar = () => {
    Alert.alert(
      "Eliminar Definitivamente",
      "Esto borrara el producto de la base de datos. Continuar?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            const { error } = await supabase
              .from("PRODUCTOS")
              .delete()
              .eq("id", productoEditando.id);
            if (error) {
              Alert.alert("Error al eliminar", error.message);
            } else {
              cerrarModal();
              fetchProductos();
            }
          },
        },
      ],
    );
  };

  // -------------------------------------------------------
  //  getColorPorCategoria: asigna un color a cada categoría
  //  para la barra lateral de la tarjeta (ticketBorde).
  // -------------------------------------------------------
  const getColorPorCategoria = (categoria: string) => {
    switch (categoria) {
      case "Alimento":  return "#27AE60";  // verde
      case "Medicina":  return "#3498DB";  // azul
      case "Higiene":   return "#9B59B6";  // morado
      case "Accesorios":return "#E67E22";  // naranja
      default:          return "#95A5A6";  // gris
    }
  };

  // ============================================================
  //  7. RENDER PRINCIPAL
  // ============================================================
  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER con gradiente oscuro (reciclado de CitasAdmin.tsx) */}
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
          {buscandoApi ? "Open Pet Food Facts" : "Inventario"}
        </Text>
        <TouchableOpacity
          style={styles.botonVolver}
          onPress={abrirModalCrear}
        >
          <Ionicons name="add" size={28} color="#FFF" />
        </TouchableOpacity>
      </LinearGradient>

      {/* =========================================================
          BARRA DE BÚSQUEDA EN OPEN PET FOOD FACTS
          Open Pet Food Facts SOLO contiene productos para mascotas.
          No necesita filtro tag_0=pet+food (es la base completa).
          ========================================================= */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar en Open Pet Food Facts (ej: dog, cat)..."
          placeholderTextColor="#95A5A6"
          value={terminoBusqueda}
          onChangeText={setTerminoBusqueda}
          onSubmitEditing={buscarEnApi}
        />
        <TouchableOpacity
          style={styles.searchButton}
          onPress={buscarEnApi}
        >
          {buscando ? (
            <ActivityIndicator color="#FFF" size="small" />
          ) : (
            <Ionicons name="search" size={22} color="#FFF" />
          )}
        </TouchableOpacity>
      </View>

      {/* Botón para volver a productos locales (solo visible en modo API) */}
      {buscandoApi && (
        <TouchableOpacity
          style={styles.volverLocalBtn}
          onPress={() => {
            setBuscandoApi(false);
            setResultadosApi([]);
            setTerminoBusqueda("");
          }}
        >
          <Ionicons name="arrow-back" size={16} color="#3498DB" />
          <Text style={styles.volverLocalText}>Volver a mi inventario</Text>
        </TouchableOpacity>
      )}

      {/* LISTA PRINCIPAL: productos locales O resultados de API */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#3498DB" />
        </View>
      ) : (
        <View style={styles.listaContainer}>
          <FlatList
            data={buscandoApi ? resultadosApi : productos}
            keyExtractor={(item, index) =>
              buscandoApi ? `api-${index}` : item.id.toString()
            }
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 30 }}
            renderItem={({ item }) => {
              // ====================================================
              //  RENDER A: Resultados de Open Pet Food Facts API
              //  (con imágenes del producto y badge "API")
              // ====================================================
              if (buscandoApi) {
                const nombre = item.product_name || "Sin nombre";
                const descrip = item.generic_name || item.categories || "";
                const categoria = inferirCategoria(item.categories);
                const colorCategoria = getColorPorCategoria(categoria);
                // Open Pet Food Facts devuelve imágenes en image_url o image_thumb_url
                const imagenUrl = item.image_url || item.image_thumb_url || null;

                return (
                  <View style={styles.ticketCard}>
                    <View style={[styles.ticketBorde, { backgroundColor: colorCategoria }]} />
                    <View style={styles.ticketContenido}>
                      <View style={styles.ticketHeader}>
                        <View style={{ flex: 1 }}>
                          {/* Si hay imagen, la mostramos arriba del nombre */}
                          {imagenUrl && (
                            <Image
                              source={{ uri: imagenUrl }}
                              style={styles.apiImagen}
                              resizeMode="contain"
                            />
                          )}
                          <View style={styles.rowAlign}>
                            <MaterialCommunityIcons name="web" size={18} color="#3498DB" />
                            <Text style={styles.ticketNombre} numberOfLines={2}>{nombre}</Text>
                          </View>
                          {descrip ? (
                            <View style={[styles.rowAlign, { marginTop: 4 }]}>
                              <MaterialCommunityIcons name="label-outline" size={16} color={colorCategoria} />
                              <Text style={styles.ticketCategoria} numberOfLines={2}>{descrip}</Text>
                            </View>
                          ) : null}
                        </View>
                        <View style={[styles.badgeApi, { backgroundColor: colorCategoria + "20" }]}>
                          <Text style={[styles.badgeApiTexto, { color: colorCategoria }]}>API</Text>
                        </View>
                      </View>

                      <View style={styles.lineaPunteada} />

                      <View style={styles.ticketFooter}>
                        <View style={styles.infoRow}>
                          <MaterialCommunityIcons name="weight" size={16} color="#7F8C8D" />
                          <Text style={styles.textoInfo}>
                            {item.product_quantity ? `${item.product_quantity}g` : "Peso variable"}
                          </Text>
                        </View>
                        <TouchableOpacity
                          activeOpacity={0.7}
                          onPress={() => importarDeApi(item)}
                          style={styles.btnImportar}
                        >
                          <Ionicons name="download-outline" size={16} color="#FFF" />
                          <Text style={styles.txtImportar}>Importar</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                );
              }

              // ====================================================
              //  RENDER B: Productos locales (desde Supabase)
              //  Mismo estilo ticket que CitasAdmin.tsx
              // ====================================================
              const colorCategoria = getColorPorCategoria(item.categoria);
              const sinStock = (item.stock ?? 0) <= 0;

              return (
                <View style={[styles.ticketCard, sinStock && styles.ticketSinStock]}>
                  <View style={[styles.ticketBorde, { backgroundColor: colorCategoria }]} />
                  <View style={styles.ticketContenido}>
                    <View style={styles.ticketHeader}>
                      <View>
                        <View style={styles.rowAlign}>
                          <MaterialCommunityIcons name="package-variant-closed" size={18} color="#2C3E50" />
                          <Text style={[styles.ticketNombre, sinStock && styles.textoTachado]}>
                            {item.nombre}
                          </Text>
                        </View>
                        <View style={[styles.rowAlign, { marginTop: 4 }]}>
                          <MaterialCommunityIcons name="label-outline" size={16} color={colorCategoria} />
                          <Text style={styles.ticketCategoria}>
                            {item.categoria ?? "Sin categoria"}
                          </Text>
                        </View>
                      </View>
                      <View style={[styles.badgeTicket, { backgroundColor: colorCategoria + "20" }]}>
                        <Text style={[styles.badgeTicketTexto, { color: colorCategoria }]}>
                          {item.activo ? "ACTIVO" : "INACTIVO"}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.lineaPunteada} />

                    <View style={styles.ticketFooter}>
                      <View style={{ flex: 1 }}>
                        <View style={styles.infoRow}>
                          <Ionicons name="cash-outline" size={16} color="#7F8C8D" />
                          <Text style={styles.textoInfo}>${item.precio ?? 0}</Text>
                        </View>
                        <View style={[styles.infoRow, { marginTop: 6 }]}>
                          <MaterialCommunityIcons name="package-variant" size={16} color="#7F8C8D" />
                          <Text style={styles.textoInfo}>Stock: {item.stock ?? 0}</Text>
                        </View>
                      </View>

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
                <MaterialCommunityIcons
                  name={buscandoApi ? "paw-off" : "package-variant-closed"}
                  size={70}
                  color="#E2E8F0"
                />
                <Text style={styles.emptyText}>
                  {buscandoApi
                    ? "No se encontraron productos para mascotas. Intenta buscar: dog, cat, pet food."
                    : "No hay productos. Presiona + o importa desde Open Pet Food Facts."}
                </Text>
              </View>
            }
          />
        </View>
      )}

      {/* ============================================================
          MODAL: Crear / Editar producto
          Misma estructura que CitasAdmin.tsx.
          Los campos coinciden 1 a 1 con la tabla PRODUCTOS:
            nombre, descripcion, precio, stock, categoria
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
                {modoCrear ? "Nuevo Producto" : "Editar Producto"}
              </Text>
              <TouchableOpacity onPress={cerrarModal}>
                <Ionicons name="close-circle" size={32} color="#BDC3C7" />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Código de barras (solo en crear) — busca en Open Pet Food Facts */}
              {modoCrear && (
                <>
                  <Text style={styles.seccionTitulo}>Codigo de Barras (opcional)</Text>
                  <View style={styles.barcodeRow}>
                    <TextInput
                      style={styles.inputBarcode}
                      placeholder="Ej: 7622210449283"
                      value={codigoBarras}
                      onChangeText={setCodigoBarras}
                      keyboardType="numeric"
                      placeholderTextColor="#BDC3C7"
                    />
                    <TouchableOpacity
                      style={styles.btnBuscarBarcode}
                      onPress={buscarPorCodigo}
                    >
                      <Ionicons name="search" size={20} color="#FFF" />
                    </TouchableOpacity>
                  </View>
                </>
              )}

              {/* Campo: nombre (SQL: character varying) */}
              <Text style={styles.seccionTitulo}>Nombre *</Text>
              <TextInput
                style={styles.input}
                placeholder="Nombre del producto"
                value={nuevoNombre}
                onChangeText={setNuevoNombre}
                placeholderTextColor="#BDC3C7"
              />

              {/* Campo: descripcion (SQL: character varying) */}
              <Text style={[styles.seccionTitulo, { marginTop: 20 }]}>Descripcion</Text>
              <TextInput
                style={styles.input}
                placeholder="Descripcion del producto"
                value={nuevaDescripcion}
                onChangeText={setNuevaDescripcion}
                placeholderTextColor="#BDC3C7"
              />

              {/* Campos: precio (SQL: bigint) y stock (SQL: bigint) */}
              <View style={styles.rowCampos}>
                <View style={{ flex: 1, marginRight: 10 }}>
                  <Text style={styles.seccionTitulo}>Precio</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="0"
                    value={nuevoPrecio}
                    onChangeText={setNuevoPrecio}
                    keyboardType="numeric"
                    placeholderTextColor="#BDC3C7"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.seccionTitulo}>Stock</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="0"
                    value={nuevoStock}
                    onChangeText={setNuevoStock}
                    keyboardType="numeric"
                    placeholderTextColor="#BDC3C7"
                  />
                </View>
              </View>

              {/* Campo: categoria (SQL: character varying) */}
              <Text style={[styles.seccionTitulo, { marginTop: 20 }]}>Categoria</Text>
              <View style={styles.opcionesRow}>
                {CATEGORIAS.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.pill,
                      nuevaCategoria === cat && {
                        backgroundColor: getColorPorCategoria(cat),
                        borderColor: getColorPorCategoria(cat),
                      },
                    ]}
                    onPress={() => setNuevaCategoria(cat)}
                  >
                    <Text style={[styles.pillText, nuevaCategoria === cat && styles.pillTextSelected]}>
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Botones del modal */}
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
                    <Text style={styles.txtBotonBlanco}>
                      {modoCrear ? "Crear Producto" : "Guardar Cambios"}
                    </Text>
                  )}
                </TouchableOpacity>
                {!modoCrear && (
                  <TouchableOpacity
                    style={styles.btnEliminarModal}
                    onPress={handleEliminar}
                  >
                    <Ionicons name="trash-outline" size={20} color="#E74C3C" />
                    <Text style={styles.txtEliminarModal}>Eliminar Definitivamente</Text>
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
//  La mayoría está reciclado de CitasAdmin.tsx.
//  Los estilos NUEVOS para la API son:
//    - searchContainer / searchInput / searchButton → barra API
//    - apiImagen → imagen del producto en API
//    - volverLocalBtn / volverLocalText → botón retorno
//    - badgeApi / badgeApiTexto → badge "API"
//    - btnImportar / txtImportar → botón importar
//    - inputBarcode / btnBuscarBarcode → código barras
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
  // ---- NUEVO: Barra de búsqueda en Open Pet Food Facts ----
  searchContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 5,
    alignItems: "center",
  },
  searchInput: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 15,
    color: "#2C3E50",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginRight: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  searchButton: {
    backgroundColor: "#3498DB",
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#3498DB",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  // ---- Botón volver a inventario local ----
  volverLocalBtn: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 20,
    marginTop: 10,
    paddingVertical: 8,
  },
  volverLocalText: {
    color: "#3498DB",
    fontWeight: "700",
    fontSize: 14,
    marginLeft: 6,
  },
  listaContainer: { flex: 1, paddingHorizontal: 20, paddingTop: 15 },
  emptyContainer: { alignItems: "center", marginTop: 60 },
  emptyText: {
    color: "#95A5A6",
    marginTop: 15,
    fontSize: 16,
    textAlign: "center",
  },
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
  ticketSinStock: { opacity: 0.65 },
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
  textoTachado: { textDecorationLine: "line-through", color: "#95A5A6" },
  ticketCategoria: {
    fontSize: 14,
    color: "#7F8C8D",
    marginLeft: 6,
    fontWeight: "600",
    flexShrink: 1,
  },
  badgeTicket: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  badgeTicketTexto: { fontSize: 11, fontWeight: "900", letterSpacing: 0.5 },
  // ---- NUEVO: Badge "API" para resultados externos ----
  badgeApi: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  badgeApiTexto: { fontSize: 10, fontWeight: "900", letterSpacing: 0.5 },
  // ---- NUEVO: Imagen del producto de Open Pet Food Facts ----
  apiImagen: {
    width: "100%",
    height: 120,
    borderRadius: 10,
    marginBottom: 10,
    backgroundColor: "#F8FAFC",
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
  // ---- NUEVO: Botón importar desde API ----
  btnImportar: {
    flexDirection: "row",
    backgroundColor: "#27AE60",
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#27AE60",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  txtImportar: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 13,
    marginLeft: 6,
  },
  // ---- Barcode (código de barras) ----
  barcodeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  inputBarcode: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    color: "#2C3E50",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginRight: 10,
  },
  btnBuscarBarcode: {
    backgroundColor: "#3498DB",
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  // ---- Inputs del modal ----
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
  rowCampos: { flexDirection: "row", marginTop: 20 },
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
