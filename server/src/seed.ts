import { pool } from './db.js'

type SeedPost = {
    title: string
    slug: string
    createdAt: string
    bodyMd: string
}

const posts: SeedPost[] = [
    {
        title: 'Opening day',
        slug: 'opening-day',
        createdAt: '2025-11-22',
        bodyMd: `
Only two runs were open, but after eight months off I didn't care.

## Conditions

Machine-made snow, firm in the morning and **soft by noon**. The lift line was about 20 minutes at first chair.

## Highlights

- First turns of the season felt rusty for about three runs
- Lunch on the deck in the sun
- Lap count: 14
`,
    },

    {
        title: 'Powder day',
        slug: 'powder-day',
        createdAt: '2025-1-4',
        bodyMd: `
Granite cheif was open and firing.

## Conditions

4-5 feet overnight, super light powder and lift lines were minimal. Bring a snorkel!

## Highlights

- Each turn felt like floating
- Dropped a 30ft cliff
- Lap count: 20
`,
    },

    {
        title: 'Park day',
        slug: 'park-day',
        createdAt: '2025-3-10',
        bodyMd: `
Perfect spring day to hit the park.

## Conditions

Spring slush, soft all day. Park laps all day.

## Highlights

- Rails were a bit sticky but got better through the day
- Jump landings were soft
- Lap count: 28
`,
    },
]

async function seed() {
    for (const post of posts) {
        await pool.query(
            `INSERT INTO posts (title, slug, body_md, created_at)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (slug) DO UPDATE
             SET title = EXCLUDED.title,
                body_md = EXCLUDED.body_md,
                created_at = EXCLUDED.created_at,
                updated_at = now()`,
            [post.title, post.slug, post.bodyMd.trim(), post.createdAt],
        )
        console.log(`Seeded ${post.slug}`)
    }
}

seed()
    .catch((err) => {
        console.error('Seed failed:', err)
        process.exitCode = 1
    })
    .finally(() => pool.end())