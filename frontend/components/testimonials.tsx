import { Card, CardContent } from "@/components/ui/card"
import { Star } from "lucide-react"

export function Testimonials() {
  const testimonials = [
    {
      name: "Sarah Chen",
      role: "CTO at TechCorp",
      content: "AgentAI transformed our customer support. We reduced response times by 80% while maintaining quality.",
      rating: 5,
      avatar: "/professional-woman-avatar.png",
    },
    {
      name: "Marcus Rodriguez",
      role: "Head of Operations at ScaleUp",
      content:
        "The automation capabilities are incredible. Our team can now focus on strategic work instead of repetitive tasks.",
      rating: 5,
      avatar: "/professional-man-avatar.png",
    },
    {
      name: "Emily Watson",
      role: "Product Manager at InnovateCo",
      content: "Implementation was seamless and the results were immediate. ROI within the first month.",
      rating: 5,
      avatar: "/professional-woman-avatar-2.png",
    },
  ]

  return (
    <section id="testimonials" className="py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl text-balance">
            Loved by teams worldwide
          </h2>
          <p className="mt-4 text-lg text-muted-foreground text-pretty">
            See what our customers are saying about AgentAI
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="border-border">
              <CardContent className="p-6">
                <div className="flex mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-accent text-accent" />
                  ))}
                </div>

                <blockquote className="text-card-foreground mb-6">"{testimonial.content}"</blockquote>

                <div className="flex items-center space-x-3">
                  <img
                    src={testimonial.avatar || "/placeholder.svg"}
                    alt={testimonial.name}
                    className="h-10 w-10 rounded-full"
                  />
                  <div>
                    <div className="font-semibold text-card-foreground">{testimonial.name}</div>
                    <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
