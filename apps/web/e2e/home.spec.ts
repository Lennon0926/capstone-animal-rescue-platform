import {expect, test} from '@playwright/test';

import {LANDING_PAGE_ANIMALS, MOBILE_BREAKPOINT} from './fixtures/testData';

test.describe('Home page (/home)', () => {
  test.beforeEach(async ({page}) => {
    await page.goto('/home');
  });

  // --- Header & Navigation ---
  test(
      'header starts hidden and reveals after the first scroll',
      async ({page}) => {
        const header = page.locator('header');

        await expect(header).toHaveAttribute('data-revealed', 'false');

        await page.evaluate(() => {
          window.scrollTo({top: 220, behavior: 'auto'});
        });

        await expect(header).toHaveAttribute('data-revealed', 'true');
        await expect(header.getByAltText('CPAAA Logo')).toBeVisible();
      });

  test(
      'desktop nav links are visible after the header is revealed',
      async ({page, viewport}) => {
        test.skip(
            !!viewport && viewport.width < MOBILE_BREAKPOINT, 'Desktop only');

        await page.evaluate(() => {
          window.scrollTo({top: 220, behavior: 'auto'});
        });

        const nav = page.locator('header nav');
        await expect(nav.getByRole('link', {name: 'Home', exact: true}))
            .toBeVisible();
        await expect(nav.getByRole('link', {name: 'Adoptar', exact: true}))
            .toBeVisible();
        await expect(nav.getByRole('link', {name: 'About', exact: true}))
            .toBeVisible();
        await expect(nav.getByRole('link', {name: 'Blog', exact: true}))
            .toBeVisible();
        await expect(nav.getByRole('button', {name: 'Donar', exact: true}))
            .toBeVisible();
      });

  test('mobile hamburger opens nav', async ({page, viewport}) => {
    test.skip(!viewport || viewport.width >= MOBILE_BREAKPOINT, 'Mobile only');

    await page.evaluate(() => {
      window.scrollTo({top: 220, behavior: 'auto'});
    });

    const menuButton = page.getByRole('button', {name: 'Toggle Menu'});
    await expect(menuButton).toBeVisible();
    await menuButton.click();
    await expect(page.getByRole('link', {name: 'Adoptar', exact: true}))
        .toBeVisible();
  });

  // --- HeroSection ---
  test('hero heading is visible', async ({page}) => {
    const heading = page.getByRole('heading', {
      name: /una donación.*rescata.*ayuda.*salva/i,
    });
    await expect(heading).toBeVisible({timeout: 5000});
  });

  test('hero subtitle is visible', async ({page}) => {
    await expect(page.getByText(/Sé parte de una de las redes de ayuda/i))
        .toBeVisible({timeout: 5000});
  });

  // --- MissionVideoSection ---
  test('mission section heading is visible', async ({page}) => {
    const heading =
        page.getByRole('heading', {name: 'Nuestra misión', exact: true});
    await heading.scrollIntoViewIfNeeded();
    await expect(heading).toBeVisible();
  });

  test('mission group titles are visible', async ({page}) => {
    const loQueHacemos =
        page.getByRole('heading', {name: 'Lo que hacemos', exact: true});
    await loQueHacemos.scrollIntoViewIfNeeded();
    await expect(loQueHacemos).toBeVisible();

    const haciadonde =
        page.getByRole('heading', {name: 'Hacia dónde vamos', exact: true});
    await haciadonde.scrollIntoViewIfNeeded();
    await expect(haciadonde).toBeVisible();
  });

  test('mission headline text is visible', async ({page}) => {
    const text = page.getByText(/red de ayuda mas importante/i);
    await text.scrollIntoViewIfNeeded();
    await expect(text).toBeVisible();
  });

  // --- TimelineSection ---
  test('timeline heading is visible', async ({page}) => {
    const heading =
        page.getByRole('heading', {name: 'Nuestra historia', exact: true});
    await heading.scrollIntoViewIfNeeded();
    await expect(heading).toBeVisible();
  });

  test('all five timeline years are visible', async ({page}) => {
    for (const year of ['2015', '2017', '2019', '2021', '2023']) {
      const entry = page.getByText(year, {exact: true}).first();
      await entry.scrollIntoViewIfNeeded();
      await expect(entry).toBeVisible();
    }
  });

  test('first and last timeline entry titles are visible', async ({page}) => {
    const fundacion =
        page.getByRole('heading', {name: 'Fundación', exact: true});
    await fundacion.scrollIntoViewIfNeeded();
    await expect(fundacion).toBeVisible();

    const plataforma =
        page.getByRole('heading', {name: 'Plataforma digital', exact: true});
    await plataforma.scrollIntoViewIfNeeded();
    await expect(plataforma).toBeVisible();
  });

  // --- StoriesSection ---
  test('stories section heading is visible', async ({page}) => {
    const heading = page.getByRole('heading', {
      name: /conoce algunas de nuestras historias/i,
    });
    await heading.scrollIntoViewIfNeeded();
    await expect(heading).toBeVisible();
  });

  test('four story cards are rendered', async ({page}) => {
    const cards = page.getByTestId('story-card');
    await cards.first().scrollIntoViewIfNeeded();
    await expect(cards).toHaveCount(4);
  });

  test('story CTA links point to /about', async ({page}) => {
    const links =
        page.getByRole('link', {name: /conocer mas sobre esta historia/i});
    await links.first().scrollIntoViewIfNeeded();
    await expect(links).toHaveCount(4);
    await expect(links.first()).toHaveAttribute('href', '/about');
  });

  // --- GetInvolvedSection ---
  test('get involved heading is visible', async ({page}) => {
    const heading = page.getByRole('heading', {
      name: 'Conoce más sobre nuestro trabajo',
      exact: true,
    });
    await heading.scrollIntoViewIfNeeded();
    await expect(heading).toBeVisible();
  });

  test('get involved CTA link navigates to /adopt', async ({page}) => {
    const link = page.getByRole('link', {name: /Ver animales disponibles/i});
    await link.scrollIntoViewIfNeeded();
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute('href', '/adopt');
  });

  // --- AnimalsSection ---
  test('animals section heading is visible', async ({page}) => {
    const heading = page.getByRole('heading', {
      name: 'Conoce a Nuestros Animales',
      exact: true,
    });
    await heading.scrollIntoViewIfNeeded();
    await expect(heading).toBeVisible();
  });

  test('animal cards render from API', async ({page}) => {
    for (const name of LANDING_PAGE_ANIMALS) {
      const card = page.getByAltText(name);
      await card.scrollIntoViewIfNeeded();
      await expect(card).toBeVisible({timeout: 10000});
    }
  });

  test('Ver Todos link navigates to /adopt', async ({page}) => {
    const link = page.getByRole('link', {name: /Ver Todos/i});
    await link.scrollIntoViewIfNeeded();
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute('href', '/adopt');
  });

  // --- ContactSection ---
  test('contact section heading is visible', async ({page}) => {
    const heading =
        page.getByRole('heading', {name: 'Contáctanos', exact: true});
    await heading.scrollIntoViewIfNeeded();
    await expect(heading).toBeVisible();
  });

  test('contact email link is correct', async ({page}) => {
    const link =
        page.getByRole('link', {name: 'info@animalrescue.org', exact: true});
    await link.scrollIntoViewIfNeeded();
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute('href', 'mailto:info@animalrescue.org');
  });

  test('contact phone link is correct', async ({page}) => {
    const link = page.getByRole('link', {name: '(787) 505-8255', exact: true});
    await link.scrollIntoViewIfNeeded();
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute('href', 'tel:+17875058255');
  });

  test('donation banner Donar Ahora opens donation modal', async ({page}) => {
    const button = page.getByRole('button', {name: 'Donar Ahora', exact: true});
    await button.scrollIntoViewIfNeeded();
    await button.click();
    await expect(page.getByRole('dialog')).toBeVisible();
  });

  test('donation banner benefits text is visible', async ({page}) => {
    const el = page.getByText('100% destinado a los animales', {exact: true});
    await el.scrollIntoViewIfNeeded();
    await expect(el).toBeVisible();
  });

  // --- Footer ---
  test('footer renders with org name and contact info', async ({page}) => {
    const footer = page.locator('footer');
    await footer.scrollIntoViewIfNeeded();
    await expect(footer).toBeVisible();
    await expect(
        footer.getByText(
            'Ciudadanos Pro Albergue de Animales de Aguadilla', {exact: true}))
        .toBeVisible();
    await expect(footer.getByText('(787)-505-8255', {
      exact: true
    })).toBeVisible();
    await expect(footer.getByText('info@animalrescue.org', {
      exact: true
    })).toBeVisible();
  });

  test('footer quick links are present', async ({page}) => {
    const footer = page.locator('footer');
    await footer.scrollIntoViewIfNeeded();
    await expect(
        footer.getByRole('link', {name: 'Sobre Nosotros', exact: true}))
        .toBeVisible();
    await expect(
        footer.getByRole('link', {name: 'Animales Disponibles', exact: true}))
        .toBeVisible();
    await expect(footer.getByRole('link', {name: 'Donar', exact: true}))
        .toBeVisible();
  });
});
