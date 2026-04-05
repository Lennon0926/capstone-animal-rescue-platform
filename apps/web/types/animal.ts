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
};
