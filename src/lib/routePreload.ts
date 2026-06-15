import { lazy } from "react";

const routeLoaders = {
  landing: () => import("@/pages/LandingPage"),
  auth: () => import("@/pages/AuthPage"),
  admin: () => import("@/pages/AdminDashboard"),
  resetPassword: () => import("@/pages/ResetPassword"),
  dashboard: () => import("@/pages/Dashboard"),
  clubDashboard: () => import("@/pages/ClubDashboard"),
  memberDashboard: () => import("@/pages/MemberDashboard"),
  events: () => import("@/pages/Events"),
  profile: () => import("@/pages/Profile"),
  settings: () => import("@/pages/Settings"),
  createEvent: () => import("@/pages/CreateEvent"),
  discover: () => import("@/pages/DiscoverClubs"),
  mobileCalendar: () => import("@/pages/MobileCalendar"),
  mobileChat: () => import("@/pages/MobileChat"),
  clubSettings: () => import("@/pages/ClubSettingsPage"),
  assignPowers: () => import("@/pages/AssignPowersPage"),
  chatbot: () => import("@/pages/ChatbotPage"),
  superAdminChatbot: () => import("@/pages/SuperAdminChatbotPage"),
  attendanceHistory: () => import("@/pages/AttendanceHistory"),
  contact: () => import("@/pages/ContactUs"),
  contact2: () => import("@/pages/Contact2"),
  reviews: () => import("@/pages/Reviews"),
  forms: () => import("@/pages/Forms"),
  formBuilder: () => import("@/pages/FormBuilder"),
  formFill: () => import("@/pages/FormFill"),
  formResponses: () => import("@/pages/FormResponses"),
  markAttendance: () => import("@/pages/MarkAttendance"),
  superAdmin: () => import("@/pages/SuperAdminDashboard"),
  globalReports: () => import("@/pages/GlobalReports"),
  manageOutsiders: () => import("@/pages/ManageOutsiders"),
  notFound: () => import("@/pages/NotFound"),
} as const;

type RouteKey = keyof typeof routeLoaders;

const pathToRouteKey: Array<[RegExp, RouteKey]> = [
  [/^\/$/, "landing"],
  [/^\/(login|signup|auth)/, "auth"],
  [/^\/reset-password/, "resetPassword"],
  [/^\/dashboard/, "dashboard"],
  [/^\/admin/, "admin"],
  [/^\/club\//, "clubDashboard"],
  [/^\/clubs/, "clubDashboard"],
  [/^\/member(s)?/, "memberDashboard"],
  [/^\/events/, "events"],
  [/^\/profile/, "profile"],
  [/^\/settings/, "settings"],
  [/^\/create-event/, "createEvent"],
  [/^\/discover/, "discover"],
  [/^\/calendar/, "mobileCalendar"],
  [/^\/chat$/, "mobileChat"],
  [/^\/club-settings/, "clubSettings"],
  [/^\/assign-powers/, "assignPowers"],
  [/^\/chatbot/, "chatbot"],
  [/^\/super-admin\/chatbot/, "superAdminChatbot"],
  [/^\/super-admin/, "superAdmin"],
  [/^\/attendance-history/, "attendanceHistory"],
  [/^\/contact2/, "contact2"],
  [/^\/contact/, "contact"],
  [/^\/reviews/, "reviews"],
  [/^\/forms\/new/, "formBuilder"],
  [/^\/forms\/[^/]+\/edit/, "formBuilder"],
  [/^\/forms\/[^/]+\/responses/, "formResponses"],
  [/^\/forms\/[^/]+/, "formFill"],
  [/^\/forms/, "forms"],
  [/^\/mark-attendance\//, "markAttendance"],
  [/^\/global-reports/, "globalReports"],
  [/^\/manage-outsiders/, "manageOutsiders"],
];

export const lazyRoute = (key: RouteKey) => lazy(routeLoaders[key]);

export function preloadRoute(path: string) {
  const pathname = path.split(/[?#]/)[0] || "/";
  const match = pathToRouteKey.find(([pattern]) => pattern.test(pathname));
  if (!match) return;
  void routeLoaders[match[1]]();
}