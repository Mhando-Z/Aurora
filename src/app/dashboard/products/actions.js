"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

async function getAuthenticatedUser() {
  const supabase = await createClient();

  const { data: claimsData, error: claimsError } =
    await supabase.auth.getClaims();

  const userId = claimsData?.claims?.sub;

  if (claimsError || !userId) {
    return {
      supabase,
      userId: null,
      error: "You are not authenticated.",
    };
  }

  return {
    supabase,
    userId,
    error: null,
  };
}

export async function createProductAction(values) {
  try {
    const { supabase, userId, error: authError } = await getAuthenticatedUser();

    if (authError) {
      return {
        success: false,
        error: authError,
      };
    }

    const title = values?.title?.trim();
    const price = Number(values?.price);
    const quantity = Number(values?.quantity);

    if (!title) {
      return {
        success: false,
        error: "Product title is required.",
      };
    }

    if (!Number.isFinite(price) || price < 0) {
      return {
        success: false,
        error: "Enter a valid product price.",
      };
    }

    if (!Number.isInteger(quantity) || quantity < 0) {
      return {
        success: false,
        error: "Enter a valid quantity.",
      };
    }

    const { data, error } = await supabase
      .from("product_listings")
      .insert({
        seller_id: userId,
        title,
        price,
        quantity,
        currency: values?.currency || "TZS",
        condition: values?.condition || "New",
        published_at: new Date().toISOString(),
      })
      .select(
        `
        id,
        title,
        price,
        currency,
        condition,
        quantity,
        published_at
      `,
      )
      .single();

    if (error) {
      console.error("Create product error:", error);

      return {
        success: false,
        error: error.message,
      };
    }

    revalidatePath("/dashboard/products");

    return {
      success: true,
      product: data,
    };
  } catch (error) {
    console.error(error);

    return {
      success: false,
      error: "Something went wrong while creating the product.",
    };
  }
}

export async function updateProductAction(productId, values) {
  try {
    const { supabase, userId, error: authError } = await getAuthenticatedUser();

    if (authError) {
      return {
        success: false,
        error: authError,
      };
    }

    if (!productId) {
      return {
        success: false,
        error: "Product ID is required.",
      };
    }

    const title = values?.title?.trim();
    const price = Number(values?.price);
    const quantity = Number(values?.quantity);

    if (!title) {
      return {
        success: false,
        error: "Product title is required.",
      };
    }

    if (!Number.isFinite(price) || price < 0) {
      return {
        success: false,
        error: "Enter a valid product price.",
      };
    }

    if (!Number.isInteger(quantity) || quantity < 0) {
      return {
        success: false,
        error: "Enter a valid quantity.",
      };
    }

    const { error } = await supabase
      .from("product_listings")
      .update({
        title,
        price,
        quantity,
        currency: values?.currency || "TZS",
        condition: values?.condition || "New",
      })
      .eq("id", productId)
      .eq("seller_id", userId);

    if (error) {
      console.error("Update product error:", error);

      return {
        success: false,
        error: error.message,
      };
    }

    revalidatePath("/dashboard/products");

    return {
      success: true,
    };
  } catch (error) {
    console.error(error);

    return {
      success: false,
      error: "Something went wrong while updating the product.",
    };
  }
}

export async function deleteProductAction(productId) {
  try {
    const { supabase, userId, error: authError } = await getAuthenticatedUser();

    if (authError) {
      return {
        success: false,
        error: authError,
      };
    }

    if (!productId) {
      return {
        success: false,
        error: "Product ID is required.",
      };
    }

    const { error } = await supabase
      .from("product_listings")
      .delete()
      .eq("id", productId)
      .eq("seller_id", userId);

    if (error) {
      console.error("Delete product error:", error);

      return {
        success: false,
        error: error.message,
      };
    }

    revalidatePath("/dashboard/products");

    return {
      success: true,
    };
  } catch (error) {
    console.error(error);

    return {
      success: false,
      error: "Something went wrong while deleting the product.",
    };
  }
}
