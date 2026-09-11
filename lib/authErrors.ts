export function traduireErreurAuth(message: string): string {
  const map: Record<string, string> = {
    "Invalid login credentials": "Email ou mot de passe incorrect.",
    "User already registered": "Un compte existe déjà avec cet email.",
    "Password should be at least 6 characters.":
      "Le mot de passe doit contenir au moins 6 caractères.",
    "Unable to validate email address: invalid format":
      "Cette adresse email n'est pas valide.",
    "Email not confirmed": "Confirme ton email avant de te connecter.",
  };
  return map[message] ?? "Une erreur est survenue. Réessaie.";
}
