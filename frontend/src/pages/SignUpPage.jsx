import { useState, useEffect } from "react";
import { useAuthStore } from "../store/useAuthStore";
import BorderAnimatedContainer from "../components/BorderAnimatedContainer";
import { MessageCircleIcon, LockIcon, MailIcon, UserIcon, LoaderIcon, CheckCircleIcon, XCircleIcon } from "lucide-react";
import { Link } from "react-router";
import { useDebounce } from "../hooks/useDebounce";
import {
    validateEmail,
    validateFullName,
    validatePassword,
    getPasswordStrengthBg,
    getPasswordStrengthWidth,
    getPasswordStrengthColor
} from "../lib/validators";

function SignUpPage() {
    const [formData, setFormData] = useState({ fullName: "", email: "", password: "" });
    const { signup, isSigningUp } = useAuthStore();

    // Validation error states
    const [errors, setErrors] = useState({
        fullName: "",
        email: "",
        password: ""
    });
    const [passwordStrength, setPasswordStrength] = useState("weak");

    // Debounced values - validation only runs 300ms after typing stops
    const debouncedName = useDebounce(formData.fullName, 300);
    const debouncedEmail = useDebounce(formData.email, 300);
    const debouncedPassword = useDebounce(formData.password, 300);

    // Validate full name when debounced value changes
    useEffect(() => {
        const result = validateFullName(debouncedName);
        setErrors(prev => ({ ...prev, fullName: result.error }));
    }, [debouncedName]);

    // Validate email when debounced value changes
    useEffect(() => {
        const result = validateEmail(debouncedEmail);
        setErrors(prev => ({ ...prev, email: result.error }));
    }, [debouncedEmail]);

    // Validate password when debounced value changes
    useEffect(() => {
        const result = validatePassword(debouncedPassword);
        setErrors(prev => ({ ...prev, password: result.error }));
        setPasswordStrength(result.strength);
    }, [debouncedPassword]);

    // Check if form is valid for submission
    const isFormValid = () => {
        const nameResult = validateFullName(formData.fullName);
        const emailResult = validateEmail(formData.email);
        const passwordResult = validatePassword(formData.password);
        return nameResult.isValid && emailResult.isValid && passwordResult.isValid;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (isFormValid()) {
            signup(formData);
        }
    };

    return (
        <div className="w-full min-h-screen flex items-start md:items-center justify-center py-8 px-4 bg-slate-900 overflow-y-auto">
            <div className="relative w-full max-w-6xl">
                <BorderAnimatedContainer>
                    <div className="w-full flex flex-col md:flex-row">
                        {/* FORM COLUMN - LEFT SIDE */}
                        <div className="md:w-1/2 p-6 md:p-8 flex items-center justify-center md:border-r border-slate-600/30">
                            <div className="w-full max-w-md">
                                {/* HEADING TEXT */}
                                <div className="text-center mb-8">
                                    <MessageCircleIcon className="w-12 h-12 mx-auto text-slate-400 mb-4" />
                                    <h2 className="text-2xl font-bold text-slate-200 mb-2">Create Account</h2>
                                    <p className="text-slate-400">Sign up for a new account</p>
                                </div>

                                {/* FORM */}
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    {/* FULL NAME */}
                                    <div>
                                        <label className="auth-input-label">Full Name</label>
                                        <div className="relative">
                                            <UserIcon className="auth-input-icon" />
                                            <input
                                                type="text"
                                                value={formData.fullName}
                                                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                                className={`input ${errors.fullName ? 'border-red-500 focus:ring-red-500' : formData.fullName && !errors.fullName ? 'border-green-500 focus:ring-green-500' : ''}`}
                                                placeholder="Abhijith"
                                            />
                                            {/* Validation indicator */}
                                            {formData.fullName && (
                                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                                    {errors.fullName ? (
                                                        <XCircleIcon className="w-5 h-5 text-red-400" />
                                                    ) : (
                                                        <CheckCircleIcon className="w-5 h-5 text-green-400" />
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        {/* Error message */}
                                        {errors.fullName && (
                                            <p className="mt-1 text-sm text-red-400">{errors.fullName}</p>
                                        )}
                                    </div>

                                    {/* EMAIL INPUT */}
                                    <div>
                                        <label className="auth-input-label">Email</label>
                                        <div className="relative">
                                            <MailIcon className="auth-input-icon" />
                                            <input
                                                type="email"
                                                value={formData.email}
                                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                className={`input ${errors.email ? 'border-red-500 focus:ring-red-500' : formData.email && !errors.email ? 'border-green-500 focus:ring-green-500' : ''}`}
                                                placeholder="abhijithwinddaa@gmail.com"
                                            />
                                            {/* Validation indicator */}
                                            {formData.email && (
                                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                                    {errors.email ? (
                                                        <XCircleIcon className="w-5 h-5 text-red-400" />
                                                    ) : (
                                                        <CheckCircleIcon className="w-5 h-5 text-green-400" />
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        {/* Error message */}
                                        {errors.email && (
                                            <p className="mt-1 text-sm text-red-400">{errors.email}</p>
                                        )}
                                    </div>

                                    {/* PASSWORD INPUT */}
                                    <div>
                                        <label className="auth-input-label">Password</label>
                                        <div className="relative">
                                            <LockIcon className="auth-input-icon" />
                                            <input
                                                type="password"
                                                value={formData.password}
                                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                                className={`input ${errors.password && formData.password.length < 6 ? 'border-red-500 focus:ring-red-500' : ''}`}
                                                placeholder="Enter your password"
                                            />
                                        </div>
                                        {/* Password strength indicator */}
                                        {formData.password && (
                                            <div className="mt-2">
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="text-xs text-slate-400">Password strength:</span>
                                                    <span className={`text-xs font-medium capitalize ${getPasswordStrengthColor(passwordStrength)}`}>
                                                        {passwordStrength}
                                                    </span>
                                                </div>
                                                <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full transition-all duration-300 rounded-full ${getPasswordStrengthBg(passwordStrength)}`}
                                                        style={{ width: getPasswordStrengthWidth(passwordStrength) }}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                        {/* Error/hint message */}
                                        {errors.password && (
                                            <p className={`mt-1 text-sm ${formData.password.length < 6 ? 'text-red-400' : 'text-yellow-400'}`}>
                                                {errors.password}
                                            </p>
                                        )}
                                    </div>

                                    {/* SUBMIT BUTTON */}
                                    <button
                                        className="auth-btn disabled:opacity-50 disabled:cursor-not-allowed"
                                        type="submit"
                                        disabled={isSigningUp || !isFormValid()}
                                    >
                                        {isSigningUp ? (
                                            <LoaderIcon className="w-full h-5 animate-spin text-center" />
                                        ) : (
                                            "Create Account"
                                        )}
                                    </button>
                                </form>

                                {/* DIVIDER */}
                                <div className="flex items-center my-6">
                                    <div className="flex-1 border-t border-slate-600/50"></div>
                                    <span className="px-4 text-slate-500 text-sm">OR</span>
                                    <div className="flex-1 border-t border-slate-600/50"></div>
                                </div>

                                {/* GOOGLE SIGN-UP BUTTON */}
                                <a
                                    href={`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/auth/google`}
                                    className="w-full flex items-center justify-center gap-3 bg-white text-gray-700 border border-gray-300 rounded-lg py-3 px-4 font-medium hover:bg-gray-50 transition-colors"
                                >
                                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                    </svg>
                                    Continue with Google
                                </a>

                                <div className="mt-6 text-center">
                                    <Link to="/login" className="auth-link">
                                        Already have an account? Login
                                    </Link>
                                </div>
                            </div>
                        </div>

                        {/* FORM ILLUSTRATION - RIGHT SIDE */}
                        <div className="hidden md:w-1/2 md:flex items-center justify-center p-6 bg-gradient-to-bl from-slate-800/20 to-transparent">
                            <div>
                                <img
                                    src="/signup.png"
                                    alt="People using mobile devices"
                                    className="w-full h-auto object-contain"
                                />
                                <div className="mt-6 text-center">
                                    <h3 className="text-xl font-medium text-cyan-400">Start Your Journey Today</h3>

                                    <div className="mt-4 flex justify-center gap-4">
                                        <span className="auth-badge">Free</span>
                                        <span className="auth-badge">Easy Setup</span>
                                        <span className="auth-badge">Private</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </BorderAnimatedContainer>
            </div>
        </div>
    );
}
export default SignUpPage;
