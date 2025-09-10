export function LogoCloud() {
  const logos = [
    { name: "Microsoft", width: 120 },
    { name: "Google", width: 100 },
    { name: "Amazon", width: 110 },
    { name: "Salesforce", width: 130 },
    { name: "Shopify", width: 100 },
    { name: "Stripe", width: 90 },
  ]

  return (
    <section className="py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Trusted by industry leaders
          </p>
        </div>

        <div className="flex flex-wrap justify-center items-center gap-8 opacity-60">
          {logos.map((logo) => (
            <div key={logo.name} className="flex items-center justify-center h-12" style={{ width: logo.width }}>
              <img
                src={`/ceholder-svg-height-48-width-.jpg?height=48&width=${logo.width}&query=${logo.name} logo`}
                alt={`${logo.name} logo`}
                className="h-8 w-auto grayscale"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
