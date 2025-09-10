import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

export function FAQ() {
  const faqs = [
    {
      question: "How quickly can I deploy my first AI agent?",
      answer:
        "You can have your first AI agent up and running in under 10 minutes. Our intuitive interface and pre-built templates make it easy to get started without any coding experience.",
    },
    {
      question: "What integrations do you support?",
      answer:
        "We support over 100+ integrations including Slack, Microsoft Teams, Salesforce, HubSpot, Shopify, and many more. We also provide REST APIs and webhooks for custom integrations.",
    },
    {
      question: "Is my data secure?",
      answer:
        "Absolutely. We use bank-grade encryption, are SOC 2 compliant, and follow strict data privacy regulations. Your data is never used to train our models without explicit consent.",
    },
    {
      question: "Can I customize the AI agents behavior?",
      answer:
        "Yes, you have full control over your AI agents. You can customize their personality, knowledge base, response style, and decision-making logic to match your brand and requirements.",
    },
    {
      question: "What kind of support do you provide?",
      answer:
        "We offer 24/7 email support for all plans, priority support for Professional plans, and dedicated support managers for Enterprise customers. We also have extensive documentation and video tutorials.",
    },
    {
      question: "Can I cancel my subscription anytime?",
      answer:
        "Yes, you can cancel your subscription at any time. There are no long-term contracts or cancellation fees. Your agents will continue to work until the end of your billing period.",
    },
  ]

  return (
    <section id="faq" className="py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl text-balance">
            Frequently asked questions
          </h2>
          <p className="mt-4 text-lg text-muted-foreground text-pretty">Everything you need to know about AgentAI</p>
        </div>

        <div className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`} className="border border-border rounded-lg px-6">
                <AccordionTrigger className="text-left font-semibold">{faq.question}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">{faq.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  )
}
