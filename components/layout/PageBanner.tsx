interface PageBannerProps {
  title: string;
  description?: string;
}

export default function PageBanner({ title, description }: PageBannerProps) {
  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div
          className="relative overflow-hidden text-white py-12 px-8 rounded-2xl shadow-lg"
          style={{
            background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 50%, #0369a1 100%)',
          }}
        >
          {/* Angled overlay for extra depth */}
          <div
            className="absolute inset-0 opacity-30"
            style={{
              background: 'linear-gradient(120deg, transparent 0%, rgba(255,255,255,0.1) 50%, transparent 100%)',
            }}
          />
          <div className="relative z-10">
            <h1 className="text-3xl md:text-4xl font-bold mb-3 text-center">{title}</h1>
            {description && (
              <p className="text-lg text-sky-100 text-center max-w-2xl mx-auto">
                {description}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
