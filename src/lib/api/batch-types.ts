/** 벌크 API 항목별 부분 실패 공통 형태 */
export type BatchItemStatus = "OK" | "ERROR";

export type BatchItemError = {
  status: "ERROR";
  errorCode?: string;
};

export function isBatchItemOk<T extends { status: BatchItemStatus }>(
  item: T,
): item is T & { status: "OK" } {
  return item.status === "OK";
}

export function isBatchItemError(
  item: { status?: string },
): item is BatchItemError {
  return item.status === "ERROR";
}
