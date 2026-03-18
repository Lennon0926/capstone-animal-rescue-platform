import { FormEvent, useState, useEffect } from "react";
import Image from "next/image";

import {
  AnimalImageUploadResult,
  Animal,
  fetchAnimals,
  uploadAndUpdateAnimalImage,
} from "@/services/animalImageUploadService";
import { getAnimalImageUrl } from "@/utils/animalImages";

const AnimalImageUploadForm = () => {
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [selectedAnimalId, setSelectedAnimalId] = useState<number | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [uploadResult, setUploadResult] =
    useState<AnimalImageUploadResult | null>(null);

  // Fetch animals on mount
  useEffect(() => {
    const loadAnimals = async () => {
      try {
        const animalsData = await fetchAnimals();
        setAnimals(animalsData);
      } catch (error) {
        setErrorMessage(
          error instanceof Error ? error.message : "Failed to load animals."
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadAnimals();
  }, []);

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

  const selectedAnimal = animals.find((a) => a.aid === selectedAnimalId);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    setUploadResult(null);

    if (!selectedAnimalId) {
      setErrorMessage("Please select an animal.");
      return;
    }

    if (!selectedFile) {
      setErrorMessage("Please select an image file.");
      return;
    }

    setIsUploading(true);

    try {
      const { uploadResult: result, animal } = await uploadAndUpdateAnimalImage(
        selectedAnimalId,
        selectedFile
      );
      setUploadResult(result);
      setSuccessMessage(`Image uploaded successfully for ${animal.name}!`);

      // Update the animal in the local list
      setAnimals((prev) =>
        prev.map((a) => (a.aid === animal.aid ? animal : a))
      );

      // Reset file selection
      setSelectedFile(null);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unexpected upload error."
      );
    } finally {
      setIsUploading(false);
    }
  };

  if (isLoading) {
    return (
      <section style={{ marginTop: "2rem" }}>
        <h2>Upload Animal Photo</h2>
        <p>Loading animals...</p>
      </section>
    );
  }

  return (
    <section style={{ marginTop: "2rem" }}>
      <h2>Upload Animal Photo</h2>
      <p>
        Upload a photo directly to Cloudflare R2 storage and update the
        animal&apos;s profile.
      </p>
      <p style={{ fontSize: "0.875rem", color: "#666" }}>
        Allowed formats: JPEG, PNG, WEBP. Max size: 5 MB.
      </p>

      <form
        onSubmit={onSubmit}
        style={{ display: "grid", gap: "1rem", maxWidth: "32rem" }}
      >
        {/* Animal Selection */}
        <label>
          <span style={{ display: "block", marginBottom: "0.25rem", fontWeight: 500 }}>
            Select Animal
          </span>
          <select
            required
            value={selectedAnimalId ?? ""}
            onChange={(e) => setSelectedAnimalId(Number(e.target.value) || null)}
            style={{
              display: "block",
              width: "100%",
              padding: "0.5rem",
              borderRadius: "4px",
              border: "1px solid #ccc",
            }}
          >
            <option value="">-- Select an animal --</option>
            {animals.map((animal) => (
              <option key={animal.aid} value={animal.aid}>
                {animal.name} ({animal.species}) - ID: {animal.aid}
              </option>
            ))}
          </select>
        </label>

        {/* Current Image Preview */}
        {selectedAnimal && (
          <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}>
            <div>
              <p style={{ fontSize: "0.875rem", marginBottom: "0.25rem" }}>
                Current Image:
              </p>
              <div
                style={{
                  width: "120px",
                  height: "120px",
                  position: "relative",
                  borderRadius: "8px",
                  overflow: "hidden",
                  border: "1px solid #ddd",
                }}
              >
                <Image
                  src={getAnimalImageUrl(
                    selectedAnimal.image_url,
                    selectedAnimal.species,
                    selectedAnimal.aid
                  )}
                  alt={selectedAnimal.name}
                  fill
                  style={{ objectFit: "cover" }}
                />
              </div>
            </div>

            {previewUrl && (
              <div>
                <p style={{ fontSize: "0.875rem", marginBottom: "0.25rem" }}>
                  New Image Preview:
                </p>
                <div
                  style={{
                    width: "120px",
                    height: "120px",
                    position: "relative",
                    borderRadius: "8px",
                    overflow: "hidden",
                    border: "2px solid #4CAF50",
                  }}
                >
                  <Image
                    src={previewUrl}
                    alt="Preview"
                    fill
                    style={{ objectFit: "cover" }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* File Input */}
        <label>
          <span style={{ display: "block", marginBottom: "0.25rem", fontWeight: 500 }}>
            Image File
          </span>
          <input
            required
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(event) =>
              setSelectedFile(event.target.files?.[0] || null)
            }
            style={{ display: "block", width: "100%" }}
          />
        </label>

        <button
          type="submit"
          disabled={isUploading || !selectedAnimalId || !selectedFile}
          style={{
            padding: "0.75rem 1.5rem",
            backgroundColor: isUploading ? "#ccc" : "#4CAF50",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: isUploading ? "not-allowed" : "pointer",
            fontWeight: 500,
          }}
        >
          {isUploading ? "Uploading to Cloudflare R2..." : "Upload Image"}
        </button>
      </form>

      {errorMessage && (
        <p style={{ color: "#b00020", marginTop: "0.75rem" }}>{errorMessage}</p>
      )}

      {successMessage && (
        <p style={{ color: "#2e7d32", marginTop: "0.75rem", fontWeight: 500 }}>
          {successMessage}
        </p>
      )}

      {uploadResult && (
        <div
          style={{
            marginTop: "1rem",
            padding: "1rem",
            backgroundColor: "#f5f5f5",
            borderRadius: "8px",
          }}
        >
          <p style={{ fontWeight: 500, marginBottom: "0.5rem" }}>
            Upload Details:
          </p>
          <p style={{ fontSize: "0.875rem" }}>
            <strong>Object key:</strong> {uploadResult.objectKey}
          </p>
          <p style={{ fontSize: "0.875rem" }}>
            <strong>URL:</strong>{" "}
            <a
              href={uploadResult.url}
              target="_blank"
              rel="noreferrer"
              style={{ color: "#1976d2" }}
            >
              View on R2
            </a>
          </p>
          <p style={{ fontSize: "0.875rem" }}>
            <strong>URL Type:</strong> {uploadResult.urlType}
          </p>
          <p style={{ fontSize: "0.875rem" }}>
            <strong>Size:</strong> {(uploadResult.size / 1024).toFixed(1)} KB
          </p>
        </div>
      )}
    </section>
  );
};

export default AnimalImageUploadForm;
