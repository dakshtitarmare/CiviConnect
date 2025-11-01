import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-hot-toast";

const Onboard = () => {
  const navigate = useNavigate();

  // ✅ Auto-fill email from localStorage
  const storedEmail = localStorage.getItem("userEmail") || "";

  // ✅ User input state
  const [formData, setFormData] = useState({
    name: "",
    email: storedEmail,
    phone_no: "",
    dob: "",
    address: "",
    aadhar_no: "",
  });

  // Handle form change
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // ✅ Form submit handler
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await axios.post("http://localhost:4000/api/user/new", formData, {
        headers: { "Content-Type": "application/json" },
      });

      if (res.data?.success) {
        toast.success("🎉 Account created successfully!");
        setTimeout(() => navigate("/user/dashboard"), 1200);
      } else {
        toast.error(res.data?.error || "Failed to create account.");
      }
    } catch (err) {
      console.error("Error creating citizen:", err);
      if (err.response?.data?.error) {
        toast.error(err.response.data.error);
      } else {
        toast.error("⚠️ Server error. Please try again later.");
      }
    }
  };

  return (
    <div className="min-h-screen flex justify-center items-center bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-gray-900 dark:via-gray-900 dark:to-black px-6 py-12">
      <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm p-8 rounded-3xl shadow-xl max-w-md w-full border border-white/20 dark:border-gray-700">
        <h2 className="text-3xl font-bold text-center text-green-600 dark:text-green-400 mb-6">
          Citizen Onboarding 📝
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-700 dark:text-gray-200 mb-2">Full Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-green-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-gray-700 dark:text-gray-200 mb-2">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              readOnly
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-100 dark:bg-gray-900 text-gray-500 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-gray-700 dark:text-gray-200 mb-2">Phone Number</label>
            <input
              type="tel"
              name="phone_no"
              value={formData.phone_no}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-green-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-gray-700 dark:text-gray-200 mb-2">Date of Birth</label>
            <input
              type="date"
              name="dob"
              value={formData.dob}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-green-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-gray-700 dark:text-gray-200 mb-2">Address</label>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-green-500 outline-none"
            ></textarea>
          </div>

          <div>
            <label className="block text-gray-700 dark:text-gray-200 mb-2">Aadhar Number</label>
            <input
              type="text"
              name="aadhar_no"
              value={formData.aadhar_no}
              onChange={handleChange}
              required
              maxLength="12"
              minLength="12"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-green-500 outline-none"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-semibold transition-colors duration-300"
          >
            Create Account
          </button>
        </form>
      </div>
    </div>
  );
};

export default Onboard;
