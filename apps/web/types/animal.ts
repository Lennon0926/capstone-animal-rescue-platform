export type MedicalRecord = {
  record_id?: number;
  aid?: number;
  record_type?: string;
  date_given?: string | null;
  vet_name?: string | null;
  notes?: string | null;
  created_at?: string;
};

export type Animal = {
  aid: number;
  name: string;
  description: string;
  species: string;
  size: string;
  gender: string;
  status: string;
  image_url: string | null;
  image_object_key?: string | null;
  tags: string[];
  created_at: string;
  record_id: number | null;
  medical_records?: MedicalRecord[];
};
