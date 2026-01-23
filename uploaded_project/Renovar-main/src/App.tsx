import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { DemoProvider } from "@/contexts/DemoContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { CACHE_KEYS } from "@/lib/constants";

// Auth Pages
import SplashScreen from "@/pages/auth/SplashScreen";
import LoginPage from "@/pages/auth/LoginPage";
import RegisterPage from "@/pages/auth/RegisterPage";
import DoctorRegisterPage from "@/pages/auth/DoctorRegisterPage";
import ForgotPasswordPage from "@/pages/auth/ForgotPasswordPage";
import ResetPasswordPage from "@/pages/auth/ResetPasswordPage";
import CompleteProfilePage from "@/pages/auth/CompleteProfilePage";

// Patient Pages - Lazy loaded
const PatientDashboard = lazy(() => import("@/pages/patient/PatientDashboard"));
const HistoryPage = lazy(() => import("@/pages/patient/HistoryPage"));
const ProfilePage = lazy(() => import("@/pages/patient/ProfilePage"));
const ChatPage = lazy(() => import("@/pages/patient/ChatPage"));

// Prescription Flow - Lazy loaded
const PrescriptionTypePage = lazy(() => import("@/pages/prescription/PrescriptionTypePage"));
const PrescriptionUploadPage = lazy(() => import("@/pages/prescription/PrescriptionUploadPage"));
const PrescriptionConfirmPage = lazy(() => import("@/pages/prescription/PrescriptionConfirmPage"));
const PrescriptionPaymentPage = lazy(() => import("@/pages/prescription/PrescriptionPaymentPage"));
const PrescriptionConfirmationPage = lazy(() => import("@/pages/prescription/PrescriptionConfirmationPage"));

// Exam Flow - Lazy loaded
const ExamTypePage = lazy(() => import("@/pages/exam/ExamTypePage"));
const ExamUploadPage = lazy(() => import("@/pages/exam/ExamUploadPage"));
const ExamPaymentPage = lazy(() => import("@/pages/exam/ExamPaymentPage"));
const ExamConfirmationPage = lazy(() => import("@/pages/exam/ExamConfirmationPage"));

// Consultation Flow - Lazy loaded
const ConsultationTypePage = lazy(() => import("@/pages/consultation/ConsultationTypePage"));
const ConsultationTimePage = lazy(() => import("@/pages/consultation/ConsultationTimePage"));
const ConsultationPaymentPage = lazy(() => import("@/pages/consultation/ConsultationPaymentPage"));
const ConsultationConfirmationPage = lazy(() => import("@/pages/consultation/ConsultationConfirmationPage"));

// Doctor Pages - Lazy loaded
const DoctorDashboard = lazy(() => import("@/pages/doctor/DoctorDashboard"));
const RequestDetailPage = lazy(() => import("@/pages/doctor/RequestDetailPage"));

// Admin Pages - Lazy loaded
const AdminDashboard = lazy(() => import("@/pages/admin/AdminDashboard"));
const UsersManagement = lazy(() => import("@/pages/admin/UsersManagement"));
const DoctorsManagement = lazy(() => import("@/pages/admin/DoctorsManagement"));
const ServicesManagement = lazy(() => import("@/pages/admin/ServicesManagement"));
const ReportsPage = lazy(() => import("@/pages/admin/ReportsPage"));

// Demo Pages
import DemoSelector from "@/pages/demo/DemoSelector";
import DemoPatientDashboard from "@/pages/demo/DemoPatientDashboard";
import DemoDoctorDashboard from "@/pages/demo/DemoDoctorDashboard";
import DemoAdminDashboard from "@/pages/demo/DemoAdminDashboard";

// Legal Pages
import TermsOfUsePage from "@/pages/legal/TermsOfUsePage";
import PrivacyPolicyPage from "@/pages/legal/PrivacyPolicyPage";

// Other
import NotFound from "./pages/NotFound";
import { PageLoader } from "@/components/PageLoader";

// Configure QueryClient with optimized cache settings
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: CACHE_KEYS.STALE_TIME.MEDIUM,
      gcTime: CACHE_KEYS.STALE_TIME.LONG,
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <DemoProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
              {/* Auth Routes - Public */}
              <Route path="/" element={<SplashScreen />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/doctor/register" element={<DoctorRegisterPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />

              {/* Demo Routes - Public */}
              <Route path="/demo" element={<DemoSelector />} />
              <Route path="/demo/patient" element={<DemoPatientDashboard />} />
              <Route path="/demo/patient/*" element={<DemoPatientDashboard />} />
              <Route path="/demo/doctor" element={<DemoDoctorDashboard />} />
              <Route path="/demo/doctor/*" element={<DemoDoctorDashboard />} />
              <Route path="/demo/admin" element={<DemoAdminDashboard />} />
              <Route path="/demo/admin/*" element={<DemoAdminDashboard />} />
              
              {/* Complete Profile - Protected but skips profile check */}
              <Route path="/complete-profile" element={
                <ProtectedRoute skipProfileCheck>
                  <CompleteProfilePage />
                </ProtectedRoute>
              } />

              {/* Patient Routes - Protected */}
              <Route path="/dashboard" element={
                <ProtectedRoute allowedRoles={['patient']}>
                  <Suspense fallback={<PageLoader />}>
                    <PatientDashboard />
                  </Suspense>
                </ProtectedRoute>
              } />
              <Route path="/history" element={
                <ProtectedRoute allowedRoles={['patient']}>
                  <Suspense fallback={<PageLoader />}>
                    <HistoryPage />
                  </Suspense>
                </ProtectedRoute>
              } />
              <Route path="/chat/:requestId" element={
                <ProtectedRoute allowedRoles={['patient', 'doctor']}>
                  <Suspense fallback={<PageLoader />}>
                    <ChatPage />
                  </Suspense>
                </ProtectedRoute>
              } />
              <Route path="/chat" element={
                <ProtectedRoute allowedRoles={['patient']}>
                  <Suspense fallback={<PageLoader />}>
                    <HistoryPage />
                  </Suspense>
                </ProtectedRoute>
              } />
              <Route path="/profile" element={
                <ProtectedRoute allowedRoles={['patient']}>
                  <Suspense fallback={<PageLoader />}>
                    <ProfilePage />
                  </Suspense>
                </ProtectedRoute>
              } />
              <Route path="/notifications" element={
                <ProtectedRoute allowedRoles={['patient']}>
                  <PatientDashboard />
                </ProtectedRoute>
              } />

              {/* Prescription Flow - Protected Patient */}
              <Route path="/prescriptions" element={
                <ProtectedRoute allowedRoles={['patient']}>
                  <Suspense fallback={<PageLoader />}>
                    <PrescriptionTypePage />
                  </Suspense>
                </ProtectedRoute>
              } />
              <Route path="/prescriptions/upload" element={
                <ProtectedRoute allowedRoles={['patient']}>
                  <Suspense fallback={<PageLoader />}>
                    <PrescriptionUploadPage />
                  </Suspense>
                </ProtectedRoute>
              } />
              <Route path="/prescriptions/confirm" element={
                <ProtectedRoute allowedRoles={['patient']}>
                  <Suspense fallback={<PageLoader />}>
                    <PrescriptionConfirmPage />
                  </Suspense>
                </ProtectedRoute>
              } />
              <Route path="/prescriptions/payment" element={
                <ProtectedRoute allowedRoles={['patient']}>
                  <Suspense fallback={<PageLoader />}>
                    <PrescriptionPaymentPage />
                  </Suspense>
                </ProtectedRoute>
              } />
              <Route path="/prescriptions/confirmation" element={
                <ProtectedRoute allowedRoles={['patient']}>
                  <Suspense fallback={<PageLoader />}>
                    <PrescriptionConfirmationPage />
                  </Suspense>
                </ProtectedRoute>
              } />

              {/* Exam Flow - Protected Patient */}
              <Route path="/exams" element={
                <ProtectedRoute allowedRoles={['patient']}>
                  <Suspense fallback={<PageLoader />}>
                    <ExamTypePage />
                  </Suspense>
                </ProtectedRoute>
              } />
              <Route path="/exams/upload" element={
                <ProtectedRoute allowedRoles={['patient']}>
                  <Suspense fallback={<PageLoader />}>
                    <ExamUploadPage />
                  </Suspense>
                </ProtectedRoute>
              } />
              <Route path="/exams/payment" element={
                <ProtectedRoute allowedRoles={['patient']}>
                  <Suspense fallback={<PageLoader />}>
                    <ExamPaymentPage />
                  </Suspense>
                </ProtectedRoute>
              } />
              <Route path="/exams/confirmation" element={
                <ProtectedRoute allowedRoles={['patient']}>
                  <Suspense fallback={<PageLoader />}>
                    <ExamConfirmationPage />
                  </Suspense>
                </ProtectedRoute>
              } />

              {/* Consultation Flow - Protected Patient */}
              <Route path="/consultation" element={
                <ProtectedRoute allowedRoles={['patient']}>
                  <Suspense fallback={<PageLoader />}>
                    <ConsultationTypePage />
                  </Suspense>
                </ProtectedRoute>
              } />
              <Route path="/consultation/time" element={
                <ProtectedRoute allowedRoles={['patient']}>
                  <Suspense fallback={<PageLoader />}>
                    <ConsultationTimePage />
                  </Suspense>
                </ProtectedRoute>
              } />
              <Route path="/consultation/payment" element={
                <ProtectedRoute allowedRoles={['patient']}>
                  <Suspense fallback={<PageLoader />}>
                    <ConsultationPaymentPage />
                  </Suspense>
                </ProtectedRoute>
              } />
              <Route path="/consultation/confirmation" element={
                <ProtectedRoute allowedRoles={['patient']}>
                  <Suspense fallback={<PageLoader />}>
                    <ConsultationConfirmationPage />
                  </Suspense>
                </ProtectedRoute>
              } />

              {/* Doctor Routes - Protected Doctor */}
              <Route path="/doctor" element={
                <ProtectedRoute allowedRoles={['doctor']}>
                  <Suspense fallback={<PageLoader />}>
                    <DoctorDashboard />
                  </Suspense>
                </ProtectedRoute>
              } />
              <Route path="/doctor/request/:id" element={
                <ProtectedRoute allowedRoles={['doctor']}>
                  <Suspense fallback={<PageLoader />}>
                    <RequestDetailPage />
                  </Suspense>
                </ProtectedRoute>
              } />

              {/* Admin Routes - Protected Admin */}
              <Route path="/admin" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <Suspense fallback={<PageLoader />}>
                    <AdminDashboard />
                  </Suspense>
                </ProtectedRoute>
              } />
              <Route path="/admin/users" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <Suspense fallback={<PageLoader />}>
                    <UsersManagement />
                  </Suspense>
                </ProtectedRoute>
              } />
              <Route path="/admin/doctors" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <Suspense fallback={<PageLoader />}>
                    <DoctorsManagement />
                  </Suspense>
                </ProtectedRoute>
              } />
              <Route path="/admin/services" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <Suspense fallback={<PageLoader />}>
                    <ServicesManagement />
                  </Suspense>
                </ProtectedRoute>
              } />
              <Route path="/admin/reports" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <Suspense fallback={<PageLoader />}>
                    <ReportsPage />
                  </Suspense>
                </ProtectedRoute>
              } />

              {/* Legal Routes - Public */}
              <Route path="/terms" element={<TermsOfUsePage />} />
              <Route path="/privacy" element={<PrivacyPolicyPage />} />

              {/* 404 */}
              <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </DemoProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
