// Type declarations for CSS imports
declare module "*.css" {
  const content: { [className: string]: string };
  export default content;
}

// For side-effect CSS imports (like global styles)
declare module "*.css" {
  const css: string;
  export = css;
}