import React from "react";
import ReactDOM from "react-dom/client";
import "@mantine/core/styles.css";
import { MantineProvider, createTheme } from "@mantine/core";
import App from "./App.tsx";
import "./index.css";

const theme = createTheme({
  primaryColor: "indigo",
  primaryShade: 6,
  colors: {
    // Overrides Mantine's default neutral gray "dark" palette with a
    // navy-tinted one - this is what every Card, AppShell surface, and
    // background color derives from, so it cascades everywhere.
    dark: [
      "#E7EAF5", // 0 - lightest (rarely used)
      "#A8B0CC", // 1
      "#7D87A8", // 2 - dimmed text
      "#545F82", // 3
      "#3B4568", // 4 - borders
      "#2E3752", // 5
      "#242C46", // 6 - hover surfaces
      "#1C2338", // 7 - card/surface background
      "#131829", // 8 - slightly deeper surface
      "#0B0E1A", // 9 - app background (deep navy, not black)
    ],
  },
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <MantineProvider theme={theme} defaultColorScheme="dark">
      <App />
    </MantineProvider>
  </React.StrictMode>,
);
