const variants = {
  primary:
    "bg-ember text-white shadow-soft hover:-translate-y-0.5 hover:shadow-[0_12px_24px_rgba(217,115,66,0.35)]",
  secondary:
    "border border-border bg-white text-ink hover:border-ember/60 hover:text-ember",
  ghost: "text-ink underline hover:text-ember",
};

export default function Button({
  type = "button",
  variant = "primary",
  disabled = false,
  className = "",
  children,
  ...rest
}) {
  const variantClasses = variants[variant] || variants.primary;
  const classes = [
    "inline-flex items-center justify-center rounded-2xl px-5 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-70",
    variantClasses,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button type={type} disabled={disabled} className={classes} {...rest}>
      {children}
    </button>
  );
}
