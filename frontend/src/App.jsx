import React, { useEffect, useState } from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { SignIn, SignUp, useAuth } from '@clerk/clerk-react';
import { AnimatePresence } from 'framer-motion';

import Home from './Home';
import Login from './components/Login';
import Signup from './components/Signup';
import Error404 from './components/Error404';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ScrollToTop from './components/ScrollToTop';
// import Feedback from "./Pages/Feedback";
import About from './Pages/About';
import Contact from './Pages/Contact';

const App = () => {
  const { isSignedIn } = useAuth();
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith("/admin");
  const [isProfileComplete, setIsProfileComplete] = useState(false);

  useEffect(() => {
    const profileStatus = localStorage.getItem("profileComplete") === "true";
    console.log(profileStatus);
    setIsProfileComplete(profileStatus);
  }, []);

  // const renderDashboard = () => {
  //   if (!isProfileComplete) return <Navigate to="/profile-setup" replace />;
  //   return <UserDashboard />; // Note: UserDashboard is not imported; remove or import it if needed
  // };

  return (
    <>
      <ScrollToTop />
      <Toaster
        position="top-right"
        toastOptions={{
          className:
            '!bg-white dark:!bg-gray-800 !text-gray-900 dark:!text-white !border !border-gray-200 dark:!border-gray-700',
          duration: 4000,
          success: {
            iconTheme: { primary: '#10B981', secondary: 'white' },
          },
          error: {
            iconTheme: { primary: '#EF4444', secondary: 'white' },
          },
        }}
      />

      {!isAdminRoute && <Navbar />}

      <main className="min-h-screen">
        <AnimatePresence mode="wait" initial={false}>
          <Routes location={location} key={location.pathname}>
            {/* Clerk Auth Routes */}
            <Route
              path="/sign-in/*"
              element={<SignIn routing="path" path="/sign-in" redirectUrl="/" />}
            />
            <Route
              path="/signup/*"
              element={<SignUp routing="path" path="/signup" redirectUrl="/" />}
            />

            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            {/* <Route path="/feedback" element={<Feedback />} /> */}
            <Route path="/contact" element={<Contact />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />

            {/* Error Route */}
            <Route path="*" element={<Error404 />} />
          </Routes>
        </AnimatePresence>
      </main>

      {!isAdminRoute && <Footer />}
    </>
  );
};

export default App;
