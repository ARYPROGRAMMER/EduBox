import { Button } from "@/components/ui/button"
import { ArrowRight, Play, Sparkles } from "lucide-react"
import { SparklesCore } from "@/components/ui/sparkles"
import { TextGenerateEffect } from "@/components/ui/text-generate-effect"
import { HoverBorderGradient } from "@/components/ui/hover-border-gradient"

export function Hero() {
  const words = "Build Intelligent AI Agents That Transform Your Business"

  return (
    <section className="relative overflow-hidden bg-background py-24 sm:py-32">
      <div className="container mx-auto px-4 relative z-10">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-8">
            <HoverBorderGradient
              containerClassName="rounded-full"
              as="span"
              className="bg-background text-foreground flex items-center space-x-2"
            >
              <Sparkles className="h-4 w-4" />
              <span>Introducing AgentAI v2.0</span>
            </HoverBorderGradient>
          </div>

          <TextGenerateEffect
            words={words}
            className="mb-6 text-4xl font-bold tracking-tight sm:text-6xl text-balance"
            style={{ color: "var(--foreground)" }}
          />

          <p className="mb-8 text-xl text-pretty max-w-2xl mx-auto" style={{ color: "var(--muted-foreground)" }}>
            Create, deploy, and scale AI agents that automate complex workflows, enhance customer experiences, and drive
            unprecedented growth.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button
              size="lg"
              className="text-base px-8 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0"
            >
              Start Building Free
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="text-base px-8 bg-transparent border-border"
              style={{ color: "var(--foreground)" }}
            >
              <Play className="mr-2 h-4 w-4" />
              Watch Demo
            </Button>
          </div>

          <div className="mt-12 text-sm" style={{ color: "var(--muted-foreground)" }}>
            Trusted by 10,000+ companies worldwide
          </div>
        </div>
      </div>

      <div className="w-full absolute inset-0 h-screen">
        <SparklesCore
          id="tsparticlesfullpage"
          background="transparent"
          minSize={0.6}
          maxSize={1.4}
          particleDensity={100}
          className="w-full h-full"
          particleColor="#3b82f6"
        />
      </div>

      {/* Enhanced background decoration */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute left-1/2 top-0 -translate-x-1/2 blur-3xl">
          <div className="aspect-[1155/678] w-[72.1875rem] bg-gradient-to-tr from-blue-500/20 via-purple-500/20 to-cyan-500/20 opacity-30"></div>
        </div>
      </div>
    </section>
  )
}
