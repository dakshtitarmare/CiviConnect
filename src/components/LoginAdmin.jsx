import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import { FaExclamationCircle } from "react-icons/fa";
import { motion } from "framer-motion";
import 'react-toastify/dist/ReactToastify.css';
import loginImage from "../assets/signup.png";

const Login = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState({});
  const [isValid, setIsValid] = useState({});

  // Validate email format
  useEffect(() => {
    if (email === '') {
      setErrors(p => ({ ...p, email: null }));
      setIsValid(p => ({ ...p, email: false }));
    } else if (/\S+@\S+\.\S+/.test(email)) {
      setErrors(p => ({ ...p, email: null }));
      setIsValid(p => ({ ...p, email: true }));
    } else {
      setErrors(p => ({ ...p, email: 'Please enter a valid email' }));
      setIsValid(p => ({ ...p, email: false }));
    }
  }, [email]);

  // Validate code presence
  useEffect(() => {
    if (code && errors.code === 'Verification code is required') {
      setErrors(p => ({ ...p, code: null }));
    }
    if (code) {
      setIsValid(p => ({ ...p, code: true }));
    } else {
      setIsValid(p => ({ ...p, code: false }));
    }
  }, [code, errors.code]);

  // Step 1: Send OTP (mock backend)
  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      setErrors(p => ({ ...p, email: 'Email is required' }));
      return;
    }
    if (!isValid.email) return;

    try {
      // Simulate API call
      await new Promise(res => setTimeout(res, 1000));
      toast.info("📩 Temporary: OTP sent to your email");
      setStep(2);
    } catch (err) {
      toast.error("Failed to send OTP. Please try again.");
    }
  };

  // Step 2: Verify OTP (mock backend)
  const handleCodeSubmit = async (e) => {
    e.preventDefault();
    if (!code) {
      setErrors(p => ({ ...p, code: 'Verification code is required' }));
      return;
    }

    try {
      // Simulate OTP verification
      await new Promise(res => setTimeout(res, 1000));

      if (code === "123456") { // temporary mock OTP
        toast.success("🎉 Login Successful");
        setTimeout(() => navigate('/dashboard'), 1000);
      } else {
        throw new Error("Invalid OTP");
      }
    } catch (err) {
      toast.error("❌ Invalid OTP, please try again.");
      setErrors(p => ({ ...p, code: "Verification code is incorrect" }));
    }
  };

  const emailBorderColor = errors.email
    ? '#ef4444'
    : isValid.email
    ? '#22c55e'
    : '#86efac';

  const codeBorderColor = errors.code
    ? '#ef4444'
    : isValid.code
    ? '#22c55e'
    : '#86efac';

  return (
    <div className="flex flex-col md:flex-row min-h-screen items-center justify-center font-inter relative">
      {/* Left Side - Image */}
      <motion.div
        initial={{ opacity: 0, x: -40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        className="hidden md:flex md:w-1/2 justify-center items-center bg-transparent"
      >
        <motion.img
          src={loginImage}
          alt="Login Illustration"
          className="w-full h-[80vh] object-contain drop-shadow-2xl rounded-xl"
          animate={{ y: [0, -25, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />
      </motion.div>

      {/* Right Side - Form */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="md:w-1/2 w-full flex justify-center"
      >
        <div
          className="rounded-2xl border border-green-500 bg-white/70 backdrop-blur-md p-8 shadow-2xl md:p-10 w-full max-w-md"
          style={{
            background: 'rgba(34,197,94,0.15)',
            backdropFilter: 'blur(10px)',
          }}
        >
          <h2 className="text-3xl font-bold text-center mb-2 text-green-700">
            Welcome Back
          </h2>
          <p className="text-center text-sm text-gray-600 mb-6">
            Sign in using your email
          </p>

          {/* Step 1: Enter Email */}
          {step === 1 && (
            <motion.form
              noValidate
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4 }}
              onSubmit={handleEmailSubmit}
              className="space-y-4"
            >
              <div>
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="w-full rounded-lg p-3 outline-none bg-white/80 text-black"
                  style={{
                    border: `1px solid ${emailBorderColor}`,
                    transition: 'border-color 0.2s',
                  }}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                {errors.email && (
                  <p className="text-red-500 text-sm flex items-center pt-1">
                    <FaExclamationCircle className="mr-1" />
                    {errors.email}
                  </p>
                )}
              </div>

              <button
                type="submit"
                className="w-full bg-green-500 hover:bg-green-600 text-white rounded-lg py-2 font-medium transition"
              >
                Send OTP
              </button>
            </motion.form>
          )}

          {/* Step 2: Enter Code */}
          {step === 2 && (
            <motion.form
              noValidate
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4 }}
              onSubmit={handleCodeSubmit}
              className="space-y-4"
            >
              <div>
                <input
                  type="text"
                  placeholder="Enter verification code"
                  className="w-full rounded-lg p-3 outline-none bg-white/80 text-black"
                  style={{
                    border: `1px solid ${codeBorderColor}`,
                    transition: 'border-color 0.2s',
                  }}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                />
                {errors.code && (
                  <p className="text-red-500 text-sm flex items-center pt-1">
                    <FaExclamationCircle className="mr-1" />
                    {errors.code}
                  </p>
                )}
              </div>

              <button
                type="submit"
                className="w-full bg-green-500 hover:bg-green-600 text-white rounded-lg py-2 font-medium transition"
              >
                Verify & Continue
              </button>
            </motion.form>
          )}

          {/* Footer */}
          <div className="text-center pt-6">
            <Link to="/" className="inline-block text-sm text-green-700 hover:underline">
              ← Back to Home
            </Link>
          </div>
        </div>
      </motion.div>

      {/* Toast */}
      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
};

export default Login;
