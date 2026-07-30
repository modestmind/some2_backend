import { createHash } from "crypto";
import type { ISha256Util } from "../contracts/sha256-util.contract.js";

export const sha256Util: ISha256Util = {
  // SHA-256 해시값을 hex 문자열로 반환
  hash: (value) => createHash("sha256").update(value).digest("hex"),
};
