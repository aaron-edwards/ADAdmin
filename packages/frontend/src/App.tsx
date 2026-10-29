import { LogsCard } from "./components/LogsCard";
import { ServerCard } from "./components/ServerCard";

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-2xl space-y-4 px-4 py-6">
        <header>
          <h1 className="text-2xl font-bold text-gray-900">ADAdmin</h1>
          <p className="text-sm text-gray-600">Satisfactory Server Manager</p>
        </header>
        <ServerCard />
        <LogsCard />
      </div>
    </div>
  );
}

export default App;
