import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    // `title` alimenta el H1 y nunca se recorta por motivos de SERP.
    title: z.string(),
    // Versión corta solo para la etiqueta <title>, cuando el H1 pasa de 47
    // caracteres y se truncaría en resultados de búsqueda.
    metaTitle: z.string().optional(),
    description: z.string(),
    date: z.coerce.date(),
    readingTime: z.string(),
  }),
});

export const collections = { blog };
