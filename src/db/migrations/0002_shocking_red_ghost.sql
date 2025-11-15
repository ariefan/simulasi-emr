CREATE TABLE "clinical_reasoning" (
	"id" serial PRIMARY KEY NOT NULL,
	"attempt_id" integer NOT NULL,
	"student_id" integer NOT NULL,
	"case_id" varchar(50) NOT NULL,
	"problem_representation" jsonb,
	"differential_diagnoses" jsonb,
	"decision_justification" text,
	"evidence_references" jsonb,
	"reasoning_score" numeric(5, 2),
	"score_breakdown" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "clinical_reasoning" ADD CONSTRAINT "clinical_reasoning_attempt_id_student_case_attempts_id_fk" FOREIGN KEY ("attempt_id") REFERENCES "public"."student_case_attempts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical_reasoning" ADD CONSTRAINT "clinical_reasoning_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical_reasoning" ADD CONSTRAINT "clinical_reasoning_case_id_cases_case_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."cases"("case_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_reasoning_attempt" ON "clinical_reasoning" USING btree ("attempt_id");--> statement-breakpoint
CREATE INDEX "idx_reasoning_student" ON "clinical_reasoning" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "idx_reasoning_case" ON "clinical_reasoning" USING btree ("case_id");