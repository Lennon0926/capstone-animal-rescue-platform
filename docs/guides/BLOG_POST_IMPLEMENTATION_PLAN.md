# Blog Post Backend Integration Plan

## Goal

Keep the current Facebook-powered blog feed while adding native website posts that admins can create, edit, pin, and delete from the admin dashboard.

The public blog should show both sources:

- Facebook posts fetched from the existing `/api/facebook-posts` Next.js API route.
- Admin-created posts stored in Supabase and served by the Express backend.

Admin-created posts should support:

- Header/title.
- Body/content.
- Pinned post flag for featured placement.
- Image stored in Cloudflare R2, using the same object-key pattern as animal images.
- Full CRUD from protected admin pages.

## Current Implementation

The current blog UI is Facebook-only.

- `apps/web/components/BlogPage/blog.tsx` fetches `/api/facebook-posts?limit=100`.
- `apps/web/pages/api/facebook-posts.ts` proxies Facebook Graph API responses.
- The blog composer is UI-only and all fields are `readOnly`.
- Pinning is local React state only, so it is lost on refresh and is not admin-managed.
- The public blog cards are built around `FacebookPost` fields such as `message`, `story`, `full_picture`, `likes`, `comments`, and `permalink_url`.

The backend already has the right pattern for this feature.

- `apps/server/routes/animals.js` defines public reads and protected mutations.
- `apps/server/repositories/animalsRepository.js` handles Supabase persistence and image URL serialization.
- `apps/server/routes/uploads.js` uploads animal images to Cloudflare R2.
- `apps/server/services/r2Service.js` creates public R2 URLs from object keys.
- Admin pages already use `getAuthenticatedHeaders()` for protected requests.

Implementation should reuse as much of the animal implementation as practical. The post feature should feel like a smaller sibling of the animal feature, not a separate architecture.

## Design Direction

Use a hybrid feed rather than replacing Facebook.

Admin posts and Facebook posts should be normalized into one frontend display model:

```ts
type BlogFeedPost = {
  id: string;
  source: "local" | "facebook";
  header: string;
  body: string;
  imageUrls: string[];
  createdAt: string;
  isPinned: boolean;
  externalUrl?: string;
  metadata?: {
    likes?: number;
    comments?: number;
    facebookType?: "reel" | "shared" | "normal";
  };
};
```

This keeps the current Facebook visuals possible while giving local posts the same card/featured layout.

## Reuse Strategy

Prioritize reuse of existing animal implementation patterns before creating new abstractions.

Backend reuse:

- Copy the animal API shape: `{ success, data, pagination }`.
- Follow the same route structure from `apps/server/routes/animals.js`.
- Follow the same repository structure from `apps/server/repositories/animalsRepository.js`.
- Reuse `requireAuth`, `requireJson`, `asyncHandler`, and `ApiError`.
- Reuse pagination validation patterns where possible.
- Reuse `sanitizeImageObjectKey` for R2 object key validation.
- Reuse `getPublicObjectUrl` and `normalizeObjectKey` from `r2Service`.
- Extend R2 upload helpers instead of building a separate upload implementation.

Frontend reuse:

- Follow the admin animal page pattern for list, create, and edit pages.
- Reuse `getAuthenticatedHeaders()` for protected API calls.
- Reuse the image upload flow from `CreateAnimalForm` and `EditAnimalForm`: create row first, upload to R2 using the generated ID, then patch the row with `image_object_key`.
- Reuse admin form state patterns, success/error handling, image preview behavior, and delete confirmation modal patterns.
- Reuse table/list styling structure from `AdminAnimalsList` where it fits.

Only introduce shared helpers when doing so removes meaningful duplication. For example, a generic upload config helper may be useful, but a broad generic CRUD framework is not necessary for this scope.

## Database Plan

Create a Supabase migration for a new table. Prefer `posts` for API consistency, even though the task says `'post' table`.

```sql
CREATE TABLE IF NOT EXISTS public.posts (
    pid SERIAL PRIMARY KEY,
    header VARCHAR(160) NOT NULL,
    body TEXT NOT NULL,
    is_pinned BOOLEAN NOT NULL DEFAULT false,
    image_url TEXT,
    image_object_key TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_posts_created_at ON public.posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_is_pinned ON public.posts(is_pinned);
CREATE UNIQUE INDEX IF NOT EXISTS idx_posts_single_pinned
    ON public.posts(is_pinned)
    WHERE is_pinned = true;

ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Allow public read access on posts"
    ON public.posts FOR SELECT
    USING (true);

CREATE POLICY IF NOT EXISTS "Allow service role full access on posts"
    ON public.posts FOR ALL
    USING (auth.role() = 'service_role');
```

Add an `updated_at` trigger if the project already has one later, or define a small `set_updated_at()` function in this migration.

## Backend Plan

### Repository

Add `apps/server/repositories/postsRepository.js`.

Start from the animal repository pattern and simplify it for posts. Do not invent a new data-access style.

Required functions:

- `getPosts({ limit, offset })`
- `getPostById(pid)`
- `createPost(payload)`
- `updatePostById(pid, updates)`
- `deletePost(pid)`
- `serializePostRecord(post)`
- `normalizePostImageFields(postData)`
- `clearPostsCache()`

`serializePostRecord` should mirror animal image handling:

- Store `image_object_key` as the persistent R2 reference.
- Derive `image_url` from `getPublicObjectUrl(image_object_key)`.
- Treat `image_url` as read-only for R2-backed local post images.

Pin behavior should live in the repository, not the UI:

- If a post is created or updated with `is_pinned: true`, unset `is_pinned` on other posts.
- Prefer a Supabase RPC transaction if strict atomic behavior is needed with the unique partial index.

### Routes

Add `apps/server/routes/posts.js`.

Use `apps/server/routes/animals.js` as the route template.

Endpoints:

- `GET /api/posts` public list.
- `GET /api/posts/:pid` public detail.
- `POST /api/posts` protected create.
- `PATCH /api/posts/:pid` protected update.
- `DELETE /api/posts/:pid` protected delete.

Response shape should match the animal API:

```json
{
  "success": true,
  "data": {},
  "pagination": {
    "total": 0,
    "limit": 50,
    "offset": 0,
    "hasMore": false
  }
}
```

Mount the router in `apps/server/server.js`:

```js
const postsRouter = require("./routes/posts");
app.use("/api/posts", postsRouter);
```

### Validation

Extend `apps/server/middleware/validation.js` with:

- `validatePostsQuery`
- `validatePostId`
- `validateCreatePost`
- `validateUpdatePost`

Rules:

- `header`: required on create, non-empty on update, max 160 chars.
- `body`: required on create, non-empty on update, allow longer text than animal description. Recommended max: 5000 chars.
- `is_pinned`: boolean only.
- `image_url`: read-only.
- `image_object_key`: validated with the same object-key sanitizer used for animals.

Reuse existing validation helpers where possible. Add post-specific long text sanitization only where the existing animal limits are too short for blog content.

### R2 Uploads

Generalize R2 upload support for post images.

This should be an extension of the existing animal upload implementation, not a separate upload stack.

Add to `apps/server/services/r2Service.js`:

- `uploadPostImage(postId, buffer, originalname, mimetype)`

Store objects under:

```text
posts/{postId}/{timestamp}-{safeFilename}
```

Add to `apps/server/routes/uploads.js`:

```text
POST /api/uploads/posts/:postId/image
```

This route should require authentication. The animal upload endpoint is now server-side protected, so post uploads should match that hardened behavior from the start.

### Separate Animal Upload Hardening

Tighten the existing animal image upload endpoint as a separate security task from the post feature. This task can be implemented and verified independently from post CRUD.

Scope:

- Add server-side `requireAuth` to `POST /api/uploads/animals/:animalId/image`.
- Keep `GET /api/uploads/config` public so the frontend can check storage availability before an admin action.
- Place auth before multipart parsing so unauthenticated requests are rejected before file handling.
- Update affected upload tests to send auth when they are testing validation behavior.
- Add a regression test that unauthenticated animal image upload returns `401`.

This is intentionally separate from the post CRUD work so the current animal upload behavior can be verified independently.

## Frontend Plan

### Types and Services

Add `apps/web/types/post.ts`.

```ts
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
```

Add `apps/web/services/postService.ts`.

Required functions:

- `fetchPosts()`
- `fetchPost(pid)`
- `createPost(payload)`
- `updatePost(pid, payload)`
- `deletePost(pid)`
- `uploadPostImage(pid, file)`
- `uploadAndUpdatePostImage(pid, file)`

Reuse:

- `getAuthenticatedHeaders()` for protected calls.
- Existing upload config/health handling where possible.
- Error normalization patterns from `animalImageUploadService.ts`.

### Blog Feed

Refactor `apps/web/components/BlogPage/blog.tsx` so it fetches both sources:

- `GET /api/facebook-posts?limit=100`
- `GET {NEXT_PUBLIC_API_BASE_URL}/api/posts?limit=100`

Use `Promise.allSettled()` so one source can fail without hiding the other source.

Recommended behavior:

- If Facebook fails but local posts load, show local posts and a small non-blocking warning.
- If local posts fail but Facebook loads, keep current Facebook experience.
- If both fail, show the existing retry/error state.

Normalize both source types into `BlogFeedPost`.

Featured post priority:

1. Local post where `is_pinned = true`.
2. If no local pinned post exists, latest local post.
3. If no local post exists, latest Facebook post.

Feed order:

1. Featured post removed from the normal feed.
2. Remaining local and Facebook posts sorted by `createdAt desc`.
3. Source-specific badges can identify "Web" and "Facebook".

Keep Facebook-specific behavior only for Facebook posts:

- "Ver en Facebook" link.
- Likes/comments counts.
- Reel/shared badges.

Local posts should show:

- Header.
- Body.
- R2 image.
- Optional "Publicado en la web" source label.

### Admin Pages

Create an admin post management area, following the existing animal admin pattern.

Pages:

- `apps/web/pages/admin/posts.tsx`
- `apps/web/pages/admin/createPost.tsx`
- `apps/web/pages/admin/editPost.tsx`

Components:

- `apps/web/components/Admin/AdminPostsList/adminPostsList.tsx`
- `apps/web/components/Admin/CreatePost/createPostForm.tsx`
- `apps/web/components/Admin/EditPost/editPostForm.tsx`

Use the animal admin pages as the starting point for structure and behavior. The post forms should remove animal-specific fields rather than being written from scratch.

Admin list requirements:

- Search by header/body.
- Sort by created date and pinned flag.
- Show thumbnail, header, pinned status, created date.
- Edit button.
- Delete button with confirmation modal.

Create form requirements:

- Header input.
- Body textarea.
- Pinned checkbox/toggle.
- Required image upload.
- Image preview.
- Submit flow:
  1. Validate fields.
  2. Create post without image object key.
  3. Upload image to `POST /api/uploads/posts/:postId/image`.
  4. Patch post with returned `image_object_key`.
  5. Redirect to `/admin/posts`.

This mirrors the existing animal creation image flow in `CreateAnimalForm`.

Edit form requirements:

- Load existing post.
- Edit header/body/pinned flag.
- Show current image.
- Optional replacement image.
- If replacement image selected, upload first and include new `image_object_key` in `PATCH /api/posts/:pid`.
- Redirect to `/admin/posts`.

This mirrors the existing animal edit image replacement flow in `EditAnimalForm`.

Navigation:

- Add `Posts` link to `apps/web/components/Admin/AdminHeader/adminHeader.tsx`.

## UX Notes

The public blog should not expose creation controls unless the user is in an authenticated admin context. The current public composer can be removed from `/blog` or converted into an admin-only shortcut.

Recommended public labels:

- Local post badge: `Web`
- Facebook post badge: `Facebook`
- Featured label: `Publicación destacada`

Do not force all posts to look like Facebook. Local posts should read like first-party updates, while Facebook posts retain external social metadata.

## Testing Plan

### Server Tests

Add tests for:

- `GET /api/posts` returns public list.
- `GET /api/posts/:pid` returns one post.
- `POST /api/posts` requires auth.
- `POST /api/posts` validates required fields.
- `PATCH /api/posts/:pid` requires auth.
- `PATCH /api/posts/:pid` updates header/body/pinned/image key.
- `DELETE /api/posts/:pid` requires auth and deletes.
- Pinned uniqueness unpins prior pinned post.
- `serializePostRecord` derives public R2 URL from `image_object_key`.
- `POST /api/uploads/posts/:postId/image` validates ID, file presence, MIME type, size, R2 config, and auth.

### Web Tests

Add unit tests for:

- `postService` request URLs, payloads, auth headers, and error handling.
- Blog normalization from Facebook posts and local posts.
- Featured priority rules.
- Create post flow: create, upload, patch image key.
- Edit post flow with and without image replacement.
- Delete confirmation flow.

### E2E Tests

Update `apps/web/e2e/blog.spec.ts`:

- Mock Facebook and local post responses.
- Verify both source types render.
- Verify local pinned post is featured.
- Verify page still renders when one source fails.

Add admin post E2E coverage:

- Create post.
- Edit post.
- Delete post.

## Implementation Order

1. Create Supabase migration for `posts`.
2. Clone/adapt the animal repository, validation, and route patterns for `/api/posts`.
3. Extend the existing R2 upload route/service for post images.
4. Add frontend post types and service module using the animal image service as the model.
5. Refactor public blog to merge Facebook and local posts.
6. Add admin post list/create/edit pages using the animal admin pages as templates.
7. Add admin navigation link.
8. Add server, web unit, and E2E tests.
9. Run server tests, web tests, and targeted Playwright tests for `/blog` and admin post flows.

## Open Decisions

- Table name: use `posts` for consistency, or exactly `post` if required.
- Pin rule: allow only one local pinned post, or allow multiple pinned local posts and feature the newest one.
- Public composer: remove it from `/blog`, or show it only to authenticated admins.
- Image requirement: required only on create, or also required for every edit.
- Facebook fallback: if Facebook credentials are missing, should the blog silently show only local posts or surface a warning?
