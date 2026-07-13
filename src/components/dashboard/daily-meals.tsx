import { useEffect, useState } from 'react'
import { Trash2 } from 'lucide-react'
import { useMutation, useQuery } from 'convex/react'
import { toast } from 'sonner'
import type { Doc, Id } from '../../../convex/_generated/dataModel'

import { api } from '../../../convex/_generated/api'
import { Button } from '@/components/ui/button'

type DayMeal = Doc<'mealEntries'> & { photoUrl: string | null }
type MealId = Id<'mealEntries'>

const UNDO_WINDOW_MS = 5_000

export function DailyMeals({ dateKey }: { dateKey: string }) {
  const day = useQuery(api.mealEntries.day, { dateKey })
  const removeMeal = useMutation(api.mealEntries.remove)
  // Ids optimistically hidden while their undo window is open (and until the
  // backend query confirms the deletion). Keyed by meal id.
  const [pendingDeletes, setPendingDeletes] = useState<Set<MealId>>(
    () => new Set(),
  )

  // Once the server has dropped a meal, its id can leave the pending set. Doing
  // this off the query (rather than right after the mutation) keeps the row
  // hidden continuously, so it never flashes back before the query catches up.
  useEffect(() => {
    if (!day) return
    const liveIds = new Set(day.meals.map((meal) => meal._id))
    setPendingDeletes((prev) => {
      let changed = false
      const next = new Set<MealId>()
      for (const id of prev) {
        if (liveIds.has(id)) next.add(id)
        else changed = true
      }
      return changed ? next : prev
    })
  }, [day])

  function unhide(mealId: MealId) {
    setPendingDeletes((prev) => {
      if (!prev.has(mealId)) return prev
      const next = new Set(prev)
      next.delete(mealId)
      return next
    })
  }

  function scheduleDelete(meal: DayMeal) {
    setPendingDeletes((prev) => new Set(prev).add(meal._id))

    // `settled` makes commit/cancel mutually exclusive and idempotent, so the
    // undo click always wins over the auto-close/dismiss handlers regardless of
    // sonner's callback ordering.
    let settled = false
    const commit = () => {
      if (settled) return
      settled = true
      removeMeal({ mealId: meal._id }).catch(() => {
        unhide(meal._id)
        toast.error('Could not delete the meal. Try again.')
      })
    }
    const cancel = () => {
      if (settled) return
      settled = true
      unhide(meal._id)
    }

    toast(`Deleted ${meal.name}`, {
      duration: UNDO_WINDOW_MS,
      action: { label: 'Undo', onClick: cancel },
      onAutoClose: commit,
      onDismiss: commit,
    })
  }

  const meals = day?.meals ?? []
  const removedCalories = meals.reduce(
    (sum, meal) => (pendingDeletes.has(meal._id) ? sum + meal.calories : sum),
    0,
  )
  const removedCount = meals.reduce(
    (count, meal) => (pendingDeletes.has(meal._id) ? count + 1 : count),
    0,
  )
  const visibleMeals = meals.filter((meal) => !pendingDeletes.has(meal._id))
  const totalCalories = Math.max(0, (day?.totalCalories ?? 0) - removedCalories)
  const mealCount = Math.max(0, (day?.mealCount ?? 0) - removedCount)

  return (
    <section aria-labelledby="today-calories-heading">
      <div className="flex items-end justify-between gap-6 border-b border-white/10 pb-4">
        <div>
          <h2
            id="today-calories-heading"
            className="text-sm font-medium text-white/60"
          >
            Today
          </h2>
          {day === undefined ? (
            <div className="mt-2 h-9 w-36 animate-pulse rounded-lg bg-white/8" />
          ) : (
            <p className="mt-1 text-3xl font-semibold tracking-[-0.035em] tabular-nums">
              {totalCalories.toLocaleString()}
              <span className="ml-2 text-base font-normal text-white/45">
                kcal
              </span>
            </p>
          )}
        </div>
        {day !== undefined ? (
          <p className="pb-1 text-sm text-white/45">
            {mealCount} {mealCount === 1 ? 'meal' : 'meals'}
          </p>
        ) : null}
      </div>

      {day === undefined ? (
        <div className="space-y-3 py-5" aria-label="Loading today’s meals">
          <div className="h-12 animate-pulse rounded-xl bg-white/[0.04]" />
          <div className="h-12 animate-pulse rounded-xl bg-white/[0.04]" />
        </div>
      ) : visibleMeals.length ? (
        <ul className="divide-y divide-white/8">
          {visibleMeals.map((meal) => (
            <li
              key={meal._id}
              className="flex items-center justify-between gap-4 py-4"
            >
              <div className="flex min-w-0 items-center gap-3">
                {meal.photoUrl ? (
                  <img
                    src={meal.photoUrl}
                    alt=""
                    className="size-11 shrink-0 rounded-xl object-cover"
                  />
                ) : null}
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-white/85">
                    {meal.name}
                  </p>
                  <p className="mt-1 text-xs text-white/40">
                    {meal.proteinGrams}g protein · {meal.carbohydrateGrams}g
                    carbs · {meal.fatGrams}g fat
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <p className="text-sm font-medium tabular-nums text-white/70">
                  {meal.calories.toLocaleString()} kcal
                </p>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => scheduleDelete(meal)}
                  aria-label={`Delete ${meal.name}`}
                  className="text-white/35 hover:bg-white/10 hover:text-[oklch(0.78_0.11_25)]"
                >
                  <Trash2 aria-hidden="true" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="py-6 text-sm leading-6 text-white/45">
          No meals yet. Describe your first meal above.
        </p>
      )}
    </section>
  )
}
