import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Briefcase, Shield, CheckCircle, Search, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import heroBg from "@/assets/hero-bg.jpg";

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Briefcase className="h-6 w-6 text-primary" />
            <span className="text-xl font-semibold">Part-Time Finance People</span>
          </div>
          <Button variant="outline" onClick={() => navigate("/auth")}>
            Sign In
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-10"
          style={{ backgroundImage: `url(${heroBg})` }}
        />
        <div className="container relative mx-auto px-4 py-20 md:py-32">
          <div className="max-w-3xl mx-auto text-center">
            <Badge className="mb-4" variant="secondary">
              Finance Talent Marketplace
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 text-foreground">
              Build Your Flexible Finance Team
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Connect with verified part-time finance professionals. From bookkeeping to financial control,
              find the expertise you need, when you need it.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                variant="hero" 
                size="xl"
                onClick={() => navigate("/auth?type=worker")}
              >
                <Users className="mr-2 h-5 w-5" />
                I'm a Worker
              </Button>
              <Button 
                variant="hero" 
                size="xl"
                onClick={() => navigate("/auth?type=business")}
              >
                <Briefcase className="mr-2 h-5 w-5" />
                I'm a Business
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works - Workers */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Badge className="mb-4" variant="outline">For Workers</Badge>
            <h2 className="text-3xl font-bold mb-4">Your Skills, Your Schedule</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Create your profile, showcase your expertise, and connect with businesses looking for your skills.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <Card className="shadow-soft">
              <CardHeader>
                <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Create Profile</CardTitle>
                <CardDescription>
                  Showcase your skills, experience, and availability. Choose to remain anonymous or fully disclosed.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card className="shadow-soft">
              <CardHeader>
                <div className="h-12 w-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4">
                  <Shield className="h-6 w-6 text-accent" />
                </div>
                <CardTitle>Get Verified</CardTitle>
                <CardDescription>
                  Complete skills tests, provide references, and complete a brief interview to stand out.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card className="shadow-soft">
              <CardHeader>
                <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <CheckCircle className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Connect</CardTitle>
                <CardDescription>
                  Review connection requests from businesses and accept opportunities that fit your schedule.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works - Businesses */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Badge className="mb-4" variant="outline">For Businesses</Badge>
            <h2 className="text-3xl font-bold mb-4">Find Finance Talent Fast</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Search verified professionals, review their skills, and send connection requests directly.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <Card className="shadow-soft">
              <CardHeader>
                <div className="h-12 w-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4">
                  <Search className="h-6 w-6 text-accent" />
                </div>
                <CardTitle>Search</CardTitle>
                <CardDescription>
                  Filter by role, location, skills, and availability. View anonymized or fully disclosed profiles.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card className="shadow-soft">
              <CardHeader>
                <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Review & Shortlist</CardTitle>
                <CardDescription>
                  See verification badges, skills assessments, and experience. Save favorites to your shortlist.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card className="shadow-soft">
              <CardHeader>
                <div className="h-12 w-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4">
                  <CheckCircle className="h-6 w-6 text-accent" />
                </div>
                <CardTitle>Connect</CardTitle>
                <CardDescription>
                  Send connection requests with your requirements. Start working together when they accept.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Verification Section */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <Shield className="h-16 w-16 text-primary mx-auto mb-6" />
            <h2 className="text-3xl font-bold mb-4">Trust Through Verification</h2>
            <p className="text-muted-foreground mb-8">
              All workers can complete our three-step verification process to demonstrate their expertise:
            </p>
            <div className="grid md:grid-cols-3 gap-6 text-left">
              <div>
                <h3 className="font-semibold mb-2">Skills Testing</h3>
                <p className="text-sm text-muted-foreground">
                  Practical assessments covering core finance tasks and systems.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">References</h3>
                <p className="text-sm text-muted-foreground">
                  Verified references from previous employers and clients.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Interview</h3>
                <p className="text-sm text-muted-foreground">
                  Brief video interview to validate experience and communication.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-hero">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-hero-foreground mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-hero-foreground/90 mb-8 max-w-2xl mx-auto">
            Join our growing community of finance professionals and businesses.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              variant="secondary" 
              size="lg"
              onClick={() => navigate("/search")}
            >
              Browse Talent
            </Button>
            <Button 
              variant="outline" 
              size="lg"
              className="bg-background/10 border-hero-foreground/20 text-hero-foreground hover:bg-background/20"
              onClick={() => navigate("/auth")}
            >
              Create Account
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 bg-background">
        <div className="container mx-auto px-4 text-center text-muted-foreground text-sm">
          <p>&copy; 2025 Part-Time Finance People. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
