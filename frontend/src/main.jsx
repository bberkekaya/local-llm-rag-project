import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles.css";

// Initial theme setup
const savedTheme = localStorage.getItem("darkMode");
const isDark = savedTheme !== null ? savedTheme === "true" : true;
document.documentElement.setAttribute("data-theme", isDark ? "dark" : "light");
document.body.setAttribute("data-theme", isDark ? "dark" : "light");

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

