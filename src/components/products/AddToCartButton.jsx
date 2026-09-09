// "use client";

// import { useState, useRef, useEffect } from "react";
// import { Check, Loader2, ShoppingCart } from "lucide-react";
// import { useRouter, usePathname, useSearchParams } from "next/navigation";

// import { useUser } from "@/context/UserContext";
// import { useData } from "@/context/DataContext";

// const SUCCESS_TIMEOUT_MS = 2000;
// const ERROR_TIMEOUT_MS = 4000;

// export default function AddToCartButton({
//   listingId,
//   availableQuantity = 1,
//   className = "",
// }) {
//   const router = useRouter();
//   const pathname = usePathname();
//   const searchParams = useSearchParams();

//   const { user, loading: userLoading } = useUser();
//   const { addToCart, cartItems } = useData();

//   const [loading, setLoading] = useState(false);
//   const [message, setMessage] = useState("");
//   const [success, setSuccess] = useState(false);

//   const isMountedRef = useRef(true);
//   const clearTimeoutRef = useRef(null);
//   const inFlightRef = useRef(false); // synchronous re-entrancy guard

//   useEffect(() => {
//     isMountedRef.current = true;
//     return () => {
//       isMountedRef.current = false;
//       if (clearTimeoutRef.current) clearTimeout(clearTimeoutRef.current);
//     };
//   }, []);

//   // Normalize once, defensively
//   const normalizedAvailable = Number.isFinite(Number(availableQuantity))
//     ? Number(availableQuantity)
//     : 0;

//   const existingCartItem = cartItems.find(
//     (item) => item.listing?.id === listingId,
//   );

//   const currentQuantity = Number.isFinite(Number(existingCartItem?.quantity))
//     ? Number(existingCartItem.quantity)
//     : 0;

//   const outOfStock = normalizedAvailable <= 0;
//   const maxReached = !outOfStock && currentQuantity >= normalizedAvailable;
//   const isDisabled = loading || userLoading || outOfStock || maxReached;

//   function scheduleClear(delay) {
//     if (clearTimeoutRef.current) clearTimeout(clearTimeoutRef.current);
//     clearTimeoutRef.current = setTimeout(() => {
//       if (!isMountedRef.current) return;
//       setSuccess(false);
//       setMessage("");
//     }, delay);
//   }

//   async function handleAddToCart() {
//     if (isDisabled || inFlightRef.current) return;

//     // Not logged in — send back to this exact page (with query string) after login
//     if (!user) {
//       const currentUrl = `${pathname}${
//         searchParams?.toString() ? `?${searchParams.toString()}` : ""
//       }`;
//       router.push(`/login?next=${encodeURIComponent(currentUrl)}`);
//       return;
//     }

//     inFlightRef.current = true;
//     setLoading(true);
//     setMessage("");
//     setSuccess(false);

//     try {
//       /*
//        * IMPORTANT:
//        * This calls DataContext instead of fetch("/api/cart")
//        *
//        * DataContext:
//        * POSTs to /api/cart
//        *        ↓
//        * reloads the cart
//        *        ↓
//        * setCart(...)
//        *        ↓
//        * Navbar + Cart page update immediately
//        */
//       const result = await addToCart(listingId, 1);

//       if (!result?.success) {
//         throw new Error(result?.error || "Could not add product to cart");
//       }

//       if (!isMountedRef.current) return;

//       setSuccess(true);
//       setMessage("Added to cart");
//       scheduleClear(SUCCESS_TIMEOUT_MS);
//     } catch (error) {
//       console.error("Add to cart error:", error);

//       if (!isMountedRef.current) return;

//       setSuccess(false);
//       setMessage(error?.message || "Could not add product to cart");
//       scheduleClear(ERROR_TIMEOUT_MS);
//     } finally {
//       inFlightRef.current = false;
//       if (isMountedRef.current) setLoading(false);
//     }
//   }

//   let buttonContent;
//   if (loading) {
//     buttonContent = (
//       <>
//         <Loader2 className="h-4 w-4 animate-spin" />
//         Adding...
//       </>
//     );
//   } else if (userLoading) {
//     buttonContent = (
//       <>
//         <Loader2 className="h-4 w-4 animate-spin" />
//         Checking...
//       </>
//     );
//   } else if (success) {
//     buttonContent = (
//       <>
//         <Check className="h-4 w-4" />
//         Added
//       </>
//     );
//   } else if (outOfStock) {
//     buttonContent = "Out of stock";
//   } else if (maxReached) {
//     buttonContent = (
//       <>
//         <ShoppingCart className="h-4 w-4" />
//         {`Max in cart (${currentQuantity})`}
//       </>
//     );
//   } else {
//     buttonContent = (
//       <>
//         <ShoppingCart className="h-4 w-4" />
//         Add to cart
//       </>
//     );
//   }

//   return (
//     <div className={className}>
//       <button
//         type="button"
//         onClick={handleAddToCart}
//         disabled={isDisabled}
//         aria-busy={loading || userLoading}
//         aria-disabled={isDisabled}
//         className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-black px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-black/85 disabled:cursor-not-allowed disabled:opacity-45"
//       >
//         {buttonContent}
//       </button>

//       <p
//         role="status"
//         aria-live="polite"
//         className={`mt-2 text-center text-xs ${
//           message ? (success ? "text-black/60" : "text-red-600") : "sr-only"
//         }`}
//       >
//         {message}
//       </p>
//     </div>
//   );
// }
"use client";

import { useState, useRef, useEffect } from "react";
import { Check, Loader2, ShoppingCart, Ban } from "lucide-react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

import { useUser } from "@/context/UserContext";
import { useData } from "@/context/DataContext";

const SUCCESS_TIMEOUT_MS = 2000;
const ERROR_TIMEOUT_MS = 4000;

// Recognize the server's "own listing" rejection without treating it as a crash
function isOwnListingError(message = "") {
  return /cannot add your own listing/i.test(message);
}

export default function AddToCartButton({
  listingId,
  sellerId, // optional: pass the listing owner's id if you have it, enables instant client-side check
  availableQuantity = 1,
  className = "",
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const { user, loading: userLoading } = useUser();
  const { addToCart, cartItems } = useData();

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [isOwnListing, setIsOwnListing] = useState(false);

  const isMountedRef = useRef(true);
  const clearTimeoutRef = useRef(null);
  const inFlightRef = useRef(false); // synchronous re-entrancy guard

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (clearTimeoutRef.current) clearTimeout(clearTimeoutRef.current);
    };
  }, []);

  // Known ahead of time if sellerId prop is provided
  const knownOwnListing =
    !!user && !!sellerId && String(user.id) === String(sellerId);

  const normalizedAvailable = Number.isFinite(Number(availableQuantity))
    ? Number(availableQuantity)
    : 0;

  const existingCartItem = cartItems.find(
    (item) => item.listing?.id === listingId,
  );

  const currentQuantity = Number.isFinite(Number(existingCartItem?.quantity))
    ? Number(existingCartItem.quantity)
    : 0;

  const outOfStock = normalizedAvailable <= 0;
  const maxReached = !outOfStock && currentQuantity >= normalizedAvailable;
  const ownListing = knownOwnListing || isOwnListing;
  const isDisabled =
    loading || userLoading || outOfStock || maxReached || ownListing;

  function scheduleClear(delay) {
    if (clearTimeoutRef.current) clearTimeout(clearTimeoutRef.current);
    clearTimeoutRef.current = setTimeout(() => {
      if (!isMountedRef.current) return;
      setSuccess(false);
      setMessage("");
    }, delay);
  }

  async function handleAddToCart() {
    if (isDisabled || inFlightRef.current) return;

    if (!user) {
      const currentUrl = `${pathname}${
        searchParams?.toString() ? `?${searchParams.toString()}` : ""
      }`;
      router.push(`/login?next=${encodeURIComponent(currentUrl)}`);
      return;
    }

    inFlightRef.current = true;
    setLoading(true);
    setMessage("");
    setSuccess(false);

    try {
      /*
       * IMPORTANT:
       * This calls DataContext instead of fetch("/api/cart")
       *
       * DataContext:
       * POSTs to /api/cart
       *        ↓
       * reloads the cart
       *        ↓
       * setCart(...)
       *        ↓
       * Navbar + Cart page update immediately
       */
      const result = await addToCart(listingId, 1);

      if (!result?.success) {
        throw new Error(result?.error || "Could not add product to cart");
      }

      if (!isMountedRef.current) return;

      setSuccess(true);
      setMessage("Added to cart");
      scheduleClear(SUCCESS_TIMEOUT_MS);
    } catch (error) {
      if (!isMountedRef.current) return;

      const ownListingRejection = isOwnListingError(error?.message);

      if (ownListingRejection) {
        // Expected business rule, not a bug — don't log it as an error
        setIsOwnListing(true);
        setSuccess(false);
        setMessage("This is your own listing");
        // no auto-clear: this state should persist, the button stays disabled
      } else {
        console.error("Add to cart error:", error);
        setSuccess(false);
        setMessage(error?.message || "Could not add product to cart");
        scheduleClear(ERROR_TIMEOUT_MS);
      }
    } finally {
      inFlightRef.current = false;
      if (isMountedRef.current) setLoading(false);
    }
  }

  let buttonContent;
  if (loading) {
    buttonContent = (
      <>
        <Loader2 className="h-4 w-4 animate-spin" />
        Adding...
      </>
    );
  } else if (userLoading) {
    buttonContent = (
      <>
        <Loader2 className="h-4 w-4 animate-spin" />
        Checking...
      </>
    );
  } else if (success) {
    buttonContent = (
      <>
        <Check className="h-4 w-4" />
        Added
      </>
    );
  } else if (ownListing) {
    buttonContent = (
      <>
        <Ban className="h-4 w-4" />
        Your listing
      </>
    );
  } else if (outOfStock) {
    buttonContent = "Out of stock";
  } else if (maxReached) {
    buttonContent = (
      <>
        <ShoppingCart className="h-4 w-4" />
        {`Max in cart (${currentQuantity})`}
      </>
    );
  } else {
    buttonContent = (
      <>
        <ShoppingCart className="h-4 w-4" />
        Add to cart
      </>
    );
  }

  return (
    <div className={className}>
      <button
        type="button"
        onClick={handleAddToCart}
        disabled={isDisabled}
        aria-busy={loading || userLoading}
        aria-disabled={isDisabled}
        className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-black px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-black/85 disabled:cursor-not-allowed disabled:opacity-45"
      >
        {buttonContent}
      </button>

      <p
        role="status"
        aria-live="polite"
        className={`mt-2 text-center text-xs ${
          message
            ? ownListing
              ? "text-black/60"
              : success
                ? "text-black/60"
                : "text-red-600"
            : "sr-only"
        }`}
      >
        {message}
      </p>
    </div>
  );
}
