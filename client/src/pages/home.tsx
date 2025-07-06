import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Lightbulb, Users, Bot, UserPlus, Play } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

import { CharacterCard } from "@/components/character-card";
import { CHARACTERS } from "@/lib/characters";
import {
  createBrainstormSchema,
  type CreateBrainstormRequest,
} from "@shared/schema";

export default function Home() {
  const [selectedCharacters, setSelectedCharacters] = useState<string[]>([]);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const form = useForm<CreateBrainstormRequest>({
    resolver: zodResolver(createBrainstormSchema),
    defaultValues: {
      topic: "",
      selectedCharacters: [],
      aiAssistant: false,
      userParticipation: false,
      userName: "",
      userRole: "",
    },
  });

  const createBrainstormMutation = useMutation({
    mutationFn: async (data: CreateBrainstormRequest) => {
      const response = await apiRequest("POST", "/api/brainstorm", data);
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        setLocation(`/brainstorm/${data.sessionId}/streaming`);
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to create brainstorm session",
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create brainstorm session",
        variant: "destructive",
      });
    },
  });

  const handleCharacterSelect = (characterId: string) => {
    const newSelection = selectedCharacters.includes(characterId)
      ? selectedCharacters.filter((id) => id !== characterId)
      : selectedCharacters.length < 4
        ? [...selectedCharacters, characterId]
        : selectedCharacters;

    setSelectedCharacters(newSelection);
    form.setValue("selectedCharacters", newSelection);
  };

  const onSubmit = (data: CreateBrainstormRequest) => {
    createBrainstormMutation.mutate(data);
  };

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <Card className="shadow-lg">
        <CardContent className="p-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-office-title text-office-black mb-3">
              - THE OFFICE Brainstorm Simulator -
            </h2>
            <h3 className="text-4xl font-office-title text-office-black mb-3">
              Can AI come to their rescue?
            </h3>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              {/* Topic Input */}
              <FormField
                control={form.control}
                name="topic"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-lg font-semibold text-office-black flex items-center font-office-body">
                      <Lightbulb className="mr-2 h-5 w-5 text-office-orange" />
                      Brainstorm Topic
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Aliens are visiting Earth for the first time. You must design a 3-item welcome kit that explains life on Earth."
                        className="text-lg py-3 border-2 border-office-gray-light focus:border-office-orange font-office-body"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription className="font-office-body text-office-gray">
                      Enter the topic you'd like to brainstorm about
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Character Selection */}
              <div>
                <FormLabel className="text-lg font-semibold text-office-black flex items-center mb-3 font-office-body">
                  <Users className="mr-2 h-5 w-5 text-office-orange" />
                  Select Characters (Choose up to 4)
                </FormLabel>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {CHARACTERS.map((character) => (
                    <CharacterCard
                      key={character.id}
                      character={character}
                      isSelected={selectedCharacters.includes(character.id)}
                      onSelect={handleCharacterSelect}
                      disabled={
                        !selectedCharacters.includes(character.id) &&
                        selectedCharacters.length >= 4
                      }
                    />
                  ))}
                </div>
                <p className="text-sm text-office-gray mt-3 font-office-body">
                  Select your brainstorming team members (maximum 4 characters)
                </p>
                <div className="text-sm font-medium text-office-orange mt-2 font-office-body">
                  {selectedCharacters.length} of 4 characters selected
                </div>
                {form.formState.errors.selectedCharacters && (
                  <p className="text-sm text-red-500 mt-1">
                    {form.formState.errors.selectedCharacters.message}
                  </p>
                )}
              </div>

              {/* Options */}
              <div className="space-y-6">
                {/* AI Assistant Toggle */}
                <div className="bg-office-beige rounded-lg p-6">
                  <FormField
                    control={form.control}
                    name="aiAssistant"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <FormLabel className="font-semibold text-office-black flex items-center font-office-body">
                            <Bot className="mr-2 h-5 w-5 text-office-orange" />
                            AI Assistant
                          </FormLabel>
                          <FormDescription className="font-office-body text-office-gray">
                            Include an AI facilitator in the brainstorm
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={Boolean(field.value)}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                {/* User Participation Toggle */}
                <div className="bg-office-beige rounded-lg p-6">
                  <FormField
                    control={form.control}
                    name="userParticipation"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <FormLabel className="font-semibold text-office-black flex items-center font-office-body">
                            <UserPlus className="mr-2 h-5 w-5 text-office-orange" />
                            Your Participation
                          </FormLabel>
                          <FormDescription className="font-office-body text-office-gray">
                            Join the brainstorm as yourself
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={Boolean(field.value)}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  {/* User Details (when participation is enabled) */}
                  {form.watch("userParticipation") && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 pt-4 border-t border-office-gray-light">
                      <FormField
                        control={form.control}
                        name="userName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="font-semibold text-office-black font-office-body">
                              Your Name
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Enter your name"
                                {...field}
                                className="font-office-body"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="userRole"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="font-semibold text-office-black font-office-body">
                              Your Role
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="e.g., Product Manager, Developer"
                                {...field}
                                className="font-office-body"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Start Button */}
              <div className="text-center pt-4">
                <Button
                  type="submit"
                  disabled={createBrainstormMutation.isPending}
                  className="btn-office-primary py-4 px-8 text-xl shadow-lg hover:shadow-xl"
                >
                  {createBrainstormMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3" />
                      Starting Session...
                    </>
                  ) : (
                    <>
                      <Play className="mr-3 h-5 w-5" />
                      Start the simulation
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </main>
  );
}
