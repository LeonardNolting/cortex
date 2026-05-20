import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./App.css";
import { AssignmentList } from "./screens/AssignmentList";
import { AssignmentEdit } from "./screens/AssignmentEdit";
import { SettingsScreen } from "./screens/Settings";
import { PageLayout } from "./components/PageLayout";

function App() {
  return (
    <BrowserRouter>
      <PageLayout>
        <Routes>
          <Route path="/" element={<AssignmentList />} />
          <Route path="/edit/:id" element={<AssignmentEdit />} />
          <Route path="/settings" element={<SettingsScreen />} />
        </Routes>
      </PageLayout>
    </BrowserRouter>
  );
}

export default App;
