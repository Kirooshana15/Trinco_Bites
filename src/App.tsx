import { createRouter, useRouter, createRoute, createRootRoute, Outlet, Link } from "@tanstack/react-router";
import { CartProvider } from "@/context/CartContext";
import { LocationProvider } from "@/context/LocationContext";
import { SearchProvider } from "@/context/SearchContext";
import { AuthProvider } from "@/context/AuthContext";


function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold">404</h1>
        <p className="mt-2 text-muted-foreground">This page wandered off the menu.</p>
        <Link to="/home" className="mt-6 inline-flex rounded-full bg-primary px-6 py-3 text-primary-foreground font-semibold">
          Back to Home
        </Link>
      </div>
    </div>
  );
}

const rootRoute = createRootRoute({
  component: () => (
    <CartProvider>
      <LocationProvider>
        <SearchProvider>
          <AuthProvider>
            <Outlet />
          </AuthProvider>
        </SearchProvider>
      </LocationProvider>
    </CartProvider>
  ),
  notFoundComponent: NotFoundComponent,
});
import { Splash } from "./pages/index";
import { Home } from "./pages/home";
import { Cart } from "./pages/cart";
import { Checkout } from "./pages/checkout";
import { Login } from "./pages/login";
import { Onboarding } from "./pages/onboarding";
import { Rate } from "./pages/rate";
import { Register } from "./pages/register";
import { RestaurantPage } from "./pages/restaurant.$id";
import { Success } from "./pages/success";
import { Track } from "./pages/track";
import { LocationPage } from "./pages/location";

// Define Routes
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: Splash,
});

const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/home",
  component: Home,
});

const cartRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/cart",
  component: Cart,
});

const checkoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/checkout",
  component: Checkout,
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  component: Login,
});

const onboardingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/onboarding",
  component: Onboarding,
});

const rateRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/rate",
  component: Rate,
});

const registerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/register",
  component: Register,
});

const restaurantRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/restaurant/$id",
  component: RestaurantPage,
});

const successRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/success",
  component: Success,
});

const trackRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/track",
  component: Track,
});

const locationRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/location",
  component: LocationPage,
});

// Assemble Route Tree
export const routeTree = rootRoute.addChildren([
  indexRoute,
  homeRoute,
  cartRoute,
  checkoutRoute,
  loginRoute,
  onboardingRoute,
  rateRoute,
  registerRoute,
  restaurantRoute,
  successRoute,
  trackRoute,
  locationRoute,
]);

function DefaultErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-8 w-8 text-destructive"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Something went wrong</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          An unexpected error occurred. Please try again.
        </p>
        {import.meta.env.DEV && error.message && (
          <pre className="mt-4 max-h-40 overflow-auto rounded-md bg-muted p-3 text-left font-mono text-xs text-destructive">
            {error.message}
          </pre>
        )}
        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const getRouter = () => {
  const router = createRouter({
    routeTree,
    context: {},
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
    defaultErrorComponent: DefaultErrorComponent,
  });

  return router;
};
