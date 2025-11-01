import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import { FaExclamationCircle, FaUpload, FaCheckCircle, FaShieldAlt } from "react-icons/fa";
import { motion } from "framer-motion";
import 'react-toastify/dist/ReactToastify.css';
// import onboardImage from "../assets/signup.png";


const AdminOnboard = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: '',
    adminCode: '',
    department: ''
  });
  const [aadhaarFile, setAadhaarFile] = useState(null);
  const [aadhaarPreview, setAadhaarPreview] = useState(null);
  const [errors, setErrors] = useState({});
  const [isValid, setIsValid] = useState({});
  const [uploading, setUploading] = useState(false);

  // Validate email format
  useEffect(() => {
    if (formData.email === '') {
      setErrors(p => ({ ...p, email: null }));
      setIsValid(p => ({ ...p, email: false }));
    } else if (/\S+@\S+\.\S+/.test(formData.email)) {
      setErrors(p => ({ ...p, email: null }));
      setIsValid(p => ({ ...p, email: true }));
    } else {
      setErrors(p => ({ ...p, email: 'Please enter a valid email' }));
      setIsValid(p => ({ ...p, email: false }));
    }
  }, [formData.email]);

  // Validate admin code
  useEffect(() => {
    if (formData.adminCode === '') {
      setErrors(p => ({ ...p, adminCode: null }));
      setIsValid(p => ({ ...p, adminCode: false }));
    } else if (formData.adminCode.length >= 6) {
      setErrors(p => ({ ...p, adminCode: null }));
      setIsValid(p => ({ ...p, adminCode: true }));
    } else {
      setErrors(p => ({ ...p, adminCode: 'Admin code must be at least 6 characters' }));
      setIsValid(p => ({ ...p, adminCode: false }));
    }
  }, [formData.adminCode]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle file selection
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
      if (!validTypes.includes(file.type)) {
        setErrors(p => ({ ...p, aadhaar: 'Please upload a valid image (JPG, PNG) or PDF file' }));
        setIsValid(p => ({ ...p, aadhaar: false }));
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        setErrors(p => ({ ...p, aadhaar: 'File size should not exceed 5MB' }));
        setIsValid(p => ({ ...p, aadhaar: false }));
        return;
      }

      setAadhaarFile(file);
      setErrors(p => ({ ...p, aadhaar: null }));
      setIsValid(p => ({ ...p, aadhaar: true }));

      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setAadhaarPreview(reader.result);
        };
        reader.readAsDataURL(file);
      } else {
        setAadhaarPreview(null);
      }
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.email) {
      setErrors(p => ({ ...p, email: 'Email is required' }));
      return;
    }
    if (!isValid.email) {
      toast.error("Please enter a valid email");
      return;
    }
    if (!formData.adminCode) {
      setErrors(p => ({ ...p, adminCode: 'Admin code is required' }));
      return;
    }
    if (!isValid.adminCode) {
      toast.error("Please enter a valid admin code");
      return;
    }
    if (!formData.department) {
      setErrors(p => ({ ...p, department: 'Department is required' }));
      toast.error("Please select a department");
      return;
    }
    if (!aadhaarFile) {
      setErrors(p => ({ ...p, aadhaar: 'Aadhaar card is required' }));
      toast.error("Please upload your Aadhaar card");
      return;
    }

    setUploading(true);

    try {
      // Simulate API call
      const data = new FormData();
      data.append('email', formData.email);
      data.append('adminCode', formData.adminCode);
      data.append('department', formData.department);
      data.append('aadhaar', aadhaarFile);
      data.append('userType', 'admin');

      await new Promise(res => setTimeout(res, 2000));

      toast.success("🎉 Admin onboarding successful!");
      
      localStorage.setItem('userEmail', formData.email);
      localStorage.setItem('userType', 'admin');
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('adminDepartment', formData.department);

      setTimeout(() => {
        navigate('/admin/dashboard');
      }, 1500);

    } catch (err) {
      toast.error("❌ Onboarding failed. Please try again.");
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const emailBorderColor = errors.email ? '#ef4444' : isValid.email ? '#22c55e' : '#86efac';
  const codeBorderColor = errors.adminCode ? '#ef4444' : isValid.adminCode ? '#22c55e' : '#86efac';
  const fileBorderColor = errors.aadhaar ? '#ef4444' : isValid.aadhaar ? '#22c55e' : '#86efac';

  return (
    <div className="flex flex-col md:flex-row min-h-screen items-center justify-center font-inter relative bg-gradient-to-br from-green-50 to-indigo-100">
      {/* Left Side - Image */}
      {/* <motion.div
        initial={{ opacity: 0, x: -40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        className="hidden md:flex md:w-1/2 justify-center items-center"
      >
        <motion.img
          src={onboardImage}
          alt="Admin Onboarding"
          className="w-full h-[80vh] object-contain drop-shadow-2xl rounded-xl"
          animate={{ y: [0, -25, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />
      </motion.div> */}

      {/* Right Side - Form */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="md:w-1/2 w-full flex justify-center p-4"
      >
        <div
          className="rounded-2xl border border-green-500 bg-white/70 backdrop-blur-md p-8 shadow-2xl md:p-10 w-full max-w-md"
          style={{
            background: 'rgba(34,139,34,0.15)',
            backdropFilter: 'blur(10px)',
          }}
        >
          <div className="flex items-center justify-center mb-4">
            <FaShieldAlt className="text-green-600 text-4xl" />
          </div>
          <h2 className="text-3xl font-bold text-center mb-2 text-green-700">
            Admin Registration
          </h2>
          <p className="text-center text-sm text-gray-600 mb-6">
            Complete your admin profile to access the system
          </p>

          <motion.form
            noValidate
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            onSubmit={handleSubmit}
            className="space-y-4"
          >
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                placeholder="admin@example.com"
                className="w-full rounded-lg p-3 outline-none bg-white/80 text-black"
                style={{
                  border: `2px solid ${emailBorderColor}`,
                  transition: 'border-color 0.2s',
                }}
                value={formData.email}
                onChange={handleInputChange}
              />
              {errors.email && (
                <p className="text-red-500 text-sm flex items-center pt-1">
                  <FaExclamationCircle className="mr-1" />
                  {errors.email}
                </p>
              )}
            </div>

            {/* Admin Code */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Admin Code
              </label>
              <input
                type="text"
                name="adminCode"
                placeholder="Enter admin access code"
                className="w-full rounded-lg p-3 outline-none bg-white/80 text-black"
                style={{
                  border: `2px solid ${codeBorderColor}`,
                  transition: 'border-color 0.2s',
                }}
                value={formData.adminCode}
                onChange={handleInputChange}
              />
              {errors.adminCode && (
                <p className="text-red-500 text-sm flex items-center pt-1">
                  <FaExclamationCircle className="mr-1" />
                  {errors.adminCode}
                </p>
              )}
            </div>

            {/* Department */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Department
              </label>
              <select
                name="department"
                className="w-full rounded-lg p-3 outline-none bg-white/80 text-black border-2 border-green-200"
                value={formData.department}
                onChange={handleInputChange}
              >
                <option value="">Select Department</option>
                <option value="IT">Public Welfare Department</option>
                <option value="HR">Road & Transports</option>
                <option value="Finance">Electric Department</option>
                <option value="Operations">Garbage Department</option>
                {/* <option value="Management"></option> */}
              </select>
              {errors.department && (
                <p className="text-red-500 text-sm flex items-center pt-1">
                  <FaExclamationCircle className="mr-1" />
                  {errors.department}
                </p>
              )}
            </div>

            {/* Aadhaar Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Aadhaar Card
              </label>
              <div
                className="relative w-full rounded-lg p-4 bg-white/80 cursor-pointer hover:bg-white/90 transition"
                style={{
                  border: `2px dashed ${fileBorderColor}`,
                  transition: 'border-color 0.2s',
                }}
              >
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,application/pdf"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  id="aadhaar-upload"
                />
                <label
                  htmlFor="aadhaar-upload"
                  className="flex flex-col items-center justify-center cursor-pointer"
                >
                  {aadhaarFile ? (
                    <div className="text-center">
                      <FaCheckCircle className="text-green-500 text-3xl mx-auto mb-2" />
                      <p className="text-sm text-gray-700 font-medium">
                        {aadhaarFile.name}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {(aadhaarFile.size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <FaUpload className="text-gray-400 text-3xl mx-auto mb-2" />
                      <p className="text-sm text-gray-600">Upload Aadhaar</p>
                      <p className="text-xs text-gray-400 mt-1">
                        JPG, PNG or PDF (Max 5MB)
                      </p>
                    </div>
                  )}
                </label>
              </div>
              {errors.aadhaar && (
                <p className="text-red-500 text-sm flex items-center pt-1">
                  <FaExclamationCircle className="mr-1" />
                  {errors.aadhaar}
                </p>
              )}

              {aadhaarPreview && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mt-3 rounded-lg overflow-hidden border-2 border-green-300"
                >
                  <img
                    src={aadhaarPreview}
                    alt="Preview"
                    className="w-full h-48 object-cover"
                  />
                </motion.div>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={uploading}
              className="w-full bg-green-500 hover:bg-green-600 text-white rounded-lg py-3 font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Processing...
                </span>
              ) : (
                'Complete Registration'
              )}
            </button>
          </motion.form>

          {/* Footer */}
          <div className="text-center pt-6">
            <Link to="/login" className="inline-block text-sm text-green-700 hover:underline">
              ← Back to Login
            </Link>
          </div>
        </div>
      </motion.div>

      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
};

export default AdminOnboard;