import { FormEvent, useState } from "react";

import {
  AnimalImageUploadResult,
  uploadAnimalImage,
} from "@/services/animalImageUploadService";

const AnimalImageUploadForm = () => {
  const [animalId, setAnimalId] = useState("demo-animal");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [uploadResult, setUploadResult] =
    useState<AnimalImageUploadResult | null>(null);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");
    setUploadResult(null);

    if (!selectedFile) {
      setErrorMessage("Select an image file before uploading.");
      return;
    }

    setIsUploading(true);

    try {
      const result = await uploadAnimalImage(animalId, selectedFile);
      setUploadResult(result);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unexpected upload error."
      );
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <section style={{ marginTop: "2rem" }}>
      <h2>Upload Animal Photo</h2>
      <p>Allowed formats: JPEG, PNG, WEBP. Max upload size: 5 MB.</p>

      <form
        onSubmit={onSubmit}
        style={{ display: "grid", gap: "0.75rem", maxWidth: "28rem" }}
      >
        <label>
          Animal ID
          <input
            required
            value={animalId}
            onChange={(event) => setAnimalId(event.target.value)}
            style={{ display: "block", width: "100%" }}
          />
        </label>

        <label>
          Image
          <input
            required
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(event) => setSelectedFile(event.target.files?.[0] || null)}
            style={{ display: "block", width: "100%" }}
          />
        </label>

        <button type="submit" disabled={isUploading}>
          {isUploading ? "Uploading..." : "Upload image"}
        </button>
      </form>

      {errorMessage ? (
        <p style={{ color: "#b00020", marginTop: "0.75rem" }}>{errorMessage}</p>
      ) : null}

      {uploadResult ? (
        <div style={{ marginTop: "1rem" }}>
          <p>
            <strong>Object key:</strong> {uploadResult.objectKey}
          </p>
          <p>
            <strong>URL:</strong>{" "}
            <a href={uploadResult.url} target="_blank" rel="noreferrer">
              {uploadResult.url}
            </a>
          </p>
          <p>
            <strong>URL Type:</strong> {uploadResult.urlType}
          </p>
        </div>
      ) : null}
    </section>
  );
};

export default AnimalImageUploadForm;
