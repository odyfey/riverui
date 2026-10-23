import { z } from "zod";

// Served by a multi-instance host (e.g. riverdelta) next to every riverui
// prefix. Stock riverui has no such endpoint, so the switcher stays hidden.
const INSTANCES_URL = "/instances.json";

const instanceSchema = z.object({
  base: z.string(),
  color: z.string().optional(),
  healthy: z.boolean(),
  label: z.string(),
  name: z.string(),
});

const instancesSchema = z.array(instanceSchema);

export type Instance = z.infer<typeof instanceSchema>;

export const instancesKey = () => ["riverdelta-instances"] as const;

export const getInstances = async (): Promise<Instance[]> => {
  const response = await fetch(INSTANCES_URL, {
    credentials: "same-origin",
    headers: { Accept: "application/json" },
  });
  if (!response.ok) {
    throw new Error(`instances request failed: ${response.status}`);
  }
  if (!response.headers.get("Content-Type")?.includes("application/json")) {
    throw new Error("instances response is not JSON");
  }
  return instancesSchema.parse(await response.json());
};

// Mirrors getBasePath in App.tsx: the server injects the prefix this
// instance is mounted under.
export const currentBase = (): string => {
  try {
    const configText =
      document.querySelector("script#config__json")?.textContent || "{}";
    const pageConfig = JSON.parse(configText);
    return pageConfig.base || "";
  } catch {
    return "";
  }
};

// Keeps the current page and filters when moving to another instance. It's
// a full page load because every instance has its own router basepath and
// API URL.
export const switchHref = (
  fromBase: string,
  target: Instance,
  location: Pick<Location, "pathname" | "search">,
): string => {
  const rest = location.pathname.startsWith(fromBase)
    ? location.pathname.slice(fromBase.length)
    : "";
  return `${target.base}${rest || "/"}${location.search}`;
};
