import { cn } from "@/lib/utils";
import { ArrowRight } from "lucide-react";

interface WorkflowStepsProps {
  currentStep: number;
}

const steps = [
  { number: 1, label: "Upload" },
  { number: 2, label: "Select Genre" },
  { number: 3, label: "Transform" },
  { number: 4, label: "Download" },
];

export default function WorkflowSteps({ currentStep }: WorkflowStepsProps) {
  return (
    <div className="flex flex-wrap justify-center mb-8">
      {steps.map((step, index) => (
        <div key={step.number} className="flex items-center mb-4 sm:mb-0">
          <div
            className={cn(
              "rounded-full w-8 h-8 flex items-center justify-center",
              currentStep >= step.number
                ? "bg-primary text-white"
                : "bg-gray-300 text-gray-700"
            )}
          >
            {step.number}
          </div>
          <span
            className={cn(
              "ml-2 mr-4",
              currentStep >= step.number ? "" : "text-gray-500"
            )}
          >
            {step.label}
          </span>
          {index < steps.length - 1 && (
            <ArrowRight className="text-gray-400 mx-2 hidden sm:block" size={16} />
          )}
        </div>
      ))}
    </div>
  );
}
