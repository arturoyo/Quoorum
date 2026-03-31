"use server";

import { login, signup, logout, changePassword, getCurrentUser } from "./auth";

export interface AuthActionResult {
  success: boolean;
  error?: string;
  user?: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}

export async function loginAction(
  email: string,
  password: string
): Promise<AuthActionResult> {
  try {
    const user = await login(email, password);
    return { success: true, user };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error al iniciar sesion",
    };
  }
}

export async function signupAction(
  email: string,
  password: string,
  name: string
): Promise<AuthActionResult> {
  try {
    const user = await signup(email, password, name);
    return { success: true, user };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error al crear la cuenta",
    };
  }
}

export async function logoutAction(): Promise<AuthActionResult> {
  try {
    await logout();
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error al cerrar sesion",
    };
  }
}

export async function changePasswordAction(
  currentPassword: string,
  newPassword: string
): Promise<AuthActionResult> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: "No autenticado" };
    }
    await changePassword(user.id, currentPassword, newPassword);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error al cambiar la contrasena",
    };
  }
}

export async function getSessionAction(): Promise<AuthActionResult> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: "No autenticado" };
    }
    return { success: true, user };
  } catch {
    return { success: false, error: "Error al obtener la sesion" };
  }
}
