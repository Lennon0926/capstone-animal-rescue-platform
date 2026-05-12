import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getAuthenticatedHeaders } from "@/lib/apiAuth";
import styles from "./usersManagement.module.css";

type UserRecord = {
  id: string;
  email: string;
  full_name: string;
  role_ids: number[];
  role_names: string[];
};

type RoleOption = {
  id: number;
  name: string;
};

type UsersResponse = {
  success: boolean;
  data: UserRecord[];
};

type RolesResponse = {
  success: boolean;
  data: RoleOption[];
};

type UserResponse = {
  success: boolean;
  data?: UserRecord;
  error?: {
    message?: string;
  };
};

type EditFormValues = {
  fullName: string;
  email: string;
  roleId: string;
};

const getInitialEditValues = (): EditFormValues => ({
  fullName: "",
  email: "",
  roleId: "",
});

export default function UsersManagement() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);
  const [isDeletingUserId, setIsDeletingUserId] = useState<string | null>(null);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<EditFormValues>(getInitialEditValues);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const headers = await getAuthenticatedHeaders();
        const [usersResponse, rolesResponse] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/users`, { headers }),
          fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/users/roles`, { headers }),
        ]);

        const usersBody: UsersResponse = await usersResponse.json();
        const rolesBody: RolesResponse = await rolesResponse.json();

        if (!usersResponse.ok || !usersBody.success) {
          throw new Error("Failed to load users.");
        }

        if (!rolesResponse.ok || !rolesBody.success) {
          throw new Error("Failed to load roles.");
        }

        if (!isMounted) return;

        setUsers(usersBody.data);
        setRoles(rolesBody.data);
      } catch (error) {
        if (!isMounted) return;
        const message = error instanceof Error ? error.message : "Failed to load users.";
        setErrorMessage(message);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  const sortedUsers = useMemo(
    () =>
      [...users].sort((a, b) =>
        `${a.full_name} ${a.email}`.localeCompare(`${b.full_name} ${b.email}`),
      ),
    [users],
  );

  const handleEditClick = (user: UserRecord) => {
    setErrorMessage("");
    setSuccessMessage("");
    setEditingUserId(user.id);
    setEditValues({
      fullName: user.full_name,
      email: user.email,
      roleId: user.role_ids[0] ? String(user.role_ids[0]) : "",
    });
  };

  const handleCancelEdit = () => {
    setEditingUserId(null);
    setEditValues(getInitialEditValues());
  };

  const handleEditChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = event.target;
    setEditValues((previousValues) => ({
      ...previousValues,
      [name]: value,
    }));
  };

  const handleEditSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingUserId) return;

    setErrorMessage("");
    setSuccessMessage("");

    if (!editValues.fullName.trim()) {
      setErrorMessage("Full name is required.");
      return;
    }

    if (!editValues.email.trim()) {
      setErrorMessage("Email is required.");
      return;
    }

    if (!editValues.roleId) {
      setErrorMessage("Role is required.");
      return;
    }

    setIsSubmittingEdit(true);

    try {
      const headers = await getAuthenticatedHeaders({
        "Content-Type": "application/json",
      });
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/users/${editingUserId}`,
        {
          method: "PATCH",
          headers,
          body: JSON.stringify({
            full_name: editValues.fullName.trim(),
            email: editValues.email.trim().toLowerCase(),
            role_ids: [Number.parseInt(editValues.roleId, 10)],
          }),
        },
      );

      const responseBody: UserResponse = await response.json();
      if (!response.ok || !responseBody.success || !responseBody.data) {
        throw new Error(responseBody.error?.message || "Failed to update user.");
      }

      setUsers((previousUsers) =>
        previousUsers.map((user) =>
          user.id === editingUserId ? responseBody.data || user : user,
        ),
      );
      setSuccessMessage(`User "${responseBody.data.full_name}" was updated.`);
      setEditingUserId(null);
      setEditValues(getInitialEditValues());
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update user.";
      setErrorMessage(message);
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  const handleDeleteClick = async (user: UserRecord) => {
    const shouldDelete = window.confirm(
      `Are you sure you want to delete "${user.full_name || user.email}"?`,
    );
    if (!shouldDelete) {
      return;
    }

    setErrorMessage("");
    setSuccessMessage("");
    setIsDeletingUserId(user.id);

    try {
      const headers = await getAuthenticatedHeaders();
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/users/${user.id}`, {
        method: "DELETE",
        headers,
      });

      const responseBody: UserResponse = await response.json();
      if (!response.ok || !responseBody.success) {
        throw new Error(responseBody.error?.message || "Failed to delete user.");
      }

      setUsers((previousUsers) => previousUsers.filter((existingUser) => existingUser.id !== user.id));
      setSuccessMessage(`User "${user.full_name || user.email}" was deleted.`);
      if (editingUserId === user.id) {
        setEditingUserId(null);
        setEditValues(getInitialEditValues());
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete user.";
      setErrorMessage(message);
    } finally {
      setIsDeletingUserId(null);
    }
  };

  return (
    <main className="container">
      <section className={styles.container}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Manejo de Usuarios</h1>
            <p className={styles.subtitle}>Maneja los usuarios de tu aplicación, asigna roles y permisos.</p>
          </div>
          <Link href="/admin/createUser/new" className={styles.createButton}>
            + Crear Usuario
          </Link>
        </div>

        {errorMessage ? <p className={styles.errorMessage}>{errorMessage}</p> : null}
        {successMessage ? <p className={styles.successMessage}>{successMessage}</p> : null}

        {isLoading ? (
          <div className={styles.emptyState}>
            <p>Loading users...</p>
          </div>
        ) : sortedUsers.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No users found.</p>
          </div>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th className={styles.actionsHeader}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedUsers.map((user) => {
                  const isEditing = editingUserId === user.id;
                  return (
                    <tr key={user.id}>
                      <td>
                        {isEditing ? (
                          <input
                            name="fullName"
                            type="text"
                            className={styles.input}
                            value={editValues.fullName}
                            onChange={handleEditChange}
                            disabled={isSubmittingEdit}
                          />
                        ) : (
                          user.full_name || "-"
                        )}
                      </td>
                      <td>
                        {isEditing ? (
                          <input
                            name="email"
                            type="email"
                            className={styles.input}
                            value={editValues.email}
                            onChange={handleEditChange}
                            disabled={isSubmittingEdit}
                          />
                        ) : (
                          user.email
                        )}
                      </td>
                      <td>
                        {isEditing ? (
                          <select
                            name="roleId"
                            className={styles.select}
                            value={editValues.roleId}
                            onChange={handleEditChange}
                            disabled={isSubmittingEdit}
                          >
                            <option value="" disabled>
                              Select role
                            </option>
                            {roles.map((role) => (
                              <option key={role.id} value={String(role.id)}>
                                {role.name}
                              </option>
                            ))}
                          </select>
                        ) : user.role_names.length > 0 ? (
                          user.role_names.join(", ")
                        ) : (
                          "-"
                        )}
                      </td>
                      <td>
                        {isEditing ? (
                          <form onSubmit={handleEditSubmit} className={styles.actionButtons}>
                            <button
                              type="submit"
                              className={styles.editButton}
                              disabled={isSubmittingEdit}
                            >
                              {isSubmittingEdit ? "Saving..." : "Save"}
                            </button>
                            <button
                              type="button"
                              onClick={handleCancelEdit}
                              className={styles.cancelButton}
                              disabled={isSubmittingEdit}
                            >
                              Cancel
                            </button>
                          </form>
                        ) : (
                          <div className={styles.actionButtons}>
                            <button
                              type="button"
                              onClick={() => handleEditClick(user)}
                              className={styles.editButton}
                              disabled={isDeletingUserId === user.id}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => void handleDeleteClick(user)}
                              className={styles.deleteButton}
                              disabled={isDeletingUserId === user.id}
                            >
                              {isDeletingUserId === user.id ? "Deleting..." : "Delete"}
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
