"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRef, useState, useTransition } from "react";
import { useForm, useWatch, type Path } from "react-hook-form";
import {
  APPLICATION_STEPS,
  applicationSchema,
  type ApplicationData,
  type ApplicationInput,
} from "@/lib/validation/application";
import {
  DISTRICTS,
  EMPLOYEE_RANGES,
  INDUSTRIES,
  INTERESTS,
  REFERRAL_SOURCES,
  REVENUE_RANGES,
} from "@/lib/validation/options";
import { submitApplication } from "./actions";
import { SelectField, TextAreaField, TextField } from "./fields";

const MOTIVATION_MAX = 1500;

const DEFAULTS: ApplicationInput = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  district: "" as ApplicationInput["district"],
  city: "",
  linkedinUrl: "",
  companyName: "",
  designation: "",
  industry: "" as ApplicationInput["industry"],
  companyWebsite: "",
  yearFounded: undefined as unknown as number,
  employeeRange: "" as ApplicationInput["employeeRange"],
  revenueRange: "" as ApplicationInput["revenueRange"],
  interests: [],
  referralSource: "" as ApplicationInput["referralSource"],
  motivation: "",
  consentPdpa: false,
  consentMarketing: false,
};

export function ApplicationForm({ formToken }: { formToken: string }) {
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [serverMessage, setServerMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const honeypot = useRef<HTMLInputElement>(null);
  const topRef = useRef<HTMLDivElement>(null);

  const {
    register,
    handleSubmit,
    trigger,
    setError,
    setFocus,
    control,
    formState: { errors },
  } = useForm<ApplicationInput, unknown, ApplicationData>({
    resolver: zodResolver(applicationSchema),
    defaultValues: DEFAULTS,
    mode: "onTouched",
  });

  const isLastStep = step === APPLICATION_STEPS.length - 1;
  const motivationLength = useWatch({ control, name: "motivation" })?.length ?? 0;

  const scrollToTop = () => topRef.current?.scrollIntoView({ block: "start" });

  async function goNext() {
    const valid = await trigger(APPLICATION_STEPS[step].fields, { shouldFocus: true });
    if (!valid) return;
    setStep((s) => s + 1);
    scrollToTop();
  }

  function goBack() {
    setStep((s) => Math.max(0, s - 1));
    scrollToTop();
  }

  const onSubmit = (data: ApplicationData) => {
    setServerMessage(null);
    startTransition(async () => {
      try {
        const result = await submitApplication(data, {
          formToken,
          companyFax: honeypot.current?.value ?? "",
        });

        if (result.ok) {
          setSubmitted(true);
          scrollToTop();
          return;
        }

        setServerMessage(result.message);
        if (result.fieldErrors) {
          const failed = Object.entries(result.fieldErrors).filter(([, messages]) => messages?.length);
          for (const [field, messages] of failed) {
            setError(field as Path<ApplicationInput>, { type: "server", message: messages[0] });
          }
          // Jump back to the first step that has a problem.
          const firstStep = APPLICATION_STEPS.findIndex((s) =>
            failed.some(([field]) => (s.fields as string[]).includes(field)),
          );
          if (firstStep >= 0) {
            setStep(firstStep);
            const firstField = APPLICATION_STEPS[firstStep].fields.find((f) => failed.some(([name]) => name === f));
            if (firstField) setTimeout(() => setFocus(firstField), 0);
          }
        }
      } catch {
        setServerMessage("Something went wrong. Please check your connection and try again.");
      }
    });
  };

  // Enter in a single-line input on an intermediate step should move forward,
  // not submit a half-filled application.
  const onFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    if (isLastStep) return handleSubmit(onSubmit)(e);
    e.preventDefault();
    void goNext();
  };

  if (submitted) {
    return (
      <div ref={topRef} className="scroll-mt-28 border border-line bg-ink-soft p-8 sm:p-12" role="status">
        <p className="display text-2xl text-brand">Application received</p>
        <h2 className="display mt-2 text-6xl text-white">Thank you!</h2>
        <p className="mt-6 max-w-lg text-neutral-300">
          We&apos;ve received your application to join 3i Forum. Our team reviews every application personally and
          will be in touch by email. If you applied before with the same email, we already have your details.
        </p>
        <Link href="/" className="btn-brand mt-10">
          Back to home
        </Link>
      </div>
    );
  }

  return (
    <div ref={topRef} className="scroll-mt-28">
      <Stepper current={step} />

      <form onSubmit={onFormSubmit} noValidate className="mt-8 border border-line bg-ink-soft/40 p-6 sm:p-10">
        {/* Honeypot: invisible to people and screen readers, tempting to bots. */}
        <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
          <label htmlFor="companyFax">Company fax</label>
          <input ref={honeypot} id="companyFax" name="companyFax" type="text" tabIndex={-1} autoComplete="off" />
        </div>

        <h2 className="display mb-8 text-5xl text-white">{APPLICATION_STEPS[step].title}</h2>

        {step === 0 && (
          <fieldset className="grid gap-6 sm:grid-cols-2">
            <legend className="sr-only">About you</legend>
            <TextField
              id="firstName"
              label="First name"
              autoComplete="given-name"
              maxLength={60}
              error={errors.firstName}
              {...register("firstName")}
            />
            <TextField
              id="lastName"
              label="Last name"
              autoComplete="family-name"
              maxLength={60}
              error={errors.lastName}
              {...register("lastName")}
            />
            <TextField
              id="email"
              label="Email"
              type="email"
              inputMode="email"
              autoComplete="email"
              maxLength={254}
              error={errors.email}
              {...register("email")}
            />
            <TextField
              id="phone"
              label="Mobile number"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="077 123 4567"
              maxLength={20}
              error={errors.phone}
              {...register("phone")}
            />
            <SelectField
              id="district"
              label="District"
              options={DISTRICTS}
              error={errors.district}
              {...register("district")}
            />
            <TextField
              id="city"
              label="City / town"
              autoComplete="address-level2"
              maxLength={60}
              error={errors.city}
              {...register("city")}
            />
            <div className="sm:col-span-2">
              <TextField
                id="linkedinUrl"
                label="LinkedIn profile"
                type="url"
                inputMode="url"
                placeholder="linkedin.com/in/your-name"
                optional
                maxLength={200}
                error={errors.linkedinUrl}
                {...register("linkedinUrl")}
              />
            </div>
          </fieldset>
        )}

        {step === 1 && (
          <fieldset className="grid gap-6 sm:grid-cols-2">
            <legend className="sr-only">Your business</legend>
            <TextField
              id="companyName"
              label="Company name"
              autoComplete="organization"
              maxLength={120}
              error={errors.companyName}
              {...register("companyName")}
            />
            <TextField
              id="designation"
              label="Your role"
              autoComplete="organization-title"
              placeholder="Founder & CEO"
              maxLength={80}
              error={errors.designation}
              {...register("designation")}
            />
            <SelectField
              id="industry"
              label="Industry"
              options={INDUSTRIES}
              error={errors.industry}
              {...register("industry")}
            />
            <TextField
              id="yearFounded"
              label="Year founded"
              type="number"
              inputMode="numeric"
              min={1900}
              max={new Date().getFullYear()}
              placeholder="2018"
              error={errors.yearFounded}
              {...register("yearFounded", { valueAsNumber: true })}
            />
            <SelectField
              id="employeeRange"
              label="Team size"
              options={EMPLOYEE_RANGES}
              error={errors.employeeRange}
              {...register("employeeRange")}
            />
            <SelectField
              id="revenueRange"
              label="Annual revenue"
              options={REVENUE_RANGES}
              hint="Kept strictly confidential. Used only to match you with the right forum."
              error={errors.revenueRange}
              {...register("revenueRange")}
            />
            <div className="sm:col-span-2">
              <TextField
                id="companyWebsite"
                label="Company website"
                type="url"
                inputMode="url"
                placeholder="yourcompany.lk"
                optional
                maxLength={200}
                error={errors.companyWebsite}
                {...register("companyWebsite")}
              />
            </div>
          </fieldset>
        )}

        {step === 2 && (
          <div className="grid gap-8">
            <fieldset aria-describedby={errors.interests ? "interests-error" : undefined}>
              <legend className="field-label">What are you looking for?</legend>
              <div className="mt-2 grid gap-3 sm:grid-cols-2">
                {INTERESTS.map((interest) => (
                  <label
                    key={interest}
                    className="flex cursor-pointer items-center gap-3 border border-line bg-ink-soft px-4 py-3 transition-colors hover:border-neutral-500 has-checked:border-brand has-checked:text-white"
                  >
                    <input
                      type="checkbox"
                      value={interest}
                      className="size-4 accent-brand"
                      {...register("interests")}
                    />
                    {interest}
                  </label>
                ))}
              </div>
              {errors.interests?.message && (
                <p id="interests-error" role="alert" className="field-error">
                  {errors.interests.message}
                </p>
              )}
            </fieldset>

            <SelectField
              id="referralSource"
              label="How did you hear about us?"
              options={REFERRAL_SOURCES}
              error={errors.referralSource}
              {...register("referralSource")}
            />

            <TextAreaField
              id="motivation"
              label="Why do you want to join 3i Forum?"
              placeholder="Tell us about your journey, what you're building, and what you hope to get from (and give to) the community."
              maxLength={MOTIVATION_MAX}
              hint={`${motivationLength} / ${MOTIVATION_MAX} characters (minimum 50)`}
              error={errors.motivation}
              {...register("motivation")}
            />

            <fieldset className="grid gap-4 border-t border-line pt-8">
              <legend className="sr-only">Consent</legend>
              <Checkbox id="consentPdpa" error={errors.consentPdpa?.message} {...register("consentPdpa")}>
                I agree that 3i Forum may collect and process the personal data in this form to review my
                membership application, in line with Sri Lanka&apos;s Personal Data Protection Act and the{" "}
                <Link href="/privacy" target="_blank" className="text-brand underline underline-offset-2">
                  privacy notice
                </Link>
                .
              </Checkbox>
              <Checkbox id="consentMarketing" {...register("consentMarketing")}>
                Keep me updated about 3i Forum events and new episodes of The 3i Show. (Optional)
              </Checkbox>
            </fieldset>
          </div>
        )}

        {serverMessage && (
          <p role="alert" className="mt-8 border border-danger/60 bg-danger/10 px-4 py-3 text-danger">
            {serverMessage}
          </p>
        )}

        <div className="mt-10 flex flex-col-reverse gap-3 border-t border-line pt-8 sm:flex-row sm:justify-between">
          {step > 0 ? (
            <button type="button" onClick={goBack} className="btn-ghost" disabled={isPending}>
              ← Back
            </button>
          ) : (
            <span />
          )}
          {isLastStep ? (
            <button type="submit" className="btn-brand" disabled={isPending} aria-busy={isPending}>
              {isPending ? "Submitting…" : "Submit application"}
            </button>
          ) : (
            <button type="submit" className="btn-brand">
              Continue →
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

function Stepper({ current }: { current: number }) {
  return (
    <ol className="grid grid-cols-3 gap-2" aria-label="Application progress">
      {APPLICATION_STEPS.map((s, i) => {
        const state = i < current ? "done" : i === current ? "current" : "todo";
        return (
          <li key={s.title} aria-current={state === "current" ? "step" : undefined}>
            <div className={`h-1 ${state === "todo" ? "bg-line" : "bg-brand"}`} />
            <p className={`display mt-2 text-xl ${state === "todo" ? "text-neutral-500" : "text-white"}`}>
              <span className="text-brand">{String(i + 1).padStart(2, "0")}</span> {s.title}
              <span className="sr-only">{state === "done" ? " (completed)" : state === "current" ? " (current)" : ""}</span>
            </p>
          </li>
        );
      })}
    </ol>
  );
}

function Checkbox({
  id,
  error,
  children,
  ...input
}: React.ComponentProps<"input"> & { id: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="flex cursor-pointer items-start gap-3 text-sm text-neutral-300">
        <input
          id={id}
          type="checkbox"
          className="mt-1 size-4 shrink-0 accent-brand"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          {...input}
        />
        <span>{children}</span>
      </label>
      {error && (
        <p id={`${id}-error`} role="alert" className="field-error ml-7">
          {error}
        </p>
      )}
    </div>
  );
}
