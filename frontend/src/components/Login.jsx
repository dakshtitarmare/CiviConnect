import React, { useEffect, useState } from 'react';
import { Routes, Route, useLocation, Navigate, useNavigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { SignIn, SignUp, useAuth } from '@clerk/clerk-react';
import { AnimatePresence } from 'framer-motion';

import Home from './Home';
import About from './Pages/About';
import Contact from './Pages/Contact';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Error404 from './components/Error404';
import ScrollToTop from './components/ScrollToTop';
import ScrollToTopOnRouteChange from './components/ScrollToTopOnRouteChange';

const App = () => {
  const { isSignedIn } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isAdminRoute = location.pathname.startsWith("/admin");

  useEffect(() => {
    // Example redirection logic: redirect to Home after login
    if (isSignedIn && location.pathname === "/") {
      navigate("/home");
    }
  }, [isSignedIn, location.pathname, navigate]);

  // ✅ Function to handle redirects to About, Home, and Contact
  const handleRedirect = (page) => {
    switch (page) {
      case "home":
        navigate("/");
        break;
      case "about":
        navigate("/about");
        break;
      case "contact":
        navigate("/contact");
        break;
      default:
        navigate("/");
    }
  };

  return (
    <>
      <ScrollToTop />
      <ScrollToTopOnRouteChange />
      <Toaster position="top-right" />

      {!isAdminRoute && <Navbar />}

      <main className="min-h-screen">
        <AnimatePresence mode="wait" initial={false}>
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="*" element={<Error404 />} />
          </Routes>
        </AnimatePresence>

        {/* Example buttons to trigger redirects */}
        <div className="flex justify-center gap-4 mt-10">
          <button onClick={() => handleRedirect("home")}>Go to Home</button>
          <button onClick={() => handleRedirect("about")}>Go to About</button>
          <button onClick={() => handleRedirect("contact")}>Go to Contact</button>
        </div>
      </main>

      {!isAdminRoute && <Footer />}
    </>
  );
};

export default App;