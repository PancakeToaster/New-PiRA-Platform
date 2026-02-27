interface PageBannerProps {
  title: string;
  description?: string;
}

export default function PageBanner({ title, description }: PageBannerProps) {
  return (
    <section className="bg-muted/30 py-16 mb-12">
      <div className="container mx-auto px-4 text-center">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">{title}</h1>
        {description && (
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {description}
          </p>
        )}
      </div>
    </section>
  );
}
