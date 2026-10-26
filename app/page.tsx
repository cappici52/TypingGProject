import { getChatGPTUser } from "./chatgpt-auth";
import Game from "../components/game/Game";

export const dynamic = "force-dynamic";

export default async function Home() {
  const user = await getChatGPTUser();
  return <Game user={user ? { name: user.displayName } : null} />;
}
