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
  },
  {
    title: "Citas medicas",
    description: "Ver, crear, editar, cancelar o eliminar cualquier cita.",
    icon: "calendar-edit",
    color: "#27AE60",
    backgroundColor: "#E8F6EF",
  },
  {
    title: "Mascotas",
    description: "Administrar mascotas de todos los clientes.",
    icon: "dog",
    color: "#3498DB",
    backgroundColor: "#E1F0FA",
  },
  {
    title: "Historial medico",
    description: "Consultar y administrar historiales clinicos.",
    icon: "clipboard-pulse-outline",
    color: "#E74C3C",
    backgroundColor: "#FEF0F0",
  },
  {
    title: "Servicios",
    description: "Gestionar servicios, precios, estados y doctores.",
    icon: "stethoscope",
    color: "#9B59B6",
    backgroundColor: "#F3F0FF",
  },
  {
    title: "Compras",
    description: "Revisar compras, productos, stock y facturacion.",
    icon: "cart-outline",
    color: "#27AE60",
    backgroundColor: "#E8F6EF",
  },
];

const clienteActions: DashboardAction[] = [
  {
    title: "Mis citas",
    description: "Crear, editar o eliminar tus citas medicas.",
    icon: "calendar-heart",
    color: "#27AE60",
    backgroundColor: "#E8F6EF",
  },
  {
    title: "Mis mascotas",
    description: "Agregar, editar o eliminar tus mascotas.",
    icon: "paw",
    color: "#3498DB",
    backgroundColor: "#E1F0FA",
  },
  {
    title: "Mi historial",
    description: "Consultar el historial medico de tus mascotas.",
    icon: "clipboard-text-outline",
    color: "#E74C3C",
    backgroundColor: "#FEF0F0",
  },
  {
    title: "Mi perfil",
    description: "Ver y actualizar tus datos personales.",
    icon: "account-cog-outline",
    color: "#9B59B6",
    backgroundColor: "#F3F0FF",
  },
];

const doctorActions: DashboardAction[] = [
  {
    title: "Citas asignadas",
    description: "Consultar las citas medicas asignadas a tu usuario.",
    icon: "calendar-search",
    color: "#27AE60",
    backgroundColor: "#E8F6EF",
  },
  {
    title: "Historial medico",
    description: "Consultar historiales medicos relacionados con tus citas.",
    icon: "clipboard-pulse-outline",
    color: "#3498DB",
    backgroundColor: "#E1F0FA",
  },
  {
    title: "Cancelar cita",
    description: "Cancelar una cita asignada cuando sea necesario.",
    icon: "calendar-remove",
    color: "#E74C3C",
    backgroundColor: "#FEF0F0",
  },
  {
    title: "Mi perfil",
    description: "Ver y actualizar tus datos profesionales.",
    icon: "account-edit-outline",
    color: "#9B59B6",
    backgroundColor: "#F3F0FF",
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
