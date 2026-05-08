import { parseFiniteNumber } from "@/lib/chat/normalizeServerChatMessage";
import type {
  AiConversationSummaryPayload,
  AiPlaceRecommendationHeading,
  AiRecommendedPlace,
} from "@/types/chat";

function readMetaString(
  meta: Record<string, string> | undefined,
  ...keys: string[]
): string | undefined {
  if (!meta) return undefined;
  for (const k of keys) {
    const v = meta[k];
    if (typeof v === "string" && v.trim() !== "") return v;
  }
  return undefined;
}

function safeParseJson<T>(raw: string | undefined): T | undefined {
  if (raw == null || raw.trim() === "") return undefined;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return undefined;
  }
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function pickString(...vals: unknown[]): string | undefined {
  for (const v of vals) {
    if (typeof v === "string") {
      const t = v.trim();
      if (t.length > 0) return v;
    }
  }
  return undefined;
}

function parseOneRecommendedPlace(raw: unknown): AiRecommendedPlace | null {
  if (!isRecord(raw)) return null;
  const placeId =
    (
      pickString(
        raw.placeId,
        raw.place_id,
        raw.googlePlaceId,
        raw.google_place_id,
      ) ?? ""
    ).trim();
  const name = (pickString(raw.name) ?? "").trim();
  const lat = parseFiniteNumber(raw.lat ?? raw.latitude);
  const lng = parseFiniteNumber(raw.lng ?? raw.longitude);
  if (!placeId || !name || lat === undefined || lng === undefined)
    return null;
  const address =
    pickString(raw.address, raw.formattedAddress, raw.formatted_address) ??
    "";
  const reason = pickString(raw.reason);
  const primaryType = pickString(raw.primaryType, raw.primary_type);
  const googleMapsUri = pickString(
    raw.googleMapsUri,
    raw.google_maps_uri,
  );

  return {
    placeId,
    name,
    address,
    lat,
    lng,
    ...(primaryType ? { primaryType } : {}),
    ...(reason ? { reason } : {}),
    ...(googleMapsUri ? { googleMapsUri } : {}),
  };
}

/** 레거시 — 메타 최상위 `recommendedPlaces` JSON 배열만 */
function parseLegacyFlatRecommendedPlaces(
  meta: Record<string, string> | undefined,
): AiRecommendedPlace[] | undefined {
  const rawStr = readMetaString(
    meta,
    "recommendedPlaces",
    "recommended_places",
    "recommendPlaces",
  );
  const parsed =
    rawStr !== undefined ?
      safeParseJson<unknown>(rawStr)
    : undefined;
  if (!Array.isArray(parsed)) return undefined;
  const out: AiRecommendedPlace[] = [];
  for (const row of parsed) {
    const p = parseOneRecommendedPlace(row);
    if (p) out.push(p);
  }
  return out.length > 0 ? out : undefined;
}

/** 제목·부제·장소 목록 — 블록 우선, 목록만 레거시 폴백 */
function parsePlaceRecommendationFromMeta(
  meta: Record<string, string> | undefined,
): {
  places?: AiRecommendedPlace[];
  heading?: AiPlaceRecommendationHeading;
} {
  const rawStr = readMetaString(
    meta,
    "place_recommendation",
    "placeRecommendation",
  );
  let blockPlaces: AiRecommendedPlace[] | undefined;
  let heading: AiPlaceRecommendationHeading | undefined;

  if (rawStr !== undefined) {
    const parsed = safeParseJson<unknown>(rawStr);
    if (isRecord(parsed)) {
      const title = pickString(parsed.title)?.trim();
      const subtitle = pickString(parsed.subtitle)?.trim();
      if (title || subtitle) {
        heading = {
          ...(title ? { title } : {}),
          ...(subtitle ? { subtitle } : {}),
        };
      }
      const placesRaw = parsed.places;
      if (Array.isArray(placesRaw)) {
        const out: AiRecommendedPlace[] = [];
        for (const row of placesRaw) {
          const p = parseOneRecommendedPlace(row);
          if (p) out.push(p);
        }
        if (out.length > 0) blockPlaces = out;
      }
    }
  }

  const legacy = parseLegacyFlatRecommendedPlaces(meta);
  const places =
    blockPlaces?.length ?
      blockPlaces
    : legacy?.length ?
      legacy
    : undefined;

  return {
    ...(places ? { places } : {}),
    ...(heading ? { heading } : {}),
  };
}

function parseSections(
  raw: unknown,
): NonNullable<AiConversationSummaryPayload["sections"]> {
  if (!Array.isArray(raw)) return [];
  const sections: NonNullable<AiConversationSummaryPayload["sections"]> = [];
  for (const row of raw) {
    if (!isRecord(row)) continue;
    const title = pickString(row.title)?.trim();
    const typeRaw = row.type;
    const type =
      typeof typeRaw === "string" ? typeRaw.trim() : `${typeRaw ?? ""}`;
    if (!title || type === "") continue;
    const itemsRaw = row.items;
    const items: string[] =
      Array.isArray(itemsRaw) ?
        itemsRaw.filter((it): it is string => typeof it === "string")
      : [];
    sections.push({ type, title, items });
  }
  return sections;
}

function parseMentionedPlaces(raw: unknown) {
  if (!Array.isArray(raw)) return undefined;
  const out: NonNullable<AiConversationSummaryPayload["mentionedPlaces"]> =
    [];
  for (const row of raw) {
    if (!isRecord(row)) continue;
    const name = pickString(row.name)?.trim();
    if (!name) continue;
    const source = pickString(row.source);
    const note = pickString(row.note);
    out.push({
      name,
      ...(source ? { source } : {}),
      ...(note ? { note } : {}),
    });
  }
  return out.length > 0 ? out : undefined;
}

function parseConversationSummaryPayload(
  raw: unknown,
): AiConversationSummaryPayload | undefined {
  if (!isRecord(raw)) return undefined;
  const title = pickString(raw.title)?.trim();
  const overview = pickString(raw.overview)?.trim();
  if (!title || !overview) return undefined;
  const sections = parseSections(raw.sections);
  const mentionedPlaces = parseMentionedPlaces(
    raw.mentionedPlaces ?? raw.mentioned_places,
  );

  const payload: AiConversationSummaryPayload = {
    title,
    overview,
    ...(sections.length > 0 ? { sections } : {}),
    ...(mentionedPlaces ? { mentionedPlaces } : {}),
  };
  return payload;
}

function parseConversationSummaryFromMeta(
  meta: Record<string, string> | undefined,
): AiConversationSummaryPayload | undefined {
  const rawStr = readMetaString(
    meta,
    "conversationSummary",
    "conversation_summary",
  );
  const parsed =
    rawStr !== undefined ?
      safeParseJson<unknown>(rawStr)
    : undefined;
  if (parsed == null) return undefined;
  return parseConversationSummaryPayload(parsed);
}

export function parseAiResponseStructuredMeta(metadata: Record<
  string,
  string
> | undefined): {
  intent?: string;
  answerText?: string;
  recommendedPlaces?: AiRecommendedPlace[];
  placeRecommendationHeading?: AiPlaceRecommendationHeading;
  conversationSummary?: AiConversationSummaryPayload;
} {
  if (!metadata) return {};
  const intentRaw = readMetaString(metadata, "intent", "Intent");
  const intent =
    intentRaw != null && intentRaw.trim() !== "" ?
      intentRaw.trim().toLowerCase()
    : undefined;

  const answerRaw = readMetaString(metadata, "answer_text", "answerText");
  const answerText =
    answerRaw != null && answerRaw.trim() !== "" ?
      answerRaw.trim()
    : undefined;

  const pr = parsePlaceRecommendationFromMeta(metadata);
  const recommendedPlaces = pr.places;

  const conversationSummary =
    parseConversationSummaryFromMeta(metadata);

  return {
    ...(intent ? { intent } : {}),
    ...(answerText ? { answerText } : {}),
    ...(recommendedPlaces?.length ? { recommendedPlaces } : {}),
    ...(pr.heading ? { placeRecommendationHeading: pr.heading } : {}),
    ...(conversationSummary ? { conversationSummary } : {}),
  };
}
