import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import logo from "@/assets/logo.png";

interface HeaderProps {
  showLogo?: boolean;
  title?: string;
  icon?: React.ReactNode;
  backTo?: string;
  children?: React.ReactNode;
}

export function Header({ showLogo = true, title, icon, backTo, children }: HeaderProps) {
  const navigate = useNavigate();
  const { user, userType } = useAuth();

  return (
    <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {backTo && (
            <Button variant="ghost" size="sm" onClick={() => navigate(backTo)}>
              ← Back
            </Button>
          )}
          {showLogo && !title && (
            <img 
              src={logo} 
              alt="Axcelera" 
              className="h-8 cursor-pointer" 
              onClick={() => navigate("/")}
            />
          )}
          {icon && icon}
          {title && <span className="text-xl font-semibold">{title}</span>}
        </div>
        <div className="flex items-center gap-2">
          {user && <NotificationBell />}
          {children}
          {!children && !user && (
            <Button variant="outline" onClick={() => navigate("/auth")}>
              Sign In
            </Button>
          )}
          {!children && user && (
            <Button 
              variant="outline" 
              onClick={() => navigate(userType === "worker" ? "/worker/dashboard" : "/business/dashboard")}
            >
              Dashboard
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
