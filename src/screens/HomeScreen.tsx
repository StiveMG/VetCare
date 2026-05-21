import React from "react";
import RoleDashboard, { DashboardAction } from "../components/RoleDashboard";
import { useUser } from "../context/UserContext";

const adminActions: DashboardAction[] = [
  {
    title: "Usuarios y roles",
    description: "Crear, editar, desactivar usuarios y cambiar permisos.",
    icon: "account-supervisor-outline",
    color: "#3498DB",
    backgroundColor: "#E1F0FA",
    route: "GestorUsuarios",
  },
  {
    title: "Citas medicas",
    description: "Ver, crear, editar, cancelar o eliminar cualquier cita.",
    icon: "calendar-edit",
    color: "#27AE60",
    backgroundColor: "#E8F6EF",
    route: "GestorCitas",
  },
  {
    title: "Mascotas",
    description: "Administrar mascotas de todos los clientes.",
    icon: "dog",
    color: "#3498DB",
    backgroundColor: "#E1F0FA",
    route: "GestorMascotas",
  },
  {
    title: "Productos",
    description: "Gestionar inventario, precios y stock.",
    icon: "package-variant-closed",
    color: "#27AE60",
    backgroundColor: "#E8F6EF",
    route: "GestorProductos",
  },
];

const clienteActions: DashboardAction[] = [
  {
    title: "Mis citas",
    description: "Crear, editar o eliminar tus citas medicas.",
    icon: "calendar-heart",
    color: "#27AE60",
    backgroundColor: "#E8F6EF",
    route: "GestorCitas",
  },
  {
    title: "Mis mascotas",
    description: "Agregar, editar o eliminar tus mascotas.",
    icon: "paw",
    color: "#3498DB",
    backgroundColor: "#E1F0FA",
    route: "GestorMascotas",
  },
  {
    title: "Productos",
    description: "Ver productos disponibles en la tienda.",
    icon: "store-outline",
    color: "#27AE60",
    backgroundColor: "#E8F6EF",
    route: "ProductosCliente",
  },
  {
    title: "Mi perfil",
    description: "Ver y actualizar tus datos personales.",
    icon: "account-cog-outline",
    color: "#9B59B6",
    backgroundColor: "#F3F0FF",
    route: "GestorUsuarios",
  },
];

const doctorActions: DashboardAction[] = [
  {
    title: "Citas asignadas",
    description: "Consultar las citas medicas asignadas a tu usuario.",
    icon: "calendar-search",
    color: "#27AE60",
    backgroundColor: "#E8F6EF",
    route: "GestorCitas",
  },
  {
    title: "Mi perfil",
    description: "Ver y actualizar tus datos profesionales.",
    icon: "account-edit-outline",
    color: "#9B59B6",
    backgroundColor: "#F3F0FF",
    route: "GestorUsuarios",
  },
];

export default function HomeScreen() {
  const { role } = useUser();

  if (role === "ADMIN") {
    return <RoleDashboard roleLabel="ADMIN" actions={adminActions} />;
  }

  if (role === "DOCTOR") {
    return <RoleDashboard roleLabel="DOCTOR" actions={doctorActions} />;
  }

  return <RoleDashboard roleLabel="CLIENTE" actions={clienteActions} />;
}
