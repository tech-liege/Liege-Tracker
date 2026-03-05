export default function Page({ className = "", children }) {
  const classes = ["mx-auto w-full max-w-7xl", className]
    .filter(Boolean)
    .join(" ");

  return <div className={classes}>{children}</div>;
}
