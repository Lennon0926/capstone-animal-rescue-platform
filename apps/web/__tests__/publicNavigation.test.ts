describe("publicNavigation", () => {
  const originalFlag = process.env.NEXT_PUBLIC_SHOW_ADOPT_PAGE;

  afterEach(() => {
    if (originalFlag === undefined) {
      delete process.env.NEXT_PUBLIC_SHOW_ADOPT_PAGE;
    } else {
      process.env.NEXT_PUBLIC_SHOW_ADOPT_PAGE = originalFlag;
    }
    jest.resetModules();
  });

  it("shows adopt links by default", async () => {
    delete process.env.NEXT_PUBLIC_SHOW_ADOPT_PAGE;
    jest.resetModules();

    const nav = await import("@/lib/publicNavigation");
    const links = nav.getPublicNavigationLinks();
    const footerLinks = nav.getFooterQuickLinks();

    expect(nav.isAdoptCatalogVisible()).toBe(true);
    expect(links.some((link) => link.href === "/adopt")).toBe(true);
    expect(footerLinks.some((link) => link.href === "/adopt")).toBe(true);
  });

  it("hides adopt catalog links when feature flag is false", async () => {
    process.env.NEXT_PUBLIC_SHOW_ADOPT_PAGE = "false";
    jest.resetModules();

    const nav = await import("@/lib/publicNavigation");
    const links = nav.getPublicNavigationLinks();
    const footerLinks = nav.getFooterQuickLinks();

    expect(nav.isAdoptCatalogVisible()).toBe(false);
    expect(links.some((link) => link.href === "/adopt")).toBe(false);
    expect(footerLinks.some((link) => link.href === "/adopt")).toBe(false);
    expect(footerLinks.some((link) => link.href === "/about")).toBe(true);
  });
});
