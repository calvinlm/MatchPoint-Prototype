export const Gender: {
  readonly MALE: "MALE";
  readonly FEMALE: "FEMALE";
};
export type Gender = (typeof Gender)[keyof typeof Gender];

export const AgeGroup: {
  readonly JUNIOR: "JUNIOR";
  readonly A18: "A18";
  readonly A35: "A35";
  readonly A50: "A50";
};
export type AgeGroup = (typeof AgeGroup)[keyof typeof AgeGroup];

export const DivisionType: {
  readonly MS: "MS";
  readonly MD: "MD";
  readonly WS: "WS";
  readonly WD: "WD";
  readonly XD: "XD";
};
export type DivisionType = (typeof DivisionType)[keyof typeof DivisionType];

export const Level: {
  readonly NOV: "NOV";
  readonly INT: "INT";
  readonly ADV: "ADV";
  readonly OPN: "OPN";
};
export type Level = (typeof Level)[keyof typeof Level];

export const BracketFormat: {
  readonly SINGLE_ELIM: "SINGLE_ELIM";
  readonly DOUBLE_ELIM: "DOUBLE_ELIM";
  readonly ROUND_ROBIN: "ROUND_ROBIN";
};
export type BracketFormat = (typeof BracketFormat)[keyof typeof BracketFormat];

export const MatchStatus: {
  readonly PENDING: "PENDING";
  readonly READY: "READY";
  readonly IN_PROGRESS: "IN_PROGRESS";
  readonly COMPLETED: "COMPLETED";
  readonly CANCELLED: "CANCELLED";
};
export type MatchStatus = (typeof MatchStatus)[keyof typeof MatchStatus];

export const NotificationType: {
  readonly INFO: "INFO";
  readonly UPDATE: "UPDATE";
  readonly ALERT: "ALERT";
};
export type NotificationType = (typeof NotificationType)[keyof typeof NotificationType];
