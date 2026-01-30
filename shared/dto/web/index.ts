import { z } from "zod";
export const WebPage = z.coerce.number().min(1);
export type { TagWebItem } from './tag';
