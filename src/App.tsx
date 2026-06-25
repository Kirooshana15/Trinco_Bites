import { createRouter, useRouter, createRoute, createRootRoute, Outlet, Link } from "@tanstack/react-router";
import { CartProvider } from "@/context/CartContext";
import { LocationProvider } from "@/context/LocationContext";
import { SearchProvider } from "@/context/SearchContext";
import { AuthProvider } from "@/context/AuthContext";
import { OrderProvider } from "@/context/OrderContext";
import { RestaurantProvider } from "@/context/RestaurantContext";
import { NotificationProvider } from "@/context/NotificationContext";

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
    <AuthProvider>
      <NotificationProvider>
        <RestaurantProvider>
          <CartProvider>
            <LocationProvider>
              <SearchProvider>
                <OrderProvider>
                  <Outlet />
                </OrderProvider>
              </SearchProvider>
            </LocationProvider>
          </CartProvider>
        </RestaurantProvider>
      </NotificationProvider>
    </AuthProvider>
  ),
  notFoundComponent: NotFoundComponent,
});
import { Splash } from "./pages/user/index";
import { Home } from "./pages/user/home";
import { Cart } from "./pages/user/cart";
import { Checkout } from "./pages/user/checkout";
import { Login } from "./pages/user/login";
import { Onboarding } from "./pages/user/onboarding";
import { Rate } from "./pages/user/rate";
import { Register } from "./pages/user/register";
import { Success } from "./pages/user/success";
import { Track } from "./pages/user/track";
import { Orders } from "./pages/user/orders";
import { LocationPage } from "./pages/user/location";
import { RestaurantPage } from "./components/restaurant.$id";
import { FoodDetailPage } from "./components/food.$id";
import { AdminLogin } from "./pages/business_login";
import { RestaurantAdminLayout } from "./pages/resturant/layout";
import { RestaurantDashboard } from "./pages/resturant/dashboard";
import { OrderManagement } from "./pages/resturant/orders";
import { MenuManagement } from "./pages/resturant/menu";
import { CategoryManagement } from "./pages/resturant/categories";
import { RestaurantProfile } from "./pages/resturant/profile";
import { CustomerManagement } from "./pages/resturant/customers";
import { ReviewsRatings } from "./pages/resturant/reviews";
import { CouponsOffers } from "./pages/resturant/offer";
import { AnalyticsReports } from "./pages/resturant/analytics";
import { Notifications } from "./pages/resturant/notifications";
import { PaymentWallet } from "./pages/resturant/payments";
import { AdminDashboard } from "./pages/admin/admin-dashboard";
import { TermsOfService } from "./pages/user/terms-of-service";
import { PrivacyPolicy } from "./pages/user/privacy-policy";
import { ForgotPassword } from "./pages/forgot-password";


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

const signupRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/signup",
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

const ordersRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/orders",
  component: Orders,
});

const locationRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/location",
  component: LocationPage,
});

const foodRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/food/$id",
  component: FoodDetailPage,
});

const adminLoginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/business_login",
  component: AdminLogin,
});

const termsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/terms-of-service",
  component: TermsOfService,
});

const privacyRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/privacy-policy",
  component: PrivacyPolicy,
});

const forgotPasswordRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/forgot-password",
  component: ForgotPassword,
});

const legacyTermsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/terms",
  component: TermsOfService,
});

const legacyPrivacyRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/privacy",
  component: PrivacyPolicy,
});

// Pathless layout route for restaurant admin
const restaurantAdminLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "restaurant-admin-layout",
  component: RestaurantAdminLayout,
});

const restaurantDashboardRoute = createRoute({
  getParentRoute: () => restaurantAdminLayoutRoute,
  path: "/restaurant/dashboard",
  component: RestaurantDashboard,
});

const restaurantOrdersRoute = createRoute({
  getParentRoute: () => restaurantAdminLayoutRoute,
  path: "/restaurant/orders",
  component: OrderManagement,
});

const restaurantMenuRoute = createRoute({
  getParentRoute: () => restaurantAdminLayoutRoute,
  path: "/restaurant/menu",
  component: MenuManagement,
});

const restaurantCategoriesRoute = createRoute({
  getParentRoute: () => restaurantAdminLayoutRoute,
  path: "/restaurant/categories",
  component: CategoryManagement,
});

const restaurantProfileRoute = createRoute({
  getParentRoute: () => restaurantAdminLayoutRoute,
  path: "/restaurant/profile",
  component: RestaurantProfile,
});


const restaurantCustomersRoute = createRoute({
  getParentRoute: () => restaurantAdminLayoutRoute,
  path: "/restaurant/customers",
  component: CustomerManagement,
});

const restaurantReviewsRoute = createRoute({
  getParentRoute: () => restaurantAdminLayoutRoute,
  path: "/restaurant/reviews",
  component: ReviewsRatings,
});

const restaurantCouponsRoute = createRoute({
  getParentRoute: () => restaurantAdminLayoutRoute,
  path: "/restaurant/offers",
  component: CouponsOffers,
});

const restaurantAnalyticsRoute = createRoute({
  getParentRoute: () => restaurantAdminLayoutRoute,
  path: "/restaurant/analytics",
  component: AnalyticsReports,
});

const restaurantNotificationsRoute = createRoute({
  getParentRoute: () => restaurantAdminLayoutRoute,
  path: "/restaurant/notifications",
  component: Notifications,
});

const restaurantPaymentsRoute = createRoute({
  getParentRoute: () => restaurantAdminLayoutRoute,
  path: "/restaurant/payments",
  component: PaymentWallet,
});

// Link all children to the pathless layout route
const restaurantAdminLayoutWithChildren = restaurantAdminLayoutRoute.addChildren([
  restaurantDashboardRoute,
  restaurantOrdersRoute,
  restaurantMenuRoute,
  restaurantCategoriesRoute,
  restaurantProfileRoute,
  restaurantCustomersRoute,
  restaurantReviewsRoute,
  restaurantCouponsRoute,
  restaurantAnalyticsRoute,
  restaurantNotificationsRoute,
  restaurantPaymentsRoute,
]);

const adminDashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin/dashboard",
  component: AdminDashboard,
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
  signupRoute,
  restaurantRoute,
  successRoute,
  trackRoute,
  ordersRoute,
  locationRoute,
  foodRoute,
  adminLoginRoute,
  restaurantAdminLayoutWithChildren,
  adminDashboardRoute,
  termsRoute,
  privacyRoute,
  legacyTermsRoute,
  legacyPrivacyRoute,
  forgotPasswordRoute,
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
