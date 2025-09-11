import { Heart } from "lucide-react";

export function DashboardFooter() {
  return (
    <footer className="bg-card/30 border-t border-border py-4 px-6">
      <div className="flex flex-col md:flex-row justify-between items-center text-sm text-muted-foreground">
        <div className="flex items-center gap-1">
          <span>© 2025 EduBox. Made with</span>
          <Heart className="h-3 w-3 text-red-500 fill-current" />
          <span>for students</span>
        </div><div className="flex items-center gap-1">
          <span>Under Development</span>
         
        
        </div>
        <div className="flex items-center gap-4 mt-2 md:mt-0">
          <a href="#" className="hover:text-foreground transition-colors">
            Help
          </a>
          <a href="#" className="hover:text-foreground transition-colors">
            Privacy
          </a>
          <a href="#" className="hover:text-foreground transition-colors">
            Terms
          </a>
        </div>
      </div>
    </footer>
  );
}
