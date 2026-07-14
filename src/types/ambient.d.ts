declare module '@imgly/background-removal' {
  export function removeBackground(
    image: string | Blob | ArrayBuffer,
    config?: Record<string, any>,
  ): Promise<Blob>;
}
