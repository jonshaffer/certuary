import type { Certification } from "../types.js";
import { comptiaAPlus } from "./comptia-a-plus.js";
import { comptiaSecurityPlus } from "./comptia-security-plus.js";
import { awsSolutionsArchitectAssociate } from "./aws-saa.js";
import { ccna } from "./ccna.js";

export const certifications: Certification[] = [
  comptiaAPlus,
  comptiaSecurityPlus,
  awsSolutionsArchitectAssociate,
  ccna,
];

export { comptiaAPlus, comptiaSecurityPlus, awsSolutionsArchitectAssociate, ccna };
