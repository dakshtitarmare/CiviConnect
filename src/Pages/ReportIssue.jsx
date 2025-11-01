import {
  AlertCircle,
  CheckCircle,
  FileText,
  MapPin,
  MessageSquare,
  Upload,
  Mail,
  Phone,
  Image as ImageIcon,
} from "lucide-react";
import { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";

const FormInput = ({
  type = "text",
  id,
  label,
  placeholder,
  value,
  onChange,
  required = false,
  rows,
  icon: Icon,
  disabled = false,
  error,
}) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-emerald-500 ml-1">*</span>}
      </label>
      <div className="relative">
        {Icon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
            <Icon
              className={`w-5 h-5 ${
                isFocused ? "text-emerald-500" : "text-gray-400"
              }`}
            />
          </div>
        )}
        {type === "textarea" ? (
          <textarea
            id={id}
            placeholder={placeholder}
            value={value}
            onChange={onChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            rows={rows}
            disabled={disabled}
            className={`w-full rounded-lg border bg-white shadow-sm transition-all duration-200
              ${Icon ? "pl-10" : "pl-3"} pr-3 py-2.5
              ${
                error
                  ? "border-red-300 ring-2 ring-red-100"
                  : isFocused
                  ? "border-emerald-300 ring-2 ring-emerald-100"
                  : "border-gray-200 hover:border-emerald-200"
              }
              ${disabled ? "opacity-60 cursor-not-allowed" : ""}
              placeholder:text-gray-400 text-gray-900 focus:outline-none resize-y min-h-[100px]
            `}
            required={required}
          />
        ) : (
          <input
            type={type}
            id={id}
            placeholder={placeholder}
            value={value}
            onChange={onChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            disabled={disabled}
            className={`w-full rounded-lg border bg-white shadow-sm transition-all duration-200
              ${Icon ? "pl-10" : "pl-3"} pr-3 py-2.5
              ${
                error
                  ? "border-red-300 ring-2 ring-red-100"
                  : isFocused
                  ? "border-emerald-300 ring-2 ring-emerald-100"
                  : "border-gray-200 hover:border-emerald-200"
              }
              ${disabled ? "opacity-60 cursor-not-allowed" : ""}
              placeholder:text-gray-400 text-gray-900 focus:outline-none
            `}
            required={required}
          />
        )}
      </div>
      {error && (
        <p className="text-sm text-red-500 flex items-center gap-1">
          <AlertCircle className="w-4 h-4" /> {error}
        </p>
      )}
    </div>
  );
};

export default function ReportIssue() {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    location: "",
    imageURL: "",
    email: "",
    phone: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);
  const [errors, setErrors] = useState({});

  // ✅ Image Upload State
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [preview, setPreview] = useState(null);

  // ✅ Validate form
  const validateForm = useCallback(() => {
    let newErrors = {};
    if (!formData.title.trim()) newErrors.title = "Issue title is required.";
    if (!formData.description.trim() || formData.description.length < 10)
      newErrors.description = "Description must be at least 10 characters.";
    if (!formData.location.trim())
      newErrors.location = "Location is required.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleInputChange = useCallback(
    (field) => (e) => {
      setFormData((prev) => ({ ...prev, [field]: e.target.value }));
      setErrors((prev) => ({ ...prev, [field]: null }));
    },
    []
  );

  // ✅ Auto-fill citizen email + phone from backend using localStorage email
useEffect(() => {
  const storedEmail = localStorage.getItem("userEmail");
  if (!storedEmail) return;

  (async () => {
    try {
      const res = await axios.get(`http://localhost:4000/api/user/${storedEmail}`);
      console.log("Fetched user data:", res.data); // 👈 check structure

      // Safely extract data no matter how backend sends it
      const citizen =
        res.data?.citizen || res.data?.user || res.data?.data || null;

      if (citizen) {
        setFormData((prev) => ({
          ...prev,
          email: citizen?.email || "",
          phone: citizen?.phone_no || "",
        }));
      } else {
        console.warn("Citizen data missing in response");
      }
    } catch (err) {
      console.error("Failed to fetch citizen details:", err);
    }
  })();
}, []);

// ✅ Send issue details via email after successful report
const sendIssueDetails = async (email, issueId) => {
  try {
    const res = await axios.post("http://localhost:4000/api/issue/send-issue-details", {
      email,
      issueId,
    });
    if (res.data?.success) {
      toast.success("📧 Issue details sent to your email!");
    } else {
      toast.error("⚠️ Failed to send issue details email");
    }
  } catch (error) {
    console.error("Error sending issue details:", error);
    toast.error("❌ Server error while sending email");
  }
};

  // ✅ Auto-detect location
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`
          );
          const data = await res.json();
          setFormData((prev) => ({
            ...prev,
            location: data.display_name || `${latitude}, ${longitude}`,
          }));
        } catch {
          setFormData((prev) => ({
            ...prev,
            location: `${latitude}, ${longitude}`,
          }));
        }
      },
      () => console.warn("Geolocation not available")
    );
  }, []);

  // ✅ Handle image upload with progress
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setPreview(URL.createObjectURL(file));
    setUploadingImage(true);
    setUploadProgress(0);

    const formDataObj = new FormData();
    formDataObj.append("image", file);

    try {
      const res = await axios.post("http://localhost:4000/api/image/upload", formDataObj, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (progressEvent) => {
          const percent = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setUploadProgress(percent);
        },
      });

      if (res.data?.success) {
        setFormData((prev) => ({
          ...prev,
          imageURL: res.data.imageURL,
        }));
        toast.success("🖼️ Image uploaded successfully!");
      } else {
        toast.error("❌ Failed to upload image");
      }
    } catch (err) {
      console.error("Image upload error:", err);
      toast.error("⚠️ Server error during image upload");
    } finally {
      setUploadingImage(false);
    }
  };

  // ✅ Handle form submission
 const handleSubmit = useCallback(async () => {
  if (isSubmitting) return;
  if (!validateForm()) {
    setSubmitStatus("error");
    return;
  }

  setIsSubmitting(true);

  try {
    const payload = {
      title: formData.title,
      description: formData.description,
      location: formData.location,
      imageURL: formData.imageURL,
      citizenEmail: formData.email,
      jurisdiction: "Higna Gramin",
    };

    const res = await axios.post("http://localhost:4000/api/issue/report", payload);

    if (res.data?.success) {
      toast.success("✅ Issue reported successfully!");
      const issueId = res.data.issueId || res.data.data?.id || res.data.id;

      if (issueId) {
        localStorage.setItem("issueId", issueId);
        // 📨 Send confirmation email with issue details
        await sendIssueDetails(formData.email, issueId);
      }

      setSubmitStatus("success");
      setFormData((prev) => ({
        ...prev,
        title: "",
        description: "",
        location: "",
        imageURL: "",
      }));
      setPreview(null);
    } else {
      setSubmitStatus("error");
      toast.error("❌ Failed to submit issue");
    }
  } catch (err) {
    console.error("Submit error:", err);
    setSubmitStatus("error");
    toast.error("⚠️ Server error while reporting issue");
  } finally {
    setIsSubmitting(false);
  }
}, [formData, isSubmitting, validateForm]);

  const formFields = useMemo(
    () => [
      {
        id: "title",
        type: "text",
        label: "Issue Title",
        placeholder: "Brief title of the issue",
        required: true,
        icon: FileText,
      },
      {
        id: "description",
        type: "textarea",
        label: "Description",
        placeholder: "Please describe the issue in detail",
        rows: 4,
        required: true,
        icon: MessageSquare,
      },
      {
        id: "location",
        type: "text",
        label: "Location",
        placeholder: "Auto-detected or enter manually",
        required: true,
        icon: MapPin,
      },
    ],
    []
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-emerald-50/30 flex items-center justify-center p-6">
      <div className="w-full max-w-md relative z-10 bg-white rounded-2xl shadow-lg border border-gray-200 p-6 space-y-6">
        <h1 className="text-2xl font-bold text-gray-900 text-center">
          Report an Issue 📝
        </h1>

        {formFields.map((field) => (
          <FormInput
            key={field.id}
            {...field}
            value={formData[field.id]}
            onChange={handleInputChange(field.id)}
            disabled={isSubmitting}
            error={errors[field.id]}
          />
        ))}

        {/* 📸 Image Upload Section */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Upload Image
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            disabled={uploadingImage}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 
                     file:rounded-lg file:border-0 file:text-sm file:font-semibold
                     file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
          />
          {uploadingImage && (
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div
                className="bg-emerald-500 h-2 rounded-full transition-all"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          )}

          {preview && (
            <div className="mt-3">
              <img
                src={preview}
                alt="Preview"
                className="w-full h-48 object-cover rounded-lg shadow-md border"
              />
            </div>
          )}
        </div>

        {/* Citizen Details (non-editable) */}
        <hr className="my-4" />
        <FormInput
          id="phone"
          type="tel"
          label="Phone Number"
          value={formData.phone}
          icon={Phone}
          disabled={true}
        />
        <FormInput
          id="email"
          type="email"
          label="Email Address"
          value={formData.email}
          icon={Mail}
          disabled={true}
        />

        <button
          onClick={handleSubmit}
          disabled={isSubmitting || uploadingImage}
          className={`w-full py-3 px-4 rounded-lg font-medium text-white transition-all ${
            isSubmitting || uploadingImage
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-emerald-600 hover:bg-emerald-700"
          }`}
        >
          {isSubmitting ? "Submitting..." : "Submit Report"}
        </button>

        {submitStatus === "success" && (
          <div className="flex items-center space-x-2 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
            <span className="text-sm text-emerald-700">
              Report submitted successfully!
            </span>
          </div>
        )}
        {submitStatus === "error" && (
          <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <span className="text-sm text-red-700">
              Failed to submit. Please check inputs.
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
