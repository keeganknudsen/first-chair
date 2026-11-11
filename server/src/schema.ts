import { bigint, pgTable, text, timestamp } from 'drizzle-orm/pg-core'

export const posts = pgTable('posts', {
    id: bigint('id', { mode: 'number'}).primaryKey().generatedAlwaysAsIdentity(),
    title: text('title').notNull(),
    slug: text('slug').notNull().unique(),
    bodyMd: text('body_md').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export type PostRow = typeof posts.$inferSelect

export const users = pgTable('users', {
    id: bigint('id', { mode: 'number'}).primaryKey().generatedAlwaysAsIdentity(),
    email: text('email').notNull(),
    displayName: text('display_name').notNull(),
    passwordHash: text('password_hash').notNull(),
    role: text('role', { enum: ['author', 'admin'] }).notNull().default('author'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export type UserRow = typeof users.$inferSelect