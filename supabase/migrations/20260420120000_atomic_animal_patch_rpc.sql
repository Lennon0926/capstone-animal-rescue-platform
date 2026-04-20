-- Migration: atomic_animal_patch_rpc
--
-- Problem: PATCH /api/animals/:aid updated the animal row first and then
-- separately synced medical records. A failure during the medical-record sync
-- could leave the animal partially updated.
--
-- Fix: one transactional RPC that applies partial animal updates and replaces
-- the submitted medical-record set atomically.

CREATE OR REPLACE FUNCTION patch_animal_with_medical_records(
  p_aid integer,
  p_animal_updates jsonb DEFAULT '{}'::jsonb,
  p_medical_records jsonb DEFAULT '[]'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_existing_animal public.animals%ROWTYPE;
  v_updated_animal public.animals%ROWTYPE;
  v_medical_record jsonb;
  v_record_id integer;
BEGIN
  IF jsonb_typeof(COALESCE(p_animal_updates, '{}'::jsonb)) <> 'object' THEN
    RAISE EXCEPTION 'animal updates payload must be a JSON object';
  END IF;

  IF jsonb_typeof(COALESCE(p_medical_records, '[]'::jsonb)) <> 'array' THEN
    RAISE EXCEPTION 'medical records payload must be a JSON array';
  END IF;

  SELECT *
  INTO v_existing_animal
  FROM public.animals
  WHERE aid = p_aid
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Animal not found';
  END IF;

  IF COALESCE(p_animal_updates, '{}'::jsonb) = '{}'::jsonb THEN
    v_updated_animal := v_existing_animal;
  ELSE
    UPDATE public.animals
    SET
      name = CASE
        WHEN p_animal_updates ? 'name' THEN p_animal_updates->>'name'
        ELSE name
      END,
      description = CASE
        WHEN p_animal_updates ? 'description' THEN p_animal_updates->>'description'
        ELSE description
      END,
      species = CASE
        WHEN p_animal_updates ? 'species' THEN p_animal_updates->>'species'
        ELSE species
      END,
      size = CASE
        WHEN p_animal_updates ? 'size' THEN p_animal_updates->>'size'
        ELSE size
      END,
      gender = CASE
        WHEN p_animal_updates ? 'gender' THEN p_animal_updates->>'gender'
        ELSE gender
      END,
      status = CASE
        WHEN p_animal_updates ? 'status' THEN p_animal_updates->>'status'
        ELSE status
      END,
      image_object_key = CASE
        WHEN p_animal_updates ? 'image_object_key'
          THEN NULLIF(p_animal_updates->>'image_object_key', '')
        ELSE image_object_key
      END,
      image_url = CASE
        WHEN p_animal_updates ? 'image_url' THEN NULLIF(p_animal_updates->>'image_url', '')
        ELSE image_url
      END,
      record_id = CASE
        WHEN p_animal_updates ? 'record_id'
          THEN CASE
            WHEN jsonb_typeof(p_animal_updates->'record_id') = 'null' THEN NULL
            ELSE (p_animal_updates->>'record_id')::integer
          END
        ELSE record_id
      END,
      tags = CASE
        WHEN p_animal_updates ? 'tags'
          THEN ARRAY(SELECT jsonb_array_elements_text(p_animal_updates->'tags'))
        ELSE tags
      END
    WHERE aid = p_aid
    RETURNING *
    INTO v_updated_animal;
  END IF;

  FOR v_medical_record IN
    SELECT value
    FROM jsonb_array_elements(COALESCE(p_medical_records, '[]'::jsonb))
  LOOP
    IF v_medical_record ? 'record_id' THEN
      IF jsonb_typeof(v_medical_record->'record_id') = 'null' THEN
        RAISE EXCEPTION 'Invalid medical record record_id.';
      END IF;

      v_record_id := (v_medical_record->>'record_id')::integer;

      IF NOT EXISTS (
        SELECT 1
        FROM public.medical_records
        WHERE record_id = v_record_id
          AND aid = p_aid
      ) THEN
        RAISE EXCEPTION 'Medical record % does not belong to animal %.',
          v_record_id,
          p_aid;
      END IF;
    END IF;
  END LOOP;

  DELETE FROM public.medical_records
  WHERE aid = p_aid
    AND record_id NOT IN (
      SELECT (value->>'record_id')::integer
      FROM jsonb_array_elements(COALESCE(p_medical_records, '[]'::jsonb))
      WHERE value ? 'record_id'
    );

  FOR v_medical_record IN
    SELECT value
    FROM jsonb_array_elements(COALESCE(p_medical_records, '[]'::jsonb))
  LOOP
    IF v_medical_record ? 'record_id' THEN
      UPDATE public.medical_records
      SET
        record_type = CASE
          WHEN v_medical_record ? 'record_type'
            THEN NULLIF(v_medical_record->>'record_type', '')
          ELSE record_type
        END,
        date_given = CASE
          WHEN v_medical_record ? 'date_given'
            THEN CASE
              WHEN jsonb_typeof(v_medical_record->'date_given') = 'null' THEN NULL
              ELSE (v_medical_record->>'date_given')::timestamptz
            END
          ELSE date_given
        END,
        vet_name = CASE
          WHEN v_medical_record ? 'vet_name'
            THEN CASE
              WHEN jsonb_typeof(v_medical_record->'vet_name') = 'null' THEN NULL
              ELSE NULLIF(v_medical_record->>'vet_name', '')
            END
          ELSE vet_name
        END,
        notes = CASE
          WHEN v_medical_record ? 'notes'
            THEN CASE
              WHEN jsonb_typeof(v_medical_record->'notes') = 'null' THEN NULL
              ELSE NULLIF(v_medical_record->>'notes', '')
            END
          ELSE notes
        END
      WHERE record_id = (v_medical_record->>'record_id')::integer
        AND aid = p_aid;
    ELSE
      INSERT INTO public.medical_records (
        aid,
        record_type,
        date_given,
        vet_name,
        notes
      )
      VALUES (
        p_aid,
        CASE
          WHEN v_medical_record ? 'record_type'
            THEN NULLIF(v_medical_record->>'record_type', '')
          ELSE NULL
        END,
        CASE
          WHEN v_medical_record ? 'date_given'
            THEN CASE
              WHEN jsonb_typeof(v_medical_record->'date_given') = 'null' THEN NULL
              ELSE (v_medical_record->>'date_given')::timestamptz
            END
          ELSE NULL
        END,
        CASE
          WHEN v_medical_record ? 'vet_name'
            THEN CASE
              WHEN jsonb_typeof(v_medical_record->'vet_name') = 'null' THEN NULL
              ELSE NULLIF(v_medical_record->>'vet_name', '')
            END
          ELSE NULL
        END,
        CASE
          WHEN v_medical_record ? 'notes'
            THEN CASE
              WHEN jsonb_typeof(v_medical_record->'notes') = 'null' THEN NULL
              ELSE NULLIF(v_medical_record->>'notes', '')
            END
          ELSE NULL
        END
      );
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'animal',
    to_jsonb(v_updated_animal),
    'medical_records',
    COALESCE(
      (
        SELECT jsonb_agg(to_jsonb(mr) ORDER BY mr.record_id)
        FROM public.medical_records mr
        WHERE mr.aid = p_aid
      ),
      '[]'::jsonb
    )
  );
END;
$$;

GRANT EXECUTE ON FUNCTION patch_animal_with_medical_records(integer, jsonb, jsonb)
  TO anon, authenticated, service_role;
