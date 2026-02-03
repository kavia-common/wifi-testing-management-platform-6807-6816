import React, { useId } from "react";
import "./TextInput.css";

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

// PUBLIC_INTERFACE
export default function TextInput({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  name,
  id,
  required = false,
  disabled = false,
  readOnly = false,
  autoComplete,
  inputMode,
  leftIcon,
  rightIcon,
  helperText,
  errorText,
  ariaLabel,
  className,
  ...rest
}) {
  /**
   * Shared text input with optional label, helper text, and error text.
   *
   * Accessibility:
   *  - Uses <label htmlFor> and aria-describedby for helper/error text.
   *  - Provide ariaLabel when label is omitted.
   *
   * Example usage:
   *  // <TextInput label="Project name" value={name} onChange={(e)=>setName(e.target.value)} />
   *  // <TextInput label="Search" placeholder="Find..." leftIcon={<SearchIcon />} />
   */
  const autoId = useId();
  const inputId = id || `uiTextInput-${autoId}`;
  const helperId = helperText ? `${inputId}-help` : undefined;
  const errorId = errorText ? `${inputId}-error` : undefined;

  const describedBy = [helperId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={cx("uiField", className)}>
      {label ? (
        <label className="uiField__label" htmlFor={inputId}>
          {label} {required ? <span aria-hidden="true">*</span> : null}
        </label>
      ) : null}

      <div
        className={cx(
          "uiTextInput",
          disabled && "uiTextInput--disabled",
          errorText && "uiTextInput--error"
        )}
      >
        {leftIcon ? <span className="uiTextInput__icon">{leftIcon}</span> : null}
        <input
          id={inputId}
          className="uiTextInput__control"
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          readOnly={readOnly}
          autoComplete={autoComplete}
          inputMode={inputMode}
          aria-label={ariaLabel}
          aria-invalid={errorText ? "true" : "false"}
          aria-describedby={describedBy}
          {...rest}
        />
        {rightIcon ? (
          <span className="uiTextInput__icon">{rightIcon}</span>
        ) : null}
      </div>

      {errorText ? (
        <div className="uiField__error" id={errorId} role="alert">
          {errorText}
        </div>
      ) : helperText ? (
        <div className="uiField__help" id={helperId}>
          {helperText}
        </div>
      ) : null}
    </div>
  );
}
