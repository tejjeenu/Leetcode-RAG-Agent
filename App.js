import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import {Auth} from "./components/auth.js";
import {Main} from "./components/main.js";
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Auth />} />
        <Route path="/home" element={<Main />} />
      </Routes>
    </Router>
  );
}

export default App;