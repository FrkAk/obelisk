"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useRemarkStore, type WizardStep } from "@/stores/remark-store";
import { trpc } from "@/lib/trpc/client";
import { useToast } from "@/hooks/use-toast";
import { StepBasicInfo } from "./step-basic-info";
import { StepMapStops } from "./step-map-stops";
import { StepStopDetails } from "./step-stop-details";
import { StepReview } from "./step-review";

const STEPS: { id: WizardStep; label: string }[] = [
  { id: "basic-info", label: "Basic Info" },
  { id: "map-stops", label: "Add Stops" },
  { id: "stop-details", label: "Stop Details" },
  { id: "review", label: "Review" },
];

export function CreateWizard() {
  const router = useRouter();
  const { toast } = useToast();

  const {
    currentStep,
    setCurrentStep,
    formData,
    stops,
    remarkId,
    setRemarkId,
    reset,
    isDirty,
  } = useRemarkStore();

  const createMutation = trpc.remark.create.useMutation();
  const updateMutation = trpc.remark.update.useMutation();

  const currentStepIndex = STEPS.findIndex((s) => s.id === currentStep);
  const progress = ((currentStepIndex + 1) / STEPS.length) * 100;

  const canGoNext = () => {
    switch (currentStep) {
      case "basic-info":
        return formData.title.trim().length > 0;
      case "map-stops":
        return stops.length >= 1;
      case "stop-details":
        return stops.every((s) => s.title.trim().length > 0);
      case "review":
        return true;
      default:
        return false;
    }
  };

  const handleNext = async () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < STEPS.length) {
      setCurrentStep(STEPS[nextIndex].id);
    }
  };

  const handleBack = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(STEPS[prevIndex].id);
    }
  };

  const handlePublish = async () => {
    try {
      let id = remarkId;

      if (!id) {
        const result = await createMutation.mutateAsync({
          title: formData.title,
          description: formData.description,
          coverImageUrl: formData.coverImageUrl || undefined,
          centerLongitude: formData.centerLongitude,
          centerLatitude: formData.centerLatitude,
          categories: formData.categories.length > 0 ? formData.categories : undefined,
        });
        id = result.id;
        setRemarkId(id);
      }

      await updateMutation.mutateAsync({
        id,
        status: "published",
      });

      toast({
        title: "Remark published!",
        description: "Your remark is now live and visible to others.",
      });

      reset();
      router.push(`/remarks`);
    } catch {
      toast({
        title: "Error",
        description: "Failed to publish remark. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSaveDraft = async () => {
    try {
      if (!remarkId) {
        const result = await createMutation.mutateAsync({
          title: formData.title || "Untitled Remark",
          description: formData.description,
          coverImageUrl: formData.coverImageUrl || undefined,
          centerLongitude: formData.centerLongitude,
          centerLatitude: formData.centerLatitude,
          categories: formData.categories.length > 0 ? formData.categories : undefined,
        });
        setRemarkId(result.id);
      } else {
        await updateMutation.mutateAsync({
          id: remarkId,
          title: formData.title,
          description: formData.description,
          coverImageUrl: formData.coverImageUrl || undefined,
          centerLongitude: formData.centerLongitude,
          centerLatitude: formData.centerLatitude,
          categories: formData.categories.length > 0 ? formData.categories : undefined,
        });
      }

      toast({
        title: "Draft saved",
        description: "Your changes have been saved.",
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to save draft. Please try again.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  return (
    <div className="flex h-full flex-col">
      <div className="border-b p-4">
        <div className="mx-auto max-w-3xl">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold">Create Remark</h1>
              <p className="text-sm text-muted-foreground">
                Step {currentStepIndex + 1} of {STEPS.length}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={handleSaveDraft}>
              Save Draft
            </Button>
          </div>
          <Progress value={progress} className="h-1" />
          <div className="mt-3 flex justify-between text-xs">
            {STEPS.map((step, index) => (
              <div
                key={step.id}
                className={`flex items-center gap-1.5 transition-colors duration-200 ${
                  index <= currentStepIndex
                    ? "text-primary font-medium"
                    : "text-muted-foreground"
                }`}
              >
                <span
                  className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-semibold transition-all duration-200 ${
                    index < currentStepIndex
                      ? "bg-primary text-primary-foreground"
                      : index === currentStepIndex
                        ? "bg-primary text-primary-foreground ring-2 ring-primary/30"
                        : "bg-muted text-muted-foreground"
                  }`}
                >
                  {index < currentStepIndex ? "✓" : index + 1}
                </span>
                <span className="hidden sm:inline">{step.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {currentStep === "basic-info" && <StepBasicInfo />}
        {currentStep === "map-stops" && <StepMapStops />}
        {currentStep === "stop-details" && <StepStopDetails />}
        {currentStep === "review" && <StepReview />}
      </div>

      <div className="border-t p-4">
        <div className="mx-auto flex max-w-3xl justify-between">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStepIndex === 0}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>

          {currentStep === "review" ? (
            <Button
              onClick={handlePublish}
              disabled={!canGoNext() || createMutation.isPending || updateMutation.isPending}
            >
              <Check className="mr-2 h-4 w-4" />
              Publish
            </Button>
          ) : (
            <Button onClick={handleNext} disabled={!canGoNext()}>
              Next
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
