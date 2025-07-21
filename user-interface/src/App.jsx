import React from 'react';
import {BrowserRouter, Routes, Route, Navigate} from 'react-router-dom';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Index from './pages/Index';
import DashBoard from './pages/DashBoard';
import CreateDocument from './pages/CreateDocument';
import ProtectedRoute from './lib/ProtectedRoute';
import Checkout from './pages/Checkout';
import { Toaster } from "sonner";



function App(){
    return (
        <BrowserRouter>
            <Toaster position="top-right" richColors />
            <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/createDocument" element={<CreateDocument />} />
                <Route path="/dashboard" element={<DashBoard />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route
                    path="/dashboard"
                    element={
                        <ProtectedRoute>
                            
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/admin-dashboard"
                    element={
                        <ProtectedRoute>
                            <div>Admin Dashboard</div>
                        </ProtectedRoute>
                    }
                />
            </Routes>
        </BrowserRouter>
    );
}

export default App;