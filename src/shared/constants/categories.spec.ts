import { CATEGORY_SEEDS } from './categories';

describe('CATEGORY_SEEDS', () => {
  it('includes the canonical product categories', () => {
    expect(CATEGORY_SEEDS).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'Difusores',
          slug: 'difusores',
        }),
        expect.objectContaining({
          name: 'Esencias puras',
          slug: 'esencias-puras',
        }),
        expect.objectContaining({
          name: 'Hornillos',
          slug: 'hornillos',
        }),
      ]),
    );
  });

  it('keeps category slugs unique', () => {
    const slugs = CATEGORY_SEEDS.map((category) => category.slug);

    expect(new Set(slugs).size).toBe(slugs.length);
  });
});
