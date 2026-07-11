import { describe, expect, it } from 'vitest'

import {
  calculateAgeYears,
  calculateDailyObjective,
  calculateMaintenanceCalories,
  classifyActivityLevel,
} from './nutritionCalculator'

describe('nutrition calculator', () => {
  it('calculates age without local timezone drift', () => {
    expect(calculateAgeYears('1990-07-12', '2026-07-11')).toBe(35)
    expect(calculateAgeYears('1990-07-11', '2026-07-11')).toBe(36)
  })

  it('rejects invalid calendar dates', () => {
    expect(() => calculateAgeYears('2000-02-30', '2026-07-11')).toThrow(
      'valid calendar date',
    )
  })

  it('derives a conservative activity category from movement and exercise', () => {
    expect(
      classifyActivityLevel('mostly_sitting', {
        sessionsPerWeek: 0,
        minutesPerSession: 0,
        intensity: 'light',
      }),
    ).toBe('inactive')
    expect(
      classifyActivityLevel('some_movement', {
        sessionsPerWeek: 3,
        minutesPerSession: 45,
        intensity: 'moderate',
      }),
    ).toBe('low_active')
    expect(
      classifyActivityLevel('active', {
        sessionsPerWeek: 4,
        minutesPerSession: 60,
        intensity: 'vigorous',
      }),
    ).toBe('active')
    expect(
      classifyActivityLevel('physically_demanding', {
        sessionsPerWeek: 0,
        minutesPerSession: 0,
        intensity: 'light',
      }),
    ).toBe('very_active')
  })

  it('uses the 2023 adult EER equations', () => {
    expect(calculateMaintenanceCalories(30, 180, 80, 'male', 'inactive')).toBe(
      2730,
    )
    expect(
      calculateMaintenanceCalories(30, 165, 65, 'female', 'low_active'),
    ).toBe(2240)
  })

  it('calculates all daily targets and applies the weight goal', () => {
    const objective = calculateDailyObjective({
      birthDate: '1996-01-01',
      calculationDate: '2026-07-11',
      heightCm: 180,
      weightKg: 80,
      physiology: 'male',
      dailyMovement: 'mostly_sitting',
      exercise: {
        sessionsPerWeek: 0,
        minutesPerSession: 0,
        intensity: 'light',
      },
      weightGoal: 'lose',
    })

    expect(objective).toMatchObject({
      calculationVersion: '1.0.0',
      ageYears: 30,
      activityLevel: 'inactive',
      maintenanceCalories: 2730,
      goalAdjustmentPercent: -10,
    })
    expect(objective.targets).toHaveLength(8)
    expect(objective.targets[0]).toMatchObject({
      metric: 'calories',
      goal: { kind: 'target', target: 2460 },
      unit: 'kcal',
    })
    expect(objective.targets[1]).toMatchObject({
      metric: 'protein',
      goal: { kind: 'range', minimum: 96, maximum: 128 },
    })
    expect(objective.targets[4]).toMatchObject({
      metric: 'added_sugar',
      goal: { kind: 'maximum', maximum: 62 },
    })
  })

  it('rejects unsupported ages and implausible measurements', () => {
    expect(() =>
      calculateMaintenanceCalories(18, 180, 80, 'male', 'inactive'),
    ).toThrow('adults aged 19 to 120')
    expect(() =>
      calculateMaintenanceCalories(30, 99, 80, 'male', 'inactive'),
    ).toThrow('heightCm')
  })
})
