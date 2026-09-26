import { onRequestGet as __api_entries_js_onRequestGet } from "D:\\Movie_Tracker_Project\\functions\\api\\entries.js"
import { onRequestPost as __api_entries_js_onRequestPost } from "D:\\Movie_Tracker_Project\\functions\\api\\entries.js"

export const routes = [
    {
      routePath: "/api/entries",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_entries_js_onRequestGet],
    },
  {
      routePath: "/api/entries",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_entries_js_onRequestPost],
    },
  ]