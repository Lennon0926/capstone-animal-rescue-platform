import { FormEvent, useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getAnimalImageUrl } from "@/utils/animalImages";
import { uploadAnimalImage } from "@/services/animalImageUploadService";
import type { Animal } from "@/types/animal";
import styles from "./editAnimalForm.module.css";
import { X, Plus, ArrowLeft } from "lucide-react";

interface EditAnimalFormProps {
  animal?: Animal;
  onSave?: (updatedAnimal: Animal) => void;
  error?: string;
  notFound?: boolean;
}

export default function EditAnimalForm({ animal, onSave, error, notFound }: EditAnimalFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState<Animal>(animal || {} as Animal);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Reset form when animal changes
  useEffect(() => {
    if (animal) {
      setFormData(animal);
      setErrorMessage("");
      setSuccessMessage("");
      setSelectedFile(null);
    }
  }, [animal]);

  // Create preview URL when file is selected
  useEffect(() => {
    if (selectedFile) {
      const url = URL.createObjectURL(selectedFile);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setPreviewUrl(null);
    }
  }, [selectedFile]);

  // Auto-close success message and redirect after 2 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage("");
        router.push("/admin/animals");
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [successMessage, router]);

  // Handle error state
  if (error) {
    return (
      <main>
        <div className={styles.errorContainer}>
          <h1>Error</h1>
          <p>{error}</p>
        </div>
      </main>
    );
  }

  // Handle not found state
  if (notFound) {
    return (
      <main>
        <div className={styles.notFoundContainer}>
          <h1>Animal Not Found</h1>
          <p>The animal you&apos;re trying to edit could not be found.</p>
        </div>
      </main>
    );
  }

  // Handle missing animal
  if (!animal) {
    return (
      <main>
        <div className={styles.notFoundContainer}>
          <h1>Loading...</h1>
          <p>Please wait while we load the animal data.</p>
        </div>
      </main>
    );
  }

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAddTag = () => {
    const trimmedTag = tagInput.trim();
    if (trimmedTag && !formData.tags.includes(trimmedTag)) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, trimmedTag],
      }));
      setTagInput("");
    }
  };

  const handleRemoveTag = (indexToRemove: number) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((_, index) => index !== indexToRemove),
    }));
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTag();
    }
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!formData.name.trim()) {
      setErrorMessage("El nombre del animal es requerido.");
      return;
    }

    if (!formData.species.trim()) {
      setErrorMessage("La especie es requerida.");
      return;
    }

    if (!formData.size.trim()) {
      setErrorMessage("El tamaño es requerido.");
      return;
    }

    if (!formData.gender.trim()) {
      setErrorMessage("El género es requerido.");
      return;
    }

    if (!formData.status.trim()) {
      setErrorMessage("El estado es requerido.");
      return;
    }

    setIsLoading(true);

    try {
      const updateBody: Partial<Animal> = {
        name: formData.name,
        description: formData.description,
        species: formData.species,
        size: formData.size,
        gender: formData.gender,
        status: formData.status,
        tags: formData.tags,
      };

      // If a new image was selected, upload it first
      if (selectedFile) {
        const uploadResult = await uploadAnimalImage(String(formData.aid), selectedFile);
        updateBody.image_url = uploadResult.url;
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/animals/${formData.aid}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updateBody),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = 
          errorData?.error?.message || 
          errorData?.error || 
          "Error al actualizar el animal.";
        throw new Error(typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage));
      }

      const result = await response.json();
      setSuccessMessage("¡Animal actualizado exitosamente!");
      setSelectedFile(null);
      
      // Call onSave callback if provided
      if (onSave) {
        onSave(result.data || formData);
      }

      // Update form with the returned data
      setFormData(result.data || formData);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Error inesperado."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main>
      {/* Success Popup Modal */}
      {successMessage && (
        <>
          <div className={styles.overlay} />
          <div className={styles.successPopup} role="status">
            <div className={styles.successPopupIcon}>✓</div>
            <p className={styles.successPopupText}>¡Éxito!</p>
            <p className={styles.successPopupSubtext}>{successMessage}</p>
          </div>
        </>
      )}

      <div className={styles.container}>
        <Link href="/admin/animals" className={styles.backButton}>
            <ArrowLeft size={20} />
            <span>Volver a la Lista</span>
        </Link>
        <div className={styles.formWrapper}>
        <div className={styles.formHeader}>
          <h2 className={styles.title}>Editar Detalles del Animal</h2>
        </div>

        {/* Current Image Preview */}
        {formData.image_url && (
          <div className={styles.imagePreviewSection}>
            <h3 className={styles.sectionLabel}>Imagen Actual</h3>
            <div className={styles.imagePreview}>
              <Image
                src={getAnimalImageUrl(formData.image_url, formData.species, formData.aid)}
                alt={formData.name}
                fill
                style={{ objectFit: "cover" }}
              />
            </div>
          </div>
        )}

        <form onSubmit={onSubmit} className={styles.form}>
          {/* Messages */}
          {errorMessage && (
            <div className={styles.errorMessage} role="alert">
              {errorMessage}
            </div>
          )}

          {/* Basic Information Section */}
          <fieldset className={styles.fieldset}>
            <legend className={styles.legend}>Información Básica</legend>

            <div className={styles.formGroup}>
              <label htmlFor="name" className={styles.label}>
                Nombre <span className={styles.required}>*</span>
              </label>
              <input
                id="name"
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className={styles.input}
                placeholder="Ingresa el nombre del animal"
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="description" className={styles.label}>
                Descripción <span className={styles.required}>*</span>
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className={styles.textarea}
                placeholder="Ingresa una descripción detallada"
                rows={5}
                required
              />
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="species" className={styles.label}>
                  Especie <span className={styles.required}>*</span>
                </label>
                <select
                  id="species"
                  name="species"
                  value={formData.species}
                  onChange={handleInputChange}
                  className={styles.select}
                  required
                >
                  <option value="">Selecciona la especie</option>
                  <option value="perro">Perro</option>
                  <option value="gato">Gato</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="size" className={styles.label}>
                  Tamaño <span className={styles.required}>*</span>
                </label>
                <select
                  id="size"
                  name="size"
                  value={formData.size}
                  onChange={handleInputChange}
                  className={styles.select}
                  required
                >
                  <option value="">Selecciona el tamaño</option>
                  <option value="pequeño">Pequeño</option>
                  <option value="mediano">Mediano</option>
                  <option value="grande">Grande</option>
                  <option value="muy grande">Muy Grande</option>
                </select>
              </div>
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="gender" className={styles.label}>
                  Género <span className={styles.required}>*</span>
                </label>
                <select
                  id="gender"
                  name="gender"
                  value={formData.gender}
                  onChange={handleInputChange}
                  className={styles.select}
                  required
                >
                  <option value="">Selecciona el género</option>
                  <option value="macho">Macho</option>
                  <option value="hembra">Hembra</option>
                  <option value="desconocido">Desconocido</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="status" className={styles.label}>
                  Estado <span className={styles.required}>*</span>
                </label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className={styles.select}
                  required
                >
                  <option value="">Selecciona el estado</option>
                  <option value="disponible">Disponible</option>
                  <option value="adoptado">Adoptado</option>
                  <option value="pendiente">Pendiente</option>
                  <option value="en hogar temporal">En Hogar Temporal</option>
                  <option value="atención médica">Atención Médica</option>
                </select>
              </div>
            </div>
          </fieldset>

          {/* Image Upload Section */}
          <fieldset className={styles.fieldset}>
            <legend className={styles.legend}>Actualizar Foto del Animal</legend>
            
            <div className={styles.formGroup}>
              <label htmlFor="image" className={styles.label}>
                Selecciona una nueva imagen (Opcional)
              </label>
              <p className={styles.helpText}>
                Formatos permitidos: JPEG, PNG, WEBP. Tamaño máximo: 5 MB.
              </p>
              <input
                id="image"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(event) => setSelectedFile(event.target.files?.[0] || null)}
                className={styles.input}
              />
            </div>

            {previewUrl && (
              <div className={styles.formGroup}>
                <p className={styles.label}>Vista previa de la nueva imagen:</p>
                <div style={{
                  width: "150px",
                  height: "150px",
                  position: "relative",
                  borderRadius: "8px",
                  overflow: "hidden",
                  border: "2px solid #4CAF50",
                }}>
                  <Image
                    src={previewUrl}
                    alt="Vista previa"
                    fill
                    style={{ objectFit: "cover" }}
                  />
                </div>
              </div>
            )}
          </fieldset>

          {/* Tags Section */}
          <fieldset className={styles.fieldset}>
            <legend className={styles.legend}>Etiquetas</legend>

            <div className={styles.formGroup}>
              <label htmlFor="tagInput" className={styles.label}>
                Agregar Etiquetas
              </label>
              <div className={styles.tagInputWrapper}>
                <input
                  id="tagInput"
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagKeyDown}
                  className={styles.input}
                  placeholder="Escribe una etiqueta y presiona Enter o haz clic en Agregar"
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  className={styles.addTagButton}
                  title="Agregar etiqueta"
                >
                  <Plus size={18} />
                </button>
              </div>
              <p className={styles.helpText}>
                Presiona Enter o haz clic en el botón + para agregar etiquetas
              </p>
            </div>

            {formData.tags.length > 0 && (
              <div className={styles.tagsDisplay}>
                {formData.tags.map((tag, index) => (
                  <div key={index} className={styles.tag}>
                    <span>{tag}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(index)}
                      className={styles.removeTagButton}
                      title={`Remover etiqueta: ${tag}`}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </fieldset>

          {/* Additional Information */}
          <fieldset className={styles.fieldset}>
            <legend className={styles.legend}>Información Adicional</legend>

            <div className={styles.formGroup}>
              <label htmlFor="aid" className={styles.label}>
                ID del Animal
              </label>
              <input
                id="aid"
                type="number"
                value={formData.aid}
                disabled
                className={styles.inputDisabled}
              />
              <p className={styles.helpText}>Campo de solo lectura</p>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="created_at" className={styles.label}>
                Creado en
              </label>
              <input
                id="created_at"
                type="text"
                value={new Date(formData.created_at).toLocaleString('es-MX')}
                disabled
                className={styles.inputDisabled}
              />
              <p className={styles.helpText}>Campo de solo lectura</p>
            </div>
          </fieldset>

          {/* Form Actions */}
          <div className={styles.formActions}>
            <button
              type="submit"
              disabled={isLoading}
              className={styles.submitButton}
            >
              {isLoading ? "Guardando cambios..." : "Guardar Cambios"}
            </button>
          </div>
        </form>
      </div>
    </div>
    </main>
  );
}
