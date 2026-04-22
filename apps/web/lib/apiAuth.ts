import { supabase } from "@/lib/supabase";

export async function getAuthenticatedHeaders(
  headers: HeadersInit = {}
): Promise<Record<string, string>> {
  const normalizedHeaders = new Headers(headers);

  if (
    process.env.NODE_ENV === "test" ||
    process.env.NEXT_PUBLIC_E2E_BYPASS_AUTH === "true"
  ) {
    return Object.fromEntries(normalizedHeaders.entries());
  }

  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) {
    throw new Error("No se pudo validar la sesión actual.");
  }

  if (!session?.access_token) {
    throw new Error("Debes iniciar sesión para realizar esta acción.");
  }

  normalizedHeaders.set("Authorization", `Bearer ${session.access_token}`);
  return Object.fromEntries(normalizedHeaders.entries());
}
