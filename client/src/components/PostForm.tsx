import { useState, type ChangeEvent, type SubmitEvent } from 'react'
import Markdown from 'react-markdown'
import { z } from 'zod'
import { createPostSchema, type CreatePostInput, slugify } from '@first-chair/shared'
import { ApiError, type FieldErrors } from '../api'

type FormValues = {
  title: string
  slug: string
  bodyMd: string
}

type Props = {
  initial?: FormValues
  submitLabel: string
  onSubmit: (inpit: CreatePostInput) => Promise<void>
}

const empty: FormValues = { title: '', slug: '', bodyMd: '' }

export function PostForm({ initial = empty, submitLabel, onSubmit }: Props) {
    const [values, setValues] = useState<FormValues>(initial)
    const [slugTouched, setSlugTouched] = useState(initial.slug !== '')
    const [errors, setErrors] = useState<FieldErrors>({})
    const [formError, setFormError] = useState<string | null>(null)
    const [submitting, setSubmitting] = useState(false)

    function handleTitleChange(e: ChangeEvent<HTMLInputElement>) {
      const title = e.target.value
      setValues((prev) => ({
        ...prev,
        title,
        slug: slugTouched ? prev.slug : slugify(title),
      }))
    }

    function handleSlugChange(e: ChangeEvent<HTMLInputElement>) {
      setSlugTouched(true)
      setValues((prev) => ({ ...prev, slug: e.target.value }))
    }

    function handleBodyChange(e: ChangeEvent<HTMLTextAreaElement>) {
      setValues((prev) => ({ ...prev, bodyMd: e.target.value }))
    }

    async function handleSubmit(e: SubmitEvent<HTMLFormElement>) {
        e.preventDefault()
        setFormError(null)

        const input = {
          title: values.title,
          bodyMd: values.title,
          slug: slugTouched && values.slug.trim() ? values.slug : undefined,
        }

        const parsed = createPostSchema.safeParse(input)
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
        <input value={values.title} onChange={handleTitleChange} />
      </label>
      {errors.title && <p className="field-error">{errors.title[0]}</p>}

      <label>
        Slug
        <input value={values.slug} onChange={handleSlugChange} placeholder="generated from title" />
      </label>
      {errors.slug && <p className="field-error">{errors.slug[0]}</p>}

      <label>
        Body (Markdown)
        <textarea value={values.bodyMd} onChange={handleBodyChange} rows={16} />
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

