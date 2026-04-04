import { z } from "zod";

// --- Provider ---

export const RawProviderSchema = z
  .object({
    name: z.string(),
    slug: z.string(),
    website: z.string().url(),
    description: z.string(),
    logo: z.string().optional(),
  })
  .strict();

export type RawProvider = z.infer<typeof RawProviderSchema>;

// --- Exam Domain (recursive) ---

export type RawExamDomain = {
  name: string;
  weight?: number;
  subdomains?: RawExamDomain[];
  categories?: string[];
};

export const RawExamDomainSchema: z.ZodType<RawExamDomain> = z.object({
  name: z.string(),
  weight: z.number().optional(),
  subdomains: z.lazy(() => z.array(RawExamDomainSchema)).optional(),
  categories: z.array(z.string()).optional(),
});

// --- Category Taxonomy ---

export const RawCategoryGroupSchema = z
  .object({
    slug: z.string(),
    label: z.string(),
  })
  .strict();

export const RawDomainCategorySchema = z
  .object({
    slug: z.string(),
    label: z.string(),
    group: z.string(),
  })
  .strict();

export const RawCategoryTaxonomySchema = z
  .object({
    groups: z.array(RawCategoryGroupSchema),
    categories: z.array(RawDomainCategorySchema),
  })
  .strict();

// --- Certification ---

const CertStatusSchema = z.enum(["active", "retiring", "retired"]);

const ExamFormatValueSchema = z.enum([
  "multiple-choice",
  "performance-based",
  "essay",
]);

const ExamFormatSchema = z.union([
  ExamFormatValueSchema,
  z.array(ExamFormatValueSchema),
]);

const LinkTypeSchema = z.enum([
  "official",
  "community",
  "practice",
  "course",
  "source-of-truth",
]);

export const RawCertSchema = z
  .object({
    name: z.string(),
    slug: z.string(),
    short_name: z.string().optional(),
    status: CertStatusSchema,
    cost: z.string().optional(),
    exam_format: ExamFormatSchema.optional(),
    passing_score: z.number().optional(),
    duration_minutes: z.number().optional(),
    question_count: z
      .object({
        min: z.number(),
        max: z.number().optional(),
        approximate: z.boolean().optional(),
      })
      .strict()
      .optional(),
    description: z.string(),
    tags: z.array(z.string()).optional(),
    prerequisites: z.array(z.string()).optional(),
    related_certs: z.array(z.string()).optional(),
    domains: z.array(RawExamDomainSchema).optional(),
    prerequisite_certs: z.array(z.string()).optional(),
    domain_source_url: z.string().url().optional(),
    versions: z
      .array(
        z
          .object({
            version: z.string(),
            release_date: z.string().optional(),
            retire_date: z.string().optional(),
            notes: z.string().optional(),
          })
          .strict(),
      )
      .optional(),
    links: z
      .array(
        z
          .object({
            label: z.string(),
            url: z.string().url(),
            type: LinkTypeSchema,
          })
          .strict(),
      )
      .optional(),
    source_of_truth_url: z.string().url().optional(),
    last_verified: z.string().optional(),
  })
  .strict();

export type RawCert = z.infer<typeof RawCertSchema>;

// --- Program ---

const ProgramPhaseSchema = z
  .object({
    name: z.string(),
    order: z.number(),
    certificate_slugs: z.array(z.string()),
  })
  .strict();

export const RawProgramSchema = z
  .object({
    slug: z.string(),
    name: z.string(),
    description: z.string(),
    website: z.string().url(),
    status: z.enum(["active", "retired"]),
    required_certs: z.array(z.string()).optional(),
    phases: z.array(ProgramPhaseSchema).optional(),
    ordering_strategies: z
      .array(
        z
          .object({
            slug: z.string(),
            name: z.string(),
            description: z.string().optional(),
            phases: z.array(ProgramPhaseSchema),
          })
          .strict(),
      )
      .optional(),
    completion_criteria: z
      .object({
        required: z.number(),
        notes: z.string().optional(),
      })
      .strict()
      .optional(),
  })
  .strict();

export type RawProgram = z.infer<typeof RawProgramSchema>;
