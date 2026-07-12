/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as ai from "../ai.js";
import type * as aiAccess from "../aiAccess.js";
import type * as aiPolicy from "../aiPolicy.js";
import type * as dailyObjectives from "../dailyObjectives.js";
import type * as mealAnalysis from "../mealAnalysis.js";
import type * as mealEntries from "../mealEntries.js";
import type * as mealEntriesModel from "../mealEntriesModel.js";
import type * as mealPhotos from "../mealPhotos.js";
import type * as migrations from "../migrations.js";
import type * as nutritionCalculator from "../nutritionCalculator.js";
import type * as nutritionProfiles from "../nutritionProfiles.js";
import type * as nutritionTargets from "../nutritionTargets.js";
import type * as openRouterModel from "../openRouterModel.js";
import type * as statistics from "../statistics.js";
import type * as statisticsAggregation from "../statisticsAggregation.js";
import type * as statisticsModel from "../statisticsModel.js";
import type * as tokenUsage from "../tokenUsage.js";
import type * as tokenUsageModel from "../tokenUsageModel.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  ai: typeof ai;
  aiAccess: typeof aiAccess;
  aiPolicy: typeof aiPolicy;
  dailyObjectives: typeof dailyObjectives;
  mealAnalysis: typeof mealAnalysis;
  mealEntries: typeof mealEntries;
  mealEntriesModel: typeof mealEntriesModel;
  mealPhotos: typeof mealPhotos;
  migrations: typeof migrations;
  nutritionCalculator: typeof nutritionCalculator;
  nutritionProfiles: typeof nutritionProfiles;
  nutritionTargets: typeof nutritionTargets;
  openRouterModel: typeof openRouterModel;
  statistics: typeof statistics;
  statisticsAggregation: typeof statisticsAggregation;
  statisticsModel: typeof statisticsModel;
  tokenUsage: typeof tokenUsage;
  tokenUsageModel: typeof tokenUsageModel;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {
  migrations: import("@convex-dev/migrations/_generated/component.js").ComponentApi<"migrations">;
};
