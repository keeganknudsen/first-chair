import { z } from 'zod'

export const slugSchema = z
    .string()
    .trim()
    .min(1, 'Slug is required')
    .max(100)
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'Use lowercase letters, numbers, and single hyphens')

export const createPostSchema = z.object({
    title: z.string().trim().min(1, 'Title is required').max(200),
    slug: slugSchema,
    bodyMd: z.string().trim().min(1, 'Body is required').max(50_000),
})

export const updatePostSchema = createPostSchema
    .partial()
    .refine((data) => Object.keys(data).length > 0, {
        message: 'Provide at least one of the title, slug, or bodyMd',
    })

export type CreatePostInput = z.infer<typeof createPostSchema>
export type UpdatePostInput = z.infer<typeof updatePostSchema>