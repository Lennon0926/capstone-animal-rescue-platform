import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import styles from "./createUserForm.module.css";

type CreateUserFormValues = {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: string;
};

const ROLE_OPTIONS = [
  { value: "admin", label: "Admin" },
  { value: "staff", label: "Staff" },
  { value: "volunteer", label: "Volunteer" },
];

const getInitialValues = (): CreateUserFormValues => ({
  fullName: "",
  email: "",
  password: "",
  confirmPassword: "",
  role: "",
});

export default function CreateUserForm() {
  const [formValues, setFormValues] = useState<CreateUserFormValues>(getInitialValues);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedRoleLabel = useMemo(
    () =>
      ROLE_OPTIONS.find((roleOption) => roleOption.value === formValues.role)?.label ??
      formValues.role,
    [formValues.role],
  );

  const handleInputChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = event.target;

    setFormValues((previousValues) => ({
      ...previousValues,
      [name]: value,
    }));
  };

  const validateForm = (): string | null => {
    if (!formValues.fullName.trim()) {
      return "Full name is required.";
    }

    if (!formValues.email.trim()) {
      return "Email is required.";
    }

    if (!formValues.password) {
      return "Password is required.";
    }

    if (formValues.password.length < 6) {
      return "Password must be at least 6 characters.";
    }

    if (formValues.password !== formValues.confirmPassword) {
      return "Passwords do not match.";
    }

    if (!formValues.role) {
      return "Role is required.";
    }

    return null;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    const validationError = validateForm();
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    setIsSubmitting(true);

    try {
      // Frontend-only scaffold for the future API integration:
      // - create user in Supabase Auth
      // - assign selected role in app role table
      console.log("Create user payload (frontend scaffold):", {
        full_name: formValues.fullName.trim(),
        email: formValues.email.trim().toLowerCase(),
        password: formValues.password,
        role: formValues.role,
      });

      setSuccessMessage(
        `User form is ready. "${formValues.fullName.trim()}" will be created with role "${selectedRoleLabel}" once backend integration is connected.`,
      );
      setFormValues(getInitialValues());
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="container">
      <section className={styles.container}>
        <div className={styles.formWrapper}>
          <div className={styles.headerWithBackButton}>
            <Link href="/admin/home" className={styles.backButton}>
              <ArrowLeft size={18} />
              Back to dashboard
            </Link>
            <h1 className={styles.title}>Create User</h1>
            <p className={styles.subtitle}>
              Add a new user for Supabase authentication and choose their role.
            </p>
          </div>

          {errorMessage ? <p className={styles.errorMessage}>{errorMessage}</p> : null}
          {successMessage ? <p className={styles.successMessage}>{successMessage}</p> : null}

          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.formGroup}>
              <label htmlFor="fullName" className={styles.label}>
                Full name <span className={styles.required}>*</span>
              </label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                className={styles.input}
                placeholder="Jane Doe"
                value={formValues.fullName}
                onChange={handleInputChange}
                required
                disabled={isSubmitting}
              />
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="email" className={styles.label}>
                  Email <span className={styles.required}>*</span>
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  className={styles.input}
                  placeholder="user@example.com"
                  value={formValues.email}
                  onChange={handleInputChange}
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="role" className={styles.label}>
                  Role <span className={styles.required}>*</span>
                </label>
                <select
                  id="role"
                  name="role"
                  className={styles.select}
                  value={formValues.role}
                  onChange={handleInputChange}
                  required
                  disabled={isSubmitting}
                >
                  <option value="" disabled>
                    Select a role
                  </option>
                  {ROLE_OPTIONS.map((roleOption) => (
                    <option key={roleOption.value} value={roleOption.value}>
                      {roleOption.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="password" className={styles.label}>
                  Password <span className={styles.required}>*</span>
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  className={styles.input}
                  placeholder="At least 6 characters"
                  value={formValues.password}
                  onChange={handleInputChange}
                  required
                  minLength={6}
                  disabled={isSubmitting}
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="confirmPassword" className={styles.label}>
                  Confirm password <span className={styles.required}>*</span>
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  className={styles.input}
                  placeholder="Repeat password"
                  value={formValues.confirmPassword}
                  onChange={handleInputChange}
                  required
                  minLength={6}
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <button type="submit" className={styles.submitButton} disabled={isSubmitting}>
              {isSubmitting ? "Preparing..." : "Create user"}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
