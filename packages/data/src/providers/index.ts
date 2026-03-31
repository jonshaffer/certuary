import type { Provider } from "../types.js";
import { comptia } from "./comptia.js";
import { aws } from "./aws.js";
import { cisco } from "./cisco.js";

export const providers: Provider[] = [comptia, aws, cisco];

export { comptia, aws, cisco };
