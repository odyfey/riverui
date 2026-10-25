import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { InstanceSwitcher } from "./InstanceSwitcher";
import {
  currentBase,
  getInstances,
  type Instance,
  switchHref,
} from "./InstanceSwitcher.model";

const instances: Instance[] = [
  {
    base: "/prod",
    color: "red",
    healthy: true,
    label: "Prod",
    name: "prod",
  },
  { base: "/tenant-a", healthy: false, label: "Tenant A", name: "tenant-a" },
];

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    headers: { "Content-Type": "application/json" },
    status,
  });

const setPageBase = (base: string) => {
  const script = document.createElement("script");
  script.id = "config__json";
  script.type = "application/json";
  script.textContent = JSON.stringify({ apiUrl: `${base}/api`, base });
  document.head.append(script);
};

const renderSwitcher = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  render(
    <QueryClientProvider client={queryClient}>
      <InstanceSwitcher />
    </QueryClientProvider>,
  );
  return queryClient;
};

beforeEach(() => {
  window.history.pushState({}, "", "/prod/jobs?state=running");
});

afterEach(() => {
  document.getElementById("config__json")?.remove();
  vi.restoreAllMocks();
});

describe("switchHref", () => {
  const target = instances[1];

  test("keeps the page and search params", () => {
    expect(
      switchHref("/prod", target, {
        pathname: "/prod/jobs/12",
        search: "?state=running",
      }),
    ).toBe("/tenant-a/jobs/12?state=running");
  });

  test("maps the instance root to the target root", () => {
    expect(switchHref("/prod", target, { pathname: "/prod", search: "" })).toBe(
      "/tenant-a/",
    );
  });

  test("falls back to the target root for paths outside the base", () => {
    expect(
      switchHref("/prod", target, { pathname: "/other/jobs", search: "" }),
    ).toBe("/tenant-a/");
  });
});

describe("currentBase", () => {
  test("reads the base from the page config", () => {
    setPageBase("/tenant-a");
    expect(currentBase()).toBe("/tenant-a");
  });

  test("returns an empty base without page config", () => {
    expect(currentBase()).toBe("");
  });
});

describe("getInstances", () => {
  test("parses the instance list", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(jsonResponse(instances));

    await expect(getInstances()).resolves.toEqual(instances);
    expect(fetchSpy).toHaveBeenCalledWith(
      "/instances.json",
      expect.objectContaining({ credentials: "same-origin" }),
    );
  });

  test("rejects a missing endpoint", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("not found", { status: 404 }),
    );

    await expect(getInstances()).rejects.toThrow("404");
  });

  test("rejects an HTML fallback page", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("<html></html>", {
        headers: { "Content-Type": "text/html" },
      }),
    );

    await expect(getInstances()).rejects.toThrow("not JSON");
  });

  test("rejects an unexpected shape", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      jsonResponse([{ name: "prod" }]),
    );

    await expect(getInstances()).rejects.toThrow();
  });
});

describe("InstanceSwitcher", () => {
  test("renders nothing when the endpoint is missing", async () => {
    setPageBase("/prod");
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("not found", { status: 404 }),
    );

    const queryClient = renderSwitcher();

    await waitFor(() =>
      expect(queryClient.getQueryState(["riverdelta-instances"])?.status).toBe(
        "error",
      ),
    );
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  test("renders nothing when the page isn't a listed instance", async () => {
    setPageBase("/staging");
    vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse(instances));

    const queryClient = renderSwitcher();

    await waitFor(() =>
      expect(queryClient.getQueryState(["riverdelta-instances"])?.status).toBe(
        "success",
      ),
    );
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  test("shows the current instance and links to the others", async () => {
    setPageBase("/prod");
    vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse(instances));

    renderSwitcher();

    const button = await screen.findByRole("button", { name: /Prod/ });
    expect(button).toHaveAttribute("title", "Instance: Prod");

    fireEvent.click(button);

    const items = await screen.findAllByRole("menuitem");
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveAttribute("href", "/prod/jobs?state=running");
    expect(items[1]).toHaveAttribute("href", "/tenant-a/jobs?state=running");
    expect(items[1]).toHaveTextContent("unreachable");
  });
});
