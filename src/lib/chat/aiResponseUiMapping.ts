import type { ChatMessage } from "@/types/chat";

export type AiResponseStructuredShape = {
  intent?: string;
  answerText?: string;
  recommendedPlaces?: ChatMessage["aiRecommendedPlaces"];
  placeRecommendationHeading?: ChatMessage["aiPlaceRecommendationHeading"];
  conversationSummary?: ChatMessage["aiConversationSummary"];
};

/** parseAiResponseStructuredMeta 결과에서 말풍선 확장 필드만 추출 */
export function aiResponseStructuredToPartialFields(
  structured: AiResponseStructuredShape,
): Partial<
  Pick<
    ChatMessage,
    | "aiIntent"
    | "aiRecommendedPlaces"
    | "aiPlaceRecommendationHeading"
    | "aiConversationSummary"
  >
> {
  const fields: Partial<
    Pick<
      ChatMessage,
      | "aiIntent"
      | "aiRecommendedPlaces"
      | "aiPlaceRecommendationHeading"
      | "aiConversationSummary"
    >
  > = {};

  if (structured.intent) fields.aiIntent = structured.intent;

  if (
    structured.intent === "place_recommendation" &&
    structured.recommendedPlaces?.length
  ) {
    fields.aiRecommendedPlaces = structured.recommendedPlaces;
    if (structured.placeRecommendationHeading) {
      fields.aiPlaceRecommendationHeading =
        structured.placeRecommendationHeading;
    }
  }

  if (
    structured.intent === "conversation_summary" &&
    structured.conversationSummary
  ) {
    fields.aiConversationSummary = structured.conversationSummary;
  }

  return fields;
}

export function aiResponseDisplayText(
  content: string,
  structured: Pick<AiResponseStructuredShape, "answerText">,
): string {
  const t = structured.answerText?.trim();
  return t != null && t !== "" ? t : content;
}
