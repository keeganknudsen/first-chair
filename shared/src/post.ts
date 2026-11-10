import { z } from 'zod'
import { SLUG_MAX_LENGTH } from './slug.js'

export const slugSchema = z
    .string()
    .trim()
    .min(1, 'Slug is required')
    .max(SLUG_MAX_LENGTH)
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'Use lowercase letters, numbers, and single hyphens')

export const createPostSchema = z.object({
    title: z.string().trim().min(1, 'Title is required').max(200),
    slug: slugSchema.optional(),
    bodyMd: z.string().trim().min(1, 'Body is required').max(50_000),
})

export const updatePostSchema = createPostSchema
    .partial()
    .refine((data) => Object.keys(data).length > 0, {
        message: 'Provide at least one of the title, slug, or bodyMd',
    })

export type CreatePostInput = z.infer<typeof createPostSchema>
export type UpdatePostInput = z.infer<typeof updatePostSchema>

export const postSummarySchema = z.object({
    id: z.number(),
    title: z.string(),
    slug: z.string(),
    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),
})

export const postSchema = postSummarySchema.extend({
    bodyMd: z.string(),
})

export const postListResponseSchema = z.object({
    posts: z.array(postSummarySchema),
})

export const postResponseSchema = z.object({
    post: postSchema,
})

export type PostSummary = z.infer<typeof postSummarySchema>
export type Post = z.infer<typeof postSchema>