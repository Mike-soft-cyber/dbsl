import React from 'react';
import {BrowserRouter, Routes, Route, Navigate} from 'react-router-dom';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Index from './pages/Index';
import DashBoard from './pages/DashBoard';
import AdminDashBoard from './pages/AdminDashBoard'
import CreateDocument from './pages/CreateDocument';
import ProtectedRoute from './lib/ProtectedRoute';
import Checkout from './pages/Checkout';
import { Toaster } from "sonner";
import CbcDataDash from './pages/CbcDataDash';
import PaymentDashboard from './pages/PaymentDashboard';
import DocDashboard from './pages/DocDashboard';
import AdminSettings from './pages/AdminSettings';
import AdminTeachers from './pages/AdminTeachers';
import AdminDash from './pages/AdminDashBoard';
import AdminPages from './pages/AdminPages';
import DocumentPage from './pages/DocumentPage';
import MyDocumentsPage from './pages/MyDocuments';
import CBCReviewPage from './pages/CBCReviewPage';
import AuthCallback from './pages/AuthCallback';
import PendingReviewsDashboard from './pages/PendingReviewsDashboard';
import CompleteGoogleSignup from './pages/CompleteGoogleSignup';
import CompleteProfile from './pages/CompleteProfile';

function App(){
    return (
        <BrowserRouter>
            <Toaster position="top-right" richColors />
            <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/auth/callback" element={<AuthCallback />} />
                <Route path="/complete-profile" element={<CompleteProfile />} />
                <Route path="/complete-google-signup" element={<CompleteGoogleSignup />} />
                <Route path="/createDocument" element={<CreateDocument />} />
                <Route path="/dashboard" element={<DashBoard />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/documents/:id" element={<DocumentPage />} />
                <Route path="/review" element={<CBCReviewPage />} />
                <Route path="/pending-reviews" element={<PendingReviewsDashboard />} />
                <Route path="/my-documents" element={<MyDocumentsPage />} />
                <Route path="/profile" element={<AdminSettings />} />
                <Route path="/adminPages" element={<AdminPages />}>
                {/* ✅ This makes AdminDash load by default on /adminPages */}
                <Route index element={<AdminDash />} />
                
                <Route path="cbcdata" element={<CbcDataDash />} />
                <Route path="payment" element={<PaymentDashboard />} />
                <Route path="docDashboard" element={<DocDashboard />} />
                <Route path="adminSettings" element={<AdminSettings />} />
                <Route path="adminTeachers" element={<AdminTeachers />} />
                <Route path="adminDash" element={<AdminDash />} />
                </Route>


                <Route
  path="/dashboard"
  element={
    <ProtectedRoute allowedRoles={["Teacher"]}>
      <DashBoard />
    </ProtectedRoute>
  }
/>

<Route
  path="/admin-dashboard"
  element={
    <ProtectedRoute allowedRoles={["Administrator"]}>
      <AdminDashBoard />
    </ProtectedRoute>
  }
/>

            </Routes>
        </BrowserRouter>
    );
}

export default App;