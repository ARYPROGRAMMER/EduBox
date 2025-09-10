import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Bot, Zap, Shield, BarChart3, MessageSquare, Workflow } from "lucide-react"

export function FeaturesBento() {
  const features = [
    {
      icon: Bot,
      title: "Intelligent Automation",
      description: "Deploy AI agents that learn and adapt to your business processes automatically.",
      className: "md:col-span-2",
    },
    {
      icon: Zap,
      title: "Lightning Fast",
      description: "Process thousands of requests per second with sub-100ms response times.",
      className: "",
    },
    {
      icon: Shield,
      title: "Enterprise Security",
      description: "Bank-grade security with SOC 2 compliance and end-to-end encryption.",
      className: "",
    },
    {
      icon: BarChart3,
      title: "Advanced Analytics",
      description: "Real-time insights and performance metrics for all your AI agents.",
      className: "md:col-span-2",
    },
    {
      icon: MessageSquare,
      title: "Natural Conversations",
      description: "Human-like interactions powered by advanced language models.",
      className: "",
    },
    {
      icon: Workflow,
      title: "Workflow Integration",
      description: "Seamlessly integrate with your existing tools and workflows.",
      className: "",
    },
  ]

  return (
    <section id="features" className="py-24 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl text-balance">
            Everything you need to build powerful AI agents
          </h2>
          <p className="mt-4 text-lg text-muted-foreground text-pretty max-w-2xl mx-auto">
            From simple chatbots to complex automation workflows, our platform provides all the tools you need to create
            intelligent AI solutions.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {features.map((feature, index) => (
            <Card key={index} className={`${feature.className} border-border hover:shadow-lg transition-shadow`}>
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg bg-accent/10">
                    <feature.icon className="h-6 w-6 text-accent" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">{feature.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
