import React from "react";
import type { CSSProperties, MouseEvent } from "react";
import { useEffect, useState } from "react";
import { BASE, isAllowedShopItemRoute } from "./constants";
import HomePage from "./pages/HomePage";
import NotFoundPage from "./pages/NotFoundPage";
import ShopItemPage from "./pages/ShopItemPage";
import VerifyPage from "./pages/VerifyPage";

export interface RouteItem {
  path: AppPath;
  title: string;
  description: string;
}

export type AppPath = "/" | "/verify";

interface StaticRouteState {
  kind: "static";
  path: AppPath;
}

interface ShopItemRouteState {
  kind: "shopItem";
  shopId: string;
  itemId: string;
  locale: string;
  category: string;
}

interface NotFoundRouteState {
  kind: "notFound";
}

type RouteState = StaticRouteState | ShopItemRouteState | NotFoundRouteState;

const routes: RouteItem[] = [
  {
    path: "/verify",
    title: "Verify",
    description: "Entry point for verification.",
  },
];

const isAppPath = (path: string): path is AppPath =>
  path === "/" || routes.some((route) => route.path === path);

const normalizeRoute = (pathname: string, search: string): RouteState => {
  const stripped = pathname.startsWith(BASE)
    ? pathname.slice(BASE.length)
    : pathname;
  const normalizedPath = stripped.replace(/\/+$/, "") || "/";
  if (normalizedPath === "/404") {
    return { kind: "notFound" };
  }

  if (isAppPath(normalizedPath)) {
    return { kind: "static", path: normalizedPath };
  }

  const match = normalizedPath.match(/^\/shop\/([^/]+)\/item\/([^/]+)$/);
  if (match) {
    const shopId = decodeURIComponent(match[1]);
    const itemId = decodeURIComponent(match[2]);
    if (!isAllowedShopItemRoute(shopId, itemId)) {
      return { kind: "notFound" };
    }

    const params = new URLSearchParams(search);
    return {
      kind: "shopItem",
      shopId,
      itemId,
      locale: params.get("localte") || "",
      category: params.get("category") || "",
    };
  }

  return { kind: "notFound" };
};

function App() {
  const [currentRoute, setCurrentRoute] = useState<RouteState>(() =>
    normalizeRoute(window.location.pathname, window.location.search),
  );

  useEffect(() => {
    const handlePopState = () => {
      setCurrentRoute(
        normalizeRoute(window.location.pathname, window.location.search),
      );
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    if (
      currentRoute.kind === "notFound" &&
      window.location.pathname !== BASE + "/404"
    ) {
      window.history.replaceState(null, "", BASE + "/404");
    }
  }, [currentRoute]);

  const navigate = (nextPath: AppPath) => {
    if (currentRoute.kind === "static" && nextPath === currentRoute.path) {
      return;
    }

    window.history.pushState(null, "", BASE + nextPath);
    setCurrentRoute({ kind: "static", path: nextPath });
  };

  const handleNavigate =
    (nextPath: AppPath) => (event: MouseEvent<HTMLAnchorElement>) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.altKey ||
        event.ctrlKey ||
        event.shiftKey
      ) {
        return;
      }

      event.preventDefault();
      navigate(nextPath);
    };

  return (
    <div style={styles.shell}>
      <header style={styles.header}>
        <a
          href={BASE + "/"}
          onClick={handleNavigate("/")}
          style={styles.brandLink}
        >
          Right to Sell Demo
        </a>
      </header>

      {currentRoute.kind === "static" && currentRoute.path === "/" && (
        <HomePage />
      )}
      {currentRoute.kind === "static" && currentRoute.path === "/verify" && (
        <VerifyPage />
      )}
      {currentRoute.kind === "shopItem" && (
        <ShopItemPage
          shopId={currentRoute.shopId}
          itemId={currentRoute.itemId}
          locale={currentRoute.locale}
          category={currentRoute.category}
        />
      )}
      {currentRoute.kind === "notFound" && <NotFoundPage />}
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  shell: {
    minHeight: "100vh",
    background: "#f7f8fb",
    color: "#172033",
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  header: {
    alignItems: "center",
    background: "#ffffff",
    borderBottom: "1px solid #dde2eb",
    display: "flex",
    gap: "24px",
    justifyContent: "space-between",
    padding: "16px 24px",
  },
  brandLink: {
    color: "#172033",
    fontSize: "16px",
    fontWeight: 700,
    textDecoration: "none",
  },
};

export default App;
