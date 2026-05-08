export type Post = {
  pid: number;
  header: string;
  body: string;
  is_pinned: boolean;
  image_url: string | null;
  image_object_key?: string | null;
  created_at: string;
  updated_at?: string;
};
