"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useUser } from "./UserContext";

const DataContext = createContext(null);

export function DataProvider({ children }) {
  const { user, loading: userLoading } = useUser();

  const [cart, setCart] = useState(null);
  const [cartLoading, setCartLoading] = useState(false);
  const [cartError, setCartError] = useState("");
  const [cartBusyId, setCartBusyId] = useState(null);

  // =========================================================
  // LOAD CART
  // =========================================================

  const loadCart = useCallback(async () => {
    if (!user) {
      setCart(null);
      setCartLoading(false);
      return;
    }

    setCartLoading(true);
    setCartError("");

    try {
      const response = await fetch("/api/cart", {
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Could not load cart");
      }

      setCart(result);
    } catch (error) {
      console.error("Cart loading error:", error);

      setCartError(error.message || "Could not load cart");
    } finally {
      setCartLoading(false);
    }
  }, [user]);

  // =========================================================
  // LOAD CART WHEN USER CHANGES
  // =========================================================

  useEffect(() => {
    if (userLoading) return;

    if (!user) {
      setCart(null);
      setCartError("");
      setCartLoading(false);
      return;
    }

    loadCart();
  }, [user, userLoading, loadCart]);

  // =========================================================
  // ADD TO CART
  // =========================================================

  const addToCart = useCallback(
    async (listingId, quantity = 1) => {
      setCartError("");

      try {
        const response = await fetch("/api/cart", {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            listingId,
            quantity,
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Could not add item to cart");
        }

        // Update shared cart data
        await loadCart();

        return {
          success: true,
          data: result,
        };
      } catch (error) {
        console.error("Add to cart error:", error);

        setCartError(error.message || "Could not add item to cart");

        return {
          success: false,
          error: error.message,
        };
      }
    },
    [loadCart],
  );

  // =========================================================
  // UPDATE CART QUANTITY
  // =========================================================

  const updateCartItem = useCallback(
    async (cartItemId, quantity) => {
      if (!cartItemId || quantity < 1) return;

      setCartBusyId(cartItemId);
      setCartError("");

      try {
        const response = await fetch("/api/cart", {
          method: "PATCH",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            cartItemId,
            quantity,
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Could not update cart");
        }

        await loadCart();

        return {
          success: true,
          data: result,
        };
      } catch (error) {
        console.error("Update cart error:", error);

        setCartError(error.message || "Could not update cart");

        return {
          success: false,
          error: error.message,
        };
      } finally {
        setCartBusyId(null);
      }
    },
    [loadCart],
  );

  // =========================================================
  // REMOVE CART ITEM
  // =========================================================

  const removeCartItem = useCallback(
    async (cartItemId) => {
      if (!cartItemId) return;

      setCartBusyId(cartItemId);
      setCartError("");

      try {
        const response = await fetch("/api/cart", {
          method: "DELETE",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            cartItemId,
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Could not remove item");
        }

        await loadCart();

        return {
          success: true,
          data: result,
        };
      } catch (error) {
        console.error("Remove cart item error:", error);

        setCartError(error.message || "Could not remove item");

        return {
          success: false,
          error: error.message,
        };
      } finally {
        setCartBusyId(null);
      }
    },
    [loadCart],
  );

  // =========================================================
  // CART COMPUTED DATA
  // =========================================================

  const cartItems = cart?.items ?? [];

  // Number of different cart items
  const cartLength = cartItems.length;

  // Total units
  // example: Helmet x2 + Oil x3 = 5
  const cartCount = useMemo(() => {
    return cartItems.reduce(
      (total, item) => total + Number(item.quantity || 0),
      0,
    );
  }, [cartItems]);

  // =========================================================
  // UNAVAILABLE ITEMS
  // =========================================================

  const hasUnavailableItems = useMemo(() => {
    return cartItems.some(
      (item) =>
        item.listing?.status !== "published" ||
        item.quantity > item.listing?.quantity,
    );
  }, [cartItems]);

  // =========================================================
  // CONTEXT VALUE
  // =========================================================

  const value = {
    // raw cart
    cart,
    setCart,

    // cart information
    cartItems,
    cartLength,
    cartCount,

    // state
    cartLoading,
    cartError,
    cartBusyId,

    // computed
    hasUnavailableItems,

    // cart functions
    loadCart,
    addToCart,
    updateCartItem,
    removeCartItem,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const context = useContext(DataContext);

  if (!context) {
    throw new Error("useData must be used inside DataProvider");
  }

  return context;
}
