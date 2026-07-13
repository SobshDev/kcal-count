import { describe, expect, it } from 'vitest'

import { fitWithinMaxEdge } from './resize-image'

describe('fitWithinMaxEdge', () => {
  it('shrinks a landscape image proportionally', () => {
    expect(fitWithinMaxEdge(4032, 3024, 1024)).toEqual({
      width: 1024,
      height: 768,
    })
  })

  it('shrinks a portrait image proportionally', () => {
    expect(fitWithinMaxEdge(3024, 4032, 1024)).toEqual({
      width: 768,
      height: 1024,
    })
  })

  it('does not enlarge a small image', () => {
    expect(fitWithinMaxEdge(640, 480, 1024)).toEqual({
      width: 640,
      height: 480,
    })
  })
})
