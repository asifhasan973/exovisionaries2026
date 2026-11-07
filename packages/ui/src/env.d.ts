declare module '*.css' {}
declare module '*.json' {
  const value: any;
  export default value;
}
interface ImportMetaEnv {
  readonly VITE_LOADING_PROGRESS_MULTIPLIER?: string;
  readonly VITE_PROGRESS_MULTIPLIER?: string;
  readonly VITE_SLIDE_DISPLAY_MIN_MS?: string;
  readonly VITE_INTRO_SPLASH_DISPLAY_MS?: string;
  readonly [key: string]: string | undefined;
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}
