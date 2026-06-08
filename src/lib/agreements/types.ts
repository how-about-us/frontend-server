export type AgreementType = "TERMS_OF_SERVICE" | "PRIVACY_POLICY";
export type AgreementContentFormat = "MARKDOWN";

export type AgreementItem = {
  type: AgreementType;
  title: string;
  version: string;
  contentFormat: AgreementContentFormat;
  content: string;
};

export type CurrentAgreementsResponse = {
  items: AgreementItem[];
};

export type AcceptAgreementsRequest = {
  agreementsAccepted: true;
};
