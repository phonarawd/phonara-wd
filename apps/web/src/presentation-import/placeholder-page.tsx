type PresentationImportPlaceholderProps = {
  path: string;
};

export function PresentationImportPlaceholder({ path }: PresentationImportPlaceholderProps) {
  return (
    <section className="flex min-h-dvh items-center justify-center p-6 text-center">
      <p className="text-sm text-muted">Presentation import zone: replace {path}</p>
    </section>
  );
}
