import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

import { ThemeProvider, createTheme } from "@mui/material/styles";
import { frFR } from "@mui/x-date-pickers/locales";

// Thème dark global
const darkTheme = createTheme(
  {
    palette: {
      mode: "dark",
      primary: { main: "#14b8a6" },
      background: { default: "#0f172a", paper: "#1e293b" },
      text: { primary: "#fff" },
    },
    components: {
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            color: "white",
            "& fieldset": { borderColor: "rgba(255,255,255,0.3)" },
            "&:hover fieldset": { borderColor: "rgba(255,255,255,0.5)" },
            "&.Mui-focused fieldset": { borderColor: "#14b8a6" },
          },
        },
      },
      MuiInputLabel: {
        styleOverrides: {
          root: { color: "rgba(255,255,255,0.7)" },
          focused: { color: "#14b8a6" },
        },
      },
      MuiIconButton: {
        styleOverrides: {
          root: { color: "white" },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundColor: "#1e293b",
            color: "white",
          },
        },
      },
    },
  },
  frFR
);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider theme={darkTheme}>
      <App />
    </ThemeProvider>
  </StrictMode>,
)
