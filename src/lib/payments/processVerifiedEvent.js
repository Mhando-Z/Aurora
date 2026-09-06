import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Call this ONLY after the provider adapter has cryptographically verified the
 * incoming event. provider_event_id gives webhook idempotency.
 */
export async function processVerifiedPaymentEvent(providerKey, event) {
  const supabase = createAdminClient();

  const { data: existing, error: existingError } = await supabase
    .from("payment_events")
    .select("id, processed")
    .eq("provider", providerKey)
    .eq("provider_event_id", event.eventId)
    .maybeSingle();

  if (existingError) throw existingError;
  if (existing?.processed) return { duplicate: true, orderId: null };

  let eventRow = existing;

  if (!eventRow) {
    const { data, error } = await supabase
      .from("payment_events")
      .upsert(
        {
          payment_id: event.paymentId,
          provider: providerKey,
          provider_event_id: event.eventId,
          event_type: event.eventType,
          payload: event.metadata || {},
          processed: false,
        },
        {
          onConflict: "provider,provider_event_id",
          ignoreDuplicates: true,
        },
      )
      .select("id, processed")
      .maybeSingle();

    if (error) throw error;
    eventRow = data;

    if (!eventRow) {
      const { data: raced, error: racedError } = await supabase
        .from("payment_events")
        .select("id, processed")
        .eq("provider", providerKey)
        .eq("provider_event_id", event.eventId)
        .single();

      if (racedError) throw racedError;
      if (raced.processed) return { duplicate: true, orderId: null };
      eventRow = raced;
    }
  }

  try {
    const { data: orderId, error } = await supabase.rpc(
      "apply_verified_payment_result",
      {
        p_payment_id: event.paymentId,
        p_provider: providerKey,
        p_provider_payment_id: event.providerPaymentId || null,
        p_provider_reference: event.providerReference || null,
        p_new_status: event.status,
        p_metadata: event.metadata || {},
        p_failure_message: event.failureMessage || null,
      },
    );

    if (error) throw error;

    const { error: eventUpdateError } = await supabase
      .from("payment_events")
      .update({
        processed: true,
        processed_at: new Date().toISOString(),
        processing_error: null,
      })
      .eq("id", eventRow.id);

    if (eventUpdateError) throw eventUpdateError;

    return { duplicate: false, orderId };
  } catch (error) {
    await supabase
      .from("payment_events")
      .update({
        processing_error: error?.message || "Unknown processing error",
      })
      .eq("id", eventRow.id);
    throw error;
  }
}
