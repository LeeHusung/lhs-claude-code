import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function Home() {
  const cookieStore = await cookies();
  const userId = cookieStore.get("taskflow_user_id");

  if (userId) {
    redirect("/board");
  } else {
    redirect("/login");
  }
}
