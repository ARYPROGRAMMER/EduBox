/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as aiContent from "../aiContent.js";
import type * as aiStudyAssistant from "../aiStudyAssistant.js";
import type * as analytics from "../analytics.js";
import type * as assignments from "../assignments.js";
import type * as campusLife from "../campusLife.js";
import type * as chatMessages from "../chatMessages.js";
import type * as chatSessions from "../chatSessions.js";
import type * as courses from "../courses.js";
import type * as dataImportExport from "../dataImportExport.js";
import type * as dining from "../dining.js";
import type * as events from "../events.js";
import type * as files from "../files.js";
import type * as generations from "../generations.js";
import type * as notifications from "../notifications.js";
import type * as schedules from "../schedules.js";
import type * as search from "../search.js";
import type * as userContext from "../userContext.js";
import type * as users from "../users.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  aiContent: typeof aiContent;
  aiStudyAssistant: typeof aiStudyAssistant;
  analytics: typeof analytics;
  assignments: typeof assignments;
  campusLife: typeof campusLife;
  chatMessages: typeof chatMessages;
  chatSessions: typeof chatSessions;
  courses: typeof courses;
  dataImportExport: typeof dataImportExport;
  dining: typeof dining;
  events: typeof events;
  files: typeof files;
  generations: typeof generations;
  notifications: typeof notifications;
  schedules: typeof schedules;
  search: typeof search;
  userContext: typeof userContext;
  users: typeof users;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
