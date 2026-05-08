import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getAuthenticatedHeaders } from "@/lib/apiAuth";
import styles from "./createUserForm.module.css";

type CreateUserFormValues = {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  roleId: string;
};

type RoleOption = {
  id: number;
  name: string;
  description?: string | null;
};

type RolesResponse = {
  success: boolean;
  data: RoleOption[];
};

type CreateUserResponse = {
  success: boolean;
  data?: {
    id: string;
    email: string;
    full_name: string;
    role_ids: number[];
  };
  error?: {
    message?: string;
  };
};

const getInitialValues = (): CreateUserFormValues => ({
  fullName: "",
  email: "",
  password: "",
  confirmPassword: "",
  roleId: "",
});

export default function CreateUserForm() {
  const [formValues, setFormValues] = useState<CreateUserFormValues>(getInitialValues);
  const [roleOptions, setRoleOptions] = useState<RoleOption[]>([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingRoles, setIsLoadingRoles] = useState(true);

  const selectedRoleLabel = useMemo(
    () =>
      roleOptions.find((roleOption) => String(roleOption.id) === formValues.roleId)?.name ??
      formValues.roleId,
    [formValues.roleId, roleOptions],
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

    if (!formValues.roleId) {
      return "Role is required.";
    }

    return null;
  };

  useEffect(() => {
    let isMounted = true;

    const loadRoles = async () => {
      try {
        const headers = await getAuthenticatedHeaders();
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/users/roles`,
          { headers },
        );
        const responseBody: RolesResponse = await response.json();

        if (!response.ok || !responseBody.success) {
          throw new Error("Failed to load roles.");
        }

        if (!isMounted) {
          return;
        }

        setRoleOptions(responseBody.data);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        const message =
          error instanceof Error ? error.message : "Failed to load role options.";
        setErrorMessage(message);
      } finally {
        if (isMounted) {
          setIsLoadingRoles(false);
        }
      }
    };

    loadRoles();

    return () => {
      isMounted = false;
    };
  }, []);

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
      const headers = await getAuthenticatedHeaders({
        "Content-Type": "application/json",
      });

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/users`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          full_name: formValues.fullName.trim(),
          email: formValues.email.trim().toLowerCase(),
          password: formValues.password,
          role_ids: [Number.parseInt(formValues.roleId, 10)],
        }),
      });

      const responseBody: CreateUserResponse = await response.json();
      if (!response.ok || !responseBody.success) {
        throw new Error(responseBody.error?.message || "Failed to create user.");
      }

      setSuccessMessage(
        `User "${formValues.fullName.trim()}" was created with role "${selectedRoleLabel}".`,
      );
      setFormValues(getInitialValues());
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create user.";
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const controlsDisabled = isSubmitting || isLoadingRoles;

  return (
    <main className="container">
      <section className={styles.container}>
        <div className={styles.formWrapper}>
          <div className={styles.headerWithBackButton}>
            <Link href="/admin/createUser" className={styles.backButton}>
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
                disabled={controlsDisabled}
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
                  disabled={controlsDisabled}
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="roleId" className={styles.label}>
                  Role <span className={styles.required}>*</span>
                </label>
                <select
                  id="roleId"
                  name="roleId"
                  className={styles.select}
                  value={formValues.roleId}
                  onChange={handleInputChange}
                  required
                  disabled={controlsDisabled}
                >
                  <option value="" disabled>
                    {isLoadingRoles ? "Loading roles..." : "Select a role"}
                  </option>
                  {roleOptions.map((roleOption) => (
                    <option key={roleOption.id} value={String(roleOption.id)}>
                      {roleOption.name}
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
                  disabled={controlsDisabled}
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
                  disabled={controlsDisabled}
                />
              </div>
            </div>

            <button type="submit" className={styles.submitButton} disabled={controlsDisabled}>
              {isSubmitting ? "Creating..." : "Create user"}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
