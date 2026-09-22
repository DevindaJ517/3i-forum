"use client";

import type { ComponentProps, ReactNode } from "react";
import type { FieldError } from "react-hook-form";

type BaseProps = {
  id: string;
  label: string;
  error?: FieldError;
  hint?: ReactNode;
  optional?: boolean;
};

function describedBy(id: string, error?: FieldError, hint?: ReactNode) {
  return [error && `${id}-error`, hint && `${id}-hint`].filter(Boolean).join(" ") || undefined;
}

function FieldShell({ id, label, error, hint, optional, children }: BaseProps & { children: ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="field-label">
        {label}
        {optional && <span className="ml-1.5 font-normal tracking-normal text-neutral-500 normal-case">(optional)</span>}
      </label>
      {children}
      {hint && !error && (
        <p id={`${id}-hint`} className="field-hint">
          {hint}
        </p>
      )}
      {error?.message && (
        <p id={`${id}-error`} role="alert" className="field-error">
          {error.message}
        </p>
      )}
    </div>
  );
}

export function TextField({
  id,
  label,
  error,
  hint,
  optional,
  ...input
}: BaseProps & Omit<ComponentProps<"input">, "id">) {
  return (
    <FieldShell id={id} label={label} error={error} hint={hint} optional={optional}>
      <input
        id={id}
        className="field-input"
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, error, hint)}
        aria-required={optional ? undefined : true}
        {...input}
      />
    </FieldShell>
  );
}

export function TextAreaField({
  id,
  label,
  error,
  hint,
  optional,
  ...textarea
}: BaseProps & Omit<ComponentProps<"textarea">, "id">) {
  return (
    <FieldShell id={id} label={label} error={error} hint={hint} optional={optional}>
      <textarea
        id={id}
        className="field-input min-h-40 resize-y"
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, error, hint)}
        aria-required={optional ? undefined : true}
        {...textarea}
      />
    </FieldShell>
  );
}

export function SelectField({
  id,
  label,
  error,
  hint,
  optional,
  options,
  placeholder = "Select…",
  ...select
}: BaseProps & Omit<ComponentProps<"select">, "id"> & { options: readonly string[]; placeholder?: string }) {
  return (
    <FieldShell id={id} label={label} error={error} hint={hint} optional={optional}>
      <select
        id={id}
        className="field-input appearance-none bg-[url('/chevron.svg')] bg-[length:14px] bg-[right_1rem_center] bg-no-repeat pr-10"
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, error, hint)}
        aria-required={optional ? undefined : true}
        {...select}
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </FieldShell>
  );
}
