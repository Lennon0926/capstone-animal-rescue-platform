import { FormEvent, useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Animal } from "@/types/animal";
import styles from "./createAnimalForm.module.css";
import { X, Plus, ArrowLeft } from "lucide-react";
import { uploadAnimalImage } from "@/services/animalImageUploadService";

interface CreateAnimalFormProps {
  onSave?: (newAnimal: Animal) => void;
}

// Default empty animal for creation
const getEmptyAnimal = (): Partial<Animal> => ({
  name: "",
  description: "",
  species: "",
  size: "",
  gender: "",
  status: "disponible",
  tags: [],
});

export default function CreateAnimalForm({ onSave }: CreateAnimalFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState(getEmptyAnimal());
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

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
    const tags = formData.tags || [];
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setFormData((prev) => ({
        ...prev,
        tags: [...(prev.tags || []), trimmedTag],
      }));
      setTagInput("");
    }
  };

  const handleRemoveTag = (indexToRemove: number) => {
    setFormData((prev) => ({
      ...prev,
      tags: (prev.tags || []).filter((_, index) => index !== indexToRemove),
    }));
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTag();
    }
  };

  useEffect(() => {
    if (selectedFile) {
      const url = URL.createObjectURL(selectedFile);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setPreviewUrl(null);
    }
  }, [selectedFile]);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!formData.name?.trim()) {
      setErrorMessage("El nombre del animal es requerido.");
      return;
    }

    if (!formData.description?.trim()) {
      setErrorMessage("La descripción es requerida.");
      return;
    }

    if (!formData.species?.trim()) {
      setErrorMessage("La especie es requerida.");
      return;
    }

    if (!formData.size?.trim()) {
      setErrorMessage("El tamaño es requerido.");
      return;
    }

    if (!formData.gender?.trim()) {
      setErrorMessage("El género es requerido.");
      return;
    }

    if (!formData.status?.trim()) {
      setErrorMessage("El estado es requerido.");
      return;
    }

    if (!selectedFile) {
      setErrorMessage("La imagen es requerida.");
      return;
    }

    setIsLoading(true);

    try {
      // Step 1: Upload image to Cloudflare R2 first
      const uploadResult = await uploadAnimalImage("temp", selectedFile);
      
      // Step 2: Create animal record with image URL
      const createResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/animals`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: formData.name,
            description: formData.description,
            species: formData.species,
            size: formData.size,
            gender: formData.gender,
            status: formData.status,
            tags: formData.tags || [],
            image_url: uploadResult.url,
          }),
        }
      );

      if (!createResponse.ok) {
        const errorData = await createResponse.json();
        const errorMessage = 
          errorData?.error?.message || 
          errorData?.error || 
          "Error al crear el animal.";
        throw new Error(typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage));
      }

      const createResult = await createResponse.json();
      const newAnimal = createResult.data;

      setSuccessMessage("¡Animal creado exitosamente con imagen!");

      // Call onSave callback if provided
      if (onSave) {
        onSave(newAnimal);
      }

      // Redirect to animal list after a short delay
      setTimeout(() => {
        router.push("/admin/animals");
      }, 1500);
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
      <div className={styles.container}>
        <Link href="/admin/animals" className={styles.backButton}>
            <ArrowLeft size={20} />
            <span>Volver a la Lista</span>
          </Link>
        <div className={styles.formWrapper}>
        <div className={styles.headerWithBackButton}>
          <h2 className={styles.title}>Crear Nuevo Animal</h2>
        </div>

        <form onSubmit={onSubmit} className={styles.form}>
          {/* Messages */}
          {errorMessage && (
            <div className={styles.errorMessage} role="alert">
              {errorMessage}
            </div>
          )}
          {successMessage && (
            <div className={styles.successMessage} role="status">
              {successMessage}
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
                value={formData.name || ""}
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
                value={formData.description || ""}
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
                  value={formData.species || ""}
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
                  value={formData.size || ""}
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
                  value={formData.gender || ""}
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
                  value={formData.status || "disponible"}
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
            <legend className={styles.legend}>Foto del Animal</legend>
            
            <div className={styles.formGroup}>
              <label htmlFor="image" className={styles.label}>
                Selecciona una imagen
                <span className={styles.required}>*</span>
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
                required
              />
            </div>

            {previewUrl && (
              <div className={styles.formGroup}>
                <p className={styles.label}>Vista previa de la imagen:</p>
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
            <legend className={styles.legend}>Etiquetas (Opcional)</legend>

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

            {(formData.tags || []).length > 0 && (
              <div className={styles.tagsDisplay}>
                {(formData.tags || []).map((tag, index) => (
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

          {/* Form Actions */}
          <div className={styles.formActions}>
            <button
              type="submit"
              disabled={isLoading}
              className={styles.submitButton}
            >
              {isLoading ? "Creando y subiendo imagen..." : "Crear Animal"}
            </button>
          </div>
        </form>
      </div>
    </div>
    </main>
  );
}
