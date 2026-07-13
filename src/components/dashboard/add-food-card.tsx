import { useEffect, useMemo, useRef, useState } from 'react'
import {
  AlertCircle,
  Check,
  ImagePlus,
  LoaderCircle,
  Plus,
  Sparkles,
  X,
} from 'lucide-react'
import { useAction, useMutation } from 'convex/react'
import { useAuth } from '@clerk/tanstack-react-start'
import { useNavigate } from '@tanstack/react-router'
import type { Id } from '../../../convex/_generated/dataModel'

import { api } from '../../../convex/_generated/api'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { DailyMeals } from '@/components/dashboard/daily-meals'
import { cn } from '@/lib/utils'

const MAX_PHOTO_BYTES = 8 * 1024 * 1024

type Photo = {
  file: File
  url: string
  name: string
}

export function AddFoodCard() {
  const { isSignedIn } = useAuth()
  const navigate = useNavigate()
  const dateKey = useMemo(getLocalDateKey, [])
  const analyzeMeal = useAction(api.ai.analyzeMeal)
  const generateUploadUrl = useMutation(api.mealPhotos.generateUploadUrl)
  const registerPhoto = useMutation(api.mealPhotos.register)
  const inputRef = useRef<HTMLInputElement>(null)
  const [note, setNote] = useState('')
  const [photo, setPhoto] = useState<Photo | null>(null)
  const [dragging, setDragging] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmation, setConfirmation] = useState<string | null>(null)

  const photoRef = useRef<Photo | null>(null)
  photoRef.current = photo
  useEffect(() => {
    return () => {
      if (photoRef.current) URL.revokeObjectURL(photoRef.current.url)
    }
  }, [])

  function addFile(file: File | undefined) {
    if (!file) return
    setError(null)
    if (!file.type.startsWith('image/')) {
      setError('Choose a valid image file')
      return
    }
    if (file.size > MAX_PHOTO_BYTES) {
      setError('Meal photos must be 8 MB or smaller')
      return
    }
    if (photo) URL.revokeObjectURL(photo.url)
    setPhoto({ file, url: URL.createObjectURL(file), name: file.name })
  }

  function removePhoto() {
    if (photo) URL.revokeObjectURL(photo.url)
    setPhoto(null)
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const description = note.trim()
    if ((!description && !photo) || isSubmitting) return
    if (!isSignedIn) {
      await navigate({ to: '/sign-in/$', params: { _splat: '' } })
      return
    }

    setIsSubmitting(true)
    setError(null)
    setConfirmation(null)
    try {
      let photoId: Id<'mealPhotos'> | undefined
      if (photo) {
        const uploadUrl = await generateUploadUrl({})
        const uploadResponse = await fetch(uploadUrl, {
          method: 'POST',
          headers: { 'Content-Type': photo.file.type },
          body: photo.file,
        })
        if (!uploadResponse.ok) throw new Error('Could not upload the photo')
        const upload: { storageId: Id<'_storage'> } =
          await uploadResponse.json()
        photoId = await registerPhoto({ storageId: upload.storageId })
      }
      const now = new Date()
      const result = await analyzeMeal({
        description,
        dateKey,
        localMinutes: now.getHours() * 60 + now.getMinutes(),
        photoId,
      })
      setNote('')
      removePhoto()
      setConfirmation(
        `${result.meal.name} added, ${result.meal.calories.toLocaleString()} kcal`,
      )
    } catch (caughtError) {
      setError(getErrorMessage(caughtError))
    } finally {
      setIsSubmitting(false)
    }
  }

  const canSubmit = (note.trim().length > 0 || photo !== null) && !isSubmitting

  return (
    <div className="space-y-8">
      <form onSubmit={handleSubmit}>
        <Card
          onDragOver={(event) => {
            event.preventDefault()
            setDragging(true)
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault()
            setDragging(false)
            addFile(event.dataTransfer.files[0])
          }}
          className={cn(
            'gap-4 border-white/10 bg-white/[0.04] shadow-[0_24px_70px_-24px_rgba(0,0,0,0.7)] backdrop-blur-md transition-colors',
            dragging && 'border-white/35 bg-white/[0.07]',
          )}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="size-4 text-white/60" aria-hidden="true" />
              Add food
            </CardTitle>
            <CardDescription className="max-w-prose text-white/60">
              Describe the meal, add a photo, or use both. AI will estimate
              calories and macros.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-3">
            <Textarea
              id="food-note"
              value={note}
              maxLength={2_000}
              disabled={isSubmitting}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? 'food-error' : 'food-help'}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Grilled chicken salad with half an avocado and two tablespoons of olive oil"
              className="min-h-28 border-white/10 bg-black/20 placeholder:text-white/40"
            />
            {photo ? (
              <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/15 p-2">
                <img
                  src={photo.url}
                  alt="Meal preview"
                  className="size-16 rounded-xl object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-white/75">{photo.name}</p>
                  <p className="mt-1 text-xs text-white/40">
                    {(photo.file.size / (1024 * 1024)).toFixed(1)} MB
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  disabled={isSubmitting}
                  onClick={removePhoto}
                  aria-label="Remove meal photo"
                  className="text-white/55 hover:bg-white/10 hover:text-white"
                >
                  <X aria-hidden="true" />
                </Button>
              </div>
            ) : null}
            <div className="flex min-h-5 items-start justify-between gap-4 text-xs">
              <p id="food-help" className="text-white/40">
                Estimates vary. Review portions for better accuracy.
              </p>
              <span className="shrink-0 tabular-nums text-white/35">
                {note.length}/2,000
              </span>
            </div>

            <div aria-live="polite" className="min-h-6">
              {error ? (
                <p
                  id="food-error"
                  className="flex items-start gap-2 text-sm text-[oklch(0.78_0.11_25)]"
                >
                  <AlertCircle
                    className="mt-0.5 size-4 shrink-0"
                    aria-hidden="true"
                  />
                  {error}
                </p>
              ) : confirmation ? (
                <p className="flex items-start gap-2 text-sm text-[oklch(0.8_0.08_150)]">
                  <Check
                    className="mt-0.5 size-4 shrink-0"
                    aria-hidden="true"
                  />
                  {confirmation}
                </p>
              ) : null}
            </div>
          </CardContent>

          <CardFooter className="flex-wrap justify-between gap-3">
            <Button
              type="button"
              variant="outline"
              size="lg"
              disabled={isSubmitting}
              onClick={() => inputRef.current?.click()}
              className="border-white/15 bg-transparent text-white hover:bg-white/10 hover:text-white"
            >
              <ImagePlus aria-hidden="true" />
              {photo ? 'Replace photo' : 'Photo'}
            </Button>
            <Button type="submit" size="lg" disabled={!canSubmit}>
              {isSubmitting ? (
                <LoaderCircle className="animate-spin" aria-hidden="true" />
              ) : (
                <Plus aria-hidden="true" />
              )}
              {isSubmitting ? 'Analyzing meal' : 'Add to today'}
            </Button>
          </CardFooter>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => {
              addFile(event.target.files?.[0])
              event.target.value = ''
            }}
          />
        </Card>
      </form>

      <DailyMeals dateKey={dateKey} />
    </div>
  )
}

function getLocalDateKey() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function getErrorMessage(error: unknown) {
  if (typeof error === 'object' && error !== null) {
    if (
      'data' in error &&
      typeof error.data === 'object' &&
      error.data !== null &&
      'message' in error.data &&
      typeof error.data.message === 'string'
    ) {
      return error.data.message
    }
    if ('message' in error && typeof error.message === 'string') {
      return error.message
    }
  }
  return 'Could not analyze this meal. Try again.'
}
