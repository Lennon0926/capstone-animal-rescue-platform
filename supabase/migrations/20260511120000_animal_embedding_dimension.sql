-- Lock the animal_embedding vector dimension to 384 so future inserts are
-- validated by Postgres. 384 is the output size of
-- Xenova/paraphrase-multilingual-MiniLM-L12-v2, the model used by the
-- AI Pet Match service. Every existing row is NULL, so this is safe.

ALTER TABLE animals
  ALTER COLUMN animal_embedding TYPE vector(384)
  USING animal_embedding::vector(384);
