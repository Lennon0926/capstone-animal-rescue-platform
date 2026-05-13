/**
 * Additional coverage for hooks/useAdoptionFormUrl.ts → buildAdoptionFormUrl
 * The existing publicNavigation.test.ts already covers some env paths.
 */

const originalEnv = process.env;

afterEach(() => {
  process.env = { ...originalEnv };
  jest.resetModules();
});

async function load() {
  return (await import("@/hooks/useAdoptionFormUrl")).buildAdoptionFormUrl;
}

describe("buildAdoptionFormUrl", () => {
  it("returns null when NEXT_PUBLIC_GOOGLE_FORM_URL is not set", async () => {
    delete process.env.NEXT_PUBLIC_GOOGLE_FORM_URL;
    const buildAdoptionFormUrl = await load();
    expect(buildAdoptionFormUrl(1, "Buddy")).toBeNull();
  });

  it("returns bare viewform URL when no entry IDs configured", async () => {
    process.env.NEXT_PUBLIC_GOOGLE_FORM_URL = "https://forms.google.com/viewform/abc";
    delete process.env.NEXT_PUBLIC_GOOGLE_FORM_ENTRY_ANIMAL_ID;
    delete process.env.NEXT_PUBLIC_GOOGLE_FORM_ENTRY_ANIMAL_NAME;
    const buildAdoptionFormUrl = await load();
    const result = buildAdoptionFormUrl(1, "Buddy");
    expect(result).toBe("https://forms.google.com/viewform/abc");
  });

  it("includes animalId param when entry ID configured", async () => {
    process.env.NEXT_PUBLIC_GOOGLE_FORM_URL = "https://forms.google.com/viewform/abc";
    process.env.NEXT_PUBLIC_GOOGLE_FORM_ENTRY_ANIMAL_ID = "entry.111";
    delete process.env.NEXT_PUBLIC_GOOGLE_FORM_ENTRY_ANIMAL_NAME;
    const buildAdoptionFormUrl = await load();
    const result = buildAdoptionFormUrl(42, "Buddy");
    expect(result).toContain("entry.111=42");
  });

  it("includes both params when both entry IDs configured", async () => {
    process.env.NEXT_PUBLIC_GOOGLE_FORM_URL = "https://forms.google.com/viewform/abc";
    process.env.NEXT_PUBLIC_GOOGLE_FORM_ENTRY_ANIMAL_ID = "entry.111";
    process.env.NEXT_PUBLIC_GOOGLE_FORM_ENTRY_ANIMAL_NAME = "entry.222";
    const buildAdoptionFormUrl = await load();
    const result = buildAdoptionFormUrl(5, "Luna");
    expect(result).toContain("entry.111=5");
    expect(result).toContain("entry.222=Luna");
  });

  it("strips ?usp= query param from the base URL", async () => {
    process.env.NEXT_PUBLIC_GOOGLE_FORM_URL = "https://forms.google.com/viewform/abc?usp=sf_link";
    delete process.env.NEXT_PUBLIC_GOOGLE_FORM_ENTRY_ANIMAL_ID;
    delete process.env.NEXT_PUBLIC_GOOGLE_FORM_ENTRY_ANIMAL_NAME;
    const buildAdoptionFormUrl = await load();
    const result = buildAdoptionFormUrl(1, "Buddy");
    expect(result).not.toContain("usp=");
    expect(result).toBe("https://forms.google.com/viewform/abc");
  });

  it("URL-encodes animal name with spaces", async () => {
    process.env.NEXT_PUBLIC_GOOGLE_FORM_URL = "https://forms.google.com/viewform/abc";
    process.env.NEXT_PUBLIC_GOOGLE_FORM_ENTRY_ANIMAL_NAME = "entry.222";
    delete process.env.NEXT_PUBLIC_GOOGLE_FORM_ENTRY_ANIMAL_ID;
    const buildAdoptionFormUrl = await load();
    const result = buildAdoptionFormUrl(1, "My Dog");
    // URLSearchParams encodes spaces as + in the query string
    expect(result).toContain("My+Dog");
  });
});
