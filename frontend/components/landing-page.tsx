"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight,
  BookOpen,
  Calendar,
  Users,
  Brain,
  Sparkles,
  Star,
  CheckIcon,
  Download,
  Globe,
  MessageSquare,
  Shield,
  Zap,
} from "lucide-react";
import { motion } from "framer-motion";
import { GradientText } from "@/components/ui/gradient-text";
import { BackgroundGradient } from "@/components/ui/background-gradient";
import { Footer } from "@/components/footer";
import { Marquee } from "@/components/ui/marquee";
import { Header } from "@/components/header-simple";
import { BorderBeam } from "@/components/ui/border-beam";
import { DotPattern } from "@/components/ui/dot-pattern";
import { cn } from "@/lib/utils";
import { SignUpButton } from "@clerk/nextjs";

const features = [
  {
    icon: <BookOpen className="h-8 w-8" />,
    title: "Smart Locker",
    description:
      "AI-powered file organization and semantic search for all your notes and documents",
    color: "from-blue-500 to-purple-600",
    gradient: "from-blue-500/20 to-purple-600/20",
  },
  {
    icon: <Calendar className="h-8 w-8" />,
    title: "Intelligent Planner",
    description:
      "Never miss a deadline with AI-driven schedule optimization and smart reminders",
    color: "from-green-500 to-teal-600",
    gradient: "from-green-500/20 to-teal-600/20",
  },
  {
    icon: <Users className="h-8 w-8" />,
    title: "Campus Life Hub",
    description:
      "Stay connected with clubs, events, and campus dining - all in one place",
    color: "from-orange-500 to-red-600",
    gradient: "from-orange-500/20 to-red-600/20",
  },
  {
    icon: <Brain className="h-8 w-8" />,
    title: "AI Assistant",
    description:
      "Ask questions naturally and get instant answers about your academic life",
    color: "from-purple-500 to-pink-600",
    gradient: "from-purple-500/20 to-pink-600/20",
  },
];

const stats = [
  { label: "Active Students", value: "10,000+", icon: Users },
  { label: "Files Organized", value: "1M+", icon: BookOpen },
  { label: "Time Saved Daily", value: "2+ hrs", icon: Zap },
  { label: "Success Rate", value: "99.9%", icon: CheckIcon },
];

const testimonials = [
  {
    name: "Sarah Chen",
    major: "Computer Science",
    text: "EduBox transformed how I organize my studies!",
    avatar: "SC",
  },
  {
    name: "Mike Rodriguez",
    major: "Biology",
    text: "Never missed an assignment since using EduBox",
    avatar: "MR",
  },
  {
    name: "Emma Thompson",
    major: "Design",
    text: "The AI assistant is like having a personal study buddy",
    avatar: "ET",
  },
  {
    name: "Alex Kim",
    major: "Engineering",
    text: "Perfect for managing group projects and deadlines",
    avatar: "AK",
  },
];

export function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header variant="landing" />

      {/* Hero Section */}
      <section className="relative py-20 sm:py-32">
        <DotPattern
          width={20}
          height={20}
          cx={1}
          cy={1}
          cr={1}
          className="fill-neutral-400/20 [mask-image:linear-gradient(to_bottom_right,white,transparent,transparent)]"
        />

        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            className="text-center space-y-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <Badge
                variant="outline"
                className="mb-4 border-blue-200 bg-blue-50/80 text-blue-700 backdrop-blur-sm"
              >
                <Sparkles className="h-3 w-3 mr-1" />
                Introducing EduBox v1.0
              </Badge>
            </motion.div>

            <motion.h1
              className="text-5xl sm:text-6xl font-bold tracking-tight max-w-4xl mx-auto leading-tight"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
            >
              Your AI-Powered{" "}
              <GradientText className="text-5xl sm:text-6xl font-bold">
                Student Hub
              </GradientText>
            </motion.h1>

            <motion.p
              className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
            >
              Organize your notes, manage your schedule, and stay connected with
              campus life. EduBox is the only digital companion you need for
              academic success.
            </motion.p>

            <motion.div
              className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.8 }}
            >
              <SignUpButton mode="modal">
                <Button
                  size="lg"
                  className="text-lg px-8 py-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300 group"
                >
                  Get Started Free
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Button>
              </SignUpButton>
              <Button
                variant="outline"
                size="lg"
                className="text-lg px-8 py-6 border-2 hover:bg-muted/50 transition-all duration-300"
              >
                <Download className="mr-2 h-4 w-4" />
                Download App
              </Button>
            </motion.div>

            {/* Stats */}
            <motion.div
              className="pt-16 grid grid-cols-2 sm:grid-cols-4 gap-8 max-w-4xl mx-auto"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.8 }}
            >
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  className="text-center"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 + index * 0.1, duration: 0.5 }}
                >
                  <div className="flex justify-center mb-2">
                    <stat.icon className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="text-3xl font-bold text-foreground">
                    {stat.value}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {stat.label}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>

        {/* Floating Elements */}
        <div className="absolute top-20 left-10 opacity-20">
          <div className="w-72 h-72 bg-gradient-to-r from-blue-400 to-purple-600 rounded-full blur-3xl"></div>
        </div>
        <div className="absolute bottom-20 right-10 opacity-20">
          <div className="w-96 h-96 bg-gradient-to-r from-green-400 to-blue-600 rounded-full blur-3xl"></div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Everything You Need for{" "}
              <GradientText gradient="green-blue">
                Academic Success
              </GradientText>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Four powerful tools working together to make your student life
              organized, efficient, and stress-free.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="group relative h-full bg-background/50 backdrop-blur-sm border-2 hover:border-blue-200 transition-all duration-500 hover:shadow-2xl overflow-hidden">
                  <BorderBeam size={250} duration={12 + index} delay={index} />
                  <CardContent className="p-8">
                    <div
                      className={cn(
                        "w-16 h-16 rounded-2xl bg-gradient-to-r mb-6 flex items-center justify-center text-white transition-all duration-300 group-hover:scale-110",
                        feature.color
                      )}
                    >
                      {feature.icon}
                    </div>
                    <h3 className="text-2xl font-bold mb-4 text-foreground group-hover:text-blue-600 transition-colors">
                      {feature.title}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Loved by{" "}
              <GradientText gradient="purple-pink">
                Students Everywhere
              </GradientText>
            </h2>
            <p className="text-lg text-muted-foreground">
              Join thousands of students who&apos;ve transformed their academic
              experience
            </p>
          </div>

          <Marquee pauseOnHover className="[--duration:40s]">
            {testimonials.map((testimonial, index) => (
              <Card
                key={index}
                className="w-80 mx-4 hover:shadow-lg transition-shadow"
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="text-3xl">{testimonial.avatar}</div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className="h-4 w-4 fill-yellow-400 text-yellow-400"
                          />
                        ))}
                      </div>
                      <p className="text-sm text-muted-foreground italic">
                        &quot;{testimonial.text}&quot;
                      </p>
                      <div>
                        <p className="font-semibold">{testimonial.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {testimonial.major}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </Marquee>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto space-y-8">
            <h2 className="text-3xl sm:text-4xl font-bold text-white">
              Ready to Transform Your Student Life?
            </h2>
            <p className="text-xl text-blue-100">
              Join thousands of students who are already using EduBox to stay
              organized, connected, and ahead of their academic goals.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                variant="secondary"
                className="text-lg px-8 py-6"
              >
                Start Your Journey
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="text-lg px-8 py-6 border-white text-white hover:bg-white hover:text-blue-600"
              >
                Learn More
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}
