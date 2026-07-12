import { useEffect, useRef, useState } from 'react'
import { ImagePlus, Plus, Sparkles, X } from 'lucide-react'

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
import { cn } from '@/lib/utils'

type Photo = {
  id: number
  url: string
  name: string
}

export function AddFoodCard() {
  const inputRef = useRef<HTMLInputElement>(null)
  const nextId = useRef(0)
  const [note, setNote] = useState('')
  const [photos, setPhotos] = useState<Array<Photo>>([])
  const [dragging, setDragging] = useState(false)

  // Object URLs power the local previews; keep a live ref so the unmount
  // cleanup can revoke whatever is attached at that moment.
  const photosRef = useRef<Array<Photo>>([])
  photosRef.current = photos
  useEffect(() => {
    return () => {
      for (const photo of photosRef.current) URL.revokeObjectURL(photo.url)
    }
  }, [])

  function addFiles(files: FileList | null) {
    if (!files) return
    const images = Array.from(files).filter((file) =>
      file.type.startsWith('image/'),
    )
    if (images.length === 0) return
    setPhotos((previous) => [
      ...previous,
      ...images.map((file) => ({
        id: nextId.current++,
        url: URL.createObjectURL(file),
        name: file.name,
      })),
    ])
  }

  function removePhoto(id: number) {
    setPhotos((previous) => {
      const target = previous.find((photo) => photo.id === id)
      if (target) URL.revokeObjectURL(target.url)
      return previous.filter((photo) => photo.id !== id)
    })
  }

  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setDragging(false)
    addFiles(event.dataTransfer.files)
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    // Persistence isn't wired up yet — this only exercises the UI/UX.
    for (const photo of photos) URL.revokeObjectURL(photo.url)
    setNote('')
    setPhotos([])
  }

  const canSubmit = note.trim().length > 0 || photos.length > 0

  return (
    <form onSubmit={handleSubmit}>
      <Card
        onDragOver={(event) => {
          event.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={cn(
          'gap-4 border-white/10 bg-white/[0.04] shadow-[0_24px_70px_-24px_rgba(0,0,0,0.7)] backdrop-blur-md transition-colors',
          dragging && 'border-white/40 bg-white/[0.07]',
        )}
      >
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="size-4 text-white/60" aria-hidden="true" />
            Add food
          </CardTitle>
          <CardDescription className="text-white/60">
            Describe your meal, add a photo, or both.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-3">
          <Textarea
            id="food-note"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="What did you eat? e.g. Grilled chicken salad with olive oil and avocado"
            className="min-h-24 border-white/10 bg-black/20 placeholder:text-white/40"
          />

          {photos.length > 0 ? (
            <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {photos.map((photo) => (
                <li key={photo.id} className="group relative aspect-square">
                  <img
                    src={photo.url}
                    alt={photo.name}
                    className="size-full rounded-xl border border-white/10 object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removePhoto(photo.id)}
                    aria-label={`Remove ${photo.name}`}
                    className="absolute top-1.5 right-1.5 flex size-6 items-center justify-center rounded-full bg-black/60 text-white/80 backdrop-blur-sm transition-colors hover:bg-black/80 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
                  >
                    <X className="size-3.5" aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </CardContent>

        <CardFooter className="flex-wrap justify-between gap-3">
          <p className="text-xs text-white/40">
            Drag &amp; drop a photo anywhere on this card.
          </p>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={() => inputRef.current?.click()}
              className="border-white/15 bg-transparent text-white hover:bg-white/10 hover:text-white"
            >
              <ImagePlus aria-hidden="true" />
              Photo
            </Button>
            <Button type="submit" size="lg" disabled={!canSubmit}>
              <Plus aria-hidden="true" />
              Add to today
            </Button>
          </div>
        </CardFooter>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(event) => {
            addFiles(event.target.files)
            event.target.value = ''
          }}
        />
      </Card>
    </form>
  )
}
