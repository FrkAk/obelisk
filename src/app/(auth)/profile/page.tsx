"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, LogOut, User } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { trpc } from "@/lib/trpc/client";
import { useToast } from "@/hooks/use-toast";

export default function ProfilePage() {
  const router = useRouter();
  const { toast } = useToast();
  const utils = trpc.useUtils();

  const { data: profile, isLoading } = trpc.user.getProfile.useQuery();

  const signOut = trpc.auth.signOut.useMutation({
    onSuccess: () => {
      utils.auth.me.invalidate();
      utils.user.getProfile.invalidate();
      toast({
        title: "Signed out",
        description: "You have been signed out successfully.",
      });
      router.push("/");
      router.refresh();
    },
  });

  const updatePreferences = trpc.user.updatePreferences.useMutation({
    onSuccess: () => {
      utils.user.getProfile.invalidate();
      utils.user.getPreferences.invalidate();
      toast({
        title: "Preferences saved",
        description: "Your preferences have been updated.",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!profile) {
    router.push("/sign-in");
    return null;
  }

  return (
    <div className="min-h-dvh p-4">
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/">
              <ArrowLeft className="h-5 w-5" />
              <span className="sr-only">Back to map</span>
            </Link>
          </Button>
          <h1 className="text-2xl font-semibold">Profile</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Account
            </CardTitle>
            <CardDescription>Your account information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={profile.email} disabled />
            </div>
            <div className="space-y-2">
              <Label>Username</Label>
              <Input value={profile.username} disabled />
            </div>
            <div className="space-y-2">
              <Label>Member since</Label>
              <Input
                value={new Date(profile.createdAt).toLocaleDateString()}
                disabled
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Preferences</CardTitle>
            <CardDescription>Customize your experience</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <Label>Theme</Label>
                <p className="text-sm text-muted-foreground">
                  Choose your preferred color scheme
                </p>
              </div>
              <Select
                value={profile.preferences?.theme ?? "system"}
                onValueChange={(value) =>
                  updatePreferences.mutate({
                    theme: value as "light" | "dark" | "system",
                  })
                }
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="system">System</SelectItem>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <Label>Accessibility</Label>
                <p className="text-sm text-muted-foreground">
                  Accessibility mode for the app
                </p>
              </div>
              <Select
                value={profile.preferences?.accessibilityMode ?? "default"}
                onValueChange={(value) =>
                  updatePreferences.mutate({
                    accessibilityMode: value as
                      | "default"
                      | "mobility"
                      | "vision"
                      | "hearing",
                  })
                }
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Default</SelectItem>
                  <SelectItem value="mobility">Mobility</SelectItem>
                  <SelectItem value="vision">Vision</SelectItem>
                  <SelectItem value="hearing">Hearing</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <Label htmlFor="audio-autoplay">Audio autoplay</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically play audio in tours
                </p>
              </div>
              <Checkbox
                id="audio-autoplay"
                checked={profile.preferences?.audioAutoplay ?? true}
                onCheckedChange={(checked: boolean | "indeterminate") =>
                  updatePreferences.mutate({
                    audioAutoplay: checked === true,
                  })
                }
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="text-destructive">Sign out</CardTitle>
            <CardDescription>
              Sign out of your account on this device
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="destructive"
              onClick={() => signOut.mutate()}
              disabled={signOut.isPending}
            >
              {signOut.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
