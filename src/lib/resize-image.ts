const MAX_IMAGE_EDGE = 1024
const JPEG_QUALITY = 0.82

export async function resizeImageForAnalysis(file: File): Promise<File> {
  const image = await createImageBitmap(file, {
    imageOrientation: 'from-image',
  })

  try {
    const { width, height } = fitWithinMaxEdge(
      image.width,
      image.height,
      MAX_IMAGE_EDGE,
    )

    if (width === image.width && height === image.height) return file

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height

    const context = canvas.getContext('2d')
    if (!context) throw new Error('Could not prepare the meal photo')

    context.drawImage(image, 0, 0, width, height)
    const blob = await canvasToBlob(canvas, 'image/jpeg', JPEG_QUALITY)

    return new File([blob], replaceExtension(file.name, 'jpg'), {
      type: blob.type,
      lastModified: file.lastModified,
    })
  } finally {
    image.close()
  }
}

export function fitWithinMaxEdge(
  width: number,
  height: number,
  maxEdge: number,
) {
  const scale = Math.min(1, maxEdge / Math.max(width, height))
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  }
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number,
) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob)
        else reject(new Error('Could not resize the meal photo'))
      },
      type,
      quality,
    )
  })
}

function replaceExtension(filename: string, extension: string) {
  const stem = filename.replace(/\.[^./\\]+$/, '') || 'meal-photo'
  return `${stem}.${extension}`
}
