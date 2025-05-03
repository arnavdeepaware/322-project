import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function signInWithGoogle() {
  console.log("signing in with google");
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
  });

  if (error) console.error("Error signing in:", error);
  return data;
}

export async function getDocumentsByUserId(id) {
  const { data, error } = await supabase
    .from("documents")
    .select()
    .eq("owner_id", id);

  if (error) {
    console.error("Error fetching documents:", error);
    return null;
  }

  return data;
}
