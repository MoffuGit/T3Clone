"use client";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import {
  type FieldError,
  useForm,
  type UseFormRegister,
} from "react-hook-form";
import { useAPIKeyStore } from "~/stores/userKeys";
import { KeyRound } from "lucide-react";
import z from "zod";
import { PROVIDERS_MODELS, type Provider } from "~/lib/llmProviders";
import { toast } from "sonner";

const APIFromSchema = z.object({
  google: z.string().trim().min(1, {
    message: "Google API key is required for Title Generation",
  }),
  openrouter: z.string().trim().optional(),
  openai: z.string().trim().optional(),
});

type FormValues = z.infer<typeof APIFromSchema>;

export function UserKeysModal() {
  const { keys, setKeys } = useAPIKeyStore();
  const [open, setOpen] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
  } = useForm<FormValues>({
    resolver: zodResolver(APIFromSchema),
    defaultValues: keys,
  });

  useEffect(() => {
    reset(keys);
  }, [keys, reset]);

  const onSubmit = useCallback(
    (values: FormValues) => {
      setKeys(values);
      toast.success("API keys saved successfully");
    },
    [setKeys],
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger>
          <DialogTrigger asChild>
            <div className="hover:bg-accent rounded-md p-1.5">
              <KeyRound className="h-4 w-4" />
            </div>
          </DialogTrigger>
        </TooltipTrigger>
        <TooltipContent>Keys</TooltipContent>
      </Tooltip>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>API Keys</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col space-y-4"
        >
          <APIKeyField
            provider="google"
            label="Google API key"
            models={PROVIDERS_MODELS["GOOGLE"]}
            register={register}
            error={errors.google}
          />
          <APIKeyField
            provider="openai"
            label="OpenAi API key"
            models={PROVIDERS_MODELS["OPENAI"]}
            register={register}
            error={errors.openai}
          />
          <APIKeyField
            provider="openrouter"
            label="OpenRouter API key"
            models={PROVIDERS_MODELS["OPENROUTER"]}
            register={register}
            error={errors.openrouter}
          />
          <Button type="submit" className="w-full" disabled={!isDirty}>
            Save API Keys
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface APIKeyFieldProps {
  provider: Provider;
  label: string;
  models: string[];
  error?: FieldError | undefined;
  register: UseFormRegister<FormValues>;
}

function APIKeyField({
  provider,
  label,
  models,
  register,
  error,
}: APIKeyFieldProps) {
  return (
    <div className="justify-center-center flex flex-col">
      <label htmlFor={provider} className="space-y-1 pl-0.5 text-base">
        <span>{label}</span>
      </label>
      <div className="text-accent-foreground mb-0.5 flex space-x-0.5 pl-0.5 text-xs">
        {models.map((model) => {
          return <span key={model}>{model}</span>;
        })}
      </div>
      <Input
        id={provider}
        placeholder="Enter your key"
        {...register(provider as keyof FormValues)}
        className=""
      />
      {error && <span className="text-sm text-red-500">{error.message}</span>}
    </div>
  );
}
