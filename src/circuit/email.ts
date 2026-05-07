/**
 * Email address is encoded into 9 fields.
 * Each field has 36 utf8 characters.
 */

import {
  AsciiField,
  FixedSizeArray,
  asciiFieldToField,
  MAX_EMAIL_LENGTH,
  MAX_PADDED_EMAIL_LENGTH,
} from "rts-core";
import { parseEmailToCanonicalized } from "dkim-verifier";

// email address is encoded into 9 fields
export type EmailFields = [
  AsciiField,
  AsciiField,
  AsciiField,
  AsciiField,
  AsciiField,
  AsciiField,
  AsciiField,
  AsciiField,
  AsciiField,
];

export type EmailCircuitInputs = FixedSizeArray<324, number>;

// email fields
export type EmailHashInputs = [
  bigint,
  bigint,
  bigint,
  bigint,
  bigint,
  bigint,
  bigint,
  bigint,
  bigint,
];

const padEmail = (email: string): Buffer<ArrayBuffer> => {
  if (email.length > MAX_EMAIL_LENGTH) {
    throw new Error("Email is too long");
  }
  const lower = email.toLowerCase();
  const diff = MAX_PADDED_EMAIL_LENGTH - email.length;
  const padding = Buffer.alloc(diff);
  return Buffer.concat([Buffer.from(lower), padding]).subarray(
    0,
    MAX_PADDED_EMAIL_LENGTH,
  );
};

export const emailToCircuitInputs = (email: string): EmailCircuitInputs => {
  return padEmail(email) as unknown as EmailCircuitInputs;
};

export const emailToAsciiFields = (email: string): EmailFields => {
  const padded = padEmail(email);

  // convert to email fields
  const emailFields = [...Array(9)].map((_, i) => {
    const subarray = padded.subarray(i * 36, (i + 1) * 36);
    const field = Array.from(
      { length: 36 },
      (_, j) => subarray[j],
    ) as unknown as AsciiField;
    return field;
  }) as EmailFields;

  return emailFields;
};

export const emailToHashInputs = (email: string): EmailHashInputs => {
  const fields = emailToAsciiFields(email).map(
    asciiFieldToField,
  ) as EmailHashInputs;
  return fields;
};

export const indexOfSubject = (emailHeaders: string): number => {
  const subjectIndex = extractIndexOf("subject:", emailHeaders);
  return subjectIndex;
};

export const indexAndLengthOfAddress = (
  emailHeaders: string,
): [number, number] => {
  const addressIndex = extractIndexOf("to:", emailHeaders);
  const toLine = emailHeaders
    .split("\n")
    .find((line) => line.startsWith("to:"));
  if (!toLine) {
    throw new Error("Address not found");
  }
  const toAddress = toLine.replace("to:", "").trim();
  const addressLength = toAddress.length;
  return [addressIndex, addressLength];
};

const extractIndexOf = (item: string, headers: string) => {
  let diff = item.length;
  const index = headers.toLocaleLowerCase().indexOf(item);
  if (index === -1) {
    throw new Error(`${item} not found`);
  }
  if (headers[index + diff] === " ") {
    diff++;
  }
  return index + diff;
};

export const ownershipAndAuthCircuitInputs = (emailRaw: string) => {
  const { canonicalizedHeaders } = parseEmailToCanonicalized(emailRaw);
  const subjectIndex = indexOfSubject(canonicalizedHeaders);
  const [toAddressIndex, toAddressLength] =
    indexAndLengthOfAddress(canonicalizedHeaders);
  const ownershipAndAuthInputs = {
    subjectIndex,
    toAddressIndex,
    toAddressLength,
  };
  return ownershipAndAuthInputs;
};
