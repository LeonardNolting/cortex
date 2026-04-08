import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./App.css";
import { AssignmentList } from "./screens/AssignmentList";
import { AssignmentEdit } from "./screens/AssignmentEdit";
import { SettingsScreen } from "./screens/Settings";

function App() {
  return (
    <BrowserRouter>
      <main className="container mx-auto py-10 px-4">
        <Routes>
          <Route path="/" element={<AssignmentList />} />
          <Route path="/edit/:id" element={<AssignmentEdit />} />
          <Route path="/settings" element={<SettingsScreen />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}

export default App;
