import AppLayout from "../components/AppLayout";
import TwinView from "./twin/twinView";

export default function Home() {
  return (
    <AppLayout>
      <h1>Hello :)</h1>
      <TwinView />
    </AppLayout>
  );
}
