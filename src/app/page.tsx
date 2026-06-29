import { redirect } from "next/navigation";

export default function Home() {
  // Middleware decides: signed in -> dashboard, otherwise -> login.
  redirect("/dashboard");
}
