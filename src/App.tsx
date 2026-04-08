import { useState } from "react";
import reactLogo from "./assets/react.svg";
import { invoke } from "@tauri-apps/api/core";
import "./App.css";
import Database from '@tauri-apps/plugin-sql';
import { exists, BaseDirectory } from '@tauri-apps/plugin-fs';
import {generateInvoice, InvoiceData} from "./rechnung.ts";

const db = await Database.load('sqlite:test.db');

function App() {
  const [greetMsg, setGreetMsg] = useState("");
  const [name, setName] = useState("");

  async function greet() {
    // Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
    setGreetMsg(await invoke("greet", { name }));
  }

  return (
    <main className="container">
      <h1>Welcome to Tauri + React</h1>

      <div className="row">
        <a href="https://vite.dev" target="_blank">
          <img src="/vite.svg" className="logo vite" alt="Vite logo" />
        </a>
        <a href="https://tauri.app" target="_blank">
          <img src="/tauri.svg" className="logo tauri" alt="Tauri logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <p>Click on the Tauri, Vite, and React logos to learn more.</p>

      <form
        className="row"
        onSubmit={(e) => {
          e.preventDefault();
          greet();
        }}
      >
        <input
          id="greet-input"
          onChange={(e) => setName(e.currentTarget.value)}
          placeholder="Enter a name..."
        />
        <button type="submit">Greet</button>
      </form>
      <p>{greetMsg}</p>

        <button onClick={async () => {
            const invoiceData: InvoiceData = {
                sender: {
                    name: "Dr. C. N.",
                    street: "Am xxx 20",
                    zipCity: "12345 Schönweitoben",
                    birthDate: "02.02.2022",
                    taxId: "90 898 767 545",
                },

                recipient: {
                    name: "Amtsgericht Sonnenstrahl",
                    street: "- Abteilung für Betreuungssachen -",
                    zipCity: "Süßigkeitenstraße 99",
                    extraLines: ["98765 Sonnenstrahl"],
                },

                placeAndDate: "Höchstadt, 03.03.2025",
                invoiceNumber: "ZZK251211",

                referencePerson:
                    "Andrea Hastenichtgesehn, geb. am 05.02.1912",
                referenceDetails: "Aktenzeichen: 023 XVII 55/12",

                introText:
                    "Für die Erstellung eines psychiatrischen Gutachtens erlaube ich mir bei gemäß Vergütungsgruppe M2 zu berechnen:",

                serviceRows: [
                    {
                        description:
                            "Anfahrten (2x, davon 1x Mini-Anteil)",
                        value: "80 Minuten",
                    },
                    {
                        description:
                            "Exploration, Fremdanamnese und Durchsicht der Unterlagen",
                        value: "304 Minuten",
                    },
                    {
                        description:
                            "Auswertung der Untersuchung und der neuropsycholog. Testung, Verfassen des Gutachtens",
                        value: "192 Minuten",
                    },
                    {
                        description: "Gesamtzeit",
                        value: "576 Minuten (600 Minuten)    900,00",
                    },
                    {
                        description:
                            "Schreibgebühr: 27.733 á 1,50 Euro/1000",
                        value: "42,00",
                    },
                    {
                        description:
                            "Kilometerpauschale: 76 km á 0,42 Euro/km",
                        value: "31,92",
                    },
                    {
                        description: "Versandkosten",
                        value: "2,00",
                    },
                    {
                        description: "Gesamt",
                        value: "975,92",
                    },
                    {
                        description: "Umsatzsteuer 19%",
                        value: "185,42",
                    },
                    {
                        description: "Gesamt",
                        value: "1161,34",
                    },
                ],

                totals: [], // (optional if you want totals separate)

                signatureName: "Dr. C. Nolting",

                bankDetails: {
                    accountHolder: "Frau Dr. C. Nolting",
                    bank: "Stadt- und Kreissparkasse Erlangen",
                    iban: "DE46 7635 0000 0060 1113 31",
                    bic: "BYLADEM1ERH",
                },
            };

            await generateInvoice(invoiceData, "invoice.docx").catch(console.error);
        }}>Rechnung drucken</button>
    </main>
  );
}

export default App;
