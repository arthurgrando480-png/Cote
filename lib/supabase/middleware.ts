import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Chemins accessibles sans être connecté.
const PUBLIC_PATHS = ["/login", "/signup", "/auth/callback"];

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT : ne pas retirer ce getUser(). Il rafraîchit le token
  // et doit être appelé avant toute logique de redirection.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isPublicPath = path === "/" || PUBLIC_PATHS.some((p) => path.startsWith(p));

  if (!user && !isPublicPath) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user && (path === "/login" || path === "/signup")) {
    const url = request.nextUrl.clone();
    url.pathname = "/rate";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
