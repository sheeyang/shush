import { redirect } from "next/navigation";

export default function Home() {
  // Redirect to the ping page by default
  redirect("/ping");
}