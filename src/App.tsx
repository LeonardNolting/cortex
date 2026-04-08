import "./App.css";
import Database from '@tauri-apps/plugin-sql';

const db = await Database.load('sqlite:test.db');

function App() {
    return (
        <main className="container">
            {/* TODO */}
        </main>
    );
}

export default App;
