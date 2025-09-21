import HeroVideoDialog from "@/components/magicui/hero-video-dialog";

export function HeroVideoDialogDemo() {
  return (
    <section className="py-20 bg-gradient-to-b from-background to-muted/10">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            See EduBox in{" "}
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Action
            </span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Watch how EduBox transforms the student experience with AI-powered
            organization and smart features
          </p>
        </div>

        <div className="relative max-w-4xl mx-auto">
          <HeroVideoDialog
            className="block dark:hidden"
            animationStyle="from-center"
            videoSrc="https://www.youtube.com/embed/td5qevnAoec?si=EHguDAe2pqFXV-FZ"
            thumbnailSrc="https://img.youtube.com/vi/td5qevnAoec/sddefault.jpg"
            thumbnailAlt="EduBox Demo Video"
          />
          <HeroVideoDialog
            className="hidden dark:block"
            animationStyle="from-center"
            videoSrc="https://www.youtube.com/embed/td5qevnAoec?si=EHguDAe2pqFXV-FZ"
            thumbnailSrc="https://img.youtube.com/vi/td5qevnAoec/sddefault.jpg"
            thumbnailAlt="EduBox Demo Video"
          />

          {/* Decorative elements */}
          <div className="absolute -top-10 -left-10 w-20 h-20 bg-blue-500/20 rounded-full blur-xl"></div>
          <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-purple-500/20 rounded-full blur-xl"></div>
        </div>
      </div>
    </section>
  );
}
