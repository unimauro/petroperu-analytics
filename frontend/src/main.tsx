import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter, Routes, Route } from "react-router-dom";
import "./index.css";
import { DataProvider } from "./lib/store";
import Layout from "./components/Layout";
import Executive from "./pages/Executive";
import Financial from "./pages/Financial";
import Investment from "./pages/Investment";
import Debt from "./pages/Debt";
import Governance from "./pages/Governance";
import Assistant from "./pages/Assistant";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <DataProvider>
      {/* HashRouter: rutas tipo /#/financial — sin configuración extra en GitHub Pages. */}
      <HashRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Executive />} />
            <Route path="financial" element={<Financial />} />
            <Route path="investment" element={<Investment />} />
            <Route path="debt" element={<Debt />} />
            <Route path="governance" element={<Governance />} />
            <Route path="assistant" element={<Assistant />} />
          </Route>
        </Routes>
      </HashRouter>
    </DataProvider>
  </React.StrictMode>
);
