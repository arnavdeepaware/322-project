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

export async function incrementTokens(amount) {
  const { error } = await supabase.rpc("increment_tokens", { k: amount });

  if (error) {
    console.error("Failed to increment tokens:", error.message);
  }
}

export async function createDocument(userId, text) {
  const { data, error } = await supabase
    .from("documents")
    .insert([{ owner_id: userId, content: text }])
    .select();

  if (error) {
    console.error("Error creating document:", error);
    return null;
  }

  return data[0];
}

export async function updateDocument(document) {
  console.log("updating", document)

  const { data1, error1 } = await supabase
    .from("documents")
    .select()

  console.log(data1, error1);

  const { data, error } = await supabase
    .from("documents")
    .update({ content: document.content })
    .eq("id", document.id);


    console.log(data, error);

  if (error) {
    console.error("Error updating document:", error);
    return null;
  }

  return data?.[0];
}

export async function submitBlacklistRequest(word) {
  const { data, error } = await supabase.from("blacklist_requests").insert([
    {
      word: word,
    },
  ]);

  if (error) {
    console.error("Error submitting request:", error.message);
    return null;
  }

  return data;
}
