import { useState, type SubmitEvent } from 'react'
import Markdown from 'react-markdown'
import { z } from 'zod'
import { createPostSchema, type CreatePostInput } from '@first-chair/shared'
import { ApiError, type FieldErrors } from '../api'

type Props = {
    initial?: CreatePostInput
    submitLabel: string
    onSubmit: (inpit: CreatePostInput) => Promise<void>
}

const empty: CreatePostInput = { title: '', slug: '', bodyMd: '' }

export function PostForm({ initial = empty, submitLabel, onSubmit }: Props) {
    const [values, setValues] = useState<CreatePostInput>(initial)
    const [errors, setErrors] = useState<FieldErrors>({})
    const [formError, setFormError] = useState<string | null>(null)
    const [submitting, setSubmitting] = useState(false)

    function update(field: keyof CreatePostInput) {
        return (e: { target: { value: string } }) =>
            setValues((prev) => ({ ...prev, [field]: e.target.value }))
    }

    async function handleSubmit(e: SubmitEvent<HTMLFormElement>) {
        e.preventDefault()
        setFormError(null)

        const parsed = createPostSchema.safeParse(values)
        if (!parsed.success) {
            setErrors(z.flattenError(parsed.error).fieldErrors)
            return
        }

        setErrors({})
        setSubmitting(true)
        try {
            await onSubmit(parsed.data)
        } catch (err) {
            if (err instanceof ApiError && err.status === 409) {
                setErrors({ slug: [err.message] })
            } else if (err instanceof ApiError && err.status === 403) {
                setFormError('Saving is disabled on this server.')
            } else if (err instanceof ApiError) {
                setErrors(err.fields)
                setFormError(err.message)
            } else {
                setFormError('Something went wrong. Please try again')
            }
        } finally {
            setSubmitting(false)
        }      
    }

    return (
    <form onSubmit={handleSubmit} className="post-form" noValidate>
      <label>
        Title
        <input value={values.title} onChange={update('title')} />
      </label>
      {errors.title && <p className="field-error">{errors.title[0]}</p>}

      <label>
        Slug
        <input value={values.slug} onChange={update('slug')} placeholder="powder-day" />
      </label>
      {errors.slug && <p className="field-error">{errors.slug[0]}</p>}

      <label>
        Body (Markdown)
        <textarea value={values.bodyMd} onChange={update('bodyMd')} rows={16} />
      </label>
      {errors.bodyMd && <p className="field-error">{errors.bodyMd[0]}</p>}

      {formError && <p className="field-error">{formError}</p>}

      <button type="submit" disabled={submitting}>
        {submitting ? 'Saving...' : submitLabel}
      </button>

      <section className="preview">
        <h3>Preview</h3>
        <div className="post-body">
          <Markdown>{values.bodyMd || '*Nothing to preview yet.*'}</Markdown>
        </div>
      </section>
    </form>
  )
}

