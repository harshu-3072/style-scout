import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { AuthProvider } from "@/contexts/AuthContext";
import Layout from "./components/layout/Layout";
import PageTransition from "./components/layout/PageTransition";
import ProtectedRoute from "./components/ProtectedRoute";
import Index from "./pages/Index";
import About from "./pages/About";
import Contact from "./pages/Contact";
import SnapSearch from "./pages/SnapSearch";
import Compare from "./pages/Compare";
import AIStylist from "./pages/AIStylist";
import AIDesigner from "./pages/AIDesigner";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import Checkout from "./pages/Checkout";
import Account from "./pages/Account";
import ProfilePage from "./pages/account/ProfilePage";
import WishlistPage from "./pages/account/WishlistPage";
import CartPage from "./pages/account/CartPage";
import OrdersPage from "./pages/account/OrdersPage";
import AddressesPage from "./pages/account/AddressesPage";
import WardrobePage from "./pages/account/WardrobePage";
import SavedLooksPage from "./pages/account/SavedLooksPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageTransition><Index /></PageTransition>} />
        <Route path="/about" element={<PageTransition><About /></PageTransition>} />
        <Route path="/contact" element={<PageTransition><Contact /></PageTransition>} />
        <Route path="/snap-search" element={<PageTransition><SnapSearch /></PageTransition>} />
        <Route path="/compare" element={<PageTransition><Compare /></PageTransition>} />
        <Route path="/ai-stylist" element={<PageTransition><AIStylist /></PageTransition>} />
        <Route path="/ai-designer" element={<PageTransition><AIDesigner /></PageTransition>} />
        <Route path="/sign-in" element={<PageTransition><SignIn /></PageTransition>} />
        <Route path="/sign-up" element={<PageTransition><SignUp /></PageTransition>} />
        <Route path="/checkout" element={<PageTransition><ProtectedRoute><Checkout /></ProtectedRoute></PageTransition>} />
        <Route path="/account" element={<ProtectedRoute><Account /></ProtectedRoute>}>
          <Route index element={<ProfilePage />} />
          <Route path="wardrobe" element={<WardrobePage />} />
          <Route path="saved-looks" element={<SavedLooksPage />} />
          <Route path="wishlist" element={<WishlistPage />} />
          <Route path="cart" element={<CartPage />} />
          <Route path="orders" element={<OrdersPage />} />
          <Route path="addresses" element={<AddressesPage />} />
        </Route>
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<PageTransition><NotFound /></PageTransition>} />
      </Routes>
    </AnimatePresence>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Layout>
            <AnimatedRoutes />
          </Layout>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
