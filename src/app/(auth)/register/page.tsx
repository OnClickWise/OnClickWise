"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import {
  Building2,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  Phone,
} from "lucide-react";
import { Logo } from "@/components/Logo";

/* =======================
   TYPES
======================= */

interface CompanyData {
  name: string;
  slug: string;
  email: string;
  company_id: string;
  password: string;
  password_confirm: string;
  phone: string;
}

/* =======================
   PAGE
======================= */

export default function RegisterPage() {
  const router = useRouter();
  const t = useTranslations("Register");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  const [formData, setFormData] = useState<CompanyData>({
    name: "",
    slug: "",
    email: "",
    company_id: "",
    password: "",
    password_confirm: "",
    phone: "",
  });

  /* =======================
     LOGIC (INALTERADA)
  ======================= */

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const generateSlug = (name: string) =>
    name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setFormData((prev) => ({
      ...prev,
      name,
      slug: generateSlug(name),
    }));
  };

  const validateForm = () => {
    if (
      !formData.name ||
      !formData.email ||
      !formData.company_id ||
      !formData.password
    ) {
      setError(t("errorAllFieldsRequired"));
      return false;
    }
    if (formData.password !== formData.password_confirm) {
      setError(t("errorPasswordsDoNotMatch"));
      return false;
    }
    if (formData.password.length < 6) {
      setError(t("errorPasswordMinLength"));
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError(t("errorInvalidEmail"));
      return false;
    }
    if (!termsAccepted) {
      setError(t("errorAcceptTerms"));
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!validateForm()) {
      setLoading(false);
      return;
    }

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
      const response = await fetch(`${apiUrl}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organization: {
            name: formData.name,
            slug: formData.slug,
            email: formData.email,
            company_id: formData.company_id,
            password: formData.password,
            phone: formData.phone,
            address: "",
            city: "",
            state: "",
            country: "United States",
            zipCode: "",
          },
          representative: {},
        }),
      });

      const result = await response.json();

      if (result.success) {
        localStorage.setItem("token", result.token);
        localStorage.setItem(
          "organization",
          JSON.stringify(result.organization),
        );
        router.push(`/${result.organization.slug}/dashboard`);
      } else {
        setError(result.error || t("errorCreatingAccount"));
      }
    } catch {
      setError(t("errorCreatingAccount"));
    } finally {
      setLoading(false);
    }
  };

  /* =======================
     UI
  ======================= */

  return (
    <div className="min-h-screen w-full flex bg-white">
      {/* RIGHT — BRANDING */}
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-blue-700 to-blue-900 items-center justify-center p-10 rounded-r-[80px] shadow-2xl">
        <div className="max-w-md text-white space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
              <Building2 className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-bold">Plataforma Corporativa</h2>
          </div>

          <p className="text-blue-100 text-lg leading-relaxed">
            Centralize vendas, automações e comunicação em um único lugar.
          </p>

          <ul className="space-y-3 text-blue-100 text-sm pt-4">
            <li>✔ Cadastro rápido por organização</li>
            <li>✔ Ambiente corporativo seguro</li>
            <li>✔ Escalável desde o primeiro dia</li>
          </ul>
        </div>
      </div>

      {/* LEFT — FORM */}
      <div className="w-full lg:w-1/2 h-screen flex justify-center px-4 sm:px-6">
        {/* Scroll container */}
        <div
          className="w-full max-w-xl overflow-y-auto py-10
                  scrollbar-thin
                  scrollbar-thumb-gray-300
                  scrollbar-track-transparent"
        >
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <Logo width={160} height={0} />
          </div>

          {/* Card */}
          <div className="bg-white rounded-xl shadow-xl p-6 sm:p-8">
            {/* Header */}
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-gray-900">
                {t("pageTitle")}
              </h1>
              <p className="text-gray-600 mt-1 text-sm">
                Crie sua conta e comece em minutos
              </p>
            </div>

            {/* FORM */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* COMPANY */}
              <Section title={t("companyInformation")} icon={Building2}>
                <InputField
                  label={t("companyName")}
                  value={formData.name}
                  onChange={handleNameChange}
                  required
                />

                <InputBlock label={t("companyUrl")}>
                  <Input
                    value={formData.slug}
                    disabled
                    className="h-11 rounded-lg"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    onclickwise.com/
                    <span className="text-blue-600 font-medium">
                      {formData.slug || "sua-empresa"}
                    </span>
                  </p>
                </InputBlock>

                <div className="grid sm:grid-cols-2 gap-3">
                  <InputField
                    label={t("companyId")}
                    name="company_id"
                    value={formData.company_id}
                    onChange={handleInputChange}
                    required
                  />

                  <InputField
                    label={t("companyEmail")}
                    icon={Mail}
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <InputField
                  label={t("phoneNumber")}
                  icon={Phone}
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                />
              </Section>

              {/* SECURITY */}
              <Section title={t("security")} icon={Lock}>
                <PasswordField
                  label={t("password")}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  show={showPassword}
                  toggle={() => setShowPassword(!showPassword)}
                />

                <PasswordField
                  label={t("confirmPassword")}
                  name="password_confirm"
                  value={formData.password_confirm}
                  onChange={handleInputChange}
                  show={showConfirmPassword}
                  toggle={() => setShowConfirmPassword(!showConfirmPassword)}
                />
              </Section>

              {/* TERMS */}
              <label className="flex gap-3 text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="accent-blue-600 mt-1"
                />
                {t("acceptTerms")}
              </label>

              {/* ERROR */}
              {error && (
                <div className="bg-red-50 border border-red-100 text-red-600 text-sm p-3 rounded-lg">
                  {error}
                </div>
              )}

              {/* ACTIONS */}
              <div className="flex flex-col sm:flex-row gap-4 pt-2">
                <button
                  disabled={loading}
                  className="flex-1 h-11 bg-blue-600 hover:bg-blue-700
                       text-white rounded-lg font-semibold
                       flex items-center justify-center transition"
                >
                  {loading ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    t("createAccount")
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => router.push("/login")}
                  className="flex-1 h-11 border rounded-lg font-semibold
                       hover:bg-gray-50 transition"
                >
                  {t("alreadyHaveAccount")}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

/* =======================
   UI HELPERS
======================= */

function Section({ title, icon: Icon, children }: any) {
  return (
    <section className="space-y-4">
      <h2 className="flex items-center gap-2 text-lg font-semibold">
        <Icon className="w-5 h-5 text-blue-600" />
        {title}
      </h2>
      {children}
    </section>
  );
}

function InputBlock({ label, required, children }: any) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}

function InputField({ label, icon: Icon, ...props }: any) {
  return (
    <InputBlock label={label} required={props.required}>
      <div className="relative">
        {Icon && (
          <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        )}
        <Input
          {...props}
          className={`h-11 rounded-lg ${Icon ? "pl-10" : ""} focus:ring-2 focus:ring-blue-500/20`}
        />
      </div>
    </InputBlock>
  );
}

function PasswordField({ label, value, onChange, show, toggle, name }: any) {
  return (
    <InputBlock label={label}>
      <div className="relative">
        <Input
          name={name}
          type={show ? "text" : "password"}
          value={value}
          onChange={onChange}
          className="h-11 rounded-lg pr-10 focus:ring-2 focus:ring-blue-500/20"
        />
        <button
          type="button"
          onClick={toggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          {show ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </InputBlock>
  );
}
