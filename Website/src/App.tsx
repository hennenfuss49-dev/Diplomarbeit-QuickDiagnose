import {BrowserRouter, Routes, Route } from "react-router-dom";

//pages & components
import {Dashboard} from "./pages/dashboard/Dashboard";
import {ErrorCodes} from "./pages/errorCodes/ErrorCodes";
import {History} from "./pages/history/History";
import {LiveData} from "./pages/liveData/LiveData";
import {Settings} from "./pages/Settings/Settings";

import React from 'react';

//styles
import './App.css';
import {Sidebar} from "./components/Sidebar";
import {ToastNotificationCenter} from "./components/Notifications/ToastNotificationCenter";

function App() {

  return (
    <div className="App">
      <BrowserRouter>
        <Sidebar />
        <div className="container">
          <Routes>
            <Route path="/" element={<Dashboard/>}/>
            <Route path="/errorCodes" element={<ErrorCodes/>}/>
            <Route path="/history" element={<History/>}/>
            <Route path="/liveData" element={<LiveData />} />
            <Route path="/Settings" element={<Settings/>} />
          </Routes>
        </div>
      </BrowserRouter>
      <ToastNotificationCenter/>
    </div>
  );
}

export default App;
