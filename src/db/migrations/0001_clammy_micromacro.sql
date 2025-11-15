CREATE TABLE "cases" (
	"id" serial PRIMARY KEY NOT NULL,
	"case_id" varchar(50) NOT NULL,
	"department" varchar(50) NOT NULL,
	"skdi_diagnosis" text NOT NULL,
	"icd10" varchar(20),
	"skdi_level" varchar(10),
	"difficulty" varchar(20),
	"case_data" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "cases_case_id_unique" UNIQUE("case_id")
);
--> statement-breakpoint
CREATE TABLE "quiz_submissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"attempt_id" integer NOT NULL,
	"student_id" integer NOT NULL,
	"case_id" varchar(50) NOT NULL,
	"answers" jsonb NOT NULL,
	"score" numeric(5, 2),
	"max_score" integer,
	"submitted_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "student_case_attempts" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_id" integer NOT NULL,
	"case_id" varchar(50) NOT NULL,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp,
	"time_spent_seconds" integer,
	"status" varchar(20) DEFAULT 'in_progress' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "student_reflections" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_id" integer NOT NULL,
	"case_id" varchar(50) NOT NULL,
	"attempt_id" integer,
	"what" text,
	"so_what" text,
	"now_what" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "quiz_submissions" ADD CONSTRAINT "quiz_submissions_attempt_id_student_case_attempts_id_fk" FOREIGN KEY ("attempt_id") REFERENCES "public"."student_case_attempts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quiz_submissions" ADD CONSTRAINT "quiz_submissions_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quiz_submissions" ADD CONSTRAINT "quiz_submissions_case_id_cases_case_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."cases"("case_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_case_attempts" ADD CONSTRAINT "student_case_attempts_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_case_attempts" ADD CONSTRAINT "student_case_attempts_case_id_cases_case_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."cases"("case_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_reflections" ADD CONSTRAINT "student_reflections_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_reflections" ADD CONSTRAINT "student_reflections_case_id_cases_case_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."cases"("case_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_reflections" ADD CONSTRAINT "student_reflections_attempt_id_student_case_attempts_id_fk" FOREIGN KEY ("attempt_id") REFERENCES "public"."student_case_attempts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_cases_department" ON "cases" USING btree ("department");--> statement-breakpoint
CREATE INDEX "idx_cases_difficulty" ON "cases" USING btree ("difficulty");--> statement-breakpoint
CREATE INDEX "idx_quiz_student" ON "quiz_submissions" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "idx_quiz_case" ON "quiz_submissions" USING btree ("case_id");--> statement-breakpoint
CREATE INDEX "idx_attempts_student" ON "student_case_attempts" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "idx_attempts_case" ON "student_case_attempts" USING btree ("case_id");--> statement-breakpoint
CREATE INDEX "idx_attempts_status" ON "student_case_attempts" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_reflections_student" ON "student_reflections" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "idx_reflections_case" ON "student_reflections" USING btree ("case_id");